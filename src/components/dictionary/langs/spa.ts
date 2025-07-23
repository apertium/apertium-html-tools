export interface SpaLabels {
  sg: string;
  pl: string;
  p1: string;
  p2: string;
  p3: string;
  labels: Record<string, string>;
}

export const spaLabels: Record<string, Record<string, SpaLabels>> = {
  eng: {
    Linguist: {
      sg: 'Singular',
      pl: 'Plural',
      p1: '1st',
      p2: '2nd',
      p3: '3rd',
      labels: {
        'non-personal': 'Non‑personal forms',
        personal: 'Personal forms',
        indicative: 'Indicative mode',
        subjunctive: 'Subjunctive mode',
        imperative: 'Imperative mode',
        inf: 'Simple infinitive',
        'inf.comp': 'Compound infinitive',
        ger: 'Simple gerund',
        'ger.comp': 'Compound gerund',
        pp: 'Past participle',
        pri: 'Present',
        pii: 'Past imperfect (pretérito imperfecto)',
        ifi: 'Past definite (pretérito perfecto simple)',
        fti: 'Simple future',
        cni: 'Simple conditional',
        'pri.comp': 'Compound past definite (pretérito perfecto compuesto)',
        'pii.comp': 'Compound past perfect (pretérito pluscuamperfecto)',
        'ifi.comp': 'Compound past perfect anterior (pretérito anterior)',
        'fti.comp': 'Compound future',
        'cni.comp': 'Compound conditional',
        prs: 'Present',
        pis: 'Past imperfect',
      },
    },
  },
};

const auxForms: Record<string, [string, string, string, string, string, string]> = {
  pri: ['he', 'hemos', 'has', 'habéis', 'ha', 'han'],
  pii: ['había', 'habíamos', 'habías', 'habíais', 'había', 'habían'],
  ifi: ['hube', 'hubimos', 'hubiste', 'hubisteis', 'hubo', 'hubieron'],
  fti: ['habré', 'habremos', 'habrás', 'habréis', 'habrá', 'habrán'],
  cni: ['habría', 'habríamos', 'habrías', 'habríais', 'habría', 'habrían'],
  prs: ['haya', 'hayamos', 'hayas', 'hayáis', 'haya', 'hayan'],
  pis: ['hubiera/hubiese', 'hubiéramos/hubiésemos', 'hubieras/hubieses', 'hubierais/hubieseis', 'hubiera/hubiese', 'hubieran/hubiesen'],
  fts: ['hubiere', 'hubiéremos', 'hubieres', 'hubiereis', 'hubiere', 'hubieren'],
};

function spaP123Table(
  ctx: { labels: SpaLabels; t: (key: string) => string },
  suffix: string,
  labelKey: string
): ParadigmBlock {
  const { labels: m, t } = ctx;
  return {
    id: suffix,
    label: () => t(m.labels[labelKey]),
    tabcols: [m.sg, m.pl].map(k => t(k)),
    tabrows: [m.p1, m.p2, m.p3].map(k => t(k)),
    tabdata: [
      [{ tags: `${suffix}.p1.sg` }, { tags: `${suffix}.p1.pl` }],
      [{ tags: `${suffix}.p2.sg` }, { tags: `${suffix}.p2.pl` }],
      [{ tags: `${suffix}.p3.sg` }, { tags: `${suffix}.p3.pl` }],
    ],
  };
}

function spaCompound(
  ctx: { labels: SpaLabels; t: (key: string) => string },
  auxKey: string,
  labelKey: string
): ParadigmBlock {
  const { labels: m, t } = ctx;
  const forms = auxForms[auxKey as keyof typeof auxForms] || [];
  const [p1sg, p1pl, p2sg, p2pl, p3sg, p3pl] = forms;
  return {
    id: `${auxKey}.comp`,
    label: () => t(m.labels[labelKey]),
    tabcols: [m.sg, m.pl].map(k => t(k)),
    tabrows: [m.p1, m.p2, m.p3].map(k => t(k)),
    tabdata: [
      [{ pretxt: p1sg, tags: 'pp.m.sg' }, { pretxt: p1pl, tags: 'pp.m.sg' }],
      [{ pretxt: p2sg, tags: 'pp.m.sg' }, { pretxt: p2pl, tags: 'pp.m.sg' }],
      [{ pretxt: p3sg, tags: 'pp.m.sg' }, { pretxt: p3pl, tags: 'pp.m.sg' }],
    ],
  };
}

function buildSpaBlocks(
  ctx: { labels: SpaLabels; t: (key: string) => string }
): ParadigmBlock[] {
  const { labels: m, t } = ctx;

  const nonPersonal: ParadigmBlock = {
    id: 'non-personal',
    label: () => t(m.labels['non-personal']),
    tablist: [
      { label: t(m.labels.inf), tags: 'inf' },
      { label: t(m.labels['inf.comp']), pretxt: 'habiendo', tags: 'pp.m.sg' },
      { label: t(m.labels.ger), tags: 'ger' },
      { label: t(m.labels['ger.comp']), pretxt: 'habiendo', tags: 'pp.m.sg' },
      { label: t(m.labels.pp), tags: 'pp.m.sg' },
    ],
  };

  const personal: ParadigmBlock = {
    id: 'personal',
    label: () => t(m.labels.personal),
    subcats: [
      {
        id: 'indicative',
        label: () => t(m.labels.indicative),
        subcats: [
          spaP123Table(ctx, 'pri', 'pri'),
          spaP123Table(ctx, 'pii', 'pii'),
          spaP123Table(ctx, 'ifi', 'ifi'),
          spaP123Table(ctx, 'fti', 'fti'),
          spaP123Table(ctx, 'cni', 'cni'),
          spaCompound(ctx, 'pri', 'pri.comp'),
          spaCompound(ctx, 'pii', 'pii.comp'),
          spaCompound(ctx, 'ifi', 'ifi.comp'),
          spaCompound(ctx, 'fti', 'fti.comp'),
          spaCompound(ctx, 'cni', 'cni.comp'),
        ],
      },
      {
        id: 'subjunctive',
        label: () => t(m.labels.subjunctive),
        subcats: [
          spaP123Table(ctx, 'prs', 'prs'),
          spaP123Table(ctx, 'pis', 'pis'),
          spaCompound(ctx, 'prs', 'pri.comp'),
          spaCompound(ctx, 'pis', 'pii.comp'),
          spaCompound(ctx, 'fts', 'fti.comp'),
        ],
      },
      {
        id: 'imperative',
        label: () => t(m.labels.imperative),
        tabcols: [m.sg, m.pl].map(k => t(k)),
        tabrows: [m.p1, m.p2, m.p3].map(k => t(k)),
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
  ctx: { labels: SpaLabels; t: (key: string) => string }
): Record<string, ParadigmBlock[]> {
  return { vaux: [], vblex: buildSpaBlocks(ctx) };
}

export const spaPlugin: LanguagePlugin = {
  backendLangCode: 'spa',
  addParadigms({ head, mode, locale, t }) {
    const modes = spaLabels.eng;
    const labelsForMode = modes[mode] || modes.Linguist;
    const blocksMap = add_spa({ labels: labelsForMode, t });
    const origTags = Array.from(head.matchAll(/<([^>]+)>/g), m => m[1]);
    if (origTags.includes('vblex')) {
      return blocksMap.vblex;
    }
    return [];
  },
  parseTags(origTags: string[], cell: string): string[] {
    if (origTags.includes('vblex')) {
      return ['vblex', ...cell.split('.')];
    }
    return cell.split('.');
  },
};
