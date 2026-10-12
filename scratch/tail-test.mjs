import { spawn } from "child_process";

console.log("Starting wrangler tail...");
const tail = spawn("npx", ["wrangler", "tail", "--format", "json"], {
  shell: true,
});

tail.stdout.on("data", (data) => {
  const str = data.toString();
  try {
    for (const line of str.split("\n")) {
      if (!line.trim()) continue;
      const parsed = JSON.parse(line);
      for (const log of parsed.logs || []) {
        console.log(`[LOG]`, log.message.join(" "));
      }
      for (const exc of parsed.exceptions || []) {
        console.error(`[EXCEPTION]`, exc.name, exc.message);
      }
      if (parsed.outcome) {
        console.log(`[OUTCOME]`, parsed.outcome, parsed.event?.request?.url);
      }
    }
  } catch {
    console.log("[RAW]", str);
  }
});

tail.stderr.on("data", (data) => {
  console.log("[TAIL STDERR]", data.toString());
});

// Wait 5 seconds for tail connection, then send request
setTimeout(async () => {
  console.log("Sending fetch to /dashboard? with session token...");
  try {
    const res = await fetch("https://facultyos.gs-softwares.workers.dev/dashboard?", {
      headers: {
        Cookie: "better-auth.session_token=hdjL4yHpHpTAvJbGGv3EkWw6ZI5RXk6Y; facultyos.session_token=hdjL4yHpHpTAvJbGGv3EkWw6ZI5RXk6Y",
      },
    });
    console.log("Fetch response status:", res.status);
    console.log("Fetch body:", await res.text());
  } catch (err) {
    console.log("Fetch error:", err.message);
  }

  setTimeout(() => {
    tail.kill();
    process.exit(0);
  }, 3000);
}, 6000);
