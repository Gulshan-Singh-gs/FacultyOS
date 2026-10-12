import fs from 'node:fs';

const filePath = '.open-next/server-functions/default/handler.mjs';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /writeHeaders\(prelude\)\{let\{statusCode/g,
  'writeHeaders(prelude){console.log("[FACULTYOS_TRACE] streamCreator.writeHeaders CALLED! status:", prelude.statusCode);let{statusCode'
);

content = content.replace(
  /flushHeaders\(\)\{this\.headersSent=!0/g,
  'flushHeaders(){console.log("[FACULTYOS_TRACE] OpenNextNodeResponse.flushHeaders CALLED! status:", this.statusCode);this.headersSent=!0'
);

content = content.replace(
  /onShellReady\(\)\{var e4;t3==null\|\|\(e4=t3\.onShellReady\)==null\|\|e4\.call\(t3\),s2\.resolve\(\)\}/g,
  'onShellReady(){console.log("[FACULTYOS_TRACE] React onShellReady CALLED!");var e4;t3==null||(e4=t3.onShellReady)==null||e4.call(t3);s2.resolve()}'
);

content = content.replace(
  /onShellError\(e4\)\{var r4;t3==null\|\|\(r4=t3\.onShellError\)==null\|\|r4\.call\(t3,e4\),s2\.reject\(e4\)\}/g,
  'onShellError(e4){console.error("[FACULTYOS_TRACE] React onShellError CALLED!", e4);var r4;t3==null||(r4=t3.onShellError)==null||r4.call(t3,e4);s2.reject(e4)}'
);

content = content.replace(
  /onError:t3\?\.onError/g,
  'onError:e4=>{console.error("[FACULTYOS_TRACE] React onError CALLED!", e4);t3?.onError?.(e4)}'
);

content = content.replace(
  /write:async b4=>\{if\(!d3\)\{/g,
  'write:async b4=>{console.log("[FACULTYOS_TRACE] pipeToNodeResponse write chunk len:", b4?.length);if(!d3){'
);

content = content.replace(
  /async function T\(e3,t3,r3\)\{let a3=new i2\.PassThrough/g,
  'async function T(e3,t3,r3){console.log("[FACULTYOS_TRACE] renderToNodeFizzStream (T) START");let a3=new i2.PassThrough'
);

content = content.replace(
  /waitShellReady,\(\)=>s2\.promise\)/g,
  'waitShellReady,()=>s2.promise.then(v=>{console.log("[FACULTYOS_TRACE] waitShellReady resolved!");return v;}))'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Patched .open-next/server-functions/default/handler.mjs with detailed tracing!');
