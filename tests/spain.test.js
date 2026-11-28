// Spain (Bára 23. 11. 2026): Zaragoza's paving map, the Catastro's buildings (towns/spain.js), CartoCiudad's search
// (search/cartociudad.js), the signs (countries/ES.js), the state by its border. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mtvuRect, deriveOn } from "./helpers/osm.js";

test("Španělsko: mapa povrchů Zaragozy (chodník, střední pás, zelený pás), vozovka podél os OSM, vypínač ?zaragoza=0", async () => {
  const E = await import("../app/public/towns/spain.js");
  const sq = (x) => [[[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]]];
  const got = E.zaragozaFeatures([[702, { features: [{ geometry: { type: "MultiPolygon", coordinates: [sq(0), sq(2)] } }] }], [1003, { features: [{ geometry: { type: "Polygon", coordinates: sq(4) } }] }]]);
  assert.deepEqual(got.features.map((f) => f.attributes.code), [702, 702, 1003], "MultiPolygon po polygonech");
  // A band about each road segment: 4 corners + the closing one, half 10 m for a tertiary road, marked as an estimate.
  const bands = E.roadBands([{ type: "way", tags: { highway: "tertiary" }, geometry: [{ lon: -0.88, lat: 41.65 }, { lon: -0.879, lat: 41.65 }] },
    { type: "way", tags: { highway: "footway" }, geometry: [{ lon: -0.88, lat: 41.65 }, { lon: -0.879, lat: 41.65 }] },
    { type: "way", tags: { highway: "primary", tunnel: "yes" }, geometry: [{ lon: -0.88, lat: 41.65 }, { lon: -0.879, lat: 41.65 }] }], 41.65);
  assert.equal(bands.length, 1, "jen silnice, ne chodník ani tunel");
  assert.equal(bands[0].attributes.CTVUK_KOD, 701);
  assert.equal(bands[0].attributes.ODHAD, 1);
  const lats = bands[0].geometry.rings[0].map(([, y]) => y);
  assert.ok(Math.abs((Math.max(...lats) - Math.min(...lats)) * 110574 - 20) < 0.01, "pás 2 × 10 m");
  globalThis.PROFILY_ES = { zaragoza: "0" };
  try { assert.deepEqual(await E.sources.surfaces("-0.884,41.648,-0.882,41.650"), { features: [], abroad: true }); } finally { delete globalThis.PROFILY_ES; }
  assert.deepEqual(await E.sources.surfaces("-3.704,40.416,-3.702,40.418"), { features: [], abroad: true }, "Madrid: bez mapy, bez dotazu");
});

test("Španělsko: budovy z katastru (podlaží části u fasády, rok, užití)", async () => {
  const E = await import("../app/public/towns/spain.js");
  const part = (floors, ring) => `<gml:featureMember><bu-ext2d:BuildingPart><bu-ext2d:numberOfFloorsAboveGround>${floors}</bu-ext2d:numberOfFloorsAboveGround><gml:posList srsDimension="2">${ring.map(([x, y]) => `${y} ${x}`).join(" ")}</gml:posList></bu-ext2d:BuildingPart></gml:featureMember>`;
  const sq = (x) => [[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]];
  const building = `<gml:featureMember><bu-ext2d:Building><bu-core2d:beginning>1966-01-01T00:00:00</bu-core2d:beginning><bu-ext2d:currentUse>1_residential</bu-ext2d:currentUse><bu-ext2d:numberOfDwellings>12</bu-ext2d:numberOfDwellings></bu-ext2d:Building></gml:featureMember>`;
  const parts = part(8, sq(0)) + part(2, sq(2));
  assert.deepEqual(E.catastroBuilding(building, parts, 0.5, 0.5), { built: 1966, office: undefined, house: undefined, type: "apartments", cornice: 8, total: 8, roof: 0, catastro: true });
  assert.equal(E.catastroBuilding(building, parts, 0.5, 2.5).total, 2, "dvorní část nižší");
  assert.equal(E.catastroBuilding(building, parts, 0.5, 9).total, 8, "bod mimo části: nejvyšší");
  assert.deepEqual(E.catastroBuilding("", "", 0, 0), {});
  globalThis.PROFILY_ES = { catastro: "0" };
  try { assert.deepEqual(await E.sources.podlaznost(40.4, -3.7), {}); } finally { delete globalThis.PROFILY_ES; }
});

