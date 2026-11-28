// Belgium and Luxembourg (Bára 20. 11. 2026): the regions' lines for the kerbs (towns/belgium.js), the states by their
// borders, the signs, norms and parking laws. No network.
import { test } from "node:test";
import assert from "node:assert/strict";

test("Belgie: čáry GRB a PICC jako kandidáti obrub, vypínač ?hrany=0", async () => {
  const B = await import("../app/public/towns/belgium.js");
  const grb = B.grbPaths({ features: [
    { properties: { LBLTYPE: "rand van de rijbaan (wrb)" }, geometry: { type: "LineString", coordinates: [[3.72, 51.05], [3.721, 51.05]] } },
    { properties: { LBLTYPE: "grens zone zwakke weggebruiker (wcz)" }, geometry: { type: "MultiLineString", coordinates: [[[3.72, 51.051], [3.721, 51.051]]] } },
    { properties: { LBLTYPE: "iets anders" }, geometry: { type: "LineString", coordinates: [[3.72, 51.052], [3.721, 51.052]] } },
  ] });
  assert.equal(grb.length, 2);
  const picc = B.piccPaths({ features: [
    { attributes: { NATUR_DESC: "Trottoir" }, geometry: { paths: [[[5.57, 50.64], [5.571, 50.64]]] } },
    { attributes: { NATUR_DESC: "Rigole" }, geometry: { paths: [[[5.57, 50.641], [5.571, 50.641]]] } },
    { attributes: { NATUR_DESC: "Passage piéton" }, geometry: { paths: [[[5.57, 50.642], [5.571, 50.642]]] } },
  ] });
  assert.equal(picc.length, 1, "jen okraje částí ulice, ne strouha ani přechod");
  globalThis.PROFILY_BE = { hrany: "0" };
  try { assert.deepEqual((await B.sources.lines("5.57,50.64,5.58,50.65")).edges, []); } finally { delete globalThis.PROFILY_BE; }
});

