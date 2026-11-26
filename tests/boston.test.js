// Boston (Bára 26. 11. 2026): the metro of Boston in the state usa, the surface maps of Boston and Cambridge as static
// tiles of the site (tools/build_planimetrics_us.mjs, towns/boston.js) through the shared adapter, MassGIS's orthophoto,
// Boston's guidelines, the MBTA's vehicles. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import "../pilot/public/america.js";
const read = (f) => JSON.parse(fs.readFileSync(new URL(`../pilot/public/${f}`, import.meta.url), "utf8"));

test("Boston: metro (Suffolk, Middlesex, Norfolk) v USA, město, Cambridge a okolí; Washington beze změny", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(read("mesta.json")); C.loadStates({ ...read("staty.json"), ...read("staty-america.json") }); C.loadTowns(read("mesta-us.json"));
  // City Hall, Dorchester, East Boston; Cambridge, Somerville, Brookline, Newton, Quincy, Lowell; Washington's White House.
  for (const p of [[42.3603, -71.0578], [42.3016, -71.0676], [42.375, -71.039]]) assert.equal(C.cityAt(...p), "boston", `${p}`);
  for (const p of [[42.3736, -71.1097], [42.3876, -71.0995], [42.3318, -71.1212], [42.337, -71.209], [42.2529, -71.0023], [42.6334, -71.3162]]) assert.equal(C.cityAt(...p), "bostonmetro", `${p}`);
  assert.equal(C.cityAt(38.8977, -77.0365), "washington");
  assert.equal(C.countryOfCity("boston").code, "US");
  // Worcester, Providence and Salem (Essex County) are closed, with the message naming the metros (New York is a metro of its own).
  for (const p of [[42.2626, -71.8023], [41.824, -71.4128], [42.5195, -70.8967]]) assert.match(C.closedAt(...p) || "", /Bostonu/, `${p}`);
  // Boston's texts in its metro too (i18n.js TEXT_ALIAS), the guidelines' head.
  C.setCity("bostonmetro");
  assert.match(C.city.rulesHead, /Boston Complete Streets/);
  C.setCity("washington");
  assert.match(C.city.rulesHead, /DDOT/);
  C.setCity("praha");
});

test("Boston: dlaždice map povrchů (oříznutí obdélníkem, zápis a čtení) a pole vrstev stejná v nástroji i v aplikaci", async () => {
  const T = await import("../tools/build_planimetrics_us.mjs");
  const B = await import("../pilot/public/towns/boston.js");
  assert.equal(T.TILE, B.PLAN_TILE);
  for (const [city, layers] of Object.entries(T.CITIES)) for (const [k, l] of Object.entries(layers)) assert.deepEqual(B.PLAN_FIELDS[city][k], l.fields, `${city} ${k}`);
  // A square across a tile's corner, clipped: what lies in the tile.
  const sq = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]];
  assert.deepEqual(T.clipRing(sq, [1, 1, 3, 3]).slice(0, -1).map((p) => p.join()).sort(), ["1,1", "1,2", "2,1", "2,2"]);
  assert.equal(T.clipRing(sq, [5, 5, 6, 6]), null);
  // A polygon with a hole over four tiles: every point's answer by parity as before cutting.
  const x0 = -71.0605, y0 = 42.3595, d = 0.002;
  const outer = [[x0, y0], [x0 + d, y0], [x0 + d, y0 + d], [x0, y0 + d], [x0, y0]], hole = [[x0 + 0.0008, y0 + 0.0008], [x0 + 0.0012, y0 + 0.0008], [x0 + 0.0012, y0 + 0.0012], [x0 + 0.0008, y0 + 0.0012], [x0 + 0.0008, y0 + 0.0008]];
  const tiles = new Map();
  T.tileFeatures([{ attributes: { type: "RD-PAVED" }, geometry: { rings: [outer, hole] } }], ["type"], tiles, "r");
  assert.ok(tiles.size >= 2);
  const { inRings } = await import("../pilot/public/towns/planimetrics.js");
  const feats = [...tiles].flatMap(([k, t]) => { const [ix, iy] = k.split("_").map(Number); return B.decodePlanTile(t.r, ix, iy, ["type"]); });
  assert.ok(feats.every((f) => f.attributes.type === "RD-PAVED"));
  const hit = (x, y) => feats.some((f) => inRings(f.geometry.rings, x, y));
  for (const [x, y, want] of [[x0 + 0.0003, y0 + 0.0003, true], [x0 + 0.0019, y0 + 0.0017, true], [x0 + 0.001, y0 + 0.001, false], [x0 - 0.0002, y0 + 0.001, false], [x0 + 0.0015, y0 + 0.0005, true]])
    assert.equal(hit(x, y), want, `${x},${y}`);
});

