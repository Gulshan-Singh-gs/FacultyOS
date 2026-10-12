import fs from 'node:fs';

const filePath = '.open-next/server-functions/default/handler.mjs';
let content = fs.readFileSync(filePath, 'utf8');

// 1. function az (startWork)
content = content.replace(
  /function az\(e10\)\{/g,
  'function az(e10){console.log("[FACULTYOS_TRACE] az (startWork) CALLED! pendingRootTasks:", e10.pendingRootTasks);'
);

// 2. function aj (performWork)
content = content.replace(
  /function aj\(e10\)\{/g,
  'function aj(e10){console.log("[FACULTYOS_TRACE] aj (performWork) CALLED! pendingRootTasks:", e10.pendingRootTasks, "pingedTasks:", e10.pingedTasks?.length);'
);

// 3. function aR (completeShell)
content = content.replace(
  /function aR\(e10\)\{/g,
  'function aR(e10){console.log("[FACULTYOS_TRACE] aR (completeShell) CALLED!");'
);

// 4. Trace catch block in aj
content = content.replace(
  /\(at\(e10,s3,\{\}\),l2\.replay\.pendingTasks\+\+,/g,
  '(console.error("[FACULTYOS_TRACE] aj caught error:", s3),at(e10,s3,{}),l2.replay.pendingTasks++,'
);

// 5. In stream-ops onShellReady:
content = content.replace(
  /onShellReady\(\)\{var e4;t3==null\|\|\(e4=t3\.onShellReady\)==null\|\|e4\.call\(t3\),s2\.resolve\(\)\}/g,
  'onShellReady(){console.log("[FACULTYOS_TRACE] stream-ops onShellReady CALLED!");var e4;t3==null||(e4=t3.onShellReady)==null||e4.call(t3);console.log("[FACULTYOS_TRACE] s2.resolve called");s2.resolve()}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully injected precision tracing into active React instance in handler.mjs');
