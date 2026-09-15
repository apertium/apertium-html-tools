import { ParadigmBlock, LanguagePlugin, AddParadigmsArgs } from "../types";

export interface HaaLabels {
  sg: string;
  pl: string;
  "person_relations": Record<string, string>;
  labels: Record<string, string>;
}

export const haaLabels: Record<string, Record<string, HaaLabels>> = {
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
        "impf": "Imperfect",
        "perf": "Perfect",
        "incp": "Inceptive",
        "fut": "Future"
      }
    },
    Learner: {
      sg: 'Singular',
      pl: 'Plural',
      "person_relations": {
        p1sg: 'I',
        p2sg: 'you',
        p3sg: 'he/she/they',
        p1pl: 'we',
        p2pl: 'you all',
        p3pl: 'they',
        "p1sg_": 'I →',
        "p2sg_": "you →",
        "p3sg_": "he/she/they →",
        "p1pl_": "we →",
        "p2pl_": "you all →",
        "p3pl_": "they →",
        "_p1sg": "→ me",
        "_p2sg": "→ you",
        "_p3sg": "→ him/her/them",
        "_p1pl": "→ us",
        "_p2pl": "→ you all",
        "_p3pl": "→ them",
      },
      labels: {
        "impf": "Imperfect",
        "perf": "Perfect",
        "incp": "Inceptive",
        "fut": "Future"
      }
    },
  },
};

export const haaTags2Func: Record<string, Record<string, string>> = {
  v: {
    iv: 'verb_iv',
    tv: 'verb_tv',
    '': 'verb_iv',
  },
};

function add_haa(
  ctx: { labels: HaaLabels; t: (key: string) => string; mode?: string }
): Record<string, ParadigmBlock[]> {
  const { labels: m, t, mode } = ctx;
  
  function haaTv(tgs: string, lab: string): ParadigmBlock {
    const html = (mode === 'Learner') ? `
        <table class="paradigm-table">
          <tr><th></th><th></th><th>${t(m.person_relations._p1sg)}</th><th>${t(m.person_relations._p2sg)}</th><th>${t(m.person_relations._p3sg)}</th><th>${t(m.person_relations._p1pl)}</th><th>${t(m.person_relations._p2pl)}</th><th>${t(m.person_relations._p3pl)}</th></tr>
          <tr><th>${t(m.person_relations.p1sg_)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><refl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p2sg_)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><refl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p3sg_)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><refl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p1pl_)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><refl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p2pl_)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><refl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p3pl_)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_1pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><o_2pl>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl><refl>$"></td></tr>

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

    console.log("TV HTML", mode, html);

    return {
      id: tgs.replace(/\./g, '-'),
      label: () => t(m.labels[lab] || lab),
      html: html,
    };
  }

  function haaIv(tgs: string, lab: string): ParadigmBlock {
    const html = (mode === 'Learner') ? `
        <table class="paradigm-table">
          <tr><th>${t(m.person_relations.p1sg)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg>$"></td></tr>
          <tr><th>${t(m.person_relations.p2sg)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg>$"></td></tr>
          <tr><th>${t(m.person_relations.p3sg)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg>$"></td></tr>
          <tr><th>${t(m.person_relations.p1pl)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p2pl)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p3pl)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl>$"></td></tr>

        </table>` : `
        <table class="paradigm-table">
          <tr><th></th><th>${t(m.person_relations.subj_sg)}</th><th>${t(m.person_relations.subj_pl)}</th></tr>
          <tr><th>${t(m.person_relations.p1)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_1sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_1pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p2)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_2sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_2pl>$"></td></tr>
          <tr><th>${t(m.person_relations.p3)}</th><td data-to-generate="^{{HEAD}}<${tgs}><s_3sg>$"></td><td data-to-generate="^{{HEAD}}<${tgs}><s_3pl>$"></td></tr>
        </table>`;


    console.log("IV HTML", mode, html);

    return {
      id: tgs.replace(/\./g, '-'),
      label: () => t(m.labels[lab] || lab),
      html: html,
    };
  }

  return {
  
    verb_iv: [
      haaIv('impf', 'impf'),
      haaIv('perf', 'perf'),
      haaIv('incp', 'incp'),
      haaIv('fut', 'fut')
    ],

    verb_tv: [
      haaTv('impf', 'impf'),
      haaTv('perf', 'perf'),
      haaTv('incp', 'incp'),
      haaTv('fut', 'fut')
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

const defaultLangKey = Object.keys(haaLabels)[0];
const defaultModes = haaLabels[defaultLangKey];

export const haaPlugin: LanguagePlugin = {
  backendLangCode: 'haa',
  getAvailableModes(locale: string): string[] {
    const code = locale.split('-')[0].toLowerCase();
    const modesForLang = haaLabels[code] ?? defaultModes;
    return Object.keys(modesForLang);
  },
  addParadigms({ head, mode, locale, t, apyFetch }: AddParadigmsArgs): ParadigmBlock[] {
    const code = locale.split('-')[0].toLowerCase();
    const modesForLang = haaLabels[code] ?? defaultModes;
    const modeKeys = Object.keys(modesForLang);
    const fallbackMode = modeKeys[0];
    const labelsForMode = modesForLang[mode] ?? modesForLang[fallbackMode];
    const blocksMap = add_haa({ labels: labelsForMode, t, mode });
    const origTags = Array.from(head.matchAll(/<([^>]+)>/g), (m) => m[1]);
    let key: string | undefined;
    if (origTags.includes('iv')) key = 'verb_iv';
    else if (origTags.includes('tv')) key = 'verb_tv';
    else if (origTags.some((tag) => tag.startsWith('v'))) key = 'vaux';
    else if (origTags.some((tag) => tag.startsWith('np.'))) key = 'pnoun';
    else if (origTags[0] === 'n') key = 'noun';
    if (!key) return [];
    return blocksMap[key] || [];
  },
  parseTags,
  labels: haaLabels,
  paradigmMap: haaTags2Func,
  getParadigm(labels, t, parType, mode?: string): ParadigmBlock[] {
    const blocksMap = add_haa({ labels, t, mode });
    //console.log(`getParadigm called with parType: ${parType}`, blocksMap);
    return blocksMap[parType] || [];
  },
};
