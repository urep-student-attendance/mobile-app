// Minimal static server for the built preview. Routes are hash-based, so only real files are served.
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const root = resolve("dist");
const port = Number(process.env.PORT || 8080);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};
const security = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};

http
  .createServer(async (req, res) => {
    try {
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405, { Allow: "GET, HEAD" });
        return res.end();
      }
      const url = new URL(req.url, "http://localhost");
      if (url.pathname === "/healthz") {
        await stat(resolve(root, "index.html"));
        res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
        return res.end('{"status":"ok","app":"urep-attendance"}');
      }
      const pathname = decodeURIComponent(url.pathname);
      let path = resolve(root, "." + pathname);
      if (path !== root && !path.startsWith(root + sep)) {
        res.writeHead(403);
        return res.end();
      }
      let status = 200;
      try {
        if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
        await stat(path);
      } catch {
        status = 404;
        path = resolve(root, "index.html");
      }
      const body = await readFile(path);
      const immutable = pathname.startsWith("/assets/");
      res.writeHead(status, {
        "Content-Type": types[extname(path)] || "application/octet-stream",
        "Cache-Control": immutable
          ? "public, max-age=31536000, immutable"
          : pathname === "/version.json"
            ? "no-store"
            : "public, max-age=60",
        ...security,
      });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch {
      res.writeHead(400);
      res.end("Invalid request");
    }
  })
  .listen(port, "0.0.0.0", () => console.log(`urep-attendance listening on ${port}`));
