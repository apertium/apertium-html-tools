export interface ParadigmCell { tags?: string; pretxt?: string; text?: string; }
export interface ParadigmBlock {
  id?: string;
  label: () => string;
  tabcols?: string[];
  tabrows?: string[];
  tabdata?: ParadigmCell[][];
  tablist?: Array<{ label: string; tags: string; pretxt?: string }>;
  info?: string;
  error?: string;
  subcats?: ParadigmBlock[];
}

export interface LanguagePlugin {
  addParadigms(): Record<string, ParadigmBlock[]>;
  parseTags(origTags: string[], cellTags: string): string[];
  backendLangCode: string;
}
