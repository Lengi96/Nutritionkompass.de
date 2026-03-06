const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const entrypoint = path.resolve(
  __dirname,
  "..",
  ".mcp-tools",
  "resend-email-mcp",
  "dist",
  "index.js",
);

if (!fs.existsSync(entrypoint)) {
  console.error(
    [
      "Resend MCP build not found.",
      `Expected: ${entrypoint}`,
      "Install and build the official resend/resend-mcp server into .mcp-tools/resend-email-mcp.",
    ].join("\n"),
  );
  process.exit(1);
}

const child = spawn(process.execPath, [entrypoint, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
