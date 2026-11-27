// The USA (Bára 24. 11. 2026, phase 2): the state over the metro of Washington, DC's Planimetrics and DDOT's inventory
// (countries/US.js, towns/usa.js) and the three shared changes (derive.js: alley mouths, tree pits, the counted lanes).
// No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import "../app/public/america.js";
const STATY = { ...JSON.parse(fs.readFileSync(new URL("../app/public/states.json", import.meta.url), "utf8")), ...JSON.parse(fs.readFileSync(new URL("../app/public/states-america.json", import.meta.url), "utf8")) };

test("USA: District of Columbia je stát usa, zbytek USA zavřený (i okresy Marylandu a Virginie)", async () => {
  const C = await import("../app/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../app/public/towns.json", import.meta.url), "utf8")));
  C.loadStates(STATY);
  // The White House; on the DC line (Southern Avenue, dc-8-3): simplified county rings left a gap there.
  for (const [lat, lon] of [[38.8977, -77.0365], [38.8436094, -76.9725878]]) {
    assert.equal(C.cityAt(lat, lon), "usa", `${lat},${lon}`);
    assert.equal(C.closedAt(lat, lon), null);
  }
  // New York City (26. 11. 2026): the city of the state, its five boroughs (Manhattan, Queens, the Bronx, Staten Island, Brooklyn).
  C.loadTowns(JSON.parse(fs.readFileSync(new URL("../app/public/towns-us.json", import.meta.url), "utf8")));
  for (const [lat, lon] of [[40.7128, -74.006], [40.7282, -73.7949], [40.8448, -73.8648], [40.5795, -74.1502], [40.6782, -73.9442]]) {
    assert.equal(C.cityAt(lat, lon), "newyork", `${lat},${lon}`);
    assert.equal(C.closedAt(lat, lon), null);
  }
  assert.equal(C.countryOfCity("newyork").code, "US");
  // Baltimore, Richmond, Jersey City, Yonkers, Hempstead (Nassau): the USA beyond the metros, a message and no profile; since
  // 26. 11. 2026 (Bára: the District only) also Silver Spring (Montgomery), Hyattsville (Prince George's), Arlington,
  // Alexandria, Fairfax city, Tysons.
  for (const [lat, lon] of [[39.2904, -76.6122], [37.5407, -77.436], [40.7178, -74.0431], [40.9312, -73.8988], [40.7062, -73.6187],
    [38.9907, -77.0261], [38.9559, -76.9455], [38.8816, -77.091], [38.8048, -77.0469], [38.8462, -77.3064], [38.9187, -77.2311]]) {
    assert.equal(C.cityAt(lat, lon), "cizina", `${lat},${lon}`);
    assert.match(C.closedAt(lat, lon) || "", /Washingtonu/);
  }
  assert.equal(C.countryOfCity("usa").code, "US");
});

test("USA: mezi okresy ani na hranici DC nejsou díry, states.json nenese společné hranice dvakrát", async () => {
  const C = await import("../app/public/city.js");
  const staty = STATY;
  const us = JSON.parse(fs.readFileSync(new URL("../app/public/towns-us.json", import.meta.url), "utf8"));
  // (Four metros since 26. 11. 2026: Washington, New York, San Francisco, Boston; about 60 kB.)
  assert.ok(JSON.stringify(staty.usa).length < 75_000, `${JSON.stringify(staty.usa).length} B`);
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../app/public/towns.json", import.meta.url), "utf8")));
  C.loadStates(staty);
  // Round each point of the District's ring, nothing of the District is closed (the state's ring is grown by 60 m,
  // tools/build_states.mjs grow: a street along the line).
  C.loadTowns(us);
  for (const [lon, lat] of us.washington[0]) for (const [dx, dy] of [[0, 0], [4e-4, 0], [-4e-4, 0], [0, 3e-4], [0, -3e-4]]) {
    if (C.cityAt(lat + dy, lon + dx) === "washington") assert.equal(C.closedAt(lat + dy, lon + dx), null, `${lat + dy},${lon + dx}`);
  }
  // The quays across the border have not the message of the USA (Windsor has Canada's, Nuevo Laredo none), Detroit and Laredo have.
  assert.match(C.closedAt(42.3190, -83.0390) || "", /Torontu/);
  assert.equal(C.closedAt(27.4950, -99.5069), null);
  for (const [lat, lon] of [[42.3314, -83.0458], [27.5064, -99.5075]]) assert.match(C.closedAt(lat, lon) || "", /Washingtonu/);
});

