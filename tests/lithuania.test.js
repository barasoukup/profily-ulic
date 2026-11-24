// Lithuania (Bára 24. 11. 2026): the state, Vilnius's topographic areas, the signs and norms (countries/LT.js,
// towns/lithuania.js). No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Litva: stát řezu, pobřeží, sousedé mimo", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8")));
  // Vilnius, Kaunas, Klaipėda (the port), Šiauliai, Panevėžys, Alytus, Nida on the Curonian Spit.
  for (const [lat, lon] of [[54.6872, 25.2797], [54.897, 23.9262], [55.7075, 21.1335], [55.9349, 23.3137], [55.7348, 24.3575], [54.3964, 24.0459], [55.3036, 21.0065]]) assert.equal(C.cityAt(lat, lon), "lithuania", `${lat},${lon}`);
  // Riga, Minsk, Kaliningrad, Suwałki (Poland), Daugavpils.
  for (const [lat, lon] of [[56.9496, 24.1052], [53.9006, 27.559], [54.7104, 20.4522], [54.1118, 22.9309], [55.8714, 26.5161]]) assert.notEqual(C.cityAt(lat, lon), "lithuania", `${lat},${lon}`);
});

test("Litva: mapa povrchů Vilniusu (kód a účel plochy)", async () => {
  const V = await import("../pilot/public/towns/lithuania.js");
  const c = (KODAS, Paskirtis = null) => V.vilniusCode({ KODAS, Paskirtis });
  assert.equal(c(2421, "kelias"), 701);
  assert.equal(c(2426, "kelias"), 701, "štěrková cesta je vozovka");
  assert.equal(c(2424, "pėsč"), 702);
  assert.equal(c(2422, "aikšt"), 702);
  assert.equal(c(2421, "dvir"), 703);
  assert.equal(c(2424, "park"), 704);
  assert.equal(c(2424, "nuovaža"), 1003);
  assert.equal(c(2425), 702, "dlažba bez účelu: chodník (Gedimino pr.)");
  assert.equal(c(2421), 1003, "asfalt bez účelu: zpevněná plocha");
  assert.equal(c(2426), null, "štěrk bez účelu: OSM");
  assert.equal(c(2403), 401);
  assert.equal(c(2203), 502);
  assert.equal(c(2301), 200);
  assert.equal(c(9999), null);
  const sq = [[25.0, 54.0], [25.001, 54.0], [25.001, 54.001], [25.0, 54.0]];
  const f = V.vilniusFeatures({ features: [{ properties: { KODAS: 2421, Paskirtis: "kelias" }, geometry: { type: "MultiPolygon", coordinates: [[sq], [sq]] } },
    { properties: { KODAS: 2410 }, geometry: { type: "Polygon", coordinates: [sq] } }] });
  assert.deepEqual(f.features.map((x) => x.attributes.code), [701, 701]);
  // The street under the centre (within 3 m) decides.
  const box = [[[25.0, 54.0], [25.001, 54.0], [25.001, 54.001], [25.0, 54.001], [25.0, 54.0]]];
  assert.ok(V.hasStreet([{ attributes: { CTVUK_KOD: 701 }, geometry: { rings: box } }], 25.0005, 54.0005));
  assert.ok(!V.hasStreet([{ attributes: { CTVUK_KOD: 401 }, geometry: { rings: box } }], 25.0005, 54.0005));
  assert.ok(!V.hasStreet([{ attributes: { CTVUK_KOD: 701 }, geometry: { rings: box } }], 25.0005, 54.0012), "20 m vedle: ne");
  assert.match(V.vilniusUrl("25.27,54.68,25.28,54.69"), /^https:\/\/gis\.vplanas\.lt\/arcgis\/rest\/services\/Baziniai_zemelapiai\/Vilnius_basemap_LKS_su_rajonu\/MapServer\/13\/query\?/);
  assert.match(V.vilniusUrl("25.27,54.68,25.28,54.69", 1000), /resultOffset=1000/);
  assert.deepEqual(await V.sources.surfaces("23.92,54.89,23.93,54.90"), { features: [], abroad: true }, "mimo Vilnius nic");
  globalThis.PROFILY_LT = { vilnius: "0" };
  assert.deepEqual(await V.sources.surfaces("25.27,54.68,25.28,54.69"), { features: [], abroad: true }, "?vilnius=0");
  delete globalThis.PROFILY_LT;
});

