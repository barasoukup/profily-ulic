// The app in German (Bára 16. 11. 2026), as a visitor with ?lang=de gets it: the modules read the language once,
// when they load, so this file runs alone in its process with it set before any of them loads. The language is not
// the state: on a cut in Czechia the signs, rules and data stay Czech, only their words are German.
import { test } from "node:test";
import assert from "node:assert/strict";

globalThis.PROFILY_LANG = "de";
const { TYPES, SOURCES } = await import("../pilot/public/types.js");
const { checkRules } = await import("../pilot/public/rules.js");
const { setCity, creditLines, city } = await import("../pilot/public/city.js");
const { outage } = await import("../pilot/public/sources.js");
const { signLabel, signDir } = await import("../pilot/public/signs.js");
const { shares } = await import("../pilot/public/shares.js");

const CZECH = /[ěščřžůňťďáíéýú]/i;

test("popisky částí, zdrojů a podílů", () => {
  assert.equal(TYPES.chodnik.label, "Gehweg");
  assert.equal(TYPES.cyklopruh.label, "Radfahrstreifen");
  assert.equal(SOURCES.odhad.label, "Schätzung");
  for (const [k, v] of Object.entries(TYPES)) assert.doesNotMatch(v.label, CZECH, k);
  assert.deepEqual(shares({ segments: [{ type: "chodnik", width: 3 }] }).map((g) => g.label)[0], "Fußverkehr");
});

test("normy: česká pravidla německy, s desetinnou čárkou", () => {
  setCity("praha");
  const out = checkRules({ segments: [{ type: "chodnik", width: 1.4 }, { type: "pruh", width: 3 }] });
  assert.equal(out[0].text, "Gehweg 1,40 m liegt unter dem Mindestmaß (Gehweg: eingeengt mind. 1,5 m, Regelmaß 2–2,5 m).");
});

test("výpadky zdrojů a texty měst", () => {
  setCity("brno");
  assert.equal(city.dataName, "Die technische Karte der Stadt Brno");
  const no = { status: "rejected", reason: new Error("503") }, ok = { status: "fulfilled", value: { features: [] } };
  assert.equal(outage({ surfaces: no, lines: ok, parking: ok }).text,
    "Die technische Karte der Stadt Brno antwortet gerade nicht, der Querschnitt ist nur eine Schätzung aus OSM. Klicken Sie in einem Moment erneut.");
  setCity("olomouc");
  assert.equal(city.server, "der technischen Karte des ČÚZK");
});

test("kredity exportu", () => {
  const [data, art] = creditLines(setCity("cesko"), { region: "Pardubický kraj", ortho: true });
  assert.equal(data, "Daten: technische Karte © Pardubický kraj, IS DMVS ČÚZK, RÚIAN © ČÚZK, 2026 (CC BY 4.0, bearbeitet) · Luftbild © ČÚZK, 2025 (CC BY 4.0) · © OpenStreetMap-Mitwirkende (ODbL)");
  assert.match(art, /^Illustrationen © Streetmix/);
});

test("značky: německý popis, česká čísla a české značky v Česku", () => {
  setCity("praha");
  assert.equal(city.country, "CZ");
  assert.equal(signDir(city.country), "znacky");
  assert.equal(signLabel({ k: "b20a", v: 30 }, city.country), "B 20a Zulässige Höchstgeschwindigkeit 30 km/h");
  assert.equal(signLabel({ k: "b1", plate: "obsluha" }, city.country), "B 1 + E 13 Verbot für Fahrzeuge aller Art, Anlieger frei");
});
