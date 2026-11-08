import { test } from "node:test";
import assert from "node:assert/strict";
import { localFrame, deriveProfile } from "../pilot/public/derive.js";

// A straight street running north through a synthetic frame; no technical map (polys = []),
// so the profile is the estimate from OSM tags.
function street(tags) {
  const frame = localFrame(50.08, 14.42);
  const [lon, lat] = frame.toLonLat(0, 0);
  const way = { type: "way", id: 1, tags, geometry: [{ lat, lon }, { lat: lat + 0.001, lon }] };
  return deriveProfile({ center: [0, 0], dir: [0, 1], half: 40, polys: [], osm: { elements: [way] }, frame, way });
}

test("odhad z OSM: dva pruhy a chodníky po obou stranách", () => {
  const { segments } = street({ highway: "residential", lanes: "2", sidewalk: "both" });
  assert.deepEqual(segments.map((s) => s.type), ["chodnik", "pruh", "pruh", "chodnik"]);
  assert.ok(segments.every((s) => s.width > 0));
  assert.ok(segments.some((s) => s.source === "odhad"), "odhad je označený");
});

test("odhad z OSM: jednosměrka bez chodníků má jeden pruh", () => {
  const { segments } = street({ highway: "residential", oneway: "yes", lanes: "1", sidewalk: "no" });
  assert.deepEqual(segments.map((s) => s.type), ["pruh"]);
});