test("Španělsko: v Baskicku a Navaře se katastr neptá, ale foralního katastru provincie (regions-es.json, díry Treviño a Villaverde)", async () => {
  const E = await import("../app/public/towns/spain.js");
  const F = await import("../app/public/towns/spain-foral.js");
  const orig = globalThis.fetch, asked = [];
  globalThis.fetch = async (url) => { asked.push(String(url)); return { ok: true, text: async () => "" }; };
  try {
    for (const [name, lat, lon, code] of [["Bilbao", 43.263, -2.935, "bi"], ["Donostia", 43.3183, -1.9812, "gi"], ["Vitoria-Gasteiz", 42.8467, -2.6716, "ar"], ["Pamplona", 42.8125, -1.6458, "nc"]]) {
      assert.equal(await E.foralAt(lon, lat), code, name);
      const n = asked.length;
      globalThis.PROFILY_ES = { foral: "1" };
      try { assert.deepEqual(await E.sources.podlaznost(lat, lon), {}, name); } finally { delete globalThis.PROFILY_ES; }
      assert.equal(asked.length - n, 1, `${name}: jeden dotaz`);
      assert.ok(asked.at(-1).startsWith(F.FORAL[code].url), `${name}: katastr provincie`);
      globalThis.PROFILY_ES = { foral: "0" };
      try { assert.deepEqual(await E.sources.podlaznost(lat + 0.001, lon), {}); } finally { delete globalThis.PROFILY_ES; }
      assert.equal(asked.length - n, 1, `${name}: ?foral=0 bez dotazu, ani na Catastro`);
    }
    assert.equal(await E.foralAt(-1.6064, 42.0617), "nc", "Tudela");
    // Near the border of Bizkaia and Gipuzkoa (Ermua, Eibar): still inside the four, the province of the point.
    assert.equal(await E.foralAt(-2.4717, 43.1844), "gi", "Eibar");
    for (const [name, lat, lon] of [["Treviño (Burgos v Álavě)", 42.735, -2.746], ["Villaverde (Kantábrie v Bizkaji)", 43.24, -3.28], ["Burgos", 42.344, -3.697], ["Santander", 43.4623, -3.81]]) {
      assert.equal(await E.foralAt(lon, lat), null, name);
      assert.equal(await E.provinceAt(lon, lat), null, name);
      const n = asked.length;
      await E.sources.podlaznost(lat, lon);
      assert.equal(asked.length - n, 2, `${name}: dotaz na katastr`);
      assert.ok(asked.at(-1).startsWith(E.CATASTRO_WFS));
    }
  } finally { globalThis.fetch = orig; }
});

