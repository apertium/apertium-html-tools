import * as React from 'react';
import { MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { render, screen } from '@testing-library/react';
import { Router } from 'react-router-dom';

import { Mode, TranslateEvent } from '..';
import Translator from '../Translator';

const renderTranslator = (historyOptions?: MemoryHistoryBuildOptions, mode?: Mode) => {
  const history = createMemoryHistory(historyOptions);
  render(
    <Router history={history}>
      <Translator mode={mode} />
    </Router>,
  );
  return history;
};

describe('initial modes', () => {
  test('default', () => {
    renderTranslator();
    expect(screen.getByRole('textbox', { name: 'Input_Text-Default' })).toBeDefined();
  });

  test('text', () => {
    renderTranslator({}, Mode.Text);
    expect(screen.getByRole('textbox', { name: 'Input_Text-Default' })).toBeDefined();
  });

  test('webpage', () => {
    renderTranslator({}, Mode.Webpage);
    expect((screen.getByRole('textbox') as HTMLInputElement).type).toBe('url');
  });

  test('document', () => {
    renderTranslator({}, Mode.Document);
    expect((screen.getByTestId('file-input') as HTMLInputElement).type).toBe('file');
  });
});

it('dispatches translate event on submit', () => {
  renderTranslator();

  const listener = jest.fn();
  window.addEventListener(TranslateEvent, listener, false);

  (screen.getByRole('form', { name: 'Translate-Default' }) as HTMLFormElement).submit();

  expect(listener).toHaveBeenCalledTimes(1);
});
