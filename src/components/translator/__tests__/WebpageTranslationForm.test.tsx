import * as React from 'react';
import { MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { cleanup, render, screen } from '@testing-library/react';
import { Router } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import WebpageTranslationForm, { Props } from '../WebpageTranslationForm';

const renderWebpageTranslationForm = (props_: Partial<Props> = {}, historyOptions?: MemoryHistoryBuildOptions) => {
  const history = createMemoryHistory(historyOptions);

  const props = {
    srcLang: 'eng',
    tgtLang: 'spa',
    cancelUrl: '',
    setLoading: jest.fn(),
    ...props_,
  };

  render(
    <Router history={history}>
      <WebpageTranslationForm {...props} />
    </Router>,
  );

  return props;
};

const getInputTextbox = (): HTMLTextAreaElement => screen.getByRole('textbox') as HTMLTextAreaElement;

const input = 'https://example.com';

describe('inital source url', () => {
  it('restores from browser state', () => {
    renderWebpageTranslationForm();

    userEvent.type(getInputTextbox(), input);

    cleanup();

    renderWebpageTranslationForm();
    expect(getInputTextbox().value).toBe(input);
  });

  it('prefers URL over browser storage', () => {
    renderWebpageTranslationForm();

    userEvent.type(getInputTextbox(), input);

    cleanup();

    renderWebpageTranslationForm({}, { initialEntries: ['?qW=https://example.net'] });
    expect(getInputTextbox().value).toBe('https://example.net');
  });

  it('falls back to empty text', () => {
    renderWebpageTranslationForm();
    expect(getInputTextbox().value).toBe('');
  });
});
