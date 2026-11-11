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
  assert.deepEqual(db.rows[0], ["rez", "klik", "most", "tř. Budovatelů", "secondary", 46195319, 50.4998439, 13.6384523, 25, 22, 37.6, "s1", null]);
  assert.equal((await worker.fetch(post(cut, "https://evil.example"), env(db))).status, 403);
  assert.equal((await worker.fetch(post({ ...cut, kind: "x" }), env(db))).status, 400);
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
