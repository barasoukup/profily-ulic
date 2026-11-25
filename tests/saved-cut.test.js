// A saved cut (#rez= link, pasted position with its azimuth) opens exactly where it was saved (Bára 25. 11. 2026); a
// click is still moved away from junctions and to the middle of a street of two carriageways.
import { test } from "node:test";
import assert from "node:assert/strict";
import { localFrame, nearestStreet, savedStreet, placeCut } from "../pilot/public/derive.js";

const frame = localFrame(50, 14.4);
const way = (id, pts, tags) => ({ type: "way", id, tags, geometry: pts.map(([x, y]) => { const [lon, lat] = frame.toLonLat(x, y); return { lon, lat }; }) });
const at = (osm, exact) => placeCut(osm, frame, nearestStreet(osm, frame, [0, 0]), exact);

test("uložený řez u obslužné cesty se neposune, kliknutí ano", () => {
  const osm = { elements: [way(1, [[0, -100], [0, 4], [0, 100]], { highway: "residential", name: "A" }), way(2, [[0, 4], [60, 4]], { highway: "service" })] };
  assert.deepEqual(at(osm, true).point, [0, 0]);
  assert.ok(Math.abs(at(osm, false).point[1]) > 5);
  assert.equal(at(osm, true).way.id, 1);
});

test("uložený řez dvou vozovek zůstane, i když OSM osu mezitím posunulo", () => {
  const tags = { highway: "secondary", name: "B", oneway: "yes" };
  const osm = { elements: [way(1, [[-6, -100], [-6, 100]], tags), way(2, [[8, 100], [8, -100]], tags)] };
  assert.deepEqual(at(osm, true).point, [0, 0]);
  assert.ok(Math.abs(at(osm, false).point[0] - 1) < 0.1, "kliknutí doprostřed");
});

test("bez ulice v okolí se uložená poloha chová jako kliknutí", () => {
  const osm = { elements: [way(1, [[60, -100], [60, 100]], { highway: "residential" })] };
  assert.ok(Math.abs(at(osm, true).point[0] - 60) < 0.1);
});

// The link carries its street (#rez=lat,lon,bearing,left,right,way; Bára 25. 11. 2026).
test("odkaz s cestou otevře svou vozovku, bez ní (nebo když už není) nejbližší", () => {
  const tags = { highway: "secondary", name: "B", oneway: "yes" };
  // Two carriageways; the cut saved from the clicked left one (1) lies a little nearer to the right one (2).
  const osm = { elements: [way(1, [[-9, -100], [-9, 100]], tags), way(2, [[7, 100], [7, -100]], tags), way(3, [[-20, 30], [-20, 90]], tags), way(4, [[-60, -100], [-60, 100]], tags), way(5, [[-5, -90], [-5, -3]], tags), way(6, [[-9, -90], [-9, 90]], { highway: "secondary", layer: "-1", tunnel: "yes" })] };
  assert.equal(nearestStreet(osm, frame, [0, 0]).way.id, 5);
  osm.elements = osm.elements.filter((x) => x.id !== 5);
  assert.equal(nearestStreet(osm, frame, [0, 0]).way.id, 2);
  const near = savedStreet(osm, frame, 1);
  assert.equal(near.way.id, 1);
  assert.ok(near.dir[1] > 0.99, "směr podle své cesty, ne podle druhé vozovky");
  assert.deepEqual(placeCut(osm, frame, near, true).point, [0, 0]);
  assert.equal(savedStreet(osm, frame, 99), null, "cesta už není");
  assert.equal(savedStreet(osm, frame, 3), null, "cesta končí před řezem");
  assert.equal(savedStreet(osm, frame, 4), null, "cesta je daleko");
  assert.equal(savedStreet(osm, frame, 6), null, "tunel");
});
