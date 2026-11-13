// Span wires of the tram's overhead line (Bára, 17. listopadu; profile.js spanPlan): a traction pole away from the
// tracks holds a wire across them instead of a bracket over the cars.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spanPlan } from "../pilot/public/profile.js";

const pole = (f = 0.5) => ({ kind: "sloup_trakce", f });
const S = (type, width, items) => ({ type, width, ...(items ? { items } : {}) });
const high = { left: 1500, right: 1500 }; // facades high enough for a wire

test("sloup za pruhy: lano přes koleje k domu, na nízký dům ne, bez domu končí u kolejí", () => {
  const segs = [S("chodnik", 3, [pole()]), S("pruh", 3), S("pruh", 3), S("tramvaj_pruh", 3), S("tramvaj_pruh", 3), S("pruh", 3), S("chodnik", 2)];
  const plan = spanPlan(segs, { right: "budova" }, 2000, high);
  assert.deepEqual([...plan.free], [["0:0", false]]);
  assert.equal(plan.wires.length, 1);
  assert.deepEqual(plan.wires[0].end, { x: 2000, y: plan.wires[0].y, kind: "wall" });
  assert.deepEqual(plan.wires[0].xs, [1050, 1350]);
  assert.equal(spanPlan(segs, { right: "budova" }, 2000, { right: 300 }).wires[0].end.kind, "free"); // a low house
  const free = spanPlan(segs, {}, 2000).wires[0].end;
  assert.equal(free.kind, "free");
  assert.equal(free.x, 1500); // at the tracks' edge
});

test("sloup u kolejí si nechá výložník; sloupy mezi kolejemi: bez lana", () => {
  assert.equal(spanPlan([S("chodnik", 3, [pole(0.9)]), S("tramvaj_pruh", 3)], {}, 600).free.size, 0);
  const held = [S("chodnik", 3, [pole()]), S("pruh", 6), S("tramvaj", 3, [{ kind: "sloup_trakce", f: 1, center: true }]), S("tramvaj", 3)];
  const plan = spanPlan(held, {}, 1500);
  assert.equal(plan.wires.length, 0);
  assert.equal(plan.free.size, 1); // the pole at the edge without a bracket
});

test("na straně jen jedno lano (od nejbližšího sloupu), ke sloupu naproti, věšáky nad kolejemi pod ním", () => {
  // Two poles left of the tracks (sidewalk and green strip), one on the right sidewalk: one wire, green strip to right.
  const segs = [S("chodnik", 3, [pole(0.3)]), S("zelen", 2, [pole()]), S("pruh", 6), S("tramvaj_pruh", 3), S("tramvaj_pruh", 3), S("pruh", 6), S("chodnik", 3, [pole()])];
  const plan = spanPlan(segs, {}, 2600, high);
  assert.equal(plan.wires.length, 1);
  assert.equal(plan.wires[0].x, 400);
  assert.deepEqual(plan.wires[0].end, { x: 2450, y: plan.wires[0].y, kind: "pole" });
  assert.deepEqual(plan.wires[0].xs, [1250, 1550]);
  assert.deepEqual([...plan.free.keys()].sort(), ["0:0", "1:0", "6:0"]); // all three without a bracket
  // Two runs of tracks with lanes between and a pole at each edge: a wire to each run, each over its own tracks.
  const two = [S("chodnik", 3, [pole()]), S("pruh", 6), S("tramvaj_pruh", 3), S("pruh", 6), S("tramvaj_pruh", 3), S("pruh", 6), S("chodnik", 3, [pole()])];
  assert.deepEqual(spanPlan(two, {}, 3000).wires.map((w) => w.xs).sort(), [[1050], [1950]]);
});
