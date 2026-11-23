// Slovenia (Bára 23. 11. 2026): the state and its borders, GURS's orthophoto, the buildings of the cadastre, the address
// search, the signs and the norms (countries/SI.js). No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Slovinsko: stát řezu a sousedé u hranice", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8")));
  // Ljubljana, Maribor, Koper, Nova Gorica, Šentilj, Obrežje, Piran
  for (const [lat, lon] of [[46.0514, 14.5058], [46.558, 15.646], [45.548, 13.73], [45.956, 13.648], [46.681, 15.65], [45.849, 15.682], [45.528, 13.568]]) assert.equal(C.cityAt(lat, lon), "slovenia", `${lat},${lon}`);
  // Gorizia, Trieste, Spielfeld, Bregana, Zagreb, Umag
  for (const [lat, lon] of [[45.94, 13.62], [45.649, 13.777], [46.708, 15.636], [45.839, 15.7], [45.813, 15.977], [45.434, 13.521]]) assert.notEqual(C.cityAt(lat, lon), "slovenia", `${lat},${lon}`);
  assert.equal(C.cityAt(46.708, 15.636), "austria");
});

test("Slovinsko: ortofoto GURS DOF025 ve Web Mercatoru", async () => {
  const L = await import("../pilot/public/lanes-ortho.js");
  const u = new URL(L.SI_ORTHO([1614700, 5790900, 1614775, 5790975], 300, 300));
  assert.equal(u.origin + u.pathname, "https://ipi.eprostor.gov.si/wms-si-gurs-dts/wms");
  assert.equal(u.searchParams.get("LAYERS"), "SI.GURS.ZPDZ:DOF025_3857");
  assert.equal(u.searchParams.get("CRS"), "EPSG:3857");
});

test("Slovinsko: budovy katastru GURS", async () => {
  const S = await import("../pilot/public/towns/slovenia.js");
  const json = JSON.parse(fs.readFileSync(new URL("./fixtures/gurs-stavbe.json", import.meta.url), "utf8"));
  // Ajdovščina, Ljubljana: 8 floors with the ground floor the third (two below it), built 1622, brick.
  assert.deepEqual(S.gursPick(json, 46.0519, 14.5055), { built: 1622, solid: true, house: undefined, type: "apartments", cornice: 6, total: 6, roof: 0, height: 21.2, gurs: true });
  assert.deepEqual(S.gursBuilding({ STEVILO_ETAZ: 2, STEVILKA_PRITL_ETAZE: 1, LETO_IZGRADNJE: 1975, STEVILO_STANOVANJ: 1, NOSILNE_KONSTRUKCIJE_NAZIV_SL: "beton, železobeton" }),
    { built: 1975, solid: undefined, house: true, type: "house", cornice: 2, total: 2, roof: 0 });
  assert.deepEqual(S.gursBuilding({}), { built: undefined, solid: undefined, house: undefined, type: undefined });
  assert.deepEqual(S.gursPick({ features: [] }, 46, 14), {});
  // The nearest outline within 6 m when the point lies in none.
  const near = { features: [{ geometry: { type: "Polygon", coordinates: [[[14.50004, 46], [14.5001, 46], [14.5001, 46.0001], [14.50004, 46.0001], [14.50004, 46]]] }, properties: { STEVILO_ETAZ: 3, STEVILKA_PRITL_ETAZE: 1 } }] };
  assert.equal(S.gursNearest(near, 46.00005, 14.5).total, 3);
  assert.deepEqual(S.gursNearest(near, 46.00005, 14.4998), {});
  const u = new URL(S.gursUrl(46.05, 14.5));
  assert.equal(u.searchParams.get("TYPENAMES"), "SI.GURS.KN:STAVBE");
  assert.match(u.searchParams.get("FILTER"), /<fes:ValueReference>OBRIS_GEOM<\/fes:ValueReference>/);
  assert.ok(!/LASTNI|OSEB/.test(u.searchParams.get("PROPERTYNAME")), "žádné údaje o vlastnících");
});

test("Slovinsko: podkroví podle výšky katastru GURS", async () => {
  const S = await import("../pilot/public/towns/slovenia.js");
  const fx = JSON.parse(fs.readFileSync(new URL("./fixtures/gurs-podkrovi.json", import.meta.url), "utf8"));
  const floors = (id) => { const b = S.gursBuilding(fx[id].properties); return [b.cornice, b.roof, b.total, b.height, b.roofType]; };
  // The height above the entrance (H2 − H3): 3 floors in 9.9 m cannot all stand under a roof, the top one is the attic.
  assert.deepEqual(floors("lj12-left"), [2, 1, 3, 9.9, 1]);
  assert.deepEqual(floors("ma11-right"), [1, 1, 2, 7.9, 1]);
  // Full floors stay full: 5 floors (more than 4) and a modern house of 3 floors in 11.1 m.
  assert.deepEqual(floors("ma2-left"), [5, 0, 5, 19.9, undefined]);
  assert.deepEqual(floors("lj13-right"), [3, 0, 3, 11.1, undefined]);
  // An attic the rule misses (8.4 m for 2 floors): the heights overlap (ab/ZPRAVA.md).
  assert.deepEqual(floors("ma3-right"), [2, 0, 2, 8.4, undefined]);
  // Without H3 the height counts from H1 (the lowest floor); without either there is no height and no attic.
  assert.equal(S.gursBuilding({ ...fx["lj12-left"].properties, VISINA_H3: null }).height, 12.3);
  assert.deepEqual(floors("lj12-left").slice(0, 3), [2, 1, 3]);
  assert.equal(S.gursBuilding({ ...fx["lj12-left"].properties, VISINA_H3: null, VISINA_H1: null }).roof, 0);
});

