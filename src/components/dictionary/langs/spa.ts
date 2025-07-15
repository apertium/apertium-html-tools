const spaCols = ['Singular', 'Plural'];
const spaRowsP123 = ['1st', '2nd', '3rd'];
const spaRowsImp = ['First (1st)', 'Second informal (2nd)', 'Formal (3rd: usted/ustedes)'];

function spaP123Table(
  ctx: { t: (key: string) => string },
  label: string,
  suffix: string
): ParadigmBlock {
  const { t } = ctx;
  return {
    id: suffix,
    label: () => t(label),
    tabcols: spaCols.map(c => t(c)),
    tabrows: spaRowsP123.map(r => t(r)),
    tabdata: [
      [{ tags: `${suffix}.p1.sg` }, { tags: `${suffix}.p1.pl` }],
      [{ tags: `${suffix}.p2.sg` }, { tags: `${suffix}.p2.pl` }],
      [{ tags: `${suffix}.p3.sg` }, { tags: `${suffix}.p3.pl` }],
    ],
  };
}

function spaCompound(
  ctx: { t: (key: string) => string },
  suffix: string,
  label: string
): ParadigmBlock {
  const { t } = ctx;
  return {
    id: suffix,
    label: () => t(label),
    tabcols: spaCols.map(c => t(c)),
    tabrows: spaRowsP123.map(r => t(r)),
    tabdata: [
      [{ tags: `${suffix}.p1.sg` }, { tags: `${suffix}.p1.pl` }],
      [{ tags: `${suffix}.p2.sg` }, { tags: `${suffix}.p2.pl` }],
      [{ tags: `${suffix}.p3.sg` }, { tags: `${suffix}.p3.pl` }],
    ],
  };
}

function buildSpaBlocks(
  ctx: { t: (key: string) => string }
): ParadigmBlock[] {
  const { t } = ctx;
  const nonPersonal: ParadigmBlock = {
    id: 'non-personal',
    label: () => t('Non-personal forms'),
    tablist: [
      { label: 'Simple infinitive', tags: 'inf' },
      { label: 'Compound infinitive', pretxt: 'habiendo', tags: 'pp.m.sg' },
      { label: 'Simple gerund', tags: 'ger' },
      { label: 'Compound gerund', pretxt: 'habiendo', tags: 'pp.m.sg' },
      { label: 'Past participle', tags: 'pp.m.sg' },
    ],
  };

  const personal: ParadigmBlock = {
    id: 'personal',
    label: () => t('Personal forms'),
    subcats: [
      {
        id: 'indicative',
        label: () => t('Indicative mode'),
        subcats: [
          spaP123Table(ctx, 'Present', 'pri'),
          spaP123Table(ctx, 'Past imperfect (pretérito imperfecto)', 'pii'),
          spaP123Table(ctx, 'Past definite (pretérito perfecto simple)', 'ifi'),
          spaP123Table(ctx, 'Simple future', 'fti'),
          spaP123Table(ctx, 'Simple conditional', 'cni'),
          spaCompound(ctx, 'pri', 'Compound past definite (pretérito perfecto compuesto)'),
          spaCompound(ctx, 'pii', 'Compound past perfect (pretérito pluscuamperfecto)'),
          spaCompound(ctx, 'ifi', 'Compound past anterior (pretérito anterior)'),
          spaCompound(ctx, 'fti', 'Compound future'),
          spaCompound(ctx, 'cni', 'Compound conditional'),
        ],
      },
      {
        id: 'subjunctive',
        label: () => t('Subjunctive mode'),
        subcats: [
          spaP123Table(ctx, 'Present subjunctive', 'prs'),
          spaP123Table(ctx, 'Past imperfect (ra/ se)', 'pis'),
          spaP123Table(ctx, 'Simple future subjunctive', 'fts'),
          spaCompound(ctx, 'prs', 'Compound present subjunctive (pretérito perfecto compuesto)'),
          spaCompound(ctx, 'pis', 'Compound past perfect subjunctive (pretérito pluscuamperfecto)'),
          spaCompound(ctx, 'fts', 'Compound future subjunctive'),
        ],
      },
      {
        id: 'imperative',
        label: () => t('Imperative mode'),
        tabcols: spaCols.map(c => t(c)),
        tabrows: spaRowsImp.map(r => t(r)),
        tabdata: [
          [{}, { tags: 'imp.p1.pl' }],
          [{ tags: 'imp.p2.sg' }, { tags: 'imp.p2.pl' }],
          [{ tags: 'imp.p3.sg' }, { tags: 'imp.p3.pl' }],
        ],
      },
    ],
  };

  return [nonPersonal, personal];
}

export function add_spa(
  ctx: { t: (key: string) => string }
): Record<string, ParadigmBlock[]> {
  return {
    vaux: [],
    vblex: buildSpaBlocks(ctx),
  };
}

export const spaPlugin: LanguagePlugin = {
  backendLangCode: 'spa',
  addParadigms({ head, t }) {
    const origTags = Array.from(head.matchAll(/<([^>]+)>/g), m => m[1]);
    const blocksMap = add_spa({ t });
    let key: string | undefined;
    if (origTags.includes('vblex')) key = 'vblex';
    if (!key) return [];
    return blocksMap[key] || [];
  },
  parseTags(origTags: string[], cell: string): string[] {
    const parts = cell.split('.');
    if (origTags.includes('vblex')) {
      return ['vblex', ...parts];
    }
    return parts;
  }
};
