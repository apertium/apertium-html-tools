import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TranslationOptions, { Props } from '../TranslationOptions';

const renderTranslationOptions = (props_: Partial<Props> = {}) => {
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

    userEvent.click(screen.getByRole('checkbox', { name }));

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
    const { setInstantTranslation } = renderTranslationOptions({ instantTranslation });

    userEvent.click(screen.getByRole('checkbox', { name }));

    expect(setInstantTranslation).toHaveBeenCalledWith(!instantTranslation);
  });
});

describe('translation chaining', () => {
  const name = 'Multi_Step_Translation-Default';

  it.each([false, true])('renders %s', (translationChaining) => {
    renderTranslationOptions({ translationChaining });
    expect(screen.getByRole('checkbox', { name, checked: translationChaining })).toBeDefined();
  });

  it.each([false, true])('toggles from %s', (translationChaining) => {
    const { setTranslationChaining } = renderTranslationOptions({ translationChaining });

    userEvent.click(screen.getByRole('checkbox', { name }));

    expect(setTranslationChaining).toHaveBeenCalledWith(!translationChaining);
  });
});

describe('pair prefs', () => {
  const withPrefsOptions = { srcLang: 'eng', tgtLang: 'cat' };

  it('renders nothing when prefs are unavailable', () => {
    renderTranslationOptions();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders closed dropdown when prefs are available', () => {
    renderTranslationOptions(withPrefsOptions);
    expect(screen.getByRole('button').textContent).toBe(' Norm_Preferences-Default');
  });

  it('renders prefs when dropdown clicked', async () => {
    renderTranslationOptions(withPrefsOptions);
    userEvent.click(screen.getByRole('button'));

    expect(await screen.findByRole('checkbox', { name: 'foo_pref' })).toBeDefined();
  });

  it('closes dropdown when clicked', () => {
    renderTranslationOptions(withPrefsOptions);

    const button = screen.getByRole('button');
    userEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    userEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('updates prefs when checkbox clicked', async () => {
    const { setPairPrefs } = renderTranslationOptions(withPrefsOptions);

    userEvent.click(screen.getByRole('button'));
    userEvent.click(await screen.findByRole('checkbox', { name: 'foo_pref' }));

    expect(setPairPrefs).toBeCalledWith({ foo: true });
  });
});
