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
  const [detectedLang, setDetectedLang] = React.useState<string | null>(null);
  const setDetectedLangCb = React.useCallback(
    (lang: string | null) => {
      setDetectedLang(lang);
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
    setDetectedLang: setDetectedLangCb,
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
  const embeddingModesPromiseRef = React.useRef<Promise<Set<string>> | null>(null);

  const loadEmbeddingModes = React.useCallback(async (): Promise<Set<string>> => {
    if (!embeddingModesPromiseRef.current) {
      embeddingModesPromiseRef.current = (async () => {
        try {
          const [, listReq] = apyFetch('list', { q: 'embeddings' });
          const listRes = await listReq;
          const respData = listRes.data.responseData;
          const modes: string[] = [];
          if (Array.isArray(respData)) {
            respData.forEach((item) => {
              if (typeof item === 'string' && item.includes('|')) {
                modes.push(item);
              } else if (item && typeof item === 'object') {
                const s = (item as any).sourceLanguage;
                const tLang = (item as any).targetLanguage;
                if (typeof s === 'string' && typeof tLang === 'string') {
                  modes.push(`${s}|${tLang}`);
                }
              }
            });
          } else if (respData && typeof respData === 'object') {
            const maybe = (respData as any).embeddingModes ?? (respData as any).availableEmbeddings;
            if (Array.isArray(maybe)) {
              maybe.forEach((item) => {
                if (typeof item === 'string' && item.includes('|')) {
                  modes.push(item);
                } else if (item && typeof item === 'object') {
                  const s = (item as any).sourceLanguage;
                  const tLang = (item as any).targetLanguage;
                  if (typeof s === 'string' && typeof tLang === 'string') {
                    modes.push(`${s}|${tLang}`);
                  }
                }
              });
            }
          }
          return new Set(modes);
        } catch {
          return new Set<string>();
        }
      })();
    }
    return embeddingModesPromiseRef.current!;
  }, [apyFetch]);

  const chooseEmbeddingMode = React.useCallback(
    async (src: string, tgt: string): Promise<string | null> => {
      const modesSet = await loadEmbeddingModes();
      const forward = `${src}|${tgt}`;
      const reverse = `${tgt}|${src}`;
      if (modesSet.has(forward)) return forward;
      if (modesSet.has(reverse)) return reverse;
      return null;
    },
    [loadEmbeddingModes],
  );

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
            const [results, setResults] = React.useState<Entry[]>([]);
            const [reverseResults, setReverseResults] = React.useState<Entry[]>([]);
            const [embeddingResults, setEmbeddingResults] = React.useState<Entry[]>([]);

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
                const rawWord = (wordOverride ?? searchWord).trim();
                if (!rawWord) return;

                setSearched(true);
                searchRef.current?.cancel();
                setLoading(true);
                setResults([]);
                setReverseResults([]);
                setEmbeddingResults([]);

                const [, reqFwd] = apyFetch('billookup', {
                  q: `${rawWord}<*>`,
                  langpair: `${srcOverride}|${tgtOverride}`,
                });
                const [, reqRev] = apyFetch('billookup', {
                  q: `${rawWord}<*>`,
                  langpair: `${tgtOverride}|${srcOverride}`,
                });

                let revParsed: Entry[] = [];

                const parse = (resp: any): Entry[] => {
                  const raw = resp.data.responseData?.lookupResults ?? resp.data.responseData?.searchResults ?? [];
                  return (raw as Array<Record<string, any>>).flatMap((o) => {
                    const extraTagsArr: string[] = Array.isArray(o['extra-tags']) ? o['extra-tags'] : [];
                    return Object.entries(o)
                      .filter(([head]) => head !== 'extra-tags')
                      .map(
                        ([head, defs]) =>
                          ({
                            head,
                            defs,
                            extraTags: extraTagsArr,
                          } as Entry),
                      );
                  });
                };

                try {
                  const [respFwd, respRev] = await Promise.all([reqFwd, reqRev]);
                  const fwdParsed = parse(respFwd);
                  setResults(fwdParsed);

                  const reverseRaw = parse(respRev);
                  revParsed = reverseRaw.flatMap(({ head, defs }) =>
                    defs.map((d) => ({ head: d.replace(/^\s*\d+\.\s*/, ''), defs: [head] } as Entry)),
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
                      new Set(
                        arr.flatMap((item) => item.defs.map((d) => d.replace(/<[^>]+>/g, '').trim())).filter(Boolean),
                      ),
                    );
                  });
                  setReverseResults(uniqueHeads.map((h) => ({ head: h, defs: enriched[h] } as Entry)));

                  const cleanedWord = rawWord
                    .replace(/<[^>]+>/g, '')
                    .trim()
                    .toLowerCase();
                  const exactForward = fwdParsed.find(
                    (item) =>
                      item.head
                        .replace(/<[^>]+>/g, '')
                        .trim()
                        .toLowerCase() === cleanedWord,
                  );
                  const exactReverse = reverseRaw.find(
                    (item) =>
                      item.head
                        .replace(/<[^>]+>/g, '')
                        .trim()
                        .toLowerCase() === cleanedWord,
                  );

                  let headerTerm: string | null = null;
                  let translations: string[] = [];
                  let headLang: string = srcOverride;
                  let translationLang: string = tgtOverride;
                  let exactMatchFound = false;

                  if (exactForward) {
                    headerTerm = exactForward.head.replace(/<[^>]+>/g, '').trim();
                    translations = exactForward.defs.map((d) => d.replace(/<[^>]+>/g, '').trim());
                    headLang = srcOverride;
                    translationLang = tgtOverride;
                    exactMatchFound = true;
                  } else if (exactReverse) {
                    headerTerm = exactReverse.head.replace(/<[^>]+>/g, '').trim();
                    translations = exactReverse.defs.map((d) => d.replace(/<[^>]+>/g, '').trim());
                    headLang = tgtOverride;
                    translationLang = srcOverride;
                    exactMatchFound = true;
                  }

                  if (!exactMatchFound) {
                    const modesSet = await loadEmbeddingModes();
                    const forwardMode = `${srcOverride}|${tgtOverride}`;
                    const reverseMode = `${tgtOverride}|${srcOverride}`;
                    const availableModes: string[] = [];
                    if (modesSet.has(forwardMode)) availableModes.push(forwardMode);
                    if (modesSet.has(reverseMode)) availableModes.push(reverseMode);
                    if (availableModes.length === 0) {
                      setEmbeddingResults([]);
                    } else {
                      type Job = { term: string; embeddingMode: string; termLang: string };
                      const jobs: Job[] = availableModes.map((mode) => ({
                        term: rawWord,
                        embeddingMode: mode,
                        termLang: srcOverride,
                      }));
                      const jobResults: Array<{
                        term: string;
                        embeddingMode: string;
                        sims: string[];
                        termLang: string;
                      }> = [];
                      await Promise.all(
                        jobs.map(async (job) => {
                          const simsSet = new Set<string>();
                          const [, embReq] = apyFetch('embeddings', {
                            q: job.term,
                            langpair: job.embeddingMode,
                          });
                          try {
                            const embRes = await embReq;
                            const sims: string[] =
                              embRes.data.responseData?.embeddingResults?.flatMap((obj: any) =>
                                Object.values(obj).flat(),
                              ) || [];
                            sims.forEach((s) => {
                              if (!s.startsWith('*')) simsSet.add(s);
                            });
                          } catch {}
                          jobResults.push({
                            term: job.term,
                            embeddingMode: job.embeddingMode,
                            sims: Array.from(simsSet),
                            termLang: job.termLang,
                          });
                        }),
                      );
                      const simsByMode: Record<string, string[]> = {};
                      jobResults.forEach(({ embeddingMode, sims }) => {
                        if (!simsByMode[embeddingMode]) simsByMode[embeddingMode] = [];
                        sims.forEach((s) => {
                          if (!simsByMode[embeddingMode].includes(s)) simsByMode[embeddingMode].push(s);
                        });
                      });
                      const bilsearchParsed: Record<string, Record<string, Entry[]>> = {};
                      await Promise.all(
                        Object.entries(simsByMode).map(async ([mode, sims]) => {
                          bilsearchParsed[mode] = {};
                          await Promise.all(
                            sims.map(async (sim) => {
                              const [, bsReq] = apyFetch('bilsearch', { q: sim, langpair: mode });
                              try {
                                const resp = await bsReq;
                                const raw = resp.data.responseData?.searchResults ?? [];
                                const parsed = (raw as Array<Record<string, any>>).flatMap((o) =>
                                  Object.entries(o)
                                    .filter(([head]) => head !== 'extra-tags')
                                    .map(
                                      ([hd, defs]) =>
                                        ({
                                          head: hd,
                                          defs,
                                          extraTags: Array.isArray(o['extra-tags']) ? o['extra-tags'] : [],
                                        } as Entry),
                                    ),
                                );
                                bilsearchParsed[mode][sim] = parsed;
                              } catch {
                                bilsearchParsed[mode][sim] = [];
                              }
                            }),
                          );
                        }),
                      );
                      const embEntries: Entry[] = [];
                      jobResults.forEach(({ embeddingMode, sims, termLang, term }) => {
                        const [embedSourceLang] = embeddingMode.split('|');
                        const isReverseEmbeddingMode = embeddingMode === `${tgtOverride}|${srcOverride}`;
                        const displaySimilarTo = term;
                        sims.forEach((sim) => {
                          const parsed = bilsearchParsed[embeddingMode]?.[sim] || [];
                          parsed.forEach(({ head: bilHead, defs }) => {
                            defs.forEach((def) => {
                              if (isReverseEmbeddingMode) {
                                embEntries.push({
                                  head: def,
                                  defs: [bilHead],
                                  similarTo: displaySimilarTo,
                                } as Entry);
                              } else {
                                embEntries.push({
                                  head: bilHead,
                                  defs: [def],
                                  similarTo: displaySimilarTo,
                                } as Entry);
                              }
                            });
                          });
                        });
                      });
                      setEmbeddingResults(embEntries);
                    }
                  } else {
                    const modesSet = await loadEmbeddingModes();
                    const termLang: Record<string, string> = {};
                    if (headerTerm) termLang[headerTerm] = headLang;
                    translations.forEach((tr) => {
                      termLang[tr] = translationLang;
                    });
                    type Job = { term: string; termLang: string; embeddingMode: string };
                    const jobsMap = new Map<string, Job>();
                    const forwardMode = `${srcOverride}|${tgtOverride}`;
                    const reverseMode = `${tgtOverride}|${srcOverride}`;
                    if (headerTerm) {
                      if (termLang[headerTerm] === srcOverride && modesSet.has(forwardMode)) {
                        const key = `${headerTerm}|${forwardMode}`;
                        jobsMap.set(key, {
                          term: headerTerm,
                          termLang: termLang[headerTerm],
                          embeddingMode: forwardMode,
                        });
                      }
                      if (termLang[headerTerm] === tgtOverride && modesSet.has(reverseMode)) {
                        const key = `${headerTerm}|${reverseMode}`;
                        jobsMap.set(key, {
                          term: headerTerm,
                          termLang: termLang[headerTerm],
                          embeddingMode: reverseMode,
                        });
                      }
                    }
                    translations.forEach((tr) => {
                      if (termLang[tr] === srcOverride && modesSet.has(forwardMode)) {
                        const key = `${tr}|${forwardMode}`;
                        jobsMap.set(key, { term: tr, termLang: termLang[tr], embeddingMode: forwardMode });
                      }
                      if (termLang[tr] === tgtOverride && modesSet.has(reverseMode)) {
                        const key = `${tr}|${reverseMode}`;
                        jobsMap.set(key, { term: tr, termLang: termLang[tr], embeddingMode: reverseMode });
                      }
                    });
                    const jobs = Array.from(jobsMap.values());
                    const jobResults: Array<{ term: string; embeddingMode: string; sims: string[]; termLang: string }> =
                      [];
                    await Promise.all(
                      jobs.map(async (job) => {
                        const simsSet = new Set<string>();
                        const [, embReq] = apyFetch('embeddings', {
                          q: job.term,
                          langpair: job.embeddingMode,
                        });
                        try {
                          const embRes = await embReq;
                          const sims: string[] =
                            embRes.data.responseData?.embeddingResults?.flatMap((obj: any) =>
                              Object.values(obj).flat(),
                            ) || [];
                          sims.forEach((s) => {
                            if (!s.startsWith('*')) simsSet.add(s);
                          });
                        } catch {}
                        jobResults.push({
                          term: job.term,
                          embeddingMode: job.embeddingMode,
                          sims: Array.from(simsSet),
                          termLang: job.termLang,
                        });
                      }),
                    );
                    const simsByMode: Record<string, string[]> = {};
                    jobResults.forEach(({ embeddingMode, sims }) => {
                      if (!simsByMode[embeddingMode]) simsByMode[embeddingMode] = [];
                      sims.forEach((s) => {
                        if (!simsByMode[embeddingMode].includes(s)) simsByMode[embeddingMode].push(s);
                      });
                    });
                    const bilsearchParsed: Record<string, Record<string, Entry[]>> = {};
                    await Promise.all(
                      Object.entries(simsByMode).map(async ([mode, sims]) => {
                        bilsearchParsed[mode] = {};
                        await Promise.all(
                          sims.map(async (sim) => {
                            const [, bsReq] = apyFetch('bilsearch', { q: sim, langpair: mode });
                            try {
                              const resp = await bsReq;
                              const raw = resp.data.responseData?.searchResults ?? [];
                              const parsed = (raw as Array<Record<string, any>>).flatMap((o) =>
                                Object.entries(o)
                                  .filter(([head]) => head !== 'extra-tags')
                                  .map(
                                    ([hd, defs]) =>
                                      ({
                                        head: hd,
                                        defs,
                                        extraTags: Array.isArray(o['extra-tags']) ? o['extra-tags'] : [],
                                      } as Entry),
                                  ),
                              );
                              bilsearchParsed[mode][sim] = parsed;
                            } catch {
                              bilsearchParsed[mode][sim] = [];
                            }
                          }),
                        );
                      }),
                    );
                    const embEntries: Entry[] = [];
                    jobResults.forEach(({ embeddingMode, sims, termLang, term }) => {
                      const [embedSourceLang] = embeddingMode.split('|');
                      const isReverseEmbeddingMode = embeddingMode === `${tgtOverride}|${srcOverride}`;
                      const getEquivalentInLang = (orig: string, fromLang: string, toLang: string): string => {
                        if (fromLang === toLang) return orig;
                        if (headerTerm) {
                          if (fromLang === headLang && toLang === translationLang) {
                            return translations[0] || orig;
                          }
                          if (fromLang === translationLang && toLang === headLang) {
                            return headerTerm;
                          }
                        }
                        return orig;
                      };
                      const displaySimilarTo = getEquivalentInLang(term, termLang, embedSourceLang);
                      sims.forEach((sim) => {
                        const parsed = bilsearchParsed[embeddingMode]?.[sim] || [];
                        parsed.forEach(({ head: bilHead, defs }) => {
                          defs.forEach((def) => {
                            if (isReverseEmbeddingMode) {
                              embEntries.push({
                                head: def,
                                defs: [bilHead],
                                similarTo: displaySimilarTo,
                              } as Entry);
                            } else {
                              embEntries.push({
                                head: bilHead,
                                defs: [def],
                                similarTo: displaySimilarTo,
                              } as Entry);
                            }
                          });
                        });
                      });
                    });
                    setEmbeddingResults(embEntries);
                  }
                } catch {
                  setReverseResults(revParsed);
                } finally {
                  setLoading(false);
                  searchRef.current = null;
                }
              },
              [apyFetch, searchWord, srcLang, tgtLang, chooseEmbeddingMode, loadEmbeddingModes],
            );

            const grouped: Record<string, Entry[]> = React.useMemo(() => {
              const all: Entry[] = [...results, ...reverseResults, ...embeddingResults];
              const map: Record<string, Entry[]> = {};
              all.forEach((e) => {
                const surface = e.head.replace(/<[^>]+>/g, '');
                if (!map[surface]) map[surface] = [];
                map[surface].push({
                  head: e.head,
                  defs: e.defs.map((d) => d.replace(/<[^>]+>/g, '')),
                  ...(e.similarTo ? { similarTo: e.similarTo } : {}),
                  ...(e.extraTags ? { extraTags: e.extraTags } : {}),
                } as Entry);
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
                        searchWord={searchWord}
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
