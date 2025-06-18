import * as React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import { DirectPairs, isPair, SrcLangs, TgtLangs } from './translator';
import LanguageSelector from './translator/LanguageSelector';
import { toAlpha3Code, parentLang } from '../util/languages';
import useLocalStorage from '../util/useLocalStorage';
import { getUrlParam } from '../util/url';
import { APyContext } from '../context';
import Word from './dictionary/Word';

import { useLocalization } from '../util/localization';

const recentLangsCount = 3;

const defaultSrcLang = (pairs: typeof DirectPairs): string => {
  for (const code of window.navigator.languages) {
    const iso = toAlpha3Code(code.replace('-', '_'));
    const parent = parentLang(iso);
    if (pairs[iso]) return iso;
    if (pairs[parent]) return parent;
  }
  return Object.keys(pairs)[0];
};

type WithSrcLangsProps = {
  srcLang: string;
  setSrcLang: (lang: string) => void;
  recentSrcLangs: string[];
  setRecentSrcLangs: (langs: string[]) => void;
  detectedLang: string | null;
  setDetectedLang: (lang: string | null) => void;
};

const WithSrcLang = ({
  pairs,
  urlSrcLang,
  children,
}: {
  pairs: typeof DirectPairs;
  urlSrcLang: string | null;
  children: (props: WithSrcLangsProps) => React.ReactElement;
}) => {
  const [srcLang, realSetSrc] = useLocalStorage<string>('srcLang', () => defaultSrcLang(pairs), {
    overrideValue: urlSrcLang,
    validateValue: (l) => l in pairs && pairs[l].size > 0,
  });

  const [recentSrcLangs, setRecentSrcLangs] = useLocalStorage<string[]>(
    'recentSrcLangs',
    () => [srcLang, ...SrcLangs].slice(0, recentLangsCount),
    {
      validateValue: (ls) => new Set(ls).size === recentLangsCount && ls.every((l) => l in pairs),
    },
  );

  const setSrcLang = React.useCallback(
    (lang: string) => {
      realSetSrc(lang);
      if (!recentSrcLangs.includes(lang)) {
        setRecentSrcLangs([lang, ...recentSrcLangs].slice(0, recentLangsCount));
      }
    },
    [realSetSrc, recentSrcLangs, setRecentSrcLangs],
  );

  const [detectedLang, realSetDetected] = React.useState<string | null>(null);
  const setDetectedLang = React.useCallback(
    (lang: string | null) => {
      realSetDetected(lang);
      if (lang) setSrcLang(lang);
    },
    [setSrcLang],
  );

  return children({
    srcLang,
    setSrcLang,
    recentSrcLangs,
    setRecentSrcLangs,
    detectedLang,
    setDetectedLang,
  });
};

type WithTgtLangsProps = {
  tgtLang: string;
  setTgtLang: (lang: string) => void;
  recentTgtLangs: string[];
};

const WithTgtLang = ({
  pairs,
  srcLang,
  urlTgtLang,
  children,
}: {
  pairs: typeof DirectPairs;
  srcLang: string;
  urlTgtLang: string | null;
  children: (props: WithTgtLangsProps) => React.ReactElement;
}) => {
  const [tgtLang, realSetTgt] = useLocalStorage<string>('tgtLang', () => Array.from(pairs[srcLang].values())[0], {
    overrideValue: urlTgtLang,
    validateValue: (l) => isPair(pairs, srcLang, l),
  });

  const [recentTgtLangs, setRecentTgtLangs] = useLocalStorage<string[]>(
    'recentTgtLangs',
    () => [tgtLang, ...pairs[srcLang].values(), ...TgtLangs].slice(0, recentLangsCount),
    {
      validateValue: (ls) => new Set(ls).size === recentLangsCount && ls.some((l) => isPair(pairs, srcLang, l)),
    },
  );

  const setTgtLang = React.useCallback(
    (lang: string) => {
      realSetTgt(lang);
      if (!recentTgtLangs.includes(lang)) {
        setRecentTgtLangs([lang, ...recentTgtLangs].slice(0, recentLangsCount));
      }
    },
    [recentTgtLangs, setRecentTgtLangs],
  );

  React.useEffect(() => {
    if (!isPair(pairs, srcLang, tgtLang)) {
      const fallback = recentTgtLangs.find((l) => isPair(pairs, srcLang, l));
      setTgtLang(fallback || Array.from(pairs[srcLang].values())[0]);
    }
  }, [srcLang, tgtLang]);

  return children({ tgtLang, setTgtLang, recentTgtLangs });
};