test("Španělsko: foralní katastry (Navarra, Gipuzkoa, Bizkaia, Álava): dotaz a čtení GML", async () => {
  const F = await import("../app/public/towns/spain-foral.js");
  const gml = (c) => fs.readFileSync(new URL(`fixtures/foral-${c}.xml`, import.meta.url), "utf8");
  // Navarre: BU:Building, the year in "beginning", the use in xlink:href (public services: no type).
  assert.deepEqual(F.foralBuilding("nc", gml("nc"), 42.81855, -1.6443), { built: 1953, office: undefined, house: undefined, type: undefined, cornice: 2, total: 2, roof: 0, foral: "nc" });
  assert.equal(F.foralBuilding("nc", gml("nc"), 42.81828, -1.6443).total, 6, "soused v témž okně");
  // Gipuzkoa: elements with xsi:nil="false", the year in "end", shops below flats are flats.
  assert.deepEqual(F.foralBuilding("gi", gml("gi"), 43.3212, -1.9766), { built: 1942, office: undefined, house: undefined, type: "apartments", cornice: 7, total: 7, roof: 0, foral: "gi" });
  assert.equal(F.foralBuilding("gi", gml("gi"), 43.3214, -1.9767).built, 1981);
  // Bizkaia: "beginning" nil, the year in "end", the use in xlink:title with trailing spaces.
  assert.deepEqual(F.foralBuilding("bi", gml("bi"), 43.2635, -2.9381), { built: 1920, office: undefined, house: undefined, type: "apartments", cornice: 7, total: 7, roof: 0, foral: "bi" });
  // Álava: lon lat in the GML; read as lat lon the point would lie in no building and the other would be taken.
  assert.equal(F.foralBuilding("ar", gml("ar"), 42.84998, -2.66812).built, 1972);
  assert.equal(F.foralBuilding("ar", gml("ar"), 42.85, -2.66835).built, 1965);
  assert.equal(F.foralBuilding("ar", gml("ar"), 42.84998, -2.66812).type, "apartments", "residential jako text");
  assert.deepEqual(F.foralBuilding("nc", "", 0, 0), {});
  // The bbox: lat lon with the CRS as a URI (Navarre, Gipuzkoa), EPSG:4258 (Bizkaia), lon lat in EPSG:4326 (Álava).
  const bbox = (c) => new URL(F.foralUrl(c, 42.8, -1.6, 0.00001)).searchParams.get("bbox");
  assert.equal(bbox("nc"), "42.79999,-1.60001,42.80001,-1.59999,http://www.opengis.net/def/crs/EPSG/0/4258");
  assert.equal(bbox("bi"), "42.79999,-1.60001,42.80001,-1.59999,EPSG:4258");
  assert.equal(bbox("ar"), "-1.60001,42.79999,-1.59999,42.80001,EPSG:4326");
  assert.equal(new URL(F.foralUrl("gi", 43.3, -1.98, 0.00001)).searchParams.get("typeNames"), "bu-ext2d:Building");
  // The switch: ?foral=0 none, 1 all, a list those, else the default.
  assert.equal(F.foralEnabled("nc", "0"), false);
  assert.equal(F.foralEnabled("bi", "1"), true);
  assert.deepEqual(["nc", "gi", "bi", "ar"].map((c) => F.foralEnabled(c, "nc,gi")), [true, true, false, false]);
  assert.deepEqual(["nc", "gi", "bi", "ar"].map((c) => F.foralEnabled(c, null)), ["nc", "gi", "bi", "ar"].map((c) => F.FORAL_ON.has(c)));
  // The credit of each.
  const { sourceCredits } = await import("../app/public/credits.js");
  assert.ok(sourceCredits({ esForal: "nc" })[0].includes("Servicio proporcionado por el Gobierno de Navarra"));
  for (const c of ["gi", "bi", "ar"]) assert.ok(sourceCredits({ esForal: c })[0].includes("Foru Aldundia"), c);
});

test("Španělsko: hledání CartoCiudad (adresa s bodem, ulice bez bodu až přes find)", async () => {
  const S = await import("../app/public/search/cartociudad.js");
  const got = S.parseEs([
    { type: "portal", address: "GRAN VIA", portalNumber: 11, muni: "Mula", lat: 38.04, lng: -1.49, id: "a" },
    { type: "callejero", address: "CALLE ALCALA, Madrid", lat: 0, lng: 0, id: "280790007456" },
    { type: "Municipio", address: "Zaragoza, Zaragoza", lat: 0, lng: 0, id: "50297" },
    { type: "toponimo", address: "X", lat: 1, lng: 1 },
  ]);
  assert.deepEqual(got.map((x) => [x.text, x.type, !!x.at]), [["GRAN VIA 11, Mula", "AdresniMisto", true], ["CALLE ALCALA, Madrid", "Ulice", false], ["Zaragoza, Zaragoza", "Obec", false]]);
  assert.deepEqual(got[1].find, { id: "280790007456", type: "callejero" });
  assert.deepEqual(S.wktPoint("MULTILINESTRING((-3.70 40.41,-3.69 40.42,-3.68 40.43),(1 1,2 2))"), { lon: -3.69, lat: 40.42 });
  assert.deepEqual(S.wktPoint("POINT(-3.7 40.4)"), { lon: -3.7, lat: 40.4 });
  assert.ok(S.looksSpanish("calle de alcalá") && S.looksSpanish("carrer de balmes") && !S.looksSpanish("Václavské náměstí"));
});

