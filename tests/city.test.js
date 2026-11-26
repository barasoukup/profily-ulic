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
// Font and Leaflet from the site itself (no Google Fonts, no unpkg), the CSP without those hosts.
test("písmo a Leaflet z vlastního webu, CSP bez Googlu a unpkg", () => {
  const html = read("index.html");
  assert.doesNotMatch(html, /googleapis|gstatic|unpkg/);
  assert.match(html, /href="fonts\/inter\.css"/);
  assert.match(html, /src="leaflet\/leaflet\.js"/);
  assert.match(html, /font-src 'self'/);
  for (const f of ["fonts/OFL.txt", "leaflet/LICENSE.txt", "leaflet/leaflet.css", "leaflet/images/layers.png"]) assert.ok(fs.existsSync(new URL(`../pilot/public/${f}`, import.meta.url)), f);
  for (const m of read("fonts/inter.css").matchAll(/url\(([^)]+)\)/g)) assert.ok(fs.existsSync(new URL(`../pilot/public/fonts/${m[1]}`, import.meta.url)), m[1]);
  assert.match(html, /IP adresy neukládáme a cookies nepoužíváme/);
});
// The credits of an export: the region of the cut, ČÚZK with the year, the DMVS standing in, the orthophoto.
test("zdroje exportu podle města a kraje řezu", async () => {
  const { creditLines, cityById } = await import("../pilot/public/city.js");
  const [cz, art] = creditLines(cityById("cesko"), { region: "Pardubický kraj" });
  assert.match(cz, /technická mapa © Pardubický kraj, IS DMVS ČÚZK/);
  assert.match(cz, /RÚIAN © ČÚZK, 2026/);
  assert.match(cz, /© přispěvatelé OpenStreetMap \(ODbL\)/);
  assert.match(art, /streetmix\.net/);
  assert.match(art, /creativecommons\.org\/licenses\/by-sa\/4\.0/);
  assert.doesNotMatch(art, /Bára/);
  assert.match(creditLines(cityById("olomouc"), {}, true)[0], /© kraje,/); // the region unknown
  const [praha, prahaArt] = creditLines(cityById("praha"), { ortho: true, dmvs: true, region: "Středočeský kraj" }, true);
  assert.match(praha, /MHMP, Geoportál Praha/);
  assert.match(praha, /ortofoto © ČÚZK, 2025/);
  assert.match(praha, /technická mapa © Středočeský kraj, IS DMVS ČÚZK/);
  assert.match(prahaArt, /Bára Soukupová \(MIT\)/);
  assert.doesNotMatch(creditLines(cityById("praha"))[0], /DMVS|ortofoto/);

  // Cyprus: the DLS buildings only where a house of the DLS was drawn (backlog, 26. 11. 2026).
  assert.doesNotMatch(creditLines(cityById("cyprus"), {})[0], /Department of Lands/);
  assert.match(creditLines(cityById("cyprus"), { cyDls: true })[0], /budovy © Department of Lands and Surveys/);
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
test("stát podle polohy řezu: Česko, Slovensko, Rakousko, Německo, cizina", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(read("mesta.json")));
  C.loadStates(JSON.parse(read("staty.json")));
  assert.equal(C.cityAt(49.907481, 16.442219), "cesko"); // Česká Třebová
  assert.equal(C.cityAt(49.7477, 18.6262), "cesko"); // Český Těšín, Hlavní třída (the border is the Olza)
  assert.equal(C.cityAt(48.146736, 17.106998), "slovensko"); // Bratislava, Suché mýto
  assert.equal(C.cityAt(48.7206, 21.258), "slovensko"); // Košice, Hlavná
  assert.equal(C.cityAt(49.7497, 18.6328), "poland"); // Cieszyn (Poland since 21. 11. 2026; the Czech border, exact, decides first)
  assert.equal(C.cityAt(48.2085, 16.3731), "austria"); // Wien, Stephansplatz
  assert.equal(C.cityAt(47.0707, 15.4395), "austria"); // Graz
  assert.equal(C.cityAt(48.137, 11.575), "germany"); // München
  assert.equal(C.cityAt(52.5163, 13.3777), "germany"); // Berlin, Brandenburger Tor
  assert.equal(C.cityAt(47.835, 12.98), "germany"); // Freilassing, by Salzburg
  assert.equal(C.cityAt(50.0796, 12.3739), "cesko"); // Cheb, náměstí
  assert.equal(C.cityAt(48.5734, 7.8105), "germany"); // Kehl
  assert.equal(C.cityAt(48.5818, 7.7509), "france"); // Strasbourg (France since 22. 11. 2026)
  const sk = C.setCity("slovensko");
  assert.ok(sk.abroad && !sk.techMap && !sk.dataName);
  assert.equal(sk.country, "SK");
  assert.equal(C.setCity("brno").country, "CZ");
  assert.equal(C.setCity("cesko").country, "CZ");
  assert.equal(C.setCity("cizina").country, null);
  assert.equal(C.setCity("austria").country, "AT");
  C.setCity("slovensko");
  assert.match(C.creditLines(sk, { orthoCity: "sk" })[0], /^Data: budovy © GKÚ Bratislava \(ZBGIS, CC BY 4\.0\) · ortofoto © GKÚ Bratislava, NLC/);
  // Elsewhere abroad no data of its own to credit: the line starts with OSM.
  assert.match(C.creditLines(C.setCity("cizina"))[0], /^Data: © přispěvatelé OpenStreetMap/);
  C.setCity("praha");
});

