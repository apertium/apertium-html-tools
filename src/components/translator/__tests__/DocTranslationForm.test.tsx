import * as React from 'react';
import { MemoryHistory, MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { render } from '@testing-library/react';

import DocTranslationForm, { Props } from '../DocTranslationForm';

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

it('stores pair in URL', () => {
  const [, history] = renderDocTranslationForm();
  expect(history.location.search).toBe(`?dir=eng-spa`);
});
