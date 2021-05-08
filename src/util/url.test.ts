import { buildNewSearch, getUrlParam } from './url';

describe('getUrlParam', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['dir', 'eng-spa', '?dir=eng-spa'],
    ['lang', null, '?dir=eng-spa'],
    ['dir', null, ''],
  ])('extracts %s to %s in "%s"', (param, value, search) => {
    expect(getUrlParam(search, param)).toBe(value);
  });
});

describe('buildNewSearch', () => {
  it.each([
    [{}, '?'],
    [{ dir: 'eng-spa' }, '?dir=eng-spa'],
  ])('maps %s to %s', (params, url) => expect(buildNewSearch(params)).toBe(url));
});
