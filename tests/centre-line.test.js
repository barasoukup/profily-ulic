import { test } from "node:test";
import assert from "node:assert/strict";
import { centreLine } from "../app/public/lanes-ortho.js";
import SI from "../app/public/countries/SI.js";
import base from "../app/public/countries/default.js";
import CZ from "../app/public/countries/CZ.js";

// A synthetic photo of a roadway from t = -4 to 4 m (asphalt of brightness 100), 10 cm pixels, 40 m along the street, a
// line of paint at t = at, 15 cm wide, painted where on(u in m) is true.
function photo(at, on, { t0 = -6, nt = 120, nu = 400, res = 0.1 } = {}) {
  const L = new Float32Array(nt * nu).fill(100);
  for (let j = 0; j < nu; j++) for (let i = 0; i < nt; i++) {
    const t = t0 + (i + 0.5) * res;
    if (at !== null && Math.abs(t - at) < 0.08 && on(j * res)) L[j * nt + i] = 200;
  }
  return { nt, nu, res, t0, L, fine: true };
}
test("středová čára z ortofota: plná, přerušovaná, žádná", () => {
  const solid = centreLine(photo(0.1, () => true), -4, 4);
  assert.equal(solid.found, true);
  assert.equal(solid.kind, "solid");
  assert.ok(Math.abs(solid.t - 0.1) < 0.2);
  const dashed = centreLine(photo(-0.2, (u) => u % 9 < 3), -4, 4);
  assert.equal(dashed.found, true);
  assert.equal(dashed.kind, "dashed");
  assert.deepEqual(centreLine(photo(null, () => false), -4, 4), { found: false });
});
test("středová čára z ortofota: čára u okraje a čára mimo vozovku nejsou středová", () => {
  assert.equal(centreLine(photo(-3.3, () => true), -4, 4).found, false);
  assert.equal(centreLine(photo(0.1, () => true), -4, 4).found, true);
});
test("středová čára z ortofota: bez snímku, vozovka mimo snímek nebo úzká je neznámá (null)", () => {
  assert.equal(centreLine(null, -4, 4), null);
  assert.equal(centreLine(photo(0, () => true), -8, 8), null);
  assert.equal(centreLine(photo(0, () => true), -1.5, 1.5), null);
});
test("zákon o stání: středovou čáru vyžaduje jen Slovinsko", () => {
  assert.deepEqual(SI.centreLine, { required: true, solid: true });
  assert.equal(base.centreLine, null);
  assert.equal(CZ.centreLine ?? null, null);
});

// The law's estimate of parking in a state that asks for a centre line (derive.js splitRoadway): a measured roadway of
// 11 m, the orthophoto with a line at t = 2 (solid, dashed) or none.
import { localFrame, deriveProfile, mtvuPolygons } from "../app/public/derive.js";
import { country } from "../app/public/city.js";
function cutWith(img, tags, road = 11) {
  const frame = localFrame(46.05, 14.5);
  const rect = (x0, x1, code) => ({ attributes: { CTVUK_KOD: code }, geometry: { rings: [[[x0, -60], [x1, -60], [x1, 60], [x0, 60], [x0, -60]].map(([x, y]) => frame.toLonLat(x, y))] } });
  const polys = mtvuPolygons({ features: [rect(-road / 2 - 3, -road / 2, 702), rect(-road / 2, road / 2, 701), rect(road / 2, road / 2 + 3, 702)] }, frame);
  const g = [frame.toLonLat(0, -100), frame.toLonLat(0, 100)].map(([lon, lat]) => ({ lat, lon }));
  const way = { type: "way", id: 1, tags, geometry: g };
  const r = deriveProfile({ center: [0, 0], dir: [0, 1], half: 40, polys, osm: { elements: [way] }, frame, way, lanesImage: img });
  return r.segments.filter((s) => s.type === "parkovani").length;
}
test("zákon o stání se středovou čárou: plná čára měří 3 m k čáře, žádná čára stání vylučuje, bez snímku platí OSM", () => {
  const was = { c: country.centreLine, p: country.parkOnRoadway, g: country.parkGuess, f: country.freeLane };
  const street = { highway: "residential", lanes: "2", sidewalk: "both" };
  try {
    country.parkGuess = true; country.freeLane = 3;
    country.parkOnRoadway = (tags, oneway, lanes) => (oneway ? lanes < 2 : Number(tags.lanes) >= 2);
    country.centreLine = { required: true, solid: true };
    assert.equal(cutWith(null, street), 2, "bez snímku OSM: dvě strany");
    assert.equal(cutWith(null, { highway: "residential", sidewalk: "both" }), 0, "bez snímku a bez lanes OSM nedovolí");
    assert.equal(cutWith(photo(null, () => false, { t0: -8, nt: 160 }), street), 0, "snímek bez čáry: žádné stání");
    assert.equal(cutWith(photo(0.1, (u) => u % 9 < 3, { t0: -8, nt: 160 }), { highway: "residential", sidewalk: "both" }), 2, "přerušovaná čára i bez lanes v OSM, měří se k protějšímu okraji");
    assert.equal(cutWith(photo(2, () => true, { t0: -8, nt: 160 }), street), 1, "plná čára: 3 m k čáře, jen na straně, kde to vyjde");
    country.centreLine = null;
    assert.equal(cutWith(photo(null, () => false, { t0: -8, nt: 160 }), street), 2, "stát bez podmínky čáru nečte");
  } finally { country.centreLine = was.c; country.parkOnRoadway = was.p; country.parkGuess = was.g; country.freeLane = was.f; }
});
