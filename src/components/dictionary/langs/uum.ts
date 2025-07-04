import { LanguagePlugin, ParadigmBlock } from '../types'

export const uumLabels: Record<string, any> = {
  'English-Linguist': {
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
}

export type UumBlock = {
  id?: string
  label: () => string
  tabcols?: string[]
  tabrows?: string[]
  tabdata?: Array<Array<{ tags: string }>>
  subcats?: UumBlock[]
}

function uumFinVb(tgs: string, lab: string): UumBlock {
  const m = uumLabels['English-Linguist']
  return {
    id: tgs.replace(/\./g, '-'),
    label: () => m.labels[lab] || lab,
    tabcols: ['Affirmative', 'Negative'],
    tabrows: [
      '1st person singular',
      '1st person plural',
      '2nd person singular',
      '2nd person plural',
      '3rd person singular',
      '3rd person plural',
    ],
    tabdata: [
      [{ tags: `${tgs}.p1.sg` }, { tags: `neg.${tgs}.p1.sg` }],
      [{ tags: `${tgs}.p1.pl` }, { tags: `neg.${tgs}.p1.pl` }],
      [{ tags: `${tgs}.p2.sg` }, { tags: `neg.${tgs}.p2.sg` }],
      [{ tags: `${tgs}.p2.pl` }, { tags: `neg.${tgs}.p2.pl` }],
      [{ tags: `${tgs}.p3.sg` }, { tags: `neg.${tgs}.p3.sg` }],
      [{ tags: `${tgs}.p3.pl` }, { tags: `neg.${tgs}.p3.pl` }],
    ],
  }
}

export function add_uum(): Record<string, UumBlock[]> {
  const labels = uumLabels['English-Linguist']

  return {
    vaux: [],
    verb_iv: [
      {
        id: 'non-personal',
        label: () => labels.labels['non-personal'],
        tabcols: ['Affirmative', 'Negative'],
        tabrows: ['Infinitive', 'Participle', 'Converb'],
        tabdata: [
          [{ tags: 'inf' }, { tags: 'neg.inf' }],
          [{ tags: 'pp' }, { tags: 'neg.pp' }],
          [{ tags: 'tsg' }, { tags: 'neg.tsg' }],
        ],
      },
      uumFinVb('pres', 'pres'),
      uumFinVb('past', 'past'),
      {
        id: 'future',
        label: () => labels.labels['futs'],
        subcats: [
          uumFinVb('fut', 'fut'),
          uumFinVb('fdi', 'fdi'),
        ],
      },
      uumFinVb('pres.cni', 'pres.cni'),
      {
        id: 'imp',
        label: () => labels.labels['imp'],
        tabcols: ['Affirmative', 'Negative'],
        tabrows: [
          '1st person singular',
          '1st person plural',
          '2nd person singular',
          '2nd person plural',
        ],
        tabdata: [
          [{ tags: 'imp.p1.sg' }, { tags: 'neg.imp.p1.sg' }],
          [{ tags: 'imp.p1.pl' }, { tags: 'neg.imp.p1.pl' }],
          [{ tags: 'imp.p2.sg' }, { tags: 'neg.imp.p2.sg' }],
          [{ tags: 'imp.p2.pl' }, { tags: 'neg.imp.p2.pl' }],
        ],
      },
    ],
    verb_tv: [
      {
        id: 'non-personal',
        label: () => labels.labels['non-personal'],
        tabcols: ['Affirmative', 'Negative'],
        tabrows: ['Infinitive', 'Participle', 'Converb'],
        tabdata: [
          [{ tags: 'inf' }, { tags: 'neg.inf' }],
          [{ tags: 'pp' }, { tags: 'neg.pp' }],
          [{ tags: 'tsg' }, { tags: 'neg.tsg' }],
        ],
      },
      uumFinVb('pres', 'pres'),
      uumFinVb('past', 'past'),
      {
        id: 'future',
        label: () => labels.labels['futs'],
        subcats: [
          uumFinVb('fut', 'fut'),
          uumFinVb('fdi', 'fdi'),
        ],
      },
      uumFinVb('pres.cni', 'pres.cni'),
      {
        id: 'imp',
        label: () => labels.labels['imp'],
        tabcols: ['Affirmative', 'Negative'],
        tabrows: [
          '1st person singular',
          '1st person plural',
          '2nd person singular',
          '2nd person plural',
        ],
        tabdata: [
          [{ tags: 'imp.p1.sg' }, { tags: 'neg.imp.p1.sg' }],
          [{ tags: 'imp.p1.pl' }, { tags: 'neg.imp.p1.pl' }],
          [{ tags: 'imp.p2.sg' }, { tags: 'neg.imp.p2.sg' }],
          [{ tags: 'imp.p2.pl' }, { tags: 'neg.imp.p2.pl' }],
        ],
      },
    ],
    noun: [
      {
        id: 'noun-cases',
        label: () => labels.labels['noun-cases'],
        tabcols: [labels.sg, labels.pl],
        tabrows: Object.values(labels.cases),
        tabdata: Object.keys(labels.cases).map(c => [
          { tags: c }, { tags: `pl.${c}` },
        ]),
      },
      {
        id: 'noun-poss',
        label: () => labels.labels['noun-poss'],
        subcats: [
          {
            id: 'noun-poss-sg',
            label: () => labels.labels['noun-poss-sg'],
            tabcols: Object.values(labels['poss-sg']),
            tabrows: Object.values(labels.cases),
            tabdata: Object.keys(labels.cases).map(c =>
              Object.keys(labels['poss-sg']).map(p => ({
                tags: `px${p.slice(1)}.${c}`,
              }))
            ),
          },
          {
            id: 'noun-poss-pl',
            label: () => labels.labels['noun-poss-pl'],
            tabcols: Object.values(labels['poss-pl']),
            tabrows: Object.values(labels.cases),
            tabdata: Object.keys(labels.cases).map(c =>
              Object.keys(labels['poss-pl']).map(p => ({
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
        label: () => labels.labels['noun-cases'],
        tabcols: [labels.sg, labels.pl],
        tabrows: Object.values(labels.cases),
        tabdata: Object.keys(labels.cases).map(c => [
          { tags: c }, { tags: `pl.${c}` },
        ]),
      },
      {
        id: 'pnoun-poss',
        label: () => labels.labels['noun-poss'],
        subcats: [
          {
            id: 'pnoun-poss-sg',
            label: () => labels.labels['noun-poss-sg'],
            tabcols: Object.values(labels['poss-sg']),
            tabrows: Object.values(labels.cases),
            tabdata: Object.keys(labels.cases).map(c =>
              Object.keys(labels['poss-sg']).map(p => ({
                tags: `px${p.slice(1)}.${c}`,
              }))
            ),
          },
          {
            id: 'pnoun-poss-pl',
            label: () => labels.labels['noun-poss-pl'],
            tabcols: Object.values(labels['poss-pl']),
            tabrows: Object.values(labels.cases),
            tabdata: Object.keys(labels.cases).map(c =>
              Object.keys(labels['poss-pl']).map(p => ({
                tags: `pl.px${p.slice(1)}.${c}`,
              }))
            ),
          },
        ],
      },
    ],
  }
}

export const uumPlugin: LanguagePlugin = {
  backendLangCode: 'uum',
  addParadigms: add_uum,
  parseTags: (origTags: string[], cellTags: string) => {
    const parts = cellTags.split('.')
    const first = origTags[0] || ''
    if (first === 'np' || first.startsWith('np.')) return [...origTags, ...parts]
    if (first.startsWith('v')) return [...origTags, ...parts]
    if (parts.length === 3 && parts[0] === 'pl') return ['n', 'pl', parts[1], parts[2]]
    if (parts.length === 2 && parts[0].startsWith('px')) return ['n', parts[0], parts[1]]
    if (parts.length === 2 && parts[0] === 'pl') return ['n', 'pl', parts[1]]
    return ['n', parts[0]]
  },
}
