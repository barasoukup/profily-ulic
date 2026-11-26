// The street from the orthophoto and OSM where no technical map answers (pilot/public/ortho-osm.js) on a drawn image:
// a 7 m carriageway (dark) between lighter sidewalks, OSM houses 8 m from the axis on both sides.
import { test } from "node:test";
import assert from "node:assert/strict";
import { orthoOsmPolys, osmAlong, osmRoad, besidePassport, estimateNote, P } from "../pilot/public/ortho-osm.js";
import { withBuildings } from "../pilot/public/gis.js";
import { localFrame, deriveProfile } from "../pilot/public/derive.js";

const frame = localFrame(50.08, 14.43), dir = [0, 1]; // the street runs north; t across it = −x (west is +t)
const ll = (x, y) => { const [lon, lat] = frame.toLonLat(x, y); return { lon, lat }; };
const house = (x0, x1) => ({ type: "area", id: 100 + x0, tags: { building: "yes" }, geometry: [ll(x0, -20), ll(x1, -20), ll(x1, 20), ll(x0, 20), ll(x0, -20)] });
function osm(tags = {}) {
  return { elements: [
    { type: "way", id: 1, tags: { highway: "residential", ...tags }, geometry: [ll(0, -60), ll(0, 60)] },
    house(8, 16), house(-16, -8),
  ] };
}
// The image on the cut's grid (t from −25, 10 cm, ±20 m along): asphalt 90 for |t| < half, paving 150 beyond, with
// some texture (±12, fixed) as a real image has: the kerbs' strength is measured against the usual changes.
function image(half = 3.5, noise = 24, res = 0.1) {
  const t0 = -25, nt = 500, nu = 400, L = new Float32Array(nt * nu), G = new Float32Array(nt * nu), S = new Float32Array(nt * nu).fill(8);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * noise;
  for (let j = 0; j < nu; j++) for (let i = 0; i < nt; i++) L[j * nt + i] = (Math.abs(t0 + (i + 0.5) * res) < half ? 90 : 150) + rnd();
  return { nt, nu, res, t0, L, G, S, fine: true };
}

test("ortofoto a OSM: obruby z hran snímku, chodníky k domům OSM, vše odhad", () => {
  // A secondary street: its sidewalk may reach 5 m (the cap by class, 19. 11. 2026); a local street below.
  const polys = orthoOsmPolys({ osm: osm({ highway: "secondary" }), frame, dir, way: osm({ highway: "secondary" }).elements[0], st: image() });
  assert.ok(polys);
  // OSM expects 2 × 2.75 m; the image shows 7 m.
  assert.ok(Math.abs(polys.kerbs.A + 3.5) < 0.15 && Math.abs(polys.kerbs.B - 3.5) < 0.15, JSON.stringify(polys.kerbs));
  // The order is the priority: the carriageway, the houses, then the sidewalks.
  assert.deepEqual(polys.map((p) => p.code), [701, 601, 601, 702, 702]);
  const p = deriveProfile({ center: [0, 0], dir, half: 40, polys, osm: osm({ highway: "secondary" }), frame, way: osm({ highway: "secondary" }).elements[0] });
  assert.ok(!p.estimate);
  assert.deepEqual(p.edges, { left: "budova", right: "budova", ...Object.fromEntries(Object.entries(p.edges).filter(([k]) => k.endsWith("Info"))) });
  const sw = p.segments.filter((s) => s.type === "chodnik");
  assert.equal(sw.length, 2);
  assert.ok(sw.every((s) => Math.abs(s.width - 4.5) < 0.2 && s.source === "odhad"), JSON.stringify(sw));
  const road = p.segments.filter((s) => !["chodnik"].includes(s.type)).reduce((a, s) => a + s.width, 0);
  assert.ok(Math.abs(road - 7) < 0.3, String(road));
});

