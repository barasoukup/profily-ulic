// The library of the measurements (evaluation/lib/, code-health plan step 19): the score of a known pair, the blind pairs and
// their un-blinding, the sign test, the samples. Plain data in, no recording and no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { compare, tableRow } from "../evaluation/lib/score.js";
import { blindPairs, unblind, tally, measures, differs, parseReview, reviewText } from "../evaluation/lib/ab.js";
import { mulberry32, randomSubset, spread, lengthWeighted, addWay } from "../evaluation/lib/sample.js";
import { reportSkeleton, table } from "../evaluation/lib/report.js";

// The judge's profile (codes) and the app's (types) of one street: the app has a lane too many and no parking strip.
const judge = [["chodnik", 2], ["stani", 2], ["pruh", 3], ["pruh", 3], ["chodnik", 2]];
const app = [["chodnik", 2], ["pruh", 3], ["pruh", 3], ["pruh", 3], ["chodnik", 2]];

test("score: composition, lanes and width of a known pair", () => {
  const r = compare(judge, app.map(([t, w]) => [t === "stani" ? "parkovani" : t, w]), true, false);
  // The composition chodnik·stani·pruh·chodnik against chodnik·pruh·chodnik: one edit of four classes, 3 lanes against 2.
  assert.equal(r.same, false);
  assert.deepEqual(r.edits, ["chybí stani"]);
  assert.equal(r.score, 1 - 1 / 4);
  assert.equal(r.lanesA, 2);
  assert.equal(r.lanesB, 3);
  assert.equal(r.widthA, 12);
  assert.equal(r.widthB, 13);
  const same = compare(judge, judge.map(([t, w]) => [t === "stani" ? "parkovani" : t, w]), true, false);
  assert.equal(same.same, true);
  assert.equal(same.score, 1);
});

test("score: a side without a facade ends at the street's own edge", () => {
  // Green and a path beyond the sidewalk on the A side: with no facade there the street ends at the sidewalk.
  const a = [["zelen", 5], ["chodnik", 2], ["pruh", 3], ["pruh", 3], ["chodnik", 2]];
  const r = compare(a, a, true, true, { A: true, B: false });
  assert.equal(r.widthA, 10);
  assert.equal(r.same, true);
});

test("score: a table row has the columns of the report", () => {
  const rows = [compare(judge, judge, true, true), compare(judge, app, true, true)];
  const line = tableRow("XX", rows);
  assert.match(line, /^\| XX \| 2 \| 50 % \| \d+ % \| \d+ % \| \d+ % \/ \d+ % \| .* \|$/);
});

test("blind pairs: random order recorded, un-blinded to the variants, the same seed the same order", () => {
  const pairs = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, a: `A${i + 1}`, b: `B${i + 1}` }));
  const x = blindPairs(pairs, 7), y = blindPairs(pairs, 7), z = blindPairs(pairs, 8);
  assert.deepEqual(x, y);
  assert.notDeepEqual(x.items.map((i) => i.id), z.items.map((i) => i.id));
  assert.equal(x.items.length, 20);
  assert.ok(Object.values(x.key).includes("ab") && Object.values(x.key).includes("ba"));
  // A judge who always prefers what lies first on the screen: for a pair in order "ba" that is B.
  const verdicts = Object.fromEntries(x.items.map((it) => [it.id, "1"]));
  const out = unblind(verdicts, x.key);
  for (const it of x.items) assert.equal(out[it.id], x.key[it.id] === "ab" ? "a" : "b");
  // What the judge saw first is the variant the key says.
  for (const it of x.items) assert.equal(it.first, x.key[it.id] === "ab" ? `A${it.id}` : `B${it.id}`);
  assert.deepEqual(unblind({ 1: "both", 2: "neither", 3: "obě" }, { 1: "ab", 2: "ba", 3: "ab" }), { 1: "obě", 2: "žádná", 3: "obě" });
  assert.throws(() => unblind({ 1: "x" }, { 1: "ab" }));
});

test("sign test: 11 : 4 of 15 is p 0.118, ties do not count, 0 : 0 is 1", () => {
  const v = { ...Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`a${i}`, "a"])), ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [`b${i}`, "b"])), t: "obě" };
  assert.deepEqual(tally(v), { a: 11, b: 4, "obě": 1, "žádná": 0, p: 0.1185 });
  assert.equal(tally({}).p, 1);
});

test("review: the verdicts are read and kept when the file is written again", () => {
  const profile = (w) => ({ segments: [{ type: "pruh", width: w }, { type: "chodnik", width: 2 }], edges: { left: "dum", right: "dum" } });
  const pair = (n, wa, wb, v) => ({ sample: { n }, cut: { highway: "residential", name: `U${n}` }, a: { measures: measures(profile(wa)) }, b: { measures: measures(profile(wb)) }, v });
  const pairs = [pair(1, 6, 7), pair(2, 6, 6), pair(3, 6, 8)];
  assert.deepEqual(differs(pairs[0].a.measures, pairs[0].b.measures), ["vozovka 6/7"]);
  const first = reviewText("test", "a", "b", pairs);
  assert.match(first, /- č\. 1 residential U1: vozovka 6\/7 · verdikt: \? · /);
  assert.ok(!first.includes("č. 2"));
  const filled = first.replace("verdikt: ? · \n- č. 3", "verdikt: a · jasně\n- č. 3");
  const old = parseReview(filled);
  assert.equal(old.get(1).verdict, "a");
  assert.equal(old.get(3).verdict, null);
  assert.equal(reviewText("test", "a", "b", pairs, old), filled);
});

test("samples: seeded, spread over the groups, length-weighted", () => {
  const r = mulberry32(1), s = mulberry32(1);
  assert.equal(r(), s());
  const list = Array.from({ length: 50 }, (_, i) => ({ id: i, g: i % 5, town: `t${i % 7}` }));
  assert.deepEqual(randomSubset(list, 10, 3), randomSubset(list, 10, 3));
  assert.equal(new Set(randomSubset(list, 10, 3).map((p) => p.id)).size, 10);
  const pick = spread(list, { groupBy: (p) => p.g, spreadBy: (p) => p.town, per: 2, seed: 5 });
  assert.equal(pick.length, 10);
  for (const g of [0, 1, 2, 3, 4]) {
    const of = pick.filter((p) => p.g === g);
    assert.equal(of.length, 2);
    assert.notEqual(of[0].town, of[1].town);
  }
  // Two ways of 1 km and 100 m: almost all cuts lie on the long one (every metre of the network has the same chance).
  const strata = { residential: { ways: [], total: 0 } };
  const km = 111320, way = (id, len) => ({ id, c: [[0, 0], [len / km, 0]], lens: [len], len });
  addWay(strata.residential, way(1, 1000));
  addWay(strata.residential, way(2, 100));
  const run = () => lengthWeighted(strata, { residential: 3 }, { seed: 4, minSpacing: 50, endGap: 5, kx: km, ky: 110574 });
  const { samples, report } = run();
  assert.deepEqual(samples, run().samples);
  assert.equal(report.residential.got, 3);
  assert.ok(samples.filter((p) => p.wayId === 1).length >= 2);
});

test("report: the skeleton asks for the filter, the sample, the control set and the judges", () => {
  const md = reportSkeleton({ title: "Test", date: "28. 11. 2026", results: table(["a", "b"], [[1, 2]]) });
  for (const h of ["## Co se měnilo", "## Vzorek a sběr", "- Cíle:", "- Kontrolní sada:", "- Posuzovatelé:", "## Výsledky", "| a | b |", "## Rozhodnutí", "## Co zůstává"]) assert.ok(md.includes(h), h);
});