test("Španělsko: značky (S-11 / R-101 podle směru, R-301, autopista a autovía)", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const ES = COUNTRIES.ES, f = ES.signs.file;
  assert.equal(f({ k: "oneway", dir: "forward" }), "S-11");
  assert.equal(f({ k: "oneway", dir: "backward" }), "R-101");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), "R-101-plus-S-880d");
  assert.equal(f({ k: "b20a", v: 30 }), "R-301-30");
  assert.equal(f({ k: "b20a", v: 35 }), null);
  assert.equal(f({ k: "ip14a", ref: "AP-7" }), "S-1");
  assert.equal(f({ k: "ip14a", ref: "A-2" }), "S-1a");
  assert.equal(f({ k: "ip14a", ref: "E-15;AP-7" }), "S-1", "autopista i za evropským číslem");
  assert.equal(f({ k: "ip14a", ref: "A-2;AP-7" }), "S-1");
  assert.equal(f({ k: "ip14a", ref: "C-32" }), null, "C-32 může být obojí: bez značky");
  assert.equal(f({ k: "ip14a" }), null);
  assert.equal(ES.signs.label({ k: "zona30" }, null, "IZ 8a Zóna 30"), "Zóna 30", "tabule ZONA z katalogu 2003: bez kódu");
  assert.equal(f({ k: "ztp" }), null, "vyhrazené stání jen s textem: nekreslí se");
  assert.equal(ES.lawNeed(false, 1, 2.5), 5, "obousměrka: dva průjezdné pruhy");
  assert.equal(ES.lawNeed(true, 1, 2.5), 3, "jednosměrka: 3 m k protějšímu okraji (čl. 91.2 a RGC)");
  assert.equal(ES.limits({ type: "chodnik", width: 1.5 }, []).min, 1.8);
  assert.deepEqual([ES.limits({ type: "cyklopruh", width: 1.2 }, []).min, ES.limits({ type: "cyklostezka", width: 1.2 }, []).zaklad], [1.4, 1.4], "1,4 m je minimum, 1 m jen výjimka");
});

test("Španělsko: obytná ulice S-47 (20 km/h), S-28 jen s 10 km/h; výchozí rychlost podle čl. 50 RGC", async () => {
  const { deriveSigns, signFile } = await import("../app/public/signs.js");
  const two = () => ({ segments: [{ type: "chodnik" }, { type: "pruh", dir: "backward" }, { type: "pruh" }, { type: "chodnik" }] });
  const drawn = (tags) => deriveSigns(two(), tags, { country: "ES" }).segments[2].signs?.map((x) => signFile(x, null, "ES")) || [];
  assert.deepEqual(drawn({ highway: "living_street" }), ["S-47"]);
  assert.deepEqual(drawn({ highway: "living_street", maxspeed: "20" }), ["S-47"], "20 km/h říká zóna sama");
  assert.deepEqual(drawn({ highway: "living_street", maxspeed: "10" }), ["R-301-10", "S-28"], "S-28 vždy s R-301 10");
  // Art. 50.1: 30 with one lane a direction (no sign drawn), 50 there is a sign; with two lanes a direction 50 is the default.
  assert.deepEqual(drawn({ highway: "residential", maxspeed: "30" }), []);
  assert.deepEqual(drawn({ highway: "residential", maxspeed: "50" }), ["R-301-50"]);
  assert.deepEqual(drawn({ highway: "primary", maxspeed: "50", lanes: "4" }), []);
  assert.deepEqual(drawn({ highway: "primary", maxspeed: "30", lanes: "4" }), ["R-301-30"]);
  // Elsewhere unchanged: the Czech 50 hidden, the living street IZ 5a.
  assert.deepEqual(deriveSigns(two(), { highway: "residential", maxspeed: "50" }).segments[2].signs, undefined);
});

