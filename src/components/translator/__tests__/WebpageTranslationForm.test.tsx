import * as React from 'react';
import { MemoryHistory, MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import mockAxios from 'jest-mock-axios';
import userEvent from '@testing-library/user-event';

import WebpageTranslationForm, { Props } from '../WebpageTranslationForm';
import { TranslateEvent } from '..';

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

const type = (input: string) => userEvent.type(getInputTextbox(), input);
const translate = () => window.dispatchEvent(new Event(TranslateEvent));

const input = 'https://example.com';

describe('inital source url', () => {
  it('restores from browser state', () => {
    renderWebpageTranslationForm();

    type(input);

    cleanup();

    renderWebpageTranslationForm();
    expect(getInputTextbox().value).toBe(input);
  });

  it('prefers URL over browser storage', () => {
    renderWebpageTranslationForm();

    type(input);

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

describe('translation', () => {
  it('errors on invalid url', () => {
    renderWebpageTranslationForm();

    type('f');
    act(() => void translate());

    expect(screen.getByRole('alert').textContent).toMatchInlineSnapshot(`"Not_Available-Default"`);
  });

  it('errors on invalid protocol', () => {
    renderWebpageTranslationForm();

    type('ftp://apertium.org');
    act(() => void translate());

    expect(screen.getByRole('alert').textContent).toMatchInlineSnapshot(`"Not_Available-Default"`);
  });

  it('handles translation errors', async () => {
    renderWebpageTranslationForm();

    type(input);
    translate();

    mockAxios.mockError({
      response: {
        data: {
          status: 'error',
          code: 404,
          message: 'Not Found',
          explanation: 'Error 404 on fetching url: [Errno -5] No address associated with hostname',
        },
      },
    });
    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(1));

    expect(screen.getByRole('alert').textContent).toMatchInlineSnapshot(`"Not_Available-Default"`);
  });

  it('translates on event', async () => {
    renderWebpageTranslationForm();

    type(input);
    translate();

    mockAxios.mockResponse({
      data: {
        responseData: {
          translatedText: `<!DOCTYPE html>
          <html>
          <head>
              <title>Ámbito de ejemplo</title>
          </head>
          <body>
              <h1>Ámbito de ejemplo</h1>
              <p>Este ámbito es para uso en ejemplos ilustrativos en documentos.</p>
          </body>
          </html>
          `,
        },
        responseDetails: null,
        responseStatus: 200,
      },
    });
    await waitFor(() =>
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('translatePage'),
        expect.stringContaining(
          `langpair=${encodeURIComponent(`eng|spa`)}&markUnknown=no&url=${encodeURIComponent(input)}`,
        ),
        expect.anything(),
      ),
    );

    expect(
      (screen.getByRole('main') as HTMLIFrameElement).contentWindow?.document
        .querySelector('body')
        ?.textContent?.trim(),
    ).toMatchInlineSnapshot(`
      "Ámbito de ejemplo
                    Este ámbito es para uso en ejemplos ilustrativos en documentos."
    `);
  });

  it('intercepts translated page links', async () => {
    const [, history] = renderWebpageTranslationForm();

    type(input);
    translate();

    mockAxios.mockResponse({
      data: {
        responseData: {
          translatedText: `<!DOCTYPE html>
          <html>
          <head>
              <title>Ámbito de ejemplo</title>
          </head>
          <body>
              <p><a href="https://www.iana.org/domains/example">Más información...</a></p>
          </body>
          </html>
          `,
        },
        responseDetails: null,
        responseStatus: 200,
      },
    });
    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(1));

    userEvent.click(
      (screen.getByRole('main') as HTMLIFrameElement).contentWindow?.document.querySelector('a') as HTMLAnchorElement,
    );

    expect(history.location.search).toMatchInlineSnapshot(
      `"?dir=eng-spa&qW=https%3A%2F%2Fwww.iana.org%2Fdomains%2Fexample"`,
    );
  });

  it('cancels pending requests', async () => {
    renderWebpageTranslationForm();

    type(input);
    translate();
    translate();

    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(2));
    expect(mockAxios.queue()).toHaveLength(1);
  });
});
