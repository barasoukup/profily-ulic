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
  // The review of 23. 11. 2026: Mareterra (reclaimed land beyond GISCO's coast) and the Boulevard du Général Leclerc
  // are Monaco, Beausoleil and Cap-d'Ail France, Gibraltar and Andorra abroad; the quays of Barcelona, Lisbon, Funchal and
  // the village of La Restinga within the coast's tolerance.
  for (const [lat, lon, id] of [[43.7445, 7.43, "monaco"], [43.7365, 7.427, "monaco"], [43.742, 7.423, "france"], [43.724, 7.406, "france"],
    [36.1408, -5.3536, "cizina"], [36.147, -5.36, "cizina"], [42.5063, 1.5218, "cizina"], [41.3755, 2.183, "spain"], [27.643, -17.981, "spain"],
    [38.71, -9.125, "portugal"], [32.6455, -16.905, "portugal"]]) assert.equal(C.cityAt(lat, lon), id, `${lat},${lon}`);
  assert.equal(C.cityAt(43.7556, 7.4296), "france"); // Beausoleil
  assert.equal(C.cityAt(43.7225, 7.4050), "france"); // Cap-d'Ail
  const MC = C.countryOfCity("monaco");
  assert.equal(MC.code, "MC");
  assert.equal(MC.laneOrtho, "fr");
  assert.equal(MC.parkGuess, false, "čl. 31: stání jen na vyznačených místech");
  assert.equal(MC.limits({ type: "chodnik", width: 0.5 }, []), null);
  assert.equal(MC.signs.file({ k: "b29" }), "B6a1", "kresby francouzských značek");
  assert.equal(MC.signs.label({ k: "b29" }, null, "B 29 Zákaz stání"), "Zákaz stání", "bez francouzských čísel");
  // Not the French signs Monaco's code does not know (the review of 23. 11. 2026, Bára): zone 30, zone de rencontre,
  // voie verte, motorway; speeds only 30, 50, 70 (art. 11); the aire piétonne stays.
  for (const k of ["zona30", "ip26a", "sdilena", "c9a", "ip14a", "ip15a", "c7a"]) assert.equal(MC.signs.file({ k }), null, k);
  assert.equal(MC.signs.file({ k: "oneway", dir: "backward", plate: "protismer" }), null, "double sens cyclable kodex nezná");
  assert.equal(MC.signs.file({ k: "ip27a" }), "B54");
  assert.deepEqual([30, 50, 70, 80, 110].map((v) => MC.signs.file({ k: "b20a", v })), ["B14-30", "B14-50", "B14-70", null, null]);
  // A living street with 20 km/h: no zone sign, so its speed is drawn (and the town's 50 is not).
  const { deriveSigns, signFile } = await import("../pilot/public/signs.js");
  const lanes = () => ({ segments: [{ type: "pruh", dir: "backward" }, { type: "pruh" }] });
  assert.deepEqual(deriveSigns(lanes(), { highway: "living_street", maxspeed: "20" }, { country: "MC" }).segments[1].signs?.map((x) => signFile(x, null, "MC")) ?? [], [], "20 km/h: B14-20 Monako nemá");
  assert.deepEqual(deriveSigns(lanes(), { highway: "residential", "zone:maxspeed": "FR:30", maxspeed: "30" }, { country: "MC" }).segments[1].signs?.map((x) => signFile(x, null, "MC")), ["B14-30"]);
});
