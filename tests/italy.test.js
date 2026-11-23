// Italy (Bára 23. 11. 2026): only where an orthophoto has an open licence (Bolzano, Turin, Bologna, Modena); Bologna's
// buildings; the signs (countries/IT.js). No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Itálie: jen oblasti s ortofotem s otevřenou licencí, jinde (i Vatikán a San Marino) bez profilu", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8")));
  for (const [lat, lon] of [[44.4949, 11.3426], [44.6471, 10.9252], [45.0703, 7.6869], [46.4983, 11.3548], [46.6713, 11.159]]) assert.equal(C.cityAt(lat, lon), "italy", `${lat},${lon}`);
  for (const [lat, lon] of [[41.9028, 12.4964], [45.4642, 9.19], [41.1171, 16.8719], [41.9029, 12.4534], [43.9356, 12.4473]]) {
    assert.equal(C.cityAt(lat, lon), "cizina", `${lat},${lon}`);
    assert.match(C.closedAt(lat, lon) || "", /Itálii/, `bez profilu ${lat},${lon}`);
  }
  assert.equal(C.closedAt(44.494, 11.343), null, "Bologna");
  const L = await import("../pilot/public/lanes-ortho.js");
  assert.deepEqual(L.itOrthoAt(11.3426, 44.4949), ["it-bo"]);
  assert.deepEqual(L.itOrthoAt(11.3548, 46.4983), ["it-bz"]);
  assert.deepEqual(L.itOrthoAt(12.4964, 41.9028), [], "Řím: jen AGEA");
});

test("Itálie: budovy Bologni (výška → podlaží), mapa povrchů vypnutá", async () => {
  const I = await import("../pilot/public/towns/italy.js");
  assert.deepEqual(I.bolognaBuilding({ altezza_gr: 19.2, descrizion: "Edificio generico" }), { type: undefined, cornice: 6, total: 6, roof: 0, height: 19.2 });
  assert.equal(I.bolognaBuilding({ altezza_gr: 25, descrizion: "Chiesa" }).type, "church");
  assert.deepEqual(I.bolognaBuilding({ altezza_gr: 6, descrizion: "Portico" }), {});
  assert.deepEqual(await I.sources.surfaces("11.340,44.492,11.345,44.495"), { features: [], abroad: true }, "bez ?bologna=1 nic");
  const roads = I.bolognaRoads([{ descrizion: "Tracciato principale in tronco", geo_shape: { geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } } },
    { descrizion: "Area di sovrapposizione tra strada e corso d'acqua", geo_shape: { geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } } }]);
  assert.equal(roads.features.length, 1);
});

test("Itálie: značky a normy", async () => {
  const { COUNTRIES } = await import("../pilot/public/countries/index.js");
  const IT = COUNTRIES.IT, f = IT.signs.file;
  assert.equal(f({ k: "oneway", dir: "forward" }), "II-349");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), "II-47-plus-II-4b");
  assert.equal(IT.signs.label({ k: "b29" }, null, "B 29 Zákaz stání"), "II.74 Zákaz stání");
  assert.equal(IT.signs.label({ k: "zona30" }, null, "IZ 8a Zóna s dopravním omezením"), "II.323/a Zóna s dopravním omezením");
  for (const k of ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ztp", "ip14a", "ip15a", "zona30", "ip26a", "ip27a", "c8a", "c9a", "c10a", "c7a"]) {
    const file = f({ k });
    assert.ok(file && fs.existsSync(new URL(`../pilot/public/signs-IT/${file}.svg`, import.meta.url)), `${k}: ${file}`);
  }
  for (const v of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130]) assert.ok(fs.existsSync(new URL(`../pilot/public/signs-IT/II-50-${v}.svg`, import.meta.url)), `${v}`);
  assert.equal(f({ k: "ip20a" }), null, "vyhrazený pruh je panel Uso corsie, kresba chybí");
  assert.equal(IT.limits({ type: "chodnik" }).min, 0.9);
});

