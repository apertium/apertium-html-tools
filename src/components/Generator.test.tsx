import * as React from 'react';
import { MemoryHistory, MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import mockAxios from 'jest-mock-axios';
import userEvent from '@testing-library/user-event';

import Generator from './Generator';

const input = 'foobar';

const renderGenerator = (options?: MemoryHistoryBuildOptions): MemoryHistory => {
  const history = createMemoryHistory(options);

  render(
    <Router history={history}>
      <Generator />
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
  renderGenerator();

  const selector = screen.getByRole('combobox');
  userEvent.selectOptions(selector, screen.getByRole('option', { name: 'English-Default' }));

  expect((selector as HTMLSelectElement).value).toBe('eng');
});

it('allows typing an input', () => {
  renderGenerator();

  const textbox = type(input);
  expect(textbox.value).toBe(input);
});

describe('URL state management', () => {
  it('persists language and input', () => {
    const history = renderGenerator();

    type(input);

    expect(history.location.search).toBe(`?gLang=eng&gQ=${input}`);
  });

  it('restores language and input', () => {
    renderGenerator({ initialEntries: [`/?gLang=spa&gQ=${input}`] });

    type(input);

    const selector = screen.getByRole('combobox');
    expect((selector as HTMLSelectElement).value).toBe('spa');
  });

  it('restores iso-639-1 language', () => {
    renderGenerator({ initialEntries: [`/?gLang=es`] });

    const selector = screen.getByRole('combobox');
    expect((selector as HTMLSelectElement).value).toBe('spa');
  });

  it('discards invalid language', () => {
    renderGenerator({ initialEntries: [`/?gLang=foo`] });

    const selector = screen.getByRole('combobox');
    expect((selector as HTMLSelectElement).value).toBe('eng');
  });

  it('discards long input', () => {
    const history = renderGenerator();

    const input = 'foobar'.repeat(500);

    const textbox = screen.getByRole('textbox') as HTMLTextAreaElement;
    userEvent.paste(textbox, input);

    expect(history.location.search).toBe(`?gLang=eng`);
  });
});

describe('browser storage management', () => {
  it('persists language and input', () => {
    renderGenerator();
    type(input);
    cleanup();

    renderGenerator();

    const textbox = screen.getByRole('textbox');
    expect((textbox as HTMLSelectElement).value).toBe(input);
  });

  it('prefers URL parameters', () => {
    renderGenerator();
    type('qux');
    cleanup();

    renderGenerator({ initialEntries: [`/?gLang=spa&gQ=${input}`] });

    const textbox = screen.getByRole('textbox');
    expect((textbox as HTMLSelectElement).value).toBe(input);

    const selector = screen.getByRole('combobox');
    expect((selector as HTMLSelectElement).value).toBe('spa');
  });
});

describe('generation', () => {
  it('no-ops an empty input', () => {
    renderGenerator();
    submit();
    expect(mockAxios.post).not.toBeCalled();
  });

  it('shows errors', async () => {
    renderGenerator();
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
    renderGenerator();
    type(input);

    submit();
    submit();

    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(2));
    expect(mockAxios.queue()).toHaveLength(1);
  });

  it('generates on button click', async () => {
    renderGenerator();

    const input = '^kick<vblex><pp>$';
    type(input);

    submit();

    mockAxios.mockResponse({ data: [['kicked/kick<vblex><pp>/kick<vblex><past>', 'kicked']] });
    await waitFor(() =>
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/generate'),
        'lang=eng&q=%5Ekick%3Cvblex%3E%3Cpp%3E%24',
        expect.anything(),
      ),
    );

    const output = screen.getByRole('region');
    expect(output.textContent).toBe('kicked  ↬  kicked/kick<vblex><pp>/kick<vblex><past>');
  });

  it('generates on enter', async () => {
    renderGenerator();

    type('^kick<vblex><pp>${enter}');

    mockAxios.mockResponse({ data: [['kicked/kick<vblex><pp>/kick<vblex><past>', 'kicked']] });
    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(1));

    const output = screen.getByRole('region');
    expect(output.textContent).toBe('kicked  ↬  kicked/kick<vblex><pp>/kick<vblex><past>');
  });

  it('does not generate on shift+enter', () => {
    renderGenerator();

    type('^kick<vblex><pp>${shift}{enter}');

    expect(mockAxios.post).not.toBeCalled();
  });
});
