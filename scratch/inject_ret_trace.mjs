import fs from 'fs';

let code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');
const target = ',X(t3,0)},t2.createFromReadableStream';
const replace = ',(()=>{let ret=X(t3,0);console.log("[FACULTYOS_TRACE] createFromNodeStream returned chunk0 status:",ret?.status);ret.then(v=>console.log("[FACULTYOS_TRACE] chunk0 PROMISE RESOLVED!"),e=>console.error("[FACULTYOS_TRACE] chunk0 PROMISE REJECTED:",e));return ret})()},t2.createFromReadableStream';

if (code.includes(target)) {
  code = code.replace(target, replace);
  fs.writeFileSync('.open-next/server-functions/default/handler.mjs', code, 'utf8');
  console.log('✓ Injected chunk0 return trace');
} else {
  console.log('Target not found');
}
