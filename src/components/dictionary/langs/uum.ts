export interface UumLabels {
  sg: string;
  pl: string;
  p1?: string;
  p2?: string;
  p3?: string;
  p1sg?: string;
  p1pl?: string;
  p2sg?: string;
  p2pl?: string;
  p3sg?: string;
  p3pl?: string;
  cases: Record<string, string>;
  labels: Record<string, string>;
  'poss-sg': Record<string, string>;
  'poss-pl': Record<string, string>;
}

export type UumBlock = {
  id?: string;
  label: () => string;
  tabcols?: string[];
  tabrows?: string[];
  tabdata?: Array<Array<{ tags: string }>>;
  subcats?: UumBlock[];
};

export const uumLabels: Record<string, Record<string, UumLabels>> = {
  eng: {
    Linguist: {
      sg: 'Singular',
      pl: 'Plural',
      p1: '1st',
      p2: '2nd',
      p3: '3rd',
      cases: {
        nom: 'Nominative',
        acc: 'Accusative',
        dat: 'Dative',
        loc: 'Locative',
        gen: 'Genitive',
        abl: 'Ablative',
        ins: 'Instrumental',
        term: 'Terminative',
        abe: 'Abessive',
      },
      labels: {
        'non-personal': 'Non-personal forms',
        pres: 'Present',
        past: 'Past',
        futs: 'Future',
        fut: 'Future indefinite',
        fdi: 'Future definite',
        'pres.cni': 'Conditional',
        imp: 'Imperative',
        'noun-cases': 'Cases',
        'noun-poss': 'Possession',
        'noun-poss-sg': 'Singular',
        'noun-poss-pl': 'Plural',
        affirmative: 'Affirmative',
        negative: 'Negative',
        infinitive: 'Infinitive',
        participle: 'Participle',
        converb: 'Converb',
      },
      'poss-sg': {
        p1sg: '1sg',
        p2sg: '2sg',
        p3sg: '3sg',
        p1pl: '1pl',
        p2pl: '2pl',
        p3pl: '3pl',
      },
      'poss-pl': {
        p1sg: '1sg',
        p2sg: '2sg',
        p3sg: '3sg',
        p1pl: '1pl',
        p2pl: '2pl',
        p3pl: '3pl',
      },
    },
    Learner: {
      sg: 'Singular',
      pl: 'Plural',
      p1sg: 'I',
      p2sg: 'you',
      p3sg: 'he/she',
      p1pl: 'we',
      p2pl: 'you all',
      p3pl: 'they',
      cases: {
        nom: 'Nominative',
        acc: 'Accusative',
        dat: 'Dative',
        loc: 'Locative',
        gen: 'Genitive',
        abl: 'Ablative',
        ins: 'Instrumental',
        term: 'Terminative',
        abe: 'Abessive',
      },
      labels: {
        'non-personal': 'Non-personal forms',
        pres: 'Present',
        past: 'Past',
        futs: 'Future',
        fut: 'Future indefinite',
        fdi: 'Future definite',
        'pres.cni': 'Conditional',
        imp: 'Imperative',
        'noun-cases': 'Cases',
        'noun-poss': 'Possession',
        'noun-poss-sg': 'Singular possessed noun',
        'noun-poss-pl': 'Plural possessed noun',
        affirmative: 'Affirmative',
        negative: 'Negative',
        infinitive: 'Infinitive',
        participle: 'Participle',
        converb: 'Converb',
      },
      'poss-sg': {
        p1sg: 'my',
        p2sg: 'your',
        p3sg: 'his/her',
        p1pl: 'our',
        p2pl: 'your',
        p3pl: 'their',
      },
      'poss-pl': {
        p1sg: 'my (plural)',
        p2sg: 'your (plural)',
        p3sg: 'his/her (plural)',
        p1pl: 'our (plural)',
        p2pl: 'your (plural)',
        p3pl: 'their (plural)',
      },
    },
  },

  ukr: {
    'Лінгвіст': {
      sg: 'Однина',
      pl: 'Множина',
      p1: '1-ша',
      p2: '2-га',
      p3: '3-тя',
      cases: {
        nom: 'Називний',
        acc: 'Знахідний',
        dat: 'Давальний',
        loc: 'Місцевий',
        gen: 'Родовий',
        abl: 'Відмінок походження',
        ins: 'Орудний',
        term: 'Кінцевий',
        abe: 'Безвідмінковий',
      },
      labels: {
        'non-personal': 'Неперсональні форми',
        pres: 'Теперішній час',
        past: 'Минулий час',
        futs: 'Майбутній час',
        fut: 'Майбутній недоконаний',
        fdi: 'Майбутній доконаний',
        'pres.cni': 'Умовний',
        imp: 'Наказовий',
        'noun-cases': 'Відмінки',
        'noun-poss': 'Присвійність',
        'noun-poss-sg': 'Однина',
        'noun-poss-pl': 'Множина',
        affirmative: 'Стверджувальний',
        negative: 'Заперечний',
        infinitive: 'Інфінітив',
        participle: 'Дієприкметник',
        converb: 'Дієприслівник',
      },
      'poss-sg': {
        p1sg: '1-ша',
        p2sg: '2-га',
        p3sg: '3-тя',
        p1pl: '1-ша',
        p2pl: '2-га',
        p3pl: '3-тя',
      },
      'poss-pl': {
        p1sg: '1-ша',
        p2sg: '2-га',
        p3sg: '3-тя',
        p1pl: '1-ша',
        p2pl: '2-га',
        p3pl: '3-тя',
      },
    },
    'Учень': {
      sg: 'Однина',
      pl: 'Множина',
      p1sg: 'я',
      p2sg: 'ти',
      p3sg: 'він/вона',
      p1pl: 'ми',
      p2pl: 'ви',
      p3pl: 'вони',
      cases: {
        nom: 'Називний',
        acc: 'Знахідний',
        dat: 'Давальний',
        loc: 'Місцевий',
        gen: 'Родовий',
        abl: 'Відмінок походження',
        ins: 'Орудний',
        term: 'Кінцевий',
        abe: 'Безвідмінковий',
      },
      labels: {
        'non-personal': 'Неперсональні форми',
        pres: 'Теперішній час',
        past: 'Минулий час',
        futs: 'Майбутній час',
        fut: 'Майбутній недоконаний',
        fdi: 'Майбутній доконаний',
        'pres.cni': 'Умовний',
        imp: 'Наказовий',
        'noun-cases': 'Відмінки',
        'noun-poss': 'Присвійність',
        'noun-poss-sg': 'Іменник в однині',
        'noun-poss-pl': 'Іменник у множині',
        affirmative: 'Стверджувальний',
        negative: 'Заперечний',
        infinitive: 'Інфінітив',
        participle: 'Дієприкметник',
        converb: 'Дієприслівник',
      },
      'poss-sg': {
        p1sg: 'мій',
        p2sg: 'твій',
        p3sg: 'його/її',
        p1pl: 'наш',
        p2pl: 'ваш',
        p3pl: 'їхній',
      },
      'poss-pl': {
        p1sg: 'мої',
        p2sg: 'твої',
        p3sg: 'його/її',
        p1pl: 'наші',
        p2pl: 'ваші',
        p3pl: 'їхні',
      },
    },
  },

  deu: {
    'Sprachwissenschaftler': {
      sg: 'Singular',
      pl: 'Plural',
      p1: '1. Person',
      p2: '2. Person',
      p3: '3. Person',
      cases: {
        nom: 'Nominativ',
        acc: 'Akkusativ',
        dat: 'Dativ',
        loc: 'Lokativ',
        gen: 'Genitiv',
        abl: 'Ablativ',
        ins: 'Instrumentalis',
        term: 'Terminativ',
        abe: 'Abessiv',
      },
      labels: {
        'non-personal': 'Nicht-personale Formen',
        pres: 'Präsens',
        past: 'Präteritum',
        futs: 'Zukunft',
        fut: 'Futur I',
        fdi: 'Futur II',
        'pres.cni': 'Konjunktiv II',
        imp: 'Imperativ',
        'noun-cases': 'Kasus',
        'noun-poss': 'Possessivformen',
        'noun-poss-sg': 'Singular',
        'noun-poss-pl': 'Plural',
        affirmative: 'Bejahend',
        negative: 'Verneinend',
        infinitive: 'Infinitiv',
        participle: 'Partizip',
        converb: 'Konverb',
      },
      'poss-sg': {
        p1sg: '1sg',
        p2sg: '2sg',
        p3sg: '3sg',
        p1pl: '1pl',
        p2pl: '2pl',
        p3pl: '3pl',
      },
      'poss-pl': {
        p1sg: '1sg',
        p2sg: '2sg',
        p3sg: '3sg',
        p1pl: '1pl',
        p2pl: '2pl',
        p3pl: '3pl',
      },
    },
    'Lerner': {
      sg: 'Singular',
      pl: 'Plural',
      p1sg: 'ich',
      p2sg: 'du',
      p3sg: 'er/sie/es',
      p1pl: 'wir',
      p2pl: 'ihr',
      p3pl: 'sie/Sie',
      cases: {
        nom: 'Nominativ',
        acc: 'Akkusativ',
        dat: 'Dativ',
        loc: 'Lokativ',
        gen: 'Genitiv',
        abl: 'Ablativ',
        ins: 'Instrumentalis',
        term: 'Terminativ',
        abe: 'Abessiv',
      },
      labels: {
        'non-personal': 'Nicht-personale Formen',
        pres: 'Gegenwart',
        past: 'Vergangenheit',
        futs: 'Zukunft',
        fut: 'Futur I',
        fdi: 'Futur II',
        'pres.cni': 'Konjunktiv II',
        imp: 'Befehlsform',
        'noun-cases': 'Fälle',
        'noun-poss': 'Besitzanzeige',
        'noun-poss-sg': 'Einzahl (Besitz)',
        'noun-poss-pl': 'Mehrzahl (Besitz)',
        affirmative: 'Bejahung',
        negative: 'Verneinung',
        infinitive: 'Grundform',
        participle: 'Partizip',
        converb: 'Konverb',
      },
      'poss-sg': {
        p1sg: 'mein',
        p2sg: 'dein',
        p3sg: 'sein/ihr/sein',
        p1pl: 'unser',
        p2pl: 'euer',
        p3pl: 'ihr/Ihr',
      },
      'poss-pl': {
        p1sg: 'meine',
        p2sg: 'deine',
        p3sg: 'seine/ihre/seine',
        p1pl: 'unsere',
        p2pl: 'eure',
        p3pl: 'ihre/Ihre',
      },
    },
  },
};

