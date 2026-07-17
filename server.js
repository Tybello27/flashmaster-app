// Minimal static file server for the built FlashMaster PWA.
// Serves ./dist on PORT (default 3000) and answers /api/health so platform
// healthchecks pass. All application logic runs client-side; this server
// only delivers static assets (identical to Vercel's static hosting).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist");
const PORT = Number(process.env.PORT || 3000);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    let pathname = decodeURIComponent(url.pathname);

    if (pathname === "/api/health") {
      return send(res, 200, JSON.stringify({ status: "ok", app: "flashmaster", time: Date.now() }), { "Content-Type": "application/json" });
    }

    if (pathname === "/") pathname = "/index.html";
    let filePath = path.join(DIST, pathname);

    // Prevent path traversal
    if (!filePath.startsWith(DIST)) return send(res, 403, "Forbidden");

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        // SPA fallback
        const index = path.join(DIST, "index.html");
        return fs.readFile(index, (e2, buf) => {
          if (e2) return send(res, 404, "Not Found");
          send(res, 200, buf, { "Content-Type": MIME[".html"] });
        });
      }
      const ext = path.extname(filePath).toLowerCase();
      const type = MIME[ext] || "application/octet-stream";
      const headers = { "Content-Type": type };
      // Don't cache the service worker or manifest so updates apply quickly
      if (pathname === "/sw.js" || pathname === "/manifest.json") headers["Cache-Control"] = "no-cache";
      fs.readFile(filePath, (e3, buf) => {
        if (e3) return send(res, 500, "Server Error");
        send(res, 200, buf, headers);
      });
    });
  } catch (e) {
    send(res, 500, "Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`FlashMaster static server running at http://127.0.0.1:${PORT}`);
});
