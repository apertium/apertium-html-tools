import * as queryString from 'query-string';

// https://stackoverflow.com/q/417142/1266600. Preserve enough space for the
// host and path.
// eslint-disable-next-line no-magic-numbers
export const MaxURLLength = 2048 - window.location.origin.length - 25;

export const getUrlParam = (search: string, key: string): string | null => {
  const value = queryString.parse(search)[key];
  if (value == null) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  return value.length > 0 ? value[0] : null;
};

export const buildNewSearch = (params: Record<string, string>): string => {
  return `?${queryString.stringify(params)}`;
};
