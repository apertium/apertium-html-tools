import * as React from 'react';
import { MemoryHistory, MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { render, screen } from '@testing-library/react';
import { Router } from 'react-router-dom';
import mockAxios from 'jest-mock-axios';
import userEvent from '@testing-library/user-event';

import SpellChecker from '../SpellChecker';

const input = 'hello';

const renderSpellChecker = (options?: MemoryHistoryBuildOptions): MemoryHistory => {
  const history = createMemoryHistory(options);

  render(
    <Router history={history}>
      <SpellChecker />
    </Router>,
  );

  return history;
};

const type = (input: string): HTMLDivElement => {
  const divbox = screen.getByRole('textbox');
  divbox.innerText = input;
  return divbox as HTMLDivElement;
};

const submit = () => userEvent.click(screen.getByRole('button'));

it('allows selecting a language', () => {
  renderSpellChecker();

  const selector = screen.getByRole('combobox');
  userEvent.selectOptions(selector, screen.getByRole('option', { name: 'қазақша' }));

  expect((selector as HTMLSelectElement).value).toBe('kaz');
});

it('allows typing an input', () => {
  renderSpellChecker();

  const textbox = type(input);
  expect(textbox.innerText).toBe(input);
});

describe('URL state management', () => {
  it('persists language and input', () => {
    const history = renderSpellChecker({ initialEntries: [`/?q=${input}`] });
    expect(history.location.search).toBe(`?lang=kaz&q=${input}`);
  });

  it('discards invalid language', () => {
    renderSpellChecker({ initialEntries: [`/?lang=kaza`] });

    const selector = screen.getByRole('combobox');
    expect((selector as HTMLSelectElement).value).toBe('kaz');
  });

  it('discards long input', () => {
    const longInput = 'foobar'.repeat(500);
    const history = renderSpellChecker({ initialEntries: [`/?lang=kaz&q=${longInput}`] });

    expect(history.location.search).toBe(`?lang=kaz`);
  });
});

describe('analysis', () => {
  it('no-ops an empty input', () => {
    renderSpellChecker();
    submit();
    expect(mockAxios.post).not.toBeCalled();
  });
});
