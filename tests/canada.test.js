// Canada (Bára 25. 11. 2026): Toronto and its surroundings, the city's topographic mapping through the shared adapter
// (countries/CA.js, towns/canada.js, towns/planimetrics.js). No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import "../app/public/america.js";
const read = (f) => JSON.parse(fs.readFileSync(new URL(`../app/public/${f}`, import.meta.url), "utf8"));

test("Kanada: hranice Toronta a zavřené Kanady jsou malé (stáhnou se při prvním řezu v Americe)", () => {
  const staty = { ...read("states.json"), ...read("states-america.json") };
  assert.ok(JSON.stringify(staty.canada).length < 10_000);
  assert.ok(JSON.stringify(staty.closed_ca).length < 150_000);
});

const LAT = 43.66, LON = -79.4, KX = 111320 * Math.cos((LAT * Math.PI) / 180), KY = 110574;
const ll = (x, y) => [LON + x / KX, LAT + y / KY];
const esri = (list) => ({ features: list.map(([d, x0, x1]) => ({ attributes: { SUBTYPE_DESC: d }, geometry: { rings: [[[x0, -50], [x1, -50], [x1, 50], [x0, 50], [x0, -50]].map(([x, y]) => ll(x, y))] } })) });
const way = { type: "way", id: 1, tags: { highway: "residential" }, geometry: [ll(0, -60), ll(0, 60)].map(([lon, lat]) => ({ lon, lat })) };
const tram = (x) => ({ type: "way", id: 10 + x, tags: { railway: "tram" }, geometry: [ll(x, -60), ll(x, 60)].map(([lon, lat]) => ({ lon, lat })) });
const BBOX = [...ll(-30, -1), ...ll(30, 1)].map((v, i) => v + (i < 2 ? -4e-4 : 4e-4)).join(",");
const codes = (r) => r.features.map((f) => f.attributes.code);

test("Toronto: plochy podél řezu, mezera mezi vozovkami je dělicí pás nebo těleso tramvaje, zálivy u obruby", async () => {
  const { TORONTO_MAP } = await import("../app/public/towns/canada.js");
  const { planimetricCut } = await import("../app/public/towns/planimetrics.js");
  const cut = (b, s, r, p, osm = [way], tags = way.tags) => planimetricCut(TORONTO_MAP, [esri(b), esri(s), esri(r), esri(p)], osm, BBOX, tags, { way });
  const side = cut([["Building Outline", -20, -12], ["Miscellaneous Structure", 12, 14]], [["Sidewalk", -8, -6], ["Sidewalk", 6, 8]], [["Road Edge", -4.2, 4.2]], []);
  assert.deepEqual(codes(side), [401, 601, 401, 702, 401, 701, 401, 702, 401]);
  assert.equal(side.junction, false);
  assert.equal(cut([], [], [["Intersection", -5, 5]], []).junction, true);
  const two = [["Road Edge", -12, -5], ["Road Edge", 5, 12]];
  assert.deepEqual(codes(cut([], [], two, [])), [401, 701, 9950, 701, 401]);
  assert.deepEqual(codes(cut([], [], two, [], [way, tram(-1.6), tram(1.6)])), [401, 701, 9950, 705, 9950, 701, 401]);
  assert.deepEqual(codes(cut([], [["Sidewalk", 7, 10]], [["Road Edge", -5, 5]], [["Parking Lot", 5, 7]])), [401, 701, 704, 702, 401]);
  assert.deepEqual(codes(cut([], [], [["Road Edge", -5, 5]], [["Parking Lot", 5, 20]])), [401, 701, 1003, 401]);
  // A cycle track OSM has as a way of its own in the map's carriageway (not one on the sidewalk, nor a crossing).
  const track = (x, tags = {}) => ({ type: "way", id: 90, tags: { highway: "cycleway", oneway: "yes", ...tags }, geometry: [ll(x, -60), ll(x, 60)].map(([lon, lat]) => ({ lon, lat })) });
  assert.deepEqual(codes(cut([], [], [["Road Edge", -6, 6]], [], [way, track(5)])), [401, 701, 703, 401]);
  assert.deepEqual(codes(cut([], [["Sidewalk", 6, 9]], [["Road Edge", -6, 6]], [], [way, track(7)])), [401, 701, 702, 401]);
  assert.deepEqual(codes(cut([], [], [["Road Edge", -6, 6]], [], [way, track(5, { cycleway: "crossing" })])), [401, 701, 401]);
  // A laneway is the roadway only of a cut across one; a yard alone is no street.
  assert.ok(codes(cut([], [], [["Lane Edge", -2, 2]], [], [way], { highway: "service" })).includes(701));
  assert.equal(cut([], [], [["Road Edge", 10, 18]], []), null);
});

