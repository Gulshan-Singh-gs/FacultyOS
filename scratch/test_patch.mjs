import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const patches = [
  [/writeHeaders\(prelude\)\{let\{statusCode/g, 'writeHeaders'],
  [/flushHeaders\(\)\{this\.headersSent=!0/g, 'flushHeaders'],
  [/onShellReady\(\)\{var e4;t3==null\|\|\(e4=t3\.onShellReady\)==null\|\|e4\.call\(t3\),s2\.resolve\(\)\}/g, 'onShellReady'],
  [/onShellError\(e4\)\{var r4;t3==null\|\|\(r4=t3\.onShellError\)==null\|\|r4\.call\(t3,e4\),s2\.reject\(e4\)\}/g, 'onShellError'],
  [/onError:t3\?\.onError/g, 'onError'],
  [/write:async b4=>\{if\(!d3\)\{/g, 'write:async b4'],
  [/async function T\(e3,t3,r3\)\{let a3=new i2\.PassThrough/g, 'function T'],
  [/waitShellReady,\(\)=>s2\.promise\)/g, 'waitShellReady'],
];

for (const [regex, name] of patches) {
  const matches = content.match(regex);
  console.log(name, 'matches:', matches ? matches.length : 0);
}
