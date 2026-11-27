// Where a click lands (evaluation/kliky): recorded scenes, OSM © its contributors, ODbL 1.0 (tests/placement-scenes.json,
// evaluation/kliky/record.mjs): the way a click takes and how far the cut may move from it. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { localFrame, nearestStreet, placeCut, snapToWay } from "../app/public/derive.js";
import { P } from "../app/public/ortho-osm.js";

// The length along a polyline to a point snapped on it.
const along = (pts, at) => { let d = Math.hypot(at.point[0] - pts[at.index][0], at.point[1] - pts[at.index][1]); for (let i = 0; i < at.index; i++) d += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); return d; };
const { scenes } = JSON.parse(fs.readFileSync(new URL("./placement-scenes.json", import.meta.url), "utf8"));
const elements = (s) => s.elements.map(([t, id, tags, g]) => ({ type: { w: "way", a: "area", n: "node" }[t], id, tags, geometry: Array.from({ length: g.length / 2 }, (_, i) => ({ lon: g[2 * i] / 1e7, lat: g[2 * i + 1] / 1e7 })) }));
for (const s of scenes) test(`klik ${s.id}: ${s.why}`, () => {
  const osm = { elements: elements(s) }, frame = localFrame(s.lat, s.lon), near = nearestStreet(osm, frame, [0, 0]);
  if (s.way) assert.equal(near.way.id, s.way);
  // Along the way, so a click beside the axis and the middle of two carriageways are not counted as a move.
  const p = placeCut(osm, frame, near).point, moved = Math.abs(along(near.pts, snapToWay(near.pts, p)) - along(near.pts, near));
  assert.ok(moved <= s.max, `posun ${moved.toFixed(1)} m, nejvýš ${s.max}`);
  if (s.min) assert.ok(moved >= s.min, `posun ${moved.toFixed(1)} m, aspoň ${s.min}`);
});

const LAT = 52.23, LON = 21.01, frame = localFrame(LAT, LON);
const ll = (x, y) => { const [lon, lat] = frame.toLonLat(x, y); return { lat, lon }; };
const el = (type, id, tags, xy) => ({ type, id, tags, geometry: xy.map(([x, y]) => ll(x, y)) });
const area = (xy) => el("area", -1, { "area:highway": "service" }, xy);
const y = (els) => placeCut({ elements: els }, frame, nearestStreet({ elements: els }, frame, [0, 0])).point[1];
const alley = el("way", 1, { highway: "service" }, [[0, -75], [0, 75]]);
test("plocha uličky není ústí pro cestu, která jí vede (uprostřed, zčásti, po kraji)", () => {
  assert.ok(Math.abs(y([alley, area([[-2.5, -75], [2.5, -75], [2.5, 75], [-2.5, 75]])])) < 0.01, "uvnitř");
  assert.ok(Math.abs(y([alley, area([[-2.5, -20], [2.5, -20], [2.5, 75], [-2.5, 75]])])) < 0.01, "zčásti");
  assert.ok(Math.abs(y([alley, area([[0, -75], [5, -75], [5, 75], [0, 75]])])) < 0.01, "po kraji");
  const short = el("way", 1, { highway: "service" }, [[0, -15], [0, 15]]);
  assert.ok(Math.abs(y([short, area([[-2.5, -9], [2.5, -9], [2.5, 9], [-2.5, 9]])])) < 0.01, "krátká");
  // A U-shaped alley: the way inside it, its other arm beside.
  assert.ok(Math.abs(y([alley, area([[-2.5, -75], [40, -75], [40, -70], [2.5, -70], [2.5, 70], [40, 70], [40, 75], [-2.5, 75]])])) < 0.01, "do U");
});
test("plocha uličky je ústí pro ulici, do které se otevírá, každým ramenem zvlášť", () => {
  const street = el("way", 2, { highway: "residential", name: "S" }, [[0, -100], [0, 100]]);
  assert.ok(Math.abs(y([street, area([[5, -2], [60, -2], [60, 2], [5, 2]])])) >= 7.5);
  // Two mouths 60 m apart of one alley: the middle between them is free, each mouth pushes away.
  const two = [[5, -32], [40, -32], [40, 32], [5, 32], [5, 28], [36, 28], [36, -28], [5, -28]];
  assert.ok(Math.abs(y([street, area(two)])) < 0.01, "mezi ústími");
  const shifted = two.map(([a, b]) => [a, b + 30]);
  assert.ok(Math.abs(y([street, area(shifted)])) >= 7.5, "u ústí");
  P.off = new Set(["ulicky"]);
  try { assert.ok(Math.abs(y([street, area(shifted)])) < 0.01); } finally { P.off = new Set(); }
});
