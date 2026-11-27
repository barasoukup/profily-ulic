// The socialist house looks (sorela, the brick block of the 1950s–60s, the panel house) only in the states that built
// them (Bára 23. 11. 2026): Czechia, Slovakia, Poland, Estonia and the former GDR; elsewhere, and abroad ("cizina"),
// the postwar block of flats (profile.js westernLook).
import "../app/public/america.js"; // the states of North America (late.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildingStyle, BUILDING_STYLES } from "../app/public/profile.js";
import { setCity, city } from "../app/public/city.js";

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
  assert.equal(Object.keys(BUILDING_STYLES).length, 46);
});

// The regional looks of Europe's old houses (docs/house-types-europe.md, house-looks.js; Bára 23. 11. 2026): a state's
// houseLook replaces only the old looks (sikma, mestan, nizky; vila and statek of wooden houses) by year and place.
import { LOOKS, nordicLook, nordicDetails, mediterraneanLook } from "../app/public/house-looks.js";
import { EDGE_STYLES } from "../app/public/validate.js";
import { COUNTRIES } from "../app/public/countries/index.js";

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

test("severomořský cihlový dům; štít výchozí (Bára 23. 11. 2026), ?stit=0 vypne", () => {
  assert.equal(LOOKS.gables, true, "štíty zapnuté bez přepínače");
  assert.equal(look("netherlands", { levels: 4, built: 1890, point: PT.amsterdam }), "cihlovy");
  assert.equal(look("netherlands", { levels: 4, built: 1700, point: PT.amsterdam, across: 1 }), "stit");
  assert.equal(look("netherlands", { levels: 4, built: 1890, point: PT.amsterdam, across: 1 }), "cihlovy");
  assert.equal(look("estonia", { levels: 3, point: PT.tallinnOld, across: 1 }), "hanza");
  LOOKS.gables = false;
  assert.equal(look("netherlands", { levels: 4, built: 1700, point: PT.amsterdam, across: 1 }), "cihlovy");
  assert.equal(look("estonia", { levels: 3, point: PT.tallinnOld, across: 1 }), "sikma");
  LOOKS.gables = true;
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

test("štít uříznutý okrajem (2/3) je výchozí (Bára 23. 11. 2026)", async () => {
  const { LOOKS } = await import("../app/public/house-looks.js");
  assert.equal(LOOKS.gableCut, true);
});

// North America (docs/house-types-north-america.md; Bára 25. 11. 2026).
test("severoamerické domy podle druhu, roku a místa; bez dat prostý vzhled", async () => {
  const { northAmericaLook: na, northAmericaDetails: det } = await import("../app/public/house-looks-america.js");
  const row = { length: 60, width: 12, fill: 0.9, parts: 10 }, alone = { length: 11, width: 9, fill: 0.9, parts: 1 };
  const CH = [-76.993, 38.886], PET = [-77.02, 38.942], MD = [-77.2, 39.1], GT = [-77.065, 38.908], DT = [-77.035, 38.902];
  assert.equal(look("usa", { levels: 2, type: "house", block: row, point: CH }), "bayrow");
  assert.equal(look("usa", { type: "house", block: row, point: PET }), "porchrow"); // no floors
  assert.equal(look("usa", { levels: 2, type: "detached", block: alone, point: PET }), "framehouse");
  assert.equal(look("usa", { point: MD }), "framehouse"); // nothing known
  assert.equal(look("usa", { levels: 4, type: "apartments", point: PET }), "brickblock");
  assert.equal(look("usa", { levels: 9, type: "apartments", start: 1965, point: PET }), "slab");
  assert.equal(look("usa", { levels: 5, type: "apartments", start: 2012, point: DT }), "podium");
  assert.equal(look("usa", { levels: 12, type: "apartments", start: 2012, point: DT }), "glasstower");
  assert.equal(look("usa", { levels: 10, type: "office", point: DT }), "kancelar");
  assert.equal(look("usa", { levels: 2, type: "retail", point: CH }), "mainstreet");
  assert.equal(look("usa", { levels: 1, type: "retail", point: MD }), "stripmall");
  assert.equal(look("usa", { levels: 2, type: "school", point: CH }), "brickblock");
  // At the sidewalk of a main street a joined row of no known kind is shops; a house stays a house.
  assert.equal(look("usa", { levels: 3, block: row, point: MD, atWalk: 1, main: 1 }), "mainstreet");
  assert.equal(look("usa", { levels: 2, type: "terrace", block: row, point: MD, atWalk: 1, main: 1 }), "porchrow");
  assert.equal(look("usa", { levels: 2, block: row, point: MD, atWalk: 1 }), "porchrow");
  assert.equal(look("usa", { levels: 1, type: "church", point: CH }), "kostel");
  assert.equal(na("sikma", { block: row, type: "house", point: [-73.972, 40.679] }, 4), "brownstone");
  assert.equal(na("sikma", { block: row, type: "apartments", point: [-73.985, 40.725] }, 5), "tenement");
  assert.equal(na("sikma", { block: alone, type: "house", point: [-71.06, 42.31] }, 3), "tripledecker");
  assert.equal(na("sikma", { block: row, type: "house", point: [-79.366, 43.666] }, 3), "baygable");
  assert.equal(na("sikma", { block: row, type: "house", point: [-122.435, 37.774] }, 3), "victorian");
  assert.equal(det("bayrow", { point: CH, block: row, type: "house" }).front, "bay");
  assert.equal(det("bayrow", { point: CH }).front, "flat"); // nothing known of the house: no bay
  assert.equal(det("bayrow", { point: GT, block: row }).front, "flat");
  assert.equal(det("slab", { point: MD }).balconies, false);
});

test("Vzhled čte všechny budovy OSM, panelák ne z tvaru samotného, řadový dům Flander bez podlaží je cihlový", async () => {
  const D = await import("../app/public/derive.js"), P = await import("../app/public/profile.js"), C = await import("../app/public/city.js");
  const O = await import("../app/public/ortho-osm.js"), { brickLook } = await import("../app/public/house-looks.js");
  const frame = { toXY: (x, y) => [x, y], toLonLat: (x, y) => [x, y] }, box = (tags) => ({ type: "area", tags, geometry: [[-5, -5], [5, -5], [5, 5], [-5, 5], [-5, -5]].map(([lon, lat]) => ({ lon, lat })) });
  assert.equal(D.buildingAt({ elements: [box({ building: "house" })] }, frame, [0, 0]).type, "house");
  assert.equal(D.buildingAt({ elements: [box({ building: "roof" })] }, frame, [0, 0]), null);
  const off = O.P.off;
  O.P.off = new Set(["vsedomy"]);
  assert.equal(D.buildingAt({ elements: [box({ building: "house" })] }, frame, [0, 0]), null);
  O.P.off = off;
  const slab = { block: { length: 60, width: 12, fill: 0.9, parts: 1 }, km: 99, point: [19.94, 50.06] };
  C.setCity("poland");
  assert.equal(P.buildingStyle(slab), "sikma");
  assert.equal(P.buildingStyle({ ...slab, levels: 5 }), "plocha");
  C.setCity("austria");
  assert.equal(P.buildingStyle(slab), "povalecny");
  C.setCity("praha");
  assert.equal(brickLook()("nizky", { type: "house", block: { parts: 5 } }, null), "cihlovy");
  assert.equal(brickLook()("nizky", { type: "house", block: { parts: 5 } }, 1), undefined);
});

// A small house standing alone, of which OSM knows no floors and no height (Bára 27. 11. 2026, Girbigsdorfer Straße): a family
// house, not a five-floor tenement; a big or joined one and one with known floors keep their looks; ?off=vesnice as before.
test("malý dům o samotě bez dalších údajů je rodinný dům", () => {
  const alone = (area, extra = {}) => ({ footprint: area, block: { length: 12, width: 10, fill: 0.7, parts: 1, area }, km: 99, ...extra });
  for (const id of ["germany", "austria", "cizina", "poland"]) {
    at(id);
    assert.equal(buildingStyle(alone(120)), "vila", id);
    assert.equal(buildingStyle(alone(120, { start: 1985 })), "kostka", id);
    assert.equal(buildingStyle(alone(120, { roofShape: "gabled" })), "vila", id);
    assert.equal(buildingStyle(alone(20)), "garaz", id);
    assert.equal(buildingStyle(alone(120, { levels: 5, type: "apartments" })), buildingStyle({ levels: 5, type: "apartments", km: 99, block: alone(120).block }), id);
    // a big building, a joined row, a block of many buildings: as before
    assert.equal(buildingStyle(alone(600)), buildingStyle({ km: 99, block: alone(600).block }), id);
    assert.notEqual(buildingStyle(alone(120, { block: { length: 40, width: 12, fill: 0.8, parts: 5, area: 400 } })), "vila", id);
    assert.notEqual(buildingStyle(alone(120, { block: { length: 30, width: 12, fill: 0.8, parts: 2, area: 520 } })), "vila", id);
    // office types stay offices
    assert.notEqual(buildingStyle(alone(120, { type: "office" })), "vila", id);
  }
  globalThis.PROFILY_CA = { off: "vesnice" };
  at("germany");
  assert.notEqual(buildingStyle(alone(120)), "vila"); // (a slab of 12 m filling its box: the old reading, a post-war block)
  delete globalThis.PROFILY_CA;
  setCity("praha");
});
