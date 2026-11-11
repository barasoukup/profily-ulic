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
