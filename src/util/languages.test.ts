import { isVariant, langDirection, parentLang, toAlpha2Code, toAlpha3Code } from './languages';

describe('toAlpha2Code', () => {
  it.each([
    ['myv', null],
    ['eng', 'en'],
    ['eng_US', 'en_US'],
    ['en', 'en'],
    [null, null],
  ])('maps %s to %s', (before, after) => expect(toAlpha2Code(before)).toBe(after));
});

describe('toAlpha3Code', () => {
  it.each([
    ['xxx', null],
    ['tel', 'tel'],
    ['eng', 'eng'],
    ['en_US', 'eng_US'],
    ['en', 'eng'],
    [null, null],
  ])('maps %s to %s', (before, after) => expect(toAlpha3Code(before)).toBe(after));
});

describe('langDirection', () => {
  it.each([
    ['eng', 'ltr'],
    ['ara', 'rtl'],
  ])('maps %s to %s', (lang, direction) => expect(langDirection(lang)).toBe(direction));
});

describe('parentLang', () => {
  it.each([
    ['eng', 'eng'],
    ['eng_US', 'eng'],
  ])('maps %s to %s', (lang, parent) => expect(parentLang(lang)).toBe(parent));
});

describe('isVariant', () => {
  it.each([
    ['eng', false],
    ['eng_US', true],
  ])('maps %s to %s', (lang, variant) => expect(isVariant(lang)).toBe(variant));
});
