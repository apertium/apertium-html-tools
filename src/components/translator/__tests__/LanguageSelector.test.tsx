import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LanguageSelector, { Props } from '../LanguageSelector';
import { DetectEvent } from '..';

const renderLanguageSelector = (props_: Partial<Props> = {}): Props => {
  const props = {
    pairs: { eng: new Set(['cat', 'spa']), spa: new Set(['eng']) },
    onTranslate: jest.fn(),
    loading: false,

    srcLang: 'eng',
    setSrcLang: jest.fn(),
    recentSrcLangs: ['eng', 'spa', 'cat'],
    setRecentSrcLangs: jest.fn(),

    tgtLang: 'cat',
    setTgtLang: jest.fn(),
    recentTgtLangs: ['spa', 'cat', 'eng'],

    detectLangEnabled: true,
    detectedLang: null,
    setDetectedLang: jest.fn(),
    ...props_,
  };

  render(<LanguageSelector {...props} />);

  return props;
};

it('translates on click', () => {
  const { onTranslate } = renderLanguageSelector();

  userEvent.click(screen.getByRole('button', { name: 'Translate-Default' }));

  expect(onTranslate).toHaveBeenCalledTimes(1);
});

describe('mobile', () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  it('shows detected language', () => {
    renderLanguageSelector({
      detectedLang: 'eng',
    });

    const option = screen.getByRole('option', { name: 'English-Default - detected-Default' });
    expect(option).toBeDefined();
    expect((option as HTMLOptionElement).selected).toBeTruthy();
  });

  it('sets source language', () => {
    const { srcLang, setSrcLang } = renderLanguageSelector();

    const combobox = screen
      .getAllByRole('combobox')
      .find((e) => (e as HTMLSelectElement).value === srcLang) as HTMLSelectElement;
    userEvent.selectOptions(combobox, 'català');

    expect(setSrcLang).toHaveBeenCalledWith('cat');
  });

  it('sets target language', () => {
    const { tgtLang, setTgtLang } = renderLanguageSelector();

    const combobox = screen
      .getAllByRole('combobox')
      .find((e) => (e as HTMLSelectElement).value === tgtLang) as HTMLSelectElement;
    userEvent.selectOptions(combobox, 'español');

    expect(setTgtLang).toHaveBeenCalledWith('spa');
  });

  it('allows detecting language', () => {
    const { srcLang } = renderLanguageSelector();

    const listener = jest.fn();
    window.addEventListener(DetectEvent, listener, false);

    const combobox = screen
      .getAllByRole('combobox')
      .find((e) => (e as HTMLSelectElement).value === srcLang) as HTMLSelectElement;
    userEvent.selectOptions(combobox, 'Detect_Language-Default');

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
