// The Worker of the log of cuts (logging/worker.js) with a fake D1: a cut is stored exactly, a foreign origin
// and a bad kind are refused, the export needs the token. And the page sends nothing without LOG_URL.
import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../logging/worker.js";

function fakeDb() {
  const rows = [];
  return {
    rows,
    prepare(sql) {
      return {
        bind: (...v) => ({
          run: async () => { rows.push(v); },
          all: async () => ({ results: rows.map((r, i) => ({ id: i + 1, ts: "2026-11-10T10:00:00Z", kind: r[0], street: r[3], lat: r[6], lon: r[7] })) }),
        }),
      };
    },
  };
}
const env = (db) => ({ DB: db, ALLOWED_ORIGINS: "https://barasoukup.github.io,http://localhost:5173", EXPORT_TOKEN: "t" });
const post = (body, origin = "https://barasoukup.github.io") => new Request("https://w.example/log", { method: "POST", body: JSON.stringify(body), headers: { Origin: origin, "Content-Type": "text/plain" } });

test("záznam řezu: uloží se přesně, cizí původ a neznámý druh se odmítnou", async () => {
  const db = fakeDb();
  const cut = { kind: "rez", detail: "klik", city: "most", street: "tř. Budovatelů", highway: "secondary", wayId: 46195319, lat: 50.4998439, lon: 13.6384523, bearing: 25, reachLeft: 22, reachRight: 37.6, session: "s1" };
  assert.equal((await worker.fetch(post(cut), env(db))).status, 204);
  assert.deepEqual(db.rows[0], ["rez", "klik", "most", "tř. Budovatelů", "secondary", 46195319, 50.4998439, 13.6384523, 25, 22, 37.6, "s1", null, null]);
  assert.equal((await worker.fetch(post(cut, "https://evil.example"), env(db))).status, 403);
  assert.equal((await worker.fetch(post({ ...cut, kind: "x" }), env(db))).status, 400);
  // A click with no street (outside the data): only where, rounded, and why.
  assert.equal((await worker.fetch(post({ kind: "bez_ulice", detail: "bez_dat", city: "cesko", lat: 48.21, lon: 16.37, session: "s1" }), env(db))).status, 204);
  db.rows.pop();
  for (const body of [null, 123, []]) assert.equal((await worker.fetch(post(body), env(db))).status, 400);
  assert.equal(db.rows.length, 1);
});

test("záznam úprav: dva krátké profily, jen u druhu upravy", async () => {
  const db = fakeDb();
  const { shortProfile } = await import("../pilot/public/log.js");
  const pred = shortProfile({ edges: { left: "budova", right: "budova" }, segments: [{ type: "chodnik", width: 3, items: [{ kind: "lampa" }] }, { type: "pruh", width: 6.5, dir: "forward", signs: [{ k: "b20a", v: 30 }] }] });
  assert.deepEqual(pred, { l: "budova", r: "budova", s: [{ t: "chodnik", w: 3 }, { t: "pruh", w: 6.5, d: "forward", z: ["b20a:30"] }] });
  const po = { ...pred, s: [pred.s[0], { t: "cyklopruh", w: 1.5 }, { t: "pruh", w: 5 }] };
  assert.equal((await worker.fetch(post({ kind: "upravy", detail: "navrh", profile: { pred, po } }), env(db))).status, 204);
  assert.deepEqual(JSON.parse(db.rows[0][12]), { pred, po });
  await worker.fetch(post({ kind: "rez", profile: { pred, po } }), env(db));
  assert.equal(db.rows[1][12], null);
});

test("hlášení chyby: text a profil se uloží", async () => {
  const db = fakeDb();
  const profile = { co: ["pruhy"], text: "vlevo chybí cyklopruh", vypocet: { l: "budova", r: "budova", s: [{ t: "pruh", w: 3.5 }] } };
  assert.equal((await worker.fetch(post({ kind: "hlaseni", street: "Národní", profile }), env(db))).status, 204);
  assert.deepEqual(JSON.parse(db.rows[0][12]), profile);
  // The text is cut to 1 000 characters and the categories to ten, so the record is always whole JSON.
  await worker.fetch(post({ kind: "hlaseni", profile: { ...profile, text: "x".repeat(5000), co: Array(50).fill("pruhy") } }), env(db));
  const long = JSON.parse(db.rows[1][12]);
  assert.equal(long.text.length, 1000);
  assert.equal(long.co.length, 10);
});

