// The Brno site is made from the Prague files (tools/city_site.mjs): every swap must still find its text.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { brnoConfig, brnoIndex } from "../tools/city_site.mjs";

const read = (f) => fs.readFileSync(new URL(`../pilot/public/${f}`, import.meta.url), "utf8");

test("config.js pro Brno má CITY = brno", () => {
  assert.match(brnoConfig(read("config.js")), /export const CITY = "brno";/);
});

test("index.html pro Brno: titulek, CSP pro mapy Brna a ČÚZK, patička bez IPR", () => {
  const html = brnoIndex(read("index.html"));
  assert.match(html, /<title>Profily ulic · Brno<\/title>/);
  assert.match(html, /<a href="\.\.\/">Praha<\/a>\s*<a href="\.\/" aria-current="page">Brno<\/a>/);
  assert.match(html, /img-src [^;]*https:\/\/gis\.brno\.cz https:\/\/dmvs\.cuzk\.gov\.cz/);
  assert.match(html, /connect-src [^;]*https:\/\/gis\.brno\.cz https:\/\/services6\.arcgis\.com/);
  const footer = html.match(/<footer[\s\S]*?<\/footer>/)[0];
  assert.doesNotMatch(footer, /IPR|TSK/);
  assert.match(footer, /DTM Jihomoravského kraje/);
});

// Brno's codes (MTVU 5100xxx, technical-map lines 1xxxxxx) read as Prague's.
const { brnoMtvuCode, brnoLineCode } = await import("../pilot/public/sources.js");
test("kódy MTVU Brna na pražské", () => {
  assert.equal(brnoMtvuCode(5100710), 701); // komunikace
  assert.equal(brnoMtvuCode(5100720), 702); // chodník
  assert.equal(brnoMtvuCode(5100730), 703); // cyklostezka
  assert.equal(brnoMtvuCode(5100740), 704); // parkoviště
  assert.equal(brnoMtvuCode(5100761), 705); // tramvajová dráha
  assert.equal(brnoMtvuCode(5100610), 601); // budova
  assert.equal(brnoMtvuCode(5100555), 402); // žlab není voda
  assert.equal(brnoMtvuCode(5109999), null);
});
test("kódy linií technické mapy Brna na kódy IPR", () => {
  assert.equal(brnoLineCode(1255010), 55010); // osa kolejí MHD
  assert.equal(brnoLineCode(1271523), 71522); // svodidlo
  assert.equal(brnoLineCode(1660213), 61210); // plot drátěný
  assert.equal(brnoLineCode(1660217), 71210); // zděný plot
  assert.equal(brnoLineCode(1381214), 81214); // živý plot
  assert.equal(brnoLineCode(1542105), 42105); // hrana svahu
  assert.equal(brnoLineCode(1660800), null); // rozhraní ploch
});

// Every city site of tools/cities.mjs builds from the Prague page, with its own switch and footer links.
const { cityIndex, cityConfig } = await import("../tools/city_site.mjs");
const { SITES, NAMES } = await import("../tools/cities.mjs");
for (const id of Object.keys(SITES)) {
  test(`stránka ${id}: titulek, přepínač, CSP, odkazy na ostatní města`, () => {
    const html = cityIndex(id, read("index.html"));
    assert.match(cityConfig(id, read("config.js")), new RegExp(`export const CITY = "${id}";`));
    assert.match(html, new RegExp(`<title>Profily ulic · ${NAMES[id]}</title>`));
    assert.match(html, new RegExp(`<a href="\\./" aria-current="page">${NAMES[id]}</a>`));
    assert.match(html, /<a href="\.\.\/">Praha<\/a>/);
    for (const host of SITES[id].connect) assert.ok(html.match(/connect-src [^;]*/)[0].includes(host));
    // the towns ask RÚIAN of ČÚZK for their houses (gis.js ruianBuilding)
    if (SITES[id].bbox) assert.ok(html.match(/connect-src [^;]*/)[0].includes("https://ags.cuzk.gov.cz"));
    const footer = html.match(/<footer[\s\S]*?<\/footer>/)[0];
    assert.doesNotMatch(footer, /IPR|TSK/);
    for (const [other, name] of Object.entries(NAMES)) if (other !== id) assert.match(footer, new RegExp(`Profily ulic ${name}`));
  });
}
