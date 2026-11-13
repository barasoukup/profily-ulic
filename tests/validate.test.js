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
  const p = cleanProfile({ segments: [{ type: "parkovani", width: 2, dir: "nahoru", orient: 5, use: "x", turn: 7 }, { type: "pruh", width: 3, dir: "backward", turn: "left|through" },
    { type: "pruh", width: 3, turn: "slight_left;through" }] });
  assert.deepEqual(Object.keys(p.segments[0]).sort(), ["items", "type", "width"]);
  assert.equal(p.segments[1].dir, "backward");
  // Only words the drawing can name (TURNS), joined by ";" as in OSM turn:lanes.
  assert.equal(p.segments[1].turn, undefined);
  assert.equal(p.segments[2].turn, "slight_left;through");
});

test("tabulka zůstane jen u známé dvojice značky a tabulky", () => {
  const p = cleanProfile({ segments: [{ type: "pruh", width: 3, signs: [{ k: "oneway", plate: "protismer" }, { k: "b1", plate: "kolme" }] },
    { type: "parkovani", width: 2, signs: [{ k: "ip11a", plate: "sikme" }, { k: "b20a", v: 30, plate: "obsluha" }] }] });
  assert.deepEqual(p.segments[0].signs, [{ k: "oneway", plate: "protismer" }, { k: "b1" }]);
  assert.deepEqual(p.segments[1].signs, [{ k: "ip11a", plate: "sikme" }, { k: "b20a", v: 30 }]);
});

test("změna typu části v Návrhu odloží, co k novému typu nepatří", async () => {
  const { retype } = await import("../pilot/public/validate.js");
  // Parking on the sidewalk made a lane: no position (the lane would be drawn in the sidewalk's paving), a direction.
  const lane = retype({ type: "parkovani", width: 5, orient: "kolme", position: "on_kerb", use: "ztp", items: [], signs: [{ k: "ip11d" }] }, "pruh");
  assert.deepEqual(lane, { type: "pruh", width: 5, dir: "forward", items: [], signs: [{ k: "ip11d" }] });
  // A lane made a sidewalk: no arrows, cyclist, wires or class; a tram bed made a lane: no bed or buses.
  const walk = retype({ type: "pruh", width: 3, dir: "backward", turn: "left", bikeDir: "forward", trolley: true, wires: true, roadClass: "mk3" }, "chodnik");
  assert.deepEqual(walk, { type: "chodnik", width: 3 });
  assert.deepEqual(retype({ type: "tramvaj", width: 3.5, dir: "forward", bed: "trava", bedGuess: true, withBus: true }, "pruh"), { type: "pruh", width: 3.5, dir: "forward" });
  // Between lanes everything stays; a bus lane keeps its wires.
  assert.deepEqual(retype({ type: "pruh", width: 3, dir: "forward", turn: "right", wires: true }, "bus"), { type: "bus", width: 3, dir: "forward", turn: "right", wires: true });
});

test("šipky nabízené v Návrhu mají jméno a převod do Streetmixu", async () => {
  const { TURN_CHOICES, TURNS, isTurn } = await import("../pilot/public/types.js");
  const { turnLabel } = await import("../pilot/public/profile.js");
  const { toStreetmix } = await import("../pilot/public/streetmix.js");
  for (const v of TURN_CHOICES) {
    assert.ok(isTurn(v), v);
    assert.ok(v.split(";").every((x) => turnLabel(v).includes(TURNS[x])), v);
    assert.equal(toStreetmix({ segments: [{ type: "pruh", width: 3, turn: v }] }, "T").data.street.segments[0].type, "turn-lane", v);
  }
});

test("výška lampy a stojan podél ulice projdou, nesmysly se zahodí", () => {
  const p = cleanProfile({ segments: [{ type: "chodnik", width: 3, items: [{ kind: "lampa", f: 0.2, h: 6 }, { kind: "lampa", f: 0.5, h: 7 }, { kind: "stojan_kola", f: 0.8, along: true }, { kind: "lavicka", f: 0.9, along: true, h: 4 }] }] });
  const it = p.segments[0].items;
  assert.equal(it[0].h, 6);
  assert.equal(it[1].h, undefined);
  assert.equal(it[2].along, true);
  assert.equal(it[3].along, undefined);
  assert.equal(it[3].h, undefined);
});
