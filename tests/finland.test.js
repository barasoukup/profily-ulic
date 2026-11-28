// Finland (Bára 23. 11. 2026): the state and its borders (Åland in), the towns' orthophotos only in their towns,
// Helsinki's register of public areas YLRE, the buildings of Helsinki and Ryhti, the address search, the signs and the
// norms (countries/FI.js). No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const fixture = (f) => JSON.parse(fs.readFileSync(new URL(`./fixtures/${f}`, import.meta.url), "utf8"));

test("Finsko: ortofoto jen v Helsinkách, Espoo a Turku", async () => {
  const L = await import("../app/public/lanes-ortho.js");
  assert.deepEqual(L.fiOrthoAt(24.938, 60.1695), ["fi-hki"]);
  assert.deepEqual(L.fiOrthoAt(24.805, 60.176), ["fi-esp"]);
  assert.deepEqual(L.fiOrthoAt(22.268, 60.451), ["fi-tku"]);
  for (const [lon, lat] of [[23.76, 61.498], [25.465, 65.012], [19.935, 60.097]]) assert.deepEqual(L.fiOrthoAt(lon, lat), [], `${lon},${lat}`);
  const u = new URL(L.FI_ORTHO["fi-hki"].url([2776000, 8437000, 2776080, 8437080], 800, 800));
  assert.equal(u.origin + u.pathname, "https://kartta.hel.fi/ws/geoserver/avoindata/wms");
  assert.equal(u.searchParams.get("LAYERS"), "avoindata:Ortoilmakuva_2026_5cm");
  assert.equal(u.searchParams.get("CRS"), "EPSG:3857");
  assert.equal(new URL(L.FI_ORTHO["fi-tku"].url([0, 0, 1, 1], 1, 1, "image/png")).searchParams.get("TRANSPARENT"), "TRUE");
  // Outside the towns laneImage asks nothing (the estimate from OSM).
  const frame = { toLonLat: () => [23.76, 61.498] };
  assert.equal(await L.laneImage({ source: "fi", frame, dir: [1, 0], t0: -10, t1: 10, fetchImpl: () => { throw new Error("no request"); } }), null);
});

