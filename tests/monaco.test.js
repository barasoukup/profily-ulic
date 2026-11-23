// Monaco (Bára 23. 11. 2026): France's settings with Monaco's own law (countries/MC.js), the border of OSM. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Monako: stát podle hranic OSM, francouzské ortofoto, bez odhadu stání a bez norem šířek", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8")));
  assert.equal(C.cityAt(43.7447, 7.4310), "monaco"); // Monte-Carlo
  assert.equal(C.cityAt(43.7310, 7.4190), "monaco"); // Monaco-Ville
  assert.equal(C.cityAt(43.7556, 7.4296), "france"); // Beausoleil
  assert.equal(C.cityAt(43.7225, 7.4050), "france"); // Cap-d'Ail
  const MC = C.countryOfCity("monaco");
  assert.equal(MC.code, "MC");
  assert.equal(MC.laneOrtho, "fr");
  assert.equal(MC.parkGuess, false, "čl. 31: stání jen na vyznačených místech");
  assert.equal(MC.limits({ type: "chodnik", width: 0.5 }, []), null);
  assert.equal(MC.signs.file({ k: "b29" }), "B6a1", "kresby francouzských značek");
  assert.equal(MC.signs.label({ k: "b29" }, null, "B 29 Zákaz stání"), "Zákaz stání", "bez francouzských čísel");
});