test("Toronto: domy podle výšky obrysu", async () => {
  const { torontoHouse, floorsOf } = await import("../app/public/towns/canada.js");
  assert.deepEqual([5, 6.5, 8, 11, 40].map((h) => floorsOf(h)), [1, 2, 2, 3, 12]);
  assert.deepEqual(torontoHouse({ SUBTYPE_DESC: "Garage", DERIVED_HEIGHT: 3 }), { type: "garage", garage: true, caHouse: true });
  assert.equal(torontoHouse({ SUBTYPE_DESC: "Building Outline", DERIVED_HEIGHT: 8 }).fromHeight, true);
  assert.deepEqual(torontoHouse(null), {});
});

test("Severní Amerika se načítá, až když tam řez nebo mapa je (late.js)", async () => {
  const L = await import("../app/public/late.js");
  const staty = read("states.json"), far = read("states-america.json");
  assert.deepEqual(Object.keys(far).sort(), ["canada", "closed_ca", "closed_us", "usa"]);
  assert.ok(!Object.keys(staty).some((id) => id in far));
  // Every place of America is in the box (Alaska's islands beyond 170° W aside), none of Europe's.
  for (const rings of Object.values(far)) for (const [x, y] of rings.flat()) assert.ok(L.isLate(y, x) || x < -169 || x > 170, `${x},${y}`);
  for (const [id, rings] of Object.entries(staty)) for (const [x, y] of rings.flat()) assert.ok(!L.isLate(y, x), `${id} ${x},${y}`);
  // No module of the app's start imports America's.
  const dir = new URL("../app/public/", import.meta.url), seen = new Set();
  const walk = (u) => { if (seen.has(u.href)) return; seen.add(u.href); for (const m of fs.readFileSync(u, "utf8").matchAll(/^\s*(?:import|export)\b[^;'"]*?["'](\.[^"']+\.js)["']/gm)) walk(new URL(m[1], u)); };
  walk(new URL("app.js", dir));
  for (const f of ["america.js", "countries/US.js", "countries/CA.js", "towns/usa.js", "towns/canada.js", "towns/planimetrics.js", "houses-america.js", "house-looks-america.js"]) assert.ok(!seen.has(new URL(f, dir).href), f);
  // A failed load is asked again, a loaded one not.
  const native = globalThis.fetch;
  let asked = 0;
  globalThis.fetch = async (f) => { asked++; if (asked <= 3) throw new Error("offline"); return { ok: true, json: async () => read(f) }; };
  try {
    await L.ensurePlace(50, 14);
    assert.equal(asked, 0);
    await assert.rejects(L.ensurePlace(43.65, -79.38));
    assert.equal(L.lateReady(43.65, -79.38), false);
    await L.ensurePlace(43.65, -79.38);
    await L.ensurePlace(38.9, -77);
    assert.equal(asked, 6);
    assert.equal(L.lateReady(38.9, -77), true);
  } finally { globalThis.fetch = native; }
});

test("Toronto: koleje v tunelu nejsou na povrchu, cyklostezka jako tag silnice u obruby, ulička vedle parkoviště", async () => {
  const { TORONTO_MAP } = await import("../app/public/towns/canada.js");
  const { planimetricCut } = await import("../app/public/towns/planimetrics.js");
  const cut = (b, s, r, p, osm = [way], w = way) => planimetricCut(TORONTO_MAP, [esri(b), esri(s), esri(r), esri(p)], osm, BBOX, w.tags, { way: w });
  const two = [["Road Edge", -12, -5], ["Road Edge", 5, 12]], under = { ...tram(0), tags: { railway: "tram", tunnel: "yes", layer: "-1" } };
  assert.deepEqual(codes(cut([], [], two, [], [way, under])), [401, 701, 9950, 701, 401]);
  const tagged = { ...way, tags: { highway: "primary", "cycleway:right": "track" } };
  // BBOX's dir points east, the way runs north: its right is the east side.
  assert.deepEqual(codes(cut([], [], [["Road Edge", -8, 8]], [], [tagged], tagged)), [401, 701, 703, 401]);
  // The cut stands in the median beside a bed (The Queensway).
  assert.ok(cut([], [], [["Road Edge", -21, -10.5], ["Road Edge", 10.6, 21.7]], [], [way, tram(-9.5), tram(-6.6)]));
  const lane = { ...way, tags: { highway: "service" } };
  assert.deepEqual(codes(cut([], [], [["Lane Edge", -2, 2]], [["Parking Lot", 2, 22]], [lane], lane)), [401, 701, 1003, 401]);
});
