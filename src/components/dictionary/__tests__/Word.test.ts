import { lookupTags } from '../Word';
import { unmLabels, unmPlugin, unmTags2Func, UnmLabels } from '../langs/unm';
import { ParadigmBlock } from '../types';

describe('lookupTags', () => {
  it('stops at the paradigm-map leaf before trailing Unm inflection tags', () => {
    expect(lookupTags('këshihëla<v><iv><aa><prs><p3><sg>', unmTags2Func)).toBe('verb_ai');
  });

  it('uses the complete tag path to select the Unm transitive paradigm', () => {
    expect(lookupTags('këshihëla<v><tv><aa><prs><p3><sg>', unmTags2Func)).toBe('verb_ta');
  });
});

describe('Unm Learner paradigms', () => {
  it('only translates labels that exist for both verb types', () => {
    const getParadigm = unmPlugin.getParadigm as unknown as (
      labels: UnmLabels,
      t: (key: string) => string,
      parType: string,
      mode?: string,
    ) => ParadigmBlock[];
    const translate = (key: string) => {
      if (typeof key !== 'string') throw new TypeError('Expected a defined translation key');
      return key;
    };

    expect(getParadigm(unmLabels.eng.Learner, translate, 'verb_ai', 'Learner')).toHaveLength(3);
    expect(getParadigm(unmLabels.eng.Learner, translate, 'verb_ta', 'Learner')).toHaveLength(3);
  });
});