function add_uum(
  ctx: { labels: UumLabels; t: (key: string) => string }
): Record<string, ParadigmBlock[]> {
  const { labels: m, t } = ctx;

  function uumFinVb(tgs: string, lab: string): ParadigmBlock {
    const rowLabels =
      'p1' in m
        ? [
            `${m.p1} ${m.sg}`,
            `${m.p1} ${m.pl}`,
            `${m.p2} ${m.sg}`,
            `${m.p2} ${m.pl}`,
            `${m.p3} ${m.sg}`,
            `${m.p3} ${m.pl}`,
          ]
        : [m.p1sg!, m.p1pl!, m.p2sg!, m.p2pl!, m.p3sg!, m.p3pl!];

    return {
      id: tgs.replace(/\./g, '-'),
      label: () => t(m.labels[lab] || lab),
      tabcols: [m.labels.affirmative, m.labels.negative].map(k => t(k)),
      tabrows: rowLabels.map(lbl => t(lbl)),
      tabdata: [
        [{ tags: `${tgs}.p1.sg` }],
        [{ tags: `${tgs}.p1.pl` }],
        [{ tags: `${tgs}.p2.sg` }],
        [{ tags: `${tgs}.p2.pl` }],
        [{ tags: `${tgs}.p3.sg` }],
        [{ tags: `${tgs}.p3.pl` }],
      ].map((row, i) => [row[0], { tags: `neg.${row[0].tags}` }]),
    };
  }

  const mkImpRows = () =>
    'p1' in m
      ? [
          `${m.p1} ${m.sg}`,
          `${m.p1} ${m.pl}`,
          `${m.p2} ${m.sg}`,
          `${m.p2} ${m.pl}`,
        ]
      : [m.p1sg!, m.p1pl!, m.p2sg!, m.p2pl!];

  return {
    vaux: [],

    verb_iv: [
      {
        id: 'non-personal',
        label: () => t(m.labels['non-personal']),
        tabcols: [m.labels.affirmative, m.labels.negative].map(k => t(k)),
        tabrows: [m.labels.infinitive, m.labels.participle, m.labels.converb].map(k =>
          t(k)
        ),
        tabdata: [
          [{ tags: 'inf' }],
          [{ tags: 'pp' }],
          [{ tags: 'tsg' }],
        ].map((row, i) => [row[0], { tags: `neg.${row[0].tags}` }]),
      },
      uumFinVb('pres', 'pres'),
      uumFinVb('past', 'past'),
      {
        id: 'future',
        label: () => t(m.labels.futs),
        subcats: [uumFinVb('fut', 'fut'), uumFinVb('fdi', 'fdi')],
      },
      uumFinVb('pres.cni', 'pres.cni'),
      {
        id: 'imp',
        label: () => t(m.labels.imp),
        tabcols: [m.labels.affirmative, m.labels.negative].map(k => t(k)),
        tabrows: mkImpRows().map(lbl => t(lbl)),
        tabdata: mkImpRows().map((lbl, i) => [
          { tags: `imp.p${i < 2 ? 1 : 2}.${i % 2 === 0 ? 'sg' : 'pl'}` },
          { tags: `neg.imp.p${i < 2 ? 1 : 2}.${i % 2 === 0 ? 'sg' : 'pl'}` },
        ]),
      },
    ],

    verb_tv: [
      {
        id: 'non-personal',
        label: () => t(m.labels['non-personal']),
        tabcols: [m.labels.affirmative, m.labels.negative].map(k => t(k)),
        tabrows: [m.labels.infinitive, m.labels.participle, m.labels.converb].map(k =>
          t(k)
        ),
        tabdata: [
          [{ tags: 'inf' }],
          [{ tags: 'pp' }],
          [{ tags: 'tsg' }],
        ].map((row, i) => [row[0], { tags: `neg.${row[0].tags}` }]),
      },
      uumFinVb('pres', 'pres'),
      uumFinVb('past', 'past'),
      {
        id: 'future',
        label: () => t(m.labels.futs),
        subcats: [uumFinVb('fut', 'fut'), uumFinVb('fdi', 'fdi')],
      },
      uumFinVb('pres.cni', 'pres.cni'),
      {
        id: 'imp',
        label: () => t(m.labels.imp),
        tabcols: [m.labels.affirmative, m.labels.negative].map(k => t(k)),
        tabrows: mkImpRows().map(lbl => t(lbl)),
        tabdata: mkImpRows().map((lbl, i) => [
          { tags: `imp.p${i < 2 ? 1 : 2}.${i % 2 === 0 ? 'sg' : 'pl'}` },
          { tags: `neg.imp.p${i < 2 ? 1 : 2}.${i % 2 === 0 ? 'sg' : 'pl'}` },
        ]),
      },
    ],

    noun: [
      {
        id: 'noun-cases',
        label: () => t(m.labels['noun-cases']),
        tabcols: [m.sg, m.pl].map(k => t(k)),
        tabrows: Object.values(m.cases).map(k => t(k)),
        tabdata: Object.keys(m.cases).map(c => [
          { tags: c },
          { tags: `pl.${c}` },
        ]),
      },
      {
        id: 'noun-poss',
        label: () => t(m.labels['noun-poss']),
        subcats: [
          {
            id: 'noun-poss-sg',
            label: () => t(m.labels['noun-poss-sg']),
            tabcols: Object.values(m['poss-sg']).map(k => t(k)),
            tabrows: Object.values(m.cases).map(k => t(k)),
            tabdata: Object.keys(m.cases).map(c =>
              Object.keys(m['poss-sg']).map(p => ({
                tags: `px${p.slice(1)}.${c}`,
              }))
            ),
          },
          {
            id: 'noun-poss-pl',
            label: () => t(m.labels['noun-poss-pl']),
            tabcols: Object.values(m['poss-pl']).map(k => t(k)),
            tabrows: Object.values(m.cases).map(k => t(k)),
            tabdata: Object.keys(m.cases).map(c =>
              Object.keys(m['poss-pl']).map(p => ({
                tags: `pl.px${p.slice(1)}.${c}`,
              }))
            ),
          },
        ],
      },
    ],

    pnoun: [
      {
        id: 'pnoun-cases',
        label: () => t(m.labels['noun-cases']),
        tabcols: [m.sg, m.pl].map(k => t(k)),
        tabrows: Object.values(m.cases).map(k => t(k)),
        tabdata: Object.keys(m.cases).map(c => [
          { tags: c },
          { tags: `pl.${c}` },
        ]),
      },
      {
        id: 'pnoun-poss',
        label: () => t(m.labels['noun-poss']),
        subcats: [
          {
            id: 'pnoun-poss-sg',
            label: () => t(m.labels['noun-poss-sg']),
            tabcols: Object.values(m['poss-sg']).map(k => t(k)),
            tabrows: Object.values(m.cases).map(k => t(k)),
            tabdata: Object.keys(m.cases).map(c =>
              Object.keys(m['poss-sg']).map(p => ({
                tags: `px${p.slice(1)}.${c}`,
              }))
            ),
          },
          {
            id: 'pnoun-poss-pl',
            label: () => t(m.labels['noun-poss-pl']),
            tabcols: Object.values(m['poss-pl']).map(k => t(k)),
            tabrows: Object.values(m.cases).map(k => t(k)),
            tabdata: Object.keys(m.cases).map(c =>
              Object.keys(m['poss-pl']).map(p => ({
                tags: `pl.px${p.slice(1)}.${c}`,
              }))
            ),
          },
        ],
      },
    ],
  };
}

