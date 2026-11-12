// The app in English (Bára 12. 11. 2026), as a visitor with ?lang=en gets it: the modules read the language once,
// when they load, so this file runs alone in its process with it set before any of them loads.
import { test } from "node:test";
import assert from "node:assert/strict";

globalThis.PROFILY_LANG = "en";
const { TYPES, SOURCES } = await import("../pilot/public/types.js");
const { checkRules } = await import("../pilot/public/rules.js");
const { setCity, creditLines, city } = await import("../pilot/public/city.js");
const { outage } = await import("../pilot/public/sources.js");
const { signLabel } = await import("../pilot/public/signs.js");
const { shares } = await import("../pilot/public/shares.js");

const CZECH = /[ěščřžůňťďáíéýú]/i;

test("popisky částí, zdrojů a podílů", () => {
  assert.equal(TYPES.chodnik.label, "Pavement");
  assert.equal(TYPES.cyklopruh.label, "Cycle lane");
  assert.equal(SOURCES.odhad.label, "estimate");
  for (const [k, v] of Object.entries(TYPES)) assert.doesNotMatch(v.label, CZECH, k);
  assert.deepEqual(shares({ segments: [{ type: "chodnik", width: 3 }] }).map((g) => g.label)[0], "Walking");
});

test("normy: anglicky, s desetinnou tečkou", () => {
  const out = checkRules({ segments: [{ type: "chodnik", width: 1.4 }, { type: "pruh", width: 3 }] });
  assert.equal(out[0].text, "Pavement 1.40 m is below the minimum (pavement: narrowed min. 1.5 m, standard 2–2.5 m).");
});

test("výpadky zdrojů a texty měst", () => {
  setCity("brno");
  assert.equal(city.dataName, "The Brno technical map");
  const no = { status: "rejected", reason: new Error("503") }, ok = { status: "fulfilled", value: { features: [] } };
  assert.equal(outage({ surfaces: no, lines: ok, parking: ok }).text,
    "The Brno technical map is not responding right now, the profile is only an estimate from OSM. Try clicking again in a moment.");
  setCity("praha");
  assert.match(outage({ surfaces: no, lines: ok, parking: ok }).text, /^The IPR technical map is not responding right now \(the server is overloaded\)/);
  // A town with only its own vehicles takes the national texts.
  setCity("olomouc");
  assert.equal(city.server, "ČÚZK technical map");
});

test("kredity exportu", () => {
  const [data, art] = creditLines(setCity("cesko"), { region: "Pardubický kraj", ortho: true });
  assert.equal(data, "Data: technical map © Pardubický kraj, IS DMVS ČÚZK, RÚIAN © ČÚZK, 2026 (CC BY 4.0, modified) · orthophoto © ČÚZK, 2025 (CC BY 4.0) · © OpenStreetMap contributors (ODbL)");
  assert.match(art, /^Illustrations © Streetmix/);
  assert.match(creditLines(setCity("brno"))[0], /^Data: © Statutární město Brno \(technical map and MTVU/);
});

test("značky: anglický popis, česká čísla", () => {
  assert.equal(signLabel({ k: "b20a", v: 30 }), "B 20a Speed limit 30 km/h");
  assert.equal(signLabel({ k: "b1", plate: "obsluha" }), "B 1 + E 13 No vehicles except for access");
  assert.equal(signLabel({ k: "ip27a", plate: "kola" }), "IZ 6a Pedestrian zone with cyclists");
});
