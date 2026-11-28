// Italy (Bára 23. 11. 2026): only where an orthophoto has an open licence (Bolzano, Turin, Bologna, Modena); Bologna's
// buildings; the signs (countries/IT.js). No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Itálie: ortofoto jen oblastí s otevřenou licencí (Bologna, Bolzano), Řím jen AGEA", async () => {
  const L = await import("../app/public/lanes-ortho.js");
  assert.deepEqual(L.idsAt("it", 11.3426, 44.4949), ["it-bo"]);
  assert.deepEqual(L.idsAt("it", 11.3548, 46.4983), ["it-bz"]);
  assert.deepEqual(L.idsAt("it", 12.4964, 41.9028), [], "Řím: jen AGEA");
});

test("Itálie: budovy Bologni (výška → podlaží), mapa povrchů vypnutá", async () => {
  const I = await import("../app/public/towns/italy.js");
  assert.deepEqual(I.bolognaBuilding({ altezza_gr: 19.2, descrizion: "Edificio generico" }), { type: undefined, cornice: 6, total: 6, roof: 0, height: 19.2 });
  assert.equal(I.bolognaBuilding({ altezza_gr: 25, descrizion: "Chiesa" }).type, "church");
  assert.deepEqual(I.bolognaBuilding({ altezza_gr: 6, descrizion: "Portico" }), {});
  assert.deepEqual(await I.sources.surfaces("11.340,44.492,11.345,44.495"), { features: [], abroad: true }, "bez ?bologna=1 nic");
  const roads = I.bolognaRoads([{ descrizion: "Tracciato principale in tronco", geo_shape: { geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } } },
    { descrizion: "Area di sovrapposizione tra strada e corso d'acqua", geo_shape: { geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } } }]);
  assert.equal(roads.features.length, 1);
});

test("Itálie: značky a normy", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const IT = COUNTRIES.IT, f = IT.signs.file;
  assert.equal(f({ k: "oneway", dir: "forward" }), "II-349");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), "II-47-plus-II-4b");
  assert.equal(IT.signs.label({ k: "b29" }, null, "B 29 Zákaz stání"), "II.74 Zákaz stání");
  assert.equal(IT.signs.label({ k: "zona30" }, null, "IZ 8a Zóna s dopravním omezením"), "II.323/a Zóna s dopravním omezením");
  assert.equal(f({ k: "ip20a" }), null, "vyhrazený pruh je panel Uso corsie, kresba chybí");
  assert.equal(IT.limits({ type: "chodnik" }).min, 0.9);
});

test("Itálie: ortofoto Turína a Modeny i v severních exklávách Modeny", async () => {
  const L = await import("../app/public/lanes-ortho.js");
  assert.deepEqual(L.idsAt("it", 7.6869, 45.0703), ["it-to"]);
  assert.deepEqual(L.idsAt("it", 10.9252, 44.6471), ["it-mo"]);
  assert.deepEqual(L.idsAt("it", 10.89281, 44.74047), ["it-mo"], "exkláva Modeny");
});

