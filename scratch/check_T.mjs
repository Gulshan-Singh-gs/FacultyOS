import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

for (const pattern of [
  'async function T(e3,t3,r3)',
  'onShellReady(){var e4;t3==null||(e4=t3.onShellReady)==null||e4.call(t3)',
  'waitShellReady,()=>s2.promise)',
  'flushHeaders(){this.headersSent=!0',
  'writeHeaders(prelude){let{statusCode'
]) {
  console.log(pattern, 'found:', content.includes(pattern));
}
