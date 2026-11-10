// The Brno site is made from the Prague files (tools/city_site.mjs): every swap must still find its text.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (f) => fs.readFileSync(new URL(`../pilot/public/${f}`, import.meta.url), "utf8");

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

// One page for the whole Czech Republic: its CSP lets the browser ask every city's servers, the former
// city sites send to it, and a point takes the city it lies in.
const { SITES } = await import("../tools/cities.mjs");
const { redirectPage } = await import("../tools/city_site.mjs");
test("jedna stránka: CSP pro servery všech měst, bez přepínače měst", () => {
  const html = read("index.html");
  const connect = html.match(/connect-src [^;]*/)[0];
  for (const c of Object.values(SITES)) for (const host of c.connect) assert.ok(connect.includes(host), host);
  assert.doesNotMatch(html, /city-toggle/);
});
test("bývalé stránky měst přesměrují i s řezem", () => {
  assert.match(redirectPage("brno"), /location\.replace\("\.\.\/\?mesto=brno" \+ location\.hash\)/);
});
test("město podle polohy řezu", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(read("mesta.json")));
  assert.equal(C.cityAt(50.0875, 14.4208), "praha");
  assert.equal(C.cityAt(49.1951, 16.6085), "brno");
  assert.equal(C.cityAt(50.503, 13.6363), "most");
  assert.equal(C.cityAt(50.6607, 14.0322), "usti"); // Mírové náměstí
  assert.equal(C.cityAt(49.907481, 16.442219), "cesko"); // Česká Třebová
  assert.equal(C.setCity("plzen").adjective, "plzeňské");
  C.setCity("praha");
});
