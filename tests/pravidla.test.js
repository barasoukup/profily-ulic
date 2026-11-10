// Rules of 11/2026 (evaluation/pravidla-11-2026/ZPRAVA.md): parked cars estimated by the law, three kinds of
// tram, driving lanes by the class of the street (Prague's TSK).
import { test } from "node:test";
import assert from "node:assert/strict";
import { localFrame, deriveProfile, techLines, classGroup } from "../pilot/public/derive.js";
import { checkRules } from "../pilot/public/rules.js";
import { cleanProfile } from "../pilot/public/validate.js";

// A street running north; the cut runs west–east through y = 0 (t = −x). Houses, sidewalks of 3 m, and
// between them what `middle` lists as [code, width] from west to east.
const frame = localFrame(50.08, 14.42);
const rect = (code, x0, x1) => ({ code, label: "", rings: [[[x0, -60], [x1, -60], [x1, 60], [x0, 60]]], bbox: [x0, -60, x1, 60] });
const ll = (x, y) => { const [lon, lat] = frame.toLonLat(x, y); return { lon, lat }; };
const line = (x) => [ll(x, -60), ll(x, 60)];
function street(middle, tags, { extra = [], lines = [], axis = 0 } = {}) {
  const total = middle.reduce((a, [, w]) => a + w, 0);
  let x = -total / 2;
  const polys = [rect(601, x - 8, x - 3), rect(702, x - 3, x)];
  for (const [code, w] of middle) { polys.push(rect(code, x, x + w)); x += w; }
  polys.push(rect(702, x, x + 3), rect(601, x + 3, x + 8));
  const way = { type: "way", id: 1, tags: { highway: "residential", ...tags }, geometry: line(axis) };
  return deriveProfile({ center: [0, 0], dir: [0, 1], half: 40, polys, osm: { elements: [way, ...extra] }, frame, way, inZps: false, lines });
}
const road = (w, tags, opts) => street([[701, w]], tags, opts);
const guessed = (p) => p.segments.filter((s) => s.type === "parkovani" && s.source === "odhad").length;
const lanes = (p) => p.segments.filter((s) => s.type === "pruh");

test("odhad stání podle zákona: obousměrka od 8 m na jedné straně, od 10 m na obou", () => {
  assert.equal(guessed(road(4.85, {})), 0, "Smetanova v České Třebové, 4,85 m");
  assert.equal(guessed(road(7, {})), 0, "Jiráskova, 7 m");
  assert.equal(guessed(road(7.9, {})), 0);
  assert.equal(guessed(road(8, {})), 1);
  assert.equal(guessed(road(9.9, {})), 1);
  assert.equal(guessed(road(10, {})), 2);
  // The lanes beside keep 3 m each (no shared lane of 2.5 m any more).
  for (const w of [8, 9, 10, 12]) assert.ok(lanes(road(w, {})).every((s) => s.width >= 3 - 1e-9), `${w} m`);
});

test("odhad stání podle zákona: jednosměrka od 5 m na jedné straně, od 7 m na obou", () => {
  assert.equal(guessed(road(4.9, { oneway: "yes" })), 0);
  assert.equal(guessed(road(5, { oneway: "yes" })), 1);
  assert.equal(guessed(road(6.9, { oneway: "yes" })), 1);
  assert.equal(guessed(road(7, { oneway: "yes" })), 2);
  assert.ok(lanes(road(5, { oneway: "yes" })).every((s) => s.width >= 3 - 1e-9));
});

test("odhad stání: chodník u obruby nerozhoduje, zakázané stání a placená zóna platí dál", () => {
  // Green and no sidewalk at the curb.
  const p = street([[400, 4], [701, 10], [400, 4]], {});
  assert.equal(guessed(p), 2);
  assert.equal(guessed(road(10, { "parking:both": "no" })), 0);
  assert.equal(guessed(road(10, { highway: "tertiary" })), 0, "jen místní ulice");
});

test("odhad stání u tramvaje: od kolejnice 3,5 m", () => {
  // Two tracks 3 m apart in the middle: rails 0.72 m beside the axes.
  const tram = (x) => ({ type: "way", id: 10 + x, tags: { railway: "tram" }, geometry: line(x) });
  const withTracks = (w) => road(w, { embedded_rails: "tram" }, { extra: [tram(-1.5), tram(1.5)] });
  assert.equal(guessed(withTracks(14)), 0, "obruba 4,8 m od kolejnice");
  assert.equal(guessed(withTracks(16)), 2, "obruba 5,8 m od kolejnice");
});

