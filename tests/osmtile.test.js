// The compact OSM tiles (pilot/public/osmtile.js): coordinates as differences, lines cut by tiles joined back.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeTile, mergePieces } from "../pilot/public/osmtile.js";

const line = (o, pts) => JSON.stringify({ t: "w", i: 7, k: { highway: "residential" }, o, g: pts.flatMap(([x, y], i) => (i ? [x - pts[i - 1][0], y - pts[i - 1][1]] : [x, y])) });

test("dlaždice: rozdíly souřadnic, budovy po 1e-5°", () => {
  const els = decodeTile(line(0, [[14400000, 50080000], [14400100, 50080050]]) + "\n" + JSON.stringify({ t: "a", i: 9, k: { building: "yes" }, q: 5, g: [1440000, 5008000, 10, 0, 0, 10] }) + "\n");
  assert.equal(els[0].type, "way");
  assert.deepEqual(els[0].geometry[1], { lat: 50.08005, lon: 14.4001 });
  assert.equal(els[1].type, "area");
  assert.deepEqual(els[1].geometry[2], { lat: 50.0801, lon: 14.4001 });
});

test("kusy jedné cesty ze sousedních dlaždic se spojí, vzdálené zůstanou zvlášť", () => {
  const a = decodeTile(line(0, [[0, 0], [10, 0], [20, 0]]));
  const b = decodeTile(line(1, [[10, 0], [20, 0], [30, 0], [40, 0]]));
  const far = decodeTile(line(9, [[90, 0], [100, 0]]));
  const out = mergePieces([a, b, far]);
  assert.equal(out.length, 2);
  assert.deepEqual(out[0].geometry.map((p) => p.lon * 1e6), [0, 10, 20, 30, 40]);
  assert.equal(out[1].geometry.length, 2);
});