test("export jen s tokenem", async () => {
  const db = fakeDb();
  await worker.fetch(post({ kind: "export", detail: "png" }), env(db));
  assert.equal((await worker.fetch(new Request("https://w.example/export"), env(db))).status, 401);
  const r = await worker.fetch(new Request("https://w.example/export", { headers: { Authorization: "Bearer t" } }), env(db));
  assert.equal(r.status, 200);
  assert.match(await r.text(), /^id,ts,kind/);
});

test("bez LOG_URL stránka nic neposílá", async () => {
  let sent = 0;
  globalThis.navigator ??= {};
  const nav = globalThis.navigator;
  const old = nav.sendBeacon;
  nav.sendBeacon = () => { sent++; return true; };
  const { log } = await import("../pilot/public/log.js");
  log("rez", { city: "praha" });
  nav.sendBeacon = old;
  assert.equal(sent, 0);
});

// Step 4b (docs/architecture-countries.md): the cut's state next to its city, the position of Košice or Bregenz kept, and a
// database without the new column still takes the row.
test("záznam řezu: stát vedle města, poloha v celém Slovensku a Rakousku", async () => {
  const db = fakeDb();
  const cut = { kind: "rez", detail: "klik", city: "kosice", country: "SK", lat: 48.7206, lon: 21.258, bearing: 10, session: "s1" };
  assert.equal((await worker.fetch(post(cut), env(db))).status, 204);
  assert.equal(db.rows[0].at(-1), "SK");
  assert.equal(db.rows[0][7], 21.258);
  assert.equal((await worker.fetch(post({ ...cut, country: "Slovensko" }), env(db))).status, 204);
  assert.equal(db.rows[1].at(-1), null);
  const old = { rows: [], prepare: (sql) => ({ bind: (...v) => ({ run: async () => { if (sql.includes("country")) throw new Error("table events has no column named country"); old.rows.push(v); } }) }) };
  assert.equal((await worker.fetch(post(cut), env(old))).status, 204);
  assert.equal(old.rows[0].length, 13);
});

// The review of 23. 11. 2026: the position of cuts in the south, Estonia and Cyprus was dropped.
// Any valid position since 25. 11. 2026 (Washington DC, Toronto, Auckland), nothing that is no position.
test("záznam řezu: každá platná poloha (Kanáry, Kypr, Estonsko, Washington, Auckland), neplatná ne", async () => {
  const db = fakeDb();
  for (const [lat, lon] of [[27.643, -17.981], [37.74, -25.67], [35.17, 33.36], [59.437, 24.75], [44.494, 11.343], [38.9072, -77.0369], [43.651, -79.383], [-36.848, 174.763]]) {
    assert.equal((await worker.fetch(post({ kind: "rez", detail: "klik", city: "x", lat, lon, session: "s1" }), env(db))).status, 204);
    assert.deepEqual(db.rows.at(-1).slice(6, 8), [lat, lon]);
  }
  for (const [lat, lon] of [[91, 181], ["50", "14"], [null, undefined]]) {
    await worker.fetch(post({ kind: "rez", detail: "klik", city: "x", lat, lon, session: "s1" }), env(db));
    assert.deepEqual(db.rows.at(-1).slice(6, 8), [null, null]);
  }
});

// The contact form of the About dialog (POST /contact): a message is kept with its e-mail and cut, a robot's field and an
// empty message are not, one address sends at most five an hour. The fake D1 keeps SQLite's order: each statement runs
// whole, with a delay before it answers (the review of 24. 11. 2026: a read, then a write, let 40 parallel messages pass).
function contactDb({ delay = 0 } = {}) {
  const contacts = [], rate = new Map(), wait = () => new Promise((r) => setTimeout(r, delay));
  return {
    contacts, rate,
    prepare(sql) {
      const exec = (v) => {
        if (/^INSERT INTO contacts/.test(sql)) contacts.push(v);
        else if (/^INSERT INTO contact_rate .* RETURNING n$/.test(sql)) { const r = { hour: v[1], n: (rate.get(v[0])?.n || 0) + 1 }; rate.set(v[0], r); return { n: r.n }; }
        else if (/^DELETE FROM contact_rate WHERE hour < \?$/.test(sql)) { for (const [k, r] of rate) if (r.hour < v[0]) rate.delete(k); }
        else throw new Error(`unknown SQL ${sql}`);
        return null;
      };
      return { bind: (...v) => ({ run: async () => { exec(v); await wait(); }, first: async () => { const r = exec(v); await wait(); return r; } }) };
    },
  };
}
const contactEnv = (db, more = {}) => ({ ...env(db), RATE_SALT: "s", ...more });
const contactPost = (body, ip = "1.2.3.4", origin = "https://barasoukup.github.io") => new Request("https://w.example/contact", { method: "POST", body: JSON.stringify(body), headers: { Origin: origin, "Content-Type": "text/plain", "CF-Connecting-IP": ip } });

