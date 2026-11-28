// Slovenia (Bára 23. 11. 2026): the state and its borders, GURS's orthophoto, the buildings of the cadastre, the address
// search, the signs and the norms (countries/SI.js). No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Slovinsko: ortofoto GURS DOF025 ve Web Mercatoru", async () => {
  const L = await import("../app/public/lanes-ortho.js");
  const u = new URL(L.SI_ORTHO([1614700, 5790900, 1614775, 5790975], 300, 300));
  assert.equal(u.origin + u.pathname, "https://ipi.eprostor.gov.si/wms-si-gurs-dts/wms");
  assert.equal(u.searchParams.get("LAYERS"), "SI.GURS.ZPDZ:DOF025_3857");
  assert.equal(u.searchParams.get("CRS"), "EPSG:3857");
});

test("Slovinsko: GURS, který visí, se ptá znovu (podle počtu pauz), 404 ne", async () => {
  const L = await import("../app/public/lanes-ortho.js"), { localFrame } = await import("../app/public/derive.js");
  const pauses = L.SI_RETRY.pauses;
  L.SI_RETRY.pauses = [1, 1, 1];
  try {
    const frame = localFrame(46.0514, 14.5058), grey = (w, h) => ({ width: w, height: h, rgba: new Uint8Array(w * h * 4).fill(120) });
    const decode = async () => grey(100, 100), ok = { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) };
    const run = (answers) => {
      let n = 0;
      const fetchImpl = async () => { const a = answers[Math.min(n++, answers.length - 1)]; if (a === "hang") throw Object.assign(new Error("timeout"), { name: "TimeoutError" }); return a; };
      return { n: () => n, go: L.laneImage({ source: "si", frame, dir: [0, 1], t0: -5, t1: 5, fetchImpl, decode }) };
    };
    let r = run(["hang", { ok: false, status: 504 }, ok]);
    assert.equal((await r.go).source, "si");
    assert.equal(r.n(), 3);
    r = run(["hang"]);
    await assert.rejects(r.go, /timeout/);
    assert.equal(r.n(), 4, "čtyři pokusy, pak hláška o výpadku");
    r = run([{ ok: false, status: 404 }]);
    assert.equal(await r.go, null);
    assert.equal(r.n(), 1, "bez snímku se znovu neptá");
  } finally { L.SI_RETRY.pauses = pauses; }
  // The default tries fit in SI_RETRY.budget: a hanging GURS holds a cut about 12 s, not 26 s (the review of 24. 11. 2026).
  const R = L.SI_RETRY, worst = R.timeout * (R.pauses.length + 1) + R.pauses.reduce((a, b) => a + b, 0);
  assert.ok(R.budget <= 13000 && R.patchBudget <= 10000, `${R.budget}, ${R.patchBudget}`);
  assert.ok(worst > R.budget, "rozpočet zkrátí poslední pokus");
});

test("Slovinsko: model obrub se GURS ptá znovu, při výpadku nečeká podruhé", async () => {
  const L = await import("../app/public/lanes-ortho.js");
  const keep = { pauses: L.SI_RETRY.pauses, downFor: L.SI_RETRY.downFor, OC: globalThis.OffscreenCanvas, CIB: globalThis.createImageBitmap };
  // The browser's canvas, stubbed: every pixel grey (not blank).
  globalThis.OffscreenCanvas = class { constructor(w, h) { this.w = w; this.h = h; } getContext() { return { drawImage() {}, getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4).fill(120) }) }; } };
  globalThis.createImageBitmap = async () => ({});
  L.SI_RETRY.pauses = [1, 1];
  L.SI_RETRY.downFor = 0;
  try {
    const ok = () => new Response(new Uint8Array(8), { status: 200 });
    let n = 0, urls = [];
    const flaky = async (url) => { urls.push(url); return n++ === 0 ? new Response("", { status: 504 }) : ok(); };
    const a = await L.orthoPatch({ source: "si", lon: 14.5058, lat: 46.0514, half: 40, px: 16, fetchImpl: flaky });
    assert.equal(a.source, "si");
    assert.equal(n, 2, "504, pak snímek");
    assert.match(urls[0], /ipi\.eprostor\.gov\.si\/wms-si-gurs-dts/);
    n = 0;
    assert.equal(await L.orthoPatch({ source: "si", lon: 14.5058, lat: 46.0514, half: 40, px: 16, fetchImpl: async () => { n++; return new Response("", { status: 404 }); } }), null);
    assert.equal(n, 1);
    n = 0;
    await assert.rejects(L.orthoPatch({ source: "si", lon: 14.5058, lat: 46.0514, half: 40, px: 16, fetchImpl: async () => { n++; return new Response("", { status: 504 }); } }), (e) => e.outage);
    assert.equal(n, 3, "tři pokusy, pak výpadek (app.js ho nepočítá jako žádný snímek)");
    // Just down (after laneImage's last try): not asked again, the cut not held a second time.
    L.SI_RETRY.downFor = 60000;
    n = 0;
    await assert.rejects(L.orthoPatch({ source: "si", lon: 14.5058, lat: 46.0514, half: 40, px: 16, fetchImpl: async () => { n++; return ok(); } }), (e) => e.outage);
    assert.equal(n, 0, "nic se neptá");
  } finally {
    Object.assign(L.SI_RETRY, { pauses: keep.pauses, downFor: keep.downFor });
    globalThis.OffscreenCanvas = keep.OC; globalThis.createImageBitmap = keep.CIB;
  }
});

