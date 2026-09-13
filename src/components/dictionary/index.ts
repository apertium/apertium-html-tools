import Dictionary from './Dictionary';
import { haaPlugin } from './langs/haa';
import { kirPlugin } from './langs/kir';
import { spaPlugin } from './langs/spa';
import { uumPlugin } from './langs/uum';
import { LanguagePlugin } from './types';

export const languageRegistry: Record<string, LanguagePlugin> = {
  "haa": haaPlugin,
  "kir": kirPlugin,
  "spa": spaPlugin,
  "uum": uumPlugin,
};

export default Dictionary;
