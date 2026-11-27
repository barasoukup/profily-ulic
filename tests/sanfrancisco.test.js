// San Francisco (Bára 26. 11. 2026): the city in the state "usa", its surface map put together from the right of way, the
// kerbs and the buildings (towns/sanfrancisco.js through towns/planimetrics.js), the digital curb's parking. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import "../app/public/america.js";
const read = (f) => JSON.parse(fs.readFileSync(new URL(`../app/public/${f}`, import.meta.url), "utf8"));

test("San Francisco: město ve státě USA, okolí zůstává zavřené", async () => {
  const C = await import("../app/public/city.js");
  C.loadBounds(read("towns.json")); C.loadStates({ ...read("states.json"), ...read("states-america.json") }); C.loadTowns(read("towns-us.json"));
  // Market Street, the Ferry Building, the Mission, Treasure Island; Washington stays itself.
  for (const p of [[37.7848, -122.4071], [37.7955, -122.3937], [37.7599, -122.4148], [37.8235, -122.3706]]) assert.equal(C.cityAt(...p), "sanfrancisco", `${p}`);
  assert.equal(C.cityAt(38.8977, -77.0365), "washington");
  assert.equal(C.countryOfCity("sanfrancisco").code, "US");
  // Daly City, Oakland, Sausalito, Berkeley: the closed USA, its message names San Francisco.
  for (const p of [[37.6879, -122.4702], [37.8044, -122.2712], [37.8591, -122.4853], [37.8715, -122.273]]) assert.match(C.closedAt(...p) || "", /San Francisco/, `${p}`);
  assert.equal(C.cityById("sanfrancisco").art, "sanfrancisco");
});

const LAT = 37.76, LON = -122.415, KX = 111320 * Math.cos((LAT * Math.PI) / 180), KY = 110574;
const ll = (x, y) => [LON + x / KX, LAT + y / KY];
const poly = (list, attrs = {}) => ({ features: list.map(([x0, x1]) => ({ attributes: attrs, geometry: { rings: [[[x0, -50], [x1, -50], [x1, 50], [x0, 50], [x0, -50]].map(([x, y]) => ll(x, y))] } })) });
const lines = (list) => ({ features: list.map(([x, a]) => ({ attributes: a, geometry: { paths: [[ll(x, -50), ll(x, 50)]] } })) });
const way = { type: "way", id: 1, tags: { highway: "residential" }, geometry: [ll(0, -60), ll(0, 60)].map(([lon, lat]) => ({ lon, lat })) };
const BBOX = [...ll(-30, -1), ...ll(30, 1)].map((v, i) => v + (i < 2 ? -4e-4 : 4e-4)).join(",");
// (The cut reaches beyond the buildings: the green at its ends left out.)
const codes = (r) => { const c = r.features.map((f) => f.attributes.code); while (c[0] === 401) c.shift(); while (c.at(-1) === 401) c.pop(); return c; };

test("San Francisco: vozovka mezi obrubami v uličním prostoru, chodníky k jeho hranici, ostrůvek, domy posunuté o 1,4 m", async () => {
  const { SF_MAP, sodaAsEsri } = await import("../app/public/towns/sanfrancisco.js");
  const { planimetricCut } = await import("../app/public/towns/planimetrics.js");
  // Right of way −12…13, kerbs at −7.2 and 8.7; buildings −35…−13.4 (a gap of 1.4 m) and 11.3…28 (1.7 m into the street).
  const row = poly([[-12, 13]]), bldg = poly([[-35, -13.4], [11.3, 28]]), kerbs = lines([[-7.2, { CBB_TYPE: "BLK" }], [8.7, { CBB_TYPE: "BLK" }]]);
  const cut = (b, r, k, extra) => planimetricCut(SF_MAP, [b, r, k], [way], BBOX, way.tags, { way, extra });
  assert.deepEqual(codes(cut(bldg, row, kerbs)), [601, 702, 701, 702, 601]);
  // A median: four kerbs (two of an island).
  const island = lines([[-7.2, {}], [-1, { CBB_TYPE: "ISL" }], [1, { CBB_TYPE: "ISL" }], [8.7, {}]]);
  assert.deepEqual(codes(cut(bldg, row, island)), [601, 702, 701, 9950, 701, 702, 601]);
  // Fewer than two kerbs: no roadway under a street for cars, no map (the estimate).
  assert.equal(cut(bldg, row, lines([[-7.2, {}]])), null);
  // The digital curb: parking on the side whose zone allows it, none on the other; both sides known, so no estimate.
  const zone = (x, cat, n = 10, len = 200) => [x, { POLICY_CATEGORY: cat, NUM_SPACES: n, LENGTH_FT: len }];
  const r = cut(bldg, row, kerbs, lines([zone(-7.2, "General Parking"), zone(8.7, "No Parking Anytime", 0)]));
  assert.deepEqual(codes(r), [601, 702, 704, 701, 702, 601]);
  assert.equal(r.noParkGuess, true);
  // Angled: three stalls or more in less than 14 ft each.
  const a = cut(bldg, row, kerbs, lines([zone(-7.2, "General Parking", 20, 200)]));
  assert.ok(!a.noParkGuess);
  assert.deepEqual(codes(a), [601, 702, 704, 701, 702, 601]);
  // A SODA answer as ArcGIS's, full at the limit.
  assert.deepEqual(sodaAsEsri({ features: [{ properties: { a: 1 }, geometry: { type: "MultiPolygon", coordinates: [[[[0, 0], [1, 0], [0, 1], [0, 0]]]] } }] }).features[0].geometry.rings.length, 1);
});

