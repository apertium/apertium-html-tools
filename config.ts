import { Config, Mode } from './src/types';

export default {
  defaultLocale: 'eng',
  htmlUrl: 'https://beta.apertium.org/',
  //apyURL: 'https://beta.apertium.org/apy',
  apyURL: 'http://localhost:2737',

  defaultMode: Mode.Dictionary,
  enabledModes: new Set([Mode.Translation, Mode.Dictionary]),
  translationChaining: true,

  subtitle: 'Urum',
  subtitleColor: 'rgb(38, 214, 220)',

  stringReplacements: {
    '{{maintainer}}': "<a href='https://wiki.apertium.org/wiki/Apertium' target='_blank' rel='noopener'>Apertium</a>",
    '{{more_languages}}': "<a href='https://beta.apertium.org' rel='noreferrer'  target='_blank'>beta.apertium.org</a>",
  },
  showMoreLanguagesLink: false,
} as Config;
