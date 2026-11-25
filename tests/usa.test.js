// The USA (Bára 24. 11. 2026, phase 2): the state over the metro of Washington, DC's Planimetrics and DDOT's inventory
// (countries/US.js, towns/usa.js) and the three shared changes (derive.js: alley mouths, tree pits, the counted lanes).
// No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("USA: metro Washingtonu je stát usa, zbytek USA zavřený", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8")));
  // The White House, Silver Spring (Montgomery), Hyattsville (Prince George's), Arlington, Alexandria, Fairfax city, Tysons.
  for (const [lat, lon] of [[38.8977, -77.0365], [38.9907, -77.0261], [38.9559, -76.9455], [38.8816, -77.091], [38.8048, -77.0469], [38.8462, -77.3064], [38.9187, -77.2311],
    // On the DC line (Southern Avenue, dc-8-3): simplified county rings left a gap there.
    [38.8436094, -76.9725878]]) {
    assert.equal(C.cityAt(lat, lon), "usa", `${lat},${lon}`);
    assert.equal(C.closedAt(lat, lon), null);
  }
  // New York, Baltimore, Richmond: the USA beyond the metro, a message and no profile.
  for (const [lat, lon] of [[40.7128, -74.006], [39.2904, -76.6122], [37.5407, -77.436]]) {
    assert.equal(C.cityAt(lat, lon), "cizina", `${lat},${lon}`);
    assert.match(C.closedAt(lat, lon) || "", /Washingtonu/);
  }
  assert.equal(C.countryOfCity("usa").code, "US");
});

test("USA: mezi okresy ani na hranici DC nejsou díry, staty.json nenese společné hranice dvakrát", async () => {
  const C = await import("../pilot/public/city.js");
  const staty = JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8"));
  const us = JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta-us.json", import.meta.url), "utf8"));
  assert.ok(JSON.stringify(staty.usa).length < 60_000, `${JSON.stringify(staty.usa).length} B`);
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(staty);
  for (const [lon, lat] of us.washington[0]) for (const [dx, dy] of [[0, 0], [2e-4, 0], [-2e-4, 0], [0, 2e-4], [0, -2e-4]]) assert.equal(C.closedAt(lat + dy, lon + dx), null, `${lat},${lon}`);
  // The quays across the border have not the message of the USA (Windsor has Canada's, Nuevo Laredo none), Detroit and Laredo have.
  assert.match(C.closedAt(42.3190, -83.0390) || "", /Torontu/);
  assert.equal(C.closedAt(27.4950, -99.5069), null);
  for (const [lat, lon] of [[42.3314, -83.0458], [27.5064, -99.5075]]) assert.match(C.closedAt(lat, lon) || "", /Washingtonu/);
});