// ISTAT's municipal borders (Bára 23. 11. 2026, the review): points 80 m inside and outside Turin, Modena and Bologna that
// GISCO's 1 : 1 000 000 placed wrong; every point of the covered area lies in its orthophoto's box; Turin's credit in
// the Geoportale's wording.
test("Itálie: hranice obcí ISTAT, ortofoto pokrývá celé území, kredit Turína", async () => {
  const C = await import("../app/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../app/public/towns.json", import.meta.url), "utf8")));
  const staty = JSON.parse(fs.readFileSync(new URL("../app/public/states.json", import.meta.url), "utf8"));
  C.loadStates(staty);
  const inside = [[45.1387, 7.66514], [45.09861, 7.7503], [45.0192, 7.59288], [44.72488, 10.89973], [44.62863, 10.99276], [44.61059, 10.82662],
    [44.5509, 11.3758], [44.4444, 11.35468], [44.49141, 11.26779], [44.73113, 10.8926], [44.74047, 10.89281]];
  const outside = [[45.13798, 7.67457], [45.07884, 7.77075], [45.07003, 7.60659], [44.72048, 10.90093], [44.63424, 10.98652], [44.59982, 10.86637],
    [44.54965, 11.37703], [44.4755, 11.40534], [44.47656, 11.29045]];
  for (const [lat, lon] of inside) assert.equal(C.cityAt(lat, lon), "italy", `uvnitř ${lat},${lon}`);
  for (const [lat, lon] of outside) {
    assert.equal(C.cityAt(lat, lon), "cizina", `venku ${lat},${lon}`);
    assert.match(C.closedAt(lat, lon) || "", /Itálie/, `bez profilu ${lat},${lon}`);
  }
  const L = await import("../app/public/lanes-ortho.js");
  // Lombardy has the DBT, no orthophoto (towns/lombardy.js).
  const { inLombardy } = await import("../app/public/towns/lombardy.js");
  // Every point outside Lombardy has an orthophoto; inside it none (Bolzano's box reaches in: Ponte di Legno, Valfurva;
  // the review of 24. 11. 2026), and the kerb model is not loaded there (lanes-ortho.js orthoHereAt).
  for (const ring of staty.italy) for (const [lon, lat] of ring) if (!inLombardy(lon, lat)) assert.ok(L.idsAt("it", lon, lat).length, `mimo obdélníky ortofot ${lon},${lat}`);
  for (const [lon, lat] of [[10.51, 46.26], [10.50, 46.41], [9.19, 45.46]]) {
    assert.deepEqual(L.idsAt("it", lon, lat), [], `Lombardie ${lon},${lat}`);
    assert.equal(L.orthoHereAt("it", lon, lat), false);
  }
  assert.equal(L.orthoHereAt("it", 11.35, 46.5), true, "Bolzano");
  assert.equal(L.orthoHereAt("none", 25.28, 54.69), false, "Litva");
  assert.equal(L.orthoHereAt("fi", 23.76, 61.5), false, "Tampere");
  assert.equal(L.orthoHereAt("cuzk", 14.42, 50.08), true);
  const { SOURCE_CREDITS } = await import("../app/public/credits.js");
  assert.match(SOURCE_CREDITS.orthoCity["it-to"](), /Base cartografica realizzata da .+, integrata con Ortofoto digitale colore 2023 della Città di Torino reperiti sul Geoportale del Comune di Torino/);
});

test("Itálie: výpadek ortofota se ohlásí (jako Belgie a Portugalsko)", async () => {
  const L = await import("../app/public/lanes-ortho.js");
  const lon0 = 11.3426, lat0 = 44.4949, k = Math.cos((lat0 * Math.PI) / 180);
  const frame = { toLonLat: (x, y) => [lon0 + x / (111320 * k), lat0 + y / 110574] };
  const down = async () => ({ ok: false, status: 503 });
  await assert.rejects(L.laneImage({ frame, dir: [0, 1], t0: -10, t1: 10, source: "it", fetchImpl: down }), /503/);
  assert.equal(await L.laneImage({ frame, dir: [0, 1], t0: -10, t1: 10, source: "it", fetchImpl: async () => ({ ok: false, status: 404 }) }), null, "bez snímku: žádný");
});

// A stubbed fetch: the URLs asked and the answers in turn (no network).
function stubFetch(answers) {
  const urls = [], fetch0 = globalThis.fetch;
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    const a = answers.length > 1 ? answers.shift() : answers[0];
    return { ok: a.status ? a.status < 400 : true, status: a.status || 200, text: async () => "x", json: async () => a.json };
  };
  return { urls, restore: () => { globalThis.fetch = fetch0; } };
}

test("Itálie: mapa povrchů Bologni s ?bologna=1 (pořadí os, stránkování, výpadek)", async () => {
  const I = await import("../app/public/towns/italy.js");
  globalThis.PROFILY_IT = { bologna: "1" };
  try {
    // A road area far from the cut's centre: asked lat-first in in_bbox, two pages, then nothing at the centre.
    const far = { descrizion: "Tracciato principale in tronco", geo_shape: { geometry: { type: "Polygon", coordinates: [[[11.3, 44.4], [11.301, 44.4], [11.301, 44.401], [11.3, 44.4]]] } } };
    const s = stubFetch([{ json: { results: Array(100).fill(far) } }, { json: { results: [far] } }]);
    try {
      assert.deepEqual(await I.sources.surfaces("11.3400,44.4920,11.3450,44.4950"), { features: [], abroad: true });
      assert.equal(s.urls.length, 2);
      assert.equal(new URL(s.urls[0]).searchParams.get("where"), "in_bbox(geo_shape,44.492,11.34,44.495,11.345)");
      assert.equal(new URL(s.urls[1]).searchParams.get("offset"), "100");
    } finally { s.restore(); }
    const e = stubFetch([{ status: 400, json: {} }]);
    try {
      assert.deepEqual(await I.sources.surfaces("11.3500,44.4920,11.3550,44.4950"), { features: [], abroad: true, itFailed: "bologna" });
    } finally { e.restore(); }
  } finally { delete globalThis.PROFILY_IT; }
});

