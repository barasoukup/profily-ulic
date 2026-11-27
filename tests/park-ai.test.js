// The model's parking at the kerbs (ai-kerbs.js parkFromAi): a law strip gone back to the roadway is shared by its
// lanes, and a law strip where the model sees perpendicular cars gives way to them (evaluation/archive/unification, 25. 11. 2026).
import { test } from "node:test";
import assert from "node:assert/strict";
import { parkFromAi, lawKerbs, layLaw, lawUnsplits, widenLaw } from "../app/public/ai-kerbs.js";

// A cut from t = 5 (A) to t = -5 (B): law strip 2 m, two lanes of 3 m, a sidewalk 2 m beyond.
const cut = () => ({ extent: [-5, 5], segments: [
  { type: "parkovani", width: 2, source: "odhad", orient: "podelne" },
  { type: "pruh", width: 3 }, { type: "pruh", width: 3 },
  { type: "chodnik", width: 2 },
] });

test("a law strip with no cars goes back shared by both lanes", () => {
  const r = cut();
  assert.equal(parkFromAi(r, () => 0), 1);
  assert.deepEqual(r.segments.map((s) => [s.type, s.width]), [["pruh", 4], ["pruh", 4], ["chodnik", 2]]);
});

test("?off=parkshare: the strip back to the lane beside it only", () => {
  const r = cut();
  parkFromAi(r, () => 0, { old: true });
  assert.deepEqual(r.segments.map((s) => [s.type, s.width]), [["pruh", 5], ["pruh", 3], ["chodnik", 2]]);
});

test("perpendicular cars at a law strip take its place", () => {
  const r = cut();
  // Cars from the kerb at A (t = 5) 5 m into the roadway.
  parkFromAi(r, (t) => (t > 0 && t <= 5 ? 0.9 : 0));
  const p = r.segments.find((s) => s.type === "parkovani");
  assert.equal(p.orient, "kolme");
  assert.ok(p.ai);
  assert.equal(r.segments.reduce((a, s) => a + s.width, 0), 10);
  // Parallel cars keep the law's strip.
  const q = cut();
  parkFromAi(q, (t) => (t > 3 && t <= 5 ? 0.9 : 0));
  assert.deepEqual(q.segments.map((s) => [s.type, s.width, !!s.ai]), [["parkovani", 2, false], ["pruh", 3, false], ["pruh", 3, false], ["chodnik", 2, false]]);
});