test("Španělsko: odhad stání podle zákona nechá dva průjezdné pruhy (recenze 23. 11. 2026)", async () => {
  const C = await import("../app/public/city.js");
  const { localFrame } = await import("../app/public/derive.js");
  const frame = localFrame(40.42, -3.7);
  const rect = mtvuRect;
  const ll = (x, y) => { const [lon, lat] = frame.toLonLat(x, y); return { lon, lat }; };
  const road = (w) => {
    const polys = [rect(601, -w / 2 - 8, -w / 2 - 3), rect(702, -w / 2 - 3, -w / 2), rect(701, -w / 2, w / 2), rect(702, w / 2, w / 2 + 3), rect(601, w / 2 + 3, w / 2 + 8)];
    const way = { type: "way", id: 1, tags: { highway: "residential" }, geometry: [ll(0, -60), ll(0, 60)] };
    return deriveOn({ polys, elements: [way], frame, way, inZps: false });
  };
  C.setCity("spain");
  try {
    for (const w of [5, 6, 7, 9]) {
      const p = road(w), segs = p.segments.map((x) => `${x.type} ${x.width.toFixed(2)}`).join(", ");
      assert.ok(p.segments.filter((x) => x.type === "pruh").every((x) => x.width >= 2.5 - 1e-6), `${w} m: ${segs}`);
    }
  } finally { C.setCity("praha"); }
});

test("Španělsko: katastr (osy dotazu, budova pod bodem, ne soused), pruhy z ortofota ne v Melille", async () => {
  const E = await import("../app/public/towns/spain.js");
  const u = new URL(E.catastroUrl("BU:Building", 40.4, -3.7, 0.000005));
  assert.deepEqual(u.searchParams.get("bbox").split(",").map((v) => Math.round(+v * 1e6) / 1e6), [40.399995, -3.700005, 40.400005, -3.699995], "bbox lat, lon");
  const b = (year, ring) => `<gml:featureMember><bu-ext2d:Building><bu-core2d:beginning>${year}-01-01</bu-core2d:beginning><gml:posList>${ring.map(([x, y]) => `${y} ${x}`).join(" ")}</gml:posList></bu-ext2d:Building></gml:featureMember>`;
  const sq = (x) => [[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]];
  assert.equal(E.catastroBuilding(b(1900, sq(0)) + b(1975, sq(1)), "", 0.5, 1.5).built, 1975, "štítová zeď: dům pod bodem");
  const L = await import("../app/public/lanes-ortho.js");
  const { localFrame } = await import("../app/public/derive.js");
  assert.equal(await L.laneImage({ source: "es", frame: localFrame(35.293, -2.94), dir: [1, 0], t0: -10, t1: 10 }), null, "Melilla: snímek Airbus, licence nevyjasněná");
});

test("Španělsko: jméno ulice z CartoCiudad se shodne s OSM (Passeig de Gràcia)", async () => {
  const { nearestStreet, localFrame } = await import("../app/public/derive.js");
  const frame = localFrame(41.39, 2.16);
  const ll = (x, y) => { const [lon, lat] = frame.toLonLat(x, y); return { lon, lat }; };
  const osm = { elements: [{ type: "way", id: 1, tags: { highway: "residential", name: "Carrer de Mallorca" }, geometry: [ll(-50, 2), ll(50, 2)] },
    { type: "way", id: 2, tags: { highway: "primary", name: "Passeig de Gràcia" }, geometry: [ll(10, -50), ll(10, 50)] }] };
  assert.equal(nearestStreet(osm, frame, [0, 0]).way.id, 1);
  assert.equal(nearestStreet(osm, frame, [0, 0], "PASEO GRACIA").way.id, 2);
});
