import * as React from 'react';
import { MemoryHistory, MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { cleanup, render, screen } from '@testing-library/react';
import { Router } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import TextTranslationForm, { Props } from '../TextTranslationForm';

const renderTextTranslationForm = (
  props_: Partial<Props> = {},
  historyOptions?: MemoryHistoryBuildOptions,
): [Props, MemoryHistory] => {
  const history = createMemoryHistory(historyOptions);

  const props = {
    markUnknown: false,
    instantTranslation: false,
    srcLang: 'eng',
    tgtLang: 'spa',
    pairPrefs: {},
    setLoading: jest.fn(),
    ...props_,
  };

  render(
    <Router history={history}>
      <TextTranslationForm {...props} />
    </Router>,
  );

  return [props, history];
};

const input = 'hello';

const getInputTextbox = (): HTMLTextAreaElement =>
  screen.getByRole('textbox', { name: 'Input_Text-Default' }) as HTMLTextAreaElement;

describe('inital source text', () => {
  it('restores from browser state', () => {
    renderTextTranslationForm();

    userEvent.type(getInputTextbox(), input);

    cleanup();

    renderTextTranslationForm();
    expect(getInputTextbox().value).toBe(input);
  });

  it('prefers URL over browser storage', () => {
    renderTextTranslationForm();

    userEvent.type(getInputTextbox(), input);

    cleanup();

    renderTextTranslationForm({}, { initialEntries: ['?q=goodbye'] });
    expect(getInputTextbox().value).toBe('goodbye');
  });

  it('falls back to empty text', () => {
    renderTextTranslationForm();
    expect(getInputTextbox().value).toBe('');
  });
});

it('discards long source text for URL state', () => {
  const [, history] = renderTextTranslationForm();

  const input = 'foobar'.repeat(500);
  userEvent.paste(getInputTextbox(), input);

  expect(history.location.search).toBe(`?dir=eng-spa`);
});

it('clears text on button click', () => {
  renderTextTranslationForm();
  const textbox = getInputTextbox();

  const button = screen.getAllByRole('button').find(({ classList }) => classList.contains('clear-text-button'));
  expect(button).toBeDefined();

  userEvent.type(textbox, input);
  userEvent.click(button as HTMLButtonElement);

  expect(textbox.value).toBe('');
  expect(document.activeElement).toBe(textbox);
});

it('copies text on button click', () => {
  const execCommand = jest.fn();
  document.execCommand = execCommand;

  renderTextTranslationForm();

  const button = screen.getAllByRole('button').find(({ classList }) => classList.contains('copy-text-button'));
  expect(button).toBeDefined();

  userEvent.type(getInputTextbox(), input);
  userEvent.click(button as HTMLButtonElement);

  expect(execCommand).toBeCalledWith('copy');
});
