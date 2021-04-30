import './translator.css';

import * as React from 'react';
import { faFile, faLink } from '@fortawesome/free-solid-svg-icons';
import { generatePath, useHistory } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

import {
  ChainedPairs,
  DirectPairs,
  Mode,
  PairPrefValues,
  Pairs,
  SrcLangs,
  TgtLangs,
  TranslateEvent,
  isPair,
  pairUrlParam,
} from '.';
import DocTranslationForm, { Path as DocTranslationPath } from './DocTranslationForm';
import TextTranslationForm, { Path as TextTranslationPath } from './TextTranslationForm';
import WebpageTranslationForm, { Path as WebpageTranslationPath } from './WebpageTranslationForm';
import { parentLang, toAlpha3Code } from '../../util/languages';
import { ConfigContext } from '../../context';
import LanguageSelector from './LanguageSelector';
import TranslationOptions from './TranslationOptions';
import { getUrlParam } from '../../util/url';
import useLocalStorage from '../../util/useLocalStorage';
import { useLocalization } from '../../util/localization';

const recentLangsCount = 3;

const defaultSrcLang = (pairs: Pairs): string => {
  const validSrcLang = (code: string) => pairs[toAlpha3Code(code) || code];

  const convertBCP47LangCode = (code: string): string => {
    // First, convert variant format.
    // Then, BCP 47 prefers shortest code, we prefer longest.
    return toAlpha3Code(code.replace('-', '_')) || code;
  };

  // Chrome, Mozilla and Safari
  const browserLangs = window.navigator.languages;
  if (browserLangs) {
    for (let i = 0; i < browserLangs.length; ++i) {
      const isoLang = convertBCP47LangCode(browserLangs[i]);
      if (validSrcLang(isoLang)) {
        return isoLang;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { navigator }: { navigator: { userlanguage?: string; browserlanguage?: string; language?: string } } = window;
  const ieLang = navigator.userlanguage || navigator.browserlanguage || navigator.language;
  if (ieLang) {
    const ieIsoLang = convertBCP47LangCode(ieLang);
    if (validSrcLang(ieIsoLang)) {
      return ieIsoLang;
    } else if (validSrcLang(parentLang(ieIsoLang))) {
      return parentLang(ieIsoLang);
    }
  }

  // Fallback to first available overall pair.
  for (const srcLang in pairs) {
    return srcLang;
  }

  throw new Error('No pairs available');
};

const urlFromMode = (mode: Mode): string => {
  switch (mode) {
    case Mode.Text:
      return generatePath(TextTranslationPath);
    case Mode.Document:
      return generatePath(DocTranslationPath);
    case Mode.Webpage:
      return generatePath(WebpageTranslationPath);
  }
};

type WithSrcLangsProps = {
  srcLang: string;
  setSrcLang: (lang: string) => void;
  recentSrcLangs: Array<string>;
  setRecentSrcLangs: (langs: Array<string>) => void;
  detectedLang: string | null;
  setDetectedLang: (lang: string | null) => void;
};

const WithSrcLang = ({
  pairs,
  mode,
  urlSrcLang,
  children,
}: {
  pairs: Pairs;
  mode: Mode;
  urlSrcLang: string | null;
  children: (props: WithSrcLangsProps) => React.ReactElement;
}): React.ReactElement => {
  const [srcLang, realSetSrcLang] = useLocalStorage<string>('srcLang', () => defaultSrcLang(pairs), {
    overrideValue: urlSrcLang,
    validateValue: (l) => l in pairs,
  });

  const [recentSrcLangs, setRecentSrcLangs] = useLocalStorage<Array<string>>(
    'recentSrcLangs',
    () => {
      const langs = new Set([srcLang]);
      for (const lang of SrcLangs) {
        if (langs.size === recentLangsCount) {
          break;
        }
        langs.add(lang);
      }
      return Array.from(langs);
    },
    {
      validateValue: (ls) => ls.length === recentLangsCount && ls.every((l) => l in pairs) && ls.includes(srcLang),
    },
  );

  const setSrcLang = React.useCallback(
    (lang: string) => {
      realSetSrcLang(lang);
      if (!recentSrcLangs.includes(lang)) {
        setRecentSrcLangs([lang, ...recentSrcLangs].slice(0, recentLangsCount));
      }
    },
    [realSetSrcLang, recentSrcLangs, setRecentSrcLangs],
  );

  const [detectedLang, realSetDetectedLang] = React.useState<string | null>(null);

  const setDetectedLang = React.useCallback(
    (lang: string | null) => {
      realSetDetectedLang(lang);
      if (lang) {
        setSrcLang(lang);
      }
    },
    [setSrcLang],
  );

  React.useEffect(() => {
    if (mode !== Mode.Text) {
      setDetectedLang(null);
    }
  }, [mode, setDetectedLang]);

  return children({ srcLang, setSrcLang, recentSrcLangs, setRecentSrcLangs, detectedLang, setDetectedLang });
};

type WithTgtLangsProps = {
  tgtLang: string;
  setTgtLang: (lang: string) => void;
  recentTgtLangs: Array<string>;
  setRecentTgtLangs: (langs: Array<string>) => void;
  pairPrefs: PairPrefValues;
  setPairPrefs: (prefs: PairPrefValues) => void;
};

const WithTgtLang = ({
  pairs,
  srcLang,
  urlTgtLang,
  selectedPrefs,
  setSelectedPrefs,
  children,
}: {
  pairs: Pairs;
  srcLang: string;
  urlTgtLang: string | null;
  selectedPrefs: Record<string, PairPrefValues>;
  setSelectedPrefs: (prefs: Record<string, PairPrefValues>) => void;
  children: (props: WithTgtLangsProps) => React.ReactElement;
}): React.ReactElement => {
  const [tgtLang, realSetTgtLang] = useLocalStorage<string>(
    'tgtLang',
    () => pairs[srcLang].values().next().value as string,
    {
      overrideValue: urlTgtLang,
      validateValue: (l) => pairs[srcLang].has(l),
    },
  );

  const [recentTgtLangs, setRecentTgtLangs] = useLocalStorage<Array<string>>(
    'recentTgtLangs',
    () => {
      const langs = new Set([tgtLang]);
      for (const lang of pairs[srcLang].values()) {
        if (langs.size === recentLangsCount) {
          break;
        }
        langs.add(lang);
      }
      for (const lang of TgtLangs) {
        if (langs.size === recentLangsCount) {
          break;
        }
        langs.add(lang);
      }
      return Array.from(langs);
    },
    {
      validateValue: (ls) =>
        ls.length === recentLangsCount && ls.some((l) => isPair(pairs, srcLang, l)) && ls.includes(tgtLang),
    },
  );

  const setTgtLang = React.useCallback(
    (lang: string) => {
      realSetTgtLang(lang);
      if (!recentTgtLangs.includes(lang)) {
        setRecentTgtLangs([lang, ...recentTgtLangs].slice(0, recentLangsCount));
      }
    },
    [realSetTgtLang, recentTgtLangs, setRecentTgtLangs],
  );

  React.useEffect(() => {
    // This will happen in a couple situations:
    // 1. User changes source language and current target no longer works.
    // 2. User disables chained translation.
    if (!isPair(pairs, srcLang, tgtLang)) {
      // Prefer a recently selected target language.
      for (const recentTgtLang of recentTgtLangs) {
        if (isPair(pairs, srcLang, recentTgtLang)) {
          return setTgtLang(recentTgtLang);
        }
      }

      // Otherwise, pick the first possible target language.
      setTgtLang((pairs[srcLang] || new Set()).values().next().value);
    }
  }, [pairs, recentTgtLangs, setTgtLang, srcLang, tgtLang]);

  const pair = `${srcLang}-${tgtLang}`;
  const pairPrefs = selectedPrefs[pair] || {};
  const setPairPrefs = React.useCallback(
    (prefs: PairPrefValues) => {
      setSelectedPrefs({ ...selectedPrefs, [pair]: prefs });
    },
    [pair, selectedPrefs, setSelectedPrefs],
  );

  return children({ tgtLang, setTgtLang, recentTgtLangs, setRecentTgtLangs, pairPrefs, setPairPrefs });
};

const Translator = ({ mode: initialMode }: { mode?: Mode }): React.ReactElement => {
  const mode: Mode = initialMode || Mode.Text;

  const { t } = useLocalization();
  const history = useHistory();
  const config = React.useContext(ConfigContext);

  const [loading, setLoading] = React.useState(false);

  const [markUnknown, setMarkUnknown] = useLocalStorage('markUnknown', false);
  const [instantTranslation, setInstantTranslation] = useLocalStorage('instantTranslation', true);
  const [translationChaining, setTranslationChaining] = useLocalStorage('translationChaining', false, {
    validateValue: () => config.translationChaining,
  });

  const [selectedPrefs, setSelectedPrefs] = useLocalStorage<Record<string, PairPrefValues>>('translationPrefs', {});

  const pairs = translationChaining && mode === Mode.Text ? ChainedPairs : DirectPairs;

  let urlSrcLang = null;
  let urlTgtLang: string | null = null;
  const urlParamPair = getUrlParam(history.location.search, pairUrlParam);
  if (urlParamPair) {
    const [src, tgt] = urlParamPair.split('-', 2).map(toAlpha3Code);
    if (src && tgt && isPair(pairs, src, tgt)) {
      urlSrcLang = src;
      urlTgtLang = tgt;
    }
  }

  const onTranslate = React.useCallback(() => window.dispatchEvent(new Event(TranslateEvent)), []);

  return (
    <Form
      aria-label={t('Translate')}
      onSubmit={(event) => {
        window.dispatchEvent(new Event(TranslateEvent));
        event.preventDefault();
      }}
    >
      <WithSrcLang {...{ mode, pairs, urlSrcLang }}>
        {({
          srcLang,
          recentSrcLangs,
          setSrcLang,
          setRecentSrcLangs,
          detectedLang,
          setDetectedLang,
        }: WithSrcLangsProps) => (
          <WithTgtLang {...{ pairs, srcLang, urlTgtLang, selectedPrefs, setSelectedPrefs }}>
            {({ tgtLang, setTgtLang, recentTgtLangs, pairPrefs, setPairPrefs }: WithTgtLangsProps) => (
              <>
                <LanguageSelector
                  detectLangEnabled={mode === Mode.Text}
                  onTranslate={onTranslate}
                  {...{
                    pairs,
                    recentSrcLangs,
                    recentTgtLangs,
                    setDetectedLang,
                    setSrcLang,
                    setRecentSrcLangs,
                    setTgtLang,
                    srcLang,
                    tgtLang,
                    detectedLang,
                    loading,
                  }}
                />
                {(mode === Mode.Text || !mode) && (
                  <>
                    <TextTranslationForm
                      {...{ instantTranslation, markUnknown, setLoading, srcLang, tgtLang, pairPrefs }}
                    />
                    <Row className="mt-2 mb-3">
                      <Col className="d-flex d-sm-block flex-wrap translation-modes" md="6" xs="12">
                        <Button
                          className="mb-2"
                          onClick={() => history.push(urlFromMode(Mode.Document))}
                          variant="secondary"
                        >
                          <FontAwesomeIcon icon={faFile} /> {t('Translate_Document')}
                        </Button>
                        <Button
                          className="mb-2"
                          onClick={() => history.push(urlFromMode(Mode.Webpage))}
                          variant="secondary"
                        >
                          <FontAwesomeIcon icon={faLink} /> {t('Translate_Webpage')}
                        </Button>
                      </Col>
                      <Col
                        className="form-check d-flex flex-column align-items-end justify-content-start w-auto"
                        md="6"
                        xs="12"
                      >
                        <TranslationOptions
                          {...{
                            srcLang,
                            tgtLang,
                            markUnknown,
                            setMarkUnknown,
                            instantTranslation,
                            setInstantTranslation,
                            translationChaining,
                            setTranslationChaining,
                            pairPrefs,
                            setPairPrefs,
                          }}
                        />
                      </Col>
                    </Row>
                  </>
                )}
                {mode === Mode.Document && (
                  <DocTranslationForm
                    onCancel={() => history.push(urlFromMode(Mode.Text))}
                    setLoading={setLoading}
                    srcLang={srcLang}
                    tgtLang={tgtLang}
                  />
                )}
                {mode === Mode.Webpage && (
                  <WebpageTranslationForm
                    onCancel={() => history.push(urlFromMode(Mode.Text))}
                    setLoading={setLoading}
                    srcLang={srcLang}
                    tgtLang={tgtLang}
                  />
                )}
              </>
            )}
          </WithTgtLang>
        )}
      </WithSrcLang>
    </Form>
  );
};

export default Translator;
