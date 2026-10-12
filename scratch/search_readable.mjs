import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

for (const pattern of ['this.readable =', 'this.readable=']) {
  let idx = 0;
  while ((idx = content.indexOf(pattern, idx)) !== -1) {
    console.log(`[${pattern}] at ${idx}:`, content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 250)));
    idx += pattern.length;
  }
}
