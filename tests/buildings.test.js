import { test } from "node:test";
import assert from "node:assert/strict";
import { buildingStyle } from "../app/public/profile.js";

const flat = (extra) => buildingStyle({ roofType: 3, levels: 6, cornice: 6, km: 3.5, type: "apartments", ...extra });

test("plochá střecha v bloku s dvorem je funkcionalistický činžák", () => {
  assert.equal(flat({ block: { length: 196, width: 85, fill: 0.25, parts: 13 } }), "funkce");
});

test("úzká deska, dlouhé díly, 8+ podlaží nebo sídliště je panelák", () => {
  assert.equal(flat({ block: { length: 144, width: 14.8, fill: 0.84, parts: 1 } }), "plocha");
  assert.equal(flat({ block: { length: 137, width: 74, fill: 0.28, parts: 7 } }), "plocha");
  assert.equal(flat({ levels: 9, cornice: 9, block: { length: 120, width: 80, fill: 0.4, parts: 12 } }), "plocha");
  assert.equal(flat({ km: 9, block: { length: 120, width: 80, fill: 0.4, parts: 12 } }), "plocha");
});

test("bez tvaru bloku rozhodne vzdálenost od centra, kanceláře zůstávají", () => {
  assert.equal(flat({ km: 2 }), "funkce");
  assert.equal(flat({ km: 5 }), "plocha");
  assert.equal(flat({ type: "hotel", block: { length: 187, width: 115, fill: 0.56, parts: 11 } }), "kancelar");
});

test("šikmá střecha zůstává činžákem 19. století", () => {
  assert.equal(buildingStyle({ roofType: 1, levels: 5, km: 3, block: { length: 120, width: 80, fill: 0.4, parts: 12 } }), "sikma");
});

test("plochá střecha a IPR „nová budova“ je moderní bytový dům", () => {
  assert.equal(flat({ newBuild: true, block: { length: 144, width: 14.8, fill: 0.84, parts: 1 } }), "moderni");
  assert.equal(flat({ newBuild: true, type: "office" }), "kancelar");
});

test("ustupující podlaží mimo centrum je moderní, čtyřpodlažní dům na sídlišti panelák", () => {
  assert.equal(flat({ levels: 5, cornice: 4, roof: 1, km: 5.3 }), "moderni");
  assert.equal(flat({ levels: 4, cornice: 4, km: 9, block: { length: 60, width: 12, fill: 0.85, parts: 3 } }), "plocha");
  assert.equal(flat({ levels: 3, cornice: 3, km: 13.7, block: { length: 107, width: 20.6, fill: 0.78, parts: 5 } }), "plocha");
  assert.equal(flat({ levels: 4, cornice: 4, km: 4.1, block: { length: 36, width: 14.2, fill: 0.83, parts: 1 } }), "plocha");
  assert.equal(flat({ levels: 7, cornice: 6, roof: 1, km: 2.8, block: { length: 90, width: 60, fill: 0.5, parts: 9 } }), "funkce");
});

test("stáří zástavby (IPR) je výchozí odhad, který přebijí údaje o domě", () => {
  const slab = { length: 144, width: 14.8, fill: 0.84, parts: 1 }, block = { length: 120, width: 80, fill: 0.45, parts: 12 };
  assert.equal(flat({ period: 1950, block }), "funkce");
  assert.equal(flat({ period: 1950, block: slab }), "plocha");
  assert.equal(flat({ period: 1990, block }), "plocha");
  assert.equal(flat({ period: 2010, block: slab }), "moderni");
  assert.equal(flat({ period: 2020 }), "moderni");
  assert.equal(flat({ period: 1950, roof: 1, km: 5.3, levels: 5, cornice: 4 }), "moderni");
  assert.equal(flat({ period: 1990, newBuild: true }), "moderni");
});

test("zastavěno do 1920 je dům starší zástavby, pokud to není panelová deska", () => {
  assert.equal(flat({ period: 1880, levels: 3, cornice: 3, km: 13.7, block: { length: 107, width: 20.6, fill: 0.78, parts: 5 } }), "sikma");
  assert.equal(flat({ period: 1920, block: { length: 120, width: 80, fill: 0.45, parts: 12 } }), "sikma");
  assert.equal(flat({ period: 1840, block: { length: 144, width: 14.8, fill: 0.84, parts: 1 } }), "plocha");
});

