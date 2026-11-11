import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveSigns, signFile, plateFile, streetSigns } from "../pilot/public/signs.js";

const keys = (list) => (list || []).map((s) => s.k + (s.v ? `:${s.v}` : "") + (s.plate ? `+${s.plate}` : ""));
const files = (p) => p.segments.map((s) => (s.signs || []).map((x) => signFile(x, s)));

test("žádné značky přes celý profil; zóna, rychlost a jednosměrka pod jízdními pruhy", () => {
  const p = deriveSigns({ segments: [{ type: "chodnik" }, { type: "pruh", dir: "backward" }, { type: "pruh" }, { type: "chodnik" }] }, { highway: "living_street", maxspeed: "20" }, { inZps: true });
  assert.equal(p.zones, undefined);
  assert.deepEqual(p.segments.map((s) => keys(s.signs)), [[], ["ip26a"], ["ip26a"], []]);
  assert.deepEqual(keys(streetSigns({ highway: "residential", "zone:maxspeed": "CZ:30" })), ["zona30"]);
  const q = deriveSigns({ segments: [{ type: "pruh" }, { type: "pruh", dir: "backward" }] }, { highway: "primary", maxspeed: "40" });
  assert.deepEqual(q.segments.map((s) => keys(s.signs)), [["b20a:40"], ["b20a:40"]]);
});

test("jednosměrka pod pruhem: IP 4b ve směru pohledu, IP 4c s cyklisty v protisměru, B 2 proti; Otočit je vymění", () => {
  const p = deriveSigns({ segments: [{ type: "parkovani", source: "tsk", orient: "kolme" }, { type: "pruh", dir: "forward" }] }, { highway: "residential", oneway: "yes", "oneway:bicycle": "no" });
  assert.deepEqual(files(p), [["IP11b"], ["IP4c"]]);
  p.segments[1].dir = "backward"; // after Otočit the lane comes towards the viewer
  assert.deepEqual(files(p)[1], ["B2"]);
  const q = deriveSigns({ segments: [{ type: "pruh" }] }, { highway: "residential", oneway: "yes" });
  assert.deepEqual(files(q), [["IP4b"]]);
});

test("šikmé stání má stejnou značku jako kolmé", () => {
  const p = deriveSigns({ segments: [{ type: "parkovani", source: "tsk", orient: "sikme" }, { type: "parkovani", source: "tsk", orient: "podelne" }] }, {});
  assert.deepEqual(files(p), [["IP11b"], ["IP11c"]]);
});

test("pruh BUS, cyklopruhy a odhadnuté stání", () => {
  const p = deriveSigns({ segments: [{ type: "bus" }, { type: "cyklopruh" }, { type: "ochranny_pruh" }, { type: "parkovani", source: "odhad" }, { type: "parkovani", source: "tsk", use: "ztp" }] }, {});
  assert.deepEqual(p.segments.map((s) => keys(s.signs)), [["ip20a"], [], [], [], ["ztp"]]);
});

test("zákaz vjezdu s výjimkou dopravní obsluhy a rychlost po pruzích", () => {
  assert.deepEqual(keys(streetSigns({ highway: "residential", motor_vehicle: "destination" })), ["b11+obsluha"]);
  const p = deriveSigns({ segments: [{ type: "pruh" }, { type: "pruh" }] }, { highway: "primary", "maxspeed:lanes": "50|70" });
  assert.deepEqual(p.segments.map((s) => keys(s.signs)), [["b20a:50"], ["b20a:70"]]);
});

test("zákaz zastavení u pravé obruby na krajním pruhu", () => {
  const p = deriveSigns({ segments: [{ type: "pruh", dir: "backward" }, { type: "pruh" }] }, { highway: "tertiary", "parking:right:restriction": "no_stopping" });
  assert.deepEqual(p.segments.map((s) => keys(s.signs)), [[], ["b28"]]);
});

test("stání na chodníku a napůl na chodníku: IP 11d až g", () => {
  const p = deriveSigns({ segments: [
    { type: "parkovani", source: "osm", position: "on_kerb" }, { type: "parkovani", source: "osm", position: "on_kerb", orient: "kolme" },
    { type: "parkovani", source: "osm", position: "half_on_kerb" }, { type: "parkovani", source: "osm", position: "half_on_kerb", orient: "sikme" },
  ] }, {});
  assert.deepEqual(files(p), [["IP11e"], ["IP11d"], ["IP11g"], ["IP11f"]]);
});

test("pruh pro BUS a cyklisty: symbol autobusu a pod ním modré kolo", () => {
  const p = deriveSigns({ segments: [{ type: "bus_cyklo", dir: "forward" }] }, {});
  assert.deepEqual(keys(p.segments[0].signs), ["ip20a+kolo"]);
  assert.equal(plateFile(p.segments[0].signs[0], p.segments[0]), "C8a");
});

test("zákaz zastavení u pravé strany cesty, když se profil dívá proti směru cesty, je vlevo", () => {
  const p = deriveSigns({ segments: [{ type: "pruh", dir: "backward" }, { type: "pruh" }] }, { highway: "tertiary", "parking:right:restriction": "no_stopping" }, { alongWay: false });
  assert.deepEqual(p.segments.map((s) => keys(s.signs)), [["b28"], []]);
});

test("každá značka s tabulkou z dat jde v Návrhu vybrat jako vlastní položka a její soubory existují", async () => {
  const { SIGN_CHOICES, signChoice, signLabel, SIGNS, PLATES } = await import("../pilot/public/signs.js");
  const { existsSync } = await import("node:fs");
  // What the data make with a plate: zones and bans of the street, the parts' own signs.
  const made = [
    ...streetSigns({ highway: "pedestrian", bicycle: "yes" }), ...streetSigns({ highway: "residential", access: "destination" }),
    ...streetSigns({ highway: "residential", motor_vehicle: "destination" }),
    ...deriveSigns({ segments: [{ type: "bus_cyklo" }, { type: "parkovani", source: "tsk", orient: "podelne" }, { type: "parkovani", source: "tsk", orient: "kolme" },
      { type: "parkovani", source: "tsk", orient: "sikme" }, { type: "pruh" }] }, { highway: "residential", oneway: "yes", "oneway:bicycle": "no" }).segments.flatMap((s) => s.signs || []),
  ].filter((x) => x.plate);
  assert.ok(made.length >= 8);
  for (const x of made) assert.ok(signChoice(x), `${x.k}+${x.plate} chybí v SIGN_CHOICES`);
  for (const [key, c] of Object.entries(SIGN_CHOICES)) {
    assert.equal(key, `${c.k}+${c.plate}`);
    assert.ok(SIGNS[c.k] && PLATES[c.plate], key);
    assert.equal(signLabel(c), c.label);
    for (const dir of ["forward", "backward"]) {
      for (const f of [signFile(c, { dir }), plateFile(c, { dir })].filter(Boolean)) assert.ok(existsSync(`pilot/public/znacky/${f}.svg`), `${key}: ${f}.svg`);
    }
  }
  // Labelled as drawn: the manner of parking is IP 11b or IP 11c, not "IP 11a".
  assert.equal(signLabel({ k: "ip11a", plate: "kolme" }), "IP 11b Parkoviště (kolmé stání)");
  assert.equal(signLabel({ k: "ip11a" }), "IP 11a Parkoviště");
});
