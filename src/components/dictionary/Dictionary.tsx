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
import { useHistory } from 'react-router-dom';

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

const stripTagsAndHashes = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/#/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

const stripTagsLower = (s: string) => stripTagsAndHashes(s).toLowerCase();

const dedupeEmbeddingEntries = (entries: Entry[]): Entry[] => {
  const byKey = new Map<string, { head: string; def: string; sims: Set<string>; extraTags?: string[] }>();
  for (const e of entries) {
    const headKey = stripTagsLower(e.head);
    for (const d of e.defs) {
      const defKey = stripTagsLower(d);
      const key = `${headKey}|${defKey}`;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, {
          head: e.head,
          def: d,
          sims: new Set(e.similarTo ? [e.similarTo] : []),
          extraTags: e.extraTags,
        });
      } else {
        if (e.similarTo) existing.sims.add(e.similarTo);
        if (e.extraTags) {
          existing.extraTags = Array.from(new Set([...(existing.extraTags || []), ...e.extraTags]));
        }
      }
    }
  }
  const out: Entry[] = [];
  byKey.forEach(({ head, def, sims, extraTags }) => {
    const simList = Array.from(sims);
    const similarTo = simList.length ? simList.join(', ') : undefined;
    out.push({
      head,
      defs: [def],
      ...(similarTo ? { similarTo } : {}),
      ...(extraTags && extraTags.length ? { extraTags } : {}),
    });
  });
  return out;
};

