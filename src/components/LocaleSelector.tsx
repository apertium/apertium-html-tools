import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';

import { LocaleContext } from '../context';
import { langDirection } from '../util/languages';
import locales from '../strings/locales.json';

const height = '1.5rem';

const LocaleSelector = ({
  setLocale,
  inverse,
}: {
  inverse?: boolean;
  setLocale: React.Dispatch<React.SetStateAction<string>>;
}): React.ReactElement => {
  const locale = React.useContext(LocaleContext);

  return (
    <div className="mt-2" style={{ height }}>
      <FontAwesomeIcon className="float-right ml-2" icon={faGlobe} inverse={inverse} style={{ fontSize: height }} />
      {/* eslint-disable-next-line jsx-a11y/no-onchange */}
      <select
        className="float-right h-100"
        onChange={({ target: { value } }) => setLocale(value)}
        style={{ fontSize: '0.9rem' }}
        value={locale}
      >
        {Object.entries(locales)
          .sort(([, a], [, b]) => {
            return a.toLowerCase().localeCompare(b.toLowerCase());
          })
          .map(([locale, name]) => (
            <option dir={langDirection(locale)} key={locale} value={locale}>
              {name}
            </option>
          ))}
      </select>
    </div>
  );
};

export default LocaleSelector;