const loadWashington = async () => {
  const C = await import("../pilot/public/city.js");
  C.loadTowns(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta-us.json", import.meta.url), "utf8")));
  return C;
};
test("USA: DC je District, ne obdélník (ortofoto, mapa povrchů, město)", async () => {
  const { orthoHereAt, usOrthoAt } = await import("../pilot/public/lanes-ortho.js");
  const { AREAS } = await import("../pilot/public/towns/usa.js");
  const { inArea } = await import("../pilot/public/places.js");
  const C = await loadWashington();
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8")));
  assert.deepEqual(usOrthoAt(-77.0365, 38.8977), ["us-dc"]);
  assert.equal(C.cityAt(38.8977, -77.0365), "washington");
  // Inside the box, outside the District: Clarendon, Bethesda, Silver Spring, Old Town Alexandria, the airport; and Fairfax.
  for (const [lat, lon] of [[38.8868, -77.0953], [38.9847, -77.0947], [38.9935, -77.0265], [38.8048, -77.0469], [38.8512, -77.0402], [38.8462, -77.3064]]) {
    assert.equal(orthoHereAt("us", lon, lat), false, `${lat},${lon}`);
    assert.equal(inArea(AREAS.dc, lon, lat), false, `${lat},${lon}`);
    assert.equal(C.cityAt(lat, lon), "usa");
  }
  // The streets along the line are read (Southern, Western and Eastern Avenue).
  for (const [lat, lon] of [[38.8436094, -76.9725878], [38.96689, -77.07792], [38.96509, -77.00168]]) assert.equal(inArea(AREAS.dc, lon, lat), true, `${lat},${lon}`);
});

// A straight street along the y axis at the cut's centre, the cut along x (a box 30 m each way around 38.9, -77.0).
const LAT = 38.9, LON = -77.0, KX = 111320 * Math.cos((LAT * Math.PI) / 180), KY = 110574;
const ll = (x, y) => [LON + x / KX, LAT + y / KY];
const ring = (x0, x1, y0 = -60, y1 = 60) => [[ll(x0, y0), ll(x1, y0), ll(x1, y1), ll(x0, y1), ll(x0, y0)]];
const esri = (rows) => ({ features: rows.map(([d, x0, x1]) => ({ attributes: { DESCRIPTION: d }, geometry: { rings: ring(x0, x1) } })) });
const way = { type: "way", id: 1, tags: { highway: "residential", name: "A St" }, geometry: [ll(0, -80), ll(0, 80)].map(([lon, lat]) => ({ lat, lon })) };
const PAD = 0.0004, BBOX = [ll(-30, 0)[0] - PAD, LAT - PAD, ll(30, 0)[0] + PAD, LAT + PAD].join(",");

test("USA: plochy DC podél řezu, stání a pruhy z inventáře DDOT", async () => {
  const U = await import("../pilot/public/towns/usa.js");
  assert.deepEqual(U.dcCode(10, "Parking Lot"), [1003, 4]);
  assert.deepEqual(U.dcCode(11, "Crosswalk"), [701, 3]);
  assert.equal(U.dcCode(1, "Canopy Structure"), null);
  const roads = esri([["Road", -4.8, 4.8]]), walks = esri([["Sidewalk", -8, -6], ["Sidewalk", 6, 8]]), bldg = esri([["Building", -20, -12], ["Building", 12, 20]]);
  const sub = { features: [{ attributes: { TOTALTRAVELLANES: 2, TOTALPARKINGLANES: 2, TOTALPARKINGLANEWIDTH: 16, BIKELANE_CONVENTIONAL: "BD" }, geometry: { paths: [[ll(1, -50), ll(1, 50)]] } }] };
  const out = U.dcSurfaces({ roads, walks, bldg, sub }, [way], BBOX, way.tags);
  assert.ok(out, "ulice pod středem");
  const codes = out.features.map((f) => f.attributes.code);
  // building, green (a front yard), sidewalk, the tree strip, parking, roadway, parking, green, sidewalk, green, building
  assert.deepEqual([...new Set(codes)].sort(), [401, 601, 701, 702, 704]);
  assert.equal(codes.filter((c) => c === 704).length, 2);
  assert.deepEqual(out.wayTags, { lanes: "2", "cycleway:both": "lane" });
  assert.equal(out.usDdot, true);
  // Without the inventory: no parking strips nor tags.
  const bare = U.dcSurfaces({ roads, walks, bldg, sub }, [way], BBOX, way.tags, { ddot: false });
  assert.equal(bare.features.filter((f) => f.attributes.code === 704).length, 0);
  assert.equal(bare.wayTags, undefined);
  // Only a yard under the centre (no roadway within 3 m): not the street.
  assert.equal(U.dcSurfaces({ roads: esri([["Road", 10, 18]]), walks, bldg, sub }, [way], BBOX, way.tags), null);
});

test("USA: RPPSIDE neříká, na které straně se stojí (zóna rezidentů, ne pruh)", async () => {
  const U = await import("../pilot/public/towns/usa.js");
  const runs = () => [{ code: 702, s: -8, e: -5 }, { code: 701, s: -5, e: 5 }, { code: 702, s: 5, e: 8 }];
  const one = { TOTALPARKINGLANES: 1, TOTALPARKINGLANEWIDTH: 8 };
  for (const RPPSIDE of ["O", "I", "B", "AO", null]) {
    assert.deepEqual(U.carveParking(runs(), { a: { ...one, RPPSIDE }, along: true }, { "parking:left": "lane" }), ["lo"], `${RPPSIDE}`);
    assert.deepEqual(U.carveParking(runs(), { a: { ...one, RPPSIDE }, along: true }), ["hi"], `${RPPSIDE}`);
  }
});

test("USA: strany podle cesty řezu, ne podle nejbližší cesty OSM (dvě vozovky a stezka uprostřed)", async () => {
  const U = await import("../pilot/public/towns/usa.js");
  const line = (id, x, tags, down = false) => ({ type: "way", id, tags, geometry: (down ? [ll(x, 80), ll(x, -80)] : [ll(x, -80), ll(x, 80)]).map(([lon, lat]) => ({ lat, lon })) });
  const tags = { highway: "primary", name: "A St", oneway: "yes", "parking:right": "lane" };
  const own = line(1, 8, tags), other = line(2, -8, { highway: "primary", name: "A St", oneway: "yes" }, true);
  const roads = esri([["Road", -15, -2], ["Median Island", -2, 2], ["Road", 2, 15]]), walks = esri([["Sidewalk", -18, -15], ["Sidewalk", 15, 18]]), bldg = esri([]);
  const sub = { features: [{ attributes: { ROADTYPE: "1", TOTALTRAVELLANES: 4, TOTALTRAVELLANESINBOUND: 1, TOTALTRAVELLANESOUTBOUND: 3, TOTALPARKINGLANES: 1, TOTALPARKINGLANEWIDTH: 8, BIKELANE_CONVENTIONAL: "OB" }, geometry: { paths: [[ll(0, -50), ll(0, 50)]] } }] };
  const read = (median) => {
    const r = U.dcSurfaces({ roads, walks, bldg, sub }, [median, other, own], BBOX, tags, { way: own });
    const xs = r.features.filter((f) => f.attributes.code === 704).flatMap((f) => f.geometry.rings[0].map((p) => (p[0] - LON) * KX));
    return { tags: r.wayTags, x: Math.round(xs.reduce((p, q) => p + q, 0) / xs.length) };
  };
  const up = read(line(3, 0, { highway: "cycleway" })), down = read(line(3, 0, { highway: "cycleway" }, true));
  assert.deepEqual(up, down);
  assert.deepEqual(up.tags, { lanes: "3", "cycleway:right": "lane" });
  assert.ok(up.x > 10, `stání u x = ${up.x}`);
});

test("USA: chráněná cyklostezka podle OSM: uprostřed (Pennsylvania Avenue), na straně z tagů, zakázaná strana", async () => {
  const U = await import("../pilot/public/towns/usa.js");
  const runs = () => [[702, -16, -13], [701, -13, 13], [702, 13, 16]].map(([code, s, e]) => ({ code, s, e }));
  const b = { a: { BIKELANE_DUAL_PROTECTED: "IB", TOTALBIKELANEWIDTH: 12, TOTALBIKELANES: 2 }, along: true };
  const tags = { "cycleway:left": "separate", "cycleway:right": "no", oneway: "yes" };
  const r = runs();
  assert.deepEqual(U.carveTracks(r, b, tags, { tracks: [0.7], way: 8, others: [-8] }), ["mid"]);
  assert.deepEqual(r.map((x) => x.code), [702, 701, 703, 701, 702]);
  assert.ok(Math.abs((r[2].s + r[2].e) / 2 - 0.7) < 0.01);
  // Parking is still cut off the outer kerbs.
  assert.deepEqual(U.carveParking(r, { a: { TOTALPARKINGLANES: 2, TOTALPARKINGLANEWIDTH: 16 }, along: true }), ["lo", "hi"]);
  assert.deepEqual(r.map((x) => x.code), [702, 704, 701, 703, 701, 704, 702]);
  // No way of OSM: the inner side of one of two carriageways and a side tagged "no" get none.
  assert.deepEqual(U.carveTracks(runs(), b, tags, { way: 8, others: [-8] }), []);
  assert.deepEqual(U.carveTracks(runs(), b, { "cycleway:right": "no", "cycleway:left": "separate" }), ["lo"]);
  assert.deepEqual(U.carveTracks(runs(), { ...b, a: { ...b.a, BIKELANE_DUAL_PROTECTED: "OB" } }, { "cycleway": "separate", "cycleway:right": "no" }), []);
  // Its way on the sidewalk: the map's own surfaces.
  assert.deepEqual(U.carveTracks(runs(), b, tags, { tracks: [15] }), []);
});

test("USA: střed řezu v polygonu Intersection, ulička pod service, blok podle druhu a vyplněnosti", async () => {
  const U = await import("../pilot/public/towns/usa.js");
  const walks = esri([["Sidewalk", -8, -6], ["Sidewalk", 6, 8]]), bldg = esri([]), sub = { features: [] };
  assert.equal(U.dcSurfaces({ roads: esri([["Intersection", -5, 5]]), walks, bldg, sub }, [way], BBOX, way.tags).junction, true);
  assert.equal(U.dcSurfaces({ roads: esri([["Road", -5, 5]]), walks, bldg, sub }, [way], BBOX, way.tags).junction, false);
  const service = { ...way, tags: { highway: "service" } };
  const alley = U.dcSurfaces({ roads: esri([["Alley", -2, 2]]), walks: esri([]), bldg, sub }, [service], BBOX, service.tags, { way: service });
  assert.ok(alley.features.some((f) => f.attributes.code === 701));
  assert.equal(U.dcSurfaces({ roads: esri([["Parking Lot", -20, 20]]), walks: esri([]), bldg, sub }, [service], BBOX, service.tags, { way: service }), null);
  const line = (x, attributes) => ({ attributes, geometry: { paths: [[ll(x, -50), ll(x, 50)]] } });
  const c = { lat0: LAT, lon0: LON, kx: KX, ky: KY, dir: [1, 0] };
  const street = line(8, { ROADTYPE: "1", TOTALTRAVELLANES: 2 }), lane = line(1, { ROADTYPE: "4", TOTALTRAVELLANES: 1 });
  assert.equal(U.blockOf({ features: [lane, street] }, c, way.tags).a.TOTALTRAVELLANES, 2);
  assert.equal(U.blockOf({ features: [line(1, { ROADTYPE: "5", TOTALTRAVELLANES: 1 })] }, c, way.tags), null);
  assert.equal(U.blockOf({ features: [line(1, { ROADTYPE: "6", TOTALTRAVELLANES: 1 })] }, c, way.tags), null);
  assert.equal(U.blockOf({ features: [line(1, { ROADTYPE: "1", TOTALTRAVELLANES: 0, TOTALPARKINGLANES: 0 })] }, c, way.tags), null);
});

test("Ústí uličky je křižovatka (OSM service=alley i plocha uličky)", async () => {
  const { localFrame, snapToWay, awayFromJunctions } = await import("../pilot/public/derive.js");
  const frame = localFrame(LAT, LON);
  const pts = way.geometry.map((g) => frame.toXY(g.lon, g.lat));
  const near = { ...snapToWay(pts, [0, 0]), way, pts };
  // An alley's area 4 m wide from the kerb (x 5 m) eastwards at the cut.
  const alley = { type: "area", id: -1, tags: { service: "alley" }, geometry: [[5, -2], [40, -2], [40, 2], [5, 2], [5, -2]].map(([x, y]) => { const [lon, lat] = ll(x, y); return { lat, lon }; }) };
  const moved = awayFromJunctions({ elements: [way, alley] }, frame, near);
  assert.ok(Math.abs(moved.point[1]) >= 6 + 2 - 0.5, `posun ${moved.point[1]}`);
  const P = (await import("../pilot/public/ortho-osm.js")).P;
  P.off = new Set(["ulicky"]);
  try { assert.equal(Math.abs(awayFromJunctions({ elements: [way, alley] }, frame, near).point[1]) < 0.01, true); } finally { P.off = new Set(); }
});

test("Spočítané pruhy: obousměrka se stáním se dělí od 4 m, bez počtu nebo bez stání od 5 m", async () => {
  const { splitTwoWayLane } = await import("../pilot/public/derive.js");
  const segs = (beside = "parkovani") => [{ type: "chodnik", width: 2 }, { type: beside, width: 2 }, { type: "pruh", width: 4.3 }, { type: "chodnik", width: 2 }];
  const a = segs(); splitTwoWayLane(a, { highway: "residential", lanes: "2" });
  assert.equal(a.filter((s) => s.type === "pruh").length, 2);
  const b = segs(); splitTwoWayLane(b, { highway: "residential" });
  assert.equal(b.filter((s) => s.type === "pruh").length, 1);
  const c = segs("zelen"); splitTwoWayLane(c, { highway: "residential", lanes: "2" });
  assert.equal(c.filter((s) => s.type === "pruh").length, 1);
});

test("Jamky stromů v chodníku: dlážděný úzký pás u obruby patří chodníku", async () => {
  const { treePitsAsSidewalk } = await import("../pilot/public/derive.js");
  const P = (await import("../pilot/public/ortho-osm.js")).P;
  const segs0 = [{ type: "chodnik", width: 2 }, { type: "zelen", width: 1 }, { type: "parkovani", width: 2.2 }, { type: "pruh", width: 4 }];
  assert.equal(treePitsAsSidewalk(segs0, [-6.1, 3.1], { G: [1], Y: [1] }), 0, "vypnuté bez ?treepits=1");
  P.treepits = true;
  // An image of 0.1 m across t −10…10 m and 160 rows along, all of one look.
  const st = (look) => {
    const nt = 200, nu = 160, n = nt * nu, f = (v) => new Float32Array(n).fill(v);
    return look === "paved" ? { t0: -10, nt, nu, res: 0.1, G: f(0), Y: f(5), D: f(0), L: f(150) } : { t0: -10, nt, nu, res: 0.1, G: f(20), Y: f(30), D: f(10), L: f(90) };
  };
  // Segments from the high t to the low: sidewalk 2, green 1, parking 2.2, lane 4, … (extent from −6.1).
  const segs = () => [{ type: "chodnik", width: 2 }, { type: "zelen", width: 1, items: [{ kind: "strom", f: 0.5 }] }, { type: "parkovani", width: 2.2 }, { type: "pruh", width: 4 }];
  const paved = segs();
  assert.equal(treePitsAsSidewalk(paved, [-6.1, 3.1], st("paved")), 1);
  assert.deepEqual(paved.map((s) => s.type), ["chodnik", "parkovani", "pruh"]);
  assert.equal(paved[0].width, 3);
  assert.equal(paved[0].items[0].kind, "strom");
  const green = segs();
  assert.equal(treePitsAsSidewalk(green, [-6.1, 3.1], st("green")), 0);
  assert.equal(treePitsAsSidewalk(segs(), [-6.1, 3.1], null), 0);
  P.treepits = false;
});

test("Tepny Washingtonu: svodidla, ostrůvky mimo vozovku, stání u méně pruhů, chráněná cyklostezka, pruhy směru", async () => {
  const u = await import("../pilot/public/towns/usa.js");
  const R = (...a) => a.map(([code, s, e]) => ({ code, s, e }));
  const f = [{ attributes: { DESCRIPTION: "Barrier" }, geometry: { paths: [[[0, 0], [1, 1]]] } }, { attributes: { DESCRIPTION: "Guardrail" }, geometry: { paths: [[[0, 0], [1, 1]]] } }];
  assert.deepEqual(u.barrierLines({ features: f }).map((x) => x.attributes.CTMTP_KOD), [71540]);
  assert.deepEqual((await import("../pilot/public/towns/planimetrics.js")).islandsBeside(R([9950, -20, -8], [702, -8, -6], [701, -6, -1], [9950, -1, 1], [701, 1, 6])).map((r) => r.code), [401, 702, 701, 9950, 701]);
  const block = (a) => ({ a, along: true });
  const runs = () => R([702, -8, -6], [701, -6, 6], [702, 6, 8]);
  const park = { TOTALPARKINGLANES: 1, TOTALPARKINGLANEWIDTH: 8, TOTALTRAVELLANESINBOUND: 1, TOTALTRAVELLANESOUTBOUND: 2 };
  assert.deepEqual(u.carveParking(runs(), block(park)), ["lo"]);
  assert.deepEqual(u.carveParking(runs(), block(park), {}, true, { bySide: false }), ["hi"]);
  const bike = { BIKELANE_DUAL_PROTECTED: "IB", TOTALBIKELANEWIDTH: 10, TOTALBIKELANES: 2 }, r = runs();
  assert.deepEqual(u.carveTracks(r, block(bike), { "cycleway:both": "separate" }), ["lo"]);
  assert.equal(r[1].code, 703);
  assert.deepEqual(u.carveTracks(runs(), block(bike), { "cycleway:right": "separate" }), ["hi"]);
  assert.deepEqual(u.carveTracks(runs(), block(bike), {}), []);
  const lanes = { TOTALTRAVELLANES: 5, TOTALTRAVELLANESINBOUND: 2, TOTALTRAVELLANESOUTBOUND: 3 };
  assert.equal(u.blockTags(block(lanes), { oneway: "yes", lanes: "2" }).lanes, undefined);
  assert.equal(u.blockTags(block(lanes), { oneway: "yes" }).lanes, "3");
  assert.equal(u.blockTags(block(lanes), { oneway: "-1" }).lanes, "2");
  assert.equal(u.blockTags(block(lanes), {}).lanes, "5");
});

test("Washington: domy z CAMA podle pozemku, výpadek nic nezdrží", async () => {
  const U = await import("../pilot/public/towns/usa.js");
  assert.deepEqual(U.camaHouse({ AYB: 1937, STORIES: 2, STRUCT_D: "Row Inside", EXTWALL_D: "Common Brick", USECODE: 11 }), { usCama: true, built: 1937, cornice: 2, roof: 0, total: 2, type: "terrace", material: "brick" });
  // Half a storey: in the roof of a detached house, a floor of a row house; 25 storeys of a house is a slip.
  assert.equal(U.camaHouse({ STORIES: 2.5, STRUCT_D: "Single" }).cornice, 2);
  assert.equal(U.camaHouse({ STORIES: 2.5, STRUCT_D: "Row End" }).cornice, 3);
  assert.equal(U.camaHouse({ STORIES: 25, STRUCT_D: "Row End" }).cornice, undefined);
  // A church's lot tells no kind of house; no year 0.
  assert.deepEqual(U.camaHouse(null, { AYB: 0, EXTWALL_D: "Brick", USECODE: 81 }), { usCama: true, material: "brick" });
  assert.deepEqual(U.camaHouse(null, null, null), {});
  const lot = (ssl, x) => ({ attributes: { SSL: ssl, USECODE: "011" }, geometry: { rings: [[[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]]] } });
  const at = U.camaAt([[0.5, 0.5], [5.5, 0.5]], { features: [lot("0001    0002", 0)] }, { features: [{ attributes: { SSL: "0001    0002", BLDG_NUM: 1, AYB: 1900, STORIES: 3, STRUCT_D: "Row End" } }] }, null);
  assert.equal(at[0].cornice, 3);
  assert.deepEqual(at[1], {});
  const fetch0 = globalThis.fetch, warn = console.warn;
  let asked = 0;
  console.warn = () => {};
  globalThis.fetch = async () => { asked++; throw new Error("down"); };
  assert.deepEqual(await Promise.all([U.sources.podlaznost(38.9, -77.01), U.sources.podlaznost(38.9001, -77.01)]), [{}, {}]);
  assert.deepEqual(await U.sources.podlaznost(38.91, -77.02), {}); // rests after a failure
  assert.equal(asked, 1);
  assert.deepEqual(await U.sources.podlaznost(38.8816, -77.2), {}); // outside DC's box
  globalThis.fetch = fetch0; console.warn = warn;
});
