// The app in German (Bára 16. 11. 2026), as a visitor with ?lang=de gets it: the modules read the language once,
// when they load, so this file runs alone in its process with it set before any of them loads. The language is not
// the state: on a cut in Czechia the signs, rules and data stay Czech, only their words are German.
import { test } from "node:test";
import assert from "node:assert/strict";
import { languageSuite } from "./helpers/language-suite.js";

globalThis.PROFILY_LANG = "de";

languageSuite({
  labels: { chodnik: "Gehweg", cyklopruh: "Radfahrstreifen", odhad: "Schätzung", walking: "Fußverkehr" },
  rule: "Gehweg 1,40 m liegt unter dem Mindestmaß (Gehweg: an Engstellen mind. 1,5 m, Regelmaß 2–2,5 m).",
  brno: {
    dataName: "Technische Karte (Brünn)",
    outage: "Technische Karte (Brünn) antwortet gerade nicht, der Querschnitt ist nur eine Schätzung aus OSM. Klicken Sie in Kürze erneut.",
  },
  cesko: {
    data: "Daten: Technische Karte © Pardubický kraj, IS DMVS ČÚZK, RÚIAN © ČÚZK, 2026 (CC BY 4.0, bearbeitet) · Luftbild © ČÚZK, 2025 (CC BY 4.0) · © OpenStreetMap-Mitwirkende (ODbL)",
    art: /^Illustrationen © Streetmix/,
  },
  // The city's credit starts with "Daten ©": said once (the Bulgarian critic, 17. 11. 2026).
  credits: { praha: /^Daten: © IPR Praha/ },
  signs: [
    [{ k: "b20a", v: 30 }, "B 20a Zulässige Höchstgeschwindigkeit 30 km/h"],
    [{ k: "b1", plate: "obsluha" }, "B 1 + E 13 Verbot für Fahrzeuge aller Art, Anlieger frei"],
  ],
});

test("značky: v Česku česká čísla a české značky, jen slova německy", async () => {
  const { setCity, city } = await import("../app/public/city.js");
  const { signDir } = await import("../app/public/signs.js");
  setCity("praha");
  assert.equal(city.country, "CZ");
  assert.equal(signDir(city.country), "signs-CZ");
});
