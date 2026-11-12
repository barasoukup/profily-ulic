// Lanes from the orthophoto (pilot/public/lanes-ortho.js, prototype) on a drawn image: an 8 m carriageway with a
// dashed line in its middle, where the rules drew a shoulder and two lanes over 9.9 m.
import { test } from "node:test";
import assert from "node:assert/strict";
import { brightMap, laneLines, applyLanes } from "../pilot/public/lanes-ortho.js";

// The image on the cut's grid: asphalt 100, kerbs at ±4 m, a dashed line (3 m of every 9 m) at t = lineAt.
function image(lineAt = 0, res = 0.1) {
  const t0 = -10, nt = 200, nu = 400, L = new Float32Array(nt * nu);
  for (let j = 0; j < nu; j++) for (let i = 0; i < nt; i++) {
    const t = t0 + (i + 0.5) * res, u = 20 - (j + 0.5) * res;
    let v = Math.abs(t) > 4 ? 140 : 100; // sidewalks are lighter
    if (Math.abs(t - lineAt) < 0.07 && ((u + 40) % 9) < 3) v = 190;
    L[j * nt + i] = v;
  }
  return { source: "cuzk", st: { nt, nu, res, t0, L } };
}

test("ortofoto: čára uprostřed vozovky dá dva pruhy, zbytek profilu zůstane krajnicí", () => {
  const img = image();
  const lines = laneLines(img.st, brightMap(img.st), -4, 4);
  assert.equal(lines.length, 1);
  assert.ok(Math.abs(lines[0]) < 0.15);
  const result = {
    extent: [-6.95, 6.95],
    segments: [{ type: "chodnik", width: 2, source: "dtm" }, { type: "krajnice", width: 2.4, source: "odhad" }, { type: "pruh", width: 3.75, source: "osm", dir: "forward" }, { type: "pruh", width: 3.75, source: "osm", dir: "backward" }, { type: "chodnik", width: 2, source: "dtm" }],
    runs: [{ code: 702, s: -40, e: -4 }, { code: 701, s: -4, e: 4 }, { code: 702, s: 4, e: 40 }],
  };
  assert.equal(applyLanes(result, img), 1);
  const lanes = result.segments.filter((s) => s.type === "pruh");
  assert.equal(lanes.length, 2);
  assert.ok(lanes.every((s) => Math.abs(s.width - 4) < 0.2 && s.source === "ortofoto"));
  assert.deepEqual(lanes.map((s) => s.dir), ["forward", "backward"]);
  const total = result.segments.reduce((a, s) => a + s.width, 0);
  assert.ok(Math.abs(total - 13.9) < 0.011);
});

test("ortofoto: bez čar se profil nemění", () => {
  const img = image(99);
  const result = { extent: [-4, 4], segments: [{ type: "pruh", width: 4, source: "osm" }, { type: "pruh", width: 4, source: "osm" }], runs: [{ code: 701, s: -4, e: 4 }] };
  assert.equal(applyLanes(result, img), 0);
  assert.deepEqual(result.segments.map((s) => s.width), [4, 4]);
});

// A drawn carriageway [-half, half] (asphalt 100, lighter sidewalks), with lines { t, dashed, v } and, optionally, a
// band of paving at the low kerb ([-half, -half + band], uneven 150–250).
function drawn({ half = 4, lines = [], band = 0, fine = false, res = 0.1 }) {
  const t0 = -half - 6, nt = Math.round((2 * half + 12) / res), nu = 400, L = new Float32Array(nt * nu);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let j = 0; j < nu; j++) for (let i = 0; i < nt; i++) {
    const t = t0 + (i + 0.5) * res, u = 20 - (j + 0.5) * res;
    let v = Math.abs(t) > half ? 140 : 100;
    if (band && t >= -half && t < -half + band) v = 150 + 100 * rnd();
    for (const l of lines) if (Math.abs(t - l.t) < 0.07 && (!l.dashed || ((u + 40) % 9) < 3)) v = l.v ?? 190;
    L[j * nt + i] = v;
  }
  return { source: fine ? "ipr" : "cuzk", st: { nt, nu, res, t0, L, fine } };
}
const road = (half, segments) => ({ extent: [-half - 2, half + 2], segments: [{ type: "chodnik", width: 2, source: "dtm" }, ...segments, { type: "chodnik", width: 2, source: "dtm" }], runs: [{ code: 702, s: -40, e: -half }, { code: 701, s: -half, e: half }, { code: 702, s: half, e: 40 }] });
const kinds = (r) => r.segments.filter((s) => s.type !== "chodnik").map((s) => s.type);
// Widths within a pixel or so of the drawing (a line is found at its pixel's middle).
const near = (r, widths) => r.segments.filter((s) => s.type !== "chodnik").every((s, i) => Math.abs(s.width - widths[i]) <= 0.11);

