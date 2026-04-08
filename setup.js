import { exec, execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import { mkdir } from "node:fs/promises";
import readline from "node:readline/promises";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const isProduction = process.argv.includes("--prod");

console.log("Setting up...");

async function installPackages() {
  try {
    await execAsync("pnpm -v");
  } catch {
    await execAsync("npm install -g pnpm");
  }
  await execAsync("pnpm install");
}

const createImgFolder = mkdir("img");
const installPackagesPromise = installPackages();

const rl = readline.createInterface(process.stdin, process.stdout);
const databaseUrl = await rl.question("Enter your Postgres database URL: ");
rl.close();

const envFileText = `\
DATABASE_URL=${databaseUrl}
JWT_SECRET=${randomBytes(32).toString("hex")}
`;

fs.writeFileSync(".env", envFileText);

await installPackagesPromise;

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

await createImgFolder;
console.log("Finished");
