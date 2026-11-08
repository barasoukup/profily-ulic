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
