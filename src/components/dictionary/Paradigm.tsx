import React, { useState, useEffect, useContext } from 'react';
import axios, { CancelTokenSource } from 'axios';
import Spinner from 'react-bootstrap/Spinner';
import { APyContext } from '../../context';
import { useLocalization, useLocalizationPOS } from '../../util/localization';
import { languageRegistry } from './index';
import { AddParadigmsArgs, ParadigmBlock } from '../../types';
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
  html?: string;
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

  const lookupTags = (head: string, parMap: Block): string => {
    const tags = head.split(/[<>]/).filter(Boolean);
    // take everything but the lemma, and look up tags in the paradigm map
    const result = tags.slice(1).reduce((currentObj, currentKey) => {
      return currentObj && currentObj[currentKey];
    }, parMap);
    return result;
  }

  const addParadigm = ({ head, mode, locale, t, apyFetch }: AddParadigmsArgs): ParadigmBlock[] =>{
    const code = locale.split('-')[0].toLowerCase();
    const fallbackLocale = Object.keys(plugin.labels)[0];
    const labelsForLocale = plugin.labels?.[locale] ?? plugin.labels?.[fallbackLocale] ;
    const fallbackMode = Object.keys(labelsForLocale)[0];
    const labelsForMode = labelsForLocale[mode] ?? labelsForLocale[fallbackMode] ;
    //console.log(`Using labels for mode: ${mode}, fallback mode: ${fallbackMode}`, labelsForMode);
    const parMap = plugin.paradigmMap ?? {};
    const parType = lookupTags(head, parMap);
    
    return plugin.getParadigm?.(labelsForMode, t, parType);
  }

  useEffect(() => {
    if (!plugin) return;
    let isMounted = true;
    const cancelers: CancelTokenSource[] = [];

    const raw = addParadigm({ head, mode, locale, t, apyFetch }) || [];
    //console.log(`Raw paradigm data:`, raw);
    setBlocks(Array.isArray(raw) ? raw : []);
    setLoading(false);
    if (!Array.isArray(raw) || !raw.length) {
      onLoaded?.();
      return;
    }

    // Find all elements with data-toGenerate attribute
    setLoading(true);
    const items = document.querySelectorAll<HTMLElement>('[data-to-generate]');
    const out: Record<string, string> = {};
    
    Promise.all(
      Array.from(items).map(async (elem) => {
        //console.log("Processing element:", elem);
        const pattern = elem.dataset.toGenerate;
        if (!pattern) return;
        const updatedPattern = pattern.replace("{{HEAD}}", head);
        //console.log("updatedPattern:", updatedPattern);
        const [ctr, req] = apyFetch('generate', {
          lang: plugin.backendLangCode,
          q: updatedPattern,
        });
        cancelers.push(ctr);
        try {
          const data = (await req).data as Array<[string, string]>;
          if (data.length && !data[0][0].startsWith('#')) {
            out[pattern] = data[0][0];
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }),
    ).then(() => {
      if (isMounted) {
        setValues(out);
        setLoading(false);
        onLoaded?.();
      }
    });

    console.log(`Fetched paradigm values:`, out);
    return () => {
      isMounted = false;
      cancelers.forEach((c) => c.cancel());
    };

    // // Find all elements with data-toGenerate attribute
    // const items = document.querySelectorAll<HTMLElement>('[data-to-generate]');
    // items.forEach((elem) => {
    //   const pattern = elem.dataset.toGenerate;
    //   const updatedPattern = pattern.replace("{{HEAD}}", head);
    //   console.log("updatedPattern:", updatedPattern);
    //   const [ctr, req] = apyFetch('generate', {
    //     lang: plugin.backendLangCode,
    //     q: pattern,
    //   });
    //   cancelers.push(ctr);
    //   try {
    //     const data = (await req).data as Array<[string, string]>;
    //     if (data.length && !data[0][0].startsWith('#')) {
    //       out[cell.tags!] = data[0][0];
    //     }
    //   } catch {}
    // });

    // const raw = addParadigm({ head, mode, locale, t, apyFetch }) || [];
    // //console.log(`Raw paradigm data:`, raw);
    // setBlocks(Array.isArray(raw) ? raw : []);
    // setLoading(false);
    // if (!Array.isArray(raw) || !raw.length) {
    //   onLoaded?.();
    //   return;
    // }
    //
    // const getLeaves = (blocks: Block[]): Block[] => blocks.flatMap((b) => (b.subcats ? getLeaves(b.subcats) : [b]));

    // const leaves = getLeaves(raw);
    // const dataCells = leaves.flatMap((b) => b.tabdata ?? []).flat();
    // const listCells = leaves.flatMap((b) => b.tablist ?? []);
    // const fetchCells = [...dataCells, ...listCells].filter((cell) => cell.tags);

    // console.log('fetching data!', 'raw:', raw, 'leaves:', leaves, 'dataCells:', dataCells, 'fetchCells:', fetchCells);
    // if (!fetchCells.length) {
    //   onLoaded?.();
    //   return;
    // }
    //
    // setLoading(true);
    // const out: Record<string, string> = {};
    // const lemma = head.replace(/<[^>]+>/g, '');
    // const origTags = Array.from(head.matchAll(/<([^>]+)>/g), (m) => m[1]);
    //
    // Promise.all(
    //   fetchCells.map(async (cell) => {
    //     const seq = plugin.parseTags(origTags, cell.tags!);
    //     const pattern = '^' + lemma + seq.map((x) => `<${x}>`).join('') + '$';
    //     const [ctr, req] = apyFetch('generate', {
    //       lang: plugin.backendLangCode,
    //       q: pattern,
    //     });
    //     cancelers.push(ctr);
    //     try {
    //       const data = (await req).data as Array<[string, string]>;
    //       if (data.length && !data[0][0].startsWith('#')) {
    //         out[cell.tags!] = data[0][0];
    //       }
    //     } catch {}
    //   }),
    // ).then(() => {
    //   if (isMounted) {
    //     setValues(out);
    //     setLoading(false);
    //     onLoaded?.();
    //   }
    // });
    // console.log(`Fetched paradigm values:`, out);
    // return () => {
    //   isMounted = false;
    //   cancelers.forEach((c) => c.cancel());
    // };
  }, [head, lang, locale, mode, t, apyFetch, plugin, onLoaded]);

  // stop-gap until it's rewritten to expect the tags in data-tags instead of in textContent
  const modifyBlockHTML = (block: Block, head: string): string => {
    if (!block.html) return '';
  
    // Parse the HTML string into DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(block.html, 'text/html');

    // replace content with values from "tags" data
    const tdElements = doc.querySelectorAll('td');
    tdElements.forEach((td) => {
      const tags = td.getAttribute('data-tags') || '';
      const content = values[tags];
      td.textContent = (content || '');
    });
  
    // return string instead of raw DOM
    return doc.body.innerHTML;
  };

  // stop-gap until .. ?
  const updateBlockHTML = (block: Block, values: Array): string => {
    if (!block.html) return '';
  
    // Parse the HTML string into DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(block.html, 'text/html');

    // replace content with values from "tags" data
    const tdElements = doc.querySelectorAll('td');
    tdElements.forEach((td) => {
      const tags = td.getAttribute('data-to-generate') || '';
      const content = values[tags];
      td.textContent = (content || '');
    });
  
    // return string instead of raw DOM
    return doc.body.innerHTML;
  };

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
              {block.tablist.map((item, k) => {
                const val = values[item.tags];
                const content = item.pretxt && val ? `${item.pretxt} ${val}` : val ?? item.pretxt ?? '';
                return (
                  <tr key={k}>
                    <th>{t(item.label)}</th>
                    <td data-tags={item.tags}>{content}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (block.html && block.html.trim() !== '') ? (
          // <div dangerouslySetInnerHTML={{ __html: modifyBlockHTML(block, head) ?? '' }} />
          <div dangerouslySetInnerHTML={{ __html: updateBlockHTML(block, values) ?? '' }} />
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
                  {block.tabdata![ri].map((cell, ci) => {
                    const val = values[cell.tags!];
                    const content = cell.pretxt && val ? `${cell.pretxt} ${val}` : val ?? cell.pretxt ?? '';
                    return <td key={ci}>{content}</td>;
                  })}
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