const LAT = 42.36, LON = -71.06, KX = 111320 * Math.cos((LAT * Math.PI) / 180), KY = 110574;
const ll = (x, y) => [LON + x / KX, LAT + y / KY];
const esri = (field, list) => ({ features: list.map(([d, x0, x1]) => ({ attributes: { [field]: d }, geometry: { rings: [[[x0, -50], [x1, -50], [x1, 50], [x0, 50], [x0, -50]].map(([x, y]) => ll(x, y))] } })) });
const way = { type: "way", id: 1, tags: { highway: "residential" }, geometry: [ll(0, -60), ll(0, 60)].map(([lon, lat]) => ({ lon, lat })) };
const BBOX = [...ll(-30, -1), ...ll(30, 1)].map((v, i) => v + (i < 2 ? -4e-4 : 4e-4)).join(",");
const codes = (r) => r.features.map((f) => f.attributes.code);

test("Boston a Cambridge: plochy podél řezu (vozovka, chodník, ostrůvek, jamka stromu, vjezd, budova)", async () => {
  const { BOSTON_MAP, CAMBRIDGE_MAP } = await import("../pilot/public/towns/boston.js");
  const { planimetricCut } = await import("../pilot/public/towns/planimetrics.js");
  // Boston: buildings, sidewalks, a median island between two roadways, a traffic island at the side (green).
  const b = planimetricCut(BOSTON_MAP, [esri("part_floors", [["4", -30, -12], ["3", 12, 30]]), esri("x", [["", -12, -7], ["", 7, 12]]),
    esri("type", [["RD-PAVED", -7, 7], ["RD-TRAF-ISLAND", -1, 1]])], [way], BBOX, way.tags, { way });
  assert.deepEqual(codes(b), [401, 601, 702, 701, 9950, 701, 702, 601, 401]);
  // Cambridge: a tree well at the kerb, a driveway beyond the sidewalk.
  const c = planimetricCut(CAMBRIDGE_MAP, [esri("TYPE", [["BLDG", -30, -14]]), esri("TYPE", [["SW-CONCRETE", -12, -5], ["TREE-WELL", -6, -5], ["SW-BRICK", 5, 10]]),
    esri("TYPE", [["RD-PAVED", -5, 5]]), esri("x", [["", 10, 14]]), esri("x", [])], [way], BBOX, way.tags, { way });
  assert.deepEqual(codes(c), [401, 601, 401, 702, 401, 701, 702, 1003, 401]);
});

test("Boston: mapa podle místa (Memorial Drive je Cambridge), domy z počtu podlaží, ortofoto MassGIS", async () => {
  const { bostonHouse, AREAS } = await import("../pilot/public/towns/boston.js");
  const { inArea } = await import("../pilot/public/places.js");
  assert.deepEqual(bostonHouse({ part_floors: "5.0" }), { cornice: 5, roof: 0, total: 5, usHouse: "boston" });
  assert.deepEqual(bostonHouse({ part_floors: "0" }), {});
  // Memorial Drive by the Charles: Cambridge strictly, Boston only within its 30 m.
  const mem = [-71.1035, 42.3685];
  assert.ok(inArea({ ...AREAS.cambridge, near: 0 }, ...mem));
  assert.ok(!inArea({ ...AREAS.boston, near: 0 }, ...mem));
  const { US_ORTHO, usOrthoAt } = await import("../pilot/public/lanes-ortho.js");
  assert.equal(US_ORTHO["us-ma"].town, "bostonmetro");
  assert.deepEqual(usOrthoAt(-71.0578, 42.3603), ["us-ma"]);
  assert.deepEqual(usOrthoAt(-77.0365, 38.8977), ["us-dc"]);
});

