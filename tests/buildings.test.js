import { test } from "node:test";
import assert from "node:assert/strict";
import { buildingStyle } from "../pilot/public/profile.js";

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
  assert.equal(flat({ type: "hotel", block: { length: 187, width: 115, fill: 0.56, parts: 11 } }), "plocha");
});

test("šikmá střecha zůstává činžákem 19. století", () => {
  assert.equal(buildingStyle({ roofType: 1, levels: 5, km: 3, block: { length: 120, width: 80, fill: 0.4, parts: 12 } }), "sikma");
});

test("plochá střecha a IPR „nová budova“ je moderní bytový dům", () => {
  assert.equal(flat({ newBuild: true, block: { length: 144, width: 14.8, fill: 0.84, parts: 1 } }), "moderni");
  assert.equal(flat({ newBuild: true, type: "office" }), "plocha");
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
  const { buildingStyle } = await import("../pilot/public/profile.js");
  assert.equal(buildingStyle({ levels: 8, panel: 1, km: 0.2 }), "plocha");
  assert.equal(buildingStyle({ levels: 4, built: 1915, km: 5 }), "sikma");
  assert.equal(buildingStyle({ levels: 4, built: 1952, km: 5 }), "sikma");
  assert.equal(buildingStyle({ levels: 4, built: 2005, km: 5 }), "moderni");
  assert.equal(buildingStyle({ levels: 5, built: 1975, km: 5 }), "plocha");
  assert.equal(buildingStyle({ levels: 2, panel: 1 }), "nizky");
});

// A low building keeps a pitched roof only as a house (RÚIAN rodinný dům, OSM house type) or where the roof is known.
test("nízká budova: sedlová jen u rodinného domu, jinak rovná", async () => {
  const { buildingStyle } = await import("../pilot/public/profile.js");
  assert.equal(buildingStyle({ levels: 2, type: "civic", built: 1969, km: 0.4 }), "nizky");
  assert.equal(buildingStyle({ levels: 2, house: 1, km: 0.4 }), "nizky");
});