test("ortofoto a OSM: se stropem podle třídy ulice (zkouška P.walkCapBy) v místní ulici chodník nejvýš 2,5 m, za ním plocha", () => {
  P.walkCapBy = { residential: 2.5 };
  const polys = orthoOsmPolys({ osm: osm(), frame, dir, way: osm().elements[0], st: image() });
  const p = deriveProfile({ center: [0, 0], dir, half: 40, polys, osm: osm(), frame, way: osm().elements[0] });
  const sw = p.segments.filter((s) => s.type === "chodnik");
  assert.equal(sw.length, 2);
  assert.ok(sw.every((s) => Math.abs(s.width - 2.5) < 0.2), JSON.stringify(sw));
  assert.ok(p.segments.some((s) => s.type === "plocha"), JSON.stringify(p.segments.map((s) => s.type)));
  delete P.walkCapBy;
});

test("ortofoto a OSM: bez hran na snímku platí šířka podle OSM (width), bez domu chodník jen podle OSM", () => {
  const flat = image(0, 0); // all paving, smooth: no edge
  const tags = { width: "6", sidewalk: "left" };
  const els = { elements: [osm(tags).elements[0]] };
  const polys = orthoOsmPolys({ osm: els, frame, dir, way: els.elements[0], st: flat });
  assert.ok(Math.abs(polys.kerbs.A + 3) < 0.01 && Math.abs(polys.kerbs.B - 3) < 0.01);
  // sidewalk=left: the way runs north (with u), its left is west, the cut's B side (t > 0).
  const o = osmAlong(els.elements, (lon, lat) => { const [x, y] = frame.toXY(lon, lat); return [-x, y]; }, 1);
  assert.equal(osmRoad(o.own).sidewalk.B, "yes");
  const sw = polys.filter((p) => p.code === 702);
  assert.equal(sw.length, 1);
  assert.ok(sw[0].bbox[0] < -5); // west of the axis
});

test("ortofoto a OSM: chodník (pěšina) se nepočítá", () => {
  const els = { elements: [{ type: "way", id: 1, tags: { highway: "footway" }, geometry: [ll(0, -60), ll(0, 60)] }] };
  assert.equal(orthoOsmPolys({ osm: els, frame, dir, way: els.elements[0], st: image() }), null);
});

test("ortofoto a OSM: bez snímku, s prázdným nebo bílým snímkem obruby podle OSM a image false; se snímkem true", () => {
  const blank = image(0, 0), white = image(0, 0);
  for (let q = 0; q < white.L.length; q++) white.L[q] = 255;
  const outside = image(); outside.L.fill(NaN);
  for (const st of [null, blank, white, outside]) {
    const polys = orthoOsmPolys({ osm: osm(), frame, dir, way: osm().elements[0], st });
    assert.ok(polys && polys.image === false);
    assert.deepEqual([polys.kerbs.A, polys.kerbs.B], [-2.75, 2.75]); // 2 lanes × 2.75 m of a residential street
    assert.equal(polys.filter((p) => p.code === 601).length, 2); // the houses all the same
  }
  assert.equal(orthoOsmPolys({ osm: osm(), frame, dir, way: osm().elements[0], st: image() }).image, true);
});

test("ortofoto a OSM: trávník z OSM mezi obrubou a domem je zeleň, voda konec profilu", () => {
  const lawn = { type: "area", id: 7, tags: { landuse: "grass" }, geometry: [ll(-6, -20), ll(-4, -20), ll(-4, 20), ll(-6, 20), ll(-6, -20)] };
  const river = { type: "area", id: 8, tags: { natural: "water" }, geometry: [ll(4, -20), ll(30, -20), ll(30, 20), ll(4, 20), ll(4, -20)] };
  const els = { elements: [osm().elements[0], house(-16, -8), lawn, river] };
  const polys = orthoOsmPolys({ osm: els, frame, dir, way: els.elements[0], st: image() });
  assert.deepEqual(polys.slice(1, 4).map((p) => p.code), [601, 401, 501]);
  const p = deriveProfile({ center: [0, 0], dir, half: 40, polys, osm: els, frame, way: els.elements[0] });
  // t = −x: the lawn (x −6…−4) lies at t 4…6, past the 3.5 m kerb on the west side; the river (x 4…30) east, the profile's right.
  assert.ok(p.segments.some((s) => s.type === "zelen" && Math.abs(s.width - 2) < 0.2), JSON.stringify(p.segments.map((s) => [s.type, s.width])));
  assert.equal(p.edges.right, "voda");
});

