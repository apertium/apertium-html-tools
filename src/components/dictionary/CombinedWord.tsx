import React, { useState, useEffect, useContext } from 'react';
import './Word.css';
import './CombinedWord.css';
import Spinner from 'react-bootstrap/Spinner';
import Dropdown from 'react-bootstrap/Dropdown';
import Paradigm from './Paradigm';
import { APyContext } from '../../context';
import { useLocalization, useLocalizationPOS } from '../../util/localization';
import { getPosTag } from '../../util/posLocalization';
import { languageRegistry } from './index';

export interface Entry {
  head: string;
  defs: string[];
  similarTo?: string;
  extraTags?: string[];
}

const toRoman = (n: number): string => {
  const lookup: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
    9: 'IX',
    10: 'X',
  };
  return lookup[n] || n.toString();
};

interface EntryBlockProps {
  surface: string;
  entry: Entry;
  lang: string;
  index: number;
  total: number;
  onDefinitionClick: (def: string) => void;
  searchWord: string;
}

const EntryBlock: React.FC<EntryBlockProps> = ({
  surface,
  entry,
  lang,
  index,
  total,
  onDefinitionClick,
  searchWord,
}) => {
  const apyFetch = useContext(APyContext);
  const { t } = useLocalization();
  const { locale } = useLocalizationPOS();

  const plugin = languageRegistry[lang] || null;
  const availableModes = plugin?.getAvailableModes ? plugin.getAvailableModes(locale) : [];

  const rawBlocks = plugin
    ? plugin.addParadigms({ head: entry.head, mode: availableModes[0] || '', locale, t, apyFetch })
    : [];
  const hasParadigms = Array.isArray(rawBlocks) && rawBlocks.length > 0;

  const [expanded, setExpanded] = useState(false);
  const [loadingParadigm, setLoadingParadigm] = useState(false);
  const [mode, setMode] = useState<string>(availableModes[0] || '');

  useEffect(() => {
    if (availableModes.length && !availableModes.includes(mode)) {
      setMode(availableModes[0]);
    }
  }, [availableModes, mode, locale]);

  const tags: string[] = [];
  let m: RegExpExecArray | null;
  const re = /<([^>]+)>/g;
  while ((m = re.exec(entry.head))) tags.push(m[1]);
  const displayTag = tags.length ? getPosTag(locale, tags.join('.')) : null;

  const showRoman = total > 1;
  const roman = showRoman ? toRoman(index + 1) : '';

  const cleanSurface = surface;
  const cleanDefs = entry.defs.map((d) => d.replace(/<[^>]+>/g, ''));

  const cleanedSearch = searchWord.replace(/<[^>]+>/g, '');
  const nonExact = cleanSurface !== cleanedSearch;

  const extraTagsString = entry.extraTags && entry.extraTags.length ? entry.extraTags.join('') : '';
  const extraTokens = Array.from(extraTagsString.matchAll(/<([^>]+)>/g)).map((mm) => mm[1]);

  const findBestMorphLabel = (tokens: string[]): string | null => {
    if (!tokens.length) return null;
    const key = tokens.join('.');
    const label = getPosTag(locale, key);
    if (label && label !== key) return label;
    return null;
  };

  const morphLabel = findBestMorphLabel(extraTokens);
  const extraDisplay = morphLabel || extraTagsString;

  const handleToggle = () => {
    if (!expanded) {
      setExpanded(true);
      setLoadingParadigm(true);
    } else {
      setExpanded(false);
    }
  };

  return (
    <div className="pos-block">
      <div className="word-header">
        <span className="word-text">
          {cleanSurface}
          {showRoman && <span className="roman-numeral">{roman}</span>}
          {displayTag && <span className="pos-tag">({displayTag})</span>}
        </span>
      </div>
      <ol className="word-definitions">
        {cleanDefs.map((rawDef, i) => {
          const def = rawDef;
          return (
            <li key={i} className="definition-item" onClick={() => onDefinitionClick(def)}>
              {def}
            </li>
          );
        })}
      </ol>
      {entry.similarTo && (
        <div className="similar-to-text">
          <small>
            <em>{t('Similar_To')}</em> {entry.similarTo}
          </small>
        </div>
      )}
      {hasParadigms && (
        <div className="expand-controls">
          <button type="button" className="expand-button" onClick={handleToggle} disabled={loadingParadigm}>
            {loadingParadigm ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {t('Expand_Paradigms')}
              </>
            ) : expanded ? (
              t('Collapse_Paradigms')
            ) : (
              t('Expand_Paradigms')
            )}
          </button>
          {expanded && availableModes.length > 1 && (
            <Dropdown onSelect={(k) => typeof k === 'string' && setMode(k)}>
              <Dropdown.Toggle id="mode-dropdown" className="expand-button">
                {mode}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {availableModes.map((mk) => (
                  <Dropdown.Item key={mk} eventKey={mk}>
                    {mk}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>
      )}
      {nonExact && extraTagsString && (
        <div className="extra-tag-info small text-muted mt-1">
          {extraDisplay}: {cleanedSearch}
        </div>
      )}
      {hasParadigms && expanded && (
        <div className="word-paradigm">
          <Paradigm head={entry.head} lang={lang} mode={mode} onLoaded={() => setLoadingParadigm(false)} />
        </div>
      )}
    </div>
  );
};

interface CombinedWordProps {
  surface: string;
  entries: Entry[];
  lang: string;
  onDefinitionClick: (def: string) => void;
  searchWord: string;
}

const CombinedWord: React.FC<CombinedWordProps> = ({ surface, entries, lang, onDefinitionClick, searchWord }) => (
  <div className="word-card">
    {entries.map((e, idx) => (
      <React.Fragment key={idx}>
        <EntryBlock
          surface={surface}
          entry={e}
          lang={lang}
          index={idx}
          total={entries.length}
          onDefinitionClick={onDefinitionClick}
          searchWord={searchWord}
        />
        {idx < entries.length - 1 && <div className="entry-divider" />}
      </React.Fragment>
    ))}
  </div>
);

export default CombinedWord;
