import * as React from 'react';
import Button, { ButtonProps } from 'react-bootstrap/Button';
import { faExchangeAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Col from 'react-bootstrap/Col';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import classNames from 'classnames';

import { DetectCompleteEvent, DetectEvent, NamedLangs, Pairs, SrcLangs, TgtLangs, isPair } from '.';
import WithSortedLanguages, { ChildProps } from './WithSortedLanguages';
import { isVariant, langDirection } from '../../util/languages';
import { LocaleContext } from '../../context';
import { useLocalization } from '../../util/localization';

export type Props = {
  pairs: Pairs;
  onTranslate: () => void;
  loading: boolean;

  srcLang: string;
  setSrcLang: (code: string) => void;
  recentSrcLangs: Array<string>;
  setRecentSrcLangs: (langs: Array<string>) => void;

  tgtLang: string;
  setTgtLang: (code: string) => void;
  recentTgtLangs: Array<string>;
  swapLangText: () => void;

  detectLangEnabled: boolean;
  detectedLang: string | null;
  setDetectedLang: (lang: string | null) => void;
};

type SharedProps = Props & {
  srcLangs: NamedLangs;
  tgtLangs: NamedLangs;
  swapLangs?: () => void;
  detectingLang: boolean;
  setDetectingLang: (detecting: boolean) => void;
  onDetectLang: () => void;
};

const langListIdealRows = 12,
  langListMaxWidths = 850,
  langListMaxColumns = 6,
  langListsBuffer = 50;
const langListMinColumnWidth = langListMaxWidths / langListMaxColumns;

const detectKey = 'detect';

const TranslateButton = (props: { loading: boolean; onTranslate: () => void } & ButtonProps): React.ReactElement => {
  const { t } = useLocalization();
  const { loading, onTranslate, ...buttonProps } = props;

  return (
    <Button
      className="btn-sm ml-auto"
      onClick={({ currentTarget }) => {
        onTranslate();
        currentTarget.blur();
      }}
      size="sm"
      type="button"
      {...buttonProps}
    >
      {loading ? (
        <>
          <FontAwesomeIcon className="mr-1" icon={faSpinner} spin />{' '}
        </>
      ) : null}
      {t('Translate')}
    </Button>
  );
};

const MobileLanguageSelector = ({
  pairs,
  srcLang,
  setSrcLang,
  tgtLang,
  setTgtLang,
  onTranslate,
  srcLangs,
  tgtLangs,
  swapLangs,
  loading,
  onDetectLang,
  detectLangEnabled,
  detectedLang,
  detectingLang,
}: SharedProps): React.ReactElement => {
  const { t, tLang } = useLocalization();

  const onSrcLangChange = React.useCallback<React.ChangeEventHandler<HTMLSelectElement>>(
    ({ target: { value } }) => {
      if (value === detectKey) {
        onDetectLang();
      } else {
        setSrcLang(value);
      }
    },
    [onDetectLang, setSrcLang],
  );
  const onTgtLangChange = React.useCallback<React.ChangeEventHandler<HTMLSelectElement>>(
    ({ target: { value } }) => setTgtLang(value),
    [setTgtLang],
  );

  const srcLangOptions = React.useMemo(
    () => (
      <>
        <option disabled={!detectLangEnabled} key={detectKey} value={detectKey}>
          {detectedLang ? `${tLang(detectedLang)} - ${t('detected')}` : t('Detect_Language')}
        </option>
        {srcLangs.map(([code, name]) => (
          <option disabled={pairs[srcLang].size === 0} key={code} value={code}>
            {name}
          </option>
        ))}
      </>
    ),
    [detectLangEnabled, detectedLang, pairs, srcLang, srcLangs, t, tLang],
  );

  const tgtLangOptions = React.useMemo(
    () => (
      <>
        {tgtLangs.map(([code, name]) => (
          <option disabled={!isPair(pairs, srcLang, code)} key={code} value={code}>
            {name}
          </option>
        ))}
      </>
    ),
    [pairs, srcLang, tgtLangs],
  );

  return (
    <Form.Group className="d-flex flex-wrap">
      <Form.Control
        as="select"
        className="d-inline-block mb-2 mr-2"
        data-testid="src-lang-dropdown"
        onChange={onSrcLangChange}
        size="sm"
        style={{ maxWidth: '60%' }}
        value={detectingLang || detectedLang ? detectKey : srcLang}
      >
        {srcLangOptions}
      </Form.Control>
      <Button
        className="mb-2"
        data-testid="swap-langs-button"
        disabled={!swapLangs}
        onClick={swapLangs}
        size="sm"
        type="button"
        variant="secondary"
      >
        <FontAwesomeIcon icon={faExchangeAlt} />
      </Button>
      <Form.Control
        as="select"
        className="d-inline-block"
        data-testid="tgt-lang-dropdown"
        onChange={onTgtLangChange}
        size="sm"
        style={{ maxWidth: '60%' }}
        value={tgtLang}
      >
        {tgtLangOptions}
      </Form.Control>
      <TranslateButton loading={loading} onTranslate={onTranslate} variant="primary" />
    </Form.Group>
  );
};

const LangsDropdown = ({
  langs,
  numCols,
  setLang,
  validLang,
}: {
  langs: NamedLangs;
  numCols: number;
  setLang: (code: string) => void;
  validLang: (code: string) => boolean;
}): React.ReactElement => {
  const langsPerCol = React.useMemo(() => {
    let langsPerCol = Math.ceil(langs.length / numCols);

    for (let i = 0; i < numCols; i++) {
      while (i * langsPerCol < langs.length && isVariant(langs[i * langsPerCol][0])) {
        langsPerCol++;
      }
    }

    return langsPerCol;
  }, [langs, numCols]);

  const langCols = [];

  for (let i = 0; i < numCols; i++) {
    const numLang = langsPerCol * i;
    const langElems: Array<React.ReactElement> = [];

    for (let j = numLang; j < langs.length && j < numLang + langsPerCol; j++) {
      const [code, name] = langs[j];
      const valid = !validLang || validLang(code);
      langElems.push(
        <button
          className={classNames('language-name', {
            'variant-language-name': isVariant(code),
            'text-muted': !valid,
          })}
          disabled={!valid}
          key={code}
          onClick={() => {
            setLang(code);
            document.body.click();
          }}
          tabIndex={0}
        >
          {name}
        </button>,
      );
    }
    langCols.push(
      <div className="language-name-col" key={i} style={{ width: `${100.0 / numCols}%` }}>
        {langElems}
      </div>,
    );
  }

  return (
    <Row className="d-flex" style={{ minWidth: numCols * langListMinColumnWidth }}>
      {langCols}
    </Row>
  );
};

const DesktopLanguageSelector = ({
  pairs,
  srcLang,
  setSrcLang,
  tgtLang,
  setTgtLang,
  onTranslate,
  recentTgtLangs,
  recentSrcLangs,
  srcLangs,
  tgtLangs,
  swapLangs,
  loading,
  detectLangEnabled,
  detectedLang,
  setDetectingLang,
  detectingLang,
  onDetectLang,
}: SharedProps): React.ReactElement => {
  const locale = React.useContext(LocaleContext);
  const { t, tLang } = useLocalization();

  const srcLangsDropdownTriggerRef = React.createRef<HTMLDivElement>();
  const tgtLangsDropdownTriggerRef = React.createRef<HTMLDivElement>();

  const [numSrcCols, setNumSrcCols] = React.useState(1);
  const [numTgtCols, setNumTgtCols] = React.useState(1);

  React.useLayoutEffect(() => {
    const refreshSizes = () => {
      let maxSrcLangsWidth, maxTgtLangsWidth;

      // Figure out how much space is actually available for the columns.
      const srcLangsDropdownOffset = srcLangsDropdownTriggerRef.current?.getBoundingClientRect().x || 0;
      const tgtLangsDropdownOffset = tgtLangsDropdownTriggerRef.current?.getBoundingClientRect().x || 0;
      const srcLangsDropdownWidth = srcLangsDropdownTriggerRef.current?.offsetWidth || 0;
      const tgtLangsDropdownWidth = tgtLangsDropdownTriggerRef.current?.offsetWidth || 0;
      if (langDirection(locale) === 'ltr') {
        maxSrcLangsWidth = window.innerWidth - srcLangsDropdownOffset - langListsBuffer;
        maxTgtLangsWidth = tgtLangsDropdownOffset + tgtLangsDropdownWidth - langListsBuffer;
      } else {
        maxSrcLangsWidth = srcLangsDropdownOffset + srcLangsDropdownWidth - langListsBuffer;
        maxTgtLangsWidth = window.innerWidth - tgtLangsDropdownOffset - langListsBuffer;
      }

      // Then, prevent all the columns from getting too wide.
      maxSrcLangsWidth = Math.min(langListMaxWidths, maxSrcLangsWidth);
      maxTgtLangsWidth = Math.min(langListMaxWidths, maxTgtLangsWidth);

      // Finally, pick the ideal number of columns (up to limitations from the
      // maximum overall width and the imposed maximum).
      setNumSrcCols(
        Math.max(
          1,
          Math.min(
            Math.ceil(srcLangs.length / langListIdealRows),
            Math.floor(maxSrcLangsWidth / langListMinColumnWidth),
            langListMaxColumns,
          ),
        ),
      );
      setNumTgtCols(
        Math.max(
          1,
          Math.min(
            Math.ceil(tgtLangs.length / langListIdealRows),
            Math.floor(maxTgtLangsWidth / langListMinColumnWidth),
            langListMaxColumns,
          ),
        ),
      );
    };

    window.addEventListener('resize', refreshSizes);
    refreshSizes();

    return () => window.removeEventListener('resize', refreshSizes);
  }, [locale, tgtLangs.length, srcLangs.length, tgtLangsDropdownTriggerRef, srcLangsDropdownTriggerRef]);

  const validTgtLang = React.useCallback((lang: string) => isPair(pairs, srcLang, lang), [pairs, srcLang]);
  const validSrcLang = React.useCallback((lang: string) => pairs[lang].size > 0, [pairs]);

  return (
    <Form.Group className="row">
      <Col className="d-inline-flex align-items-start justify-content-between" xs="6">
        <ButtonGroup className="d-flex flex-wrap pl-0" data-testid="src-lang-buttons">
          {recentSrcLangs.map((lang) => (
            <Button
              active={lang === srcLang && !detectingLang && !detectedLang}
              className="language-button"
              key={lang}
              onClick={({ currentTarget }) => {
                setDetectingLang(false);
                setSrcLang(lang);
                currentTarget.blur();
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              {tLang(lang)}
            </Button>
          ))}
          <Button
            active={detectingLang || detectedLang !== null}
            className="language-button"
            disabled={!detectLangEnabled}
            onClick={onDetectLang}
            size="sm"
            type="button"
            value={detectKey}
            variant="secondary"
          >
            {detectedLang ? (
              `${tLang(detectedLang)} - ${t('detected')}`
            ) : (
              <>
                {detectingLang && <FontAwesomeIcon className="mr-1" icon={faSpinner} spin />} {t('Detect_Language')}
              </>
            )}
          </Button>
          <DropdownButton
            className="language-dropdown-button"
            data-testid="src-lang-dropdown"
            ref={srcLangsDropdownTriggerRef}
            size="sm"
            title=""
            variant="secondary"
          >
            <LangsDropdown langs={srcLangs} numCols={numSrcCols} setLang={setSrcLang} validLang={validSrcLang} />
          </DropdownButton>
        </ButtonGroup>
        <Button
          data-testid="swap-langs-button"
          disabled={!swapLangs}
          onClick={swapLangs}
          size="sm"
          type="button"
          variant="secondary"
        >
          <FontAwesomeIcon icon={faExchangeAlt} />
        </Button>
      </Col>
      <Col className="d-inline-flex align-items-start justify-content-between" xs="6">
        <ButtonGroup className="d-flex flex-wrap pl-0" data-testid="tgt-lang-buttons">
          {recentTgtLangs.map((lang) => (
            <Button
              active={lang === tgtLang}
              className="language-button"
              disabled={!isPair(pairs, srcLang, lang)}
              key={lang}
              onClick={({ currentTarget }) => {
                setTgtLang(lang);
                currentTarget.blur();
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              {tLang(lang)}
            </Button>
          ))}
          <DropdownButton
            alignRight
            className="language-dropdown-button"
            data-testid="tgt-lang-dropdown"
            ref={tgtLangsDropdownTriggerRef}
            size="sm"
            title=""
            variant="secondary"
          >
            <LangsDropdown langs={tgtLangs} numCols={numTgtCols} setLang={setTgtLang} validLang={validTgtLang} />
          </DropdownButton>
        </ButtonGroup>
        <TranslateButton loading={loading} onTranslate={onTranslate} variant="primary" />
      </Col>
    </Form.Group>
  );
};

const LanguageSelector = (props: Props): React.ReactElement => {
  const {
    pairs,
    srcLang,
    setSrcLang,
    recentSrcLangs,
    setRecentSrcLangs,
    tgtLang,
    setTgtLang,
    setDetectedLang,
    swapLangText,
  } = props;

  const swapLangs = React.useMemo(
    () =>
      isPair(pairs, tgtLang, srcLang)
        ? () => {
            setSrcLang(tgtLang);
            setTgtLang(srcLang);
            swapLangText();
          }
        : undefined,
    [pairs, setSrcLang, setTgtLang, srcLang, tgtLang, swapLangText],
  );

  const [detectingLang, setDetectingLang] = React.useState(false);

  const onDetectLang = React.useCallback(() => {
    setDetectingLang(true);
    window.dispatchEvent(new Event(DetectEvent));
  }, []);

  React.useEffect(() => {
    const langDetected = (event_: Event) => {
      setDetectingLang(false);

      const { detail } = event_ as CustomEvent<Record<string, number> | null>;
      if (detail == null) {
        return;
      }

      const possibleLanguages: Array<[string, number]> = Object.entries(detail).map(([lang, prob]) => [lang, prob]);
      possibleLanguages.sort(([, a], [, b]) => b - a);

      let newRecentSrcLangs: Array<string> = [];
      possibleLanguages.forEach(([lang]) => {
        if (newRecentSrcLangs.length < recentSrcLangs.length && lang in pairs) {
          newRecentSrcLangs.push(lang);
        }
      });
      newRecentSrcLangs = newRecentSrcLangs.concat(recentSrcLangs);
      if (newRecentSrcLangs.length > recentSrcLangs.length) {
        newRecentSrcLangs = newRecentSrcLangs.slice(0, recentSrcLangs.length);
      }

      setRecentSrcLangs(newRecentSrcLangs);
      setSrcLang(newRecentSrcLangs[0]);
      setDetectedLang(newRecentSrcLangs[0]);
    };

    window.addEventListener(DetectCompleteEvent, langDetected, false);
    return () => window.removeEventListener(DetectCompleteEvent, langDetected);
  }, [pairs, recentSrcLangs, setDetectedLang, setRecentSrcLangs, setSrcLang]);

  const mobileMediaQuery = React.useRef(window.matchMedia('(max-width: 768px)'));
  const [showMobile, setShowMobile] = React.useState(mobileMediaQuery.current.matches);
  React.useEffect(() => {
    const handleMediaChange = ({ matches }: MediaQueryListEvent) => {
      setShowMobile(matches);
    };

    const { current } = mobileMediaQuery;
    current.addEventListener('change', handleMediaChange);
    return () => current.removeEventListener('change', handleMediaChange);
  }, []);

  const SelectorComponent = showMobile ? MobileLanguageSelector : DesktopLanguageSelector;

  return (
    <WithSortedLanguages pairs={pairs} srcLang={srcLang} srcLangs={SrcLangs} tgtLangs={TgtLangs}>
      {(sortedLanguageProps: ChildProps) => (
        <SelectorComponent
          {...{
            ...props,
            ...sortedLanguageProps,
            swapLangs,
            setDetectingLang,
            detectingLang,
            onDetectLang,
          }}
        />
      )}
    </WithSortedLanguages>
  );
};

export default LanguageSelector;