const Dictionary: React.FC = () => {
  const { t } = useLocalization();
  const history = useHistory();
  const originalApyFetch = React.useContext(APyContext);

  const apyFetch = React.useMemo(() => {
    type Pending = {
      lang: string;
      q: string;
      resolve: (v: any) => void;
      reject: (e: any) => void;
      canceled: boolean;
      source: CancelTokenSource;
    };
    const queuesRef = { current: new Map<string, Pending[]>() } as { current: Map<string, Pending[]> };
    const timerRef = { current: null as number | null };

    const flush = () => {
      queuesRef.current.forEach((list, lang) => {
        const active = list.filter((p) => !p.canceled);
        queuesRef.current.set(lang, []);
        let idx = 0;
        while (idx < active.length) {
          const batch = active.slice(idx, idx + 10);
          idx += 10;
          if (!batch.length) continue;
          const q = batch.map((b) => b.q).join(' ');
          const [, req] = originalApyFetch('generate', { lang, q });
          req
            .then((resp: any) => {
              const raw = resp?.data?.responseData ?? resp?.data ?? [];
              const arr = Array.isArray(raw) ? raw : [];
              const dataIsArray = Array.isArray(resp?.data);
              const hasResponseDataArray = Array.isArray(resp?.data?.responseData);
              batch.forEach((p, i) => {
                if (p.canceled) return;
                const pair = arr[i];
                let perItem: any;
                if (dataIsArray) {
                  perItem = { data: pair !== undefined ? [pair] : [] };
                } else if (hasResponseDataArray) {
                  perItem = { data: { responseData: pair !== undefined ? [pair] : [] } };
                } else {
                  perItem = { data: pair !== undefined ? [pair] : [] };
                }
                p.resolve(perItem);
              });
            })
            .catch((err: any) => {
              batch.forEach((p) => {
                if (!p.canceled) p.reject(err);
              });
            });
        }
      });
    };

    const scheduleFlush = () => {
      if (timerRef.current == null) {
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          flush();
        }, 0);
      }
    };

    const wrapped = (endpoint: string, params: Record<string, any>) => {
      if (endpoint !== 'generate') return originalApyFetch(endpoint, params);
      const { lang, q } = params || {};
      let res: (v: any) => void = () => {};
      let rej: (e: any) => void = () => {};
      const promise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
      });
      const pending: Partial<Pending> = { lang, q, resolve: res, reject: rej, canceled: false } as any;
      const source: CancelTokenSource = { cancel: () => ((pending as Pending).canceled = true) } as any;
      (pending as Pending).source = source;
      const list = queuesRef.current.get(lang) || [];
      list.push(pending as Pending);
      queuesRef.current.set(lang, list);
      scheduleFlush();
      return [source, promise] as [CancelTokenSource, Promise<any>];
    };

    return wrapped;
  }, [originalApyFetch]);

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

  React.useEffect(() => {
    const handleLocationChange = () => {
      window.location.reload();
    };

    const unlisten = history.listen(handleLocationChange);
    return unlisten;
  }, [history]);

  if (loadingPairs) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  const urlPair = getUrlParam(history.location.search, 'langpair');
  const initialQ = getUrlParam(history.location.search, 'q') || '';
  let urlSrc: string | null = null;
  let urlTgt: string | null = null;
  if (urlPair) {
    const [s, t] = urlPair.split('-', 2).map(toAlpha3Code);
    if (s && t && isPair(pairs, s, t)) {
      urlSrc = s;
      urlTgt = t;
    }
  }

  return (
    <APyContext.Provider value={apyFetch}>
      <WithSrcLang pairs={pairs} urlSrcLang={urlSrc}>
        {({ srcLang, setSrcLang, recentSrcLangs, setRecentSrcLangs, detectedLang, setDetectedLang }) => (
          <WithTgtLang pairs={pairs} srcLang={srcLang} urlTgtLang={urlTgt}>
            {({ tgtLang, setTgtLang, recentTgtLangs }) => {
              const [inputWord, setInputWord] = React.useState(initialQ);
              const [activeWord, setActiveWord] = React.useState('');
              const [loading, setLoading] = React.useState(false);
              const [searched, setSearched] = React.useState(false);
              const searchRef = React.useRef<CancelTokenSource | null>(null);
              const [results, setResults] = React.useState<Entry[]>([]);
              const [reverseResults, setReverseResults] = React.useState<Entry[]>([]);
              const [embeddingResults, setEmbeddingResults] = React.useState<Entry[]>([]);
              const bootstrappedFromUrlRef = React.useRef(false);

              React.useEffect(() => {
                setResults([]);
                setReverseResults([]);
                setEmbeddingResults([]);
                setSearched(false);
              }, [srcLang, tgtLang]);

              React.useEffect(() => {
                if (!bootstrappedFromUrlRef.current && initialQ) return;
                const url = new URL(window.location.href);
                const trimmed = inputWord.trim();
                if (trimmed) {
                  url.searchParams.set('q', trimmed);
                } else if (bootstrappedFromUrlRef.current) {
                  url.searchParams.delete('q');
                }
                url.searchParams.set('langpair', `${srcLang}-${tgtLang}`);
                url.hash = '';
                const next = url.toString();
                if (next !== window.location.href) {
                  window.history.replaceState(null, '', next);
                }
              }, [inputWord, srcLang, tgtLang, initialQ]);

              const handleSearch = React.useCallback(
                async (wordOverride?: string, srcOverride: string = srcLang, tgtOverride: string = tgtLang) => {
                  const rawWord = (wordOverride ?? inputWord).trim();
                  if (!rawWord) return;

                  setActiveWord(rawWord);
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
                        new Set(arr.flatMap((item) => item.defs.map((d) => stripTagsAndHashes(d))).filter(Boolean)),
                      );
                    });
                    setReverseResults(uniqueHeads.map((h) => ({ head: h, defs: enriched[h] } as Entry)));

                    const cleanedWord = stripTagsLower(rawWord);
                    const exactForward = fwdParsed.find((item) => stripTagsLower(item.head) === cleanedWord);
                    const exactReverse = reverseRaw.find((item) => stripTagsLower(item.head) === cleanedWord);

                    let headerTerm: string | null = null;
                    let translations: string[] = [];
                    let headLang: string = srcOverride;
                    let translationLang: string = tgtOverride;
                    let exactMatchFound = false;

                    if (exactForward) {
                      headerTerm = stripTagsAndHashes(exactForward.head);
                      translations = exactForward.defs.map((d) => stripTagsAndHashes(d));
                      headLang = srcOverride;
                      translationLang = tgtOverride;
                      exactMatchFound = true;
                    } else if (exactReverse) {
                      headerTerm = stripTagsAndHashes(exactReverse.head);
                      translations = exactReverse.defs.map((d) => stripTagsAndHashes(d));
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
                        jobResults.forEach(({ embeddingMode, sims, term }) => {
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
                        setEmbeddingResults(dedupeEmbeddingEntries(embEntries));
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
                      setEmbeddingResults(dedupeEmbeddingEntries(embEntries));
                    }
                  } catch {
                    setReverseResults(revParsed);
                  } finally {
                    setLoading(false);
                    searchRef.current = null;
                  }
                },
                [apyFetch, inputWord, srcLang, tgtLang, loadEmbeddingModes],
              );

              React.useEffect(() => {
                if (bootstrappedFromUrlRef.current) return;
                if (!initialQ) return;
                if (!srcLang || !tgtLang) return;
                bootstrappedFromUrlRef.current = true;
                setActiveWord(initialQ);
                handleSearch(initialQ, srcLang, tgtLang);
              }, [initialQ, srcLang, tgtLang, handleSearch]);

              const grouped: Record<string, Entry[]> = React.useMemo(() => {
                const all: Entry[] = [...results, ...reverseResults, ...embeddingResults];
                const map: Record<string, Entry[]> = {};
                all.forEach((e) => {
                  const surface = stripTagsAndHashes(e.head);
                  if (!map[surface]) map[surface] = [];
                  map[surface].push({
                    head: e.head,
                    defs: e.defs.map((d) => stripTagsAndHashes(d)),
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
                      value={inputWord}
                      onChange={(e) => setInputWord(e.target.value)}
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
                        if (a === activeWord && b !== activeWord) return -1;
                        if (b === activeWord && a !== activeWord) return 1;
                        return 0;
                      })
                      .map(([surface, entries]) => (
                        <CombinedWord
                          key={surface}
                          surface={surface}
                          entries={entries}
                          lang={srcLang}
                          searchWord={activeWord}
                          onDefinitionClick={(def) => {
                            setInputWord(def);
                            setActiveWord(def);
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
    </APyContext.Provider>
  );
};

export default Dictionary;