test("Itálie: budovy Bologni pod podloubím a nejvyšší z více", async () => {
  const I = await import("../app/public/towns/italy.js");
  const s = stubFetch([{ json: { results: [{ altezza_gr: 9.6, descrizion: "Edificio" }, { altezza_gr: 16, descrizion: "Edificio" }, { altezza_gr: 30, descrizion: "Portico" }] } }]);
  try {
    assert.equal((await I.sources.podlaznost(44.4938, 11.3426)).cornice, 5);
    assert.equal(s.urls.length, 1);
  } finally { s.restore(); }
  const p = stubFetch([{ json: { results: [{ altezza_gr: 6, descrizion: "Portico" }] } }, { json: { results: [{ altezza_gr: 6, descrizion: "Portico" }, { altezza_gr: 19.2, descrizion: "Edificio" }] } }]);
  try {
    assert.equal((await I.sources.podlaznost(44.4939, 11.3427)).cornice, 6, "dům za podloubím");
    assert.equal(new URL(p.urls[1]).searchParams.get("where"), "within_distance(geo_shape, geom'POINT(11.3427 44.4939)', 8m)");
  } finally { p.restore(); }
});

test("Itálie: značky s tabulkami a popisky", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const IT = COUNTRIES.IT, f = IT.signs.file, label = IT.signs.label;
  assert.equal(f({ k: "ip27a", plate: "kola" }), "II-320", "pěší zóna kola pouští sama");
  assert.equal(f({ k: "oneway" }, { dir: "backward" }), "II-47");
  assert.match(label({ k: "oneway" }, null, "IP 4b / B 2 Jednosměrný provoz"), /^II\.349 \/ II\.47 /, "bez směru obě čísla");
  assert.match(label({ k: "oneway", dir: "backward", plate: "protismer" }, null, "IP 4b / B 2 Jednosměrný provoz"), /^II\.47 \+ II\.4\/b /);
  assert.match(label({ k: "b11" }, null, "B 11 Zákaz vjezdu všech motorových vozidel"), /^II\.58 /);
  assert.doesNotMatch(label({ k: "b11" }, null, "B 11 Zákaz vjezdu všech motorových vozidel"), /všech motorových/);
});

test("Itálie: normy podle třídy ulice, cyklostezky, společná stezka, BUS", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const lim = COUNTRIES.IT.limits;
  assert.equal(lim({ type: "pruh", roadClass: "mk2" }, [], 0).zaklad, 3, "primary/secondary = E");
  assert.equal(lim({ type: "pruh", roadClass: "dalnice" }, [], 0).zaklad, 3.25, "trunk ve městě = D");
  assert.equal(lim({ type: "pruh", roadClass: "mk4" }, [], 0).zaklad, 2.75, "místní = F");
  assert.equal(lim({ type: "pruh" }, [], 0).zaklad, 2.75);
  const zone = [{ type: "pruh", signs: [{ k: "ip26a" }] }];
  assert.equal(lim(zone[0], zone, 0), null, "obytná zóna mimo tabulku");
  assert.equal(lim({ type: "cyklostezka", dir: "forward" }, [], 0).zaklad, 1.5);
  assert.equal(lim({ type: "cyklostezka" }, [], 0).zaklad, 2.5, "obousměrná");
  const two = [{ type: "cyklostezka", dir: "forward" }, { type: "cyklostezka", dir: "backward" }];
  assert.equal(lim(two[0], two, 0).zaklad, 1.25, "polovina obousměrné");
  for (const type of ["chodnik_kola", "stezka_sdilena"]) assert.deepEqual([lim({ type }, [], 0).min, lim({ type }, [], 0).zaklad], [0, 2.5], type);
  assert.equal(lim({ type: "bus" }, [], 0).min, 0, "BUS 3,5 m jen pro nové silnice: oranžově");
});

