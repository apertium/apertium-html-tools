import * as React from 'react';
import './Word.css';

export interface WordProps {
  head: string;
  definitions: string[];
}

const Word: React.FC<WordProps> = ({ head, definitions }) => {
  const tagRe = /<([^>]+)>/g;
  const tags: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(head))) {
    tags.push(m[1]);
  }

  const word = head.replace(/<[^>]+>/g, '');

  const cleanDefs = definitions.map((def) => def.replace(/<[^>]+>/g, '')).filter((def) => !/^\(.*\)$/.test(def));

  return (
    <div className="word-card">
      <div className="word-header">
        <a href="#" className="word-link">
          {word}
        </a>
        {tags.length > 0 && <span className="word-tags">({tags.join('.')})</span>}
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