test("Litva: značky, normy, bez ortofota", async () => {
  const { COUNTRIES } = await import("../pilot/public/countries/index.js");
  const LT = COUNTRIES.LT, f = LT.signs.file;
  assert.equal(f({ k: "oneway", dir: "forward" }), "503");
  assert.equal(f({ k: "oneway", dir: "backward" }), "301");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), "301");
  assert.equal(LT.signs.plate({ k: "oneway", dir: "backward", plate: "protismer" }), "853");
  assert.equal(f({ k: "oneway", dir: "forward", plate: "protismer" }), null);
  assert.equal(f({ k: "b20a", v: 30 }), "329");
  assert.equal(f({ k: "c10a", walk: "left" }), "413b");
  assert.equal(f({ k: "c10a" }), "413a");
  assert.equal(f({ k: "ztp" }), "528");
  assert.equal(LT.signs.plate({ k: "ztp" }), "846");
  assert.equal(f({ k: "ip27a" }), null, "pěší zónu Litva nemá");
  assert.equal(f({ k: "b1", plate: "obsluha" }), null);
  assert.equal(LT.signs.label({ k: "b29" }, null, "B 29 Zákaz stání"), "333 Zákaz stání");
  for (const k of ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ip12", "ip14a", "ip15a", "ip20a", "zona30", "ip26a", "cyklozona", "c8a", "c7a", "c9a"]) {
    const file = f({ k });
    assert.ok(file && fs.existsSync(new URL(`../pilot/public/signs-LT/${file}.svg`, import.meta.url)), `${k}: ${file}`);
  }
  for (const file of ["301", "503", "329", "413a", "413b", "846", "853"]) {
    const svg = fs.readFileSync(new URL(`../pilot/public/signs-LT/${file}.svg`, import.meta.url), "utf8");
    assert.match(svg.match(/<svg[\s\S]*?>/)[0], /viewBox="[\d.]+ [\d.]+ [\d.]+ [\d.]+"/, file);
  }
  assert.match(fs.readFileSync(new URL("../pilot/public/signs-LT/329.svg", import.meta.url), "utf8"), /<text id="v"/);
  const S = await import("../pilot/public/signs.js");
  assert.ok(S.SPEED_TEMPLATES.has("329"));
  assert.equal(LT.limits({ type: "chodnik" }).min, 0, "jen doporučení: oranžově");
  assert.equal(LT.limits({ type: "chodnik" }).zaklad, 2.5);
  assert.equal(LT.limits({ type: "pruh" }).zaklad, 2.75);
  assert.equal(LT.laneOrtho, "none");
  assert.equal(LT.orthoEstimate, false);
  assert.equal(LT.socialistLooks, true);
  const L = await import("../pilot/public/lanes-ortho.js");
  assert.equal(await L.laneImage({ source: "none" }), null, "ortofoto NŽT se nepoužívá");
});

test("Litva: pod ulicí pro auta musí být vozovka mapy", async () => {
  const V = await import("../pilot/public/towns/lithuania.js");
  const box = [[[25.0, 54.0], [25.001, 54.0], [25.001, 54.001], [25.0, 54.001], [25.0, 54.0]]];
  const walk = [{ attributes: { CTVUK_KOD: 702 }, geometry: { rings: box } }];
  assert.ok(!V.hasStreet(walk, 25.0005, 54.0005, { highway: "residential" }), "obytná ulice nad chodníkem mapy: odhad");
  assert.ok(V.hasStreet(walk, 25.0005, 54.0005, { highway: "footway" }), "pěšina nad chodníkem mapy: mapa");
});
