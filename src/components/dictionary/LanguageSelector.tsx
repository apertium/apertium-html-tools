import * as React from 'react';
import Button from 'react-bootstrap/Button';
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Col from 'react-bootstrap/Col';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import classNames from 'classnames';

import { NamedLangs, Pairs, SrcLangs, TgtLangs, isPair } from '../translator';
import WithSortedLanguages, { ChildProps } from '../translator/WithSortedLanguages';
import { isVariant, langDirection } from '../../util/languages';
import { LocaleContext } from '../../context';
import { useLocalization } from '../../util/localization';

export type Props = {
  pairs: Pairs;

  srcLang: string;
  setSrcLang: (code: string) => void;
  recentSrcLangs: Array<string>;
  setRecentSrcLangs: (langs: Array<string>) => void;

  tgtLang: string;
  setTgtLang: (code: string) => void;
  recentTgtLangs: Array<string>;
};

type SharedProps = Props & {
  srcLangs: NamedLangs;
  tgtLangs: NamedLangs;
  swapLangs?: () => void;
};

const langListIdealRows = 12,
  langListMaxWidths = 850,
  langListMaxColumns = 6,
  langListsBuffer = 50;
const langListMinColumnWidth = langListMaxWidths / langListMaxColumns;

const MobileLanguageSelector = ({
  pairs,
  srcLang,
  setSrcLang,
  tgtLang,
  setTgtLang,
  srcLangs,
  tgtLangs,
  swapLangs,
}: SharedProps): React.ReactElement => {
  const { tLang } = useLocalization();

  const onSrcLangChange = React.useCallback<React.ChangeEventHandler<HTMLSelectElement>>(
    ({ target: { value } }) => setSrcLang(value),
    [setSrcLang],
  );

  const onTgtLangChange = React.useCallback<React.ChangeEventHandler<HTMLSelectElement>>(
    ({ target: { value } }) => setTgtLang(value),
    [setTgtLang],
  );

  const srcLangOptions = React.useMemo(
    () => (
      <>
        {srcLangs.map(([code, name]) => (
          <option disabled={!pairs[code] || pairs[code].size === 0} key={code} value={code}>
            {name}
          </option>
        ))}
      </>
    ),
    [pairs, srcLangs],
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
    <Form.Group className="d-flex flex-column">
      <div className="d-flex flex-wrap mb-2">
        <Form.Control
          as="select"
          className="d-inline-block mr-2 mb-2"
          data-testid="src-lang-dropdown"
          onChange={onSrcLangChange}
          size="sm"
          style={{ maxWidth: '60%' }}
          value={srcLang}
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
      </div>
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
  recentTgtLangs,
  recentSrcLangs,
  srcLangs,
  tgtLangs,
  swapLangs,
}: SharedProps): React.ReactElement => {
  const locale = React.useContext(LocaleContext);
  const { tLang } = useLocalization();

  const srcLangsDropdownTriggerRef = React.createRef<HTMLDivElement>();
  const tgtLangsDropdownTriggerRef = React.createRef<HTMLDivElement>();

  const [numSrcCols, setNumSrcCols] = React.useState(1);
  const [numTgtCols, setNumTgtCols] = React.useState(1);

  React.useLayoutEffect(() => {
    const refreshSizes = () => {
      let maxSrcLangsWidth, maxTgtLangsWidth;

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

      maxSrcLangsWidth = Math.min(langListMaxWidths, maxSrcLangsWidth);
      maxTgtLangsWidth = Math.min(langListMaxWidths, maxTgtLangsWidth);

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
  }, [locale, tgtLangs.length, srcLangs.length]);

  const validTgtLang = React.useCallback((lang: string) => isPair(pairs, srcLang, lang), [pairs, srcLang]);
  const validSrcLang = React.useCallback((lang: string) => !!pairs[lang] && pairs[lang].size > 0, [pairs]);

  const MAX_QUICK = 3;

  const visibleSrcLangs = React.useMemo(() => {
    const uniq = (arr: string[]) => Array.from(new Set(arr));
    const fromRecents = (recentSrcLangs || []).filter(validSrcLang);
    if (fromRecents.length) {
      const pad = srcLangs
        .map(([c]) => c)
        .filter(validSrcLang)
        .filter((c) => !fromRecents.includes(c));
      return uniq([srcLang, ...fromRecents, ...pad]).slice(0, MAX_QUICK);
    }
    const fallbacks = srcLangs.map(([c]) => c).filter(validSrcLang);
    return uniq([srcLang, ...fallbacks]).slice(0, MAX_QUICK);
  }, [recentSrcLangs, srcLangs, validSrcLang, srcLang]);

  const visibleTgtLangs = React.useMemo(() => {
    const uniq = (arr: string[]) => Array.from(new Set(arr));
    const fromRecents = (recentTgtLangs || []).filter(validTgtLang);
    if (fromRecents.length) {
      const pad = tgtLangs
        .map(([c]) => c)
        .filter(validTgtLang)
        .filter((c) => !fromRecents.includes(c));
      return uniq([tgtLang, ...fromRecents, ...pad]).slice(0, MAX_QUICK);
    }
    const fallbacks = tgtLangs.map(([c]) => c).filter(validTgtLang);
    return uniq([tgtLang, ...fallbacks]).slice(0, MAX_QUICK);
  }, [recentTgtLangs, tgtLangs, validTgtLang, tgtLang]);

  return (
    <>
      <Form.Group className="row">
        <Col className="d-inline-flex align-items-start justify-content-between" xs="6">
          <ButtonGroup className="d-flex flex-wrap pl-0" data-testid="src-lang-buttons">
            {visibleSrcLangs.map((lang) => (
              <Button
                active={lang === srcLang}
                className="language-button"
                key={lang}
                onClick={({ currentTarget }) => {
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
            {visibleTgtLangs.map((lang) => (
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
        </Col>
      </Form.Group>
    </>
  );
};

const LanguageSelector = (props: Props): React.ReactElement => {
  const { pairs, srcLang, setSrcLang, recentSrcLangs, setRecentSrcLangs, tgtLang, setTgtLang } = props;

  const swapLangs = React.useMemo(
    () =>
      isPair(pairs, tgtLang, srcLang)
        ? () => {
            setSrcLang(tgtLang);
            setTgtLang(srcLang);
          }
        : undefined,
    [pairs, setSrcLang, setTgtLang, srcLang, tgtLang],
  );

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

  const initializedBestSrc = React.useRef(false);
  React.useEffect(() => {
    if (initializedBestSrc.current) return;
    let best = srcLang;
    let bestSize = (pairs[srcLang] && pairs[srcLang].size) || 0;
    const keys = Object.keys(pairs as Record<string, Set<string>>);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const size = (pairs[k] && pairs[k].size) || 0;
      if (size > bestSize) {
        best = k;
        bestSize = size;
      }
    }
    if (best && best !== srcLang) {
      setSrcLang(best);
      if (!isPair(pairs, best, tgtLang)) {
        const it = pairs[best] && (pairs[best] as Set<string>).values();
        const first = it ? it.next().value : undefined;
        if (first) {
          setTgtLang(first);
        }
      }
    }
    initializedBestSrc.current = true;
  }, [pairs]);

  const SelectorComponent = showMobile ? MobileLanguageSelector : DesktopLanguageSelector;

  return (
    <WithSortedLanguages pairs={pairs} srcLang={srcLang} srcLangs={SrcLangs} tgtLangs={TgtLangs}>
      {(sortedLanguageProps: ChildProps) => (
        <SelectorComponent {...props} {...sortedLanguageProps} swapLangs={swapLangs} />
      )}
    </WithSortedLanguages>
  );
};

export default LanguageSelector;