test("Finsko: mapa povrchů Helsinek (YLRE)", async () => {
  const F = await import("../app/public/towns/finland.js");
  assert.equal(F.ylreCode({ paatyyppi: "Ajorata", alatyyppi: "Ajorata" }), 701);
  assert.equal(F.ylreCode({ paatyyppi: "Silta", alatyyppi: "Ajorata (Silta)" }), 701);
  assert.equal(F.ylreCode({ paatyyppi: "Ajorata", alatyyppi: "Pysäköintialue" }), 704);
  assert.equal(F.ylreCode({ paatyyppi: "Ajorata", alatyyppi: "Koroke" }), 1003);
  assert.equal(F.ylreCode({ paatyyppi: "Kevyt liikenne", alatyyppi: "Jalankulkualue" }), 702);
  assert.equal(F.ylreCode({ paatyyppi: "Kevyt liikenne", alatyyppi: "Erotettu pyörätie" }), 703);
  assert.equal(F.ylreCode({ paatyyppi: "Muu rakenneosa", alatyyppi: "Erotusalue", materiaali: "Noppakivi" }), 1003);
  assert.equal(F.ylreCode({ paatyyppi: "Muu rakenneosa", alatyyppi: "Erotusalue", materiaali: "Istutusalue - nurmi" }), 401);
  assert.equal(F.ylreCode({ paatyyppi: "Nurmikot ja niityt", alatyyppi: "Nurmikko" }), 401);
  assert.equal(F.ylreCode({ paatyyppi: "Varusteet", alatyyppi: "Tukimuuri" }), null);
  // Bulevardi (a trimmed real answer): its roadway, sidewalks, cycle tracks, dividers and tree grates.
  const out = F.ylreFeatures(fixture("fi-ylre.json"));
  const codes = out.features.map((f) => f.attributes.code);
  assert.equal(out.features.length, 26);
  for (const c of [701, 702, 703, 1003]) assert.ok(codes.includes(c), `${c}`);
  assert.ok(out.features.every((f) => Array.isArray(f.geometry.rings[0][0])));
  // The combined footway and cycleway comes last (it lies over other parts).
  const late = F.ylreFeatures({ features: [{ properties: { paatyyppi: "Kevyt liikenne", alatyyppi: "Yhdistetty jk ja pp" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } },
    { properties: { paatyyppi: "Ajorata", alatyyppi: "Ajorata" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } }] });
  assert.deepEqual(late.features.map((f) => f.attributes.code), [701, 702]);
  const u = new URL(F.ylreUrl("24.93,60.16,24.94,60.17"));
  assert.equal(u.searchParams.get("typeNames"), "avoindata:YLRE_Katu_ja_viherosat_kaikki_alue");
  assert.ok(!/paivittaja/.test(u.searchParams.get("propertyName")), "jen potřebná pole, ne jméno úředníka");
  assert.equal(u.searchParams.get("bbox"), "60.16,24.93,60.17,24.94,urn:ogc:def:crs:EPSG::4326");
  globalThis.PROFILY_FI = { helsinki: "0" };
  assert.deepEqual(await F.sources.surfaces("24.93,60.16,24.94,60.17"), { features: [], abroad: true }, "?helsinki=0");
  globalThis.PROFILY_FI = {};
  assert.deepEqual(await F.sources.surfaces("23.75,61.49,23.76,61.50"), { features: [], abroad: true }, "mimo Helsinky nic");
  // The review of 24. 11. 2026, bod 9: a square is paving, a driveway the sidewalk, a cycle lane in a street the roadway.
  assert.equal(F.ylreCode({ paatyyppi: "Kevyt liikenne", alatyyppi: "Aukiot" }), 1003);
  assert.equal(F.ylreCode({ paatyyppi: "Ajorata", alatyyppi: "Tonttiliittymä" }), 702);
  assert.equal(F.ylreCode({ paatyyppi: "Kevyt liikenne", alatyyppi: "Pyöräilyalue/kaista", alueen_kayttotarkoitus: "Kokoojakatu alueellinen" }), 701);
  assert.equal(F.ylreCode({ paatyyppi: "Kevyt liikenne", alatyyppi: "Pyöräilyalue/kaista", alueen_kayttotarkoitus: "Tori" }), 703);
  // Bod 7: Helsinki by its border with its waters, not the box (Espoo's Tapiola and Otaniemi, Vantaa's Tikkurila and
  // Myyrmäki, Hanasaari of Espoo are out; Suomenlinna, the bridge to Kulosaari, Laivakoirankatu, Östersundom in).
  for (const [lon, lat] of [[24.938, 60.1695], [24.988, 60.1455], [24.9891, 60.1858], [25.0159, 60.16], [25.19, 60.25], [25.14, 60.21]]) assert.ok(F.inHelsinki(lon, lat), `${lon},${lat}`);
  for (const [lon, lat] of [[24.805, 60.176], [24.83, 60.185], [25.04, 60.293], [24.85, 60.26], [24.84, 60.165], [24.81, 60.22]]) assert.ok(!F.inHelsinki(lon, lat), `${lon},${lat}`);
  // Bod 1: the register has the street when a part of its kind lies under the cut's centre (3 m): a roadway under a
  // street for cars; a sidewalk will do under a path.
  const sq = (code, x0, x1) => ({ attributes: { CTVUK_KOD: code }, geometry: { rings: [[[x0, 60.1999], [x1, 60.1999], [x1, 60.2001], [x0, 60.2001], [x0, 60.1999]]] } });
  const m = 1 / (111320 * Math.cos((60.2 * Math.PI) / 180));
  const walk = [sq(702, 25 - 6 * m, 25 + 6 * m)], road = [sq(701, 25 - 6 * m, 25 + 6 * m)], aside = [sq(701, 25 + 10 * m, 25 + 20 * m)];
  assert.ok(!F.hasStreet(walk, 25, 60.2, { highway: "residential" }), "pod ulicí jen chodník");
  assert.ok(F.hasStreet(road, 25, 60.2, { highway: "residential" }));
  assert.ok(F.hasStreet(walk, 25, 60.2, { highway: "footway" }));
  assert.ok(!F.hasStreet(aside, 25, 60.2, { highway: "residential" }), "vozovka 10 m vedle");
  // Bod 6: the city's building outlines (only those in force) as surfaces before OSM's.
  const houses = F.hkiHouseFeatures({ features: [{ properties: { tila: "voimassa" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } },
    { properties: { tila: "purettu" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } },
    { properties: {}, geometry: { type: "MultiPolygon", coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]], [[[2, 2], [3, 2], [3, 3], [2, 2]]]] } }] });
  assert.equal(houses.length, 3);
  assert.ok(houses.every((h) => h.attributes.CTVUK_KOD === 601));
  const hu = new URL(F.hkiHousesUrl("24.93,60.16,24.94,60.17"));
  assert.equal(hu.searchParams.get("typeNames"), "avoindata:Rakennukset_alue_rekisteritiedot");
  assert.equal(hu.searchParams.get("propertyName"), "tila,geom");
});