const loadWashington = async () => {
  const C = await import("../app/public/city.js");
  C.loadTowns(JSON.parse(fs.readFileSync(new URL("../app/public/towns-us.json", import.meta.url), "utf8")));
  return C;
};
test("USA: DC je District, ne obdélník (ortofoto, mapa povrchů, město)", async () => {
  const { orthoHereAt, usOrthoAt } = await import("../app/public/lanes-ortho.js");
  const { AREAS } = await import("../app/public/towns/usa.js");
  const { inArea } = await import("../app/public/places.js");
  const C = await loadWashington();
  C.loadStates(STATY);
  assert.deepEqual(usOrthoAt(-77.0365, 38.8977), ["us-dc"]);
  assert.equal(C.cityAt(38.8977, -77.0365), "washington");
  // Inside the box, outside the District: Clarendon, Bethesda, Silver Spring, Old Town Alexandria, the airport; and Fairfax.
  for (const [lat, lon] of [[38.8868, -77.0953], [38.9847, -77.0947], [38.9935, -77.0265], [38.8048, -77.0469], [38.8512, -77.0402], [38.8462, -77.3064]]) {
    assert.equal(orthoHereAt("us", lon, lat), false, `${lat},${lon}`);
    assert.equal(inArea(AREAS.dc, lon, lat), false, `${lat},${lon}`);
    assert.equal(C.cityAt(lat, lon), "cizina");
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
  const U = await import("../app/public/towns/usa.js");
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
  const U = await import("../app/public/towns/usa.js");
  const runs = () => [{ code: 702, s: -8, e: -5 }, { code: 701, s: -5, e: 5 }, { code: 702, s: 5, e: 8 }];
  const one = { TOTALPARKINGLANES: 1, TOTALPARKINGLANEWIDTH: 8 };
  for (const RPPSIDE of ["O", "I", "B", "AO", null]) {
    assert.deepEqual(U.carveParking(runs(), { a: { ...one, RPPSIDE }, along: true }, { "parking:left": "lane" }), ["lo"], `${RPPSIDE}`);
    assert.deepEqual(U.carveParking(runs(), { a: { ...one, RPPSIDE }, along: true }), ["hi"], `${RPPSIDE}`);
  }
});

test("USA: strany podle cesty řezu, ne podle nejbližší cesty OSM (dvě vozovky a stezka uprostřed)", async () => {
  const U = await import("../app/public/towns/usa.js");
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
  const U = await import("../app/public/towns/usa.js");
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
  const U = await import("../app/public/towns/usa.js");
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
  const { localFrame, snapToWay, awayFromJunctions } = await import("../app/public/derive.js");
  const frame = localFrame(LAT, LON);
  const pts = way.geometry.map((g) => frame.toXY(g.lon, g.lat));
  const near = { ...snapToWay(pts, [0, 0]), way, pts };
  // An alley's area 4 m wide from the kerb (x 5 m) eastwards at the cut.
  const alley = { type: "area", id: -1, tags: { service: "alley" }, geometry: [[5, -2], [40, -2], [40, 2], [5, 2], [5, -2]].map(([x, y]) => { const [lon, lat] = ll(x, y); return { lat, lon }; }) };
  const moved = awayFromJunctions({ elements: [way, alley] }, frame, near);
  assert.ok(Math.abs(moved.point[1]) >= 6 + 2 - 0.5, `posun ${moved.point[1]}`);
  const P = (await import("../app/public/ortho-osm.js")).P;
  P.off = new Set(["ulicky"]);
  try { assert.equal(Math.abs(awayFromJunctions({ elements: [way, alley] }, frame, near).point[1]) < 0.01, true); } finally { P.off = new Set(); }
});

test("Spočítané pruhy: obousměrka se stáním se dělí od 4 m, bez počtu nebo bez stání od 5 m", async () => {
  const { splitTwoWayLane } = await import("../app/public/derive.js");
  const segs = (beside = "parkovani") => [{ type: "chodnik", width: 2 }, { type: beside, width: 2 }, { type: "pruh", width: 4.3 }, { type: "chodnik", width: 2 }];
  const a = segs(); splitTwoWayLane(a, { highway: "residential", lanes: "2" });
  assert.equal(a.filter((s) => s.type === "pruh").length, 2);
  const b = segs(); splitTwoWayLane(b, { highway: "residential" });
  assert.equal(b.filter((s) => s.type === "pruh").length, 1);
  const c = segs("zelen"); splitTwoWayLane(c, { highway: "residential", lanes: "2" });
  assert.equal(c.filter((s) => s.type === "pruh").length, 1);
});

test("Jamky stromů v chodníku: dlážděný úzký pás u obruby patří chodníku", async () => {
  const { treePitsAsSidewalk } = await import("../app/public/derive.js");
  const P = (await import("../app/public/ortho-osm.js")).P;
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
  const u = await import("../app/public/towns/usa.js");
  const R = (...a) => a.map(([code, s, e]) => ({ code, s, e }));
  const f = [{ attributes: { DESCRIPTION: "Barrier" }, geometry: { paths: [[[0, 0], [1, 1]]] } }, { attributes: { DESCRIPTION: "Guardrail" }, geometry: { paths: [[[0, 0], [1, 1]]] } }];
  assert.deepEqual(u.barrierLines({ features: f }).map((x) => x.attributes.CTMTP_KOD), [71540]);
  assert.deepEqual((await import("../app/public/towns/planimetrics.js")).islandsBeside(R([9950, -20, -8], [702, -8, -6], [701, -6, -1], [9950, -1, 1], [701, 1, 6])).map((r) => r.code), [401, 702, 701, 9950, 701]);
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
  const U = await import("../app/public/towns/usa.js");
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

test("DC: vypnutý inventář (?ddot=0) není výpadek, neodpovídající ano", async () => {
  const U = await import("../app/public/towns/usa.js");
  const LAT = 38.9, LON = -77.03, KX = 111320 * Math.cos((LAT * Math.PI) / 180), KY = 110574, ll = (x, y) => [LON + x / KX, LAT + y / KY];
  const esri = (list) => ({ features: list.map(([d, x0, x1]) => ({ attributes: { DESCRIPTION: d }, geometry: { rings: [[[x0, -50], [x1, -50], [x1, 50], [x0, 50], [x0, -50]].map(([x, y]) => ll(x, y))] } })) });
  const way = { type: "way", id: 1, tags: { highway: "residential" }, geometry: [ll(0, -60), ll(0, 60)].map(([lon, lat]) => ({ lon, lat })) };
  const bbox = [...ll(-30, -1), ...ll(30, 1)].map((v, i) => v + (i < 2 ? -4e-4 : 4e-4)).join(",");
  const ask = (sub, o) => U.dcSurfaces({ roads: esri([["Road", -5, 5]]), walks: esri([]), bldg: esri([]), sub }, [way], bbox, way.tags, { way, ...o });
  assert.equal(ask({ features: [] }, { ddot: false }).ddotFailed, undefined);
  assert.equal(ask(null, {}).ddotFailed, true);
});

test("New York: planimetrie podél řezu (malovaný ostrůvek je vozovka), domy z obrysů, normy Street Design Manual", async () => {
  const N = await import("../app/public/towns/newyork.js");
  const { planimetricCut } = await import("../app/public/towns/planimetrics.js");
  const US = (await import("../app/public/countries/US.js")).default;
  const LAT = 40.78, LON = -73.98, KX = 111320 * Math.cos((LAT * Math.PI) / 180), KY = 110574, ll = (x, y) => [LON + x / KX, LAT + y / KY];
  const esri = (list) => ({ features: list.map(([a, x0, x1]) => ({ attributes: a, geometry: { rings: [[[x0, -50], [x1, -50], [x1, 50], [x0, 50], [x0, -50]].map(([x, y]) => ll(x, y))] } })) });
  const way = { type: "way", id: 1, tags: { highway: "residential" }, geometry: [ll(0, -60), ll(0, 60)].map(([lon, lat]) => ({ lon, lat })) };
  const bbox = [...ll(-30, -1), ...ll(30, 1)].map((v, i) => v + (i < 2 ? -4e-4 : 4e-4)).join(",");
  // Building, sidewalk, plaza, median, roadbed, parking lot (the order of NYC_MAP.layers).
  const cut = planimetricCut(N.NYC_MAP, [esri([[{ FEATURE_CODE: 2100 }, -30, -14], [{ FEATURE_CODE: 1001 }, 14, 30]]), esri([[{}, -14, -9], [{}, 9, 14]]), esri([]),
    esri([[{ SUB_FEATURE_CODE: 360010 }, -1, 1]]), esri([[{ SUB_FEATURE_CODE: 350000 }, -9, 9]]), esri([])], [way], bbox, way.tags, { way });
  assert.deepEqual(cut.features.map((f) => f.attributes.code), [401, 601, 702, 701, 702, 401]); // the painted median is roadway, a canopy no house
  assert.equal(N.nycCode.roadbed({ SUB_FEATURE_CODE: 350030 })[0], 1003);
  assert.equal(N.nycCode.median({ SUB_FEATURE_CODE: 360020 })[0], 9950);
  assert.deepEqual(N.nycHouse({ FEATURE_CODE: 2100, HEIGHT_ROOF: 60, CONSTRUCTION_YEAR: 1926 }), { cornice: 5, roof: 0, total: 5, fromHeight: true, hm: 18.288, built: 1926, nycHouse: true });
  assert.equal(N.nycHouse({ FEATURE_CODE: 5110, HEIGHT_ROOF: 10 }).garage, true);
  assert.deepEqual(N.nycHouse({ FEATURE_CODE: 1002, HEIGHT_ROOF: 30 }), {});
  // New York's norms in New York, DDOT's elsewhere in the state.
  assert.match(US.limits({ type: "pruh", width: 3 }, [], -1, { id: "newyork" }).why, /NYC Street Design Manual/);
  assert.match(US.limits({ type: "pruh", width: 3 }, [], -1, { id: "washington" }).why, /DDOT/);
  assert.equal(US.limits({ type: "chodnik", width: 1 }, [], -1, { id: "newyork" }), null);
  assert.ok(US.art.newyork["lamp-modern-left"] && US.art.newyork["bus-inbound"] === "bus-inbound");
});

test("New York: stání podle značek NYC DOT (?nycsigns=1): nejbližší značka strany do 40 m, OSM má přednost", async () => {
  const N = await import("../app/public/towns/newyork.js");
  // EPSG:2263 there and back (a sign of 3rd Avenue between East 85th and 86th Street).
  const [lon, lat] = N.fromStatePlane(996877, 222815);
  assert.ok(Math.abs(lon + 73.9544) < 2e-4 && Math.abs(lat - 40.7782) < 2e-4);
  assert.deepEqual(N.toStatePlane(lon, lat).map(Math.round), [996877, 222815]);
  assert.equal(N.streetKey("EAST    7 STREET"), N.streetKey("East 7th Street"));
  assert.equal(N.signKind("NO PARKING (SANITATION BROOM SYMBOL) TUESDAY FRIDAY 11:30AM-1PM <->"), "allow");
  assert.equal(N.signKind("2 HMP 9AM-7PM EXCEPT SUNDAY <->"), "allow");
  assert.equal(N.signKind("NO STANDING MONDAY-FRIDAY 4PM-7PM <->"), "allow");
  assert.equal(N.signKind("NO STANDING ANYTIME <->"), "never");
  assert.equal(N.signKind("BUS STOP SIGN (BUS & HANDICAP SYMBOLS) NO STANDING <----->"), "never");
  assert.equal(N.signKind("LOCAL MTA BUS ROUTE PANEL"), null);
  // A street running north (the cut's dir east: the street is dir turned left), the way along it: west is its left.
  const c = { lon0: lon, lat0: lat, kx: 111320 * Math.cos((lat * Math.PI) / 180), ky: 110574, dir: [1, 0] };
  const at = (north, side, desc, street = "3 AVENUE") => ({ on_street: street, side_of_street: side, sign_description: desc, ...Object.fromEntries(N.toStatePlane(lon, lat + north / 110574).map((v, i) => [i ? "sign_y_coord" : "sign_x_coord", String(v)])) });
  const signs = [at(10, "W", "NO STANDING ANYTIME <->"), at(5, "W", "2 HMP 9AM-7PM <->"), at(-20, "E", "NO STANDING ANYTIME -->"), at(60, "E", "2 HMP 9AM-7PM <->"), at(2, "E", "2 HMP 9AM-7PM <->", "EAST 86 STREET")];
  assert.deepEqual(N.signTags(signs, c, { name: "3rd Avenue" }), { "parking:left": "lane", "parking:left:orientation": "parallel", "parking:right": "no" });
  // The way against the street: the sides swap; OSM's own parking tag of a side stays; a way of another name: nothing.
  assert.deepEqual(N.signTags(signs, c, { name: "3rd Avenue" }, false), { "parking:right": "lane", "parking:right:orientation": "parallel", "parking:left": "no" });
  assert.deepEqual(N.signTags(signs, c, { name: "3rd Avenue", "parking:right": "lane" }), { "parking:left": "lane", "parking:left:orientation": "parallel" });
  assert.deepEqual(N.signTags(signs, c, { name: "Lexington Avenue" }), {});
  // Off by default: no request.
  assert.equal(N.NYC_MAP.extra("-73.96,40.77,-73.95,40.78"), undefined);
});

test("New York: náměstí a parkoviště jsou nepovinné vrstvy (výpadek jen té vrstvy = bez ní), vozovka, chodník a ostrůvky povinné", async () => {
  const { NYC_MAP } = await import("../app/public/towns/newyork.js");
  const { optionalAnswer } = await import("../app/public/towns/planimetrics.js");
  const opt = NYC_MAP.layers.filter((l) => l.optional).map((l) => l.id.split("/")[0]);
  assert.deepEqual(opt, ["Plaza_2022", "Parking_Lot_2022"]);
  const warn = console.warn; console.warn = () => {};
  try {
    const full = { features: [{ attributes: {} }] };
    assert.equal(await optionalAnswer(Promise.resolve(full), "x"), full);
    assert.deepEqual(await optionalAnswer(Promise.reject(new Error("503")), "x"), { features: [] });
    assert.deepEqual(await optionalAnswer(Promise.resolve({ features: [{}], exceededTransferLimit: true }), "x"), { features: [] });
  } finally { console.warn = warn; }
});

test("Hledání Photon v USA: jeden dotaz s obdélníkem jednoho metra (jmenovaného, pod středem mapy, jinak nejbližšího)", async () => {
  const { findPhoton, metroBox, METROS } = await import("../app/public/search-photon.js");
  const urls = [], getJSON = async (u) => { urls.push(new URL(u)); return { features: [] }; };
  const box = (u) => u.searchParams.get("bbox").split(",").map(Number);
  // The map in San Francisco: its box, not one from Washington to Boston.
  await findPhoton("Folsom Street", getJSON, null, ["US"], [37.77, -122.42], () => false);
  assert.deepEqual(box(urls[0]), METROS.US.sf.box);
  // Philadelphia (no metro of the app): the nearest, New York; Baltimore: Washington.
  assert.deepEqual(metroBox("US", [39.95, -75.16]), METROS.US.nyc.box);
  assert.deepEqual(metroBox("US", [39.29, -76.61]), METROS.US.dc.box);
  // A query naming another metro is asked there, from wherever the map is.
  await findPhoton("Market Street, San Francisco", getJSON, null, ["US"], [38.9, -77.03], () => false);
  assert.deepEqual(box(urls[1]), METROS.US.sf.box);
  await findPhoton("Newbury Street Boston", getJSON, null, ["US"], [40.75, -73.99], () => false);
  assert.deepEqual(box(urls[2]), METROS.US.boston.box);
  // One query a search; Canada keeps its box (Toronto).
  assert.equal(urls.length, 3);
  assert.deepEqual(metroBox("CA", [43.65, -79.38]), [-79.95, 43.45, -78.95, 44.05]);
  // The closed places of a box are dropped (New Jersey in New York's).
  const { parsePhoton } = await import("../app/public/search-photon.js");
  const f = (lon, lat, name) => ({ geometry: { coordinates: [lon, lat] }, properties: { countrycode: "US", osm_key: "highway", name, city: "x" } });
  assert.deepEqual(parsePhoton({ features: [f(-74.07, 40.72, "Jersey Ave"), f(-73.99, 40.75, "W 34th St")] }, ["US"], (lat, lon) => lon < -74.03).map((x) => x.at.street), ["W 34th St"]);
});

test("Hledání Photon v USA: jméno ulice podle města (Washington Street, Boston Post Road) metro neurčuje", async () => {
  const { metroBox, METROS } = await import("../app/public/search-photon.js");
  assert.deepEqual(metroBox("US", [42.35, -71.06], "Washington Street"), METROS.US.boston.box);
  assert.deepEqual(metroBox("US", [38.9, -77.03], "Washington Street, Boston"), METROS.US.boston.box);
  assert.deepEqual(metroBox("US", [40.85, -73.86], "Boston Post Road"), METROS.US.nyc.box);
  assert.deepEqual(metroBox("US", [40.75, -73.99], "Boston Rd, Bronx"), METROS.US.nyc.box);
  assert.deepEqual(metroBox("US", [40.75, -73.99], "Mission St, SF"), METROS.US.sf.box);
});

test("DC: stání z inventáře se do úzké vozovky nevejde, nevyřeže se a nezakáže odhad (?off=ddotfit)", async () => {
  const U = await import("../app/public/towns/usa.js");
  const runs = (w) => [{ code: 702, s: -8, e: -w / 2 }, { code: 701, s: -w / 2, e: w / 2 }, { code: 702, s: w / 2, e: 8 }];
  const two = { a: { TOTALPARKINGLANES: 2, TOTALPARKINGLANEWIDTH: 16 }, along: true };
  // 7,4 m: 2 × 2,45 + 2,5 = 7,4 fits (the strips 2,45 m each, width 16 ft / 2)
  const wide = runs(8);
  assert.deepEqual(U.carveParking(wide, two), ["lo", "hi"]);
  assert.equal(wide.filter((r) => r.code === 704).length, 2);
  const narrow = runs(6), before = JSON.stringify(narrow);
  assert.equal(U.carveParking(narrow, two), null);
  assert.equal(JSON.stringify(narrow), before, "runs unchanged");
  // One strip: as before.
  assert.deepEqual(U.carveParking(runs(6), { a: { TOTALPARKINGLANES: 1, TOTALPARKINGLANEWIDTH: 8 }, along: true }), ["hi"]);
});
