// A saved cut (#rez= link, pasted position with its azimuth) opens exactly where it was saved (Bára 25. 11. 2026); a
// click is still moved away from junctions and to the middle of a street of two carriageways.
import { test } from "node:test";
import assert from "node:assert/strict";
import { localFrame, nearestStreet, placeCut } from "../pilot/public/derive.js";

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