test("ortofoto a OSM: dům v parku zůstane domem, sidewalk=no a daleký dům nedá desítky metrů plochy", () => {
  const park = { type: "area", id: 9, tags: { leisure: "park" }, geometry: [ll(-30, -30), ll(-4, -30), ll(-4, 30), ll(-30, 30), ll(-30, -30)] };
  const els = { elements: [osm().elements[0], house(-16, -8), park] };
  const polys = orthoOsmPolys({ osm: els, frame, dir, way: els.elements[0], st: image() });
  const p = deriveProfile({ center: [0, 0], dir, half: 40, polys, osm: els, frame, way: els.elements[0] });
  assert.equal(p.edges.left, "budova"); // west (t > 0): the house inside the park
  // A village road without sidewalks, houses 30 m off on a plain image: no 26 m of paving, the profile ends.
  const far = { elements: [{ ...osm({ sidewalk: "no" }).elements[0] }, house(30, 40), house(-40, -30)] };
  const q = orthoOsmPolys({ osm: far, frame, dir, way: far.elements[0], st: image(3.5, 0) });
  assert.ok(!q.some((x) => x.code === 1003 || x.code === 702), JSON.stringify(q.map((x) => x.code)));
});

test("ortofoto a OSM: koruny nad osou (nic nezeleného u osy) nechají obruby podle OSM, nespadne to", () => {
  const st = image();
  for (let q = 0; q < st.G.length; q++) st.G[q] = 20; // green all over
  const polys = orthoOsmPolys({ osm: osm(), frame, dir, way: osm().elements[0], st });
  assert.ok(polys && polys.image === false);
  assert.deepEqual([polys.kerbs.A, polys.kerbs.B], [-2.75, 2.75]);
});

test("ortofoto a OSM: bílý okraj pokrytí snímku není obruba", () => {
  const st = image(6); // asphalt to ±6 m, OSM expects ±2.75
  for (let j = 0; j < st.nu; j++) for (let i = 0; i < st.nt; i++) if (st.t0 + (i + 0.5) * st.res > 2) st.L[j * st.nt + i] = 255;
  const polys = orthoOsmPolys({ osm: osm(), frame, dir, way: osm().elements[0], st });
  assert.notEqual(polys.kerbs.why.B, "hrana");
});

test("ortofoto a OSM: staré značky zákazu stání nerozšíří vozovku, mapa svými chodníky omezí obruby", () => {
  const els = { elements: [osm({ "parking:lane:both": "no_parking" }).elements[0]] };
  const o = osmAlong(els.elements, (lon, lat) => { const [x, y] = frame.toXY(lon, lat); return [-x, y]; }, 1);
  assert.equal(osmRoad(o.own).w, 5.5);
  const old = osmAlong(osm({ "parking:lane:both": "parallel", "parking:lane:both:parallel": "on_kerb" }).elements, (lon, lat) => { const [x, y] = frame.toXY(lon, lat); return [-x, y]; }, 1);
  assert.equal(osmRoad(old.own).w, 5.5);
  // The map's sidewalks from ±2 m: the kerbs stay inside, though the image shows 7 m.
  const polys = orthoOsmPolys({ osm: osm(), frame, dir, way: osm().elements[0], st: image(), mapRuns: [{ code: 702, s: -5, e: -2 }, { code: null, s: -2, e: 2 }, { code: 702, s: 2, e: 5 }] });
  assert.ok(polys.kerbs.A >= -2 && polys.kerbs.B <= 2, JSON.stringify(polys.kerbs));
});

