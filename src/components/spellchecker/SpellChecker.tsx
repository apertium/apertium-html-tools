import * as React from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import { useHistory } from 'react-router-dom';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import { MaxURLLength, buildNewSearch, getUrlParam } from '../../util/url';
import { toAlpha3Code } from '../../util/languages';
import useLocalStorage from '../../util/useLocalStorage';
import { useLocalization } from '../../util/localization';
import './spellchecker.css';

interface Suggestion {
  token: string;
  known: boolean;
  sugg: Array<[string, number]>;
}

// eslint-disable-next-line
const Spellers: Readonly<Record<string, string>> = (window as any).SPELLERS;

const langUrlParam = 'lang';
const textUrlParam = 'q';

const SpellChecker = (): React.ReactElement => {
  const history = useHistory();
  const { t, tLang } = useLocalization();
  const { trackEvent } = useMatomo();
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([
    {
      token: 'Thiss',
      known: false,
      sugg: [
        ['This', 0.9],
        ['Thus', 0.1],
      ],
    },
    {
      token: 'exampel',
      known: false,
      sugg: [
        ['example', 0.95],
        ['exemplar', 0.05],
      ],
    },
  ]);
  const [selectedWord, setSelectedWord] = React.useState<string | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [suggestionPosition, setSuggestionPosition] = React.useState<{ top: number; left: number } | null>(null);

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

  React.useEffect(() => {
    renderHighlightedText(text); 
  }, []);

  const spellcheckRef = React.useRef<HTMLDivElement | null>(null);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setText(e.currentTarget.innerText);
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

  const renderHighlightedText = React.useCallback((text: string) => {
    if (text.trim().length === 0) {
      return;
    }

    const contentElement = spellcheckRef.current;
    if (contentElement instanceof HTMLElement) {
      const parts = text.split(/(\s+)/).map((word, index) => {
        const suggestion = suggestions.find((s) => s.token === word && !s.known);
        if (suggestion) {
          return `<span key=${index} class="misspelled">${word}</span>`;
        } else {
          return `<span key=${index} class="correct">${word}</span>`;
        }
      }).join('');

      contentElement.innerHTML = parts;

      const misspelledElements = contentElement.querySelectorAll('.misspelled');
      misspelledElements.forEach((element) => {
        const word = element.textContent || '';
        const eventHandler = (e: Event) => handleWordClick(word, e as MouseEvent | TouchEvent);
        element.addEventListener('click', eventHandler);
        element.addEventListener('touchstart', eventHandler);
      });
    }
  }, [text, suggestions, handleWordClick]);

  const applySuggestion = (suggestion: string) => {
    if (!selectedWord) return;

    const updatedText = text.replace(new RegExp(`\\b${selectedWord}\\b`, 'g'), suggestion);
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
            ref={spellcheckRef}
            onInput={handleInput}
          />
        </Col>
      </Form.Group>
      <Form.Group className="row">
        <Col className="offset-md-2 col-md-10 offset-lg-1" md="10">
          <Button onClick={() => renderHighlightedText(text)} type="submit" variant="primary">
            {t('Check')}
          </Button>
        </Col>
      </Form.Group>
      {selectedWord && suggestionPosition && (
        <div className="suggestions" style={{ position: 'absolute', top: suggestionPosition.top, left: suggestionPosition.left }}>
          {suggestions
            .find((s) => s.token === selectedWord)
            ?.sugg.map(([sugg, _], index) => (
              <div key={index} onClick={() => applySuggestion(sugg)}>
                {sugg}
              </div>
            ))}
        </div>
      )}
    </Form>
  );
};

export default SpellChecker;




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

    } catch (error) {
      if (!axios.isCancel(error)) {
        setSuggestions([]);
        setError(error as Error);
      }
    }
  })();
};