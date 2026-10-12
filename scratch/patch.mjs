import fs from "node:fs";

let content = fs.readFileSync(".open-next/server-functions/default/handler.mjs", "utf8");
const target = "catch(y3){";
const replacement = "catch(y3){console.error('[NEXT_CATCH_ERROR]', y3 && (y3.stack || y3.message || y3));";
if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(".open-next/server-functions/default/handler.mjs", content, "utf8");
  console.log("Successfully patched handler.mjs");
} else {
  console.log("Target not found");
}
