// The neutral tram and bus (app/public/generic/, Bára 17. 11. 2026): drawn wherever a city or state has no vehicle of
// its own; the cities with their own keep them.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("místa bez vlastních vozidel kreslí neutrální tramvaj a autobus, vlastní zůstávají", async () => {
  const P = await import("../app/public/profile.js");
  const C = await import("../app/public/city.js");
  const art = (id) => P.artSet(C.cityById(id).art);
  for (const id of ["cesko", "cizina", "germany", "austria", "frydek-mistek"]) {
    assert.equal(art(id)["streetcar-inbound"], "../generic/tram-inbound", id);
    assert.equal(art(id)["bus-outbound"], "../generic/bus-outbound", id);
  }
  // Own vehicles stay.
  for (const [id, tram, bus] of [["praha", "t3-inbound", "bus-inbound"], ["brno", "t3-inbound", "bus-inbound"], ["most", "tram-inbound", "bus-inbound"],
    ["wien", "tram-inbound", "bus-inbound"], ["bratislava", "tram-inbound", "bus-inbound"], ["olomouc", "tram-inbound", "bus-inbound"]]) {
    assert.equal(art(id)["streetcar-inbound"], tram, id);
    assert.equal(art(id)["bus-inbound"], bus, id);
  }
  // A town with its own bus but no tram, and Slovakia's own generic bus.
  assert.equal(art("jihlava")["bus-inbound"], "bus-inbound");
  assert.equal(art("jihlava")["streetcar-inbound"], "../generic/tram-inbound");
  assert.equal(art("slovensko")["bus-inbound"], "bus-inbound");
  // Trolleybuses are not made generic.
  assert.equal(art("cesko")["trolleybus-inbound"], undefined);
  // Every vehicle file of every set exists.
  for (const id of C.CITY_IDS) {
    const a = C.cityById(id).art, set = P.artSet(a);
    for (const k of ["streetcar-inbound", "streetcar-outbound", "bus-inbound", "bus-outbound"]) {
      if (!set?.[k]) continue;
      assert.ok(fs.existsSync(new URL(`../app/public/${a}/${set[k]}.svg`, import.meta.url)), `${id} ${k}`);
    }
  }
});
