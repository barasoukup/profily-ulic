// The furniture of North America (app/public/northamerica/, Bára 25. 11. 2026): the USA draws it, Washington its own
// stop; every file of both sets exists.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadCities } from "./helpers/cities.js";
import "../app/public/america.js";

test("USA kreslí severoamerický mobiliář, Washington svůj označník, společnou lampu a do 5 m svůj glóbus", async () => {
  const P = await import("../app/public/profile.js");
  const C = await loadCities({ america: true, towns: ["towns-us.json"] });
  const art = (id) => P.artSet(C.cityById(id).art);
  assert.equal(art("usa")["lamp-modern-left"], "../northamerica/lamp-left");
  assert.equal(art("usa")["reeds-left"], "../cesko/reeds-left");
  // The shared cobra head is Washington's lamp too (Bára 25. 11. 2026); its globe is the lamp up to 5 m.
  assert.equal(art("washington")["lamp-modern-left"], "../northamerica/lamp-left");
  assert.equal(art("washington")["lamp-post-top"], "lamp-globe-left");
  assert.equal(art("usa")["lamp-post-top"], undefined);
  assert.equal(art("washington")["stop-post-left"], "stop-post-left");
  assert.equal(art("washington")["bench-center"], "../northamerica/bench-center");
  for (const id of ["usa", "washington"]) for (const f of Object.values(art(id))) {
    assert.ok(fs.existsSync(new URL(`../app/public/${id}/${f}.svg`.replace(`${id}/../`, ""), import.meta.url)), `${id} ${f}`);
  }
});

test("USA kreslí Metrobus, tramvaj neutrální; vozidla dalších měst mají soubory", async () => {
  const P = await import("../app/public/profile.js");
  const { NORTH_AMERICA_VEHICLES } = await import("../app/public/art.js");
  // Metrobus in the whole metro (WMATA runs in the suburbs too).
  assert.equal(P.artSet("washington")["bus-inbound"], "../washington/bus-inbound");
  assert.equal(P.artSet("washington")["streetcar-inbound"], "../generic/tram-inbound");
  assert.equal(P.artSet("usa")["bus-inbound"], "../washington/bus-inbound");
  const file = (town, f) => new URL(`../app/public/${town}/${f}.svg`, import.meta.url);
  for (const [town, map] of Object.entries(NORTH_AMERICA_VEHICLES)) for (const f of Object.values(map)) assert.ok(fs.existsSync(file(town, f)), `${town}/${f}`);
  for (const f of ["bus-inbound", "bus-outbound"]) assert.ok(fs.existsSync(file("washington", f)));
});
