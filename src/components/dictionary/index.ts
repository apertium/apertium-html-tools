import Dictionary from './Dictionary'
import { spaPlugin } from './langs/spa'
import { uumPlugin } from './langs/uum'
import { LanguagePlugin } from './types'

export const languageRegistry: Record<string, LanguagePlugin> = {
  spa: spaPlugin,
  uum: uumPlugin,
}

export default Dictionary
