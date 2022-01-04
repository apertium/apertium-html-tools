import * as React from 'react';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Form from 'react-bootstrap/Form';
import { faCog } from '@fortawesome/free-solid-svg-icons';

import { ConfigContext, LocaleContext } from '../../context';
import { PairPrefValues, getPairPrefs } from '.';
import { useLocalization } from '../../util/localization';

export type Props = {
  markUnknown: boolean;
  setMarkUnknown: React.Dispatch<React.SetStateAction<boolean>>;
  instantTranslation: boolean;
  setInstantTranslation: React.Dispatch<React.SetStateAction<boolean>>;
  translationChaining: boolean;
  setTranslationChaining: React.Dispatch<React.SetStateAction<boolean>>;
  srcLang: string;
  tgtLang: string;
  pairPrefs: PairPrefValues;
  setPairPrefs: (prefs: PairPrefValues) => void;
};

const TranslationOptions = ({
  markUnknown,
  setMarkUnknown,
  instantTranslation,
  setInstantTranslation,
  translationChaining,
  setTranslationChaining,
  srcLang,
  tgtLang,
  pairPrefs,
  setPairPrefs,
}: Props): React.ReactElement => {
  const { t } = useLocalization();
  const locale = React.useContext(LocaleContext);
  const config = React.useContext(ConfigContext);

  const prefs = React.useMemo(() => getPairPrefs(locale, srcLang, tgtLang), [locale, srcLang, tgtLang]);
  const [showPrefDropdown, setShowPrefDropdown] = React.useState(false);

  return (
    <>
      {Object.keys(prefs).length > 0 && (
        <DropdownButton
          className="mb-2"
          drop="down"
          onToggle={(isOpen, event, { source }) => {
            if (isOpen) {
              setShowPrefDropdown(true);
            }

            if (source === 'rootClose') {
              setShowPrefDropdown(false);
            }
          }}
          show={showPrefDropdown}
          size="sm"
          title={
            <>
              <FontAwesomeIcon icon={faCog} /> {t('Norm_Preferences')}
            </>
          }
          variant="secondary"
        >
          {Object.entries(prefs).map(([id, description]) => (
            <Form.Check
              checked={!!pairPrefs[id]}
              className="mx-3"
              custom
              id={`pref-${id}`}
              inline
              key={id}
              label={description}
              onChange={({ currentTarget }) => setPairPrefs({ ...pairPrefs, [id]: currentTarget.checked })}
              style={{ whiteSpace: 'nowrap' }}
            />
          ))}
        </DropdownButton>
      )}
      <Form.Check
        checked={markUnknown}
        custom
        id="mark-unknown-words"
        label={t('Mark_Unknown_Words')}
        onChange={({ currentTarget }) => setMarkUnknown(currentTarget.checked)}
      />
      <Form.Check
        checked={instantTranslation}
        custom
        id="instant-translation"
        label={t('Instant_Translation')}
        onChange={({ currentTarget }) => setInstantTranslation(currentTarget.checked)}
      />
      {config.translationChaining && (
        <Form.Check
          checked={translationChaining}
          custom
          id="translation-chaining"
          label={<span dangerouslySetInnerHTML={{ __html: t('Multi_Step_Translation') }} />}
          onChange={({ currentTarget }) => setTranslationChaining(currentTarget.checked)}
        />
      )}
    </>
  );
};

export default TranslationOptions;