test("Finsko: budovy Helsinek a Ryhti", async () => {
  const F = await import("../app/public/towns/finland.js");
  // Bulevardi 5: 7 floors, 1924, brick walls and facade, offices (151).
  assert.deepEqual(F.hkiPick(fixture("fi-hki-rakennus.json"), 60.16531, 24.93874),
    { built: 1924, solid: true, type: undefined, office: true, cornice: 7, total: 7, roof: 0, fiBuild: "hki" });
  assert.deepEqual(F.hkiBuilding({ i_kerrlkm: 2, c_valmpvm: "1952-06-30", c_rakeaine: "4", c_julkisivu: "5", c_kayttark: "011" }),
    { built: 1952, material: "wood", solid: true, house: true, type: "house", office: undefined, cornice: 2, total: 2, roof: 0 });
  assert.equal(F.hkiBuilding({ c_kayttark: "032" }).type, "apartments");
  assert.equal(F.hkiBuilding({ c_kayttark: "021" }).type, "terrace");
  assert.equal(F.hkiBuilding({ c_kayttark: "341" }).type, "church");
  assert.equal(F.hkiBuilding({ c_kayttark: "511" }).type, "school");
  assert.deepEqual(F.hkiPick({ features: [] }, 60, 25), {});
  // Ryhti: the codes as URIs; 04 wooden walls, 05 wooden facade, 07 a public building, 05 a small house, 06 flats.
  assert.deepEqual(F.ryhtiBuilding({ number_of_storeys: 2, completion_date: "1920-01-01Z", main_purpose: "http://uri.suomi.fi/codelist/rytj/avoin_rakennusluokitus/code/07",
    facade_material: "http://uri.suomi.fi/codelist/rytj/julkisivunrakennusaine/code/05", material_of_load_bearing_structures: "http://uri.suomi.fi/codelist/rytj/kantavanrakenteenrakennusaine/code/04" }),
  { built: 1920, material: "wood", solid: true, office: true, cornice: 2, total: 2, roof: 0 });
  assert.equal(F.ryhtiBuilding({ main_purpose: ".../code/06", material_of_load_bearing_structures: ".../code/01" }).type, "apartments");
  assert.equal(F.ryhtiBuilding({ main_purpose: ".../code/06", material_of_load_bearing_structures: ".../code/01" }).solid, undefined);
  assert.deepEqual(F.ryhtiBuilding({ main_purpose: ".../code/05" }), { built: undefined, house: true, type: "house" });
  // The point inside the OSM building at the facade, the nearest to the facade's point.
  const json = fixture("fi-ryhti.json");
  const d = 0.00012, sq = (lon, lat) => [[[lon - d * 2, lat - d], [lon + d * 2, lat - d], [lon + d * 2, lat + d], [lon - d * 2, lat + d], [lon - d * 2, lat - d]]];
  assert.equal(F.ryhtiPick(json, 61.49757, 23.76204, sq(23.76204, 61.49757)).built, 1901);
  assert.equal(F.ryhtiPick(json, 61.49761, 23.76275, sq(23.76275, 61.49761)).total, 7);
  assert.deepEqual(F.ryhtiPick(json, 61.4990, 23.7700, sq(23.7700, 61.4990)), {}, "v obrysu žádný bod");
  // Without an outline the nearest within 8 m.
  assert.equal(F.ryhtiPick(json, 61.49805, 23.75941).total, 2);
  assert.deepEqual(F.ryhtiPick(json, 61.4990, 23.7700), {});
  assert.deepEqual(F.ryhtiPick({ features: [{ geometry: { type: "Point", coordinates: [23.75941, 61.49805] }, properties: { number_of_storeys: 3, demolition_date: "2020-01-01" } }] }, 61.49805, 23.75941), {}, "zbořená");
  assert.match(F.ryhtiUrl(61.49, 23.75, 61.5, 23.76), /typeNames=ryhti_building%3Aopen_building/);
});