test("Slovinsko: budovy katastru GURS", async () => {
  const S = await import("../app/public/towns/slovenia.js");
  const json = JSON.parse(fs.readFileSync(new URL("./fixtures/gurs-stavbe.json", import.meta.url), "utf8"));
  // Ajdovščina, Ljubljana: 8 floors with the ground floor the third (two below it), built 1622, brick.
  assert.deepEqual(S.gursPick(json, 46.0519, 14.5055), { built: 1622, solid: true, house: undefined, type: "apartments", cornice: 6, total: 6, roof: 0, height: 21.2, gurs: true });
  assert.deepEqual(S.gursBuilding({ STEVILO_ETAZ: 2, STEVILKA_PRITL_ETAZE: 1, LETO_IZGRADNJE: 1975, STEVILO_STANOVANJ: 1, NOSILNE_KONSTRUKCIJE_NAZIV_SL: "beton, železobeton" }),
    { built: 1975, solid: undefined, house: true, type: "house", cornice: 2, total: 2, roof: 0 });
  assert.deepEqual(S.gursBuilding({}), { built: undefined, solid: undefined, house: undefined, type: undefined });
  assert.deepEqual(S.gursPick({ features: [] }, 46, 14), {});
  // The nearest outline within 6 m when the point lies in none.
  const near = { features: [{ geometry: { type: "Polygon", coordinates: [[[14.50004, 46], [14.5001, 46], [14.5001, 46.0001], [14.50004, 46.0001], [14.50004, 46]]] }, properties: { STEVILO_ETAZ: 3, STEVILKA_PRITL_ETAZE: 1 } }] };
  assert.equal(S.gursNearest(near, 46.00005, 14.5).total, 3);
  assert.deepEqual(S.gursNearest(near, 46.00005, 14.4998), {});
  const u = new URL(S.gursUrl(46.05, 14.5));
  assert.equal(u.searchParams.get("TYPENAMES"), "SI.GURS.KN:STAVBE");
  assert.match(u.searchParams.get("FILTER"), /<fes:ValueReference>OBRIS_GEOM<\/fes:ValueReference>/);
  assert.ok(!/LASTNI|OSEB/.test(u.searchParams.get("PROPERTYNAME")), "žádné údaje o vlastnících");
});

test("Slovinsko: podkroví podle výšky katastru GURS", async () => {
  const S = await import("../app/public/towns/slovenia.js");
  const fx = JSON.parse(fs.readFileSync(new URL("./fixtures/gurs-podkrovi.json", import.meta.url), "utf8"));
  const floors = (id) => { const b = S.gursBuilding(fx[id].properties); return [b.cornice, b.roof, b.total, b.height, b.roofType]; };
  // The height above the entrance (H2 − H3): 3 floors in 9.9 m cannot all stand under a roof, the top one is the attic.
  assert.deepEqual(floors("lj12-left"), [2, 1, 3, 9.9, 1]);
  assert.deepEqual(floors("ma11-right"), [1, 1, 2, 7.9, 1]);
  // Full floors stay full: 5 floors (more than 4) and a modern house of 3 floors in 11.1 m.
  assert.deepEqual(floors("ma2-left"), [5, 0, 5, 19.9, undefined]);
  assert.deepEqual(floors("lj13-right"), [3, 0, 3, 11.1, undefined]);
  // An attic the rule misses (8.4 m for 2 floors): the heights overlap (ab/REPORT.md).
  assert.deepEqual(floors("ma3-right"), [2, 0, 2, 8.4, undefined]);
  // Without H3 the height counts from H1 (the lowest floor); without either there is no height and no attic.
  assert.equal(S.gursBuilding({ ...fx["lj12-left"].properties, VISINA_H3: null }).height, 12.3);
  assert.deepEqual(floors("lj12-left").slice(0, 3), [2, 1, 3]);
  assert.equal(S.gursBuilding({ ...fx["lj12-left"].properties, VISINA_H3: null, VISINA_H1: null }).roof, 0);
  // ?off=podkrovi: the cadastre's floors as they are (the A/B of the rule alone).
  globalThis.PROFILY_SI = { off: "podkrovi" };
  try { assert.deepEqual(floors("lj12-left"), [3, 0, 3, 9.9, undefined]); } finally { delete globalThis.PROFILY_SI; }
});

