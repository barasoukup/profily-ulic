import { test } from "node:test";
import assert from "node:assert/strict";
import { localFrame, mtvuPolygons } from "../app/public/derive.js";
import { esriRect, deriveOn } from "./helpers/osm.js";

// A straight street running north through a synthetic frame; no technical map (polys = []),
// so the profile is the estimate from OSM tags.
function street(tags) {
  const frame = localFrame(50.08, 14.42);
  const [lon, lat] = frame.toLonLat(0, 0);
  const way = { type: "way", id: 1, tags, geometry: [{ lat, lon }, { lat: lat + 0.001, lon }] };
  return deriveOn({ polys: [], elements: [way], frame, way });
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

// Keeping left (Cyprus, Malta; review of 23. 11. 2026): a synthetic street with a measured roadway, the whole profile.
function measured(ways, road) {
  const frame = localFrame(35.17, 33.36);
  const rect = esriRect(frame);
  const polys = mtvuPolygons({ features: [rect(-road / 2 - 3, -road / 2, 702), rect(-road / 2, road / 2, 701), rect(road / 2, road / 2 + 3, 702)] }, frame);
  const els = ways.map(([x, tags, south], i) => {
    const g = [frame.toLonLat(x, -100), frame.toLonLat(x, 100)].map(([lon, lat]) => ({ lat, lon }));
    return { type: "way", id: i + 1, tags, geometry: south ? g.reverse() : g };
  });
  const r = deriveOn({ polys, elements: els, frame, way: els[0], noParkGuess: true });
  return r.segments.map((s) => s.type + (s.dir ? (s.dir === "forward" ? "↑" : "↓") : "") + (s.turn ? ":" + s.turn : "")).join(" | ");
}

test("jízda vlevo (Kypr, Malta): směry podle pravidel otočené, data na svém místě", async () => {
  const { country } = await import("../app/public/city.js");
  const D = await import("../app/public/derive.js");
  const was = country.leftHand;
  const four = { highway: "primary", lanes: "4", "lanes:forward": "2", "lanes:backward": "2" };
  const turn = { ...four, "turn:lanes:forward": "left|through" }, bus = { ...four, "bus:lanes:forward": "designated|yes" };
  const ow = { highway: "trunk", oneway: "yes", lanes: "2" };
  try {
    country.leftHand = false;
    assert.equal(measured([[0, turn]], 13), "chodnik | pruh↓ | pruh↓ | pruh↑:left | pruh↑:through | chodnik");
    assert.equal(measured([[0, bus]], 13), "chodnik | pruh↓ | pruh↓ | bus↑ | pruh↑ | chodnik");
    assert.equal(measured([[0, { highway: "residential" }]], 7), "chodnik | pruh↓ | pruh↑ | chodnik");
    country.leftHand = true;
    assert.equal(measured([[0, turn]], 13), "chodnik | pruh↑:left | pruh↑:through | pruh↓ | pruh↓ | chodnik", "odbočení vlevo u levé obruby");
    assert.equal(measured([[0, bus]], 13), "chodnik | bus↑ | pruh↑ | pruh↓ | pruh↓ | chodnik", "BUS u levé obruby po směru");
    assert.equal(measured([[0, { highway: "residential" }]], 7), "chodnik | pruh↑ | pruh↓ | chodnik");
    // Two one-way axes in one roadway: the directions of their geometry (north on the west), shoulders at the kerbs.
    assert.equal(measured([[-5, ow], [5, ow, true]], 20), "chodnik | krajnice | pruh↑ | pruh↑ | pruh↓ | pruh↓ | krajnice | chodnik", "jednosměrné osy podle dat");
    const seg = [{ type: "chodnik", width: 2 }, { type: "pruh", width: 6 }, { type: "chodnik", width: 2 }];
    assert.equal(D.splitTwoWayLane(seg, { highway: "residential" }), 1);
    assert.deepEqual(seg.map((x) => x.dir), [undefined, "forward", "backward", undefined], "rozdělení pruhu z ortofota");
  } finally { country.leftHand = was; }
});

test("osa ulice ve stání u obruby: výchozí (?axisroad=0 vypne) je vozovka vedle, kterou přechází jen chodník, její (Lippard Avenue)", async () => {
  const { P } = await import("../app/public/ortho-osm.js");
  const frame = localFrame(37.73, -122.43);
  const rect = esriRect(frame);
  // Sidewalk, a parking lane under the axis (x 0), the roadway beside it with a footway's crossing over it, sidewalk.
  const polys = mtvuPolygons({ features: [rect(-5, -2, 702), rect(-2, 0.5, 704), rect(0.5, 5.3, 701), rect(5.3, 8, 702)] }, frame);
  const line = (x, tags, id) => ({ type: "way", id, tags, geometry: [frame.toLonLat(x, -100), frame.toLonLat(x, 100)].map(([lon, lat]) => ({ lat, lon })) });
  const els = [line(-0.4, { highway: "residential", oneway: "yes" }, 1), line(3, { highway: "footway" }, 2)];
  const types = () => deriveOn({ polys, elements: els, frame, way: els[0], noParkGuess: true }).segments.map((s) => s.type);
  try {
    P.axisroad = false;
    assert.ok(!types().includes("pruh"));
    P.axisroad = true;
    assert.ok(types().includes("pruh"), types().join());
  } finally { P.axisroad = true; }
});

// Bára 26. 11. 2026: a dragged cut could not leave its OSM way (Kraków, Kościuszki onto the bridge, a way of its own).
test("tažený řez pokračuje na navazující úsek ulice (most), ne na vzdálenou ulici", async () => {
  const { dragAlong, localFrame } = await import("../app/public/derive.js");
  const f = localFrame(50, 20);
  const g = (pts) => pts.map(([x, y]) => { const [lon, lat] = f.toLonLat(x, y); return { lon, lat }; });
  const way = (id, pts, tags = {}) => ({ type: "way", id, tags: { highway: "secondary", ...tags }, geometry: g(pts) });
  const street = way(1, [[0, 0], [100, 0]]), bridge = way(2, [[100, 0], [200, 0]], { bridge: "yes" }), side = way(3, [[100, 0], [100, 100]], { highway: "residential" });
  const far = way(4, [[0, 30], [300, 30]]), path = way(5, [[200, 0], [260, 0]], { highway: "footway" });
  const osm = { elements: [street, bridge, side, far, path] };
  assert.equal(dragAlong(osm, f, street, [150, 5]).way.id, 2, "na most");
  assert.equal(dragAlong(osm, f, street, [50, 5]).way.id, 1, "zůstává na své ulici");
  assert.equal(dragAlong(osm, f, street, [104, 60]).way.id, 3, "v křižovatce ta, ke které je bod nejblíž");
  assert.equal(dragAlong(osm, f, street, [150, 26]).way.id, 2, "nepřeskočí na nespojenou ulici");
  assert.equal(dragAlong(osm, f, street, [250, 1]).way.id, 2, "pěší cesta nepokračuje silnici");
});
