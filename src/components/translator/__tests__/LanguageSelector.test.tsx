import * as React from 'react';
import { act, getByRole, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DetectCompleteEvent, DetectEvent, DirectPairs } from '..';
import LanguageSelector, { Props } from '../LanguageSelector';

const renderLanguageSelector = (props_: Partial<Props> = {}): Props => {
  const props = {
    pairs: { ...DirectPairs, eng: new Set(['cat', 'spa', 'hin', 'ara']), spa: new Set(['eng']), cat: new Set([]) },
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

const matchMobileMedia = (matches: boolean) => {
  const listeners = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      ...listeners,
      matches,
      media: query,
      onchange: null,
    })),
  });

  return listeners;
};

beforeEach(() => matchMobileMedia(false));

it('translates on click', () => {
  const { onTranslate } = renderLanguageSelector();

  userEvent.click(screen.getByRole('button', { name: 'Translate-Default' }));

  expect(onTranslate).toHaveBeenCalledTimes(1);
});

it('switches between mobile and desktop', () => {
  const { addEventListener } = matchMobileMedia(true);
  let handler: ((ev: MediaQueryListEvent) => unknown) | undefined = undefined;
  addEventListener.mockImplementation((event, handler_: typeof handler) => {
    if (event === 'change') {
      handler = handler_;
    }
  });

  renderLanguageSelector();

  expect(screen.queryAllByRole('combobox')).toHaveLength(2);
  expect(handler).toBeDefined();

  act(
    () => void (handler as unknown as (ev: MediaQueryListEvent) => unknown)({ matches: false } as MediaQueryListEvent),
  );

  expect(screen.queryAllByRole('combobox')).toHaveLength(0);
});

describe('swapping', () => {
  it('does not allow swapping when swapped pair invalid', () => {
    renderLanguageSelector();

    expect((screen.getByTestId('swap-langs-button') as HTMLButtonElement).disabled).toBeTruthy();
  });

  it('allow swapping when swapped pair valid', () => {
    const { srcLang, tgtLang, setSrcLang, setTgtLang } = renderLanguageSelector({
      tgtLang: 'spa',
    });

    userEvent.click(screen.getByTestId('swap-langs-button'));

    expect(setSrcLang).toHaveBeenCalledWith(tgtLang);
    expect(setTgtLang).toHaveBeenCalledWith(srcLang);
  });
});

describe('mobile', () => {
  beforeEach(() => matchMobileMedia(true));

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
    userEvent.selectOptions(combobox, 'español');

    expect(setSrcLang).toHaveBeenCalledWith('spa');
  });

  it('sets target language', () => {
    const { tgtLang, setTgtLang } = renderLanguageSelector();

    const combobox = screen
      .getAllByRole('combobox')
      .find((e) => (e as HTMLSelectElement).value === tgtLang) as HTMLSelectElement;
    userEvent.selectOptions(combobox, 'español');

    expect(setTgtLang).toHaveBeenCalledWith('spa');
  });

  it('sends detect event on detect language selection', () => {
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

describe('desktop', () => {
  beforeEach(() => matchMobileMedia(false));

  it('shows detected language', () => {
    renderLanguageSelector({
      detectedLang: 'eng',
    });

    const button = screen.getByRole('button', { name: 'English-Default - detected-Default' });
    expect(button).toBeDefined();
    expect(button.classList).toContain('active');
  });

  it('sets source language', () => {
    const { setSrcLang } = renderLanguageSelector();

    const srcLangs = screen.getAllByRole('group')[0];
    userEvent.click(getByRole(srcLangs, 'button', { name: 'español' }));

    expect(setSrcLang).toHaveBeenCalledWith('spa');
  });

  it('sets target language', () => {
    const { setTgtLang } = renderLanguageSelector();

    const tgtLangs = screen.getAllByRole('group')[1];
    userEvent.click(getByRole(tgtLangs, 'button', { name: 'español' }));

    expect(setTgtLang).toHaveBeenCalledWith('spa');
  });

  it('sends detect event on detect language click', () => {
    renderLanguageSelector();

    const listener = jest.fn();
    window.addEventListener(DetectEvent, listener, false);

    userEvent.click(screen.getByRole('button', { name: 'Detect_Language-Default' }));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  describe('language dropdowns', () => {
    it('sets source languages', async () => {
      const { setSrcLang } = renderLanguageSelector();

      const srcsLangDropdown = screen.getByTestId('src-lang-dropdown');
      userEvent.click(getByRole(srcsLangDropdown, 'button'));
      await waitFor(() => userEvent.click(getByRole(srcsLangDropdown, 'button', { name: 'español' })));

      expect(setSrcLang).toHaveBeenCalledWith('spa');
    });

    it('disables invalid target languages', async () => {
      renderLanguageSelector();

      const tgtLangDropdown = screen.getByTestId('tgt-lang-dropdown');
      userEvent.click(getByRole(tgtLangDropdown, 'button'));

      screen.debug(tgtLangDropdown);

      await waitFor(() =>
        expect(
          (getByRole(tgtLangDropdown, 'button', { name: 'English-Default' }) as HTMLButtonElement).disabled,
        ).toBeTruthy(),
      );
    });

    it('sets target languages', async () => {
      const { setTgtLang } = renderLanguageSelector();

      const tgtLangDropdown = screen.getByTestId('tgt-lang-dropdown');
      userEvent.click(getByRole(tgtLangDropdown, 'button'));
      await waitFor(() => userEvent.click(getByRole(tgtLangDropdown, 'button', { name: 'català' })));

      expect(setTgtLang).toHaveBeenCalledWith('cat');
    });
  });
});

describe('language detection', () => {
  it('ignores detection failure', () => {
    const { setDetectedLang } = renderLanguageSelector();

    window.dispatchEvent(new CustomEvent(DetectCompleteEvent, { detail: null }));

    expect(setDetectedLang).toHaveBeenCalledTimes(0);
  });

  it('updates source language list and sets detected language', () => {
    const { setDetectedLang, setRecentSrcLangs, setSrcLang } = renderLanguageSelector();

    window.dispatchEvent(
      new CustomEvent(DetectCompleteEvent, {
        detail: {
          cat: 0.5,
          eng: 0.75,
          spa: 0.25,
        },
      }),
    );

    expect(setRecentSrcLangs).toHaveBeenCalledWith(['eng', 'cat', 'spa']);
    expect(setSrcLang).toHaveBeenCalledWith('eng');
    expect(setDetectedLang).toHaveBeenCalledWith('eng');
  });
});
