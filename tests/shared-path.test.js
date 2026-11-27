import { test } from "node:test";
import assert from "node:assert/strict";
import { localFrame, deriveProfile, mtvuPolygons } from "../pilot/public/derive.js";

// A street running north (x = 0, roadway 7 m) with a sidewalk strip (MTVU 702, 3 m) on the east side where an OSM path runs
// (Brandenburger Straße, Leipzig, 27. 11. 2026: a shared path one way for cyclists drew two cycle tracks).
function east(pathTags, pathReversed = false, code = 702) {
  const frame = localFrame(51.35, 12.39);
  const rect = (x0, x1, code) => ({ attributes: { CTVUK_KOD: code }, geometry: { rings: [[[x0, -60], [x1, -60], [x1, 60], [x0, 60], [x0, -60]].map(([x, y]) => frame.toLonLat(x, y))] } });
  const polys = mtvuPolygons({ features: [rect(-6.5, -3.5, 702), rect(-3.5, 3.5, 701), rect(3.5, 6.5, code)] }, frame);
  const line = (x, rev) => { const g = [frame.toLonLat(x, -100), frame.toLonLat(x, 100)].map(([lon, lat]) => ({ lat, lon })); return rev ? g.reverse() : g; };
  const els = [{ type: "way", id: 1, tags: { highway: "residential", lanes: "2" }, geometry: line(0) }, { type: "way", id: 2, tags: pathTags, geometry: line(5, pathReversed) }];
  const r = deriveProfile({ center: [0, 0], dir: [0, 1], half: 40, polys, osm: { elements: els }, frame, way: els[0], noParkGuess: true });
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
