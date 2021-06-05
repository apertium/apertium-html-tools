import engStrings from './strings/eng.json';

const defaultStrings: Record<string, string> = {};
Object.keys(engStrings).forEach((key) => (defaultStrings[key] = `${key}-Default`));
// eslint-disable-next-line
(defaultStrings as any)['@langNames'] = { eng: 'English-Default' };
defaultStrings['Maintainer'] = '{{maintainer}}-Default';

// eslint-disable-next-line
(window as any).PRELOADED_STRINGS = { eng: defaultStrings };

// eslint-disable-next-line
(window as any).PAIRS = [
  { sourceLanguage: 'eng', targetLanguage: 'cat' },
  { sourceLanguage: 'eng', targetLanguage: 'spa' },
  { sourceLanguage: 'cat', targetLanguage: 'eng' },
  { sourceLanguage: 'cat', targetLanguage: 'spa' },
  { sourceLanguage: 'spa', targetLanguage: 'eng' },
  { sourceLanguage: 'cat_foo', targetLanguage: 'spa' },
  { sourceLanguage: 'pan_Guru', targetLanguage: 'hin' },
  { sourceLanguage: 'pan_Arab', targetLanguage: 'hin' },
  { sourceLanguage: 'hin', targetLanguage: 'pan_Guru' },
  { sourceLanguage: 'hin', targetLanguage: 'pan_Arab' },
];

// eslint-disable-next-line
(window as any).PAIR_PREFS = {
  ['eng-cat']: { foo: { eng: 'foo_pref' }, bar: { cat: 'bar_pref' } },
};

// eslint-disable-next-line
(window as any).ANALYZERS = { eng: 'eng-morph', spa: 'spa-morph' };

// eslint-disable-next-line
(window as any).GENERATORS = { eng: 'eng-gener', spa: 'spa-gener' };

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line jest/no-jasmine-globals
  fail(err);
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
