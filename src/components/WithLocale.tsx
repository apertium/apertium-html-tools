import * as React from 'react';

import { ConfigContext, LocaleContext } from '../context';
import { apyFetch } from '../util';
import { getUrlParam } from '../util/url';
import { toAlpha3Code } from '../util/languages';
import useLocalStorage from '../util/useLocalStorage';
import { validLocale } from '../util/localization';

const loadBrowserLocale = (setLocale: React.Dispatch<React.SetStateAction<string>>) => {
  void (async () => {
    let locales: Array<string>;
    try {
      locales = (await apyFetch('getLocale')[1]).data as Array<string>;
    } catch (error) {
      console.warn('Failed to fetch browser locale, falling back to default', error);
      return;
    }

    for (let localeGuess of locales) {
      if (localeGuess.indexOf('-') !== -1) {
        localeGuess = localeGuess.split('-')[0];
      }

      const locale = toAlpha3Code(localeGuess);
      if (validLocale(locale)) {
        setLocale(locale);
      }
    }
  })();
};

const WithLocale = ({
  children,
}: {
  children: (props: { setLocale: React.Dispatch<React.SetStateAction<string>> }) => React.ReactNode;
}): React.ReactElement => {
  const { defaultLocale } = React.useContext(ConfigContext);

  // Locale selection priority:
  // 1. `lang` parameter from URL
  // 2. locale section from URL path
  // 3. `locale` key from LocalStorage
  // 4. browser's preferred locale from APy
  const urlPathMatch = /index\.(\w{3})\.html/.exec(window.location.pathname);
  const urlPathLocale = urlPathMatch && urlPathMatch[1];
  const langParam = getUrlParam(window.location.search, 'lang');
  const urlQueryLocale = toAlpha3Code(langParam)?.replace('/', '');
  let shouldLoadBrowserLocale = false;
  const [locale, setLocale] = useLocalStorage(
    'locale',
    () => {
      shouldLoadBrowserLocale = true;
      return defaultLocale;
    },
    { overrideValue: urlQueryLocale || urlPathLocale, validateValue: validLocale },
  );
  React.useEffect(() => {
    if (shouldLoadBrowserLocale) {
      loadBrowserLocale(setLocale);
    }
  }, [shouldLoadBrowserLocale, setLocale]);

  React.useEffect(() => {
    // We use the real `window.history` here since we intend to modify the real
    // URL path, not just the URL hash.
    window.history.pushState({}, '', `index.${locale}.html${window.location.search}${window.location.hash}`);
  }, [locale]);

  return <LocaleContext.Provider value={locale}>{children({ setLocale })}</LocaleContext.Provider>;
};

export default WithLocale;
