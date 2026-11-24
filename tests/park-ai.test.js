// The model's parking at the kerbs (ai-kerbs.js parkFromAi): a law strip gone back to the roadway is shared by its
// lanes, and a law strip where the model sees perpendicular cars gives way to them (evaluation/sjednoceni, 25. 11. 2026).
import { test } from "node:test";
import assert from "node:assert/strict";
import { parkFromAi } from "../pilot/public/ai-kerbs.js";

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
