import * as React from 'react';
import { render } from '@testing-library/react';

import WithSortedLanguages, { ChildProps, Props } from '../WithSortedLanguages';

const getSortedLangs = (props: Omit<Props, 'children'>): [Array<string>, Array<string>] => {
  const childProps: { props: ChildProps } = { props: {} as ChildProps };

  render(
    <WithSortedLanguages {...props}>
      {(props: ChildProps) => {
        childProps.props = props;
        return <div />;
      }}
    </WithSortedLanguages>,
  );

  return [childProps.props.srcLangs.map(([code]) => code), childProps.props.tgtLangs.map(([code]) => code)];
};

// Adapted from https://stackoverflow.com/a/37580979/1266600.
function* permute<T>(permutation_: Array<T>): Generator<Array<T>> {
  const permutation = permutation_.slice(),
    length = permutation.length,
    c = Array(length).fill(0) as Array<number>;

  let i = 1,
    k: number,
    p: T;

  yield permutation.slice();
  while (i < length) {
    if (c[i] < i) {
      k = i % 2 && c[i];
      p = permutation[i];
      permutation[i] = permutation[k];
      permutation[k] = p;
      ++c[i];
      i = 1;
      yield permutation.slice();
    } else {
      c[i] = 0;
      ++i;
    }
  }
}

describe('source language sorting', () => {
  it.each([
    // language name
    [['cat', 'eng', 'spa']],

    // variants after parent
    [['cat', 'cat_bar', 'eng', 'eng_foo', 'spa']],

    // variants by name
    [['cat', 'cat_bar', 'cat_foo', 'eng', 'spa']],
  ])('sorts to %s', (srcLangs) => {
    for (const srcLangsPermutation of permute(srcLangs)) {
      const [sortedSrcLangs] = getSortedLangs({
        pairs: {},
        srcLang: 'eng',
        srcLangs: new Set(srcLangsPermutation),
        tgtLangs: new Set(),
      });
      expect(sortedSrcLangs).toStrictEqual(srcLangs);
    }
  });
});

describe('target language sorting', () => {
  const srcLang = 'eng';

  it.each([
    // possible languages first
    {
      possibleTgtLangs: ['spa'],
      tgtLangs: ['spa', 'cat', srcLang],
    },

    // possible families first
    {
      possibleTgtLangs: ['spa_foo'],
      tgtLangs: ['spa', 'spa_foo', 'cat', srcLang],
    },

    // possible variants first
    {
      possibleTgtLangs: ['spa_foo'],
      tgtLangs: ['spa', 'spa_foo', 'spa_bar', 'cat', srcLang],
    },

    // possible variants by name
    {
      possibleTgtLangs: ['spa_foo', 'spa_bar'],
      tgtLangs: ['spa', 'spa_bar', 'spa_foo', 'cat', srcLang],
    },
  ])('sorts to $tgtLangs when $possibleTgtLangs possible', ({ tgtLangs, possibleTgtLangs }) => {
    for (const tgtLangsPermutation of permute(tgtLangs)) {
      const [, sortedTgtLangs] = getSortedLangs({
        srcLang,
        srcLangs: new Set(),
        tgtLangs: new Set(tgtLangsPermutation),
        pairs: { [srcLang]: new Set(possibleTgtLangs) },
      });
      expect(sortedTgtLangs).toStrictEqual(tgtLangs);
    }
  });
});
