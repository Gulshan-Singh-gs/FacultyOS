import fs from 'node:fs';

const filePath = '.open-next/server-functions/default/handler.mjs';
let content = fs.readFileSync(filePath, 'utf8');

const badStr = 'function _disabled_install(){;let nodeTimers=require("node:timers");globalThis.setImmediate=nodeTimers.setImmediate=patchedSetImmediate,globalThis.clearImmediate=nodeTimers.clearImmediate=patchedClearImmediate;let nodeTimersPromises=require("node:timers/promises");nodeTimersPromises.setImmediate=patchedSetImmediatePromise,process.nextTick=patchedNextTick}}';

if (content.includes(badStr)) {
  content = content.replace(badStr, '/* disabled fast-set-immediate */');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Successfully fixed syntax in handler.mjs!');
} else {
  console.log('badStr not found, searching around _disabled_install:');
  const idx = content.indexOf('_disabled_install');
  if (idx !== -1) {
    console.log(content.substring(idx - 20, idx + 350));
  }
}
