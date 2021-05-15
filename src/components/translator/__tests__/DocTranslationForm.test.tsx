import * as React from 'react';
import { MemoryHistory, MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import mockAxios from 'jest-mock-axios';
import userEvent from '@testing-library/user-event';

import DocTranslationForm, { Props } from '../DocTranslationForm';
import { TranslateEvent } from '..';

const renderDocTranslationForm = (
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
      <DocTranslationForm {...props} />
    </Router>,
  );

  return [props, history];
};

const getInput = () => screen.getByTestId('file-input') as HTMLInputElement;
const translate = () => window.dispatchEvent(new Event(TranslateEvent));

it('stores pair in URL', () => {
  const [, history] = renderDocTranslationForm();
  expect(history.location.search).toBe(`?dir=eng-spa`);
});

describe('translation', () => {
  const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

  it('handles translation errors', async () => {
    renderDocTranslationForm();

    act(() => {
      userEvent.upload(getInput(), file);
      translate();
    });

    mockAxios.mockError({
      response: {
        data: { status: 'error', code: 400, message: 'Bad Request', explanation: 'Missing argument langpair' },
      },
    });
    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(1));

    expect(screen.getByRole('alert').textContent).toMatchInlineSnapshot(`"Not_Available-Default"`);
  });

  it('rejects large files', () => {
    renderDocTranslationForm();

    act(() => {
      userEvent.upload(getInput(), new File(['hello world'.repeat(5000000)], 'hello.txt', { type: 'text/plain' }));
      translate();
    });

    expect(screen.getByRole('alert').textContent).toMatchInlineSnapshot(`"File_Too_Large-Default"`);
  });

  it('rejects files with invalid mime type', () => {
    renderDocTranslationForm();

    act(() => {
      userEvent.upload(getInput(), new File(['hello'], 'hello.png', { type: 'image/png' }));
      translate();
    });

    expect(screen.getByRole('alert').textContent).toMatchInlineSnapshot(`"Format_Not_Supported-Default"`);
  });

  it('cancels pending requests', async () => {
    renderDocTranslationForm();

    act(() => {
      userEvent.upload(getInput(), file);
      translate();
      translate();
    });

    await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(2));
    expect(mockAxios.queue()).toHaveLength(1);
  });
});
