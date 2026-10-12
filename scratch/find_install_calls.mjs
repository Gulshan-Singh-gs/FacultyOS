import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const regex = /install\(\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`install() at ${match.index}:`, content.substring(Math.max(0, match.index - 50), Math.min(content.length, match.index + 100)));
}
