import Translator from './Translator';
import { parentLang } from '../../util/languages';

export type Pairs = Readonly<Record<string, Set<string>>>;

// eslint-disable-next-line
const rawPairs = (window as any).PAIRS as Array<{
  sourceLanguage: string;
  targetLanguage: string;
}>;
export const DirectPairs: Pairs = rawPairs.reduce((pairs, { sourceLanguage, targetLanguage }) => {
  pairs[sourceLanguage] = pairs[sourceLanguage] || new Set();
  pairs[sourceLanguage].add(targetLanguage);
  return pairs;
}, {} as Record<string, Set<string>>);

const getChainedTgtLangs = (srcLang: string) => {
  const tgtLangs: Set<string> = new Set();

  const tgtsSeen = new Set([srcLang]);
  let tgsFrontier = [...DirectPairs[srcLang]];
  let tgtLang;
  while ((tgtLang = tgsFrontier.pop())) {
    if (!tgtsSeen.has(tgtLang)) {
      tgtLangs.add(tgtLang);
      if (DirectPairs[tgtLang]) {
        tgsFrontier = [...tgsFrontier, ...DirectPairs[tgtLang]];
      }
      tgtsSeen.add(tgtLang);
    }
  }

  return tgtLangs;
};
export const chainedPairs: Record<string, Set<string>> = {};
Object.keys(DirectPairs).forEach((srcLang) => {
  chainedPairs[srcLang] = getChainedTgtLangs(srcLang);
});
export const ChainedPairs: Pairs = chainedPairs;

export const SrcLangs = new Set(Object.keys(DirectPairs));
SrcLangs.forEach((lang) => {
  const parent = parentLang(lang);
  if (!SrcLangs.has(parent)) {
    SrcLangs.add(parent);
  }
});

export const TgtLangs = new Set(
  ([] as Array<string>).concat(...Object.values(DirectPairs).map((ls) => Array.from(ls))),
);
TgtLangs.forEach((lang) => {
  const parent = parentLang(lang);
  if (!TgtLangs.has(parent)) {
    TgtLangs.add(parent);
  }
});

export const isPair = (pairs: Pairs, src: string, tgt: string): boolean => pairs[src] && pairs[src].has(tgt);

// eslint-disable-next-line
const pairPrefs = (window as any).PAIR_PREFS as Record<string, Record<string, Record<string, string>>>;

export type PairPrefs = Record<string, string>;
export type PairPrefValues = Record<string, boolean>;

export const getPairPrefs = (locale: string, srcLang: string, tgtLang: string): PairPrefs => {
  const localizedPrefs: Record<string, string> = {};
  Object.entries(pairPrefs[`${srcLang}-${tgtLang}`] || {}).forEach(([id, prefs]) => {
    localizedPrefs[id] = prefs[locale] || Object.values(prefs)[0];
  });
  return localizedPrefs;
};

export default Translator;

export enum Mode {
  Text,
  Document,
  Webpage,
}

export const pairUrlParam = 'dir';

export const baseUrlParams = ({ srcLang, tgtLang }: { srcLang: string; tgtLang: string }): Record<string, string> => {
  const pair = `${srcLang}-${tgtLang}`;
  return { [pairUrlParam]: pair };
};

export const TranslateEvent = 'translate';

export const DetectEvent = 'detect-language';
export const DetectCompleteEvent = 'detect-language-complete';
