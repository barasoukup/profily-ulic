// The furniture of North America (pilot/public/northamerica/, Bára 25. 11. 2026): the USA draws it, Washington its own
// lamp and stop; every file of both sets exists.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (f) => JSON.parse(fs.readFileSync(new URL(`../pilot/public/${f}`, import.meta.url), "utf8"));

test("USA kreslí severoamerický mobiliář, Washington svou lampu a označník", async () => {
  const C = await import("../pilot/public/city.js");
  const P = await import("../pilot/public/profile.js");
  C.loadBounds(read("mesta.json")); C.loadStates(read("staty.json")); C.loadTowns(read("mesta-us.json"));
  // The White House and Southern Avenue are Washington, Silver Spring and Arlington the rest of the metro.
  assert.equal(C.cityAt(38.8977, -77.0365), "washington");
  for (const [lat, lon] of [[38.9907, -77.0261], [38.8816, -77.091]]) assert.equal(C.cityAt(lat, lon), "usa");
  const art = (id) => P.artSet(C.cityById(id).art);
  assert.equal(C.countryOfCity("washington").code, "US");
  assert.equal(art("usa")["lamp-modern-left"], "../northamerica/lamp-left");
  assert.equal(art("usa")["reeds-left"], "../cesko/rakos-left");
  assert.equal(art("washington")["lamp-modern-left"], "lamp-left");
  assert.equal(art("washington")["bench-center"], "../northamerica/bench-center");
  for (const id of ["usa", "washington"]) for (const f of Object.values(art(id))) {
    assert.ok(fs.existsSync(new URL(`../pilot/public/${id}/${f}.svg`.replace(`${id}/../`, ""), import.meta.url)), `${id} ${f}`);
  }
});
