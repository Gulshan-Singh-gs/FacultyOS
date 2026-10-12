import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

let idx = 0;
while (true) {
  const found = content.indexOf('nextServer', idx);
  if (found === -1) break;
  console.log('--- nextServer FOUND AT', found, '---');
  console.log(content.substring(Math.max(0, found - 200), Math.min(content.length, found + 400)));
  idx = found + 50;
  if (idx > 9400000) break;
}
