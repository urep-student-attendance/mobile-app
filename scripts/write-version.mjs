import { writeFile } from "node:fs/promises";

const version = {
  app: "urep-attendance",
  sha: process.env.BUILD_SHA || "dev",
  builtAt: new Date().toISOString(),
};
await writeFile(new URL("../dist/version.json", import.meta.url), JSON.stringify(version) + "\n");
console.log(`version.json: ${version.sha}`);
