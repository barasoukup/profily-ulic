// Italy (Bára 23. 11. 2026): only where an orthophoto has an open licence (Bolzano, Turin, Bologna, Modena); Bologna's
// buildings; the signs (countries/IT.js). No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Itálie: jen oblasti s otevřeným ortofotem (bez AGEA), Vatikán a San Marino mimo", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8")));
  for (const [lat, lon] of [[44.4949, 11.3426], [44.6471, 10.9252], [45.0703, 7.6869], [46.4983, 11.3548], [46.6713, 11.159]]) assert.equal(C.cityAt(lat, lon), "italy", `${lat},${lon}`);
  for (const [lat, lon] of [[41.9028, 12.4964], [45.4642, 9.19], [41.1171, 16.8719], [41.9029, 12.4534], [43.9356, 12.4473]]) assert.equal(C.cityAt(lat, lon), "cizina", `${lat},${lon}`);
  const L = await import("../pilot/public/lanes-ortho.js");
  assert.deepEqual(L.itOrthoAt(11.3426, 44.4949), ["it-bo"]);
  assert.deepEqual(L.itOrthoAt(11.3548, 46.4983), ["it-bz"]);
  assert.deepEqual(L.itOrthoAt(12.4964, 41.9028), [], "Řím: jen AGEA");
});

test("Itálie: budovy Bologni (výška → podlaží), mapa povrchů vypnutá", async () => {
  const I = await import("../pilot/public/towns/italy.js");
  assert.deepEqual(I.bolognaBuilding({ altezza_gr: 19.2, descrizion: "Edificio generico" }), { type: undefined, cornice: 6, total: 6, roof: 0, height: 19.2 });
  assert.equal(I.bolognaBuilding({ altezza_gr: 25, descrizion: "Chiesa" }).type, "church");
  assert.deepEqual(I.bolognaBuilding({ altezza_gr: 6, descrizion: "Portico" }), {});
  assert.deepEqual(await I.sources.surfaces("11.340,44.492,11.345,44.495"), { features: [], abroad: true }, "bez ?bologna=1 nic");
  const roads = I.bolognaRoads([{ descrizion: "Tracciato principale in tronco", geo_shape: { geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } } },
    { descrizion: "Area di sovrapposizione tra strada e corso d'acqua", geo_shape: { geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } } }]);
  assert.equal(roads.features.length, 1);
});

test("Itálie: značky a normy", async () => {
  const { COUNTRIES } = await import("../pilot/public/countries/index.js");
  const IT = COUNTRIES.IT, f = IT.signs.file;
  assert.equal(f({ k: "oneway", dir: "forward" }), "II-349");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), "II-47-plus-II-4b");
  assert.equal(IT.signs.label({ k: "b29" }, null, "B 29 Zákaz stání"), "II.74 Zákaz stání");
  assert.equal(IT.signs.label({ k: "zona30" }, null, "IZ 8a Zóna s dopravním omezením"), "II.323/a Zóna s dopravním omezením");
  for (const k of ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ztp", "ip14a", "ip15a", "ip20a", "zona30", "ip26a", "ip27a", "c8a", "c9a", "c10a", "c7a"]) {
    const file = f({ k });
    assert.ok(file && fs.existsSync(new URL(`../pilot/public/signs-IT/${file}.svg`, import.meta.url)), `${k}: ${file}`);
  }
  for (const v of [10, 20, 30, 40, 50, 60, 70, 80]) assert.ok(fs.existsSync(new URL(`../pilot/public/signs-IT/II-50-${v}.svg`, import.meta.url)), `${v}`);
  assert.equal(IT.limits({ type: "chodnik" }).min, 0.9);
});
