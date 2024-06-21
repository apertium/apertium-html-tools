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
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);

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

  const spellcheckRef = React.useRef<HTMLDivElement | null>(null);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setText(e.currentTarget.innerText);
  };

  const handleWordClick = (word: string) => {
    console.log("Word clicked:", word);
    setSelectedWord(word);
  };

  const applySuggestion = (suggestion: string) => {
    if (!selectedWord) return;

    const updatedText = text.replace(new RegExp(`\\b${selectedWord}\\b`, 'g'), suggestion);
    setText(updatedText); // Schedule state update

    console.log(text)
    setSelectedWord(null);
    renderHighlightedText()
  };

  const renderHighlightedText = () => {
    if (text.trim().length === 0) {
      return;
    }
    console.log(text)
    console.log("yo i got called!!!")

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
      misspelledElements.forEach((element, index) => {
        const word = element.textContent || '';
        element.addEventListener('click', () => handleWordClick(word));
      });
    }
  };

  return (
    <Form aria-label="Spell Checker" onSubmit={(event) => event.preventDefault()}>
      <Form.Group className="row" controlId="speller-lang">
        <Form.Label className="col-md-2 col-lg-1 col-form-label text-md-right">{t('Language')}</Form.Label>
        <Col md="3">
          <Form.Control as="select" onChange={({ target: { value } }) => setLang(value)} required value={lang}>
            {Object.keys(Spellers)
              .map((code) => [code, tLang(code)])
              .sort(([, a], [, b]) => {
                return a.toLowerCase().localeCompare(b.toLowerCase());
              })
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
          <Button onClick={renderHighlightedText} type="submit" variant="primary">
            {t('Check')}
          </Button>
        </Col>
      </Form.Group>
      {selectedWord && (
        <div className="suggestions">
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