// The law's strips after the lanes (evaluation/archive/unification/slovakia-parking, 25. 11. 2026): A at t = 5, the roadway 8 m.
const road = (w = [4, 4]) => ({ extent: [-5, 5], segments: [...w.map((x) => ({ type: "pruh", width: x })), { type: "chodnik", width: 2 }] });
test("the kerbs of the law's strips", () => {
  assert.deepEqual(lawKerbs(cut()), [{ t: 5, sg: -1 }]);
});
test("a law strip laid in doubt while the law's width is left, none where the model is sure of no cars", () => {
  const at = [{ t: 5, sg: -1 }], need = (n) => 3 * Math.max(2, n), r = road();
  assert.equal(layLaw(r, at, () => 0.1, need), 0);
  assert.equal(layLaw(r, at, () => 0.3, need), 1);
  assert.deepEqual(r.segments.map((s) => [s.type, s.width]), [["parkovani", 2], ["pruh", 3], ["pruh", 3], ["chodnik", 2]]);
  // Trenčín, K výstavisku: the model's perpendicular row left 7.1 m, the law's strip would leave 5.1 m.
  assert.equal(layLaw(road([3.5, 3.6]), [{ t: 5, sg: -1 }], () => 0.3, need), 0);
});
test("a row the model sees: the strip as wide as the row, not for a perpendicular one", () => {
  const at = [{ t: 5, sg: -1 }], need = () => 3, r = road([6]), rows = [];
  assert.equal(layLaw(r, at, (t) => (t <= 5 && t > 2.7 ? 0.9 : 0), need, { sure: true, rows }), 1);
  assert.equal(r.segments[0].width, 2);
  widenLaw(r, rows);
  assert.ok(r.segments[0].type === "parkovani" && r.segments[0].width > 2.1 && r.segments[0].width <= 2.5);
  assert.equal(layLaw(road([6]), at, (t) => (t <= 5 && t > 0 ? 0.9 : 0), need, { sure: true }), 0);
});
test("the strip takes the shoulder at the kerb first", () => {
  const r = { extent: [-5, 5], segments: [{ type: "krajnice", width: 1.5, source: "odhad" }, { type: "pruh", width: 4.5 }, { type: "chodnik", width: 4 }] };
  assert.equal(layLaw(r, [{ t: 5, sg: -1 }], () => 0.3, () => 3), 1);
  assert.deepEqual(r.segments.map((s) => [s.type, s.width]), [["parkovani", 2], ["pruh", 4], ["chodnik", 4]]);
});
test("a lane with a shared-lane marking is a lane for the law's strip (Graz Naglergasse)", () => {
  const at = [{ t: 5, sg: -1 }], need = (n) => 3 * n;
  const r = { extent: [-5, 5], segments: [{ type: "krajnice", width: 1.5, source: "odhad" }, { type: "pruh_piktokoridor", width: 4.5 }, { type: "chodnik", width: 4 }] };
  assert.equal(layLaw(r, at, () => 0.3, need), 1);
  assert.deepEqual(r.segments.map((s) => [s.type, s.width]), [["parkovani", 2], ["pruh_piktokoridor", 4], ["chodnik", 4]]);
  // The strip in the place of the lane at the kerb itself, and the law's width kept.
  const q = { extent: [-5, 5], segments: [{ type: "pruh_piktokoridor", width: 4 }, { type: "pruh_piktokoridor", width: 4 }, { type: "chodnik", width: 2 }] };
  assert.equal(layLaw(q, at, () => 0.3, need), 1);
  assert.deepEqual(q.segments.map((s) => s.width), [2, 3, 3, 2]);
  assert.equal(layLaw(q, [{ t: -3, sg: 1 }], () => 0.3, need), 0);
});

test("a one-way street's split by a line gives way to the law's strip, not where the model is sure of no cars", () => {
  const at = [{ t: 5, sg: -1 }], need = (n) => 3 * Math.max(1, n);
  // Jesenského: the rules 1.55 | 4.5 | 1.55, the lines 4.17 | 3.43.
  const rules = { extent: [-5, 5], segments: [{ type: "krajnice", width: 1.5, source: "odhad" }, { type: "pruh", width: 4.5 }, { type: "krajnice", width: 1.5, source: "odhad" }, { type: "chodnik", width: 2.5 }] };
  const lines = { extent: [-5, 5], segments: [{ type: "pruh", width: 4.1, source: "ortofoto" }, { type: "pruh", width: 3.4, source: "ortofoto" }, { type: "chodnik", width: 2.5 }] };
  assert.equal(lawUnsplits(rules, lines, at, () => 0.3, need), true);
  assert.equal(lawUnsplits(rules, lines, at, () => 0.1, need), false);
  assert.equal(rules.segments.length, 4, "nic se nepřekreslí");
  // Two lanes that leave the strip its room stay split, and so does a roadway with as many lanes as the rules had.
  const wide = { extent: [-5, 5], segments: [{ type: "pruh", width: 4 }, { type: "pruh", width: 4 }, { type: "chodnik", width: 2 }] };
  const wideRules = { extent: [-5, 5], segments: [{ type: "krajnice", width: 1.75, source: "odhad" }, { type: "pruh", width: 4.5 }, { type: "krajnice", width: 1.75, source: "odhad" }, { type: "chodnik", width: 2 }] };
  assert.equal(lawUnsplits(wideRules, wide, at, () => 0.3, need), false);
  assert.equal(lawUnsplits(rules, rules, at, () => 0.3, need), false);
});