test("tři druhy tramvaje: vyhrazený pruh, tramvaj v pruhu, samostatné těleso", () => {
  const tram = (x, tags = {}) => ({ type: "way", id: 20 + x, tags: { railway: "tram", ...tags }, geometry: line(x) });
  const tracks = [tram(-1.5), tram(1.5)];
  const types = (p) => p.segments.map((s) => s.type);
  // Spálená: embedded_rails, lanes:forward=1 + lanes:backward=1 fit beside the tracks.
  const spalena = road(13, { embedded_rails: "tram", "lanes:forward": "1", "lanes:backward": "1", highway: "tertiary" }, { extra: tracks });
  assert.deepEqual(types(spalena).filter((t) => t.startsWith("tramvaj")), ["tramvaj_pruh", "tramvaj_pruh"]);
  assert.equal(types(spalena).filter((t) => t === "pruh").length, 2);
  // OSM counts no lanes: the tram shares the lane with the cars.
  const shared = road(9, { embedded_rails: "tram", highway: "tertiary" }, { extra: tracks });
  assert.ok(types(shared).every((t) => t !== "tramvaj_pruh" && t !== "tramvaj"));
  assert.ok(types(shared).includes("tramvaj_v_pruhu"));
  // MTVU 705 between two roadways: a raised bed, of panels unless OSM says otherwise.
  const bed = street([[701, 6.5], [705, 7], [701, 6.5]], { highway: "tertiary" }, { extra: tracks });
  const beds = bed.segments.filter((s) => s.type === "tramvaj");
  assert.equal(beds.length, 2);
  assert.ok(beds.every((s) => s.bed === "panely" && s.bedGuess));
  // Tracks through a green area: a bed of grass. Buses on the track (psv=yes): a part for trams and buses.
  const grass = street([[701, 6.5], [400, 7], [701, 6.5]], { highway: "tertiary" }, { extra: [tram(-1.5, { psv: "yes" }), tram(1.5)], axis: 6.75 });
  const g = grass.segments.filter((s) => s.type === "tramvaj");
  assert.deepEqual(g.map((s) => s.bed), ["trava", "trava"]);
  assert.equal(g.filter((s) => s.withBus).length, 1);
});

test("druh tramvaje projde kontrolou uloženého profilu", () => {
  const p = cleanProfile({ segments: [{ type: "tramvaj", width: 3.5, bed: "strk", withBus: true }, { type: "tramvaj", width: 3.5, bed: "beton" }, { type: "tramvaj_pruh", width: 3, withBus: "ano" }] });
  assert.equal(p.segments[0].bed, "strk");
  assert.equal(p.segments[0].withBus, true);
  assert.equal(p.segments[1].bed, undefined);
  assert.equal(p.segments[2].withBus, undefined);
});

test("třída TSK: skupina ČSN 73 6110 pro varování o šířce pruhu", () => {
  assert.equal(classGroup({ mk: 1 }), "mk1");
  assert.equal(classGroup({ mk: 0, road: 2 }), "sil2");
  assert.equal(classGroup({ motorway: 1, mk: 1 }), "dalnice");
  assert.equal(classGroup({ mk: 0, road: 0 }), null);
  const lvl = (width, roadClass) => checkRules({ segments: [{ type: "pruh", width, roadClass }] }).map((f) => f.level).join();
  assert.equal(lvl(2.9, "mk1"), "min", "sběrná: pod 3 m");
  assert.equal(lvl(3, "mk2"), "");
  assert.equal(lvl(2.9, "mk3"), "zaklad", "obslužná: 2,75–3 m");
  assert.equal(lvl(2.7, "mk3"), "min");
  assert.equal(lvl(2.6, "mk4"), "zaklad", "zklidněná: 2,5–2,75 m");
  assert.equal(lvl(3.25, "dalnice"), "zaklad", "dálnice: 3,5 m");
  assert.equal(lvl(2.9, undefined), "zaklad", "bez třídy jako dřív");
  assert.equal(lvl(2.4, undefined), "min");
  // A lane added in the design takes the class of the street's other lanes.
  const added = checkRules({ segments: [{ type: "pruh", width: 3.2, roadClass: "mk1" }, { type: "pruh", width: 2.9 }] });
  assert.deepEqual(added.map((f) => `${f.i}:${f.level}`), ["1:min"]);
});

test("strop pruhu v MK I je 3,75 m, zbytek je krajnice", () => {
  const section = techLines({ features: [{ attributes: { CTMTP_KOD: "od_usek", MK: 1, SIL: 0, DALNICE: 0, TYP: 3 }, geometry: { paths: [[[ll(0.5, -50).lon, ll(0.5, -50).lat], [ll(0.5, 50).lon, ll(0.5, 50).lat]]] } }] }, frame);
  const p = road(10.5, { highway: "secondary" }, { lines: section });
  assert.deepEqual(lanes(p).map((s) => s.width), [3.75, 3.75]);
  assert.ok(lanes(p).every((s) => s.roadClass === "mk1"));
  assert.equal(p.segments.filter((s) => s.type === "krajnice").length, 2);
  assert.deepEqual(lanes(road(10.5, { highway: "secondary" })).map((s) => s.width), [4, 4]);
});
