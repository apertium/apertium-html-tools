import './spellchecker.css';
import * as React from 'react';
import axios, { CancelTokenSource } from 'axios';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';
import { useMatomo } from '@datapunt/matomo-tracker-react';

import { APyContext } from '../../context';
import { toAlpha3Code } from '../../util/languages';

import { MaxURLLength, buildNewSearch, getUrlParam } from '../../util/url';
import ErrorAlert from '../ErrorAlert';
import useLocalStorage from '../../util/useLocalStorage';
import { useLocalization } from '../../util/localization';

interface Suggestion {
  token: string;
  known: boolean;
  sugg: Array<[string, number]>;
}

// eslint-disable-next-line
const Spellers: Readonly<Record<string, string>> = (window as any).SPELLERS;

const langUrlParam = 'lang';
const textUrlParam = 'q';
const SpellCheckForm = ({
  setLoading,
  setError,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
}): React.ReactElement => {
  const history = useHistory();
  const { t, tLang } = useLocalization();
  const { trackEvent } = useMatomo();
  const apyFetch = React.useContext(APyContext);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [selectedWord, setSelectedWord] = React.useState<string | null>(null);
  const [suggestionPosition, setSuggestionPosition] = React.useState<{ top: number; left: number } | null>(null);
  const initialRender = React.useRef<boolean>(true);
  const spellcheckRef = React.useRef<HTMLDivElement | null>(null);
  const spellcheckResult = React.useRef<CancelTokenSource | null>(null);

  const [lang, setLang] = useLocalStorage('spellerLang', Object.keys(Spellers)[0], {
    overrideValue: toAlpha3Code(getUrlParam(history.location.search, langUrlParam)),
    validateValue: (l) => l in Spellers,
  });

  const [text, setText] = useLocalStorage('spellerText', '', {
    overrideValue: getUrlParam(history.location.search, textUrlParam),
  });

  React.useEffect(() => {
    let search = buildNewSearch({ [langUrlParam]: lang, [textUrlParam]: text });
    if (search.length > MaxURLLength) {
      search = buildNewSearch({ [langUrlParam]: lang });
    }
    history.replace({ search });
  }, [history, lang, text]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setText(e.currentTarget.innerText);
  };

  const handleSubmit = () => {
    if (text.trim().length === 0) {
      return;
    }

    spellcheckResult.current?.cancel();
    spellcheckResult.current = null;

    void (async () => {
      try {
        trackEvent({ category: 'spellchecker', action: 'spellcheck', name: lang, value: text.length });
        const [ref, request] = apyFetch('speller', { lang, q: text });
        spellcheckResult.current = ref;
        setSuggestions((await request).data as Array<Suggestion>);
        setError(null);
        spellcheckResult.current = null;

        renderHighlightedText(text);
        setLoading(false);
      } catch (error) {
        if (!axios.isCancel(error)) {
          setSuggestions([]);
          setError(error as Error);
          setLoading(false);
        }
      }
    })();
  };

  const handleWordClick = React.useCallback((word: string, event: MouseEvent | TouchEvent) => {
    setSelectedWord(word);
    const rect = (event.currentTarget as Element).getBoundingClientRect();

    if ('touches' in event) {
      // Get the first touch point
      const touch = event.touches[0];
      setSuggestionPosition({
        top: rect.bottom + window.scrollY + 3,
        left: touch.clientX + window.scrollX - 2,
      });
    } else {
      setSuggestionPosition({
        top: rect.bottom + window.scrollY + 3,
        left: rect.left + window.scrollX - 2,
      });
    }
  }, []);

  if (initialRender.current && spellcheckRef.current) {
    spellcheckRef.current.textContent = text;
    initialRender.current = false;
  }

  const renderHighlightedText = React.useCallback(
    (text: string) => {
      if (text.trim().length === 0) {
        return;
      }

      const contentElement = spellcheckRef.current;
      if (contentElement instanceof HTMLElement) {
        const parts = text
          .split(/(\s+)/)
          .map((word, index) => {
            const suggestion = suggestions.find((s) => s.token === word && !s.known);
            if (suggestion) {
              return `<span key=${index} class="misspelled">${word}</span>`;
            } else {
              return `<span key=${index} class="correct">${word}</span>`;
            }
          })
          .join('');

        contentElement.innerHTML = parts;

        const misspelledElements = contentElement.querySelectorAll('.misspelled');
        misspelledElements.forEach((element) => {
          const word = element.textContent || '';
          const eventHandler = (e: Event) => handleWordClick(word, e as MouseEvent | TouchEvent);
          element.addEventListener('click', eventHandler);
          element.addEventListener('touchstart', eventHandler);
        });
      }
    },
    [suggestions, handleWordClick],
  );

  const applySuggestion = (suggestion: string) => {
    if (!selectedWord) return;

    const escapedSelectedWord = selectedWord.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const regex = new RegExp(`(^|\\s)${escapedSelectedWord}(?=\\s|$)`, 'gu');
    const updatedText = text.replace(regex, (p1) => `${p1}${suggestion}`);

    setText(updatedText);
    setSelectedWord(null);
    renderHighlightedText(updatedText);
  };

  return (
    <Form aria-label="Spell Checker" onSubmit={(event) => event.preventDefault()}>
      <Form.Group className="row" controlId="speller-lang">
        <Form.Label className="col-md-2 col-lg-1 col-form-label text-md-right">{t('Language')}</Form.Label>
        <Col md="3">
          <Form.Control as="select" onChange={({ target: { value } }) => setLang(value)} required value={lang}>
            {Object.keys(Spellers)
              .map((code) => [code, tLang(code)])
              .sort(([, a], [, b]) => a.toLowerCase().localeCompare(b.toLowerCase()))
              .map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
          </Form.Control>
        </Col>
      </Form.Group>
      <Form.Group className="row" controlId="speller-input">
        <Form.Label className="col-md-2 col-lg-1 col-form-label text-md-right">{t('Input_Text')}</Form.Label>
        <Col md="10">
          <div
            className="content-editable"
            contentEditable
            onInput={handleInput}
            onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
              if (event.code === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={t('Spell_Checking_Help')}
            ref={spellcheckRef}
            role="textbox"
            tabIndex={0}
          />
        </Col>
      </Form.Group>
      <Form.Group className="row">
        <Col className="offset-md-2 col-md-10 offset-lg-1" md="10">
          <Button onClick={handleSubmit} type="submit" variant="primary">
            {t('Check')}
          </Button>
        </Col>
      </Form.Group>
      {selectedWord && suggestionPosition && (
        <div
          className="suggestions"
          style={{ position: 'absolute', top: suggestionPosition.top, left: suggestionPosition.left }}
        >
          {suggestions
            .find((s) => s.token === selectedWord)
            ?.sugg.map(([sugg], index) => (
              <div
                key={index}
                onClick={() => applySuggestion(sugg)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    applySuggestion(sugg);
                  }
                }}
                role="presentation"
              >
                {sugg}
              </div>
            ))}
        </div>
      )}
    </Form>
  );
};

const SpellChecker = (): React.ReactElement => {
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(false);

  return (
    <>
      <SpellCheckForm setError={setError} setLoading={setLoading} />
      <main className={classNames({ blurred: loading })}>{error && <ErrorAlert error={error} />}</main>
    </>
  );
};

export default SpellChecker;
