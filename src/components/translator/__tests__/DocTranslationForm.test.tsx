import * as React from 'react';
import { MemoryHistory, MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import mockAxios from 'jest-mock-axios';
import userEvent from '@testing-library/user-event';

import DocTranslationForm, { Props } from '../DocTranslationForm';
import type { AxiosRequestConfig } from 'axios';
import { TranslateEvent } from '../index';

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

const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

it('stores pair in URL', () => {
  const [, history] = renderDocTranslationForm();
  expect(history.location.search).toBe(`?dir=eng-spa`);
});

describe('drag and drop', () => {
  const getBody = () => document.getElementsByTagName('body')[0];

  it('translates a dropped file', () => {
    renderDocTranslationForm();

    const body = getBody();

    fireEvent(body, new Event('dragenter'));

    const dropEvent = new Event('drop') as Event & { dataTransfer: { files: Array<File> } };
    dropEvent.dataTransfer = { files: [file] };
    fireEvent(screen.getByTestId('document-drop-target'), dropEvent);

    fireEvent(body, new Event('dragover'));

    expect(screen.queryByRole('dialog')?.style.opacity).toBe('');
    expect(mockAxios.queue()).toHaveLength(1);
  });

  it('skips translation of an irrelvant drop', () => {
    renderDocTranslationForm();

    const body = getBody();

    fireEvent(body, new Event('dragenter'));

    const dropEvent = new Event('drop') as Event & { dataTransfer: { files: Array<File> } };
    dropEvent.dataTransfer = { files: [] };
    fireEvent(screen.getByTestId('document-drop-target'), dropEvent);

    expect(mockAxios.queue()).toHaveLength(0);
  });

  it('opens drop dialog', () => {
    renderDocTranslationForm();

    const body = getBody();

    fireEvent(body, new Event('dragenter'));
    expect(screen.getByRole('dialog').textContent).toMatchInlineSnapshot(`" Drop_Document-Default"`);
  });

  it('closes drop dialog', () => {
    renderDocTranslationForm();

    const body = getBody();

    fireEvent(body, new Event('dragenter'));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent(screen.getByTestId('document-drop-target'), new Event('dragleave'));
    expect(screen.queryByRole('dialog')?.style.opacity).toBe('');
  });
});

describe('translation', () => {
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

  it('provides link to translated file', async () => {
    const blobURL = 'blob:http://localhost:8000/ccbe52d0-d3be-4376-a6b8-cc84b76b3338';
    const createObjectURL = jest.fn();
    createObjectURL.mockReturnValue(blobURL);
    Object.defineProperty(window.URL, 'createObjectURL', { value: createObjectURL });

    renderDocTranslationForm();

    act(() => {
      userEvent.upload(getInput(), file);
      translate();
    });

    mockAxios.mockResponse({ data: new Blob(['hola']) });
    await waitFor(() =>
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/translateDoc'),
        expect.anything(),
        expect.anything(),
      ),
    );

    expect((screen.getByRole('link', { name: file.name }) as HTMLAnchorElement).href).toBe(blobURL);
  });

  it('shows upload progress', () => {
    renderDocTranslationForm();

    act(() => {
      userEvent.upload(getInput(), file);
      translate();
    });

    const { onUploadProgress } = mockAxios.post.mock.calls[0][2] as AxiosRequestConfig;
    if (onUploadProgress === undefined) {
      throw 'missing onUploadProgress';
    }
    act(() => onUploadProgress({ loaded: 50, total: 100 }));

    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('50');
  });

  it('rejects when no files', () => {
    renderDocTranslationForm();

    translate();

    expect(mockAxios.queue()).toHaveLength(0);
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

  it('cancels requests on unmount', async () => {
    renderDocTranslationForm();

    act(() => {
      userEvent.upload(getInput(), file);
      translate();
    });

    expect(mockAxios.queue()).toHaveLength(1);

    cleanup();

    await waitFor(() => expect(mockAxios.queue()).toHaveLength(0));
  });
});
