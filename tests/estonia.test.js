// Estonia (Bára 23. 11. 2026): the state, the orthophoto's TMS tiles, ETAK's buildings, the In-ADS search, the signs
// (countries/EE.js). No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Estonsko: dlaždice ortofota v TMS (osa y odspodu)", async () => {
  const L = await import("../app/public/lanes-ortho.js");
  assert.match(L.EE_ORTHO, /^https:\/\/tiles\.maaamet\.ee\/tm\/tms\/1\.0\.0\/foto@GMC$/);
});

test("Estonsko: budovy ETAK (výška k hřebeni, podlaží z OSM mají přednost)", async () => {
  const E = await import("../app/public/towns/estonia.js");
  // Skutečné hodnoty tyyp_tekst (WFS e_401_hoone_ka, Kalamaja a Nõmme 24. 11. 2026).
  assert.deepEqual(E.etakBuilding({ korgus_m: 12, tyyp_tekst: "Elu- või ühiskondlik hoone" }), { type: undefined, etak: true, cornice: 3, total: 3, roof: 0, fromHeight: true, height: 12 });
  assert.equal(E.etakBuilding({ korgus_m: 15, tyyp_tekst: "Elu- või ühiskondlik hoone" }).cornice, 4, "15 m k hřebeni: 4 podlaží, ne 5");
  assert.equal(E.etakBuilding({ korgus_m: 8, tyyp_tekst: "Kõrval- või tootmishoone" }).type, "industrial");
  assert.deepEqual(E.etakBuilding({ korgus_m: 3, tyyp_tekst: "Kõrval- või tootmishoone" }), { garage: true, etak: true }, "kůlna nebo garáž, ne hala");
  assert.deepEqual(E.etakBuilding({ korgus_m: 6, tyyp_tekst: "Vare" }), {}, "zřícenina");
  assert.deepEqual(E.etakBuilding({ korgus_m: 1, tyyp_tekst: "Vundament" }), {}, "základy");
  assert.deepEqual(E.etakBuilding({}), { type: undefined, etak: true });
  assert.equal(E.etakFloors(31), 9);
});

test("Estonsko: mapa povrchů Tallinnu jen s ulicí pod středem řezu", async () => {
  const E = await import("../app/public/towns/estonia.js");
  const sq = [[[0, 0], [1, 0], [1, 1], [0, 0]]];
  const t = E.tallinnFeatures([[701, { features: [{ geometry: { type: "MultiPolygon", coordinates: [sq, sq] } }] }], [702, { features: [{ geometry: { type: "Polygon", coordinates: sq } }] }]]);
  assert.deepEqual(t.features.map((f) => f.attributes.code), [701, 701, 702], "mapa povrchů Tallinnu: multipolygon po polygonech");
  assert.equal(E.TALLINN_LAYERS[36], 701);
  assert.deepEqual(await E.sources.surfaces("26.72,58.37,26.73,58.38"), { features: [], abroad: true }, "mimo Tallinn nic");
  // A box of about 10 m round the cut's centre (59.437, 24.7536): a roadway, a sidewalk, a yard under it.
  const [cx, cy] = [24.7536, 59.437], box = (d) => [[[cx - d, cy - d], [cx + d, cy - d], [cx + d, cy + d], [cx - d, cy + d], [cx - d, cy - d]]];
  const f = (code) => [{ attributes: { CTVUK_KOD: code }, geometry: { rings: box(0.0001) } }];
  assert.ok(E.hasStreet(f(701), cx, cy, { highway: "secondary" }), "vozovka pod ulicí pro auta");
  assert.ok(!E.hasStreet(f(702), cx, cy, { highway: "residential" }), "chodník pod ulicí pro auta nestačí");
  assert.ok(!E.hasStreet(f(704), cx, cy, { highway: "residential" }), "dvůr pod ulicí pro auta nestačí");
  assert.ok(E.hasStreet(f(704), cx, cy, { highway: "service" }), "obslužná cesta přes dvůr");
  assert.ok(E.hasStreet(f(702), cx, cy, { highway: "footway" }), "chodník pod pěší cestou");
  const far = [{ attributes: { CTVUK_KOD: 701 }, geometry: { rings: [[[cx + 0.0002, cy], [cx + 0.0003, cy], [cx + 0.0003, cy + 0.0001], [cx + 0.0002, cy]]] } }];
  assert.ok(!E.hasStreet(far, cx, cy, { highway: "secondary" }), "vozovka 11 m vedle nestačí");
});

