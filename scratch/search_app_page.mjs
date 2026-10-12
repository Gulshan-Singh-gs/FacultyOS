import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

for (const term of ['AppPageRouteModule', 'renderToHTML', 'app-page.runtime', 'ComponentMod']) {
  let count = 0;
  let idx = 0;
  while ((idx = content.indexOf(term, idx)) !== -1) {
    count++;
    if (count <= 3) {
      console.log(`[${term}] at ${idx}:`, content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 200)));
    }
    idx += term.length;
  }
  console.log(`Total occurrences of ${term}: ${count}`);
}
