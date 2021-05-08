import * as React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { LocaleContext, StringsContext } from '../context';
import { Strings, useLocalization, validLocale } from './localization';

describe('validLocale', () => {
  it.each([
    ['eng', true],
    ['en', true],
    ['tel', false],
  ])('maps %s to %s', (lang, valid) => expect(validLocale(lang)).toBe(valid));
});

describe('useLocalization', () => {
  describe('with loaded locale', () => {
    const wrapper = ({ children }: { children: React.ReactElement[] }) => (
      <StringsContext.Provider
        value={{
          spa: ({ '@langNames': { sco: 'escocés' }, Translation: 'Traducción' } as unknown) as Strings,
        }}
      >
        <LocaleContext.Provider value="spa">{children}</LocaleContext.Provider>
      </StringsContext.Provider>
    );
    const {
      result: {
        error,
        current: { t, tLang },
      },
    } = renderHook(() => useLocalization(), { wrapper });

    it('does not error', () => expect(error).toBeUndefined());

    describe('t', () => {
      it.each([
        ['Input_Text', 'Input_Text-Default'], // default
        ['Translation', 'Traducción'], // present
        ['SomethingMissing', 'SomethingMissing'], // missing

        // replacements
        [
          'Maintainer',
          `<a href='http://wiki.apertium.org/wiki/Apertium' target='_blank' rel='noopener'>Apertium</a>-Default`,
        ],
      ])('maps %s to %s', (id, value) => expect(t(id)).toBe(value));
    });

    describe('tLang', () => {
      it.each([
        ['eng', 'English-Default'], // default
        ['sco', 'escocés'], // present
        ['fin', 'suomi'], // autonym
        ['xyz', 'xyz'], // missing
      ])('maps %s to %s', (code, name) => expect(tLang(code)).toBe(name));
    });
  });

  describe('without loaded locale', () => {
    const wrapper = ({ children }: { children: React.ReactElement[] }) => (
      <StringsContext.Provider value={{}}>
        <LocaleContext.Provider value="spa">{children}</LocaleContext.Provider>
      </StringsContext.Provider>
    );
    const {
      result: {
        error,
        current: { t, tLang },
      },
    } = renderHook(() => useLocalization(), { wrapper });

    it('does not error', () => expect(error).toBeUndefined());

    it('t returns defaults', () => expect(t('Input_Text')).toBe('Input_Text-Default'));

    it('tLang returns defaults', () => expect(tLang('eng')).toBe('English-Default'));
  });
});
