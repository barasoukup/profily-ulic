// Cloudflare Worker for Profily ulic: takes the events the page sends (pilot/public/log.js) and keeps them
// in a D1 database (logging/schema.sql). The page sends them with navigator.sendBeacon as text, so the
// browser needs no preflight and the click never waits for it.
//   POST /log      one event as JSON, from the allowed origins only; answers 204
//   GET  /export   all events as CSV (or ?since=2026-11-01), with the header "Authorization: Bearer <EXPORT_TOKEN>"
//   POST /contact  a message from the About dialog (pilot/public/about.js), kept in the table contacts; answers 204
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

// A message to Bára from the About dialog (Bára 24. 11. 2026): the text (required, at most CONTACT_MAX characters), an
// e-mail for a reply and the link of the cut (both optional). A hidden field "website" only a robot fills: answered 204,
// nothing kept. At most CONTACT_PER_HOUR messages an hour from one address and CONTACT_ALL_HOUR from everyone: the table
// contact_rate counts them by a SHA-256 of the hour, the address and the secret RATE_SALT (the address itself is never
// kept, a row is deleted after two hours). With the send_email binding MAIL and the variables CONTACT_FROM and CONTACT_TO
// (logging/README.md: the addresses only in the Worker's settings, never here) the message also comes as an e-mail; a
// failed e-mail leaves the message kept.
const CONTACT_MAX = 3000, CONTACT_PER_HOUR = 5, CONTACT_ALL_HOUR = 60;
const EMAIL = /^[^\s@<>()",;:]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/;
const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");
const b64 = (s) => { let bin = ""; for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b); return btoa(bin); };
async function mailContact(env, m) {
  if (!env.MAIL || !env.CONTACT_FROM || !env.CONTACT_TO) return;
  const body = [m.message, "", m.email ? `E-mail: ${m.email}` : "E-mail: –", m.cut ? `Řez: ${m.cut}` : null, m.lang ? `Jazyk: ${m.lang}` : null, m.country ? `Stát: ${m.country}` : null].filter((x) => x !== null).join("\n");
  const raw = [`From: Profily ulic <${env.CONTACT_FROM}>`, `To: ${env.CONTACT_TO}`, m.email ? `Reply-To: ${m.email}` : null,
    `Subject: =?UTF-8?B?${b64("Profily ulic: zpráva")}?=`, `Message-ID: <${crypto.randomUUID()}@${env.CONTACT_FROM.split("@")[1]}>`,
    `Date: ${new Date().toUTCString()}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=utf-8", "Content-Transfer-Encoding: base64", "",
    b64(body).replace(/.{76}/g, "$&\r\n")].filter((x) => x !== null).join("\r\n");
  try {
    const { EmailMessage } = await import("cloudflare:email");
    await env.MAIL.send(new EmailMessage(env.CONTACT_FROM, env.CONTACT_TO, raw));
  } catch (err) { console.warn("contact e-mail", String(err?.message || err)); }
}
async function contact(req, env, cors, origins) {
  const text = await req.text();
  if (text.length > CONTACT_MAX * 3 + 4000) return new Response("size", { status: 413, headers: cors });
  let e;
  try { e = JSON.parse(text); } catch { return new Response("json", { status: 400, headers: cors }); }
  if (!e || typeof e !== "object" || Array.isArray(e)) return new Response("json", { status: 400, headers: cors });
  // The robots' field: thanked, not kept.
  if (e.website) return new Response(null, { status: 204, headers: cors });
  const message = typeof e.message === "string" ? e.message.trim() : "";
  if (!message) return new Response("message", { status: 400, headers: cors });
  if (message.length > CONTACT_MAX) return new Response("size", { status: 413, headers: cors });
  const email = typeof e.email === "string" && e.email.trim() ? e.email.trim() : null;
  if (email && !EMAIL.test(email)) return new Response("email", { status: 400, headers: cors });
  // The cut's link only on our own page (#rez=…).
  const cut = typeof e.cut === "string" && e.cut.length <= 2000 && e.cut.includes("#rez=") && origins.some((o) => o && e.cut.startsWith(o + "/")) ? e.cut : null;
  const now = new Date(), hour = now.toISOString().slice(0, 13), old = new Date(now - 2 * 3600e3).toISOString().slice(0, 13);
  const k = await sha(`${hour}|${req.headers.get("CF-Connecting-IP") || "?"}|${env.RATE_SALT || ""}`);
  await env.DB.prepare("DELETE FROM contact_rate WHERE hour < ?").bind(old).run();
  const mine = await env.DB.prepare("SELECT n FROM contact_rate WHERE k = ?").bind(k).first();
  const all = await env.DB.prepare("SELECT sum(n) AS n FROM contact_rate WHERE hour = ?").bind(hour).first();
  if ((mine?.n || 0) >= CONTACT_PER_HOUR || (all?.n || 0) >= CONTACT_ALL_HOUR) return new Response(null, { status: 429, headers: cors });
  await env.DB.prepare("INSERT INTO contact_rate (k, hour, n) VALUES (?, ?, 1) ON CONFLICT(k) DO UPDATE SET n = n + 1").bind(k, hour).run();
  const m = { message, email, cut, lang: str(e.lang, 5), country: typeof e.country === "string" && /^[A-Z]{2}$/.test(e.country) ? e.country : null };
  await env.DB.prepare("INSERT INTO contacts (message, email, cut, lang, country) VALUES (?, ?, ?, ?, ?)").bind(m.message, m.email, m.cut, m.lang, m.country).run();
  await mailContact(env, m);
  return new Response(null, { status: 204, headers: cors });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";
    const origins = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim());
    const allowed = origins.includes(origin);
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
    if (req.method === "POST" && url.pathname === "/contact") {
      if (!allowed) return new Response("origin", { status: 403 });
      return contact(req, env, cors, origins);
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
