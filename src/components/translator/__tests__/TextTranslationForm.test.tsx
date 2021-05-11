import * as React from 'react';
import { MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { cleanup, render, screen } from '@testing-library/react';
import { Router } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import TextTranslationForm, { Props } from '../TextTranslationForm';

const renderTextTranslationForm = (props_: Partial<Props> = {}, historyOptions?: MemoryHistoryBuildOptions) => {
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

  return props;
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
