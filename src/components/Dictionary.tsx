import * as React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { CancelTokenSource } from 'axios';

import { isPair, Pairs } from './translator';
import LanguageSelector from './translator/LanguageSelector';
import { toAlpha3Code } from '../util/languages';
import useLocalStorage from '../util/useLocalStorage';
import { getUrlParam } from '../util/url';
import { APyContext } from '../context';
import Word from './dictionary/Word';
import { useLocalization } from '../util/localization';

const recentLangsCount = 3;

const defaultSrcLang = (pairs: Pairs): string => {
  const keys = Object.keys(pairs);
  return keys.length ? keys[0] : '';
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
  pairs: Pairs;
  urlSrcLang: string | null;
  children: (props: WithSrcLangsProps) => React.ReactElement;
}) => {
  const opts: any = { validateValue: (l: string) => l in pairs };
  if (urlSrcLang) opts.overrideValue = urlSrcLang;

  const [srcLang, rawSetSrcLang] = useLocalStorage<string>('dictSrcLang', () => defaultSrcLang(pairs), opts);

  const [recentSrcLangs, rawSetRecentSrcLangs] = useLocalStorage<string[]>('dictRecentSrcLangs', () => [srcLang], {
    validateValue: (ls: string[]) => Array.isArray(ls) && ls.every((l) => l in pairs),
  });

  const setSrcLang = React.useCallback(
    (lang: string) => {
      rawSetSrcLang(lang);
      rawSetRecentSrcLangs((prev) => {
        const combined = [lang, ...prev];
        const unique = Array.from(new Set(combined));
        return unique.slice(0, recentLangsCount);
      });
    },
    [rawSetSrcLang, rawSetRecentSrcLangs],
  );

  const [detectedLang, setDetected] = React.useState<string | null>(null);
  const setDetectedLang = React.useCallback(
    (lang: string | null) => {
      setDetected(lang);
      if (lang) setSrcLang(lang);
    },
    [setSrcLang],
  );

  return children({
    srcLang,
    setSrcLang,
    recentSrcLangs,
    setRecentSrcLangs: rawSetRecentSrcLangs,
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
  pairs: Pairs;
  srcLang: string;
  urlTgtLang: string | null;
  children: (props: WithTgtLangsProps) => React.ReactElement;
}) => {
  const opts: any = { validateValue: (l: string) => isPair(pairs, srcLang, l) };
  if (urlTgtLang) opts.overrideValue = urlTgtLang;

  const [tgtLang, rawSetTgtLang] = useLocalStorage<string>(
    'dictTgtLang',
    () => {
      const set = pairs[srcLang];
      return set ? Array.from(set)[0] : '';
    },
    opts,
  );

  const [recentTgtLangs, rawSetRecentTgtLangs] = useLocalStorage<string[]>('dictRecentTgtLangs', () => [tgtLang], {
    validateValue: (ls: string[]) => Array.isArray(ls) && ls.every((l) => isPair(pairs, srcLang, l)),
  });

  const setTgtLang = React.useCallback(
    (lang: string) => {
      rawSetTgtLang(lang);
      rawSetRecentTgtLangs((prev) => {
        const combined = [lang, ...prev];
        const unique = Array.from(new Set(combined));
        return unique.slice(0, recentLangsCount);
      });
    },
    [rawSetTgtLang, rawSetRecentTgtLangs],
  );

  React.useEffect(() => {
    if (!isPair(pairs, srcLang, tgtLang)) {
      const fallback = recentTgtLangs.find((l) => isPair(pairs, srcLang, l));
      const newTgt = fallback || (pairs[srcLang] ? Array.from(pairs[srcLang])[0] : '');
      if (newTgt && newTgt !== tgtLang) {
        setTgtLang(newTgt);
      }
    }
  }, [pairs, srcLang, tgtLang, recentTgtLangs, setTgtLang]);

  return children({ tgtLang, setTgtLang, recentTgtLangs });
};

const Dictionary: React.FC = () => {
  const { t } = useLocalization();
  const apyFetch = React.useContext(APyContext);

  const [pairs, setPairs] = React.useState<Pairs>({});
  const [loadingPairs, setLoadingPairs] = React.useState(true);
  const fetchRef = React.useRef<CancelTokenSource | null>(null);

  React.useEffect(() => {
    fetchRef.current?.cancel();
    const [ref, request] = apyFetch('list', { q: 'billookup' });
    fetchRef.current = ref;
    setLoadingPairs(true);

    request
      .then((resp) => {
        const arr: Array<{ sourceLanguage: string; targetLanguage: string }> = resp.data.responseData || [];
        const dict: Pairs = {};
        arr.forEach(({ sourceLanguage: s, targetLanguage: t }) => {
          if (!dict[s]) dict[s] = new Set<string>();
          dict[s].add(t);
        });
        setPairs(dict);
      })
      .catch((err) => {
        console.error('Error loading dictionary language pairs:', err);
      })
      .finally(() => {
        setLoadingPairs(false);
        fetchRef.current = null;
      });

    return () => {
      fetchRef.current?.cancel();
    };
  }, [apyFetch]);

  if (loadingPairs) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  const urlParam = getUrlParam(window.location.search, 'dir');
  let urlSrc: string | null = null;
  let urlTgt: string | null = null;
  if (urlParam) {
    const [s, t] = urlParam.split('-', 2).map(toAlpha3Code);
    if (s && t && isPair(pairs, s, t)) {
      urlSrc = s;
      urlTgt = t;
    }
  }

  return (
    <WithSrcLang pairs={pairs} urlSrcLang={urlSrc}>
      {({ srcLang, setSrcLang, recentSrcLangs, setRecentSrcLangs, detectedLang, setDetectedLang }) => (
        <WithTgtLang pairs={pairs} srcLang={srcLang} urlTgtLang={urlTgt}>
          {({ tgtLang, setTgtLang, recentTgtLangs }) => {
            const [searchWord, setSearchWord] = React.useState('');
            const [loading, setLoading] = React.useState(false);
            const searchRef = React.useRef<CancelTokenSource | null>(null);
            const [results, setResults] = React.useState<{ head: string; defs: string[] }[]>([]);

            const handleSearch = React.useCallback(() => {
              if (!searchWord.trim()) return;
              searchRef.current?.cancel();
              const [ref, req] = apyFetch('billookup', {
                q: `${searchWord}<*>`,
                langpair: `${srcLang}|${tgtLang}`,
              });
              searchRef.current = ref;
              setLoading(true);
              setResults([]);

              req
                .then((resp) => {
                  const sr = resp.data.responseData?.lookupResults || [];
                  const entries = sr.flatMap((o: Record<string, string[]>) =>
                    Object.entries(o).map(([head, defs]) => ({ head, defs })),
                  );
                  setResults(entries);
                })
                .catch(() => {
                  // ignore
                })
                .finally(() => {
                  setLoading(false);
                  searchRef.current = null;
                });
            }, [apyFetch, searchWord, srcLang, tgtLang]);

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