test("Boston: pravidla šířek z Boston Complete Streets Guidelines jen v metru Bostonu, ilustrace MBTA", async () => {
  const C = await import("../pilot/public/city.js");
  const US = (await import("../pilot/public/countries/US.js")).default;
  C.setCity("boston");
  assert.match(US.limits({ type: "pruh", width: 2.9 }).why, /Boston Complete Streets/);
  assert.equal(US.limits({ type: "cyklostezka", width: 2 }), null);
  assert.equal(US.limits({ type: "parkovani", orient: "kolme", width: 4 }), null);
  C.setCity("washington");
  assert.match(US.limits({ type: "pruh", width: 2.9 }).why, /DDOT/);
  C.setCity("praha");
  assert.equal(US.art.boston["lamp-post-top"], "lamp-acorn-left");
  assert.equal(US.art.bostonmetro["lamp-post-top"], undefined);
  for (const set of [US.art.boston, US.art.bostonmetro]) {
    assert.equal(set["bus-inbound"], "bus-inbound");
    assert.equal(set["streetcar-inbound"], "tram-inbound");
    assert.equal(set["stop-post-left"], "oznacnik-left");
  }
  for (const f of ["bus-inbound", "tram-inbound", "lamp-acorn-left", "oznacnik-left"]) assert.ok(fs.existsSync(new URL(`../pilot/public/boston/${f}.svg`, import.meta.url)), f);
  // Washington keeps Metrobus and its globe.
  assert.equal(US.art.washington["bus-inbound"], "../washington/bus-inbound");
  assert.equal(US.art.washington["lamp-post-top"], "lamp-globe-left");
});

test("Boston: mezery za vnějším chodníkem podle OSM (dům, parkoviště) a ortofota", async () => {
  const { outerGaps, osmAreasAlong } = await import("../pilot/public/towns/planimetrics.js");
  const { outerGapsByImage } = await import("../pilot/public/ortho-osm.js");
  const R = (...a) => a.map(([code, s, e, gap]) => ({ code, s, e, ...(gap && { gap: true }) }));
  // A tree strip by the kerb (−8…−6) stays green; beyond the sidewalks a house of OSM (−30…−20) and a lot (8…25) take the gaps.
  const runs = R([401, -30, -10, 1], [702, -10, -8], [401, -8, -6, 1], [701, -6, 6], [702, 6, 8], [401, 8, 30, 1]);
  const spans = [{ s: -40, e: -20, code: 601 }, { s: 8, e: 25, code: 1003 }, { s: -7.5, e: -6.5, code: 1003 }];
  const out = outerGaps(runs, spans).map((r) => [r.code, +r.s.toFixed(1), +r.e.toFixed(1), !!r.outer]);
  assert.deepEqual(out, [[601, -30, -20, false], [401, -20, -10, true], [702, -10, -8, false], [401, -8, -6, false], [701, -6, 6, false], [702, 6, 8, false], [704, 8, 25, false], [401, 25, 30, true]]);
  // A house of OSM in a gap by the kerb too (no sidewalk on that side), a lot not.
  assert.deepEqual(outerGaps(R([401, -20, -6, 1], [701, -6, 6]), [{ s: -20, e: -12, code: 601 }, { s: -12, e: -6, code: 1003 }]).map((r) => r.code), [601, 401, 701]);
  // OSM's areas across the cut: a building and a parking lot, not an underground garage.
  const c = { lon0: 0, lat0: 0, kx: 1e5, ky: 1e5, dir: [1, 0] };
  const sq = (x0, x1, tags) => ({ type: "area", tags, geometry: [[x0, -1], [x1, -1], [x1, 1], [x0, 1], [x0, -1]].map(([x, y]) => ({ lon: x / 1e5, lat: y / 1e5 })) });
  const a = osmAreasAlong([sq(10, 20, { building: "yes" }), sq(-15, -5, { amenity: "parking" }), sq(-30, -20, { amenity: "parking", parking: "underground" }), sq(30, 40, { landuse: "grass" })], c);
  assert.deepEqual(a.map((x) => [x.code, Math.round(x.s), Math.round(x.e)]), [[1003, -15, -5], [601, 10, 20]].sort((x, y) => y[0] - x[0]));
  // The orthophoto: a wide grey gap is a lot (704), a narrow one paving, a yellowish (a lawn out of leaf) stays green.
  const nt = 400, nu = 64, res = 0.1, img = (yel, sat) => ({ nt, nu, res, t0: -20, L: new Float32Array(nt * nu).map((_, q) => 120 + (q % 5) * 3), G: new Float32Array(nt * nu), S: new Float32Array(nt * nu).fill(sat), Y: new Float32Array(nt * nu).fill(yel) });
  const rect = (a, b) => ({ code: 401, outerGap: true, rings: [[[a, -1], [b, -1], [b, 1], [a, 1]]] });
  const polys = [rect(-19, -9), rect(2, 9), rect(12, 15)];
  // (dir [0, 1]: the normal is [−1, 0], t = −x.)
  assert.equal(outerGapsByImage(polys, [0, 1], img(2, 6)), 2);
  assert.deepEqual(polys.map((p) => p.code), [704, 1003, 401]);
  const green = [rect(2, 9)];
  assert.equal(outerGapsByImage(green, [0, 1], img(14, 18)), 0);
});