// Lombardy's DBT (Bára 24. 11. 2026; towns/lombardy.js): the region told from South Tyrol and Modena, the kinds of the
// layers, one identify request, the map only with a street surface at the centre, an outage told.
test("Lombardie: území, druhy ploch DBT, identify, výpadek", async () => {
  const B = await import("../app/public/towns/lombardy.js");
  const L = JSON.parse(fs.readFileSync(new URL("../tools/lombardy-border.json", import.meta.url), "utf8"));
  const I = JSON.parse(fs.readFileSync(new URL("../tools/italy-border.json", import.meta.url), "utf8"));
  // Vertices farther than 800 m from the other boundary (at the Stelvio the two sources differ by some hundred metres).
  const K = 111320 * Math.cos((46 * Math.PI) / 180), near = (p, set) => set.some(([a, b]) => Math.hypot((a - p[0]) * K, (b - p[1]) * 110574) < 800);
  assert.deepEqual(L.flat().filter((p) => !B.inLombardy(...p) && !near(p, I[0])), [], "Lombardie");
  assert.deepEqual(I.flat().filter((p) => B.inLombardy(...p) && !near(p, L[0])), [], "Jižní Tyrolsko, Turín, Bologna, Modena");
  for (const [lon, lat, inside] of [[10.594, 46.519, false], [11.354, 46.498, false], [10.37, 46.467, true], [10.51, 46.259, true], [10.925, 44.647, false], [10.79, 45.156, true]]) assert.equal(B.inLombardy(lon, lat), inside, `${lon},${lat}`);
  assert.equal(B.dbtCode(106, { ZONA: "tronco carreggiata", SEDE: "a raso" }), 701);
  assert.equal(B.dbtCode(106, { ZONA: "fascia di sosta laterale" }), 704);
  assert.equal(B.dbtCode(106, { ZONA: "area a traffico non strutturato - in area di pertinenza" }), 1003);
  assert.equal(B.dbtCode(106, { ZONA: "tronco carreggiata", SEDE: "in galleria" }), null);
  assert.equal(B.dbtCode(105, { ZONA: "su marciapiede" }), 702);
  assert.equal(B.dbtCode(105, { ZONA: "su salvagente" }), 1003);
  assert.equal(B.dbtCode(101, { TIPO: "giardino" }), 402);
  assert.equal(B.dbtCode(113, { TIPO: "cortile" }), 603);
  assert.equal(B.dbtCode(97, { cr_edf_ct: "edificio" }), 601);
  // A bed of rails is a railway, a tram bed only with an OSM tram track in it (Brescia's station in the A/B).
  const bed = () => ({ features: [{ attributes: { CTVUK_KOD: B.dbtCode(114, { TIPO: "Null" }) }, geometry: { rings: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] } }] });
  assert.equal(B.trams(bed(), { elements: [] }).features[0].attributes.CTVUK_KOD, 1100);
  assert.equal(B.trams(bed(), { elements: [{ type: "way", tags: { railway: "tram" }, geometry: [{ lon: 0.5, lat: 0.5 }] }] }).features[0].attributes.CTVUK_KOD, 705);
  assert.equal(B.trams(bed(), { elements: [{ type: "way", tags: { railway: "rail" }, geometry: [{ lon: 0.5, lat: 0.5 }] }] }).features[0].attributes.CTVUK_KOD, 1100);
  // A portico's walkway comes before the building over it.
  const sq = (x, y, d) => ({ rings: [[[x, y], [x + d, y], [x + d, y + d], [x, y + d], [x, y]]] });
  const out = B.dbtSurfaces([{ layer: 97, attributes: { cr_edf_ct: "edificio" }, geometry: sq(9, 45, 1) }, { layer: 105, attributes: { ZONA: "area a porticato" }, geometry: sq(9, 45, 1) }]);
  assert.deepEqual(out.features.map((f) => f.attributes.CTVUK_KOD), [702, 601]);

  const bbox = "9.1890,45.4635,9.1910,45.4649", c = [9.19, 45.4642];
  const road = { layerId: 106, attributes: { ZONA: "tronco carreggiata", SEDE: "a raso" }, geometry: sq(c[0] - 0.0001, c[1] - 0.0001, 0.0002) };
  const s = stubFetch([{ json: { results: [road, { layerId: 97, attributes: { cr_edf_ct: "edificio" }, geometry: sq(9.1891, 45.4636, 0.0001) }] } }]);
  try {
    const r = await B.surfaces(bbox);
    assert.equal(r.itTown, "lombardia");
    assert.deepEqual(r.features.map((f) => f.attributes.CTVUK_KOD), [601, 701]);
    assert.equal(s.urls.length, 1);
    const u = new URL(s.urls[0]);
    assert.match(u.pathname, /dbtr\/MapServer\/identify$/);
    assert.equal(u.searchParams.get("layers"), `all:${B.LAYERS}`);
  } finally { s.restore(); }
  // No street surface at the centre: the estimate.
  const g = stubFetch([{ json: { results: [{ ...road, geometry: sq(9.1891, 45.4636, 0.0001) }] } }]);
  try { assert.deepEqual(await B.surfaces("9.1890,45.4635,9.1911,45.4649"), { features: [], abroad: true }); } finally { g.restore(); }
  const e = stubFetch([{ status: 400, json: {} }]);
  try { assert.deepEqual(await B.surfaces("9.1890,45.4635,9.1912,45.4649"), { features: [], abroad: true, itFailed: "lombardia" }); } finally { e.restore(); }
  globalThis.PROFILY_IT = { lombardia: "0" };
  try { assert.equal(await B.surfaces(bbox), null, "?lombardia=0"); } finally { delete globalThis.PROFILY_IT; }
  assert.equal(await B.surfaces("11.340,44.492,11.345,44.495"), null, "Bologna: ne");
});
