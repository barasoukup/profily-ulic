import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanProfile, cleanCut } from "../pilot/public/validate.js";

test("soubor bez částí nebo s vadnou šířkou se odmítne", () => {
  assert.throws(() => cleanProfile({ segments: [] }), /chybí části/);
  assert.throws(() => cleanProfile({ segments: [{ type: "pruh", width: "abc" }] }), /vadná šířka/);
  assert.throws(() => cleanProfile({ segments: [{ type: "pruh", width: -1 }] }), /vadná šířka/);
});

test("neznámý typ, zdroj a prvek se zneškodní", () => {
  const p = cleanProfile({ segments: [{ type: "<b>zlo</b>", width: 3, source: "x", items: [{ kind: "lampa", f: 0.5 }, { kind: "<i>", f: 0.2 }, { kind: "lavicka", f: "a" }] }] });
  assert.equal(p.segments[0].type, "nezname");
  assert.equal(p.segments[0].source, "user");
  assert.deepEqual(p.segments[0].items, [{ kind: "lampa", f: 0.5 }]);
});

test("nečíselné údaje o budově se zahodí, čísla zůstanou", () => {
  const p = cleanProfile({ segments: [{ type: "chodnik", width: 2 }], edges: { left: "budova", leftInfo: { height: "abc", levels: 5 } } });
  assert.deepEqual(p.edges.leftInfo, { levels: 5 });
});

test("poloha řezu mimo Prahu nebo s vadným dosahem", () => {
  assert.equal(cleanCut({ lat: 10, lon: 14, bearing: 0 }), null);
  const c = cleanCut({ lat: 50.08, lon: 14.42, bearing: 90, name: 5, reach: { left: "x", right: 20 } });
  assert.equal(c.name, "5");
  assert.equal(c.reach, undefined);
  assert.deepEqual(cleanCut({ lat: 50.08, lon: 14.42, bearing: 90, reach: { left: 10, right: 22 } }).reach, { left: 10, right: 22 });
});

test("vadné směry, orientace, účel a odbočení se zahodí", () => {
  const p = cleanProfile({ segments: [{ type: "parkovani", width: 2, dir: "nahoru", orient: 5, use: "x", turn: 7 }, { type: "pruh", width: 3, dir: "backward", turn: "left|through" }] });
  assert.deepEqual(Object.keys(p.segments[0]).sort(), ["items", "type", "width"]);
  assert.equal(p.segments[1].dir, "backward");
  assert.equal(p.segments[1].turn, "left|through");
});
