import { ParadigmBlock } from "../types";

export interface kirLabels {
  sg: string;
  pl: string;
  p1?: string;
  p2?: string;
  p3?: string;
  frm?: string;
  p1sg?: string;
  p1pl?: string;
  p2sg?: string;
  'p2sg-frm'?: string;
  p2pl?: string;
  'p2pl-frm'?: string;
  p3sg?: string;
  p3pl?: string;
  cases: Record<string, string>;
  labels: Record<string, string>;
  'poss-sg': Record<string, string>;
  'poss-pl': Record<string, string>;
}

export const kirLabels: Record<string, Record<string, kirLabels>> = {
  eng: {
    Linguist: {
      sg: 'Singular',
      pl: 'Plural',
      p1: '1st',
      p2: '2nd',
      p3: '3rd',
      frm: 'formal',
      cases: {
        nom: 'Nominative',
        acc: 'Accusative',
        dat: 'Dative',
        loc: 'Locative',
        gen: 'Genitive',
        abl: 'Ablative',
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
      'p2sg-frm': 'you (formal)',
      p3sg: 'he/she',
      p1pl: 'we',
      p2pl: 'you all',
      'p2pl-frm': 'you all (formal)',
      p3pl: 'they',
      cases: {
        nom: 'Nominative',
        acc: 'Accusative',
        dat: 'Dative',
        loc: 'Locative',
        gen: 'Genitive',
        abl: 'Ablative',
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
  rus: {
    'Лингвист': {
      sg: 'Единственное число',
      pl: 'Множественное число',
      p1: '1-е лицо',
      p2: '2-е лицо',
      frm: 'формальное',
      p3: '3-е лицо',
      cases: {
        nom: 'Именительный',
        acc: 'Винительный',
        dat: 'Дательный',
        loc: 'Местный',
        gen: 'Родительный',
        abl: 'Исходный',
        abe: 'Безналичный',
      },
      labels: {
        'non-personal': 'Неличные формы',
        pres: 'Настоящее время',
        past: 'Прошедшее время',
        futs: 'Будущее время',
        fut: 'Будущее неопределенное',
        fdi: 'Будущее определенное',
        'pres.cni': 'Условное',
        imp: 'Повелительное',
        'noun-cases': 'Падежи',
        'noun-poss': 'Притяжательность',
        'noun-poss-sg': 'Единственное',
        'noun-poss-pl': 'Множественное',
        affirmative: 'Утвердительный',
        negative: 'Отрицательный',
        infinitive: 'Инфинитив',
        participle: 'Причастие',
        converb: 'Деепричастие',
      },
      'poss-sg': {
        p1sg: '1-е Единственное',
        p2sg: '2-е Единственное',
        p3sg: '3-е Единственное',
        p1pl: '1-е Множественное',
        p2pl: '2-е Множественное',
        p3pl: '3-е Множественное',
      },
      'poss-pl': {
        p1sg: '1-е Единственное',
        p2sg: '2-е Единственное',
        p3sg: '3-е Единственное',
        p1pl: '1-е Множественное',
        p2pl: '2-е Множественное',
        p3pl: '3-е Множественное',
      },
    },
    'Ученик': {
      sg: 'Единственное число',
      pl: 'Множественное число',
      p1sg: 'я',
      p2sg: 'ты',
      'p2sg-frm': 'Вы (единственное)',
      p3sg: 'он/она',
      p1pl: 'мы',
      p2pl: 'вы (неформальное)',
      'p2pl-frm': 'Вы (множественное)',
      p3pl: 'они',
      cases: {
        nom: 'Именительный',
        acc: 'Винительный',
        dat: 'Дательный',
        loc: 'Местный',
        gen: 'Родительный',
        abl: 'Исходный',
        abe: 'Безналичный',
      },
      labels: {
        'non-personal': 'Неличные формы',
        pres: 'Настоящее время',
        past: 'Прошедшее время',
        futs: 'Будущее время',
        fut: 'Будущее несовершенное',
        fdi: 'Будущее совершенное',
        'pres.cni': 'Условное',
        imp: 'Повелительное',
        'noun-cases': 'Падежи',
        'noun-poss': 'Притяжательность',
        'noun-poss-sg': 'Существительное в единственном числе',
        'noun-poss-pl': 'Существительное во множественном числе',
        affirmative: 'Утвердительная',
        negative: 'Отрицательная',
        infinitive: 'Инфинитив',
        participle: 'Причастие',
        converb: 'Деепричастие',
      },
      'poss-sg': {
        p1sg: 'мой',
        p2sg: 'твой',
        p3sg: 'его/её',
        p1pl: 'наш',
        p2pl: 'ваш',
        p3pl: 'их',
      },
      'poss-pl': {
        p1sg: 'мои',
        p2sg: 'твои',
        p3sg: 'его/её',
        p1pl: 'наши',
        p2pl: 'ваши',
        p3pl: 'их',
      },
    },
  },
};

export const kirTags2Func: Record<string, string> = {
  v: {
    iv: 'verb_iv',
    tv: 'verb_tv',
  },
  vaux: 'vaux',
  n: 'noun',
  np: 'pnoun',
};


function add_kir(
  ctx: { labels: kirLabels; t: (key: string) => string }
): Record<string, ParadigmBlock[]> {
  //console.log('add_kir called with ctx:', ctx);
  const { labels: m, t } = ctx;

  return {
    vaux: [],

    verb_iv: [],

    verb_tv: [],

    noun: [
        {
            id: 'noun-cases',
            label: () => t(m.labels['noun-cases']),
            html: `
              <table class="paradigm-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>${t(m.sg)}</th>
                    <th>${t(m.pl)}</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.keys(m.cases)
                    .map(
                      (caseKey, index) => `
                      <tr>
                        <th>${t(m.cases[caseKey])}</th>
                        <td data-to-generate="^{{HEAD}}<${caseKey}>$" data-tags="${caseKey}"></td>
                        <td data-to-generate="^{{HEAD}}<pl><${caseKey}>$" data-tags="pl.${caseKey}"></td>
                      </tr>
                    `
                    )
                    .join('')}
                </tbody>
              </table>
            `,
        },
          {
            id: 'noun-poss',
            label: () => t(m.labels['noun-poss']),
            subcats: [
              {
                id: 'noun-poss-sg',
                label: () => t(m.labels['noun-poss-sg']),
                html: `
                  <table class="paradigm-table">
                    <thead>
                      <tr>
                        <th></th>
                        ${Object.values(m['poss-sg'])
                          .map(col => `<th>${t(col)}</th>`)
                          .join('')}
                      </tr>
                    </thead>
                    <tbody>
                      ${Object.keys(m.cases)
                        .map(
                          caseKey => `
                          <tr>
                            <th>${t(m.cases[caseKey])}</th>
                            ${Object.keys(m['poss-sg'])
                              .map(possKey => `<td data-tags="px${possKey.slice(1)}.${caseKey}"></td>`)
                              .join('')}
                          </tr>
                        `
                        )
                        .join('')}
                    </tbody>
                  </table>
                `,
              },
              {
                id: 'noun-poss-pl',
                label: () => t(m.labels['noun-poss-pl']),
                html: `
                  <table class="paradigm-table">
                    <thead>
                      <tr>
                        <th></th>
                        ${Object.values(m['poss-pl'])
                          .map(col => `<th>${t(col)}</th>`)
                          .join('')}
                      </tr>
                    </thead>
                    <tbody>
                      ${Object.keys(m.cases)
                        .map(
                          caseKey => `
                          <tr>
                            <th>${t(m.cases[caseKey])}</th>
                            ${Object.keys(m['poss-pl'])
                              .map(possKey => `<td data-tags="pl.px${possKey.slice(1)}.${caseKey}"></td>`)
                              .join('')}
                          </tr>
                        `
                        )
                        .join('')}
                    </tbody>
                  </table>
                `,
              },
            ],
        },
    ],

    pnoun: [],


  }
}

const defaultLangKey = Object.keys(kirLabels)[0];
const defaultModes = kirLabels[defaultLangKey];

export const kirPlugin: LanguagePlugin = {
  backendLangCode: 'kir',
  getAvailableModes(locale: string): string[] {
    const code = locale.split('-')[0].toLowerCase();
    const modesForLang = kirLabels[code] ?? defaultModes;
    return Object.keys(modesForLang);
  },
  nullParam1: {},
  nullParam2: {},
  labels: kirLabels,
  paradigmMap: kirTags2Func,
  getParadigm(labels, t, parType): ParadigmBlock[] {
    const blocksMap = add_kir({ labels, t });
    //console.log(`getParadigm called with parType: ${parType}`, blocksMap);
    return blocksMap[parType] || [];
  },
};