test("Slovinsko: hledání adres GURS", async () => {
  const S = await import("../pilot/public/search-si.js");
  assert.deepEqual(S.parseSiQuery("Trubarjeva cesta 5, Ljubljana"), { street: "Trubarjeva cesta", number: 5, extra: null, town: "Ljubljana" });
  assert.deepEqual(S.parseSiQuery("Glavni trg 14 Maribor"), { street: "Glavni trg", number: 14, extra: null, town: "Maribor" });
  assert.equal(S.parseSiQuery("Cesta 12a").extra, "A");
  assert.equal(S.parseSiQuery("Prešernov trg"), null);
  const items = S.parseSi({ features: [
    { geometry: { coordinates: [14.507, 46.052] }, properties: { ULICA_NAZIV: "Trubarjeva cesta", HS_STEVILKA: 5, HS_DODATEK: null, NASELJE_NAZIV: "Ljubljana" } },
    { geometry: { coordinates: [14.507, 46.052] }, properties: { ULICA_NAZIV: "Trubarjeva cesta", HS_STEVILKA: 5, HS_DODATEK: "A", NASELJE_NAZIV: "Ljubljana" } }] });
  assert.deepEqual(items.map((x) => x.text), ["Trubarjeva cesta 5, Ljubljana", "Trubarjeva cesta 5a, Ljubljana"]);
  assert.match(new URL(S.gursAddressUrl({ street: "Trub*<x>", number: 5, town: null })).searchParams.get("FILTER"), /<fes:Literal>Trubx\*<\/fes:Literal>/);
  assert.ok(S.looksSlovenian("Slovenska cesta 9") && !S.looksSlovenian("Karlova 5"));
});

test("Slovinsko: značky, normy, zákon o stání", async () => {
  const { COUNTRIES } = await import("../pilot/public/countries/index.js");
  const SI = COUNTRIES.SI, f = SI.signs.file;
  assert.equal(f({ k: "oneway", dir: "forward" }), "2407");
  assert.equal(f({ k: "oneway", dir: "backward" }), "2201");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), null, "zákaz vjezdu by platil i pro cyklisty");
  assert.equal(f({ k: "c10a" }), "2313-1");
  assert.equal(f({ k: "c10a", walk: "left" }), "2313");
  assert.equal(f({ k: "b1", plate: "obsluha" }), null);
  assert.equal(f({ k: "ip15a" }), null);
  assert.equal(f({ k: "ztp" }), null);
  assert.equal(SI.signs.label({ k: "b29" }, null, "B 29 Zákaz stání"), "2237 Zákaz stání");
  for (const k of ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ip14a", "ip20a", "zona30", "ip26a", "ip27a", "sdilena", "c8a", "c9a", "c10a", "c7a"]) {
    const file = f({ k });
    assert.ok(file && fs.existsSync(new URL(`../pilot/public/signs-SI/${file}.svg`, import.meta.url)), `${k}: ${file}`);
  }
  for (const v of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130]) assert.ok(fs.existsSync(new URL(`../pilot/public/signs-SI/2232-${v}.svg`, import.meta.url)), `${v}`);
  for (const file of fs.readdirSync(new URL("../pilot/public/signs-SI/", import.meta.url)).filter((x) => x.endsWith(".svg"))) {
    assert.match(fs.readFileSync(new URL(`../pilot/public/signs-SI/${file}`, import.meta.url), "utf8"), /viewBox=/, file);
  }
  assert.equal(SI.limits({ type: "chodnik" }, [], 0), null, "minimum chodníku nenalezeno");
  assert.equal(SI.limits({ type: "cyklopruh" }, [], 0).zaklad, 1.75);
  assert.equal(SI.limits({ type: "cyklostezka" }, [], 0).min, 2);
  assert.equal(SI.limits({ type: "parkovani", orient: "kolme" }, [], 0), null);
  assert.equal(SI.limits({ type: "pruh", roadClass: "residential" }, [], 0).zaklad, 2.5);
  assert.equal(SI.limits({ type: "chodnik" }, [{ type: "parkovani", position: "half_on_kerb" }, { type: "chodnik" }], 1).min, 1.6);
  // ZPrCP čl. 65/4: none on a two-way street without a centre line, none on a one-way carriageway of two lanes.
  assert.equal(SI.parkOnRoadway({ highway: "residential" }, false, 2), false);
  assert.equal(SI.parkOnRoadway({ highway: "residential", lanes: "2" }, false, 2), true);
  assert.equal(SI.parkOnRoadway({ highway: "residential", lanes: "2", lane_markings: "no" }, false, 2), false);
  assert.equal(SI.parkOnRoadway({ oneway: "yes" }, true, 1), true);
  assert.equal(SI.parkOnRoadway({ oneway: "yes" }, true, 2), false);
  assert.equal(SI.laneOrtho, "si");
  assert.equal(SI.socialistLooks, false);
});
