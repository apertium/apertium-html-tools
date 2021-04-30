import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LocaleContext } from '../context';
import LocaleSelector from './LocaleSelector';

it('selects currently active locale', () => {
  render(
    <LocaleContext.Provider value="spa">
      <LocaleSelector setLocale={jest.fn()} />
    </LocaleContext.Provider>,
  );

  const selector = screen.getByRole('combobox');
  expect((selector as HTMLSelectElement).value).toBe('spa');
});

it('calls setLocale on updates', () => {
  const setLocale = jest.fn();
  render(
    <LocaleContext.Provider value="spa">
      <LocaleSelector setLocale={setLocale} />
    </LocaleContext.Provider>,
  );

  const selector = screen.getByRole('combobox');
  userEvent.selectOptions(selector, screen.getByRole('option', { name: 'English' }));

  expect(setLocale).toHaveBeenCalledTimes(1);
  expect(setLocale).toHaveBeenCalledWith('eng');
});
