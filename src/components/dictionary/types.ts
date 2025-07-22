import { CancelTokenSource } from 'axios';

export interface ParadigmCell {
  tags?: string;
  pretxt?: string;
  text?: string;
}

export interface ParadigmBlock {
  id?: string;
  label: () => string;
  tabcols?: string[];
  tabrows?: string[];
  tabdata?: ParadigmCell[][];
  tablist?: Array<{ label: string; tags: string; pretxt?: string }>;
  info?: string;
  subcats?: ParadigmBlock[];
}

export interface AddParadigmsArgs {
  head: string;
  mode: string;
  locale: string;
  t: (key: string, vars?: any) => string;
  apyFetch: (type: string, opts: any) => [CancelTokenSource, Promise<any>];
}

export interface LanguagePlugin {
  backendLangCode: string;
  addParadigms: (args: AddParadigmsArgs) => ParadigmBlock[];
  parseTags: (origTags: string[], cellTags: string) => string[];
  getAvailableModes?: (locale: string) => string[];
}
