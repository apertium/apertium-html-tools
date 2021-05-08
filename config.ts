import { Config, Mode } from './src/types';

export default {
  defaultLocale: 'eng',
  htmlUrl: 'https://beta.apertium.org/',
  apyURL: 'https://beta.apertium.org/apy',

  defaultMode: Mode.Translation,
  enabledModes: new Set([Mode.Translation, Mode.Analysis, Mode.Generation, Mode.Sandbox]),
  translationChaining: true,

  subtitle: 'Beta',
  subtitleColor: 'rgb(220, 41, 38)',

  stringReplacements: {
    '{{maintainer}}': "<a href='http://wiki.apertium.org/wiki/Apertium' target='_blank' rel='noopener'>Apertium</a>",
  },
} as Config;
