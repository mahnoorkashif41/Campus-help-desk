import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

function readHidden(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n" || ch === "\u0004") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          return resolve(value);
        }
        if (ch === "\u0003") process.exit(1); // Ctrl+C
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

if (!process.stdin.isTTY) {
  console.error("Please run this in a normal terminal window (for example the VS Code terminal).");
  process.exit(1);
}

const password = await readHidden("Choose the admin password (typing is hidden): ");
if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}
const again = await readHidden("Type it again: ");
if (password !== again) {
  console.error("The two passwords do not match.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const secret = randomBytes(48).toString("base64url");

console.log("\n=== Put these 3 lines in your local .env file (replace the email) ===\n");
console.log("ADMIN_EMAIL=admin@example.com");
console.log(`ADMIN_PASSWORD_HASH=${hash.replaceAll("$", "\\$")}`);
console.log(`SESSION_SECRET=${secret}`);
console.log("\n=== On Vercel (Project Settings > Environment Variables) use the hash WITHOUT backslashes ===\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log("\nThe backslashes in .env are required: Next.js treats a bare $ as a variable and would damage the hash.\n");