test("Finsko: hledání adres Ryhti", async () => {
  const S = await import("../app/public/search/ryhti.js");
  assert.deepEqual(S.parseFiQuery("Bulevardi 5, Helsinki"), { street: "Bulevardi", number: 5, extra: null, town: "Helsinki" });
  assert.deepEqual(S.parseFiQuery("Hämeenkatu 10 Tampere"), { street: "Hämeenkatu", number: 10, extra: null, town: "Tampere" });
  assert.equal(S.parseFiQuery("Mannerheimintie 12 b").extra, "b");
  assert.equal(S.parseFiQuery("Esplanadi"), null);
  // The fast query by the fields (the review of 24. 11. 2026, bod 12), the old ILIKE only when it finds nothing.
  const fast = new URL(S.ryhtiAddressUrl({ street: "kolmas linja", number: 5, extra: "b", town: "Helsinki" })).searchParams.get("filter");
  assert.match(fast, /address_name_fin IN \('kolmas linja','Kolmas linja','Kolmas Linja'\)/);
  assert.match(fast, /number_part_of_address_number = 5 AND subdivision_letter_of_address_number = 'b'/);
  assert.match(fast, /postal_office_fin = 'HELSINKI'/);
  assert.doesNotMatch(fast, /ILIKE/);
  const f = new URL(S.ryhtiAddressLikeUrl({ street: "O'Bri%en", number: 5, extra: null, town: "Åbo" })).searchParams.get("filter");
  assert.match(f, /address_fin ILIKE 'O''Brien 5'/);
  assert.match(f, /postal_office_swe ILIKE 'Åbo%'/);
  const asked = [];
  const answer = { features: [{ geometry: { coordinates: [24.95, 60.18] }, properties: { address_fin: "Kolmas linja 5", address_name_fin: "Kolmas linja", postal_office_fin: "HELSINKI" } }] };
  assert.equal((await S.findFi("kolmas linja 5", async (u) => { asked.push(u); return answer; })).length, 1);
  assert.equal(asked.length, 1, "jeden dotaz, když rychlý najde");
  asked.length = 0;
  await S.findFi("kolmas Linja 5", async (u) => { asked.push(u); return asked.length === 1 ? { features: [] } : answer; });
  assert.equal(asked.length, 2, "ILIKE jen po prázdném rychlém");
  assert.match(new URL(asked[1]).searchParams.get("filter"), /ILIKE/);
  // Only a Swedish address (Åland): kept.
  assert.deepEqual(S.parseFi({ features: [{ geometry: { coordinates: [19.94, 60.1] }, properties: { address_swe: "Torggatan 2", address_name_swe: "Torggatan", postal_office_swe: "MARIEHAMN" } }] }).map((x) => [x.text, x.at.street]),
    [["Torggatan 2, Mariehamn", "Torggatan"]]);
  const items = S.parseFi({ features: [
    { geometry: { coordinates: [24.9387, 60.1653] }, properties: { address_fin: "Bulevardi 5", address_name_fin: "Bulevardi", postal_office_fin: "HELSINKI" } },
    { geometry: { coordinates: [24.9388, 60.1654] }, properties: { address_fin: "Bulevardi 5", address_name_fin: "Bulevardi", postal_office_fin: "HELSINKI" } },
    { geometry: { coordinates: [23.664, 60.0748] }, properties: { address_fin: "Bulevardi 5", address_name_fin: "Bulevardi", postal_office_fin: "KARJAA" } }] });
  assert.deepEqual(items.map((x) => x.text), ["Bulevardi 5, Helsinki", "Bulevardi 5, Karjaa"]);
  assert.equal(items[0].at.street, "Bulevardi");
  assert.ok(S.looksFinnish("Hämeenkatu 10") && S.looksFinnish("Storgatan 3, Vasa") && !S.looksFinnish("Karlova 5"));
});

