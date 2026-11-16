// The safety net of the rebuild into states, cities and sources (docs/architecture-countries.md, step 0): the app as
// the pilot server serves it, with a recorder of every answer of a data source in between (evaluation/replay/harness.js).
// Record once (live, the services asked as by a visitor), then replay as often as needed without a single request:
// the outputs of a replay are compared with those of the recording by compare.mjs.
//   node evaluation/replay/server.mjs [port]          → http://localhost:5190/?replay=record&run=rec&lang=cs
// ROOT=<checkout>: serve another checkout's app (e.g. to replay the old code); the recordings stay in this folder.
// Everything recorded (third-party data) stays in evaluation/replay/data/ (git ignores it).
import http from "node:http";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = process.env.ROOT || path.join(HERE, "..", "..");
const DATA = path.join(HERE, "data");
const PORT = Number(process.argv[2] || process.env.PORT || 5190), APP = PORT + 1;

// The app's own server (static files, /api/*, data/*) on the next port.
const child = spawn(process.execPath, [path.join(ROOT, "pilot", "server.mjs")], { env: { ...process.env, PORT: String(APP) }, stdio: "inherit" });
process.on("exit", () => child.kill());
for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => process.exit());

// The page: the app's CSP gives way to one that loads no map tiles (no request to tile servers while cutting hundreds
// of streets) and the recorder comes before app.js.
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src *; object-src 'none'";
const page = (html) => html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, `<meta http-equiv="Content-Security-Policy" content="${CSP}">`)
  .replace('<script type="module" src="app.js"></script>', '<script type="module" src="/__replay/harness.js"></script>\n  <script type="module" src="app.js"></script>');

const body = (req) => new Promise((ok, no) => { const a = []; req.on("data", (c) => a.push(c)); req.on("end", () => ok(Buffer.concat(a))); req.on("error", no); });
const json = (res, x, status = 200) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(x)); };
const safe = (s) => String(s).replace(/[^a-z0-9_.-]/gi, "_");

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname === "/__replay/harness.js") {
      res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-cache" });
      return res.end(await fs.readFile(path.join(HERE, "harness.js")));
    }
    if (url.pathname === "/__replay/sample") {
      const name = safe(url.searchParams.get("name") || "sample");
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(await fs.readFile(path.join(HERE, `${name}.json`)));
    }
    // The recording: a body is stored once by its hash, the index lists the answers of each request in order.
    if (url.pathname === "/__replay/index") {
      if (req.method === "POST") {
        const entries = JSON.parse(await body(req));
        await fs.mkdir(DATA, { recursive: true });
        await fs.appendFile(path.join(DATA, "index.jsonl"), entries.map((e) => JSON.stringify(e) + "\n").join(""));
        return json(res, { ok: true });
      }
      res.writeHead(200, { "Content-Type": "application/x-ndjson" });
      return createReadStream(path.join(DATA, "index.jsonl")).on("error", () => res.end()).pipe(res);
    }
    const m = /^\/__replay\/body\/([0-9a-f]{40})$/.exec(url.pathname);
    if (m) {
      const file = path.join(DATA, "bodies", m[1].slice(0, 2), m[1]);
      if (req.method === "POST") {
        const buf = await body(req);
        if (crypto.createHash("sha1").update(buf).digest("hex") !== m[1]) return json(res, { error: "hash" }, 400);
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, buf);
        return json(res, { ok: true });
      }
      res.writeHead(200, { "Content-Type": "application/octet-stream" });
      return res.end(await fs.readFile(file));
    }
    // The outputs of a run: one file per cut.
    if (url.pathname === "/__replay/out" && req.method === "POST") {
      const run = safe(url.searchParams.get("run")), id = safe(url.searchParams.get("id"));
      const dir = path.join(DATA, "out", run);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, `${id}.json`), await body(req));
      return json(res, { ok: true });
    }
    // Everything else from the app's server, the page with the recorder.
    const r = await fetch(`http://localhost:${APP}${url.pathname}${url.search}`, { method: req.method, headers: req.headers.range ? { range: req.headers.range } : {} });
    const headers = Object.fromEntries([...r.headers].filter(([k]) => !["content-encoding", "content-length", "transfer-encoding", "connection"].includes(k)));
    let buf = Buffer.from(await r.arrayBuffer());
    if (url.pathname === "/" || url.pathname === "/index.html") buf = Buffer.from(page(buf.toString("utf8")));
    res.writeHead(r.status, headers);
    res.end(buf);
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(String(e?.stack || e));
  }
}).listen(PORT, () => console.log(`přehrávání: http://localhost:${PORT}/?replay=record&run=rec&lang=cs (aplikace na ${APP}, kód z ${ROOT})`));