test("Estonsko: hledání In-ADS nad nahranou odpovědí služby", async () => {
  const S = await import("../app/public/search-ee.js");
  const rec = JSON.parse(fs.readFileSync(new URL("fixtures/estonia-inads.json", import.meta.url), "utf8"));
  // Jen druhy, které služba přijímá (24. 11. 2026: LIIKLUSPIND, ASUSTUSYKSUS, OMAVALITSUS, ASUSTUS, ASULA → 400).
  const url = new URL(S.eeUrl("Narva mnt 10 Tallinn"));
  assert.deepEqual(url.searchParams.get("features").split(",").sort(), ["EHAK", "EHITISHOONE", "TANAV"]);
  for (const v of url.searchParams.get("features").split(",")) assert.ok(["EHITISHOONE", "TANAV", "EHAK", "EHITIS", "KATASTRIYKSUS"].includes(v), v);
  const got = [];
  assert.deepEqual(await S.findEe("Na", async () => { throw new Error("nemá se ptát"); }), []);
  const items = await S.findEe("Narva mnt 10 Tallinn", async (u) => { got.push(u); return rec.responses["Narva mnt 10 Tallinn"]; });
  assert.equal(got.length, 1);
  assert.deepEqual(items.map((x) => [x.text, x.type]).slice(0, 1), [["Narva mnt 10, Kesklinna linnaosa, Tallinn", "AdresniMisto"]]);
  const street = S.parseEe(rec.responses["Riia tänav Tartu"]);
  assert.deepEqual([street[0].text, street[0].type, street[0].at.street], ["Riia tn, Tartu linn", "Ulice", "Riia tn"], "obec, která je i městem, jednou");
  const town = S.parseEe(rec.responses["Tartu linn"]);
  assert.deepEqual([town[0].text, town[0].type], ["Tartu linn", "Obec"], "EHAK je obec");
  const county = S.parseEe(rec.responses["Tartu maakond"]);
  assert.deepEqual([county[0].text, county[0].type], ["Tartu maakond", "Obec"], "kraj sám sebou, ne prázdný text");
  for (const r of Object.values(rec.responses)) for (const it of S.parseEe(r)) assert.ok(it.text.trim(), "žádný prázdný název");
  assert.ok(S.looksEstonian("Pärnu mnt 5") && S.looksEstonian("Rüütli tänav") && S.looksEstonian("Tõnismägi") && !S.looksEstonian("Karlova 5"));
  for (const q of ["Köln Müllerstraße", "Hämeentie 5", "Väderstad", "Bratislava Mäsiarska"]) assert.ok(!S.looksEstonian(q), q);
});

test("Estonsko: značky a normy", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const EE = COUNTRIES.EE, f = EE.signs.file;
  assert.equal(f({ k: "oneway", dir: "forward" }), "521");
  assert.equal(f({ k: "oneway", dir: "forward", plate: "protismer" }), "521-plus-836");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), "331-plus-891a-kolo");
  assert.equal(f({ k: "ip20a", plate: "kolo" }), "525b");
  assert.equal(f({ k: "b1", plate: "obsluha" }), null, "tabulka mimo dopravní obsluhy chybí");
  assert.equal(EE.signs.label({ k: "b29" }, null, "B 29 Zákaz stání"), "362 Zákaz stání");
  assert.equal(EE.signs.label({ k: "oneway", dir: "backward", plate: "protismer" }, null, "Zákaz vjezdu"), "331 + 891a Zákaz vjezdu");
  assert.equal(f({ k: "ip15a" }), null, "silnici pro motorová vozidla Estonsko nemá");
  assert.equal(EE.limits({ type: "chodnik" }).min, 1.5);
  // Druhá ruka jen oranžově (recenze 24. 11. 2026, jako Litva).
  for (const type of ["cyklopruh", "bus", "pruh"]) assert.equal(EE.limits({ type }).min, 0, type);
  assert.equal(EE.limits({ type: "pruh", roadClass: "mk2" }).zaklad, 3, "hlavní ulice 3 m");
  assert.equal(EE.limits({ type: "pruh", roadClass: "mk4" }).zaklad, 2.75, "místní ulice výjimečně 2,75 m");
  assert.equal(f({ k: "c10a", walk: "left" }), "434");
  assert.equal(f({ k: "c10a" }), "433");
  assert.equal(EE.signs.label({ k: "c10a", walk: "left" }, null, "C 10a Stezka"), "434 Stezka");
  assert.equal(EE.signs.label({ k: "oneway" }, null, "IP 4b Jednosměrný provoz"), "521 / 331 Jednosměrný provoz", "bez směru obě čísla");
  assert.equal(EE.limits({ type: "parkovani", orient: "kolme" }), null);
  assert.equal(EE.laneOrtho, "ee");
});
