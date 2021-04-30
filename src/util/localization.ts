import * as React from 'react';

import { LocaleContext, StringsContext } from '../context';
import { PRELOADED_STRINGS, Strings } from './strings';
import { languages, toAlpha2Code, toAlpha3Code } from './languages';
import Config from '../../config';
import locales from '../strings/locales.json';

export { PRELOADED_STRINGS };
export type { Strings };

const defaultStrings = PRELOADED_STRINGS[Config.defaultLocale];

const t = (locale: string, strings: Record<string, Strings>): ((id: string) => string) => {
  return (id: string) => tt(id, locale, strings);
};

export const tt = (id: string, locale: string, strings: Record<string, Strings>): string => {
  const localeStrings = strings[locale];
  let translated = (localeStrings ? localeStrings[id] : undefined) || defaultStrings[id] || id;
  Object.entries(Config.stringReplacements).forEach(([placeholder, replacement]) => {
    translated = translated.replace(placeholder, replacement);
  });
  return translated;
};

const tLang = (locale: string, strings: Record<string, Strings>) => {
  return (id: string) => ttLang(id, locale, strings);
};

const ttLang = (code: string, locale: string, strings: Record<string, Strings>): string => {
  const alpha2Code = toAlpha2Code(code);

  const localeNames = strings[locale] && strings[locale]['@langNames'];
  if (localeNames) {
    const localeName = localeNames[code] || (alpha2Code && localeNames[alpha2Code]);
    if (localeName) {
      return localeName;
    }
  }

  const defaultNames = defaultStrings['@langNames'];
  if (defaultNames) {
    const defaultName = defaultNames[code] || (alpha2Code && defaultNames[alpha2Code]);
    if (defaultName) {
      return defaultName;
    }
  }

  return (alpha2Code && languages[alpha2Code]) || code;
};

export const useLocalization = (): { t: (id: string) => string; tLang: (code: string) => string } => {
  const strings = React.useContext(StringsContext);
  const locale = React.useContext(LocaleContext);

  return React.useMemo(() => ({ t: t(locale, strings), tLang: tLang(locale, strings) }), [strings, locale]);
};

export const validLocale = (code: string): boolean => {
  const alpha3Code = toAlpha3Code(code);
  return alpha3Code != null && alpha3Code in locales;
};
