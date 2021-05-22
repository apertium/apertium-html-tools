import * as React from 'react';
import { MemoryHistory, MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import mockAxios from 'jest-mock-axios';
import userEvent from '@testing-library/user-event';

import { DetectCompleteEvent, DetectEvent, TranslateEvent } from '..';
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
const output = 'hola';

const getInputTextbox = (): HTMLTextAreaElement =>
  screen.getByRole('textbox', { name: 'Input_Text-Default' }) as HTMLTextAreaElement;

const getOutputTextbox = (): HTMLTextAreaElement =>
  screen.getAllByRole('textbox').find((e) => (e as HTMLTextAreaElement).readOnly) as HTMLTextAreaElement;

const type = (input: string) => userEvent.type(getInputTextbox(), input);

describe('inital source text', () => {
  it('restores from browser state', () => {
    renderTextTranslationForm();

    type(input);

    cleanup();

    renderTextTranslationForm();
    expect(getInputTextbox().value).toBe(input);
  });

  it('prefers URL over browser storage', () => {
    renderTextTranslationForm();

    type(input);

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

  type(input);
  userEvent.click(button as HTMLButtonElement);

  expect(execCommand).toBeCalledWith('copy');
});

it('switches to webpage translation when url typed', () => {
  const [, history] = renderTextTranslationForm();

  type('https://example.com');

  expect(history.location.pathname).toBe('/webpageTranslation');
});

describe('translation', () => {
  const translate = () => window.dispatchEvent(new Event(TranslateEvent));

  const response = {
    data: { responseData: { translatedText: output } },
  };

  it('does not translate empty source text', () => {
    renderTextTranslationForm();
    expect(mockAxios.post).toHaveBeenCalledTimes(0);
  });

  it('translates if source text present on render', async () => {
    renderTextTranslationForm({}, { initialEntries: ['?q=hello'] });

    mockAxios.mockResponse(response);
    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(1));

    expect(getOutputTextbox().value).toBe(output);
  });

  it('translates on language change', async () => {
    const history = createMemoryHistory();

    const props = {
      markUnknown: false,
      instantTranslation: false,
      srcLang: 'eng',
      tgtLang: 'spa',
      pairPrefs: {},
      setLoading: jest.fn(),
    };

    const Container = () => {
      const [srcLang, setSrcLang] = React.useState('eng');
      return (
        <>
          <button onClick={() => setSrcLang('cat')}>ChangeSrcLang</button>
          <Router history={history}>
            <TextTranslationForm {...props} srcLang={srcLang} />
          </Router>
        </>
      );
    };

    render(<Container />);
    type(input);

    userEvent.click(screen.getByRole('button', { name: 'ChangeSrcLang' }));

    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(1));
  });

  it('translates on event', async () => {
    renderTextTranslationForm();

    type(input);
    translate();

    mockAxios.mockResponse(response);
    await waitFor(() =>
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('translate'),
        encodeURI('langpair=eng|spa&markUnknown=no&prefs=&q=hello'),
        expect.anything(),
      ),
    );

    expect(getOutputTextbox().value).toBe(output);
  });

  it('cancels pending requests', async () => {
    renderTextTranslationForm();

    type(input);

    translate();
    translate();

    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(2));
    expect(mockAxios.queue()).toHaveLength(1);
  });

  it('shows errors as not available', async () => {
    renderTextTranslationForm();

    type(input);
    translate();

    mockAxios.mockError({
      response: {
        data: {
          status: 'error',
          code: 400,
          message: 'Bad Request',
          explanation: 'That pair is invalid, use e.g. eng|spa',
        },
      },
    });
    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(1));

    expect(getOutputTextbox().value).toBe('Not_Available-Default');
  });

  it('sends mark unknown parameter', async () => {
    renderTextTranslationForm({ markUnknown: true });

    type(input);
    translate();

    await waitFor(() =>
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('translate'),
        expect.stringContaining('markUnknown=yes'),
        expect.anything(),
      ),
    );
  });

  it('sends preferences', async () => {
    renderTextTranslationForm({ pairPrefs: { foo: true, bar: true, qux: false } });

    type(input);
    translate();

    await waitFor(() =>
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('translate'),
        expect.stringContaining(`prefs=${encodeURIComponent('foo,bar')}`),
        expect.anything(),
      ),
    );
  });

  it('instant translates after timeout', () => {
    renderTextTranslationForm({ instantTranslation: true });

    type(input);
    expect(mockAxios.queue()).toHaveLength(0);

    jest.advanceTimersByTime(3500);
    expect(mockAxios.queue()).toHaveLength(1);
  });
});

describe('detection', () => {
  const detect = () => window.dispatchEvent(new Event(DetectEvent));

  it('detects on event', async () => {
    renderTextTranslationForm();

    const listener = jest.fn();
    window.addEventListener(DetectCompleteEvent, listener, false);

    type(input);
    detect();

    const data = { spa: 0.5, eng: 0.75 };
    mockAxios.mockResponse({ data });
    await waitFor(() =>
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('identifyLang'),
        expect.stringContaining(`q=${input}`),
        expect.anything(),
      ),
    );

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0] as [CustomEvent<Record<string, number>>])[0].detail).toBe(data);
  });

  it('handles errors', async () => {
    renderTextTranslationForm();

    const listener = jest.fn();
    window.addEventListener(DetectCompleteEvent, listener, false);

    type(input);
    detect();

    mockAxios.mockError({
      response: {
        data: { status: 'error', code: 400, message: 'Bad Request', explanation: 'Missing argument q' },
      },
    });
    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(1));

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0] as [CustomEvent<Record<string, number>>])[0].detail).toBeNull();
  });

  it('cancels pending requests', async () => {
    renderTextTranslationForm();

    type(input);
    detect();
    detect();

    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(2));
    expect(mockAxios.queue()).toHaveLength(1);
  });
});
