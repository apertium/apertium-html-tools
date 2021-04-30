import engStrings from './strings/eng.json';

const defaultStrings: Record<string, string> = {};
Object.keys(engStrings).forEach((key) => (defaultStrings[key] = `${key}-Default`));
// eslint-disable-next-line
(defaultStrings as any)['@langNames'] = { eng: 'English-Default' };
defaultStrings['Maintainer'] = '{{maintainer}}-Default';

// eslint-disable-next-line
(window as any).PRELOADED_STRINGS = { eng: defaultStrings };

// eslint-disable-next-line
(window as any).PAIRS = [];

// eslint-disable-next-line
(window as any).PAIR_PREFS = {};

// eslint-disable-next-line
(window as any).ANALYZERS = { eng: 'eng-morph', spa: 'spa-morph' };

// eslint-disable-next-line
(window as any).GENERATORS = { eng: 'eng-gener', spa: 'spa-gener' };
