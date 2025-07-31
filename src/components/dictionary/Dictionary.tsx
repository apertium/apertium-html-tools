import * as React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { CancelTokenSource } from 'axios';
import { isPair, Pairs } from '../translator';
import LanguageSelector from '../translator/LanguageSelector';
import { toAlpha3Code } from '../../util/languages';
import useLocalStorage from '../../util/useLocalStorage';
import { getUrlParam } from '../../util/url';
import { APyContext } from '../../context';
import CombinedWord, { Entry } from './CombinedWord';
import { useLocalization } from '../../util/localization';

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
    validateValue: (ls) => Array.isArray(ls) && ls.every((l) => l in pairs),
  });
  const setSrcLang = React.useCallback(
    (lang: string) => {
      rawSetSrcLang(lang);
      rawSetRecentSrcLangs((prev) => Array.from(new Set([lang, ...prev])).slice(0, recentLangsCount));
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
    validateValue: (ls) => Array.isArray(ls) && ls.every((l) => isPair(pairs, srcLang, l)),
  });
  const setTgtLang = React.useCallback(
    (lang: string) => {
      rawSetTgtLang(lang);
      rawSetRecentTgtLangs((prev) => Array.from(new Set([lang, ...prev])).slice(0, recentLangsCount));
    },
    [rawSetTgtLang, rawSetRecentTgtLangs],
  );
  React.useEffect(() => {
    if (!isPair(pairs, srcLang, tgtLang)) {
      const fallback = recentTgtLangs.find((l) => isPair(pairs, srcLang, l));
      const newTgt = fallback || (pairs[srcLang] ? Array.from(pairs[srcLang])[0] : '');
      if (newTgt && newTgt !== tgtLang) setTgtLang(newTgt);
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
      .catch((err) => console.error('Error loading pairs:', err))
      .finally(() => {
        setLoadingPairs(false);
        fetchRef.current = null;
      });
    return () => fetchRef.current?.cancel();
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
            const [searched, setSearched] = React.useState(false);
            const searchRef = React.useRef<CancelTokenSource | null>(null);
            const [results, setResults] = React.useState<{ head: string; defs: string[] }[]>([]);
            const [reverseResults, setReverseResults] = React.useState<{ head: string; defs: string[] }[]>([]);
            const [embeddingResults, setEmbeddingResults] = React.useState<{ head: string; defs: string[] }[]>([]);

            React.useEffect(() => {
              setResults([]);
              setReverseResults([]);
              setEmbeddingResults([]);
              setSearched(false);
            }, [srcLang, tgtLang]);

            React.useEffect(() => {
              const url = new URL(window.location.href);
              const trimmed = searchWord.trim();
              if (trimmed) url.searchParams.set('q', trimmed);
              else url.searchParams.delete('q');
              url.searchParams.set('langpair', `${srcLang}-${tgtLang}`);
              url.hash = '';
              window.history.replaceState(null, '', url.toString());
            }, [searchWord, srcLang, tgtLang]);

            const handleSearch = React.useCallback(
              async (wordOverride?: string, srcOverride: string = srcLang, tgtOverride: string = tgtLang) => {
                const word = (wordOverride ?? searchWord).trim();
                if (!word) return;

                setSearched(true);
                searchRef.current?.cancel();
                setLoading(true);
                setResults([]);
                setReverseResults([]);
                setEmbeddingResults([]);

                const [, reqFwd] = apyFetch('billookup', {
                  q: `${word}<*>`,
                  langpair: `${srcOverride}|${tgtOverride}`,
                });
                const [, reqRev] = apyFetch('billookup', {
                  q: `${word}<*>`,
                  langpair: `${tgtOverride}|${srcOverride}`,
                });

                let revParsed: { head: string; defs: string[] }[] = [];

                const parse = (resp: any) => {
                  const raw = resp.data.responseData?.lookupResults ?? resp.data.responseData?.searchResults ?? [];
                  return (raw as Array<Record<string, string[]>>).flatMap((o) =>
                    Object.entries(o).map(([head, defs]) => ({ head, defs })),
                  );
                };

                try {
                  const [respFwd, respRev] = await Promise.all([reqFwd, reqRev]);
                  const fwdParsed = parse(respFwd);
                  setResults(fwdParsed);

                  revParsed = parse(respRev).flatMap(({ head, defs }) =>
                    defs.map((d) => ({ head: d.replace(/^\s*\d+\.\s*/, ''), defs: [head] })),
                  );
                  const uniqueHeads = Array.from(new Set(revParsed.map((r) => r.head)));
                  const headResponses = await Promise.all(
                    uniqueHeads.map((h) =>
                      apyFetch('bilsearch', { q: h, langpair: `${srcOverride}|${tgtOverride}` })[1].then(parse),
                    ),
                  );
                  const enriched: Record<string, string[]> = {};
                  headResponses.forEach((arr, i) => {
                    enriched[uniqueHeads[i]] = Array.from(
                      new Set(arr.flatMap((item) => item.defs.map((d) => d.replace(/<[^>]+>/g, '').trim()))),
                    );
                  });
                  setReverseResults(uniqueHeads.map((h) => ({ head: h, defs: enriched[h] })));

                  const exactItem = fwdParsed.find((item) => item.head.replace(/<[^>]+>/g, '') === word);
                  const translations = exactItem?.defs.map((d) => d.replace(/<[^>]+>/g, '').trim()) || [];
                  const embArrays = await Promise.all(
                    translations.map((term) =>
                      apyFetch('embeddings', { q: term, langpair: `${tgtOverride}|${srcOverride}` })[1].then(
                        (res) =>
                          res.data.responseData?.embeddingResults.flatMap((obj: any) => Object.values(obj).flat()) ||
                          [],
                      ),
                    ),
                  );
                  const sims = Array.from(new Set(embArrays.flat())).filter((sim) => !sim.startsWith('*'));
                  const embResponses = await Promise.all(
                    sims.map((sim) => apyFetch('bilsearch', { q: sim, langpair: `${tgtOverride}|${srcOverride}` })[1]),
                  );
                  let embEntries: Entry[] = [];
                  embResponses.forEach((resp) => {
                    const raw = resp.data.responseData?.searchResults ?? [];
                    (raw as Array<Record<string, string[]>>).forEach((o) => {
                      Object.entries(o).forEach(([hd, defs]) => {
                        defs.forEach((def) => {
                          embEntries.push({ head: def, defs: [hd] });
                        });
                      });
                    });
                  });
                  setEmbeddingResults(embEntries);
                } catch {
                  setReverseResults(revParsed);
                } finally {
                  setLoading(false);
                  searchRef.current = null;
                }
              },
              [apyFetch, searchWord, srcLang, tgtLang],
            );

            const grouped: Record<string, Entry[]> = React.useMemo(() => {
              const all: Entry[] = [
                ...results.map((r) => ({ head: r.head, defs: r.defs })),
                ...reverseResults.map((r) => ({ head: r.head, defs: r.defs })),
                ...embeddingResults.map((e) => ({ head: e.head, defs: e.defs })),
              ];
              const map: Record<string, Entry[]> = {};
              all.forEach((e) => {
                const surface = e.head.replace(/<[^>]+>/g, '');
                if (!map[surface]) map[surface] = [];
                map[surface].push({
                  head: e.head,
                  defs: e.defs.map((d) => d.replace(/<[^>]+>/g, '')),
                });
              });
              return map;
            }, [results, reverseResults, embeddingResults]);

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
                  onTranslate={() => handleSearch()}
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
                  <Button onClick={() => handleSearch()} variant="primary" size="sm">
                    {t('Search')}
                  </Button>
                </div>
                <div className="mt-3">
                  {Object.entries(grouped)
                    .sort(([a], [b]) => {
                      if (a === searchWord && b !== searchWord) return -1;
                      if (b === searchWord && a !== searchWord) return 1;
                      return 0;
                    })
                    .map(([surface, entries]) => (
                      <CombinedWord
                        key={surface}
                        surface={surface}
                        entries={entries}
                        lang={srcLang}
                        onDefinitionClick={(def) => {
                          setSearchWord(def);
                          setSrcLang(tgtLang);
                          setTgtLang(srcLang);
                          handleSearch(def, tgtLang, srcLang);
                        }}
                      />
                    ))}
                  {searched && !loading && Object.keys(grouped).length === 0 && (
                    <div className="text-center text-muted mt-3">{t('No_results_found')}</div>
                  )}
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
