import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

for (const pattern of [
  'allReady',
  'waitForAllReady',
  'waitAtLeastOneReactRenderTask',
  'waitShellReady',
  'createPromiseWithResolvers',
  'renderToReadableStream'
]) {
  console.log(pattern, 'includes:', content.includes(pattern));
}
