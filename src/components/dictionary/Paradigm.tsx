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
  mode: string;
  onLoaded?: () => void;
}

interface Block {
  id?: string;
  label: () => string;
  tabcols?: string[];
  tabrows?: string[];
  tabdata?: { tags?: string; pretxt?: string }[][];
  tablist?: Array<{ label: string; tags: string; pretxt?: string }>;
  subcats?: Block[];
}

const Paradigm: React.FC<ParadigmProps> = ({ head, lang, mode, onLoaded }) => {
  const apyFetch = useContext(APyContext);
  const { t } = useLocalization();
  const { locale } = useLocalizationPOS();
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const availableLangs = Object.keys(languageRegistry);
  const pluginLang = availableLangs.includes(lang) ? lang : availableLangs[0];
  const plugin = languageRegistry[pluginLang];

  useEffect(() => {
    if (!plugin) return;
    let isMounted = true;
    const cancelers: CancelTokenSource[] = [];

    const raw = plugin.addParadigms({ head, mode, locale, t, apyFetch }) || [];
    setBlocks(Array.isArray(raw) ? raw : []);
    setLoading(false);
    if (!Array.isArray(raw) || !raw.length) {
      onLoaded?.();
      return;
    }

    const leaves = raw.flatMap((b) => b.subcats ?? [b]);
    const dataCells = leaves.flatMap((b) => b.tabdata ?? []).flat();
    const listCells = leaves.flatMap((b) => b.tablist ?? []);
    const fetchCells = [...dataCells, ...listCells].filter((cell) => cell.tags);

    if (!fetchCells.length) {
      onLoaded?.();
      return;
    }

    setLoading(true);
    const out: Record<string, string> = {};
    const lemma = head.replace(/<[^>]+>/g, '');
    const origTags = Array.from(head.matchAll(/<([^>]+)>/g), (m) => m[1]);

    Promise.all(
      fetchCells.map(async (cell) => {
        const seq = plugin.parseTags(origTags, cell.tags!);
        const pattern = '^' + lemma + seq.map((x) => `<${x}>`).join('') + '$';
        const [ctr, req] = apyFetch('generate', {
          lang: plugin.backendLangCode,
          q: pattern,
        });
        cancelers.push(ctr);
        try {
          const data = (await req).data as Array<[string, string]>;
          if (data.length && !data[0][0].startsWith('#')) {
            out[cell.tags!] = data[0][0];
          }
        } catch {}
      }),
    ).then(() => {
      if (isMounted) {
        setValues(out);
        setLoading(false);
        onLoaded?.();
      }
    });

    return () => {
      isMounted = false;
      cancelers.forEach((c) => c.cancel());
    };
  }, [head, lang, locale, mode, t, apyFetch, plugin, onLoaded]);

  const RenderBlock: React.FC<{ block: Block; level: number }> = ({ block, level }) => {
    const Heading = level === 0 ? 'h4' : level === 1 ? 'h5' : 'h6';

    return (
      <div id={block.id}>
        <Heading>{t(block.label())}</Heading>
        {block.subcats ? (
          block.subcats.map((sub, i) => <RenderBlock key={sub.id ?? i} block={sub} level={level + 1} />)
        ) : block.tablist ? (
          <table className="paradigm-table">
            <tbody>
              {block.tablist.map((item, k) => (
                <tr key={k}>
                  <th>{t(item.label)}</th>
                  <td data-tags={item.tags}>{values[item.tags] ?? item.pretxt ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="paradigm-table">
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
                  {block.tabdata![ri].map((cell, ci) => (
                    <td key={ci}>{values[cell.tags!] ?? cell.pretxt ?? ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  if (!plugin) {
    return <div className="text-center text-muted my-4">{t('No_paradigms_for_language', { lang })}</div>;
  }
  if (loading) return <Spinner animation="border" role="status" />;
  if (!blocks.length) {
    return (
      <div className="text-center text-muted my-2" data-testid="no-paradigm-found">
        {t('No_pos_found')}
      </div>
    );
  }

  return (
    <div className="paradigm-container">
      {blocks.map((blk, i) => (
        <RenderBlock key={i} block={blk} level={0} />
      ))}
    </div>
  );
};

export default Paradigm;