// RÚIAN (the towns): walls of panels and the year of completion decide where the roof is not known.
test("RÚIAN: panely a rok dokončení", async () => {
  const { buildingStyle } = await import("../app/public/profile.js");
  assert.equal(buildingStyle({ levels: 8, panel: 1, km: 0.2 }), "plocha");
  assert.equal(buildingStyle({ levels: 4, built: 1915, km: 5 }), "sikma");
  assert.equal(buildingStyle({ levels: 4, built: 1952, km: 5 }), "sorela");
  assert.equal(buildingStyle({ levels: 4, built: 1947, km: 5 }), "sikma");
  assert.equal(buildingStyle({ levels: 4, built: 2005, km: 5 }), "moderni");
  assert.equal(buildingStyle({ levels: 5, built: 1975, km: 5 }), "plocha");
  assert.equal(buildingStyle({ levels: 2, panel: 1 }), "nizky");
});

// A low building keeps a pitched roof only as a house (RÚIAN rodinný dům, OSM house type) or where the roof is known.
test("nízká budova: sedlová jen u rodinného domu, jinak rovná", async () => {
  const { buildingStyle } = await import("../app/public/profile.js");
  assert.equal(buildingStyle({ levels: 2, type: "civic", built: 1969, km: 0.4 }), "nizky");
  assert.equal(buildingStyle({ levels: 2, house: 1, km: 0.4 }), "vila");
});

// Bára 16. 11. 2026: fewer panel houses where there are none (evaluation/archive/panel-buildings).
test("panelák ne před 1955, ne u zděných zdí, panelová novostavba je moderní", async () => {
  const { buildingStyle } = await import("../app/public/profile.js");
  const slab = { length: 60, width: 12, fill: 0.85, parts: 1 };
  assert.equal(buildingStyle({ levels: 5, built: 1938, km: 99, block: slab }), "funkce");
  assert.equal(buildingStyle({ levels: 5, built: 1980, solid: 1, km: 99, block: slab }), "funkce");
  assert.equal(buildingStyle({ levels: 5, built: 1980, km: 99, block: slab }), "plocha");
  assert.equal(buildingStyle({ levels: 4, built: 1962, km: 99, block: slab }), "typovy");
  assert.equal(buildingStyle({ levels: 4, built: 1962, panel: 1, km: 99, block: slab }), "plocha");
  assert.equal(buildingStyle({ levels: 5, built: 2008, panel: 1, km: 99 }), "moderni");
});

// The rest of the country and abroad (no centre, km 99): an unknown house is a panel house only by its block or floors.
test("bez centra a bez roku rozhoduje tvar desky", async () => {
  const { buildingStyle } = await import("../app/public/profile.js");
  const { setCity } = await import("../app/public/city.js");
  setCity("cesko");
  try {
    assert.equal(buildingStyle({ levels: 4, km: 99, block: { length: 40, width: 30, fill: 0.5, parts: 4 } }), "funkce");
    assert.equal(buildingStyle({ levels: 4, km: 99, block: { length: 60, width: 12, fill: 0.85, parts: 1 } }), "plocha");
    assert.equal(buildingStyle({ levels: 9, km: 99 }), "plocha");
  } finally { setCity("praha"); }
});

test("rodinné domy podle stáří, venkovský dům štítem do ulice, kancelář z RÚIAN", async () => {
  const { buildingStyle } = await import("../app/public/profile.js");
  assert.equal(buildingStyle({ levels: 2, house: 1, built: 1932, km: 5 }), "vila");
  assert.equal(buildingStyle({ levels: 2, house: 1, built: 1976, km: 5 }), "kostka");
  assert.equal(buildingStyle({ levels: 2, house: 1, built: 2015, km: 5 }), "novyrd");
  assert.equal(buildingStyle({ levels: 1, house: 1, built: 1900, km: 5, across: 1 }), "statek");
  assert.equal(buildingStyle({ levels: 1, farm: 1, built: 1960 }), "statek");
  assert.equal(buildingStyle({ levels: 2, house: 1, built: 1910, km: 5, type: "terrace" }), "nizky");
  assert.equal(buildingStyle({ levels: 5, office: 1, built: 1985, km: 99 }), "kancelar");
  assert.equal(buildingStyle({ levels: 2, type: "detached", period: 1970, km: 8, iprKind: 6 }), "kostka");
});

