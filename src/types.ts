export enum Mode {
  Translation = 'translation',
  Analysis = 'analysis',
  Generation = 'generation',
  Sandbox = 'sandbox',
}

export type Config = {
  defaultLocale: string;
  htmlUrl: string;
  apyURL: string;
  stringReplacements: Record<string, string>;

  allowedLangs?: Set<string>;
  allowedVariants?: Set<string>;

  defaultMode: Mode;
  enabledModes: Set<Mode>;
  translationChaining: boolean;

  subtitle?: string;
  subtitleColor?: string;
};
