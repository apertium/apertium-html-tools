import * as React from 'react';
import { MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { render, screen } from '@testing-library/react';
import { Router } from 'react-router-dom';

import Translator from '../Translator';

const renderTranslator = (historyOptions?: MemoryHistoryBuildOptions) => {
  const history = createMemoryHistory(historyOptions);
  render(
    <Router history={history}>
      <Translator />
    </Router>,
  );
  return history;
};

it('defaults to showing text translation', () => {
  renderTranslator();
  expect(screen.getByRole('textbox', { name: 'Input_Text-Default' })).toBeDefined();
});
