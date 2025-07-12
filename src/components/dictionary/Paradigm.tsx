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

    let isMounted = true;
    const cancelers: CancelTokenSource[] = [];

    const raw = plugin.addParadigms({ head, mode, locale, t, apyFetch });

    if (!Array.isArray(raw)) {
      setBlocks([]);
      setLoading(false);
      return;
    }

    const rawBlocks = raw;
    setBlocks(rawBlocks);

    const lemma = head.replace(/<[^>]+>/g, '');
    const origTags = Array.from(head.matchAll(/<([^>]+)>/g), (m) => m[1]);

    const fetchCells = rawBlocks
      .flatMap((b) => b.subcats ?? [b])
      .flatMap((b) => b.tabdata ?? [])
      .flat();

    if (fetchCells.length === 0) {
      if (isMounted) {
        setLoading(false);
        onLoaded?.();
      }
      return;
    }

    const out: Record<string, string> = {};

    Promise.all(
      fetchCells.map(async (cell) => {
        if (!cell.tags) return;
        const seq = plugin.parseTags(origTags, cell.tags);
        const pattern = '^' + lemma + seq.map((x) => `<${x}>`).join('') + '$';
        const [ctr, req] = apyFetch('generate', {
          lang: plugin.backendLangCode,
          q: pattern,
        });
        cancelers.push(ctr);
        try {
          const data = (await req).data as Array<[string, string]>;
          if (data.length && !data[0][0].startsWith('#')) {
            out[cell.tags] = data[0][0];
          }
        } catch (err) {
          if (!axios.isCancel(err)) console.error(err);
        }
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
        <div key={i}>
          {block.subcats ? (
            <>
              <h4>{t(block.label())}</h4>
              {block.subcats.map((sub, j) => (
                <div key={j} id={sub.id}>
                  <h5>{t(sub.label())}</h5>

                  {sub.tablist ? (
                    <ul>
                      {sub.tablist.map((item, k) => (
                        <li key={k} data-tags={item.tags}>
                          {values[item.tags] ?? t(item.label)}
                          {item.pretxt && ` (${item.pretxt})`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th />
                          {sub.tabcols?.map((c, ci) => (
                            <th key={ci}>{t(c)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sub.tabrows?.map((r, ri) => (
                          <tr key={ri}>
                            <th>{t(r)}</th>
                            {sub.tabdata![ri].map((cell, ci) => (
                              <td key={ci}>{cell.pretxt ?? values[cell.tags!] ?? ''}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {sub.info && <div className="text-info">{t(sub.info)}</div>}
                </div>
              ))}
            </>
          ) : (
            <div id={block.id}>
              <h5>{t(block.label())}</h5>

              {block.tablist ? (
                <ul>
                  {block.tablist.map((item, k) => (
                    <li key={k} data-tags={item.tags}>
                      {values[item.tags] ?? t(item.label)}
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
                        {block.tabdata![ri].map((cell, ci) => (
                          <td key={ci}>{cell.pretxt ?? values[cell.tags!] ?? ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {block.info && <div className="text-info">{t(block.info)}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Paradigm;