test("ortofoto: plná vodicí čára 30 cm od obruby dá úzkou krajnici", () => {
  const img = drawn({ lines: [{ t: -3.7 }, { t: 0, dashed: true }, { t: 3.7 }] });
  const r = road(4, [{ type: "pruh", width: 4, source: "osm", dir: "forward" }, { type: "pruh", width: 4, source: "osm", dir: "backward" }]);
  assert.equal(applyLanes(r, img), 1);
  assert.deepEqual(kinds(r), ["krajnice", "pruh", "pruh", "krajnice"]);
  assert.ok(near(r, [0.3, 3.7, 3.7, 0.3]));
});

test("ortofoto: pás mezi dvěma plnými čarami s pruhy po obou stranách je středová krajnice, ne pruh", () => {
  const img = drawn({ half: 9, lines: [{ t: -5.5, dashed: true }, { t: -2 }, { t: 2 }, { t: 5.5, dashed: true }] });
  const lane = (dir) => ({ type: "pruh", width: 4.5, source: "osm", dir });
  const r = road(9, [lane("forward"), lane("forward"), lane("backward"), lane("backward")]);
  assert.equal(applyLanes(r, img), 1);
  assert.deepEqual(kinds(r), ["pruh", "pruh", "krajnice", "pruh", "pruh"]);
  assert.ok(near(r, [3.5, 3.5, 4, 3.5, 3.5]));
  assert.deepEqual(r.segments.filter((s) => s.type === "pruh").map((s) => s.dir), ["forward", "forward", "backward", "backward"]);
});

test("ortofoto: úzký kus u obruby za přerušovanou čarou patří k pruhu (přidávání pruhu), ne krajnice", () => {
  const img = drawn({ half: 4.5, lines: [{ t: -2.5, dashed: true }, { t: 1, dashed: true }] });
  const r = road(4.5, [{ type: "pruh", width: 4.5, source: "osm" }, { type: "pruh", width: 4.5, source: "osm" }]);
  assert.equal(applyLanes(r, img), 1);
  assert.ok(!r.segments.some((s) => s.type === "krajnice"));
  assert.deepEqual(kinds(r), ["pruh", "pruh"]);
  assert.ok(r.segments.some((s) => s.type === "pruh" && Math.abs(s.width - 5.5) < 0.05));
});

test("ortofoto: na městském ortofotu ojetý asfalt (slabé světlé pásy) není čára", () => {
  const img = drawn({ half: 3.5, fine: true, lines: [{ t: -1.65, v: 125 }, { t: 0, v: 190 }, { t: 1.65, v: 125 }] });
  const r = road(3.5, [{ type: "pruh", width: 3.5, source: "osm", dir: "forward" }, { type: "pruh", width: 3.5, source: "osm", dir: "backward" }]);
  applyLanes(r, img);
  assert.ok(!r.segments.some((s) => s.type === "krajnice"));
  assert.deepEqual(kinds(r), ["pruh", "pruh"]);
  assert.ok(near(r, [3.5, 3.5]));
});

test("ortofoto: stání z dlažby u obruby se oddělí od pruhu jako podélné stání", () => {
  const img = drawn({ band: 2.1 });
  const r = road(4, [{ type: "pruh", width: 8, source: "osm" }]);
  assert.ok(applyLanes(r, img) >= 1);
  const park = r.segments.find((s) => s.type === "parkovani");
  assert.ok(park && Math.abs(park.width - 2.1) < 0.2 && park.source === "ortofoto" && park.orient === "podelne");
  // The low kerb (s) is the profile's last part in screen order: the parking comes after the lane.
  assert.ok(r.segments.indexOf(park) > r.segments.findIndex((s) => s.type === "pruh"));
  assert.ok(Math.abs(r.segments.reduce((a, s) => a + s.width, 0) - 12) < 0.011);
});