test("San Francisco: domy podle výšky obrysu, vlastní normy chodníku", async () => {
  const { sfHouse } = await import("../app/public/towns/sanfrancisco.js");
  assert.deepEqual(sfHouse({ hgt_median_m: "12.1" }), { cornice: 3, roof: 0, total: 3, fromHeight: true, hm: 12.1, sfHouse: true });
  assert.deepEqual(sfHouse({}), {});
  const C = await import("../app/public/city.js");
  const US = (await import("../app/public/countries/US.js")).default;
  C.setCity("sanfrancisco");
  assert.match(US.limits({ type: "chodnik", width: 2 }).why, /SFMTA/);
  assert.equal(US.limits({ type: "pruh", width: 3 }), null);
  C.setCity("washington");
  assert.match(US.limits({ type: "chodnik", width: 2 }).why, /DDOT/);
});

test("San Francisco: šikmé a kolmé stání podle OSM, kde ho obruba nepozná; osa ve vykrojeném stání", async () => {
  const { SF_MAP } = await import("../app/public/towns/sanfrancisco.js");
  const { planimetricCut } = await import("../app/public/towns/planimetrics.js");
  const row = poly([[-12, 13]]), bldg = poly([[-35, -13.4], [11.3, 28]]), kerbs = lines([[-7.2, { CBB_TYPE: "BLK" }], [8.7, { CBB_TYPE: "BLK" }]]);
  const zone = (x, n = 10, len = 200) => [x, { POLICY_CATEGORY: "General Parking", NUM_SPACES: n, LENGTH_FT: len }];
  const zones = lines([zone(-7.2), zone(8.7)]);
  globalThis.PROFILY_US = { sfosmpark: "1" };
  const cut = (tags) => { const w = { ...way, tags }; return planimetricCut(SF_MAP, [bldg, row, kerbs], [w], BBOX, tags, { way: w, extra: zones }); };
  const parks = (r) => r.features.filter((f) => f.attributes.code === 704).map((f) => f.attributes.ORIENT || "-");
  // The curb's zones are long ones (20 ft a stall): parallel on both sides, unless OSM says angled or perpendicular there.
  assert.deepEqual(parks(cut({ highway: "residential" })), ["-", "-"]);
  const both = parks(cut({ highway: "residential", "parking:left:orientation": "diagonal", "parking:left": "lane", "parking:lane:right": "perpendicular" }));
  assert.deepEqual([...both].sort(), ["kolme", "sikme"]);
  // (The way runs north: its right is the east kerb.)
  const east = cut({ highway: "residential", "parking:lane:right": "perpendicular" }).features.filter((f) => f.attributes.code === 704).map((f) => [f.attributes.ORIENT || "-", f.geometry.rings[0][0][0] > LON]);
  assert.deepEqual(east.sort(), [["-", false], ["kolme", true]]);
  globalThis.PROFILY_US = {};
  assert.deepEqual(parks(cut({ highway: "residential", "parking:lane:right": "perpendicular" })), ["-", "-"]);
  delete globalThis.PROFILY_US;
});

test("San Francisco: výpadek pravidel obrub (SFMTA 56) se hlásí, oříznutá odpověď je výpadek", async () => {
  const { SF_MAP, zonesAnswer } = await import("../app/public/towns/sanfrancisco.js");
  const { planimetricCut } = await import("../app/public/towns/planimetrics.js");
  const row = poly([[-12, 13]]), bldg = poly([[-35, -13.4], [11.3, 28]]), kerbs = lines([[-7.2, { CBB_TYPE: "BLK" }], [8.7, { CBB_TYPE: "BLK" }]]);
  const cut = (extra) => planimetricCut(SF_MAP, [bldg, row, kerbs], [way], BBOX, way.tags, { way, extra });
  // null: the zones did not answer; undefined: ?sfcurb=0 (nothing said).
  assert.equal(cut(null).sfCurbFailed, true);
  assert.equal(cut(undefined).sfCurbFailed, undefined);
  assert.throws(() => zonesAnswer({ features: [], exceededTransferLimit: true }), /exceededTransferLimit/);
  assert.deepEqual(zonesAnswer({ features: [] }), { features: [] });
});

test("San Francisco: chodník podle typu ulice (ulička 6 ft, jiná obslužná bez varování), citace Better Streets Plan v datech SFMTA", async () => {
  const C = await import("../app/public/city.js");
  C.loadBounds(read("towns.json")); C.loadStates({ ...read("states.json"), ...read("states-america.json") }); C.loadTowns(read("towns-us.json"));
  const US = (await import("../app/public/countries/US.js")).default;
  const sf = C.cityById("sanfrancisco"), walk = { type: "chodnik", width: 2 };
  const street = US.limits(walk, [walk], 0, sf);
  assert.equal(street.zaklad, 3.05);
  assert.match(street.why, /Better Streets Plan.*Sidewalk Widths 2014.*AECOM.*SFMTA/);
  const alley = US.limits(walk, [walk], 0, sf, { kind: "alley" });
  assert.equal(alley.zaklad, 1.83);
  assert.equal(US.limits(walk, [walk], 0, sf, { kind: "service" }), null);
  // Through the rules of the Design: an alley's 2 m sidewalk is not narrower than its basic width.
  C.setCity("sanfrancisco");
  const { checkRules } = await import("../app/public/rules.js");
  const p = { segments: [{ type: "chodnik", width: 2 }, { type: "pruh", width: 3 }, { type: "chodnik", width: 2 }] };
  assert.equal(checkRules(p).filter((w) => w.why.includes("Better Streets")).length, 2);
  assert.equal(checkRules(p, { kind: "alley" }).filter((w) => w.why.includes("Better Streets")).length, 0);
  C.setCity("praha");
});
