import './bootstrap.css';
import './app.css';
import './rtl.css';

import * as React from 'react';
import { HashRouter, Route, useHistory, useLocation } from 'react-router-dom';
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react';
import Container from 'react-bootstrap/Container';
import axios from 'axios';

import { ConfigContext, LocaleContext, StringsContext } from './context';
import { PRELOADED_STRINGS, Strings, tt } from './util/localization';
import { langDirection, toAlpha2Code } from './util/languages';
import { Mode } from './types';

import Analyzer from './components/Analyzer';
import SpellChecker from './components/SpellChecker';
import { Path as DocTranslationPath } from './components/translator/DocTranslationForm';
import Footer from './components/footer';
import Generator from './components/Generator';
import LocaleSelector from './components/LocaleSelector';
import Navbar from './components/navbar';
import Sandbox from './components/Sandbox';
import Translator from './components/translator/Translator';
import { Mode as TranslatorMode } from './components/translator';
import { Path as WebpageTranslationPath } from './components/translator/WebpageTranslationForm';
import WithInstallationAlert from './components/WithInstallationAlert';
import WithLocale from './components/WithLocale';

const Interfaces = {
  [Mode.Translation]: Translator,
  [Mode.Analysis]: Analyzer,
  [Mode.Generation]: Generator,
  [Mode.Sandbox]: Sandbox,
  [Mode.SpellChecker]: SpellChecker,
} as Record<Mode, React.ComponentType<unknown>>;

const App = ({ setLocale }: { setLocale: React.Dispatch<React.SetStateAction<string>> }): React.ReactElement => {
  const history = useHistory();
  const location = useLocation();
  const locale = React.useContext(LocaleContext);
  const { defaultLocale, defaultMode, enabledModes, matomoConfig } = React.useContext(ConfigContext);

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
          .data as unknown as Strings;
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
      if (location.pathname !== DocTranslationPath) {
        history.push(DocTranslationPath);
      }
    };
    body.addEventListener('dragenter', handleDragEnter);
    return () => body.removeEventListener('dragenter', handleDragEnter);
  }, [history, location.pathname]);

  const wrapRef = React.createRef<HTMLDivElement>();
  const pushRef = React.createRef<HTMLDivElement>();

  const matomoInstance = React.useMemo(
    () => createInstance(matomoConfig || { disabled: true, urlBase: '-', siteId: 1 }),
    [matomoConfig],
  );

  React.useEffect(() => matomoInstance.trackPageView(), [matomoInstance]);

  return (
    <MatomoProvider value={matomoInstance}>
      <StringsContext.Provider value={strings}>
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
              {enabledModes.has(Mode.SpellChecker) && (
         
                  <Route exact path={DocTranslationPath}>
                    // write your spellchecker here
                  </Route>
              )}
              <div className="d-block d-sm-none float-left my-2">
                <LocaleSelector setLocale={setLocale} />
              </div>
            </Container>
            <div ref={pushRef} style={{ height: '60px' }} />
          </div>
          <Footer pushRef={pushRef} wrapRef={wrapRef} />
        </WithInstallationAlert>
      </StringsContext.Provider>
    </MatomoProvider>
  );
};

const ConnectedApp: React.VoidFunctionComponent = () => (
  <HashRouter hashType="noslash">
    <WithLocale>{(props) => <App {...props} />}</WithLocale>
  </HashRouter>
);

export default ConnectedApp;