export function parseTags(origTags: string[], cellTags: string): string[] {
  const parts = cellTags.split('.');
  const first = origTags[0] || '';
  if (first === 'np' || first.startsWith('np.')) return [...origTags, ...parts];
  if (first.startsWith('v')) return [...origTags, ...parts];
  if (parts.length === 3 && parts[0] === 'pl') return ['n', 'pl', parts[1], parts[2]];
  if (parts.length === 2 && parts[0].startsWith('px')) return ['n', parts[0], parts[1]];
  if (parts.length === 2 && parts[0] === 'pl') return ['n', 'pl', parts[1]];
  return ['n', parts[0]];
}

export const uumPlugin: LanguagePlugin = {
  backendLangCode: 'uum',
  addParadigms({ head, mode, locale, t, apyFetch }: AddParadigmsArgs): ParadigmBlock[] {
    const code = locale.split('-')[0].toLowerCase();
    const labelsForMode = uumLabels[code]?.[mode] ?? uumLabels.eng.Linguist;
    const blocksMap = add_uum({ labels: labelsForMode, t });
    const origTags = Array.from(head.matchAll(/<([^>]+)>/g), (m) => m[1]);
    let key: string;
    if (origTags.includes('iv')) key = 'verb_iv';
    else if (origTags.includes('tv')) key = 'verb_tv';
    else if (origTags.some((tag) => tag.startsWith('v'))) key = 'vaux';
    else if (origTags.some((tag) => tag.startsWith('np.'))) key = 'pnoun';
    else key = 'noun';
    return blocksMap[key] || [];
  },
  parseTags,
};