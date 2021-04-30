import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import mockAxios from 'jest-mock-axios';
import userEvent from '@testing-library/user-event';

import Sandbox from './Sandbox';

const input = '/analyse?lang=eng&q=kicked';

const renderSandbox = () =>
  render(
    <Router history={createMemoryHistory()}>
      <Sandbox />
    </Router>,
  );

const type = (input: string): HTMLTextAreaElement => {
  const textbox = screen.getByRole('textbox');
  userEvent.type(textbox, input);
  return textbox as HTMLTextAreaElement;
};

const submit = () => userEvent.click(screen.getByRole('button'));

it('allows typing an input', () => {
  renderSandbox();

  const textbox = type(input);

  expect(textbox.value).toBe(input);
});

describe('requests', () => {
  it('no-ops an empty input', () => {
    renderSandbox();
    submit();
    expect(mockAxios.post).not.toBeCalled();
  });

  it('shows errors', async () => {
    renderSandbox();
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
});