test("kontaktní formulář: zpráva se uloží, robot a prázdná zpráva ne, nejvýš pět za hodinu", async () => {
  const db = contactDb(), e = contactEnv(db);
  const cut = "https://barasoukup.github.io/profily-ulic/#rez=50.08,14.42,90,20.0,20.0";
  let r = await worker.fetch(contactPost({ message: " Dobrý den ", email: "a@b.cz", cut, lang: "cs", country: "CZ" }), e);
  assert.equal(r.status, 204);
  assert.equal(r.headers.get("Access-Control-Allow-Origin"), "https://barasoukup.github.io");
  assert.deepEqual(db.contacts[0], ["Dobrý den", "a@b.cz", cut, "cs", "CZ"]);
  // A cut of another site is dropped, the message kept.
  await worker.fetch(contactPost({ message: "x", cut: "https://evil.example/#rez=1,2,3" }), e);
  assert.equal(db.contacts[1][2], null);
  assert.equal((await worker.fetch(contactPost({ message: "spam", website: "http://spam" }), e)).status, 204);
  assert.equal(db.contacts.length, 2, "pole pro roboty");
  assert.equal((await worker.fetch(contactPost({ message: "  " }), e)).status, 400);
  assert.equal((await worker.fetch(contactPost({ message: "x", email: "a@b.cz\r\nBcc: c@d.cz" }), e)).status, 400);
  assert.equal((await worker.fetch(contactPost({ message: "x".repeat(3001) }), e)).status, 413);
  assert.equal((await worker.fetch(contactPost({ message: "x" }, "1.2.3.4", "https://evil.example"), e)).status, 403);
  for (let i = 0; i < 3; i++) assert.equal((await worker.fetch(contactPost({ message: `m${i}` }), e)).status, 204);
  assert.equal((await worker.fetch(contactPost({ message: "šestá" }), e)).status, 429);
  assert.equal((await worker.fetch(contactPost({ message: "jiná adresa" }, "5.6.7.8"), e)).status, 204);
  // The address itself is never kept.
  assert.ok(![...db.rate.keys()].some((k) => k.includes("1.2.3.4")));
});

test("kontaktní formulář: souběžné zprávy limit neobejdou, IPv6 po /64, bez soli nic", async () => {
  const db = contactDb({ delay: 1 }), e = contactEnv(db);
  const codes = await Promise.all(Array.from({ length: 40 }, (_, i) => worker.fetch(contactPost({ message: `m${i}` }), e).then((r) => r.status)));
  assert.equal(db.contacts.length, 5);
  assert.equal(codes.filter((c) => c === 204).length, 5);
  assert.equal(codes.filter((c) => c === 429).length, 35);
  // One /64 is one address, however its last 64 bits are written; another network has its own count.
  const v6 = await Promise.all(Array.from({ length: 20 }, (_, i) => worker.fetch(contactPost({ message: "v6" }, `2001:db8:0:1::${(i + 1).toString(16)}`), e).then((r) => r.status)));
  assert.equal(v6.filter((c) => c === 204).length, 5);
  assert.equal((await worker.fetch(contactPost({ message: "v6" }, "2001:db8:0:2:aa::1"), e)).status, 204);
  // No cap over everyone: a hundred addresses do not switch the form off for the next one.
  for (let i = 0; i < 100; i++) await worker.fetch(contactPost({ message: "x" }, `10.0.${i >> 8}.${i & 255}`), e);
  assert.equal((await worker.fetch(contactPost({ message: "poctivá" }, "9.9.9.9"), e)).status, 204);
  // Without RATE_SALT: not configured, nothing kept, nothing counted.
  const bare = contactDb();
  assert.equal((await worker.fetch(contactPost({ message: "x" }), { ...env(bare) })).status, 503);
  assert.equal(bare.contacts.length + bare.rate.size, 0);
});

