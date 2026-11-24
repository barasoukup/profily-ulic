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
  for (const [lat, lon] of [[38.8977, -77.0365], [38.9907, -77.0261], [38.9559, -76.9455], [38.8816, -77.091], [38.8048, -77.0469], [38.8462, -77.3064], [38.9187, -77.2311]]) {
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

test("USA: ortofoto DC jen nad DC", async () => {
  const { orthoHereAt, usOrthoAt } = await import("../pilot/public/lanes-ortho.js");
  assert.equal(orthoHereAt("us", -77.0365, 38.8977), true);
  assert.deepEqual(usOrthoAt(-77.0365, 38.8977), ["us-dc"]);
  assert.equal(orthoHereAt("us", -77.3064, 38.8462), false); // Fairfax
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
  assert.equal(out.block, true);
  // Without the inventory: no parking strips nor tags.
  const bare = U.dcSurfaces({ roads, walks, bldg, sub }, [way], BBOX, way.tags, { ddot: false });
  assert.equal(bare.features.filter((f) => f.attributes.code === 704).length, 0);
  assert.equal(bare.wayTags, null);
  // Only a yard under the centre (no roadway within 3 m): not the street.
  assert.equal(U.dcSurfaces({ roads: esri([["Road", 10, 18]]), walks, bldg, sub }, [way], BBOX, way.tags), null);
});

test("USA: jedno stání podle RPPSIDE na straně podle směru čáry inventáře", async () => {
  const U = await import("../pilot/public/towns/usa.js");
  const runs = () => [{ code: 702, s: -8, e: -5 }, { code: 701, s: -5, e: 5 }, { code: 702, s: 5, e: 8 }];
  // The cut's dir points to the street's right: a line along the street has O (its right) at +t.
  const r1 = runs(); U.carveParking(r1, { a: { TOTALPARKINGLANES: 1, TOTALPARKINGLANEWIDTH: 8, RPPSIDE: "O" }, along: true });
  assert.ok(r1.some((r) => r.code === 704 && r.e === 5));
  const r2 = runs(); U.carveParking(r2, { a: { TOTALPARKINGLANES: 1, TOTALPARKINGLANEWIDTH: 8, RPPSIDE: "I" }, along: true });
  assert.ok(r2.some((r) => r.code === 704 && r.s === -5));
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

test("Spočítané pruhy: obousměrka se dělí od 4 m, bez počtu od 5 m", async () => {
  const { splitTwoWayLane } = await import("../pilot/public/derive.js");
  const segs = () => [{ type: "chodnik", width: 2 }, { type: "pruh", width: 4.3 }, { type: "chodnik", width: 2 }];
  const a = segs(); splitTwoWayLane(a, { highway: "residential", lanes: "2" });
  assert.equal(a.filter((s) => s.type === "pruh").length, 2);
  const b = segs(); splitTwoWayLane(b, { highway: "residential" });
  assert.equal(b.filter((s) => s.type === "pruh").length, 1);
});

test("Jamky stromů v chodníku: dlážděný úzký pás u obruby patří chodníku", async () => {
  const { treePitsAsSidewalk } = await import("../pilot/public/derive.js");
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
});
