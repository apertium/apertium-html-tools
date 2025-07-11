import React, { useState, useEffect, useContext } from 'react';
import axios, { CancelTokenSource } from 'axios';
import Spinner from 'react-bootstrap/Spinner';
import { APyContext } from '../../context';
import { useLocalization, useLocalizationPOS } from '../../util/localization';
import { languageRegistry } from './index';
import './Paradigm.css';

interface ParadigmProps {
  head: string;
  lang: string;
  mode: 'Linguist' | 'Learner';
  onLoaded?: () => void;
}

interface Block {
  id?: string;
  label: () => string;
  tabcols?: string[];
  tabrows?: string[];
  tabdata?: { tags?: string; pretxt?: string; text?: string }[][];
  tablist?: Array<{ label: string; tags: string; pretxt?: string }>;
  info?: string;
  subcats?: Block[];
}

const Paradigm: React.FC<ParadigmProps> = ({ head, lang, mode, onLoaded }) => {
  const apyFetch = useContext(APyContext);
  const { t } = useLocalization();
  const { locale } = useLocalizationPOS();
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const plugin = languageRegistry[lang];

  useEffect(() => {
    if (!plugin) return;

    const all = plugin.addParadigms({ locale, t, mode });

    const lemma = head.replace(/<[^>]+>/g, '');
    const origTags = Array.from(head.matchAll(/<([^>]+)>/g), (m) => m[1]);
    const first = origTags[0] || '';
    let subKey: string;

    if (all['verb']) {
      subKey = 'verb';
    } else if (first.startsWith('v')) {
      if (origTags.includes('tv')) subKey = 'verb_tv';
      else if (origTags.includes('iv')) subKey = 'verb_iv';
      else subKey = 'vaux';
    } else {
      subKey = origTags.some((t) => t.startsWith('np.')) ? 'pnoun' : 'noun';
    }

    const flat = (all[subKey] || []).flatMap((b) => b.subcats ?? [b]);
    setBlocks(flat);

    const out: Record<string, string> = {};
    const cancelers: CancelTokenSource[] = [];

    Promise.all(
      flat
        .flatMap((b) => b.tabdata ?? [])
        .flat()
        .map(async (cell) => {
          if (!cell.tags) return;
          const seq = plugin.parseTags(origTags, cell.tags);
          const pattern = '^' + lemma + seq.map((t) => `<${t}>`).join('') + '$';
          const [ctr, req] = apyFetch('generate', {
            lang: plugin.backendLangCode,
            q: pattern,
          });
          cancelers.push(ctr);
          try {
            const data = (await req).data as Array<[string, string]>;
            if (data.length) {
              const result = data[0][0];
              if (!result.startsWith('#')) {
                out[cell.tags] = result;
              }
            }
          } catch (err) {
            if (!axios.isCancel(err)) console.error(err);
          }
        }),
    ).then(() => {
      setValues(out);
      setLoading(false);
      onLoaded?.();
    });

    return () => {
      cancelers.forEach((c) => c.cancel());
    };
  }, [head, lang, locale, apyFetch, plugin, onLoaded, t, mode]);

  if (!plugin) {
    return <div className="text-center text-muted my-4">{t('No_paradigms_for_language', { lang })}</div>;
  }

  if (loading) {
    return <Spinner animation="border" role="status" />;
  }

  if (blocks.length === 0) {
    return (
      <div className="text-center text-muted my-2" data-testid="no-paradigm-found">
        {t('No_pos_found')}
      </div>
    );
  }

  return (
    <div className="paradigm-container">
      {blocks.map((block, i) => (
        <div key={i} id={block.id}>
          <h5>{t(block.label())}</h5>

          {block.tablist ? (
            <ul>
              {block.tablist.map((item, j) => (
                <li key={j} data-tags={item.tags}>
                  {t(item.label)}
                  {item.pretxt && ` (${item.pretxt})`}
                </li>
              ))}
            </ul>
          ) : (
            <table>
              <thead>
                <tr>
                  <th />
                  {block.tabcols?.map((c, ci) => (
                    <th key={ci}>{t(c)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.tabrows?.map((r, ri) => (
                  <tr key={ri}>
                    <th>{t(r)}</th>
                    {block.tabdata?.[ri].map((cell, ci) => (
                      <td key={ci}>{cell.pretxt ?? values[cell.tags ?? ''] ?? ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {block.info && <div className="text-info">{t(block.info)}</div>}
        </div>
      ))}
    </div>
  );
};

export default Paradigm;
