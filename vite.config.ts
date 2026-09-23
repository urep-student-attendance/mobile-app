import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { buildSha } from "./scripts/build-sha.mjs";

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_SHA__: JSON.stringify(buildSha().slice(0, 7)),
  },
  build: {
    target: "es2022",
    assetsInlineLimit: 0,
  },
  test: {
    environment: "node",
  },
});
