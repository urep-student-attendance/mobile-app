import { writeFile } from "node:fs/promises";
import { buildSha } from "./build-sha.mjs";

const version = {
  app: "urep-attendance",
  sha: buildSha(),
  builtAt: new Date().toISOString(),
};
await writeFile(new URL("../dist/version.json", import.meta.url), JSON.stringify(version) + "\n");
console.log(`version.json: ${version.sha}`);
