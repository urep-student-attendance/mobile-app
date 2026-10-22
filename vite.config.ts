import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { buildSha } from "./scripts/build-sha.mjs";

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_SHA__: JSON.stringify(buildSha().slice(0, 7)),
  },
  server: {
    // Same /api proxy as server.mjs, for `ATTENDANCE_API_URL=http://localhost:3000 npm run dev`.
    proxy: process.env.ATTENDANCE_API_URL
      ? {
          "/api": {
            target: process.env.ATTENDANCE_API_URL,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ""),
          },
        }
      : undefined,
  },
  build: {
    target: "es2022",
    assetsInlineLimit: 0,
  },
  test: {
    environment: "node",
  },
});
