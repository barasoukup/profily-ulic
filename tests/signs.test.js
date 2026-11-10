import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveSigns, signFile, mirrorSigns, zoneSigns } from "../pilot/public/signs.js";

const keys = (list) => (list || []).map((s) => s.k + (s.v ? `:${s.v}` : "") + (s.plate ? `+${s.plate}` : ""));

test("obytná zóna a zóna 30 jdou přes celou vozovku jednou, bez vlastní B 20a", () => {
  const p = deriveSigns({ segments: [{ type: "chodnik" }, { type: "pruh", dir: "backward" }, { type: "pruh" }, { type: "chodnik" }] }, { highway: "living_street", maxspeed: "20" });
  assert.deepEqual(p.zones, { from: 1, to: 2, signs: [{ k: "ip26a" }] });
  assert.deepEqual(keys(zoneSigns({ highway: "residential", "zone:maxspeed": "CZ:30", maxspeed: "30" })), ["zona30"]);
});

test("jednosměrka: IP 4b ve směru pohledu, B 2 proti, s cyklisty v protisměru; Otočit je vymění", () => {
  const p = deriveSigns({ segments: [{ type: "parkovani", source: "tsk", orient: "kolme" }, { type: "pruh", dir: "forward" }] }, { highway: "residential", oneway: "yes", "oneway:bicycle": "no" });
  const ow = p.zones.signs.find((s) => s.k === "oneway");
  assert.equal(signFile(ow), "IP4c");
  assert.equal(ow.plate, "protismer");
  assert.deepEqual(keys(p.segments[0].signs), ["ip11a+kolme"]);
  mirrorSigns(p);
  assert.equal(signFile(p.zones.signs.find((s) => s.k === "oneway")), "B2");
});

test("pruh BUS, cyklopruhy a odhadnuté stání", () => {
  const p = deriveSigns({ segments: [{ type: "bus" }, { type: "cyklopruh" }, { type: "ochranny_pruh" }, { type: "parkovani", source: "odhad" }, { type: "parkovani", source: "tsk", use: "ztp" }] }, {});
  assert.deepEqual(p.segments.map((s) => keys(s.signs)), [["ip20a"], ["v14"], ["v14p"], [], ["ztp"]]);
});

test("zákaz vjezdu s výjimkou dopravní obsluhy a rychlost po pruzích", () => {
  assert.deepEqual(keys(zoneSigns({ highway: "residential", motor_vehicle: "destination" })), ["b11+obsluha"]);
  const p = deriveSigns({ segments: [{ type: "pruh" }, { type: "pruh" }] }, { highway: "primary", oneway: "yes", "maxspeed:lanes": "50|70" });
  assert.deepEqual(p.segments.map((s) => keys(s.signs)), [["b20a:50"], ["b20a:70"]]);
});

test("zákaz zastavení u pravé obruby", () => {
  const p = deriveSigns({ segments: [{ type: "pruh", dir: "backward" }, { type: "pruh" }] }, { highway: "tertiary", "parking:right:restriction": "no_stopping" });
  assert.deepEqual(p.segments.map((s) => keys(s.signs)), [[], ["b28"]]);
});
