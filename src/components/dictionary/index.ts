import Dictionary from './Dictionary';
import { kirPlugin } from './langs/kir';
import { spaPlugin } from './langs/spa';
import { uumPlugin } from './langs/uum';
import { LanguagePlugin } from './types';

export const languageRegistry: Record<string, LanguagePlugin> = {
  "kir": kirPlugin,
  "spa": spaPlugin,
  "uum": uumPlugin,
};

export default Dictionary;
