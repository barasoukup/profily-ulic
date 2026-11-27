// The weekly check of the sources (tools/check_sources.mjs): a real outage fails the run, a place without a map of surfaces
// does not, a slow service is a warning only where the state's first-class checks passed.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { plan, POINTS, runChecks, settle, isBad, watched, answered } from "../tools/check_sources_lib.mjs";
import * as C from "../app/public/city.js";
import { TOWNS } from "../app/public/towns/index.js";

const read = (f) => JSON.parse(fs.readFileSync(new URL(`../app/public/${f}`, import.meta.url)));
const PLAN = plan({ ...C, TOWNS });

test("kontrola zdrojů: každá mapa povrchů má bod, plochy se žádají jen tam", () => {
  for (const p of PLAN) assert.ok(p.at, `${p.id}: ${p.key} nemá bod v POINTS`);
  for (const id of ["luxembourg", "cizina"]) assert.equal(PLAN.find((p) => p.id === id && p.full).surface, false, id);
  for (const id of ["praha", "brno", "cesko", "jihlava", "netherlands", "switzerland"]) assert.equal(PLAN.find((p) => p.id === id && p.full).surface, true, id);
  for (const key of ["wien", "berlin", "paris", "zaragoza"]) assert.ok(PLAN.find((p) => p.key === key)?.surface, key);
  // Kraków's map is off (?krakow=1, Bára 26. 11. 2026): the check does not ask it.
  assert.equal(PLAN.find((p) => p.key === "krakow"), undefined);
  // A new map without a point fails the check.
  assert.equal(plan({ ...C, TOWNS }, { ...POINTS, wien: undefined }).find((p) => p.key === "wien")?.at ?? null, null);
});

test("kontrola zdrojů: bod mapy leží v jejím modulu", () => {
  C.loadBounds(read("towns.json")); C.loadStates(read("states.json")); C.loadSkTowns(read("towns-sk.json"));
  C.loadTowns(read("towns-sk.json")); C.loadTowns(read("towns-at.json"));
  for (const p of PLAN.filter((x) => x.key)) {
    assert.equal(TOWNS[C.cityAt(...p.at)], TOWNS[p.id], p.key);
    const b = TOWNS[p.id].AREAS?.[p.key]?.box;
    if (b) assert.ok(p.at[1] >= b[0] && p.at[1] <= b[2] && p.at[0] >= b[1] && p.at[0] <= b[3], p.key);
  }
});

// The app's sources as fakes asking through a watched fetch whose net answers as the test says: net(host) → "ok", "empty",
// "down" (refused), "slow" (a timeout), "quiet" (500, the source goes on), a list: one a request.
const HOSTS = { osm: "osm.example", mtvu: "map.example", linie: "lines.example", parkovani: "park.example", podlaznost: "houses.example" };
async function run(net, only) {
  const asks = {};
  const fetchIt = watched(async (url) => {
    const h = new URL(url).hostname, n = (asks[h] = (asks[h] || 0) + 1), a = net(h, C.city), s = Array.isArray(a) ? a[Math.min(n, a.length) - 1] : a;
    if (s === "down") throw Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNREFUSED" } });
    if (s === "slow") throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    if (s === "quiet") return new Response("", { status: 500 });
    return Response.json({ features: s === "empty" ? [] : [1, 2] });
  }, "https://site.example/");
  const ask = (k, swallow) => async () => {
    try { const r = await fetchIt(`https://${HOSTS[k]}/q`); return r.ok ? await r.json() : { features: [] }; } catch (err) { if (swallow) return { features: [] }; throw err; }
  };
  const sources = { osm: ask("osm"), mtvu: async () => (C.city.id === "luxembourg" ? { features: [], abroad: true } : ask("mtvu")()),
    linie: ask("linie", true), parkovani: ask("parkovani", true), podlaznost: ask("podlaznost", true), zps: async () => null, zpsZones: async () => [1] };
  answered.clear();
  return settle(await runChecks({ ...C, sources, TOWNS }, { only, pause: 0 }));
}
const failed = (rows) => rows.filter(isBad).map((r) => `${r.city} ${r.name.split(" ")[0]}`);

test("kontrola zdrojů: výpadek shodí běh (odmítnuté spojení, prázdno, tichá chyba, pomalý server ploch)", async () => {
  assert.deepEqual(failed(await run(() => "ok", ["netherlands"])), []);
  for (const how of ["down", "empty", "slow", "quiet"]) assert.deepEqual(failed(await run((h) => (h === "map.example" ? how : "ok"), ["netherlands"])), ["netherlands plochy"], how);
  assert.deepEqual(failed(await run((h) => (h === "osm.example" ? "down" : "ok"), ["netherlands"])), ["netherlands OSM"]);
  // A layer that quietly failed (the source went on without it).
  for (const how of ["down", "quiet"]) assert.deepEqual(failed(await run((h) => (h === "lines.example" ? how : "ok"), ["netherlands"])), ["netherlands linie"], how);
  // Everything slow: nothing first-class passed, so nothing is a mere warning.
  assert.equal(failed(await run(() => "slow", ["netherlands"])).length, 5);
  // One city's map down by timeouts while another city's of the same state answers: still an outage of its host.
  const rows = [{ country: "DE", need: true, state: "CHYBA", slow: true, hosts: ["hamburg.example"] }, { country: "DE", need: true, state: "ok", hosts: [] }];
  assert.equal(settle(rows, new Set(["berlin.example"]))[0].state, "CHYBA");
  assert.equal(settle(rows, new Set(["hamburg.example"]))[0].state, "varování");
});

test("kontrola zdrojů: bez mapy povrchů nic nechybí; pomalá služba je varování, opakovaný dotaz pomůže", async () => {
  const none = await run(() => "ok", ["luxembourg"]);
  assert.deepEqual(failed(none), []);
  const slow = await run((h) => (h === "houses.example" ? "slow" : "ok"), ["netherlands"]);
  assert.deepEqual(failed(slow), []);
  assert.equal(slow.find((r) => r.name.startsWith("budovy")).state, "varování");
  // A refused connection is no slowness.
  assert.deepEqual(failed(await run((h) => (h === "houses.example" ? "down" : "ok"), ["netherlands"])), ["netherlands budovy"]);
  const twice = await run((h) => (h === "map.example" ? ["down", "ok"] : "ok"), ["netherlands"]);
  assert.deepEqual(failed(twice), []);
  assert.match(twice.find((r) => r.name.startsWith("plochy")).note, /až napodruhé/);
});

test("kontrola zdrojů: config.js jen čte, STATIC v něm jde přepnout", () => {
  const src = fs.readFileSync(new URL("../app/public/config.js", import.meta.url), "utf8");
  assert.equal(src.match(/export const STATIC = [^;]*;/g)?.length, 1);
});
