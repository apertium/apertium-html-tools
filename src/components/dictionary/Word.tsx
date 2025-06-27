import React from 'react';
import './Word.css';
import { useLocalizationPOS } from '../../util/localization';
import { getPosTag } from '../../util/posLocalization';

export interface WordProps {
  head: string;
  definitions: string[];
}

const Word: React.FC<WordProps> = ({ head, definitions }) => {
  const { locale } = useLocalizationPOS();

  const tagRe = /<([^>]+)>/g;
  const tags: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(head))) {
    tags.push(m[1]);
  }

  const word = head.replace(/<[^>]+>/g, '');
  const cleanDefs = definitions.map((def) => def.replace(/<[^>]+>/g, '')).filter((def) => !/^\(.*\)$/.test(def));
  const displayTag = tags.length > 0 ? getPosTag(locale, tags.join('.')) : null;

  return (
    <div className="word-card">
      <div className="word-header">
        <a href="#" className="word-link">
          {word}
        </a>
        {displayTag && <span className="word-tags">({displayTag})</span>}
      </div>
      <ol className="word-definitions">
        {cleanDefs.map((def, i) => (
          <li key={i}>{def}</li>
        ))}
      </ol>
    </div>
  );
};

export default Word;
