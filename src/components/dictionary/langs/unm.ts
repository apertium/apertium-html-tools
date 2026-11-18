import { ParadigmBlock, LanguagePlugin, AddParadigmsArgs, ParadigmMap } from "../types";

export interface UnmLabels {
  sg: string;
  pl: string;
  "person_relations": Record<string, string>;
  labels: Record<string, string>;
}

export const unmLabels: Record<string, Record<string, UnmLabels>> = {
  eng: {
    Linguist: {
      sg: 'Singular',
      pl: 'Plural',
      "person_relations": {
        p1: '1st',
        p2: '2nd',
        p3: '3rd',
        "subj_sg": 'Singular Subj',
        "subj_pl": 'Plural Subj',
        "obj_sg": 'Singular Obj',
        "obj_pl": 'Plural Obj',
        "p1_p1": '1st → 1st',
        "p1_p2": '1st → 2nd',
        "p1_p3": '1st → 3rd',
        "p2_p1": '2nd → 1st',
        "p2_p2": '2nd → 2nd',
        "p2_p3": '2nd → 3rd',
        "p3_p1": '3rd → 1st',
        "p3_p2": '3rd → 2nd',
        "p3_p3": '3rd → 3rd'
      },
      labels: {
        "ind": "Indicative",
        "sub": "Subordinative",
        "cnj": "Conujunct",
        "sbj": "Subjunctive"
      }
    },
    Learner: {
      sg: 'Singular',
      pl: 'Plural',
      "person_relations": {
        "1sg": 'I',
        "2sg": 'you',
        "3sg": 'he/she/they',
        "11pl": 'we (without you)',
        "12pl": 'we (with you)',
        "2pl": 'you all',
        "3pl": 'they',
        "1sg_": 'I →',
        "2sg_": "you →",
        "3sg_": "he/she/they →",
        "11pl_": "we (without you) →",
        "12pl_": "we (with you) →",
        "2pl_": "you all →",
        "3pl_": "they →",
        "_1sg": "→ me",
        "_2sg": "→ you",
        "_3sg": "→ him/her/them",
        "_11pl": "→ us (without you)",
        "_12pl": "→ us (with you)",
        "_2pl": "→ you all",
        "_3pl": "→ them",
      },
      labels: {
        "ind": "Indicative",
        "sub": "Subordinative",
        "cnj": "Conujunct",
        "sbj": "Subjunctive"
      }
    },
  },
};

export const unmTags2Func: ParadigmMap = {
  v: {
    iv: {
        aa: 'verb_ai',
    },
    tv: {
        nn: 'verb_ti',
        aa: 'verb_ta',
    }
  },
};