test("Itálie: ortofoto Turína a Modeny i v severních exklávách Modeny", async () => {
  const L = await import("../pilot/public/lanes-ortho.js");
  assert.deepEqual(L.itOrthoAt(7.6869, 45.0703), ["it-to"]);
  assert.deepEqual(L.itOrthoAt(10.9252, 44.6471), ["it-mo"]);
  assert.deepEqual(L.itOrthoAt(10.89281, 44.74047), ["it-mo"], "exkláva Modeny");
});

// ISTAT's municipal borders (Bára 23. 11. 2026, the review): points 80 m inside and outside Turin, Modena and Bologna that
// GISCO's 1 : 1 000 000 placed wrong; every point of the covered area lies in its orthophoto's box; Turin's credit in
// the Geoportale's wording.
test("Itálie: hranice obcí ISTAT, ortofoto pokrývá celé území, kredit Turína", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  const staty = JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8"));
  C.loadStates(staty);
  const inside = [[45.1387, 7.66514], [45.09861, 7.7503], [45.0192, 7.59288], [44.72488, 10.89973], [44.62863, 10.99276], [44.61059, 10.82662],
    [44.5509, 11.3758], [44.4444, 11.35468], [44.49141, 11.26779], [44.73113, 10.8926], [44.74047, 10.89281]];
  const outside = [[45.13798, 7.67457], [45.07884, 7.77075], [45.07003, 7.60659], [44.72048, 10.90093], [44.63424, 10.98652], [44.59982, 10.86637],
    [44.54965, 11.37703], [44.4755, 11.40534], [44.47656, 11.29045]];
  for (const [lat, lon] of inside) assert.equal(C.cityAt(lat, lon), "italy", `uvnitř ${lat},${lon}`);
  for (const [lat, lon] of outside) {
    assert.equal(C.cityAt(lat, lon), "cizina", `venku ${lat},${lon}`);
    assert.match(C.closedAt(lat, lon) || "", /Itálii/, `bez profilu ${lat},${lon}`);
  }
  const L = await import("../pilot/public/lanes-ortho.js");
  for (const ring of staty.italy) for (const [lon, lat] of ring) assert.ok(L.itOrthoAt(lon, lat).length, `mimo obdélníky ortofot ${lon},${lat}`);
  const { SOURCE_CREDITS } = await import("../pilot/public/credits.js");
  assert.match(SOURCE_CREDITS.orthoCity["it-to"](), /Base cartografica realizzata da .+, integrata con Ortofoto digitale colore 2023 della Città di Torino reperiti sul Geoportale del Comune di Torino/);
});

test("Itálie: výpadek ortofota se ohlásí (jako Belgie a Portugalsko)", async () => {
  const L = await import("../pilot/public/lanes-ortho.js");
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
  const I = await import("../pilot/public/towns/italy.js");
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
  const I = await import("../pilot/public/towns/italy.js");
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
  const { COUNTRIES } = await import("../pilot/public/countries/index.js");
  const IT = COUNTRIES.IT, f = IT.signs.file, label = IT.signs.label;
  assert.equal(f({ k: "ip27a", plate: "kola" }), "II-320", "pěší zóna kola pouští sama");
  assert.equal(f({ k: "b1", plate: "obsluha" }), null);
  assert.equal(f({ k: "oneway" }, { dir: "backward" }), "II-47");
  assert.match(label({ k: "oneway" }, null, "IP 4b / B 2 Jednosměrný provoz"), /^II\.349 \/ II\.47 /, "bez směru obě čísla");
  assert.match(label({ k: "oneway", dir: "backward", plate: "protismer" }, null, "IP 4b / B 2 Jednosměrný provoz"), /^II\.47 \+ II\.4\/b /);
  assert.match(label({ k: "b11" }, null, "B 11 Zákaz vjezdu všech motorových vozidel"), /^II\.58 /);
  assert.doesNotMatch(label({ k: "b11" }, null, "B 11 Zákaz vjezdu všech motorových vozidel"), /všech motorových/);
});

test("Itálie: normy podle třídy ulice, cyklostezky, společná stezka, BUS", async () => {
  const { COUNTRIES } = await import("../pilot/public/countries/index.js");
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
