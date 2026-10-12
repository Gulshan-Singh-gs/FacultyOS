import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const regex = /\bI\(\w+,\{/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`Matched at ${match.index}:`, content.substring(Math.max(0, match.index - 100), Math.min(content.length, match.index + 200)));
}
