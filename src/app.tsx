import './bootstrap.css';
import './app.css';
import './rtl.css';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HashRouter, Route, useHistory, useLocation } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import axios from 'axios';

import { ConfigContext, LocaleContext, StringsContext } from './context';
import { PRELOADED_STRINGS, Strings, tt, validLocale } from './util/localization';
import { langDirection, toAlpha2Code, toAlpha3Code } from './util/languages';
import { Mode } from './types';
import { apyFetch } from './util';
import { getUrlParam } from './util/url';
import useLocalStorage from './util/useLocalStorage';

import Translator, { Mode as TranslatorMode } from './components/translator';
import Analyzer from './components/Analyzer';
import { Path as DocTranslationPath } from './components/translator/DocTranslationForm';
import Footer from './components/footer';
import Generator from './components/Generator';
import LocaleSelector from './components/LocaleSelector';
import Navbar from './components/navbar';
import Sandbox from './components/Sandbox';
import { Path as WebpageTranslationPath } from './components/translator/WebpageTranslationForm';
import WithInstallationAlert from './components/WithInstallationAlert';

const Interfaces = {
  [Mode.Translation]: Translator,
  [Mode.Analysis]: Analyzer,
  [Mode.Generation]: Generator,
  [Mode.Sandbox]: Sandbox,
} as Record<Mode, React.ComponentType<unknown>>;

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

const App = () => {
  const history = useHistory();
  const { pathname } = useLocation();
  const { defaultLocale, defaultMode, enabledModes } = React.useContext(ConfigContext);

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

  // Fetch strings on locale change.
  const [strings, setStrings] = React.useState(PRELOADED_STRINGS);
  React.useEffect(() => {
    if (locale in strings) {
      return;
    }

    void (async () => {
      let localeStrings: Strings;
      try {
        localeStrings = (await axios({ url: `strings/${locale}.json`, validateStatus: (status) => status === 200 }))
          .data as Strings;
      } catch (error) {
        console.warn(`Failed to fetch strings, falling back to default ${defaultLocale}`, error);
        return;
      }

      setStrings((strings) => ({ ...strings, [locale]: localeStrings }));
    })();
  }, [defaultLocale, locale, strings]);

  // Update global strings on locale change.
  React.useEffect(() => {
    const htmlElement = document.getElementsByTagName('html')[0];
    htmlElement.dir = langDirection(locale);
    htmlElement.lang = toAlpha2Code(locale) || locale;

    (document.getElementById('meta-description') as HTMLMetaElement).content = tt('description', locale, strings);

    document.title = tt('title', locale, strings);
  }, [locale, strings]);

  React.useEffect(() => {
    const body = document.getElementsByTagName('body')[0];
    const handleDragEnter = () => {
      if (pathname !== DocTranslationPath) {
        history.push(DocTranslationPath);
      }
    };
    body.addEventListener('dragenter', handleDragEnter);
    return () => body.removeEventListener('dragenter', handleDragEnter);
  }, [history, pathname]);

  const wrapRef = React.createRef<HTMLDivElement>();
  const pushRef = React.createRef<HTMLDivElement>();

  return (
    <StringsContext.Provider value={strings}>
      <LocaleContext.Provider value={locale}>
        <WithInstallationAlert>
          <div
            ref={wrapRef}
            style={{
              height: 'auto !important',
              margin: '0 auto -60px',
              minHeight: '99.5%',
            }}
          >
            <Navbar setLocale={setLocale} />
            <Container>
              {Object.values(Mode).map(
                (mode) =>
                  enabledModes.has(mode) && (
                    <Route
                      component={Interfaces[mode]}
                      exact
                      key={mode}
                      path={mode === defaultMode ? ['/', `/${mode}`] : `/${mode}`}
                    />
                  ),
              )}
              {enabledModes.has(Mode.Translation) && (
                <>
                  <Route exact path={DocTranslationPath}>
                    <Translator mode={TranslatorMode.Document} />
                  </Route>
                  <Route exact path={WebpageTranslationPath}>
                    <Translator mode={TranslatorMode.Webpage} />
                  </Route>
                </>
              )}
              <div className="d-block d-sm-none float-left my-2">
                <LocaleSelector setLocale={setLocale} />
              </div>
            </Container>
            <div ref={pushRef} style={{ height: '60px' }} />
          </div>
          <Footer pushRef={pushRef} wrapRef={wrapRef} />
        </WithInstallationAlert>
      </LocaleContext.Provider>
    </StringsContext.Provider>
  );
};

ReactDOM.render(
  <HashRouter>
    <App />
  </HashRouter>,
  document.getElementById('react-mount'),
);
