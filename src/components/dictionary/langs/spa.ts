const spaCols = ['Singular', 'Plural']
const spaRows = ['1st', '2nd', '3rd']

function spaP123Table(ctx: { t: (key: string) => string }, label: string, prefix: string): ParadigmBlock {
  const { t } = ctx
  return {
    id: prefix,
    label: () => t(label),
    tabcols: spaCols.map(c => t(c)),
    tabrows: spaRows.map(r => t(r)),
    tabdata: [
      [{ tags: `${prefix}.p1.sg` }, { tags: `${prefix}.p1.pl` }],
      [{ tags: `${prefix}.p2.sg` }, { tags: `${prefix}.p2.pl` }],
      [{ tags: `${prefix}.p3.sg` }, { tags: `${prefix}.p3.pl` }],
    ],
  }
}

function spaCompound(ctx: { t: (key: string) => string }, id: string, label: string, forms: [string, string, string, string, string, string]): ParadigmBlock {
  const { t } = ctx
  const [p1sg, p1pl, p2sg, p2pl, p3sg, p3pl] = forms
  return {
    id,
    label: () => t(label),
    tabcols: spaCols.map(c => t(c)),
    tabrows: spaRows.map(r => t(r)),
    tabdata: [
      [{ pretxt: p1sg, tags: `${id}.p1.sg` }, { pretxt: p1pl, tags: `${id}.p1.pl` }],
      [{ pretxt: p2sg, tags: `${id}.p2.sg` }, { pretxt: p2pl, tags: `${id}.p2.pl` }],
      [{ pretxt: p3sg, tags: `${id}.p3.sg` }, { pretxt: p3pl, tags: `${id}.p3.pl` }],
    ],
  }
}

export function add_spa(ctx: { t: (key: string) => string }): ParadigmBlock[] {
  const { t } = ctx
  return [
    spaP123Table({ t }, 'Present', 'pri'),
    spaP123Table({ t }, 'Past imperfect', 'pii'),
    spaP123Table({ t }, 'Past definite', 'ifi'),
    spaP123Table({ t }, 'Simple future', 'fti'),
    spaP123Table({ t }, 'Simple conditional', 'cni'),
    spaCompound({ t }, 'vbhaver-pri', 'Compound past definite', ['he', 'hemos', 'has', 'habéis', 'ha', 'han']),
    spaCompound({ t }, 'vbhaver-pii', 'Compound past perfect', ['había', 'habíamos', 'habías', 'habíais', 'había', 'habían']),
    spaCompound({ t }, 'vbhaver-ifi', 'Compound past anterior', ['hube', 'hubimos', 'hubiste', 'hubisteis', 'hubo', 'hubieron']),
    spaCompound({ t }, 'vbhaver-fti', 'Compound future', ['habré', 'habremos', 'habrás', 'habréis', 'habrá', 'habrán']),
    spaCompound({ t }, 'vbhaver-cni', 'Compound conditional', ['habría', 'habríamos', 'habrías', 'habríais', 'habría', 'habrían']),
  ]
}

const spaBlocks: Record<string, (ctx: { t: (key: string) => string }) => ParadigmBlock[]> = {
  vblex: add_spa,
}

export const spaPlugin: LanguagePlugin = {
  backendLangCode: 'spa',
  addParadigms({ head, mode, locale, t, apyFetch }: AddParadigmsArgs): ParadigmBlock[] {
    const origTags = Array.from(head.matchAll(/<([^>]+)>/g), m => m[1])
    for (const pos of Object.keys(spaBlocks)) {
      if (origTags.includes(pos)) {
        return spaBlocks[pos]({ t })
      }
    }
    return []
  },
  parseTags: (orig, cell) => orig.concat(cell.split('.')),
}
