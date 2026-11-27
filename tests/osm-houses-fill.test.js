import { test } from "node:test";
import assert from "node:assert/strict";
import { localFrame, mtvuPolygons, withOsmBuildings } from "../pilot/public/derive.js";

// The cut runs along x (normal (1, 0)), 40 m a side; the map draws a yard (603) all across and a RÚIAN house at 20..30 m.
const frame = localFrame(49.9, 16.45);
const ring = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]].map(([x, y]) => frame.toLonLat(x, y));
const feature = (code, x0, y0, x1, y1) => ({ attributes: { CTVUK_KOD: code }, geometry: { rings: [ring(x0, y0, x1, y1)] } });
const polys = (...f) => mtvuPolygons({ features: f }, frame);
const house = (id, x0, y0, x1, y1, tags = { building: "yes" }) => ({ type: "area", id, tags, geometry: ring(x0, y0, x1, y1).map(([lon, lat]) => ({ lon, lat })) });
const run = (p, osm) => withOsmBuildings(p, { elements: osm }, frame, [0, 0], [1, 0], 40);

test("budova z OSM, kterou mapa nemá, se přidá jako slabá budova", () => {
  const p = polys(feature(603, -40, -40, 40, 40), feature(601, 20, -5, 30, 5));
  const out = run(p, [house(1, -12, -4, -4, 10)]);
  assert.equal(out.length, 3);
  assert.equal(out[0].osmBuilding, true);
  assert.equal(out[0].code, 601);
});

test("budova, kterou mapa má (i posunutá), se nepřidá; sousední jen rohem také ne", () => {
  const p = polys(feature(603, -40, -40, 40, 40), feature(601, 20, -5, 30, 5));
  assert.equal(run(p, [house(1, 21, -4, 31, 6)]).length, 2);
  const next = polys(feature(603, -40, -40, 40, 40), feature(601, 0, 5, 10, 15));
  assert.equal(run(next, [house(2, -10, -2, 0.5, 5.5)]).length, 2 + 1);
});

test("bez budov v mapě, mimo řez a střechy (roof) se nic nepřidá", () => {
  assert.equal(run(polys(feature(603, -40, -40, 40, 40)), [house(1, -12, -4, -4, 10)]).length, 1);
  const p = polys(feature(603, -40, -40, 40, 40), feature(601, 20, -5, 30, 5));
  assert.equal(run(p, [house(1, -12, 8, -4, 20)]).length, 2);
  assert.equal(run(p, [house(1, -12, -4, -4, 10, { building: "roof" })]).length, 2);
});