test("Belgie: plochy GRB z WBN a čar WGO podél řezu, vypínač ?wbn=0", async () => {
  const B = await import("../app/public/towns/belgium.js");
  // A street 20 m from facade to facade along y: sidewalks 3 m (wcz at x = ±7), a parking strip 2 m on the left (wrb at
  // x = -5), the roadway between; OSM's road along the middle; the cut 30 m along x.
  const lat0 = 51.05, lon0 = 3.72, kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110574, pad = 0.0004;
  const ll = ([x, y]) => [lon0 + x / kx, lat0 + y / ky];
  const line = (x, label, y0 = -20, y1 = 20) => ({ properties: { LBLTYPE: label }, geometry: { type: "LineString", coordinates: [[x, y0], [x, y1]].map(ll) } });
  const wbn = { features: [{ properties: { TYPE: 2 }, geometry: { type: "Polygon", coordinates: [[[-10, -20], [10, -20], [10, 20], [-10, 20], [-10, -20]].map(ll)] } }] };
  const wgo = { features: [line(-7, "grens zone zwakke weggebruiker (wcz)"), line(7, "grens zone zwakke weggebruiker (wcz)"), line(-5, "rand van de rijbaan (wrb)", -20, 3)] };
  const osm = [{ type: "way", tags: { highway: "residential" }, geometry: [[0, -20], [0, 20]].map(ll).map(([lon, lat]) => ({ lon, lat })) }];
  const bbox = [lon0 - 15 / kx - pad, lat0 - pad, lon0 + 15 / kx + pad, lat0 + pad].join(",");
  const codes = (o) => o.features.map((f) => [f.attributes.code, +((f.geometry.rings[0][1][0] - f.geometry.rings[0][0][0]) * kx).toFixed(2)]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  assert.deepEqual(codes(B.grbSurfaces(wbn, wgo, osm, bbox)), [[701, 5], [701, 7], [702, 3], [702, 3], [704, 2]]);
  // A gap in the line where the cut crosses: across the wrb's gap the roadway runs on to the kerb.
  const gap = { features: [...wgo.features.slice(0, 2), line(-5, "rand van de rijbaan (wrb)", 2, 20)] };
  assert.deepEqual(codes(B.grbSurfaces(wbn, gap, osm, bbox)), [[701, 7], [701, 7], [702, 3], [702, 3]]);
  // A level street (no kerb on one side), a footway, a cut outside WBN: none (the estimate).
  assert.equal(B.grbSurfaces(wbn, { features: [wgo.features[0], line(5, "rand van de rijbaan (wrb)")] }, osm, bbox), null);
  assert.equal(B.grbSurfaces(wbn, wgo, osm, bbox, { highway: "footway" }), null);
  assert.equal(B.grbSurfaces({ features: [] }, wgo, osm, bbox), null);
  // A street of two carriageways cut in the middle of its kerbed median (the review of 24. 11. 2026): a corridor 24 m,
  // the median's kerbs at ±1.5 m, the outer kerbs at ±9 m, OSM's two one-way roads at ±5 m. Read from the road OSM draws,
  // not from the median as "road": the median and the sidewalks walked on, the carriageways roads (before: inverted).
  const wide = { features: [{ properties: { TYPE: 2 }, geometry: { type: "Polygon", coordinates: [[[-12, -20], [12, -20], [12, 20], [-12, 20], [-12, -20]].map(ll)] } }] };
  const kerb = "grens zone zwakke weggebruiker (wcz)";
  const dual = { features: [line(-9, kerb), line(-1.5, kerb), line(1.5, kerb), line(9, kerb)] };
  const ways = [5, -5].map((x) => ({ type: "way", tags: { highway: "secondary", oneway: "yes" }, geometry: [[x, -20], [x, 20]].map(ll).map(([lon, lat]) => ({ lon, lat })) }));
  const wideBox = [lon0 - 12 / kx - pad, lat0 - pad, lon0 + 12 / kx + pad, lat0 + pad].join(",");
  const got = B.grbSurfaces(wide, dual, ways, wideBox);
  const parts = got.features.map((f) => { const xs = f.geometry.rings[0].map(([lon]) => (lon - lon0) * kx); return { a: Math.min(...xs), b: Math.max(...xs), code: f.attributes.code }; });
  const codeAt = (x) => parts.find((p) => p.a <= x && x <= p.b)?.code;
  assert.deepEqual([-10.5, -5, -3, 0, 3, 5, 10.5].map(codeAt), [702, 701, 701, 702, 701, 701, 702]);
  assert.deepEqual(codes(got), [[701, 3.5], [701, 4], [701, 7.5], [702, 3], [702, 3], [702, 3]]);
  // Without OSM's roads off the centre (a street of one carriageway cut on its axis) the reading stays at the centre.
  const one = B.grbSurfaces(wbn, wgo, osm, bbox, null);
  assert.deepEqual(codes(one), [[701, 5], [701, 7], [702, 3], [702, 3], [704, 2]]);
  globalThis.PROFILY_BE = { wbn: "0" };
  try { assert.equal((await B.sources.surfaces("3.72,51.05,3.721,51.051")).abroad, true); } finally { delete globalThis.PROFILY_BE; }
});

test("Belgie: region podle hranic NUTS 1 (ortofoto a čáry jen svého regionu)", async () => {
  const { beRegionsAt } = await import("../app/public/lanes-ortho.js");
  assert.equal((await beRegionsAt(3.7174, 51.0543))[0], "vl"); // Ghent
  assert.equal((await beRegionsAt(5.5797, 50.6326))[0], "wal"); // Liège
  assert.equal((await beRegionsAt(4.3525, 50.8467))[0], "bru"); // Brussels
});

test("Belgie a Lucembursko: značky, normy, zákon o stání", async () => {
  const { default: BE } = await import("../app/public/countries/BE.js");
  const { default: LU } = await import("../app/public/countries/LU.js");
  assert.equal(BE.signs.file({ k: "oneway" }, { dir: "forward" }), "F19");
  assert.equal(BE.signs.file({ k: "oneway" }, { dir: "backward" }), "C1");
  assert.equal(BE.signs.file({ k: "b20a", v: 30 }), "C43_30");
  assert.equal(BE.signs.file({ k: "b20a", v: 40 }), null);
  assert.equal(BE.signs.file({ k: "ztp" }), null, "E9 s tabulkou ZTP není nakreslená");
  assert.equal(LU.signs.file({ k: "oneway" }, { dir: "forward" }), "E_13a");
  assert.equal(LU.signs.file({ k: "b20a", v: 30 }), null, "lucemburská 30 jako SVG chybí");
  assert.equal(LU.signs.label({ k: "c9a" }, true, "x"), "D,5b x");
  assert.equal(BE.limits({ type: "chodnik" }, [], 0).min, 1.5);
  assert.equal(LU.limits({ type: "chodnik" }, [], 0).zaklad, 2);
  assert.equal(BE.limits({ type: "pruh" }, [{ type: "pruh" }], 0), null, "zdroj jen pro hlavní silnice Flander: bez varování");
  assert.equal(BE.limits({ type: "cyklostezka" }).min, 1.3);
  assert.equal(BE.limits({ type: "parkovani", orient: "podelne" }), null);
  assert.equal(LU.limits({ type: "cyklostezka" }).min, 1.2);
  assert.equal(LU.parkGuess, true, "Bára 21. 11. 2026: bez obecné šířky se smí stát skoro všude");
  assert.equal(BE.lawNeed(true, 1, 2.5), 3);
});
