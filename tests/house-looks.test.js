// The socialist house looks (sorela, the brick block of the 1950s–60s, the panel house) only in the states that built
// them (Bára 23. 11. 2026): Czechia, Slovakia, Poland, Estonia and the former GDR; elsewhere, and abroad ("cizina"),
// the postwar block of flats (profile.js westernLook).
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildingStyle, BUILDING_STYLES } from "../pilot/public/profile.js";
import { setCity, city } from "../pilot/public/city.js";

const slab = { length: 60, width: 12, fill: 0.85, parts: 1 };
const HOUSES = {
  1955: { levels: 4, built: 1955, km: 5, type: "apartments" },
  1965: { levels: 4, built: 1965, km: 5, type: "apartments" },
  1975: { levels: 5, built: 1975, km: 5, type: "apartments", block: slab },
  1930: { levels: 5, built: 1930, km: 5, type: "apartments" },
  2005: { levels: 5, built: 2005, km: 5, type: "apartments" },
};
const at = (id, extra = {}) => { setCity(id); Object.assign(city, extra); };
const looks = () => Object.fromEntries(Object.entries(HOUSES).map(([y, info]) => [y, buildingStyle(info)]));

test("socialistické vzhledy v CZ, SK, PL, EE a bývalé NDR", () => {
  for (const [id, extra] of [["praha"], ["cesko"], ["slovensko"], ["poland"], ["estonia"], ["germany", { panels: true }]]) {
    at(id, extra);
    assert.deepEqual(looks(), { 1955: "sorela", 1965: "typovy", 1975: "plocha", 1930: "funkce", 2005: "moderni" }, id);
  }
  setCity("praha");
});

test("jinde poválečný bytový dům, před 1946 funkcionalistický, po 1990 moderní", () => {
  for (const [id, extra] of [["austria"], ["france"], ["spain"], ["italy"], ["germany", { panels: false }], ["cizina"]]) {
    at(id, extra);
    assert.deepEqual(looks(), { 1955: "povalecny", 1965: "povalecny", 1975: "povalecny", 1930: "funkce", 2005: "moderni" }, id);
  }
  // A year from OSM (start_date) abroad, and a panel slab of no known year; an office stays an office.
  at("austria");
  assert.equal(buildingStyle({ levels: 5, start: 1975, type: "apartments", block: slab }), "povalecny");
  assert.equal(buildingStyle({ levels: 5, start: 1968, type: "apartments" }), "povalecny");
  assert.equal(buildingStyle({ levels: 5, type: "apartments", block: slab }), "povalecny");
  assert.equal(buildingStyle({ levels: 5, start: 1975, type: "office", block: slab }), "kancelar");
  // By hand any look anywhere.
  assert.equal(buildingStyle(HOUSES[1975], "plocha"), "plocha");
  at("praha");
  assert.equal(buildingStyle(HOUSES[1975], "povalecny"), "povalecny");
  assert.ok(BUILDING_STYLES.povalecny);
  assert.equal(Object.keys(BUILDING_STYLES).length, 18);
});
