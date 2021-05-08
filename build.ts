import * as child_process from 'child_process';
import * as path from 'path';
import { promises as fs } from 'fs';

import * as esbuild from 'esbuild';
import axios, { AxiosResponse } from 'axios';

import { languages, parentLang, toAlpha2Code, toAlpha3Code, variantSeperator } from './src/util/languages';
import Config from './config';
import locales from './src/strings/locales.json';

const prod = process.argv.includes('--prod');
const watch = process.argv.includes('--watch');

const { allowedLangs, allowedVariants, defaultLocale } = Config;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apyGet = async (path: string, params: unknown = {}): Promise<AxiosResponse<any>> =>
  await axios({
    url: `${Config.apyURL}/${path}`,
    params,
    validateStatus: (status) => status === 200,
  });

const writeSitemap = async (outdir: string) => {
  await fs.writeFile(
    path.join(outdir, 'sitemap.xml'),
    `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${Config.htmlUrl}index.html</loc>
    ${Object.keys(locales)
      .map(
        (locale) =>
          `<xhtml:link rel="alternate" hreflang="${toAlpha2Code(locale) || locale}" href="${
            Config.htmlUrl
          }index.${locale}.html"/>`,
      )
      .join('\n')}
  </url>
</urlset>
    `.trim(),
  );
};

const allowedLang = (code: string): boolean => {
  const [parent, variant] = code.split(variantSeperator, 2);

  if (allowedLangs != null && !allowedLangs.has(parent)) {
    return false;
  }

  if (allowedVariants != null && variant && !allowedVariants.has(variant)) {
    return false;
  }

  return true;
};

const Plugin = {
  name: 'apertium-html-tools',
  setup: async ({ initialOptions, onEnd }: esbuild.PluginBuild) => {
    const version = child_process.execSync('git describe --tags --always').toString().trim();

    let defaultStrings: unknown;

    const [pairsResponse, analyzersResponse, generatorsResponse] = await Promise.all([
      apyGet('list', {}),
      apyGet('list', { q: 'analyzers' }),
      apyGet('list', { q: 'generators' }),
    ]);

    const pairs = (pairsResponse.data as {
      responseData: Array<{
        sourceLanguage: string;
        targetLanguage: string;
      }>;
    }).responseData.filter(
      ({ sourceLanguage, targetLanguage }) => allowedLang(sourceLanguage) && allowedLang(targetLanguage),
    );
    const analyzers = Object.fromEntries(
      Object.entries(analyzersResponse.data as Record<string, string>).filter(([code]) => allowedLang(code)),
    );
    const generators = Object.fromEntries(
      Object.entries(generatorsResponse.data as Record<string, string>).filter(([code]) => allowedLang(code)),
    );

    let pairPrefs = {};
    try {
      pairPrefs = (await apyGet('pairprefs')).data as Record<string, unknown>;
    } catch (error) {
      console.warn('Unable to fetch pair prefs, defaulting to empty');
    }

    let allLangs: Array<string | null> = [
      ...pairs.flatMap(({ sourceLanguage, targetLanguage }) => [sourceLanguage, targetLanguage]),
      ...Object.keys(analyzers),
      ...Object.keys(generators),
      ...Object.keys(languages),
      ...Object.keys(locales),
    ].filter(Boolean);
    allLangs = [...allLangs, ...allLangs.map((l) => (l ? parentLang(l) : l))];
    allLangs = [...allLangs, ...allLangs.map(toAlpha2Code)];
    allLangs = [...allLangs, ...allLangs.map(toAlpha3Code)];
    const allLangsSet = new Set(allLangs.filter(Boolean));

    const outdir = initialOptions.outdir as string;

    const localeStrings = (await Promise.all(
      (await fs.readdir('src/strings'))
        .filter((f) => f.endsWith('.json') && f !== 'locales.json')
        .map(async (f) => {
          const locale = path.parse(f).name;
          const response = await apyGet('listLanguageNames', { locale });
          const allLangNames = response.data as Record<string, string>;

          const srcPath = path.join('src/strings', f);
          const distPath = path.join(outdir, 'strings', f);

          await fs.mkdir(path.dirname(distPath), { recursive: true });

          const strings = JSON.parse(await fs.readFile(srcPath, 'utf-8')) as Record<string, unknown>;
          delete strings['@metadata'];

          const langNames: Record<string, string> = {};
          for (const lang of Object.keys(allLangNames)) {
            if (allLangsSet.has(lang)) {
              langNames[lang] = allLangNames[lang];
            }
          }
          strings['@langNames'] = langNames;

          if (f === `${defaultLocale}.json`) {
            defaultStrings = strings;
          }

          await fs.writeFile(distPath, JSON.stringify(strings));

          return [locale, strings];
        }),
    )) as Array<[string, unknown]>;

    await writeSitemap(outdir);

    initialOptions.define = {
      'window.VERSION': JSON.stringify(version),
      'window.PAIRS': JSON.stringify(pairs),
      'window.PAIR_PREFS': JSON.stringify(pairPrefs),
      'window.ANALYZERS': JSON.stringify(analyzers),
      'window.GENERATORS': JSON.stringify(generators),
      ...initialOptions.define,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    onEnd(
      async (): Promise<undefined> => {
        const indexHtml = await fs.readFile('src/index.html', 'utf-8');

        await Promise.all([
          fs.copyFile('src/favicon.ico', path.join(outdir, 'favicon.ico')),
          fs.writeFile(
            path.join(outdir, 'index.html'),
            indexHtml
              .replace('{{PRELOADED_STRINGS}}', JSON.stringify({ [defaultLocale]: defaultStrings }))
              .replace('{{CACHE_BREAK}}', Date.now().toString()),
          ),
          ...localeStrings.map(([locale, strings]) =>
            fs.writeFile(
              path.join(outdir, `index.${locale}.html`),
              indexHtml
                .replace(
                  '{{PRELOADED_STRINGS}}',
                  JSON.stringify({ [defaultLocale]: defaultStrings, [locale]: strings }),
                )
                .replace(/{{CACHE_BREAK}}/g, Date.now().toString()),
            ),
          ),
        ]);

        return;
      },
    );
  },
};

// TODO: Switch `yarn serve` to use `esbuild.serve` which prevents stale
// responses and minimizes FS writes.
void esbuild.build({
  entryPoints: ['src/app.tsx'],
  bundle: true,
  metafile: true,
  loader: { '.embed.png': 'dataurl', '.png': 'file', '.gif': 'file', '.jpg': 'file' },
  outdir: 'dist',
  plugins: [Plugin],

  minify: prod,
  sourcemap: prod,

  incremental: watch,
  watch: watch
    ? {
        onRebuild(error: esbuild.BuildFailure | null, result: esbuild.BuildResult | null) {
          if (error) console.error('❌ watch build failed');
          else {
            console.log('✅ watch build succeeded');
            if (result) {
              void (async () => {
                await fs.writeFile('meta.json', JSON.stringify(result.metafile));
              })();
            }
          }
        },
      }
    : undefined,
});
