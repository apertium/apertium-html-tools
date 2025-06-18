import type { createInstance } from '@datapunt/matomo-tracker-react';

export enum Mode {
  Translation = 'translation',
  Analysis = 'analysis',
  Generation = 'generation',
  Sandbox = 'sandbox',
  Dictionary = 'dictionary', // dict
}

export type Config = {
  defaultLocale: string;
  htmlUrl: string;
  apyURL: string;
  stringReplacements: Record<string, string>;
  matomoConfig?: Parameters<typeof createInstance>[0];

  allowedLangs?: Set<string>;
  allowedVariants?: Set<string>;

  defaultMode: Mode;
  enabledModes: Set<Mode>;
  translationChaining: boolean;

  subtitle?: string;
  subtitleColor?: string;
  showMoreLanguagesLink: boolean;
};
