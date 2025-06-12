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
  sugg: Array<string>;
}

// eslint-disable-next-line
const Spellers: Readonly<Record<string, string>> = (window as any).SPELLERS;

const langUrlParam = 'lang';
const textUrlParam = 'q';

const isKeyUpEvent = (event: React.SyntheticEvent): event is React.KeyboardEvent => event.type === 'keyup';

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
  const spellCheckTimer = React.useRef<number | null>(null);

  const instantSpellCheck = true;
  const instantSpellCheckDelay = 3000;

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
    const plainText = e.currentTarget.innerText;
    setText(plainText.replace(/<\/?[^>]+(>|$)/g, '')); // Strip away any HTML tags
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
        const [ref, request] = apyFetch('spellCheck', { lang, q: text });
        spellcheckResult.current = ref;
        const data = (await request).data as Array<Suggestion>;
        setSuggestions(data);
        renderHighlightedText(text, data);
        setError(null);
        setSelectedWord(null);
        setSuggestionPosition(null);
        spellcheckResult.current = null;
        setLoading(false);
      } catch (error) {
        if (!axios.isCancel(error)) {
          setSuggestions([]);
          setSelectedWord(null);
          setSuggestionPosition(null);
          setError(error as Error);
          setLoading(false);
        }
      }
    })();
  };

  const handleInstantSpellCheck = (
    event: React.KeyboardEvent<HTMLDivElement> | React.ClipboardEvent<HTMLDivElement>,
  ) => {
    if (isKeyUpEvent(event) && (event.code === 'Space' || event.code === 'Enter')) {
      return;
    }

    if (spellCheckTimer.current && instantSpellCheck) {
      clearTimeout(spellCheckTimer.current);
    }
    spellCheckTimer.current = window.setTimeout(() => {
      if (spellCheckTimer) {
        handleSubmit();
      }
    }, instantSpellCheckDelay);
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

  function saveCaretPosition(editableDiv: HTMLElement): { start: number; end: number } | null {
    if (window.getSelection) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editableDiv);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const start = preCaretRange.toString().length;
        const end = start + range.toString().length;
        return { start, end };
      }
    }
    return null;
  }

  function restoreCaretPosition(editableDiv: HTMLElement, savedSel: { start: number; end: number } | null) {
    if (savedSel) {
      const charIndex = { count: 0 };
      const range = document.createRange();
      range.setStart(editableDiv, 0);
      range.collapse(true);

      const nodeStack: (ChildNode | HTMLElement)[] = [editableDiv];
      let node: ChildNode | null = null;
      let foundStart = false;
      let stop = false;

      while (!stop && (node = nodeStack.pop() || null)) {
        if (node.nodeType === 3) {
          // Text node
          const textContent = node.textContent || '';
          const nextCharIndex = charIndex.count + textContent.length;

          if (!foundStart && savedSel.start >= charIndex.count && savedSel.start <= nextCharIndex) {
            range.setStart(node, savedSel.start - charIndex.count);
            foundStart = true;
          }

          if (foundStart && savedSel.end >= charIndex.count && savedSel.end <= nextCharIndex) {
            range.setEnd(node, savedSel.end - charIndex.count);
            stop = true;
          }

          charIndex.count = nextCharIndex;
        } else {
          const elementNode = node as HTMLElement;
          let i = elementNode.childNodes.length;

          while (i--) {
            nodeStack.push(elementNode.childNodes[i]);
          }
        }
      }

      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }

  if (initialRender.current && spellcheckRef.current) {
    spellcheckRef.current.textContent = text;
    initialRender.current = false;
  }

  const renderHighlightedText = (text: string, suggestions: Suggestion[]) => {
    if (text.trim().length === 0) {
      return;
    }

    const contentElement = spellcheckRef.current;
    if (contentElement instanceof HTMLElement) {
      const savedSelection = saveCaretPosition(contentElement);

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
      restoreCaretPosition(contentElement, savedSelection);
    }
  };

  const applySuggestion = (suggestion: string) => {
    if (!selectedWord) return;

    const escapedSelectedWord: string = selectedWord.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const regex = new RegExp(`(^|\\s)${escapedSelectedWord}(?=\\s|$|[.,!?;:])`, 'gu');
    const updatedText = text.replace(regex, (match, p1: string) => `${p1}${suggestion}`);

    setText(updatedText);
    setSelectedWord(null);
    setSuggestionPosition(null);
    renderHighlightedText(updatedText, suggestions);
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
            aria-label="Enter text for spell checking"
            className="content-editable"
            contentEditable
            onInput={handleInput}
            onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
              if (event.code === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
            onKeyUp={handleInstantSpellCheck}
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
      {selectedWord && suggestionPosition && suggestions.some((s) => s.token === selectedWord && s.sugg.length > 0) && (
        <div
          className="suggestions"
          style={{ position: 'absolute', top: suggestionPosition.top, left: suggestionPosition.left }}
        >
          {suggestions
            .find((s) => s.token === selectedWord)
            ?.sugg?.map((suggestion, index) => (
              <div
                className="suggestion"
                key={index}
                onClick={() => applySuggestion(suggestion)}
                onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                  if (event.key === 'Enter') {
                    applySuggestion(suggestion);
                  }
                }}
                role="presentation"
              >
                {suggestion}
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
