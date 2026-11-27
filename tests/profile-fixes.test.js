// Fixes found by the street history pilot (17. 11. 2026): a pedestrian zone is a sidewalk, a tram lane is not narrower
// than a lane.
import test from "node:test";
import assert from "node:assert/strict";
import { pedestrianZone, widenNarrowTrams } from "../app/public/derive.js";

test("pěší zóna: pruhy a neurčeno odhadu jsou chodník, s technickou mapou pruh zůstane", () => {
  const segs = () => [{ type: "chodnik", width: 3 }, { type: "pruh", width: 14.9, dir: "forward" }, { type: "nezname", width: 5, source: "odhad" }, { type: "stromorad", width: 1.5 }];
  const a = segs();
  assert.ok(pedestrianZone(a, { highway: "pedestrian" }) > 0);
  assert.deepEqual(a.map((s) => s.type), ["chodnik", "stromorad"]);
  assert.equal(a[0].width, 22.9);
  const b = segs();
  assert.equal(pedestrianZone(b, { highway: "pedestrian" }, { measured: true }), 0);
  assert.equal(b[1].type, "pruh");
  const c = segs();
  assert.equal(pedestrianZone(c, { highway: "living_street" }), 0);
});

test("tramvajový pruh užší než 3 m si vezme zbytek z chodníku vedle", () => {
  const s = [{ type: "chodnik", width: 3.65 }, { type: "tramvaj_v_pruhu", width: 1.97 }, { type: "tramvaj_v_pruhu", width: 2.73 }, { type: "chodnik", width: 6 }];
  assert.equal(widenNarrowTrams(s), 2);
  assert.deepEqual(s.map((x) => x.width), [2.62, 3, 3, 5.73]);
  // A sidewalk would keep less than 1.5 m: nothing taken.
  const t = [{ type: "chodnik", width: 2 }, { type: "tramvaj_v_pruhu", width: 2 }];
  assert.equal(widenNarrowTrams(t), 0);
});
