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
  assert.equal(Object.keys(BUILDING_STYLES).length, 32);
});

// The regional looks of Europe's old houses (docs/house-types-europe.md, house-looks.js; Bára 23. 11. 2026): a state's
// houseLook replaces only the old looks (sikma, mestan, nizky; vila and statek of wooden houses) by year and place.
import { LOOKS, nordicLook, nordicDetails, mediterraneanLook } from "../pilot/public/house-looks.js";
import { EDGE_STYLES } from "../pilot/public/validate.js";
import { COUNTRIES } from "../pilot/public/countries/index.js";

const PT = { madrid: [-3.705, 40.415], coruna: [-8.40, 43.37], bolzano: [11.35, 46.5], torino: [7.68, 45.07], paris: [2.33, 48.87],
  marseille: [5.37, 43.30], bruxelles: [4.35, 50.85], gent: [3.72, 51.05], liege: [5.57, 50.63], amsterdam: [4.89, 52.37],
  valletta: [14.513, 35.898], nicosia: [33.364, 35.174], limassolOut: [33.0, 34.71], lisboa: [-9.14, 38.71], kalamaja: [24.734, 59.446],
  tallinnOld: [24.745, 59.437], tartuOut: [26.80, 58.36], stockholm: [18.07, 59.31], porvoo: [25.6625, 60.3935], kobenhavn: [12.56, 55.67] };
const old = (point, extra = {}) => ({ levels: 5, start: 1900, point, type: "apartments", ...extra });
const look = (id, info) => { setCity(id); const s = buildingStyle(info); setCity("praha"); return s; };

test("Česko, Slovensko a Polsko beze změny: žádný regionální vzhled", () => {
  for (const id of ["praha", "brno", "cesko", "slovensko", "poland"]) {
    setCity(id);
    assert.equal(COUNTRIES[city.country]?.houseLook ?? null, null, id);
    assert.equal(buildingStyle({ levels: 5, built: 1900, km: 1, point: PT.paris }), "sikma", id);
    assert.equal(buildingStyle({ levels: 2, built: 1900, house: 1, type: "house", km: 9, point: PT.kalamaja, material: "wood" }), "vila", id);
  }
  setCity("praha");
});

test("středomořský dům a varianty podle státu, regionu a roku", () => {
  assert.equal(look("spain", old(PT.madrid)), "stredomori");
  assert.equal(look("spain", old(PT.coruna)), "galeria");
  assert.equal(look("spain", old(PT.madrid, { start: 1965 })), "povalecny"); // a postwar house keeps its look
  assert.equal(look("italy", old(PT.torino)), "stredomori");
  assert.equal(look("italy", old(PT.bolzano)), "sikma"); // South Tyrol is alpine
  assert.ok(["azulejo", "stredomori"].includes(look("portugal", old(PT.lisboa))));
  assert.equal(look("malta", { levels: 3, point: PT.valletta }), "malta");
  assert.equal(look("malta", { levels: 3, point: PT.valletta, roofShape: "flat" }), "malta"); // a flat house of no year
  assert.notEqual(look("malta", { levels: 9, point: PT.valletta }), "malta");
  assert.equal(look("cyprus", { levels: 2, point: PT.nicosia }), "kypr");
  assert.notEqual(look("cyprus", { levels: 2, point: PT.limassolOut }), "kypr"); // no year outside the old cores
  assert.equal(look("france", old(PT.marseille, { levels: 3 })), "stredomori"); // the Mediterranean departments
  // A one-storey house stays a town house.
  assert.equal(mediterraneanLook("ES")("nizky", old(PT.madrid, { levels: 1 }), 1), undefined);
});

test("haussmannovský dům: mansarda, rok a 5 podlaží, Paříž bez roku; ne nízký dům", () => {
  assert.equal(look("france", old(PT.paris, { levels: 7 })), "haussmann");
  assert.equal(look("france", { levels: 3, point: PT.liege, roofShape: "mansard" }), "haussmann");
  assert.equal(look("france", { levels: 6, point: PT.paris }), "haussmann"); // no year, a big town
  assert.equal(look("france", old(PT.paris, { levels: 3 })), "sikma"); // 2–4 floors without a mansard
  assert.equal(look("luxembourg", { levels: 6, point: [6.13, 49.61] }), "sikma"); // Luxembourg needs a year
  assert.equal(look("belgium", { levels: 4, point: PT.bruxelles }), "haussmann"); // the maison bourgeoise
  assert.equal(look("monaco", old([7.4246, 43.7384], { levels: 3 })), "stredomori");
});

test("severomořský cihlový dům; štít jen s ?stit=1", () => {
  assert.equal(look("netherlands", { levels: 4, built: 1890, point: PT.amsterdam }), "cihlovy");
  assert.equal(look("netherlands", { levels: 4, built: 1700, point: PT.amsterdam, across: 1 }), "cihlovy");
  LOOKS.gables = true;
  assert.equal(look("netherlands", { levels: 4, built: 1700, point: PT.amsterdam, across: 1 }), "stit");
  assert.equal(look("netherlands", { levels: 4, built: 1890, point: PT.amsterdam, across: 1 }), "cihlovy");
  assert.equal(look("estonia", { levels: 3, point: PT.tallinnOld, across: 1 }), "hanza");
  LOOKS.gables = false;
  assert.equal(look("estonia", { levels: 3, point: PT.tallinnOld, across: 1 }), "sikma");
  assert.equal(look("belgium", { levels: 3, point: PT.gent }), "cihlovy"); // Flanders
  assert.equal(look("belgium", { levels: 3, point: PT.liege }), "sikma"); // Wallonia stays
});

test("Estonsko: tallinnský dům, dřevěný dům, sídliště beze změny", () => {
  assert.equal(look("estonia", { levels: 3, start: 1930, point: PT.tartuOut, material: "wood" }), "tallinnamaja");
  assert.equal(look("estonia", { levels: 2, point: PT.kalamaja }), "tallinnamaja"); // no year in the wooden districts
  assert.equal(look("estonia", { levels: 2, type: "house", point: PT.tartuOut, material: "wood" }), "drevak");
  assert.equal(look("estonia", { levels: 5, built: 1975, type: "apartments", block: slab, point: PT.tartuOut }), "plocha");
});

test("Skandinávie (pravidla pro budoucí moduly SE, NO, DK, FI)", () => {
  const se = nordicLook("SE"), dk = nordicLook("DK"), fi = nordicLook("FI");
  assert.equal(se("sikma", { start: 1905, point: PT.stockholm }, 5), "stenstad");
  assert.equal(se("sikma", { start: 1950, point: PT.stockholm }, 5), undefined);
  assert.equal(se("vila", { point: PT.stockholm }, 2), "drevak");
  assert.equal(fi("nizky", { point: PT.porvoo }, 1), "puukaupunki");
  assert.equal(fi("nizky", { point: PT.stockholm }, 1), undefined);
  assert.equal(dk("sikma", { point: PT.kobenhavn }, 5), "dansky");
  assert.equal(dk("sikma", { point: PT.kobenhavn, material: "plaster" }, 5), "stenstad");
  assert.equal(dk("vila", { point: PT.kobenhavn }, 2), undefined); // Danish villas are not wooden (but on Bornholm)
  assert.equal(nordicDetails("SE")("drevak").boards, "vertical");
  assert.equal(nordicDetails("FI")("drevak").boards, "horizontal");
});

test("každý vzhled má popisek, překlad a platí v souborech", () => {
  for (const k of Object.keys(BUILDING_STYLES)) assert.ok(EDGE_STYLES.has(k), k);
});
