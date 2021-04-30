import * as React from 'react';
import axios, { CancelTokenSource } from 'axios';
import { faCopy, faTimes } from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import { DetectCompleteEvent, DetectEvent, PairPrefValues, TranslateEvent, baseUrlParams } from '.';
import { MaxURLLength, buildNewSearch, getUrlParam } from '../../util/url';
import { APyContext } from '../../context';
import { buildUrl as buildWebpageTranslationUrl } from './WebpageTranslationForm';
import { langDirection } from '../../util/languages';
import useLocalStorage from '../../util/useLocalStorage';
import { useLocalization } from '../../util/localization';

const textUrlParam = 'q';

const instantTranslationPunctuationDelay = 1000,
  instantTranslationDelay = 3000;

const punctuation = new Set(['Period', 'Semicolon', 'Comma', 'Digit1', 'Slash']);

const autoResizeMinimumWidth = 768;

const isKeyUpEvent = (event: React.SyntheticEvent): event is React.KeyboardEvent => event.type === 'keyup';

const TextTranslationForm = ({
  srcLang,
  tgtLang,
  markUnknown,
  instantTranslation,
  pairPrefs,
  setLoading,
}: {
  srcLang: string;
  tgtLang: string;
  instantTranslation: boolean;
  markUnknown: boolean;
  pairPrefs: PairPrefValues;
  setLoading: (loading: boolean) => void;
}): React.ReactElement => {
  const { t } = useLocalization();
  const history = useHistory();
  const apyFetch = React.useContext(APyContext);

  const srcTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const tgtTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const [srcText, setSrcText] = useLocalStorage('srcText', '', {
    overrideValue: getUrlParam(history.location.search, textUrlParam),
  });
  const [tgtText, setTgtText] = React.useState('');

  React.useEffect(() => {
    const baseParams = baseUrlParams({ srcLang, tgtLang });
    let search = buildNewSearch({ ...baseParams, [textUrlParam]: srcText });
    if (search.length > MaxURLLength) {
      search = buildNewSearch(baseParams);
    }
    history.replace({ search });
  }, [srcLang, tgtLang, srcText, history]);

  const [error, setError] = React.useState(false);
  const translationRef = React.useRef<CancelTokenSource | null>(null);

  const prefs = Object.entries(pairPrefs)
    .filter(([, selected]) => selected)
    .map(([id]) => id)
    .join(',');

  const previousTranslationProps = React.useRef<Record<string, unknown>>();

  const translate = React.useCallback(
    (force = false) => {
      if (srcText.trim().length === 0) {
        setTgtText('');
        return;
      }

      const translationProps: Record<string, unknown> = { srcLang, tgtLang, markUnknown, prefs };

      // If none of these props have changed, skip translating until our instant
      // translation timer fires or the user manually clicks the translate
      // buttton.
      const { current } = previousTranslationProps;
      if (current != null && !force) {
        if (Object.keys(current).every((key: string) => translationProps[key] === current[key])) {
          return;
        }
      }

      translationRef.current?.cancel();
      translationRef.current = null;

      const [ref, request] = apyFetch('translate', {
        q: srcText,
        langpair: `${srcLang}|${tgtLang}`,
        markUnknown: markUnknown ? 'yes' : 'no',
        prefs,
      });
      translationRef.current = ref;
      previousTranslationProps.current = translationProps;
      setLoading(true);

      void (async () => {
        try {
          const response = (await request).data as {
            responseData: { translatedText: string };
            responseDetails: unknown;
            responseStatus: number;
          };
          setTgtText(response.responseData.translatedText);
          setError(false);
          setLoading(false);
        } catch (error) {
          if (!axios.isCancel(error)) {
            console.warn('Translation failed', error);
            setError(true);
            setLoading(false);
          }
        }
      })();

      return () => translationRef.current?.cancel();
    },
    [apyFetch, markUnknown, prefs, setLoading, srcLang, srcText, tgtLang],
  );

  const translationTimer = React.useRef<number | null>(null);
  const lastPunct = React.useRef(false);

  const handleSrcTextChange = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement> | React.ClipboardEvent<HTMLTextAreaElement>) => {
      const { value } = event.currentTarget;
      if (/^https?:\/\/.+$/.test(value)) {
        history.push(buildWebpageTranslationUrl(value));
      }

      if (lastPunct.current && isKeyUpEvent(event) && (event.code === 'Space' || event.code === 'Enter')) {
        // Don't override the short timeout for simple space-after-punctuation.
        return;
      }

      if (translationTimer.current && instantTranslation) {
        clearTimeout(translationTimer.current);
      }

      let timeout;
      if (isKeyUpEvent(event) && punctuation.has(event.code)) {
        timeout = instantTranslationPunctuationDelay;
        lastPunct.current = true;
      } else {
        timeout = instantTranslationDelay;
        lastPunct.current = false;
      }

      translationTimer.current = window.setTimeout(() => {
        if (instantTranslation) {
          translate(true);
        }
      }, timeout);
    },
    [instantTranslation, history, translate],
  );

  React.useEffect(() => {
    const forceTranslate = () => translate(true);
    window.addEventListener(TranslateEvent, forceTranslate, false);
    return () => window.removeEventListener(TranslateEvent, forceTranslate);
  }, [translate]);

  React.useEffect(translate, [translate]);

  const detectRef = React.useRef<CancelTokenSource | null>(null);

  const detectLang = React.useCallback(() => {
    detectRef.current?.cancel();
    detectRef.current = null;

    const [ref, request] = apyFetch('identifyLang', { q: srcText });
    detectRef.current = ref;

    void (async () => {
      try {
        const response = (await request).data as Record<string, number>;
        window.dispatchEvent(new CustomEvent(DetectCompleteEvent, { detail: response }));
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.warn('Language detection failed', error);
          window.dispatchEvent(new CustomEvent(DetectCompleteEvent, { detail: null }));
        }
      }
    })();

    return () => detectRef.current?.cancel();
  }, [apyFetch, srcText]);

  React.useEffect(() => {
    window.addEventListener(DetectEvent, detectLang, false);
    return () => window.removeEventListener(DetectEvent, detectLang);
  }, [detectLang, translate]);

  React.useLayoutEffect(() => {
    if (window.innerWidth < autoResizeMinimumWidth) {
      return;
    }

    const { current: srcTextarea } = srcTextareaRef;
    const { current: tgtTextarea } = tgtTextareaRef;
    if (!srcTextarea || !tgtTextarea) {
      return;
    }

    srcTextarea.style.overflowY = 'hidden';
    srcTextarea.style.height = 'auto';

    const { scrollHeight } = srcTextarea;
    srcTextarea.style.height = `${scrollHeight}px`;
    tgtTextarea.style.height = `${scrollHeight}px`;
  }, [srcText]);

  return (
    <Row>
      <Col md="6" xs="12">
        <Form.Control
          aria-label={t('Input_Text')}
          as="textarea"
          autoFocus
          className="mb-2"
          dir={langDirection(srcLang)}
          onChange={({ target: { value } }) => setSrcText(value)}
          onKeyUp={handleSrcTextChange}
          onPaste={handleSrcTextChange}
          ref={srcTextareaRef}
          rows={15}
          spellCheck={false}
          value={srcText}
        />
        <Button
          className="position-absolute clear-text-button"
          onClick={() => {
            setSrcText('');
            srcTextareaRef.current?.focus();
          }}
          variant="muted"
        >
          <FontAwesomeIcon fixedWidth icon={faTimes} />
        </Button>
      </Col>
      <Col md="6" xs="12">
        <Form.Control
          as="textarea"
          className={classNames('bg-light mb-2', { 'text-danger': error })}
          dir={langDirection(tgtLang)}
          readOnly
          ref={tgtTextareaRef}
          rows={15}
          spellCheck={false}
          value={error ? t('Not_Available') : tgtText}
        />
        <Button
          className="position-absolute copy-text-button"
          onClick={() => {
            tgtTextareaRef.current?.select();
            document.execCommand('copy');
            tgtTextareaRef.current?.blur();
          }}
          variant="muted"
        >
          <FontAwesomeIcon fixedWidth icon={faCopy} />
        </Button>
      </Col>
    </Row>
  );
};

export const Path = '/translation';

export default TextTranslationForm;
