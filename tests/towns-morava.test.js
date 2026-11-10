// The Moravian towns connected on 10. 11. 2026 (Ostrava, Frýdek-Místek, Karviná, Třebíč, Přerov): the S-JTSK
// conversion of Přerov's vector tiles, the kinds of the T-MAPY road passport, and a cut taking its town.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const { toWgs, fromWgs } = await import("../pilot/public/towns/sjtsk.js");
test("S-JTSK → WGS 84 (EPSG 1623) jako PROJ a zpět", () => {
  // gdaltransform with +towgs84=570.8,85.7,462.8,4.998,1.587,5.261,3.56
  const [lon, lat] = toWgs(-467360.44, -1120301.7);
  assert.ok(Math.abs(lon - 18.3495256308) < 1e-8 && Math.abs(lat - 49.6701646879) < 1e-8);
  const [x, y] = fromWgs(17.4498, 49.4548, [-534350, -1138260]);
  const back = toWgs(x, y);
  assert.ok(Math.abs(back[0] - 17.4498) < 1e-9 && Math.abs(back[1] - 49.4548) < 1e-9);
});

const { pakomCode } = await import("../pilot/public/towns/frydek-mistek.js");
test("pasport komunikací Frýdku-Místku na kódy MTVU", () => {
  assert.equal(pakomCode({ typ: "místní komunikace (MKa,MKb,MKc)" }), 701);
  assert.equal(pakomCode({ typ: "zpevněná plocha (příjezd z vozovky)" }), 701);
  assert.equal(pakomCode({ typ: "zpevněná plocha (příjezd přes chodník)" }), 702);
  assert.equal(pakomCode({ typ: "chodník podél MK (MKd)" }), 702);
  assert.equal(pakomCode({ typ: "cyklostezka" }), 703);
  assert.equal(pakomCode({ typ: "plocha pod kontejnery" }), 1003);
});

test("řez v moravských městech dostane své město", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  assert.equal(C.cityAt(49.8355, 18.2924), "ostrava");
  assert.equal(C.cityAt(49.6837, 18.3504), "frydek-mistek");
  assert.equal(C.cityAt(49.8542, 18.542), "karvina");
  assert.equal(C.cityAt(49.215, 15.8799), "trebic");
  assert.equal(C.cityAt(49.4555, 17.451), "prerov");
  assert.equal(C.cityAt(49.7787, 18.4372), "cesko"); // Havířov
  const { TOWNS } = await import("../pilot/public/towns/index.js");
  for (const id of ["ostrava", "frydek-mistek", "karvina", "trebic", "prerov"]) {
    assert.ok(TOWNS[id]?.sources?.surfaces, id);
    assert.equal(C.setCity(id).id, id);
  }
  C.setCity("praha");
});
