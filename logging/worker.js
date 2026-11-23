// Cloudflare Worker for Profily ulic: takes the events the page sends (pilot/public/log.js) and keeps them
// in a D1 database (logging/schema.sql). The page sends them with navigator.sendBeacon as text, so the
// browser needs no preflight and the click never waits for it.
//   POST /log      one event as JSON, from the allowed origins only; answers 204
//   GET  /export   all events as CSV (or ?since=2026-11-01), with the header "Authorization: Bearer <EXPORT_TOKEN>"
// Setup: logging/README.md.
const KINDS = new Set(["rez", "export", "ulozeni", "sdileni", "navrh", "porovnat", "oprava", "hledani", "upravy", "hlaseni", "bez_ulice"]);
// An edit record carries two short profiles (log.js shortProfile), a report a visitor's text and the profile.
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
// Stored whole or not at all (a cut-off JSON could not be read back).
const profileText = (p) => { const s = JSON.stringify(p); return s.length <= 15000 ? s : null; };
const num = (v, lo, hi) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : null);
// A report's profile kept within bounds whatever the page sent: the text 1 000 characters, ten short categories.
const reportOf = (p) => ({ ...p, text: str(p.text, 1000), co: Array.isArray(p.co) ? p.co.slice(0, 10).map((c) => str(c, 30)).filter(Boolean) : [] });
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
      // The state of the cut (ISO 3166-1, step 4b of docs/architecture-countries.md) next to its city; the box takes
      // Austria and Slovakia whole (before: 47–52° N, 11–20° E lost Košice's and Bregenz's position).
      const values = [
        e.kind, str(e.detail, 20), str(e.city, 30), str(e.street, 120), str(e.highway, 40),
        Number.isSafeInteger(e.wayId) ? e.wayId : null,
        // All the states of the app (countries/*.js bounds): the Canaries (27.6° N), the Azores (31.3° W), Estonia (59.8° N),
        // Cyprus (34.7° E); before, 45.5–55.5° N and 5.5–23° E lost the south, Estonia and Cyprus (the review of 23. 11. 2026).
        num(e.lat, 27, 61), num(e.lon, -32, 35), num(e.bearing, -360, 360),
        num(e.reachLeft, 0, 100), num(e.reachRight, 0, 100), str(e.session, 40),
        e.profile && typeof e.profile === "object" && (e.kind === "upravy" || e.kind === "hlaseni") ? profileText(e.kind === "hlaseni" ? reportOf(e.profile) : e.profile) : null,
      ];
      const country = typeof e.country === "string" && /^[A-Z]{2}$/.test(e.country) ? e.country : null;
      const COLS = "kind, detail, city, street, highway, way_id, lat, lon, bearing, reach_left, reach_right, session, profile";
      try {
        await env.DB.prepare(`INSERT INTO events (${COLS}, country) VALUES (${values.map(() => "?").join(", ")}, ?)`).bind(...values, country).run();
      } catch (err) {
        // A database without the column yet (README: ALTER TABLE … ADD COLUMN country): the row without it.
        if (!/country/.test(String(err?.message))) throw err;
        await env.DB.prepare(`INSERT INTO events (${COLS}) VALUES (${values.map(() => "?").join(", ")})`).bind(...values).run();
      }
      return new Response(null, { status: 204, headers: cors });
    }
    if (req.method === "GET" && url.pathname === "/export") {
      if (!env.EXPORT_TOKEN || req.headers.get("Authorization") !== `Bearer ${env.EXPORT_TOKEN}`) return new Response("token", { status: 401 });
      const since = url.searchParams.get("since") || "0000";
      const { results } = await env.DB.prepare("SELECT * FROM events WHERE ts >= ? ORDER BY id").bind(since).all();
      const cols = ["id", "ts", "kind", "detail", "city", "country", "street", "highway", "way_id", "lat", "lon", "bearing", "reach_left", "reach_right", "session", "profile"];
      const cell = (v) => (v === null || v === undefined ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
      const csv = [cols.join(","), ...results.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
      return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=profily-ulic.csv" } });
    }
    return new Response("Profily ulic – záznam řezů", { status: 404 });
  },
};
