// Monaco (Bára 23. 11. 2026): France's settings with Monaco's own law (countries/MC.js), the border of OSM. No network.
import { test } from "node:test";
import assert from "node:assert/strict";

test("Monako: francouzské ortofoto, bez odhadu stání a bez norem šířek, jen značky, které kodex zná", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const MC = COUNTRIES.MC;
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
  const { deriveSigns, signFile } = await import("../app/public/signs.js");
  const lanes = () => ({ segments: [{ type: "pruh", dir: "backward" }, { type: "pruh" }] });
  assert.deepEqual(deriveSigns(lanes(), { highway: "living_street", maxspeed: "20" }, { country: "MC" }).segments[1].signs?.map((x) => signFile(x, null, "MC")) ?? [], [], "20 km/h: B14-20 Monako nemá");
  assert.deepEqual(deriveSigns(lanes(), { highway: "residential", "zone:maxspeed": "FR:30", maxspeed: "30" }, { country: "MC" }).segments[1].signs?.map((x) => signFile(x, null, "MC")), ["B14-30"]);
});
