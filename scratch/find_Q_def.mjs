import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const idx = 3230365;
for (const decl of ['function Q', 'let Q', 'var Q', 'const Q']) {
  const found = content.lastIndexOf(decl, idx);
  if (found !== -1) {
    console.log(`${decl} at ${found}:`, content.substring(found, found + 200));
  }
}
