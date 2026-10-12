import fs from 'node:fs';

const filePath = '.open-next/server-functions/default/handler.mjs';
let content = fs.readFileSync(filePath, 'utf8');

// 1. completeShell in React Server DOM
content = content.replace(
  /function completeShell\(request\)\{/g,
  'function completeShell(request){console.log("[FACULTYOS_TRACE] React completeShell ENTERED!");'
);

// 2. onShellReady in stream-ops
content = content.replace(
  /onShellReady\(\)\{var e4;t3==null\|\|\(e4=t3\.onShellReady\)==null\|\|e4\.call\(t3\),s2\.resolve\(\)\}/g,
  'onShellReady(){console.log("[FACULTYOS_TRACE] stream-ops onShellReady ENTERED!");var e4;t3==null||(e4=t3.onShellReady)==null||e4.call(t3);console.log("[FACULTYOS_TRACE] s2.resolve called");s2.resolve()}'
);

// 3. onShellError in stream-ops
content = content.replace(
  /onShellError\(e4\)\{var r4;t3==null\|\|\(r4=t3\.onShellError\)==null\|\|r4\.call\(t3,e4\),s2\.reject\(e4\)\}/g,
  'onShellError(e4){console.error("[FACULTYOS_TRACE] stream-ops onShellError ENTERED!", e4);var r4;t3==null||(r4=t3.onShellError)==null||r4.call(t3,e4);s2.reject(e4)}'
);

// 4. onError in stream-ops
content = content.replace(
  /onError:t3\?\.onError/g,
  'onError:e4=>{console.error("[FACULTYOS_TRACE] stream-ops onError ENTERED!", e4);t3?.onError?.(e4)}'
);

// 5. writeHeaders in streamCreator
content = content.replace(
  /writeHeaders\(prelude\)\{let\{statusCode/g,
  'writeHeaders(prelude){console.log("[FACULTYOS_TRACE] streamCreator.writeHeaders ENTERED! status:", prelude.statusCode);let{statusCode'
);

// 6. flushHeaders in OpenNextNodeResponse
content = content.replace(
  /flushHeaders\(\)\{this\.headersSent=!0/g,
  'flushHeaders(){console.log("[FACULTYOS_TRACE] flushHeaders ENTERED! status:", this.statusCode);this.headersSent=!0'
);

// 7. _transform in OpenNextNodeResponse
content = content.replace(
  /_transform\(chunk,encoding,callback\)\{/g,
  '_transform(chunk,encoding,callback){console.log("[FACULTYOS_TRACE] _transform ENTERED chunk len:", chunk?.length);'
);

// 8. Log in function T start
content = content.replace(
  /async function T\(e3,t3,r3\)\{let a3=new i2\.PassThrough/g,
  'async function T(e3,t3,r3){console.log("[FACULTYOS_TRACE] function T START");let a3=new i2.PassThrough'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Injected comprehensive instrumentation into handler.mjs');