test("Slovinsko: hledání adres GURS", async () => {
  const S = await import("../app/public/search-si.js");
  assert.deepEqual(S.parseSiQuery("Trubarjeva cesta 5, Ljubljana"), { street: "Trubarjeva cesta", number: 5, extra: null, town: "Ljubljana" });
  assert.deepEqual(S.parseSiQuery("Glavni trg 14 Maribor"), { street: "Glavni trg", number: 14, extra: null, town: "Maribor" });
  assert.equal(S.parseSiQuery("Cesta 12a").extra, "A");
  assert.equal(S.parseSiQuery("Prešernov trg"), null);
  const items = S.parseSi({ features: [
    { geometry: { coordinates: [14.507, 46.052] }, properties: { ULICA_NAZIV: "Trubarjeva cesta", HS_STEVILKA: 5, HS_DODATEK: null, NASELJE_NAZIV: "Ljubljana" } },
    { geometry: { coordinates: [14.507, 46.052] }, properties: { ULICA_NAZIV: "Trubarjeva cesta", HS_STEVILKA: 5, HS_DODATEK: "A", NASELJE_NAZIV: "Ljubljana" } }] });
  assert.deepEqual(items.map((x) => x.text), ["Trubarjeva cesta 5, Ljubljana", "Trubarjeva cesta 5a, Ljubljana"]);
  assert.match(new URL(S.gursAddressUrl({ street: "Trub*<x>", number: 5, town: null })).searchParams.get("FILTER"), /<fes:Literal>Trubx\*<\/fes:Literal>/);
  assert.ok(S.looksSlovenian("Slovenska cesta 9") && !S.looksSlovenian("Karlova 5"));
  // Not the neighbours' streets (the review of 24. 11. 2026).
  for (const q of ["Celovška ulica 10", "Prešernov trg", "Kolesarska pot 3", "Ulica 1. maja 3, Maribor"]) assert.ok(S.looksSlovenian(q), q);
  for (const q of ["Hlavná ulica 5", "Trg bana Jelačića 1", "ulica Mokotowska 5", "Masarykova 5 Brno"]) assert.ok(!S.looksSlovenian(q), q);
  // A date in the street's name is not the house number, and its full stop matches itself in the filter.
  assert.deepEqual(S.parseSiQuery("Cesta 27. aprila 31"), { street: "Cesta 27. aprila", number: 31, extra: null, town: null });
  assert.deepEqual(S.parseSiQuery("Ulica 1. maja 3 Novo mesto"), { street: "Ulica 1. maja", number: 3, extra: null, town: "Novo mesto" });
  assert.equal(S.parseSiQuery("Cesta 27. aprila"), null);
  assert.match(new URL(S.gursAddressUrl(S.parseSiQuery("Cesta 27. aprila 31"))).searchParams.get("FILTER"), /<fes:Literal>Cesta 27\. aprila\*<\/fes:Literal>/);
});

