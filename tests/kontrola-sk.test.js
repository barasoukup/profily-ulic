// Fixes from the check of 1000 Slovak cuts (evaluation/slovensko/kontrola/ZPRAVA.md, Bára 16. 11. 2026).
import { test } from "node:test";
import assert from "node:assert/strict";
import { splitTwoWayLane, capWideLanes } from "../pilot/public/derive.js";

const seg = (type, width, extra = {}) => ({ type, width, source: "ortofoto", ...extra });

test("obousměrka s jedním pruhem od 5 m má dva pruhy, jednosměrka a lanes=1 ne", () => {
  const s = [seg("chodnik", 2), seg("pruh", 6), seg("chodnik", 2)];
  assert.equal(splitTwoWayLane(s, { highway: "residential" }), 1);
  assert.deepEqual(s.map((x) => [x.type, x.width, x.dir]), [["chodnik", 2, undefined], ["pruh", 3, "backward"], ["pruh", 3, "forward"], ["chodnik", 2, undefined]]);
  assert.equal(splitTwoWayLane([seg("pruh", 4.9)], { highway: "residential" }), 0);
  assert.equal(splitTwoWayLane([seg("pruh", 6)], { highway: "residential", oneway: "yes" }), 0);
  assert.equal(splitTwoWayLane([seg("pruh", 6)], { highway: "residential", lanes: "1" }), 0);
  assert.equal(splitTwoWayLane([seg("pruh", 6)], { highway: "living_street" }), 0);
});

test("pruh širší než strop o metr a víc: zbytek krajnice, k té, co už u pruhu je", () => {
  const s = [seg("chodnik", 2), seg("pruh", 6.1, { dir: "forward" }), seg("chodnik", 2)];
  assert.equal(capWideLanes(s, { highway: "residential", oneway: "yes" }), 1);
  assert.equal(s.filter((x) => x.type === "pruh")[0].width, 4.5);
  assert.equal(s.filter((x) => x.type === "krajnice").reduce((a, x) => a + x.width, 0).toFixed(2), "1.60");
  const k = [seg("zelen", 2), seg("pruh", 6.3), seg("krajnice", 1.87), seg("pruh", 2.98)];
  capWideLanes(k, { highway: "residential" });
  assert.deepEqual(k.map((x) => [x.type, x.width]), [["zelen", 2], ["pruh", 4.5], ["krajnice", 3.67], ["pruh", 2.98]]);
  const z = [seg("pruh", 6.3)];
  assert.equal(capWideLanes(z, { highway: "living_street" }), 0);
  const mid = [seg("pruh", 3), seg("pruh", 6), seg("pruh", 3)];
  assert.equal(capWideLanes(mid, { highway: "primary" }), 0);
});
