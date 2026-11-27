// A street on a bridge ends at its deck's edge, with a railing there (Bára 26. 11. 2026; evaluation/bridge-water/edge).
import { test } from "node:test";
import assert from "node:assert/strict";
import { localFrame } from "../pilot/public/derive.js";
import { deckSpans, deckAt, offDecks, bridgeRailings, trimToEnds, P } from "../pilot/public/ortho-osm.js";
import { toStreetmix } from "../pilot/public/streetmix.js";
import { tilePieces } from "../tools/osm_areas.mjs";
import { decodeTile, mergePieces } from "../pilot/public/osmtile.js";

const LAT = 50.08, LON = 14.43, frame = localFrame(LAT, LON), dir = [0, 1]; // north; t across it = −x (west is +t)
const mx = 1 / (111320 * Math.cos((LAT * Math.PI) / 180)), my = 1 / 110574;
const pt = (x, y) => ({ lat: LAT + y * my, lon: LON + x * mx });
const box = (x0, x1, y0 = -40, y1 = 40) => [pt(x0, y0), pt(x1, y0), pt(x1, y1), pt(x0, y1), pt(x0, y0)];
const way = { type: "way", id: 1, tags: { highway: "primary", bridge: "yes", layer: "1", name: "Most" }, geometry: [pt(0, -50), pt(0, 50)] };
const deck = (id, x0, x1, tags = {}) => ({ type: "area", id, tags: { man_made: "bridge", ...tags }, geometry: box(x0, x1) });

test("mostovka: úsek řezu na mostovce, jen u ulice na mostě a jen když mostovka drží osu", () => {
  const d = deckSpans([way, deck(10, -8, 9)], frame, dir, way);
  assert.equal(d.spans.length, 1);
  assert.ok(Math.abs(d.spans[0].s + 9) < 0.05 && Math.abs(d.spans[0].e - 8) < 0.05, JSON.stringify(d.spans));
  // Not on a bridge, a deck of another layer, a deck beside the axis: nothing.
  assert.equal(deckSpans([deck(10, -8, 9)], frame, dir, { ...way, tags: { highway: "primary" } }), null);
  assert.equal(deckSpans([way, deck(10, -8, 9, { layer: "2" })], frame, dir, way), null);
  assert.equal(deckSpans([way, deck(10, 3, 9)], frame, dir, way), null);
  // ?off=mostdeska: as before.
  P.off = new Set(["mostdeska"]);
  assert.equal(deckSpans([way, deck(10, -8, 9)], frame, dir, way), null);
  P.off = undefined;
});

test("mostovka rozřezaná dlaždicemi se zase spojí, dvě mostovky zůstanou zvlášť", () => {
  // A deck across a tile border (TILE 0.005°): its pieces (tools/osm_areas.mjs) join on the cut again.
  const lonB = Math.round(LON / 0.005) * 0.005 + 0.005, xb = (lonB - LON) / mx;
  const ring = box(xb - 6, xb + 6).map((p) => [p.lon, p.lat]);
  const lines = tilePieces([ring], 7, { man_made: "bridge" }).map(([, el]) => JSON.stringify(el)).join("\n");
  const els = mergePieces([decodeTile(lines)]);
  assert.ok(els.length >= 2); // the deck lies over a corner of four tiles
  const w = { ...way, geometry: [pt(xb, -50), pt(xb, 50)] };
  const d = deckSpans([w, ...els], localFrame(LAT, lonB), dir, w);
  assert.equal(d.spans.length, 1);
  assert.ok(d.spans[0].e - d.spans[0].s > 11.9);
  const two = deckSpans([way, deck(10, -8, 9), deck(11, -30, -15)], frame, dir, way);
  assert.equal(two.spans.length, 2);
  assert.equal(deckAt(two, 20)?.e, two.spans[1].e);
});

test("zábradlí na okraji mostu: u konce na hraně mostovky, ne u budovy ani mimo most", () => {
  const prof = () => ({ extent: [-8, 9], edges: { left: "volno", right: "volno" }, segments: [{ type: "chodnik", width: 3 }, { type: "pruh", width: 11 }, { type: "chodnik", width: 3 }] });
  const decks = { spans: [{ s: -8.3, e: 9.2 }], axis: 0 };
  const p = prof();
  assert.deepEqual(bridgeRailings(p, way, decks, null), ["B", "A"]);
  assert.deepEqual(p.segments[0].items, [{ kind: "zabradli", f: 0, bridge: true }]);
  assert.deepEqual(p.segments[2].items, [{ kind: "zabradli", f: 1, bridge: true }]);
  // Again: no second railing.
  assert.deepEqual(bridgeRailings(p, way, decks, null), []);
  // A building at the left, the deck far beyond the right end: none there.
  const q = { ...prof(), edges: { left: "budova", right: "volno" } };
  assert.deepEqual(bridgeRailings(q, way, { spans: [{ s: -20, e: 9.2 }], axis: 0 }, null), []);
  // No deck mapped: at an end in open space after a sidewalk (derive.js ends a bridge so).
  assert.deepEqual(bridgeRailings(prof(), way, null, null), ["B", "A"]);
  // Not on a bridge; ?off=zabradli.
  assert.deepEqual(bridgeRailings(prof(), { ...way, tags: { highway: "primary" } }, null, null), []);
  P.off = new Set(["zabradli"]);
  assert.deepEqual(bridgeRailings(prof(), way, decks, null), []);
  P.off = undefined;
});

test("měkký konec odhadu nepřesáhne hranu mostovky", () => {
  const r = { extent: [-12, 12], edges: { left: "volno", right: "volno" }, segments: [{ type: "chodnik", width: 6 }, { type: "pruh", width: 12 }, { type: "chodnik", width: 6 }] };
  const out = trimToEnds(r, { A: -8, B: 8, soft: { A: true, B: true }, cap: { B: 9 } });
  assert.deepEqual(out.extent, [-12, 9]);
  assert.equal(out.segments[0].width, 3);
});

test("zábradlí na okraji jde do Streetmixu jako plot", () => {
  const { data } = toStreetmix({ segments: [{ type: "chodnik", width: 3, items: [{ kind: "zabradli", f: 0 }] }, { type: "pruh", width: 3 }], edges: { left: "volno", right: "volno" } }, "Most");
  assert.equal(data.street.boundary.left.variant, "fence");
  assert.equal(data.street.boundary.right.variant, "parking-lot");
});

test("voda a zeleň pod mostem: pryč jen to, co leží pod mostovkou, mezera mezi mostovkami a okolí zůstanou", () => {
  const two = { spans: [{ s: -20, e: -5 }, { s: 3, e: 15 }], axis: 0 };
  assert.deepEqual(offDecks(-60, 60, two), [[-60, -20], [-5, 3], [15, 60]]);
  assert.deepEqual(offDecks(-18, -10, two), []);
});