test("Slovinsko: značky, normy, zákon o stání", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const SI = COUNTRIES.SI, f = SI.signs.file;
  assert.equal(f({ k: "oneway", dir: "forward" }), "2407");
  assert.equal(f({ k: "oneway", dir: "backward" }), "2201");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), null, "zákaz vjezdu by platil i pro cyklisty");
  assert.equal(f({ k: "c10a" }), "2313-1");
  assert.equal(f({ k: "c10a", walk: "left" }), "2313");
  assert.equal(f({ k: "b1", plate: "obsluha" }), null);
  assert.equal(f({ k: "ip15a" }), null);
  assert.equal(f({ k: "ztp" }), null);
  assert.equal(SI.signs.label({ k: "b29" }, null, "B 29 Zákaz stání"), "2237 Zákaz stání");
  for (const k of ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ip14a", "ip20a", "zona30", "ip26a", "ip27a", "sdilena", "c8a", "c9a", "c10a", "c7a"]) {
    const file = f({ k });
    assert.ok(file && fs.existsSync(new URL(`../app/public/signs-SI/${file}.svg`, import.meta.url)), `${k}: ${file}`);
  }
  for (const v of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130]) assert.ok(fs.existsSync(new URL(`../app/public/signs-SI/2232-${v}.svg`, import.meta.url)), `${v}`);
  for (const file of fs.readdirSync(new URL("../app/public/signs-SI/", import.meta.url)).filter((x) => x.endsWith(".svg"))) {
    assert.match(fs.readFileSync(new URL(`../app/public/signs-SI/${file}`, import.meta.url), "utf8"), /viewBox=/, file);
  }
  assert.equal(SI.limits({ type: "chodnik" }, [], 0), null, "minimum chodníku nenalezeno");
  assert.equal(SI.limits({ type: "cyklopruh" }, [], 0).zaklad, 1.75);
  assert.equal(SI.limits({ type: "cyklostezka" }, [], 0).min, 1, "bez směru jako jednosměrná");
  assert.equal(SI.limits({ type: "parkovani", orient: "kolme" }, [], 0), null);
  assert.equal(SI.limits({ type: "pruh", roadClass: "residential" }, [], 0).zaklad, 2.5);
  assert.equal(SI.limits({ type: "pruh", roadClass: "mk4" }, [], 0).zaklad, 2.5);
  assert.equal(SI.limits({ type: "pruh", roadClass: "dalnice" }, [], 0).zaklad, 3.25);
  assert.equal(SI.limits({ type: "pruh", roadClass: "mk2" }, [], 0), null, "spojovací silnice: šířka podle rychlosti, kterou neznáme");
  assert.equal(SI.limits({ type: "pruh", turn: "left" }, [], 0).zaklad, 3, "řadicí pruh: základ 3 m, 2,75 m je výjimka");
  assert.equal(SI.limits({ type: "chodnik" }, [{ type: "parkovani", position: "half_on_kerb" }, { type: "chodnik" }], 1).min, 1.6);
  // ZPrCP čl. 65/4: none on a two-way street without a centre line, none on a one-way carriageway of two lanes.
  assert.equal(SI.parkOnRoadway({ highway: "residential" }, false, 2), false);
  assert.equal(SI.parkOnRoadway({ highway: "residential", lanes: "2" }, false, 2), true);
  assert.equal(SI.parkOnRoadway({ highway: "residential", lanes: "2", lane_markings: "no" }, false, 2), false);
  assert.equal(SI.parkOnRoadway({ oneway: "yes" }, true, 1), true);
  assert.equal(SI.parkOnRoadway({ oneway: "yes" }, true, 2), false);
  // Pravilnik o kolesarskih površinah čl. 38: a width only on a collector road and above, not on an access road (odst. 2).
  assert.equal(SI.contraflow(false, [{ type: "pruh", roadClass: "mk3" }]).base, 3.2);
  assert.equal(SI.contraflow(false, [{ type: "pruh", roadClass: "mk2" }]).lo, 3);
  assert.equal(SI.contraflow(false, [{ type: "pruh", roadClass: "mk4" }]), null, "obslužná ulice: čl. 38 odst. 2 šířku nedává");
  assert.equal(SI.contraflow(false, [{ type: "pruh" }]), null);
  assert.equal(SI.contraflow(false), null);
  assert.equal(SI.laneOrtho, "si");
  assert.equal(SI.socialistLooks, false);
});

// The contraflow rule reaches Slovenia through rules.js (it passes the run; Bára 24. 11. 2026): on a tertiary road and up
// the 3 m minimum, on a residential street no warning (čl. 38 odst. 2 gives no width).
import { checkRules } from "../app/public/rules.js";
import { setCity } from "../app/public/city.js";
test("SI: cyklisté v protisměru jen na silnici třetí třídy a výš", () => {
  setCity("slovenia");
  const ip4c = [{ k: "oneway", plate: "protismer" }];
  const lvl = (roadClass) => checkRules({ segments: [{ type: "pruh", width: 2.8, roadClass, signs: ip4c }] }).map((f) => `${f.i}:${f.level}`).join();
  assert.equal(lvl("mk3"), "0:min");
  assert.equal(lvl("mk4"), "");
  setCity("praha");
});