test("kontaktní formulář: e-mail nejvýš dvakrát z adresy a desetkrát za hodinu, staré řádky pryč", async () => {
  const W = await import("../logging/worker.js");
  assert.equal(W.rateAddress("2001:DB8:0:1::5"), W.rateAddress("2001:db8:0:1:ffff:1:2:3"));
  assert.notEqual(W.rateAddress("2001:db8:0:1::5"), W.rateAddress("2001:db8:0:2::5"));
  assert.equal(W.rateAddress("::ffff:1.2.3.4"), "1.2.3.4");
  // The cut's link: only our page and a position after #rez=.
  const O = ["https://streetspace.eu", "http://localhost:5173"];
  assert.ok(W.cutOf("https://streetspace.eu/profily/?lang=sk#rez=48.1,17.1,90,20.0,20.0", O));
  assert.ok(W.cutOf("https://streetspace.eu/profily/#rez=48.1,17.1,-90,20.0,20.0,123456789", O), "odkaz s cestou OSM");
  assert.ok(W.cutOf("https://streetspace.eu/profily/#rez=48.1,17.1,-90.4,20.0,20.0,123456789", O), "azimut s desetinou");
  for (const bad of ["https://streetspace.eu/x?<script>#rez=1", "https://streetspace.eu/@evil.example/#rez=1", "http://localhost:5173/#rez=1\r\nBcc: a@b.cz", "https://streetspace.eu.evil.example/#rez=1"]) assert.equal(W.cutOf(bad, O), null, bad);
  // The e-mail: with a binding, the first two of an address, at most ten of everyone (the rest only in D1). Node has no
  // cloudflare:email, so the sending is counted by its attempts (the import fails after the decision).
  const db = contactDb(), sent = [];
  const e = contactEnv(db, { MAIL: { send: async (m) => sent.push(m) }, CONTACT_FROM: "f@x.example", CONTACT_TO: "t@x.example" });
  let tried = 0;
  const warn = console.warn;
  console.warn = () => { tried++; };
  try {
    for (let i = 0; i < 4; i++) await worker.fetch(contactPost({ message: "a" }, "1.1.1.1"), e);
    assert.equal(tried, 2, "dva e-maily z jedné adresy");
    for (let i = 0; i < 20; i++) await worker.fetch(contactPost({ message: "b" }, `10.1.0.${i}`), e);
    assert.equal(tried, 10, "deset e-mailů za hodinu");
  } finally { console.warn = warn; }
  assert.equal(db.contacts.length, 24, "uloží se všechny");
  // The hourly cron trigger deletes the rows of past hours.
  db.rate.set("old", { hour: "2000-01-01T00", n: 3 });
  await worker.scheduled({ scheduledTime: Date.now() }, e);
  assert.ok(!db.rate.has("old") && db.rate.size > 0);
});

test("kontaktní formulář na stránce: bez adresy Workera se nic neposílá", async () => {
  const { sendContact, CONTACT_URL } = await import("../pilot/public/about.js");
  assert.equal(CONTACT_URL, "");
  assert.equal(await sendContact({ message: "x" }), "off");
  assert.equal(await sendContact({ message: "x" }, { url: "https://w.example/contact", fetchFn: async () => new Response(null, { status: 204 }) }), "ok");
  assert.equal(await sendContact({ message: "x" }, { url: "https://w.example/contact", fetchFn: async () => new Response(null, { status: 429 }) }), "limit");
  assert.equal(await sendContact({ message: "x" }, { url: "https://w.example/contact", fetchFn: async () => { throw new Error("down"); } }), "off");
});

test("záznam řezu: poloha ve Španělsku, Francii, Belgii, v Amsterdamu i mimo Evropu se uloží (každá platná poloha)", async () => {
  const db = fakeDb();
  const at = async (lat, lon) => { await worker.fetch(post({ kind: "rez", city: "x", lat, lon, session: "s" }), env(db)); const r = db.rows.pop(); return [r[6], r[7]]; };
  assert.deepEqual(await at(40.4168, -3.7038), [40.4168, -3.7038]); // Madrid
  assert.deepEqual(await at(48.8566, 2.3522), [48.8566, 2.3522]); // Paris
  assert.deepEqual(await at(52.3676, 4.9041), [52.3676, 4.9041]); // Amsterdam
  assert.deepEqual(await at(28.1235, -15.4363), [28.1235, -15.4363]); // Las Palmas
  // Any valid position since 25. 11. 2026 (Washington DC was dropped by the box of the European states).
  assert.deepEqual(await at(38.9, -77.03), [38.9, -77.03]); // Washington
});


// Bára 26. 11. 2026: in Czech and Slovak the author is "Bára Soukupová", in the other languages "Bara Soukup".
test("O aplikaci: autorka česky a slovensky Bára Soukupová, jinde Bara Soukup", async () => {
  const sk = (await import("../pilot/public/sk.js")).default ?? (await import("../pilot/public/sk.js"));
  const en = (await import("../pilot/public/en.js")).default ?? (await import("../pilot/public/en.js"));
  const pick = (m) => Object.values(m).find((v) => v && typeof v === "object" && "Bára Soukupová" in v)?.["Bára Soukupová"];
  assert.equal(pick(sk), "Bára Soukupová");
  assert.equal(pick(en), "Bara Soukup");
});
