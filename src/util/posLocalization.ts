import eng from '../strings/pos/eng.json';
import ukr from '../strings/pos/ukr.json';
import rus from '../strings/pos/rus.json';

type PosMap = Record<string, Record<string, string>>;

const posMap: PosMap = {
  eng,
  ukr,
  rus,
};

export function getPosTag(locale: string, tagKey: string): string {
  const code = locale.length === 2 ? locale + 'g' : locale; 
  const map = posMap[code];
  if (map && Object.prototype.hasOwnProperty.call(map, tagKey)) {
    return map[tagKey];
  }
  return tagKey;
}
