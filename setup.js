import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import { mkdir } from "node:fs/promises";
import readline from "node:readline/promises";

const isProduction = process.argv.includes("--prod");

console.log("Setting up...");

await mkdir("avatars");

try {
  execSync("pnpm -v");
} catch {
  execSync("npm install -g pnpm");
}

execSync("pnpm install");

const rl = readline.createInterface(process.stdin, process.stdout);
const databaseUrl = await rl.question("Enter your Postgres database URL: ");
const openaiApiKey = await rl.question("Enter your OpenAI API key: ");
rl.close();

const envFileText = `\
NODE_ENV=${isProduction ? "production" : "development"}
DATABASE_URL=${databaseUrl}
JWT_SECRET=${randomBytes(32).toString("hex")}
OPENAI_API_KEY=${openaiApiKey}
`;

fs.writeFileSync(".env", envFileText);

if (isProduction) {
  execSync("pnpm prisma migrate deploy");
} else {
  execSync("pnpm prisma migrate dev");
}

execSync("pnpm prisma generate");

if (isProduction) {
  execSync("pnpm build");
} else {
  execSync("pnpm prisma db seed");
}

console.log("Finished");