test("ortofoto a OSM: ulice ze dvou jednosměrných vozovek má obě vozovky a střední pás (Suché mýto)", () => {
  const els = [
    { type: "way", id: 1, tags: { highway: "tertiary", oneway: "yes", lanes: "2", name: "Suché mýto" }, geometry: [ll(0, -60), ll(0, 60)] },
    { type: "way", id: 2, tags: { highway: "tertiary", oneway: "yes", lanes: "2", name: "Suché mýto" }, geometry: [ll(-10, 60), ll(-10, -60)] },
    house(8, 16), house(-26, -18),
  ];
  const polys = orthoOsmPolys({ osm: { elements: els }, frame, dir, way: els[0], st: null });
  assert.ok(polys.kerbs.pair, JSON.stringify(polys.kerbs));
  assert.equal(polys.filter((p) => p.code === 701).length, 2);
  // Between the carriageways a median, not a sidewalk.
  assert.ok(polys.some((p) => p.label === "dělicí pás (odhad)"));
  const p = deriveProfile({ center: [0, 0], dir, half: 40, polys, osm: { elements: els }, frame, way: els[0] });
  assert.ok(!p.segments.some((s) => s.type === "nezname"), JSON.stringify(p.segments.map((s) => s.type)));
});

test("ortofoto a OSM: velký dům, jehož zadní strana je mimo okno, ulici ukončí (Drevená)", () => {
  const els = [osm().elements[0], house(8, 16), { ...house(-90, -8), id: 999 }];
  const o = osmAlong(els, (lon, lat) => { const [x, y] = frame.toXY(lon, lat); return [-x, y]; }, 1);
  assert.ok(o.facade.A !== null || o.facade.B !== null);
  assert.ok([o.facade.A, o.facade.B].some((f) => f !== null && Math.abs(Math.abs(f) - 8) < 0.1), JSON.stringify(o.facade));
  assert.ok([o.facade.A, o.facade.B].some((f) => f !== null && Math.abs(Math.abs(f) - 8) < 0.1 && o.buildings.some((b) => b.s < -60 || b.e > 60)));
});

test("ortofoto a OSM: čára mapy města u očekávané obruby je obruba i bez snímku a ukončí chodník", () => {
  const els = osm().elements;
  // The map's lines along the street (north–south) at x = ±3.2 (kerbs) and x = −5.5 (the sidewalk's outer edge).
  const line = (x) => [ll(x, -40), ll(x, 40)].map((p) => [p.lon, p.lat]);
  const polys = orthoOsmPolys({ osm: { elements: els }, frame, dir, way: els[0], st: null, edges: [line(3.2), line(-3.2), line(-5.5)] });
  assert.equal(polys.kerbs.why.A, "mapa");
  assert.ok(Math.abs(polys.kerbs.A + 3.2) < 0.1 && Math.abs(polys.kerbs.B - 3.2) < 0.1, JSON.stringify(polys.kerbs));
  assert.ok(polys.edges);
  // t = −x: the line at x = 3.2 is t = −3.2 (side A); x = −5.5 is t = 5.5, the sidewalk on side B ends there.
  const sw = polys.filter((p) => p.code === 702).map((p) => p.rings[0].map(([x]) => -x)).map((ts) => [Math.min(...ts), Math.max(...ts)]);
  assert.ok(sw.some(([a, b]) => Math.abs(a - 3.2) < 0.1 && Math.abs(b - 5.5) < 0.1), JSON.stringify(sw));
});

test("ortofoto a OSM: šířka vozovky ze ZBGIS (osa se šířkou), kde OSM šířku nemá", () => {
  const els = osm().elements;
  const path = [ll(0.5, -40), ll(0.5, 40)].map((p) => [p.lon, p.lat]);
  const polys = orthoOsmPolys({ osm: { elements: els }, frame, dir, way: els[0], st: null, widths: [{ path, w: 8 }] });
  assert.equal(polys.widthFrom, "zbgis");
  // The centre line at x = 0.5 is t = −0.5: the carriageway from −4.5 to 3.5.
  assert.ok(Math.abs(polys.kerbs.A + 4.5) < 0.1 && Math.abs(polys.kerbs.B - 3.5) < 0.1, JSON.stringify(polys.kerbs));
});

