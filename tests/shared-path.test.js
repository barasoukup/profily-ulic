import { test } from "node:test";
import assert from "node:assert/strict";
import { localFrame, deriveProfile, mtvuPolygons } from "../app/public/derive.js";

// A street running north (x = 0, roadway 7 m) with a sidewalk strip (MTVU 702, 3 m) on the east side where an OSM path runs
// (Brandenburger Straße, Leipzig, 27. 11. 2026: a shared path one way for cyclists drew two cycle tracks).
function east(pathTags, pathReversed = false, code = 702, widths = false) {
  const frame = localFrame(51.35, 12.39);
  const rect = (x0, x1, code) => ({ attributes: { CTVUK_KOD: code }, geometry: { rings: [[[x0, -60], [x1, -60], [x1, 60], [x0, 60], [x0, -60]].map(([x, y]) => frame.toLonLat(x, y))] } });
  const polys = mtvuPolygons({ features: [rect(-6.5, -3.5, 702), rect(-3.5, 3.5, 701), rect(3.5, 6.5, code)] }, frame);
  const line = (x, rev) => { const g = [frame.toLonLat(x, -100), frame.toLonLat(x, 100)].map(([lon, lat]) => ({ lat, lon })); return rev ? g.reverse() : g; };
  const els = [{ type: "way", id: 1, tags: { highway: "residential", lanes: "2" }, geometry: line(0) }, { type: "way", id: 2, tags: pathTags, geometry: line(5, pathReversed) }];
  const r = deriveProfile({ center: [0, 0], dir: [0, 1], half: 40, polys, osm: { elements: els }, frame, way: els[0], noParkGuess: true });
  if (widths) return r.segments.slice(-2).map((s) => `${s.type} ${+s.width.toFixed(1)}`);
  return r.segments.map((s) => s.type + (s.dir ? (s.dir === "forward" ? ">" : "<") : ""));
}

test("sdílená cesta: jeden díl, směr kol podle oneway:bicycle", () => {
  const shared = { highway: "path", bicycle: "designated", foot: "designated", segregated: "no", path: "sidewalk" };
  assert.deepEqual(east({ ...shared, "oneway:bicycle": "yes" }).at(-1), "stezka_sdilena>");
  assert.deepEqual(east({ ...shared, "oneway:bicycle": "yes" }, true).at(-1), "stezka_sdilena<");
  assert.deepEqual(east({ ...shared, "oneway:bicycle": "-1" }).at(-1), "stezka_sdilena<");
  assert.deepEqual(east({ ...shared, oneway: "no" }).at(-1), "stezka_sdilena");
});

test("segregated=yes: stezka a chodník vedle sebe; obousměrná cycleway beze změny", () => {
  const seg = east({ highway: "path", bicycle: "designated", foot: "designated", segregated: "yes" }).slice(-2);
  assert.deepEqual(seg.sort(), ["chodnik", "cyklostezka"]);
  const two = east({ highway: "cycleway", oneway: "no" }, false, 703).slice(-2);
  assert.deepEqual(two, ["cyklostezka<", "cyklostezka>"]);
});

test("segregated=yes: šířka cyklostezky z cycleway:width (nebo footway:width), jinak napůl (27. 11. 2026)", () => {
  const seg = { highway: "path", bicycle: "designated", foot: "designated", segregated: "yes" };
  const w = (tags) => east({ ...seg, ...tags }, false, 702, true).sort();
  assert.deepEqual(w({}), ["chodnik 1.5", "cyklostezka 1.5"]);
  assert.deepEqual(w({ "cycleway:width": "1.8" }), ["chodnik 1.3", "cyklostezka 1.8"]);
  assert.deepEqual(w({ "footway:width": "2" }), ["chodnik 2", "cyklostezka 1.1"]);
  assert.deepEqual(w({ "cycleway:width": "2,9" }), ["chodnik 1.5", "cyklostezka 1.5"], "druhá půlka by byla pod 0,9 m: napůl");
});

// The estimate from the orthophoto and OSM (ortho-osm.js): a path beside the street, shared by walkers and cyclists, is a part like a sidewalk (702;
// derive.js makes C 9 of it); one with segregated=yes stays a cycle track (703) as before.
import { orthoOsmPolys } from "../app/public/ortho-osm.js";
test("odhad z ortofota a OSM: sdílená cesta je chodníkový díl, segregated=yes zůstává cyklostezka", () => {
  const frame = localFrame(50.08, 14.43), dir = [0, 1];
  const ll = (x, y) => { const [lon, lat] = frame.toLonLat(x, y); return { lon, lat }; };
  const t0 = -25, nt = 500, nu = 400, L = new Float32Array(nt * nu), G = new Float32Array(nt * nu), S = new Float32Array(nt * nu).fill(8);
  for (let j = 0; j < nu; j++) for (let i = 0; i < nt; i++) L[j * nt + i] = (Math.abs(t0 + (i + 0.5) * 0.1) < 3.5 ? 90 : 150) + ((i * 7 + j * 13) % 11) - 5;
  const st = { nt, nu, res: 0.1, t0, L, G, S, fine: true };
  const house = (x0, x1) => ({ type: "area", id: 100 + x0, tags: { building: "yes" }, geometry: [ll(x0, -20), ll(x1, -20), ll(x1, 20), ll(x0, 20), ll(x0, -20)] });
  const codes = (pathTags) => {
    const els = [{ type: "way", id: 1, tags: { highway: "secondary" }, geometry: [ll(0, -60), ll(0, 60)] }, { type: "way", id: 2, tags: { highway: "path", bicycle: "designated", foot: "designated", ...pathTags }, geometry: [ll(5, -60), ll(5, 60)] }, house(8, 16), house(-16, -8)];
    return orthoOsmPolys({ osm: { elements: els }, frame, dir, way: els[0], st }).filter((p) => /^(cyklostezka|stezka pro chodce a cyklisty) \(OSM\)/.test(p.label || "")).map((p) => p.code);
  };
  assert.deepEqual(codes({ segregated: "no" }), [702]);
  assert.deepEqual(codes({}), [702]);
  assert.deepEqual(codes({ segregated: "yes" }), [703]);
});
