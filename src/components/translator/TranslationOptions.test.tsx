import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TranslationOptions, { Props } from './TranslationOptions';

const renderTranslationOptions = (props_: Partial<Props>) => {
  const props = {
    markUnknown: false,
    setMarkUnknown: jest.fn(),
    instantTranslation: false,
    setInstantTranslation: jest.fn(),
    translationChaining: false,
    setTranslationChaining: jest.fn(),
    srcLang: 'eng',
    tgtLang: 'spa',
    pairPrefs: {},
    setPairPrefs: jest.fn(),
    ...props_,
  };

  render(<TranslationOptions {...props} />);

  return props;
};

describe('mark unknown', () => {
  const name = 'Mark_Unknown_Words-Default';

  it.each([false, true])('renders %s', (markUnknown) => {
    renderTranslationOptions({ markUnknown });
    expect(screen.getByRole('checkbox', { name, checked: markUnknown })).toBeDefined();
  });

  it.each([false, true])('toggles from %s', (markUnknown) => {
    const props = renderTranslationOptions({ markUnknown });

    const checkbox = screen.getByRole('checkbox', { name });
    userEvent.click(checkbox);

    expect(props.setMarkUnknown).toHaveBeenCalledWith(!markUnknown);
  });
});

describe('instant translation', () => {
  const name = 'Instant_Translation-Default';

  it.each([false, true])('renders %s', (instantTranslation) => {
    renderTranslationOptions({ instantTranslation });
    expect(screen.getByRole('checkbox', { name, checked: instantTranslation })).toBeDefined();
  });

  it.each([false, true])('toggles from %s', (instantTranslation) => {
    const props = renderTranslationOptions({ instantTranslation });

    const checkbox = screen.getByRole('checkbox', { name });
    userEvent.click(checkbox);

    expect(props.setInstantTranslation).toHaveBeenCalledWith(!instantTranslation);
  });
});

describe('translation chaining', () => {
  const name = 'Multi_Step_Translation-Default';

  it.each([false, true])('renders %s', (translationChaining) => {
    renderTranslationOptions({ translationChaining });
    expect(screen.getByRole('checkbox', { name, checked: translationChaining })).toBeDefined();
  });

  it.each([false, true])('toggles from %s', (translationChaining) => {
    const props = renderTranslationOptions({ translationChaining });

    const checkbox = screen.getByRole('checkbox', { name });
    userEvent.click(checkbox);

    expect(props.setTranslationChaining).toHaveBeenCalledWith(!translationChaining);
  });
});