test("ortofoto a OSM: značka plochy technické mapy mezi čarami určí druh kousku (trávník místo chodníku)", () => {
  const els = osm().elements;
  const line = (x) => [ll(x, -40), ll(x, 40)].map((p) => [p.lon, p.lat]);
  // Kerb lines at x = ±3.2, the sidewalk's outer edge at x = −5.5 (t = 5.5); a lawn symbol at x = −4.3 (t = 4.3).
  const lawn = ll(-4.3, 3);
  const polys = orthoOsmPolys({ osm: { elements: els }, frame, dir, way: els[0], st: null, edges: [line(3.2), line(-3.2), line(-5.5)], symbols: [{ x: lawn.lon, y: lawn.lat, code: 401 }] });
  const green = polys.filter((p) => p.code === 401 && p.label.includes("technická mapa")).map((p) => p.rings[0].map(([x]) => -x)).map((ts) => [Math.min(...ts), Math.max(...ts)]);
  assert.ok(green.some(([a, b]) => Math.abs(a - 3.2) < 0.1 && Math.abs(b - 5.5) < 0.1), JSON.stringify(green));
});

test("za pasportem města: k domu chodník, kde strana chodník nemá, za chodníkem pasportu plocha; ne u dálnice ani k dalekému domu", () => {
  const els = osm().elements;
  // The passport: the roadway x ∈ [−3, 3] and a sidewalk x ∈ [3, 5] on one side (frame XY); houses from |x| = 8.
  const box = (code, x0, x1) => ({ code, rings: [[[x0, -10], [x1, -10], [x1, 10], [x0, 10], [x0, -10]]], bbox: [x0, -10, x1, 10] });
  const polys = [box(701, -3, 3), box(702, 3, 5)];
  const span = (p) => { const xs = p.rings[0].map(([x]) => x); return [Math.min(...xs), Math.max(...xs)].map((x) => +x.toFixed(1)); };
  const out = besidePassport({ osm: { elements: els }, frame, dir, way: els[0], st: null, polys });
  // Beyond the passport's sidewalk up to the house (x 5 … 8): a paved area, not a second sidewalk.
  assert.ok(out.some((p) => p.code === 1003 && Math.abs(span(p)[0] - 5) < 0.15 && Math.abs(span(p)[1] - 8) < 0.15), JSON.stringify(out.map((p) => [p.code, span(p)])));
  // The other side has no sidewalk: one from the roadway to the house (x −8 … −3).
  assert.ok(out.some((p) => p.code === 702 && Math.abs(span(p)[0] + 8) < 0.15 && Math.abs(span(p)[1] + 3) < 0.15), JSON.stringify(out.map((p) => [p.code, span(p)])));
  assert.ok(out.every((p) => p.guess));
  // Not beside a motorway; nothing where the house stands more than 15 m past the passport.
  assert.equal(besidePassport({ osm: { elements: els }, frame, dir, way: { ...els[0], tags: { highway: "motorway" } }, st: null, polys }).length, 0);
  const far = [els[0], house(25, 30), house(-30, -25)];
  assert.equal(besidePassport({ osm: { elements: far }, frame, dir, way: far[0], st: null, polys }).length, 0);
});

