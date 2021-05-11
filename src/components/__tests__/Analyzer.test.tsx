import * as React from 'react';
import { MemoryHistory, MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { cleanup, getAllByRole, render, screen, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import mockAxios from 'jest-mock-axios';
import userEvent from '@testing-library/user-event';

import Analyzer from '../Analyzer';

const input = 'kick';

const renderAnalyzer = (options?: MemoryHistoryBuildOptions): MemoryHistory => {
  const history = createMemoryHistory(options);

  render(
    <Router history={history}>
      <Analyzer />
    </Router>,
  );

  return history;
};

const type = (input: string): HTMLTextAreaElement => {
  const textbox = screen.getByRole('textbox');
  userEvent.type(textbox, input);
  return textbox as HTMLTextAreaElement;
};

const submit = () => userEvent.click(screen.getByRole('button'));

it('allows selecting a language', () => {
  renderAnalyzer();

  const selector = screen.getByRole('combobox');
  userEvent.selectOptions(selector, screen.getByRole('option', { name: 'English-Default' }));

  expect((selector as HTMLSelectElement).value).toBe('eng');
});

it('allows typing an input', () => {
  renderAnalyzer();

  const textbox = type(input);
  expect(textbox.value).toBe(input);
});

describe('URL state management', () => {
  it('persists language and input', () => {
    const history = renderAnalyzer();

    type(input);

    expect(history.location.search).toBe(`?aLang=eng&aQ=${input}`);
  });

  it('restores language and input', () => {
    renderAnalyzer({ initialEntries: [`/?aLang=spa&aQ=${input}`] });

    const textbox = screen.getByRole('textbox');
    expect((textbox as HTMLSelectElement).value).toBe(input);

    const selector = screen.getByRole('combobox');
    expect((selector as HTMLSelectElement).value).toBe('spa');
  });

  it('restores iso-639-1 language', () => {
    renderAnalyzer({ initialEntries: [`/?aLang=es`] });

    const selector = screen.getByRole('combobox');
    expect((selector as HTMLSelectElement).value).toBe('spa');
  });

  it('discards invalid language', () => {
    renderAnalyzer({ initialEntries: [`/?aLang=foo`] });

    const selector = screen.getByRole('combobox');
    expect((selector as HTMLSelectElement).value).toBe('eng');
  });

  it('discards long input', () => {
    const history = renderAnalyzer();

    const input = 'foobar'.repeat(500);

    const textbox = screen.getByRole('textbox') as HTMLTextAreaElement;
    userEvent.paste(textbox, input);

    expect(history.location.search).toBe(`?aLang=eng`);
  });
});

describe('browser storage management', () => {
  it('persists language and input', () => {
    renderAnalyzer();
    type(input);
    cleanup();

    renderAnalyzer();

    const textbox = screen.getByRole('textbox');
    expect((textbox as HTMLSelectElement).value).toBe(input);
  });

  it('prefers URL parameters', () => {
    renderAnalyzer();
    type('qux');
    cleanup();

    renderAnalyzer({ initialEntries: [`/?aLang=spa&aQ=${input}`] });

    const textbox = screen.getByRole('textbox');
    expect((textbox as HTMLSelectElement).value).toBe(input);

    const selector = screen.getByRole('combobox');
    expect((selector as HTMLSelectElement).value).toBe('spa');
  });
});

describe('analysis', () => {
  it('no-ops an empty input', () => {
    renderAnalyzer();
    submit();
    expect(mockAxios.post).not.toBeCalled();
  });

  it('shows errors', async () => {
    renderAnalyzer();
    type(input);
    submit();

    mockAxios.mockError({
      response: {
        data: { status: 'error', code: 400, message: 'Bad Request', explanation: 'That mode is not installed' },
      },
    });
    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(1));

    const error = screen.getByRole('alert');
    expect(error.textContent).toMatchInlineSnapshot(`" That mode is not installed"`);
  });

  it('analyzes on button click', async () => {
    renderAnalyzer();
    type('The quick brown fox jumps over the lazy dog.');

    submit();

    mockAxios.mockResponse({
      data: [
        ['The/the<det><def><sp>', 'The '],
        ['quick/quick<adv>/quick<adj><sint>', 'quick '],
        ['brown/brown<n><sg>/brown<adj><sint>', 'brown '],
        ['fox/fox<n><sg>', 'fox '],
        ['jumps over/jump<vblex><pres><p3><sg># over', 'jumps over '],
        ['the/the<det><def><sp>', 'the '],
        ['lazy/lazy<adj><sint>', 'lazy '],
        ['dog/dog<n><sg>', 'dog'],
        ['../..<sent>', '..'],
      ],
    });
    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(1));

    const table = screen.getByRole('table');

    const rows = getAllByRole(table, 'row');
    expect(rows).toHaveLength(9);

    const firstRow = rows[0];
    const cells = getAllByRole(firstRow, 'cell');
    expect(cells).toHaveLength(2);

    expect(cells[0].textContent).toMatchInlineSnapshot(`"The  ↬"`);
    expect(cells[1].textContent).toMatchInlineSnapshot(`"the  ↤  det ⋅ def ⋅ sp"`);
  });

  it('analyzes on enter', async () => {
    renderAnalyzer();
    type(`${input}{enter}`);

    mockAxios.mockResponse({
      data: [['kick/kick<n><sg>/kick<vblex><inf>/kick<vblex><pres>/kick<vblex><imp>', 'kick']],
    });
    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(1));

    const table = screen.getByRole('table');

    const rows = getAllByRole(table, 'row');
    expect(rows).toHaveLength(1);
  });

  it('cancels pending requests', async () => {
    renderAnalyzer();
    type(input);

    submit();
    submit();

    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(2));
    expect(mockAxios.queue()).toHaveLength(1);
  });
});
