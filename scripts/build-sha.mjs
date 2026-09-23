// Commit SHA for the build: BUILD_SHA when provided, otherwise read from .git without needing the git binary
// (Deploy Manager builds from its checkout and passes no build args).
import { existsSync, readFileSync } from "node:fs";

export function buildSha() {
  const fromEnv = process.env.BUILD_SHA;
  if (fromEnv && fromEnv !== "unknown") return fromEnv;
  try {
    const head = readFileSync(".git/HEAD", "utf8").trim();
    if (!head.startsWith("ref: ")) return head;
    const ref = head.slice(5);
    if (existsSync(`.git/${ref}`)) return readFileSync(`.git/${ref}`, "utf8").trim();
    const packed = readFileSync(".git/packed-refs", "utf8")
      .split("\n")
      .find((line) => line.endsWith(` ${ref}`));
    return packed ? packed.split(" ")[0] : "dev";
  } catch {
    return "dev";
  }
}