test("Finsko: značky, normy, zákon o stání", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const FI = COUNTRIES.FI, f = FI.signs.file;
  assert.equal(f({ k: "oneway", dir: "forward" }), "E14.1");
  assert.equal(f({ k: "oneway", dir: "backward" }), "C17");
  assert.equal(f({ k: "c10a" }), "D7.1");
  assert.equal(f({ k: "c10a", walk: "left" }), "D7.2");
  assert.equal(f({ k: "b20a", v: 50 }), "C32-50");
  assert.equal(f({ k: "b20a", v: 90 }), null);
  assert.equal(f({ k: "sdilena" }), null, "sdílenou zónu Finsko nemá");
  assert.equal(f({ k: "ztp" }), null);
  assert.equal(FI.signs.label({ k: "b29" }, null, "B 29 Zákaz stání"), "C38 Zákaz stání");
  // Guides only: nothing red.
  for (const s of [{ type: "chodnik" }, { type: "cyklopruh" }, { type: "cyklostezka" }, { type: "bus" }, { type: "parkovani" }]) assert.equal(FI.limits(s, [], 0).min, 0, s.type);
  assert.equal(FI.limits({ type: "cyklopruh" }, [], 0).zaklad, 1.5);
  assert.equal(FI.limits({ type: "cyklostezka" }, [], 0).zaklad, 1.5, "bez směru jako jednosměrná");
  assert.equal(FI.limits({ type: "cyklostezka", dir: "forward" }, [], 0).zaklad, 1.5);
  assert.equal(FI.limits({ type: "parkovani", orient: "kolme" }, [], 0).zaklad, 5);
  assert.equal(FI.limits({ type: "parkovani", orient: "sikme" }, [], 0), null);
  assert.equal(FI.limits({ type: "pruh" }, [{ type: "pruh" }], 0), null, "šířka pruhu jen vedle cyklopruhu");
  assert.equal(FI.limits({ type: "pruh" }, [{ type: "pruh" }, { type: "cyklopruh" }], 0).zaklad, 3);
  assert.equal(FI.contraflow(true), null);
  assert.equal(FI.contraflow(false).base, 4.25);
  assert.equal(FI.tramBelt([], 6.2)[0].level, "zaklad");
  assert.deepEqual(FI.tramBelt([], 7), []);
  assert.equal(FI.freeLane, 3);
  assert.match(FI.halfKerbNote("2,5 m", "3 m"), /§ 37/);
  assert.equal(FI.laneOrtho, "fi");
  assert.equal(FI.socialistLooks, false);
  assert.deepEqual(FI.search, ["photon-fi", "ryhti"]);
  // The wooden house of the Nordic looks (house-looks.js) from the walls Ryhti or Helsinki give.
  assert.equal(FI.houseLook("vila", { material: "wood", built: 1925 }, 2), "drevak");
});
