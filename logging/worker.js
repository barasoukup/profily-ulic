// Cloudflare Worker for Profily ulic: takes the events the page sends (pilot/public/log.js) and keeps them
// in a D1 database (logging/schema.sql). The page sends them with navigator.sendBeacon as text, so the
// browser needs no preflight and the click never waits for it.
//   POST /log      one event as JSON, from the allowed origins only; answers 204
//   GET  /export   all events as CSV (or ?since=2026-11-01), with the header "Authorization: Bearer <EXPORT_TOKEN>"
// Setup: logging/README.md.
const KINDS = new Set(["rez", "export", "ulozeni", "sdileni", "navrh", "porovnat", "oprava", "hledani", "upravy"]);
// An edit record carries two short profiles (log.js shortProfile).
const MAX_BODY = 16384;
// Per address, a few events a second at most (one isolate's memory: a guard against a loop, not a wall).
const hits = new Map();
const tooMany = (ip) => {
  const now = Date.now(), h = (hits.get(ip) || []).filter((t) => now - t < 10000);
  h.push(now);
  hits.set(ip, h);
  if (hits.size > 5000) hits.clear();
  return h.length > 30;
};
const num = (v, lo, hi) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : null);
const str = (v, n) => (typeof v === "string" && v ? v.slice(0, n) : null);

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).includes(origin);
    const cors = allowed ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" } });
    }
    if (req.method === "POST" && url.pathname === "/log") {
      if (!allowed) return new Response("origin", { status: 403 });
      if (tooMany(req.headers.get("CF-Connecting-IP") || "?")) return new Response(null, { status: 429, headers: cors });
      const text = await req.text();
      if (text.length > MAX_BODY) return new Response("size", { status: 413, headers: cors });
      let e;
      try { e = JSON.parse(text); } catch { return new Response("json", { status: 400, headers: cors }); }
      if (!e || typeof e !== "object" || !KINDS.has(e.kind)) return new Response("kind", { status: 400, headers: cors });
      await env.DB.prepare(`INSERT INTO events (kind, detail, city, street, highway, way_id, lat, lon, bearing, reach_left, reach_right, session, profile)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
        e.kind, str(e.detail, 20), str(e.city, 30), str(e.street, 120), str(e.highway, 40),
        Number.isSafeInteger(e.wayId) ? e.wayId : null,
        num(e.lat, 47, 52), num(e.lon, 11, 20), num(e.bearing, -360, 360),
        num(e.reachLeft, 0, 100), num(e.reachRight, 0, 100), str(e.session, 40),
        e.kind === "upravy" && e.profile && typeof e.profile === "object" ? JSON.stringify(e.profile).slice(0, 15000) : null,
      ).run();
      return new Response(null, { status: 204, headers: cors });
    }
    if (req.method === "GET" && url.pathname === "/export") {
      if (!env.EXPORT_TOKEN || req.headers.get("Authorization") !== `Bearer ${env.EXPORT_TOKEN}`) return new Response("token", { status: 401 });
      const since = url.searchParams.get("since") || "0000";
      const { results } = await env.DB.prepare("SELECT * FROM events WHERE ts >= ? ORDER BY id").bind(since).all();
      const cols = ["id", "ts", "kind", "detail", "city", "street", "highway", "way_id", "lat", "lon", "bearing", "reach_left", "reach_right", "session", "profile"];
      const cell = (v) => (v === null || v === undefined ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
      const csv = [cols.join(","), ...results.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
      return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=profily-ulic.csv" } });
    }
    return new Response("Profily ulic – záznam řezů", { status: 404 });
  },
};