test("kostel, garáž, škola, měšťanský dům na náměstí", async () => {
  const { buildingStyle } = await import("../app/public/profile.js");
  const { setCity } = await import("../app/public/city.js");
  assert.equal(buildingStyle({ levels: 2, type: "church", km: 3 }), "kostel");
  assert.equal(buildingStyle({ levels: 1, type: "garages", km: 3 }), "garaz");
  assert.equal(buildingStyle({ levels: 1, garage: 1, km: 3 }), "garaz");
  assert.equal(buildingStyle({ levels: 3, type: "school", km: 3 }), "skola");
  setCity("jihlava");
  try {
    assert.equal(buildingStyle({ levels: 3, built: 1915, km: 0.1 }), "mestan");
    assert.equal(buildingStyle({ levels: 3, built: 1915, km: 0.8 }), "sikma");
  } finally { setCity("praha"); }
  assert.equal(buildingStyle({ levels: 4, roofType: 1, period: 1840, km: 0.3 }), "mestan");
  assert.equal(buildingStyle({ levels: 4, roofType: 1, period: 1880, km: 0.3 }), "sikma");
});

// Review of 16. 11. 2026 (Fable).
test("ručně zvolený vzhled přežije uložení; všechny vzhledy zná kontrola souboru", async () => {
  const { BUILDING_STYLES } = await import("../app/public/profile.js");
  const { EDGE_STYLES, cleanProfile } = await import("../app/public/validate.js");
  for (const k of Object.keys(BUILDING_STYLES)) assert.ok(EDGE_STYLES.has(k), k);
  const p = cleanProfile({ segments: [{ type: "chodnik", width: 3 }], edges: { left: "budova", leftStyle: "vila", right: "budova", rightStyle: "xyz" } });
  assert.equal(p.edges.leftStyle, "vila");
  assert.equal(p.edges.rightStyle, undefined);
});

test("zděný dům 60. let jen do 5 podlaží (i deska); rok i u známé šikmé střechy", async () => {
  const { buildingStyle } = await import("../app/public/profile.js");
  const slab = { length: 60, width: 12, fill: 0.85, parts: 1 };
  assert.equal(buildingStyle({ levels: 9, built: 1963, km: 99 }), "plocha");
  assert.equal(buildingStyle({ levels: 5, built: 1968, km: 99, block: slab }), "typovy");
  assert.equal(buildingStyle({ levels: 4, roofType: 1, built: 1953, km: 3 }), "sorela");
});

test("řadovka před venkovským domem, usedlost nejvýš 2 podlaží, IPR typ 6 v centru Prahy", async () => {
  const { buildingStyle } = await import("../app/public/profile.js");
  assert.equal(buildingStyle({ levels: 2, house: 1, built: 1930, km: 5, across: 1, type: "terrace" }), "nizky");
  assert.notEqual(buildingStyle({ levels: 5, farm: 1, built: 1930, km: 5 }), "statek");
  assert.equal(buildingStyle({ levels: 1, iprKind: 6, km: 0.3, period: 1840 }), "mestan");
  assert.equal(buildingStyle({ levels: 1, iprKind: 6, km: 1.5, period: 1880 }), "nizky");
  assert.equal(buildingStyle({ levels: 2, house: 1, built: 1952, km: 5 }), "vila");
});

