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

// The coast's 400 m only by the sea (Bára 24. 11. 2026): a harbour and the sea off the beach stay the state's, a cut
// 300 m beyond a land border does not (city.js stateEntry, staty.json land_*).
test("Pobřeží: tolerance 400 m jen u moře, ne u hranice na souši (LT, FI, DK)", async () => {
  const C = await import("../pilot/public/city.js");
  const staty = JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8"));
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  // Outside the state's ring (GISCO's ring alone does not take them), within 400 m of the sea coast.
  const sea = [["lithuania", 55.64922, 21.16001], ["lithuania", 55.84707, 21.0545], ["finland", 60.1316, 24.99252], ["denmark", 55.68931, 12.60393]];
  for (const [st, lat, lon] of sea) {
    C.loadStates({ ring: staty[st] });
    assert.equal(C.cityAt(lat, lon), "cizina", `${lat},${lon} leží mimo kruh`);
    C.loadStates(staty);
    assert.equal(C.cityAt(lat, lon), st, `${lat},${lon} moře u pobřeží`);
  }
  // 300 m beyond the land border: Latvia, Belarus, Kaliningrad; Sweden, Norway, Russia by Finland.
  const land = [[56.4133, 22.22338], [56.33535, 23.76874], [54.27878, 25.407], [55.07024, 26.26848], [54.92863, 22.7513], [55.24284, 21.26685],
    [66.34859, 23.65094], [67.51083, 23.4253], [69.59307, 25.94434], [61.90679, 30.24017]];
  C.loadStates(staty);
  for (const [lat, lon] of land) assert.equal(C.cityAt(lat, lon), "cizina", `${lat},${lon}`);
  // Without the land borders (the old rule) they were taken in.
  C.loadStates(Object.fromEntries(Object.entries(staty).filter(([id]) => !id.startsWith("land_"))));
  for (const [lat, lon] of land) assert.notEqual(C.cityAt(lat, lon), "cizina", `${lat},${lon} dřív`);
  // The land borders are lines, not states.
  C.loadStates(staty);
  assert.equal(C.cityAt(54.6872, 25.2797), "lithuania");
});

test("Litva: mapa povrchů Vilniusu (kód a účel plochy)", async () => {
  const V = await import("../pilot/public/towns/lithuania.js");
  const c = (KODAS, Paskirtis = null) => V.vilniusCode({ KODAS, Paskirtis });
  assert.equal(c(2421, "kelias"), 701);
  assert.equal(c(2426, "kelias"), 701, "štěrková cesta je vozovka");
  assert.equal(c(2424, "pėsč"), 702);
  assert.equal(c(2422, "aikšt"), 1003);
  assert.equal(c(2428, "sporto"), 901);
  assert.equal(c(2421, "Kelias"), 701);
  assert.equal(c(2409), null);
  assert.equal(c(2414), null);
  assert.equal(c(2206), 402);
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
  globalThis.PROFILY_LT = { grpk: "0" };
  assert.deepEqual(await V.sources.surfaces("23.92,54.89,23.93,54.90"), { features: [], abroad: true }, "mimo Vilnius nic");
  globalThis.PROFILY_LT = { grpk: "0" };
  assert.deepEqual(await V.sources.surfaces("25.27,54.68,25.28,54.69"), { features: [], abroad: true }, "výchozí: bez mapy Vilniusu");
  globalThis.PROFILY_LT = { vilnius: "0", grpk: "0" };
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
  assert.equal(await L.orthoPatch({ source: "none", lon: 25.28, lat: 54.69, half: 20, px: 256 }), null, "ani pro model obrub, nic na ČÚZK");
});

test("Litva: pod ulicí pro auta musí být vozovka mapy", async () => {
  const V = await import("../pilot/public/towns/lithuania.js");
  const box = [[[25.0, 54.0], [25.001, 54.0], [25.001, 54.001], [25.0, 54.001], [25.0, 54.0]]];
  const walk = [{ attributes: { CTVUK_KOD: 702 }, geometry: { rings: box } }];
  assert.ok(!V.hasStreet(walk, 25.0005, 54.0005, { highway: "residential" }), "obytná ulice nad chodníkem mapy: odhad");
  assert.ok(V.hasStreet(walk, 25.0005, 54.0005, { highway: "footway" }), "pěšina nad chodníkem mapy: mapa");
});

// Vilnius's map is off by default (?vilnius=1; Bára 24. 11. 2026: what is worse stays off), the GRPK's houses on; the
// GRPK's houses that OSM lacks join OSM's for the estimate, those OSM has stay OSM's.
test("Litva: mapa Vilniusu vypnutá (?vilnius=1), budovy GRPK zapnuté, GRPK doplní domy, které OSM nemá", async () => {
  const V = await import("../pilot/public/towns/lithuania.js");
  delete globalThis.PROFILY_LT;
  assert.ok(!V.vilniusOn() && V.grpkOn(), "výchozí: mapa Vilniusu vypnutá, GRPK zapnuté");
  globalThis.PROFILY_LT = { vilnius: "1", grpk: "0" };
  assert.ok(V.vilniusOn() && !V.grpkOn(), "?vilnius=1, ?grpk=0");
  delete globalThis.PROFILY_LT;
  const url = new URL(V.grpkUrl("25.27,54.68,25.28,54.69"));
  assert.equal(url.origin + url.pathname, "https://www.geoportal.lt/arcgis/rest/services/NZT/GRPK/MapServer/22/query");
  assert.equal(url.searchParams.get("f"), "json");
  assert.ok(!url.searchParams.has("resultOffset") && !url.searchParams.has("orderByFields"), "služba stránkování odmítá");
  // Esri's rings: the outer clockwise.
  const sq = (x, y, d = 0.0002) => [[x, y], [x, y + d], [x + d, y + d], [x + d, y], [x, y]];
  const f = V.grpkFeatures({ features: [{ attributes: { GKODAS: "pa0" }, geometry: { rings: [sq(25.0, 54.0)] } }, { attributes: { GKODAS: "pa23" }, geometry: { rings: [sq(25.001, 54.0)] } },
    { attributes: { GKODAS: "pa651" }, geometry: { rings: [sq(25.002, 54.0)] } }] });
  assert.deepEqual(f.map((x) => x.attributes.CTVUK_KOD), [601, 601], "větrník ne");
  const osmHouse = { type: "area", id: 1, tags: { building: "yes" }, geometry: sq(25.00002, 54.00002, 0.00015).map(([lon, lat]) => ({ lat, lon })) };
  const add = V.grpkAsOsm(f, [osmHouse]);
  assert.equal(add.length, 1, "dům, který OSM má, se nepřidá");
  assert.equal(add[0].tags.building, "yes");
  assert.ok(Math.abs(add[0].geometry[0].lon - 25.001) < 1e-9);
});
