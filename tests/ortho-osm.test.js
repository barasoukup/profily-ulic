// The street from the orthophoto and OSM where no technical map answers (pilot/public/ortho-osm.js) on a drawn image:
// a 7 m carriageway (dark) between lighter sidewalks, OSM houses 8 m from the axis on both sides.
import { test } from "node:test";
import assert from "node:assert/strict";
import { orthoOsmPolys, osmAlong, osmRoad } from "../pilot/public/ortho-osm.js";
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
  const polys = orthoOsmPolys({ osm: osm(), frame, dir, way: osm().elements[0], st: image() });
  assert.ok(polys);
  // OSM expects 2 × 2.75 m; the image shows 7 m.
  assert.ok(Math.abs(polys.kerbs.A + 3.5) < 0.15 && Math.abs(polys.kerbs.B - 3.5) < 0.15, JSON.stringify(polys.kerbs));
  assert.deepEqual(polys.slice(0, 3).map((p) => p.code), [701, 702, 702]);
  assert.equal(polys.filter((p) => p.code === 601).length, 2);
  const p = deriveProfile({ center: [0, 0], dir, half: 40, polys, osm: osm(), frame, way: osm().elements[0] });
  assert.ok(!p.estimate);
  assert.deepEqual(p.edges, { left: "budova", right: "budova", ...Object.fromEntries(Object.entries(p.edges).filter(([k]) => k.endsWith("Info"))) });
  const sw = p.segments.filter((s) => s.type === "chodnik");
  assert.equal(sw.length, 2);
  assert.ok(sw.every((s) => Math.abs(s.width - 4.5) < 0.2 && s.source === "odhad"), JSON.stringify(sw));
  const road = p.segments.filter((s) => !["chodnik"].includes(s.type)).reduce((a, s) => a + s.width, 0);
  assert.ok(Math.abs(road - 7) < 0.3, String(road));
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

test("ortofoto a OSM: chodník (pěšina) se nepočítá, bez obrázku nic", () => {
  const els = { elements: [{ type: "way", id: 1, tags: { highway: "footway" }, geometry: [ll(0, -60), ll(0, 60)] }] };
  assert.equal(orthoOsmPolys({ osm: els, frame, dir, way: els.elements[0], st: image() }), null);
  assert.equal(orthoOsmPolys({ osm: osm(), frame, dir, way: osm().elements[0], st: null }), null);
});

test("ortofoto a OSM: trávník z OSM mezi obrubou a domem je zeleň, voda konec profilu", () => {
  const lawn = { type: "area", id: 7, tags: { landuse: "grass" }, geometry: [ll(-6, -20), ll(-4, -20), ll(-4, 20), ll(-6, 20), ll(-6, -20)] };
  const river = { type: "area", id: 8, tags: { natural: "water" }, geometry: [ll(4, -20), ll(30, -20), ll(30, 20), ll(4, 20), ll(4, -20)] };
  const els = { elements: [osm().elements[0], house(-16, -8), lawn, river] };
  const polys = orthoOsmPolys({ osm: els, frame, dir, way: els.elements[0], st: image() });
  assert.deepEqual(polys.slice(1, 3).map((p) => p.code), [401, 501]);
  const p = deriveProfile({ center: [0, 0], dir, half: 40, polys, osm: els, frame, way: els.elements[0] });
  // t = −x: the lawn (x −6…−4) lies at t 4…6, past the 3.5 m kerb on the west side; the river (x 4…30) east, the profile's right.
  assert.ok(p.segments.some((s) => s.type === "zelen" && Math.abs(s.width - 2) < 0.2), JSON.stringify(p.segments.map((s) => [s.type, s.width])));
  assert.equal(p.edges.right, "voda");
});