test("ortofoto a OSM: samostatný chodník OSM přebije trávník ZBGIS až k domu (Štúrova v Nitře)", () => {
  const els = osm().elements;
  // A lawn of the national map over the whole stretch x ∈ [−8, −3.5] (t 3.5 … 8) up to the house at x = −8, and an OSM
  // sidewalk along x = −6.5 (t = 6.5): the sidewalk reaches the house (within 4 m), the lawn stays by the kerb.
  const walk = { type: "way", id: 7, tags: { highway: "footway", footway: "sidewalk" }, geometry: [ll(-6.5, -40), ll(-6.5, 40)] };
  const lawnRing = [[-8, -20], [-3.5, -20], [-3.5, 20], [-8, 20], [-8, -20]].map(([x, y]) => { const p = ll(x, y); return [p.lon, p.lat]; });
  const areas = [{ attributes: { CTVUK_KOD: 401, CTVUK_POPIS: "zeleň" }, geometry: { rings: [lawnRing] } }];
  const polys = orthoOsmPolys({ osm: { elements: [...els, walk] }, frame, dir, way: els[0], st: null, areas });
  const p = deriveProfile({ center: [0, 0], dir, half: 40, polys, osm: { elements: [...els, walk] }, frame, way: els[0], reach: { left: 40, right: 40 } });
  const kinds = p.segments.map((s) => s.type);
  assert.ok(kinds.includes("zelen") && kinds.filter((k) => k === "chodnik").length >= 1, JSON.stringify(p.segments.map((s) => [s.type, s.width])));
  // The piece by the house on that side is the sidewalk (7.5 … 8 ⊂ it), not the lawn.
  const sw = polys.filter((q) => q.code === 702 && q.label === "chodník (OSM)").map((q) => q.rings[0].map(([x]) => -x)).map((ts) => [Math.min(...ts), Math.max(...ts)]);
  assert.ok(sw.some(([a, b]) => a <= 5.6 && Math.abs(b - 8) < 0.1), JSON.stringify(sw));
  P.off = new Set(["osmwalk"]);
  assert.ok(!orthoOsmPolys({ osm: { elements: [...els, walk] }, frame, dir, way: els[0], st: null, areas }).some((q) => q.label === "chodník (OSM)"));
  P.off = new Set();
});

// The note under the street's name names the houses' real source (the backlog of 23. 11. 2026: "domy z OSM" in
// Czechia, where the estimate's houses are RÚIAN's since 23. 11.).
test("ortofoto a OSM: poznámka říká RÚIAN u domů z RÚIAN a OSM ve státě bez vlastních domů", () => {
  const cs = (text, vars = {}) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
  // OSM only (a state without buildings of its own).
  const plain = osm();
  const a = orthoOsmPolys({ osm: plain, frame, dir, way: plain.elements[0], st: image() });
  assert.deepEqual(a.houses, ["OSM"]);
  assert.equal(estimateNote(a, true, cs), "Obruby jsou odhadnuté z ortofota a domy z OSM, šířky ověřte.");
  // Czechia: RÚIAN's outlines first (gis.js withBuildings "first"), OSM's under them dropped.
  const ruian = (x0, x1) => ({ ...house(x0, x1), id: `ruian-${x0}`, from: "RÚIAN", tags: { building: "yes", source: "RÚIAN" } });
  const cz = withBuildings(plain, [ruian(8, 16), ruian(-16, -8)], "first");
  const b = orthoOsmPolys({ osm: cz, frame, dir, way: plain.elements[0], st: image() });
  assert.deepEqual(b.houses, ["RÚIAN"]);
  assert.equal(estimateNote(b, true, cs), "Obruby jsou odhadnuté z ortofota a domy z RÚIAN, šířky ověřte.");
  assert.equal(estimateNote({ ...b, image: false }, false, cs), "Obruby jsou podle OSM a domy z RÚIAN, šířky ověřte.");
  // RÚIAN on one side, OSM's house on the other: both, the register first.
  const mixed = withBuildings(plain, [ruian(8, 16)], "first");
  const c = orthoOsmPolys({ osm: mixed, frame, dir, way: plain.elements[0], st: image() });
  assert.deepEqual(c.houses, ["RÚIAN", "OSM"]);
  assert.equal(estimateNote({ ...c, image: false }, true, cs), "Ortofoto tu nepomohlo: obruby jsou podle OSM a domy z RÚIAN a OSM, šířky ověřte.");
  // A real OSM tag source=* says nothing of where the app took the house.
  const tagged = { elements: plain.elements.map((el) => (el.tags.building ? { ...el, tags: { ...el.tags, source: "cuzk:km" } } : el)) };
  assert.deepEqual(orthoOsmPolys({ osm: tagged, frame, dir, way: plain.elements[0], st: image() }).houses, ["OSM"]);
});
