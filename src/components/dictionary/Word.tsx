import React, { useState, useEffect, useContext } from 'react';
import './Word.css';
import { useLocalizationPOS } from '../../util/localization';
import { getPosTag } from '../../util/posLocalization';
import { useLocalization } from '../../util/localization';
import Spinner from 'react-bootstrap/Spinner';
import Dropdown from 'react-bootstrap/Dropdown';
import Paradigm from './Paradigm';
import { uumLabels } from './langs/uum';
import { languageRegistry } from './index';
import { APyContext } from '../../context';

export interface WordProps {
  head: string;
  definitions: string[];
  lang: string;
  onDefinitionClick?: (definition: string, index: number) => void;
}

const Word: React.FC<WordProps> = ({ head, definitions, lang, onDefinitionClick }) => {
  const { locale } = useLocalizationPOS();
  const { t } = useLocalization();
  const apyFetch = useContext(APyContext);
  const [expanded, setExpanded] = useState(false);
  const [loadingParadigm, setLoadingParadigm] = useState(false);

  const plugin = languageRegistry[lang];
  const code = locale.split('-')[0].toLowerCase();
  const availableModes = plugin.getAvailableModes ? plugin.getAvailableModes(locale) : [];
  const [mode, setMode] = useState<string>(availableModes[0] || '');

  useEffect(() => {
    if (availableModes.length && !availableModes.includes(mode)) {
      setMode(availableModes[0]);
    }
  }, [locale, availableModes]);

  const tagRe = /<([^>]+)>/g;
  const tags: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(head))) tags.push(m[1]);

  const word = head.replace(/<[^>]+>/g, '');
  const cleanDefs = definitions.map((def) => def.replace(/<[^>]+>/g, '')).filter((def) => !/^\(.*\)$/.test(def));
  const displayTag = tags.length ? getPosTag(locale, tags.join('.')) : null;

  const handleToggle = () => {
    if (!expanded) {
      setExpanded(true);
      setLoadingParadigm(true);
    } else {
      setExpanded(false);
    }
  };

  const rawBlocks = plugin ? plugin.addParadigms({ head, mode, locale, t, apyFetch }) : [];
  const hasParadigms = Array.isArray(rawBlocks) && rawBlocks.length > 0;
  const showExpand = hasParadigms;
  const showDropdown = hasParadigms && availableModes.length > 1;

  return (
    <div className="word-card">
      <div className="word-header">
        <span className="word-text">{word}</span>
        {displayTag && <span className="word-pos">{displayTag}</span>}
      </div>
      <ol className="word-definitions">
        {cleanDefs.map((def, i) => (
          <li key={i} className="definition-item" onClick={() => onDefinitionClick?.(def, i)}>
            {def}
          </li>
        ))}
      </ol>
      {showExpand && (
        <div className="expand-controls">
          <button type="button" className="expand-button" onClick={handleToggle} disabled={loadingParadigm}>
            {loadingParadigm ? (
              <>
                <Spinner animation="border" size="sm" role="status" className="me-2" />
                {t('Expand_Paradigms')}
              </>
            ) : expanded ? (
              t('Collapse_Paradigms')
            ) : (
              t('Expand_Paradigms')
            )}
          </button>
          {showDropdown && expanded && (
            <Dropdown onSelect={(key) => typeof key === 'string' && setMode(key)}>
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
      {showExpand && expanded && (
        <div className="word-paradigm">
          <Paradigm head={head} lang={lang} mode={mode} onLoaded={() => setLoadingParadigm(false)} />
        </div>
      )}
    </div>
  );
};

export default Word;