function add_unm(
  ctx: { labels: UnmLabels; t: (key: string) => string; mode?: string }
): Record<string, ParadigmBlock[]> {
  const { labels: m, t, mode } = ctx;
  
  function unmTA(tgs: string, lab: string): ParadigmBlock {
    const html = (mode === 'Learner') ? `
        <table class="paradigm-table">
          <tr><th></th><th></th><th>${t(m.person_relations._1sg)}</th><th>${t(m.person_relations._2sg)}</th><th>${t(m.person_relations._3sg)}</th><th>${t(m.person_relations._11pl)}</th><th>${t(m.person_relations._2pl)}</th><th>${t(m.person_relations._3pl)}</th></tr>
          <tr><th>${t(m.person_relations['1sg_'])}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><refl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['2sg_'])}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><refl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3sg_'])}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><refl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['11pl_'])}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><refl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['2pl_'])}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><refl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3pl_'])}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><refl>$"></td></tr>

        </table>` : `
        <table class="paradigm-table">
          <tr><th></th><th colspan="2">${t(m.person_relations.subj_sg)}</th><th colspan="2">${t(m.person_relations.subj_pl)}</th></tr>
          <tr><th></th><th>${t(m.person_relations.obj_sg)}</th><th>${t(m.person_relations.obj_pl)}</th><th>${t(m.person_relations.obj_sg)}</th><th>${t(m.person_relations.obj_pl)}</th></tr>
          <tr><th>${t(m.person_relations.p1)}</th><td colspan="2" data-to-generate="^{{HEAD}}<${tgs}><s_1sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}<${tgs}><s_1pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p1_p1)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><refl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><refl>$"></td></tr>
          <tr><th>${t(m.person_relations.p1_p2)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_2pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p1_p3)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_3pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p2)}</th><td colspan="2" data-to-generate="^{{HEAD}}<${tgs}><s_2sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}<${tgs}><s_2pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p2_p1)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_1pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p2_p2)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><refl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><refl>$"></td></tr>
          <tr><th>${t(m.person_relations.p2_p3)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_3pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p3)}</th><td colspan="2" data-to-generate="^{{HEAD}}<${tgs}><s_3sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}<${tgs}><s_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p3_p1)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_1pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p3_p2)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_2pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p3_p3)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><refl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_3pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><refl>$"></td></tr>
        </table>`;

    console.log("TA HTML", mode, html);

    return {
      id: tgs.replace(/\./g, '-'),
      label: () => t(m.labels[lab] || lab),
      html: html,
    };
  }

  function unmAI(tgs: string, lab: string): ParadigmBlock {
    if (tgs.length > 0) { tgs = '<' + tgs + '>' }
    const html = (mode === 'Learner') ? `
        <table class="paradigm-table">
          <tr><th>${t(m.person_relations['1sg'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_1sg>$"></td></tr>
          <tr><th>${t(m.person_relations['2sg'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_2sg>$"></td></tr>
          <tr><th>${t(m.person_relations['3sg'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_3sg>$"></td></tr>
          <tr><th>${t(m.person_relations['11pl'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_11pl>$"></td></tr>
          <tr><th>${t(m.person_relations['12pl'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_12pl>$"></td></tr>
          <tr><th>${t(m.person_relations['2pl'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_2pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3pl'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_3pl>$"></td></tr>

        </table>` : `
        <table class="paradigm-table">
          <tr><th></th><th>${t(m.person_relations.subj_sg)}</th><th>${t(m.person_relations.subj_pl)}</th></tr>
          <tr><th rowspan="2">${t(m.person_relations.p1)}</th><td rowspan="2" data-to-generate="^{{HEAD}}${tgs}<s_1sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_11pl>$"></td></tr>
          <tr><td data-to-generate="^{{HEAD}}${tgs}<s_12pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p2)}</th><td data-to-generate="^{{HEAD}}${tgs}<s_2sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_2pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p3)}</th><td data-to-generate="^{{HEAD}}${tgs}<s_3sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_3pl>$"></td></tr>
        </table>`;


    console.log("AI HTML", mode, html);

    return {
      id: tgs.replace(/\./g, '-'),
      label: () => t(m.labels[lab] || lab),
      html: html,
    };
  }

  return {
  
    verb_ai: [
      unmAI('', 'ind'),
      unmAI('subord', 'sub'),
      unmAI('cnj', 'cnj'),
      unmAI('sbj', 'sbj'),
    ],

    verb_ta: [
      unmTA('', 'ind'),
      unmTA('subord', 'sub'),
      unmTA('cnj', 'cnj'),
      unmTA('sbj', 'sbj'),
    ]
  }
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

const defaultLangKey = Object.keys(unmLabels)[0];
const defaultModes = unmLabels[defaultLangKey];

export const unmPlugin: LanguagePlugin = {
  backendLangCode: 'unm',
  getAvailableModes(locale: string): string[] {
    const code = locale.split('-')[0].toLowerCase();
    const modesForLang = unmLabels[code] ?? defaultModes;
    return Object.keys(modesForLang);
  },
  addParadigms({ head, mode, locale, t, apyFetch }: AddParadigmsArgs): ParadigmBlock[] {
    const code = locale.split('-')[0].toLowerCase();
    const modesForLang = unmLabels[code] ?? defaultModes;
    const modeKeys = Object.keys(modesForLang);
    const fallbackMode = modeKeys[0];
    const labelsForMode = modesForLang[mode] ?? modesForLang[fallbackMode];
    const blocksMap = add_unm({ labels: labelsForMode, t, mode });
    const origTags = Array.from(head.matchAll(/<([^>]+)>/g), (m) => m[1]);
    let key: string | undefined;
    //if (origTags.includes('iv')) key = 'verb_iv';
    //else if (origTags.includes('tv')) key = 'verb_tv';
    //else if (origTags.some((tag) => tag.startsWith('v'))) key = 'vaux';
    //else if (origTags.some((tag) => tag.startsWith('np.'))) key = 'pnoun';
    //else if (origTags[0] === 'n') key = 'noun';
    if (!key) return [];
    return blocksMap[key] || [];
  },
  parseTags,
  labels: unmLabels,
  paradigmMap: unmTags2Func,
  getParadigm(labels, t, parType, mode?: string): ParadigmBlock[] {
    const blocksMap = add_unm({ labels, t, mode });
    //console.log(`getParadigm called with parType: ${parType}`, blocksMap);
    return blocksMap[parType] || [];
  },
};