test("Slovensko bez centra města: panelák jen deska nebo věžák, jinak činžák (Bára 16. 11. 2026, Kozia)", async () => {
  const { setCity } = await import("../app/public/city.js");
  setCity("slovensko");
  const court = { length: 115, width: 84, fill: 0.44, parts: 8 }, slab = { length: 60, width: 12, fill: 0.9, parts: 1 };
  assert.equal(buildingStyle({ levels: 6, km: 99, block: court, type: "apartments" }), "sikma");
  assert.equal(buildingStyle({ levels: 6, km: 99, block: court, roofShape: "flat" }), "funkce");
  assert.equal(buildingStyle({ levels: 8, km: 99, block: slab, type: "apartments" }), "plocha");
  assert.equal(buildingStyle({ levels: 5, km: 99, block: court, start: 1905 }), "sikma");
  assert.equal(buildingStyle({ levels: 7, km: 99, block: court, type: "office" }), "plocha");
  setCity("praha");
});

test("Rakousko: žádný panelák, deska je poválečný bytový dům (před 1946 funkcionalistický), nová moderní, kanceláře kanceláře", async () => {
  const C = await import("../app/public/city.js");
  const { buildingStyle } = await import("../app/public/profile.js");
  const slab = { levels: 9, block: { fill: 0.95, width: 12, length: 80, parts: 1 } };
  C.setCity("slovensko");
  const sk = buildingStyle(slab);
  C.setCity("austria");
  try {
    assert.equal(sk, "plocha", "na Slovensku deska je panelák");
    assert.equal(buildingStyle(slab), "povalecny");
    assert.equal(buildingStyle({ ...slab, start: 1938 }), "funkce");
    assert.equal(buildingStyle({ ...slab, start: 2005 }), "moderni");
    assert.equal(buildingStyle({ ...slab, type: "office" }), "kancelar");
    assert.equal(buildingStyle(slab, "plocha"), "plocha", "ručně zvolený vzhled zůstane");
  } finally { C.setCity("praha"); }
});

test("Německo: panelák jen na východě (bývalá NDR), na západě jako v Rakousku", async () => {
  const C = await import("../app/public/city.js");
  const { buildingStyle } = await import("../app/public/profile.js");
  const slab = { levels: 9, block: { fill: 0.95, width: 12, length: 80, parts: 1 } };
  try {
    Object.assign(C.setCity("germany"), await C.country.atPlace(13.47, 52.54)); // Berlin-Lichtenberg
    assert.equal(buildingStyle(slab), "plocha");
    Object.assign(C.setCity("germany"), await C.country.atPlace(6.96, 50.94)); // Köln
    assert.equal(buildingStyle(slab), "povalecny");
    assert.equal(buildingStyle({ ...slab, start: 2005 }), "moderni");
  } finally { C.setCity("praha"); }
});

test("odhad z ortofota v Česku doplní budovy z RÚIAN, které OSM nemá (23. 11. 2026)", async () => {
  const { withBuildings } = await import("../app/public/gis.js");
  const sq = (x, y, d) => [{ lon: x, lat: y }, { lon: x + d, lat: y }, { lon: x + d, lat: y + d }, { lon: x, lat: y + d }, { lon: x, lat: y }];
  const ruian = [{ type: "area", id: "ruian-1", tags: { building: "yes", source: "RÚIAN" }, geometry: sq(0, 0, 1), holes: [] }];
  const osm = { elements: [
    { type: "area", id: 1, tags: { building: "house" }, geometry: sq(0.1, 0.1, 0.8) }, // the same house in OSM
    { type: "area", id: 2, tags: { building: "house" }, geometry: sq(5, 5, 1) },
    { type: "way", id: 3, tags: { highway: "residential" }, geometry: sq(0.2, 0.2, 0.1) },
  ] };
  const lone = { type: "area", id: "ruian-2", tags: { building: "yes", source: "RÚIAN" }, geometry: sq(10, 10, 1), holes: [] };
  // OSM has the first house: its outline stays; the second only RÚIAN has: added.
  assert.deepEqual(withBuildings(osm, [...ruian, lone]).elements.map((e) => e.id), [1, 2, 3, "ruian-2"]);
  assert.deepEqual(withBuildings(osm, ruian, "first").elements.map((e) => e.id), ["ruian-1", 2, 3]);
  assert.equal(withBuildings(osm, []), osm);
});
