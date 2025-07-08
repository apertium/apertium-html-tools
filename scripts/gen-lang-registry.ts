import fs from 'fs';
import path from 'path';

const LANGS_DIR = path.resolve(__dirname, '../src/components/dictionary/langs');
const INDEX_FILE = path.resolve(__dirname, '../src/components/dictionary/index.ts');

async function generateRegistry() {
  const files = fs.readdirSync(LANGS_DIR).filter((f) => f.endsWith('.ts'));

  const imports = files
    .map((file) => {
      const name = path.basename(file, '.ts');
      return `import { ${name}Plugin } from './langs/${name}';`;
    })
    .join('\n');

  const registry = files
    .map((file) => {
      const name = path.basename(file, '.ts');
      return `  ${JSON.stringify(name)}: ${name}Plugin,`;
    })
    .join('\n');

  const content = `import Dictionary from './Dictionary';\n${imports}\nimport { LanguagePlugin } from './types';\n\nexport const languageRegistry: Record<string, LanguagePlugin> = {\n${registry}\n};\n\nexport default Dictionary;\n`;

  fs.writeFileSync(INDEX_FILE, content);
}

generateRegistry();