const Dictionary = (): React.ReactElement => {
  const { t } = useLocalization();
  const pairs = DirectPairs;
  const apyFetch = React.useContext(APyContext);

  const urlParamPair = getUrlParam(window.location.search, 'dir');
  let urlSrcLang: string | null = null,
    urlTgtLang: string | null = null;
  if (urlParamPair) {
    const [s, t] = urlParamPair.split('-', 2).map(toAlpha3Code);
    if (s && t && isPair(pairs, s, t)) {
      urlSrcLang = s;
      urlTgtLang = t;
    }
  }

  const [searchWord, setSearchWord] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const searchRef = React.useRef<CancelTokenSource | null>(null);
  const [results, setResults] = React.useState<{ head: string; defs: string[] }[]>([]);

  return (
    <WithSrcLang pairs={pairs} urlSrcLang={urlSrcLang}>
      {({ srcLang, setSrcLang, recentSrcLangs, setRecentSrcLangs, detectedLang, setDetectedLang }) => (
        <WithTgtLang pairs={pairs} srcLang={srcLang} urlTgtLang={urlTgtLang}>
          {({ tgtLang, setTgtLang, recentTgtLangs }) => {
            const handleSearch = React.useCallback(() => {
              if (!searchWord.trim()) return;

              searchRef.current?.cancel();
              const [ref, request] = apyFetch('bilsearch', {
                q: `${searchWord}<*>`,
                langpair: `${srcLang}|${tgtLang}`,
              });
              searchRef.current = ref;
              setLoading(true);
              setResults([]);

              void (async () => {
                try {
                  const resp = await request;
                  const sr = resp.data?.responseData?.searchResults || [];
                  const entries = sr.flatMap((obj: Record<string, string[]>) =>
                    Object.entries(obj).map(([head, defs]) => ({ head, defs })),
                  );
                  setResults(entries);
                } catch (err) {
                  // cancellation or other errors
                } finally {
                  setLoading(false);
                  searchRef.current = null;
                }
              })();
            }, [searchWord, srcLang, tgtLang, apyFetch]);

            return (
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
              >
                <LanguageSelector
                  layout="dictionary"
                  actionLabel={t('Search')}
                  detectLangEnabled
                  loading={loading}
                  pairs={pairs}
                  srcLang={srcLang}
                  setSrcLang={setSrcLang}
                  recentSrcLangs={recentSrcLangs}
                  setRecentSrcLangs={setRecentSrcLangs}
                  tgtLang={tgtLang}
                  setTgtLang={setTgtLang}
                  recentTgtLangs={recentTgtLangs}
                  onTranslate={handleSearch}
                  detectedLang={detectedLang}
                  setDetectedLang={setDetectedLang}
                />

                <Form.Group className="mt-3" controlId="searchWord">
                  <Form.Control
                    type="text"
                    placeholder={t('Type_A_Word')}
                    value={searchWord}
                    onChange={(e) => setSearchWord(e.target.value)}
                  />
                </Form.Group>

                <div className="d-flex justify-content-start mt-2">
                  <Button onClick={handleSearch} type="button" variant="primary" size="sm">
                    {t('Search')}
                  </Button>
                </div>

                <div className="mt-3">
                  {results.map(({ head, defs }, idx) => (
                    <Word key={idx} head={head} definitions={defs} />
                  ))}
                </div>
              </Form>
            );
          }}
        </WithTgtLang>
      )}
    </WithSrcLang>
  );
};

export default Dictionary;
