import * as React from 'react';
import { MemoryHistory, MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { cleanup, render, screen } from '@testing-library/react';
import { Router } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import WebpageTranslationForm, { Props } from '../WebpageTranslationForm';

const renderWebpageTranslationForm = (
  props_: Partial<Props> = {},
  historyOptions?: MemoryHistoryBuildOptions,
): [Props, MemoryHistory] => {
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

  return [props, history];
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

it('discards long source url for URL state', () => {
  const [, history] = renderWebpageTranslationForm();

  const input = 'foobar'.repeat(500);
  userEvent.paste(getInputTextbox(), input);

  expect(history.location.search).toBe(`?dir=eng-spa`);
});
