import * as React from 'react';
import { NamedLangs, Pairs, isPair } from './index';

import { isVariant, parentLang, toAlpha2Code, variantSeperator } from '../../util/languages';
import { LocaleContext } from '../../context';
import { useLocalization } from '../../util/localization';

export type Props = {
  pairs: Pairs;
  srcLang: string;
  srcLangs: Set<string>;
  tgtLangs: Set<string>;
  children: (props: ChildProps) => React.ReactElement;
};

export type ChildProps = {
  srcLangs: NamedLangs;
  tgtLangs: NamedLangs;
};

const WithSortedLanguages = ({ pairs, srcLang, srcLangs, tgtLangs, children }: Props): React.ReactElement => {
  const { tLang } = useLocalization();
  const locale = React.useContext(LocaleContext);

  const collator = React.useMemo(() => new Intl.Collator((toAlpha2Code(locale) || locale).replace('_', '-')), [locale]);

  const compareLangCodes = React.useCallback(
    (a: string, b: string): number => {
      const [aParent, aVariant] = a.split(variantSeperator, 2),
        [bParent, bVariant] = b.split(variantSeperator, 2);
      if (aVariant && bVariant && aParent === bParent) {
        return collator.compare(tLang(a), tLang(b));
      } else if (aVariant && aParent === b) {
        return 1;
      } else if (bVariant && bParent === a) {
        return -1;
      } else {
        return collator.compare(tLang(aParent), tLang(bParent));
      }
    },
    [collator, tLang],
  );

  const sortedSrcLangs: NamedLangs = React.useMemo(
    () => [...srcLangs].sort(compareLangCodes).map((code) => [code, tLang(code)]),
    [compareLangCodes, srcLangs, tLang],
  );

  const possibleTgtFamilies: Set<string> = React.useMemo(
    () =>
      new Set(
        Array.from(tgtLangs).filter((lang) => {
          const parent = parentLang(lang);
          const possibleTgtLangs = Array.from(pairs[srcLang]);

          return (
            isPair(pairs, srcLang, lang) ||
            possibleTgtLangs.includes(parent) ||
            possibleTgtLangs.some((possibleLang) => parentLang(possibleLang) === parent)
          );
        }),
      ),
    [pairs, srcLang, tgtLangs],
  );

  const sortedTgtLangs: NamedLangs = React.useMemo(
    () =>
      [...tgtLangs]
        .sort((a, b) => {
          const aParent = parentLang(a),
            bParent = parentLang(b);

          const aFamilyPossible = possibleTgtFamilies.has(aParent),
            bFamilyPossible = possibleTgtFamilies.has(bParent);

          if (aFamilyPossible === bFamilyPossible) {
            if (aParent === bParent) {
              const aVariant = isVariant(a),
                bVariant = isVariant(b);
              if (aVariant && bVariant) {
                const aPossible = isPair(pairs, srcLang, a),
                  bPossible = isPair(pairs, srcLang, b);
                if (aPossible === bPossible) {
                  return compareLangCodes(a, b);
                } else if (aPossible) {
                  return -1;
                } else {
                  return 1;
                }
              } else if (aVariant) {
                return 1;
              } else {
                return -1;
              }
            } else {
              return compareLangCodes(a, b);
            }
          } else if (aFamilyPossible) {
            return -1;
          } else {
            return 1;
          }
        })
        .map((code) => [code, tLang(code)]),
    [compareLangCodes, pairs, possibleTgtFamilies, srcLang, tLang, tgtLangs],
  );

  return children({ srcLangs: sortedSrcLangs, tgtLangs: sortedTgtLangs });
};

export default WithSortedLanguages;
