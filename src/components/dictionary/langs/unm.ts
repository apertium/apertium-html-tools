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
        "obj_idf": 'Indefinite Obj',
        "1sg_": '1sg',
        "2sg_": '2sg',
        "3sg_": '3sg',
        "1pl_": '1pl',
        "11pl_": '1pl (excl)',
        "12pl_": '1pl (incl)',
        "2pl_": '2pl',
        "3pl_": '3pl',
        "_1sg": "1sg",
        "_2sg": "2sg",
        "_3sg": "3sg",
        "_1pl": "1pl",
        "_11pl": "1pl (excl)",
        "_12pl": "1pl (incl)",
        "_2pl": "2pl",
        "_3pl": "3pl",
      },
      labels: {
        "ind": "Indicative",
        "aff": "Affirmative",
        "neg": "Negative",
        "sub": "Subordinative",
        "cnj": "Conujunct",
        "sbj": "Subjunctive",
        "cnjsbj": "Conjunct and Subjunctive",
        "sbjpst": "Past Subjunctive",
        "imp": "Imperative"
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
        "1pl_": "we →",
        "11pl_": "we (without you) →",
        "12pl_": "we (with you) →",
        "2pl_": "you all →",
        "3pl_": "they →",
        "_1sg": "→ me",
        "_2sg": "→ you",
        "_3sg": "→ him/her/them",
        "_1pl": "→ us",
        "_11pl": "→ us (without you)",
        "_12pl": "→ us (with you)",
        "_2pl": "→ you all",
        "_3pl": "→ them",
        "obj_sg": '→ it/that',
        "obj_pl": '→ them/those',
        "obj_idf": '→ something',
      },
      labels: {
        "ind": "Indicative",
        "aff": "Affirmative",
        "neg": "Negative",
        "sub": "Subordinative",
        "cnj": "Conujunct",
        "sbj": "Subjunctive",
        "cnjsbj": "Conjunct and Subjunctive",
        "sbjpst": "Past Subjunctive",
        "imp": "Imperative"
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
    if (tgs.length > 0) { tgs = '<' + tgs + '>' }
    const html = (mode === 'Learner') ? `
        <table class="paradigm-table">
          <tr><th></th><th>${t(m.person_relations['_1sg'])}</th><th>${t(m.person_relations['_2sg'])}</th><th colspan="2">${t(m.person_relations['_3sg'])}</th><th>${t(m.person_relations['_11pl'])}</th><th>${t(m.person_relations['_12pl'])}</th><th>${t(m.person_relations['_2pl'])}</th><th colspan="2">${t(m.person_relations['_3pl'])}</th></tr>
          <tr><th>${t(m.person_relations['1sg_'])}</th><td>—</td><td data-to-generate="^{{HEAD}}${tgs}<dir><s_1sg><o_2sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_1sg><o_3sg>$"></td><td colspan="2">—</td><td data-to-generate="^{{HEAD}}${tgs}<dir><s_1sg><o_2pl>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_1sg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['2sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<dir><s_2sg><o_1sg>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_2sg><o_3sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_2sg><o_1pl>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_2sg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<inv><o_1sg><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_2sg><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><s_3sg><o_3sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_3sg><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_11pl><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_12pl><s_sg>$"><td data-to-generate="^{{HEAD}}${tgs}<inv><o_2pl><s_3sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><s_3sg><o_3pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['11pl_'])}</th><td rowspan="2">—</td><td rowspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_1pl><o_2sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_11pl><o_3sg>$"></td><td colspan="2" rowspan="2">—</td><td rowspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_1pl><o_2pl>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_11pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['12pl_'])}</th><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_12pl><o_3sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_12pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['2pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<dir><s_2pl><o_1sg>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_2pl><o_3sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_2pl><o_1pl>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_2pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<inv><o_1sg><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_2sg><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><s_3pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_3sg><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_11pl><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_12pl><s_pl>$"><td data-to-generate="^{{HEAD}}${tgs}<inv><o_2pl><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><s_3pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_3pl>$"></td></tr>
        </table>` : `
        <table class="paradigm-table">
          <tr><th></th><th>${t(m.person_relations['_1sg'])}</th><th>${t(m.person_relations['_2sg'])}</th><th colspan="2">${t(m.person_relations['_3sg'])}</th><th>${t(m.person_relations['_11pl'])}</th><th>${t(m.person_relations['_12pl'])}</th><th>${t(m.person_relations['_2pl'])}</th><th colspan="2">${t(m.person_relations['_3pl'])}</th></tr>
          <tr><th>${t(m.person_relations['1sg_'])}</th><td>—</td><td data-to-generate="^{{HEAD}}${tgs}<dir><s_1sg><o_2sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_1sg><o_3sg>$"></td><td colspan="2">—</td><td data-to-generate="^{{HEAD}}${tgs}<dir><s_1sg><o_2pl>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_1sg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['2sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<dir><s_2sg><o_1sg>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_2sg><o_3sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_2sg><o_1pl>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_2sg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<inv><o_1sg><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_2sg><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><s_3sg><o_3sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_3sg><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_11pl><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_12pl><s_sg>$"><td data-to-generate="^{{HEAD}}${tgs}<inv><o_2pl><s_3sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><s_3sg><o_3pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['11pl_'])}</th><td rowspan="2">—</td><td rowspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_1pl><o_2sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_11pl><o_3sg>$"></td><td colspan="2" rowspan="2">—</td><td rowspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_1pl><o_2pl>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_11pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['12pl_'])}</th><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_12pl><o_3sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_12pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['2pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<dir><s_2pl><o_1sg>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_2pl><o_3sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_2pl><o_1pl>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><s_2pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<inv><o_1sg><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_2sg><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><s_3pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_3sg><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_11pl><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_12pl><s_pl>$"><td data-to-generate="^{{HEAD}}${tgs}<inv><o_2pl><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><s_3pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><o_3pl>$"></td></tr>
        </table>`;

    //console.log("TA HTML", mode, html);

    return {
      id: tgs.replace(/\./g, '-'),
      label: () => t(m.labels[lab] || lab),
      html: html,
    };
  }

  function unmTAneg(tgs: string, lab: string): ParadigmBlock {
    if (tgs.length > 0) { tgs = '<' + tgs + '>' }
    const html = (mode === 'Learner') ? `
        <table class="paradigm-table">
          <tr><th></th><th>${t(m.person_relations['_1sg'])}</th><th>${t(m.person_relations['_2sg'])}</th><th colspan="2">${t(m.person_relations['_3sg'])}</th><th>${t(m.person_relations['_11pl'])}</th><th>${t(m.person_relations['_12pl'])}</th><th>${t(m.person_relations['_2pl'])}</th><th colspan="2">${t(m.person_relations['_3pl'])}</th></tr>
          <tr><th>${t(m.person_relations['1sg_'])}</th><td>—</td><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_1sg><o_2sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_1sg><o_3sg>$"></td><td colspan="2">—</td><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_1sg><o_2pl>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_1sg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['2sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2sg><o_1sg>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2sg><o_3sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2sg><o_1pl>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2sg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_1sg><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_2sg><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_3sg><o_3sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_3sg><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_11pl><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_12pl><s_sg>$"><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_2pl><s_3sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_3sg><o_3pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['11pl_'])}</th><td rowspan="2">—</td><td rowspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_1pl><o_2sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_11pl><o_3sg>$"></td><td colspan="2" rowspan="2">—</td><td rowspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_1pl><o_2pl>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_11pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['12pl_'])}</th><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_12pl><o_3sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_12pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['2pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2pl><o_1sg>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2pl><o_3sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2pl><o_1pl>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_1sg><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_2sg><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_3pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_3sg><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_11pl><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_12pl><s_pl>$"><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_2pl><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_3pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_3pl>$"></td></tr>
        </table>` : `
        <table class="paradigm-table">
          <tr><th></th><th>${t(m.person_relations['_1sg'])}</th><th>${t(m.person_relations['_2sg'])}</th><th colspan="2">${t(m.person_relations['_3sg'])}</th><th>${t(m.person_relations['_11pl'])}</th><th>${t(m.person_relations['_12pl'])}</th><th>${t(m.person_relations['_2pl'])}</th><th colspan="2">${t(m.person_relations['_3pl'])}</th></tr>
          <tr><th>${t(m.person_relations['1sg_'])}</th><td>—</td><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_1sg><o_2sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_1sg><o_3sg>$"></td><td colspan="2">—</td><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_1sg><o_2pl>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_1sg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['2sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2sg><o_1sg>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2sg><o_3sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2sg><o_1pl>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2sg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_1sg><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_2sg><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_3sg><o_3sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_3sg><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_11pl><s_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_12pl><s_sg>$"><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_2pl><s_3sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_3sg><o_3pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['11pl_'])}</th><td rowspan="2">—</td><td rowspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_1pl><o_2sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_11pl><o_3sg>$"></td><td colspan="2" rowspan="2">—</td><td rowspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_1pl><o_2pl>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_11pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['12pl_'])}</th><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_12pl><o_3sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_12pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['2pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2pl><o_1sg>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2pl><o_3sg>$"></td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2pl><o_1pl>$"></td><td>—</td><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_2pl><o_3pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_1sg><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_2sg><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_3pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_3sg><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_11pl><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_12pl><s_pl>$"><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_2pl><s_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<dir><neg><s_3pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<inv><neg><o_3pl>$"></td></tr>
        </table>`;

    //console.log("TA HTML", mode, html);

    return {
      id: tgs.replace(/\./g, '-'),
      label: () => t(m.labels[lab] || lab),
      html: html,
    };
  }

  function unmTAimp(tgs: string, lab: string): ParadigmBlock {
    if (tgs.length > 0) { tgs = '<' + tgs + '>' }
    const html = (mode === 'Learner') ? `
        <table class="paradigm-table">
          <tr><th></th><th colspan="2">${t(m.person_relations['2sg_'])}</th><th>${t(m.person_relations['2pl_'])}</th><th>${t(m.person_relations['1pl_'])}</th></tr>
          <tr><th>${t(m.person_relations['1sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_2sg><o_1sg>$"></td><td rowspan="2" data-to-generate="^{{HEAD}}${tgs}<s_2sg><o_1sp>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_2pl><o_1sg>$"></td><td rowspan="4" data-to-generate="^{{HEAD}}${tgs}<s_1pl>$"></td></tr>
          <tr><th>${t(m.person_relations['1pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_2sg><o_1pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3sg_'])}</th><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<s_2sg><o_3sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_2pl><o_3sg>$"></td></tr>
          <tr><th>${t(m.person_relations['3pl_'])}</th><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<s_2sg><o_3pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_2pl><o_3pl>$"></td></tr>
        </table>` : `
        <table class="paradigm-table">
          <tr><th></th><th colspan="2">${t(m.person_relations['2sg_'])}</th><th>${t(m.person_relations['2pl_'])}</th><th>${t(m.person_relations['1pl_'])}</th></tr>
          <tr><th>${t(m.person_relations['1sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_2sg><o_1sg>$"></td><td rowspan="2" data-to-generate="^{{HEAD}}${tgs}<s_2sg><o_1sp>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_2pl><o_1sg>$"></td><td rowspan="4" data-to-generate="^{{HEAD}}${tgs}<s_1pl>$"></td></tr>
          <tr><th>${t(m.person_relations['1pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_2sg><o_1pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3sg_'])}</th><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<s_2sg><o_3sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_2pl><o_3sg>$"></td></tr>
          <tr><th>${t(m.person_relations['3pl_'])}</th><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<s_2sg><o_3pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_2pl><o_3pl>$"></td></tr>
        </table>`;

    //console.log("TA HTML", mode, html);

    return {
      id: tgs.replace(/\./g, '-'),
      label: () => t(m.labels[lab] || lab),
      html: html,
    };
  }

  function unmTI(tgs: string, lab: string): ParadigmBlock {
    if (tgs.length > 0) { tgs = '<' + tgs + '>' }
    const html = `
        <table class="paradigm-table">
          <tr><th></th><th>${t(m.person_relations.obj_sg)}</th><th>${t(m.person_relations.obj_pl)}</th><th>${t(m.person_relations.obj_idf)}</th></tr>
          <tr><th>${t(m.person_relations['1sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_1sg><o_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_1sg><o_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_1sg>$"></td></tr>
          <tr><th>${t(m.person_relations['2sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_2sg><o_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_2sg><o_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_2sg>$"></td></tr>
          <tr><th>${t(m.person_relations['3sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_3sg><o_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_3sg><o_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_3sg>$"></td></tr>
          <tr><th>${t(m.person_relations['11pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_11pl><o_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_11pl><o_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_11pl>$"></td></tr>
          <tr><th>${t(m.person_relations['12pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_12pl><o_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_12pl><o_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_12pl>$"></td></tr>
          <tr><th>${t(m.person_relations['2pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_2pl><o_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_2pl><o_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_2pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_3pl><o_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_3pl><o_pl>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_3pl>$"></td></tr>
        </table>`;

    //console.log("TI HTML", mode, html);

    return {
      id: tgs.replace(/\./g, '-'),
      label: () => t(m.labels[lab] || lab),
      html: html,
    };
  }

  function unmTIneg(tgs: string, lab: string): ParadigmBlock {
    if (tgs.length > 0) { tgs = '<' + tgs + '>' }
    const html = `
        <table class="paradigm-table">
          <tr><th></th><th>${t(m.person_relations.obj_sg)}</th><th>${t(m.person_relations.obj_pl)}</th></tr>
          <tr><th>${t(m.person_relations['1sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_1sg><o_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_1sg><o_pl>$"></td></tr>
          <tr><th>${t(m.person_relations['2sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_2sg><o_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_2sg><o_pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3sg_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_3sg><o_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_3sg><o_pl>$"></td></tr>
          <tr><th>${t(m.person_relations['11pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_11pl><o_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_11pl><o_pl>$"></td></tr>
          <tr><th>${t(m.person_relations['12pl_'])}</th><td data-to-generate="^{{HEAD}}${tgs}<s_12pl><o_sg>$"></td><td data-to-generate="^{{HEAD}}${tgs}<s_12pl><o_pl>$"></td></td></tr>
          <tr><th>${t(m.person_relations['2pl_'])}</th><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<s_2pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3pl_'])}</th><td colspan="2" data-to-generate="^{{HEAD}}${tgs}<s_3pl>$"></td></tr>
        </table>`;

    //console.log("TI HTML", mode, html);

    return {
      id: tgs.replace(/\./g, '-'),
      label: () => t(m.labels[lab] || lab),
      html: html,
    };
  }

  function unmTIcnjsbj(): ParadigmBlock {
    const lab = 'cnjsbj';
    const html = `
        <table class="paradigm-table">
          <tr><th></th><th>${t(m.labels.cnj)}</th><th>${t(m.labels.sbj)}</th><th>${t(m.labels.sbjpst)}</th></tr>
          <tr><th>${t(m.person_relations['1sg_'])}</th><td data-to-generate="^{{HEAD}}<cnj><s_1sg>$"></td><td data-to-generate="^{{HEAD}}<sbj><s_1sg>$"></td><td data-to-generate="^{{HEAD}}<sbj><pst><s_1sg>$"></td></tr>
          <tr><th>${t(m.person_relations['2sg_'])}</th><td data-to-generate="^{{HEAD}}<cnj><s_2sg>$"></td><td data-to-generate="^{{HEAD}}<sbj><s_2sg>$"></td><td data-to-generate="^{{HEAD}}<sbj><pst><s_2sg>$"></td></tr>
          <tr><th>${t(m.person_relations['3sg_'])}</th><td data-to-generate="^{{HEAD}}<cnj><s_3sg>$"></td><td data-to-generate="^{{HEAD}}<sbj><s_3sg>$"></td><td data-to-generate="^{{HEAD}}<sbj><pst><s_3sg>$"></td></tr>
          <tr><th>${t(m.person_relations['11pl_'])}</th><td data-to-generate="^{{HEAD}}<cnj><s_11pl>$"></td><td data-to-generate="^{{HEAD}}<sbj><s_11pl>$"></td><td data-to-generate="^{{HEAD}}<sbj><pst><s_11pl>$"></td></tr>
          <tr><th>${t(m.person_relations['12pl_'])}</th><td data-to-generate="^{{HEAD}}<cnj><s_12pl>$"></td><td data-to-generate="^{{HEAD}}<sbj><s_12pl>$"></td><td data-to-generate="^{{HEAD}}<sbj><pst><s_12pl>$"></td></tr>
          <tr><th>${t(m.person_relations['2pl_'])}</th><td data-to-generate="^{{HEAD}}<cnj><s_2pl>$"></td><td data-to-generate="^{{HEAD}}<sbj><s_2pl>$"></td><td data-to-generate="^{{HEAD}}<sbj><pst><s_2pl>$"></td></tr>
          <tr><th>${t(m.person_relations['3pl_'])}</th><td data-to-generate="^{{HEAD}}<cnj><s_3pl>$"></td><td data-to-generate="^{{HEAD}}<sbj><s_3pl>$"></td><td data-to-generate="^{{HEAD}}<sbj><pst><s_3pl>$"></td></tr>
        </table>`;

    //console.log("TI HTML", mode, html);

    return {
      id: lab,
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


    //console.log("AI HTML", mode, html);

    return {
      id: tgs.replace(/\./g, '-'),
      label: () => t(m.labels[lab] || lab),
      html: html,
    };
  }

  return {
    verb_ai: [
      {
        id: 'ind',
        label: () => t(m.labels.ind),
        subcats: [unmAI('', 'aff'), unmAI('neg', 'neg')],
      },
      unmAI('subord', 'sub'),
      unmAI('cnj', 'cnj'),
      unmAI('sbj', 'sbj'),
    ],

    verb_ti: [
      {
        id: 'ind',
        label: () => t(m.labels.ind),
        subcats: [unmTI('', 'aff'), unmTIneg('neg', 'neg')],
      },
      unmTI('subord', 'sub'),
      unmTIcnjsbj(),
    ],

    verb_ta: [
      {
        id: 'ind',
        label: () => t(m.labels.ind),
        subcats: [unmTA('', 'aff'), unmTAneg('', 'neg')],
      },
      unmTAimp('imp', 'imp'),
      unmTA('subord', 'sub'),
      unmTA('cnj', 'cnj'),
      unmTA('sbj', 'sbj'),
      unmTA('sbj><pst', 'sbjpst'),
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
