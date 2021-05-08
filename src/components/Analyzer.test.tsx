import * as React from 'react';
import { MemoryHistory, MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import mockAxios from 'jest-mock-axios';
import userEvent from '@testing-library/user-event';

import Analyzer from './Analyzer';

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
    expect(error.textContent).toContain('That mode is not installed');
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