// The towns' passports (towns/pasporty.js): the page may ask their servers, a point takes its town.
test("pasporty měst: CSP, město podle polohy, převod typů", async () => {
  const { PASSPORT_HOSTS, passportAt, codes } = await import("../pilot/public/towns/pasporty.js");
  const connect = read("index.html").match(/connect-src [^;]*/)[0];
  for (const host of PASSPORT_HOSTS) assert.ok(connect.includes(host), host);
  assert.equal(await passportAt(18.1431, 49.4583), "roznov");
  assert.equal(await passportAt(16.531, 49.2985), null, "Kuřim vyřazená (Bára 26. 11. 2026)");
  // Left out after the A/B test of 26. 11. 2026: Chomutov, Šumperk (and Litoměřice, Prachatice, Roudnice);
  // Chotěboř for its licence (a demo portal's account, Bára 26. 11. 2026).
  assert.equal(await passportAt(15.672, 49.7207), null);
  assert.equal(await passportAt(13.4175, 50.4605), null);
  assert.equal(await passportAt(16.9706, 49.9653), null);
  assert.equal(await passportAt(14.42, 50.088), null);
  assert.equal(codes.roznov({ typ: "komunikace" }), 701);
  assert.equal(codes.roznov({ typ: "chodník" }), 702);
  assert.equal(codes.roznov({ typ: "schody" }), null);
});

// A passport that answers with nothing (as Jihlava's on 16. 11. 2026) leaves the box to the national DTM.
test("pasport bez ploch: plochy jen z technické mapy ČÚZK", async () => {
  const { withPassports } = await import("../pilot/public/towns/pasporty.js");
  const dtm = { features: [{ attributes: { CTVUK_KOD: 701 } }], region: "DTM" };
  const native = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ features: [] }));
  try {
    assert.deepEqual(await withPassports(async () => dtm)("16.530,49.298,16.532,49.299"), dtm);
  } finally { globalThis.fetch = native; }
});

test("slovenská města podle hranic ze ZBGIS (mesta-sk.json): Šamorín ani Svätý Jur nejsou Bratislava", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadSkTowns(JSON.parse(read("mesta-sk.json")));
  // The city of a point and its illustrations (step 4b: the Slovak towns are cities, mesta-sk.json).
  C.loadBounds(JSON.parse(read("mesta.json")));
  C.loadStates(JSON.parse(read("staty.json")));
  C.loadTowns(JSON.parse(read("mesta-sk.json")));
  const skArtAt = (lat, lon) => C.cityById(C.cityAt(lat, lon)).art;
  assert.equal(skArtAt(48.1467, 17.107), "bratislava"); // Suché mýto
  assert.equal(skArtAt(48.1905, 17.0243), "bratislava"); // Dúbravka
  assert.equal(skArtAt(48.0305, 17.3100), "slovensko"); // Šamorín
  assert.equal(skArtAt(48.2525, 17.2155), "slovensko"); // Svätý Jur
  assert.equal(skArtAt(48.7206, 21.258), "kosice");
  assert.equal(C.inSkTown("nitra", 18.084, 48.309), true);
  assert.equal(C.inSkTown("neznamo", 18.084, 48.309), undefined);
});

// Where a point lies (towns/index.js placeAt, docs/architecture-countries.md step 4): the state, the city, the town's
// illustrations and the sources with a territory of their own that have the point.
test("placeAt: stát, město, ilustrace a zdroje s vlastním územím", async () => {
  const C = await import("../pilot/public/city.js");
  const { placeAt } = await import("../pilot/public/towns/index.js");
  C.loadBounds(JSON.parse(read("mesta.json")));
  C.loadStates(JSON.parse(read("staty.json")));
  C.loadSkTowns(JSON.parse(read("mesta-sk.json")));
  C.loadTowns(JSON.parse(read("mesta-sk.json")));
  C.loadTowns(JSON.parse(read("mesta-at.json")));
  // Step 4b: the Slovak and Austrian cities by their boundaries, with their own illustrations and their state's sources.
  assert.deepEqual(placeAt(48.1467, 17.107), { country: "SK", city: "bratislava", art: "bratislava", sources: ["bratislava-pasport", "bratislava-tm"] });
  assert.deepEqual(placeAt(48.309, 18.084), { country: "SK", city: "nitra", art: "nitra", sources: ["nitra-kresba"] });
  assert.deepEqual(placeAt(48.594, 17.832), { country: "SK", city: "piestany", art: "slovensko", sources: ["piestany-kresba"] }); // no set of its own
  assert.deepEqual(placeAt(48.0305, 17.31), { country: "SK", city: "slovensko", art: "slovensko", sources: ["bratislava-tm"] }); // Šamorín: Bratislava's box, not the town
  assert.deepEqual(placeAt(48.2085, 16.3731), { country: "AT", city: "wien", art: "wien", sources: ["wien"] });
  assert.deepEqual(placeAt(48.31, 16.33), { country: "AT", city: "austria", art: "austria", sources: ["wien"] }); // Klosterneuburg: Vienna's box, not the city
  assert.deepEqual(placeAt(47.8, 13.045), { country: "AT", city: "salzburg", art: "salzburg", sources: ["salzburg"] });
  assert.deepEqual(placeAt(50.0817, 14.4176), { country: "CZ", city: "praha", art: "praha", sources: [] });
  assert.deepEqual(placeAt(47.87, 17.269), { country: null, city: "cizina", art: "cesko", sources: [] });
  // The other cities take their state's sources and texts.
  const { TOWNS } = await import("../pilot/public/towns/index.js");
  assert.equal(TOWNS.bratislava, TOWNS.slovensko);
  assert.equal(TOWNS.graz, TOWNS.austria);
  C.setCity("kosice");
  assert.equal(C.city.country, "SK");
  assert.equal(C.city.credit, C.cityById("slovensko").credit);
  C.setCity("praha");
});
