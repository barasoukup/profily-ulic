import { test } from "node:test";
import assert from "node:assert/strict";
import { localFrame, deriveProfile, techLines, REACH, reachOf } from "../pilot/public/derive.js";
import { decodePrahaTile, PRAHA_TILE } from "../pilot/public/sources.js";

// A street running north: roadway 8 m (x −4…4), sidewalks 3 m, houses. The cut runs west–east through y = 0,
// t = −x (normal [−1, 0]).
const frame = localFrame(50.08, 14.42);
const rect = (code, x0, x1) => ({ code, label: "", rings: [[[x0, -60], [x1, -60], [x1, 60], [x0, 60]]], bbox: [x0, -60, x1, 60] });
const polys = [rect(601, -12, -7), rect(702, -7, -4), rect(701, -4, 4), rect(702, 4, 7), rect(601, 7, 12)];
const ll = (x, y) => { const [lon, lat] = frame.toLonLat(x, y); return { lon, lat }; };
const way = { type: "way", id: 1, tags: { highway: "residential", lanes: "2" }, geometry: [ll(0, -60), ll(0, 60)] };
const node = (id, x, y, tags) => ({ type: "node", id, tags, geometry: [ll(x, y)] });
const profile = (extra = {}) => deriveProfile({ center: [0, 0], dir: [0, 1], half: 40, polys, osm: { elements: [way, ...(extra.nodes || [])] }, frame, way, inZps: true, ...extra });
const items = (p) => p.segments.flatMap((s) => (s.items || []).map((it) => it.kind));

test("dosah bodů je nastavení podle druhu", () => {
  assert.equal(reachOf("lampa"), REACH.lampa);
  assert.equal(reachOf("sloup_trakce"), REACH.sloup);
  assert.equal(reachOf("oznacnik"), REACH.zastavka);
  assert.equal(reachOf("kvetinac"), REACH.sloupek);
  assert.equal(reachOf("stojan_kola"), REACH.jine);
  assert.equal(reachOf("lampa", { ...REACH, lampa: 5 }), 5);
});

test("lampa 15 m od řezu se kreslí při dosahu 20 m, ne při 10 m", () => {
  const nodes = [node(2, 5.5, 15, { highway: "street_lamp" })];
  assert.deepEqual(items(profile({ nodes, itemReach: { lampa: 20 } })), ["lampa"]);
  assert.deepEqual(items(profile({ nodes, itemReach: { lampa: 10 } })), []);
});

test("z řady lamp zůstane jedna, nejbližší řezu, a drží místo napříč ulicí", () => {
  const nodes = [node(2, 5.5, -18, { highway: "street_lamp" }), node(3, 5.6, 12, { highway: "street_lamp" }), node(4, -5, 3, { highway: "street_lamp" })];
  const p = profile({ nodes, itemReach: { lampa: 20 } });
  assert.deepEqual(items(p), ["lampa", "lampa"]); // one each side
  const right = p.segments.findIndex((s) => s.items?.length && s.type === "chodnik");
  assert.ok(right >= 0);
});

test("body technické mapy: sloup trakce, označník, sloupek; lampa OSM na sloupu je lampa sloupu", () => {
  const [lon, lat] = frame.toLonLat(-5.5, 2);
  const [lon2, lat2] = frame.toLonLat(5.5, -1);
  const json = { features: [
    { attributes: { CTMTP_KOD: 26015 }, geometry: { x: lon, y: lat } },
    { attributes: { CTMTP_KOD: 75240 }, geometry: { x: lon2, y: lat2 } },
    { attributes: { CTMTP_KOD: 55010 }, geometry: { paths: [[[lon, lat - 0.001], [lon, lat + 0.001]]] } },
  ] };
  const lines = techLines(json, frame);
  assert.deepEqual(lines.map((l) => l.code), [26015, 75240]);
  assert.ok(lines.every((l) => l.point));
  const p = profile({ lines, nodes: [node(2, -5.4, 2.5, { highway: "street_lamp" })] });
  const all = p.segments.flatMap((s) => s.items || []);
  assert.deepEqual(all.map((it) => it.kind).sort(), ["oznacnik", "sloup_trakce"]);
  assert.equal(all.find((it) => it.kind === "sloup_trakce").lamp, true);
});

test("stromy z otevřených dat a technické mapy dělají stromořadí s vlastním zdrojem", () => {
  const [lon, lat] = frame.toLonLat(5.5, 4);
  const lines = techLines({ features: [{ attributes: { CTMTP_KOD: "od_strom" }, geometry: { x: lon, y: lat } }] }, frame);
  const p = profile({ lines });
  const tree = p.segments.find((s) => s.type === "stromorad");
  assert.ok(tree);
  assert.equal(tree.source, "data");
});

test("zákaz stání vyjme kus úseku TSK: u obruby pak stání není", () => {
  const sq = (x0, x1, y0, y1, kind) => ({ rings: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1]]], bbox: [x0, y0, x1, y1], kind, count: 0 });
  const section = sq(2, 4, -30, 30, "useky");
  const withSection = profile({ parking: [section] });
  assert.ok(withSection.segments.some((s) => s.type === "parkovani"));
  const gap = profile({ parking: [section, sq(2, 4.3, -3, 3, "zakaz")] });
  assert.ok(!gap.segments.some((s) => s.type === "parkovani"));
});

test("zatřídění TSK: v ulici MK II se stání neodhaduje, v MK III rozhoduje OSM", () => {
  const cls = (mk) => techLines({ features: [{ attributes: { CTMTP_KOD: "od_usek", MK: mk, SIL: 0, DALNICE: 0, TYP: 3 }, geometry: { paths: [[[ll(0.5, -50).lon, ll(0.5, -50).lat], [ll(0.5, 50).lon, ll(0.5, 50).lat]]] } }] }, frame);
  const local = { ...way, tags: { highway: "residential" } };
  const guessed = (lines) => deriveProfile({ center: [0, 0], dir: [0, 1], half: 40, polys, osm: { elements: [local] }, frame, way: local, inZps: false, lines })
    .segments.filter((s) => s.type === "parkovani" && s.source === "odhad").length;
  assert.ok(guessed([]) > 0, "residential bez zatřídění: odhad");
  assert.equal(guessed(cls(2)), 0);
  assert.ok(guessed(cls(3)) > 0);
});

test("dlaždice otevřených dat Prahy: souřadnice od jihozápadního rohu v milióntinách stupně", () => {
  const ix = 1442, iy = 5008;
  const d = decodePrahaTile({ t: [100, 200, 300, 400], r: [[7, 0, 0, 10, 10]], z: [[3, 1, 1, 2, 1, 2, 2]], u: [[9, 3, 0, 0, 44, 5, 5, 6, 6]] }, ix, iy);
  assert.equal(d.trees.length, 2);
  assert.ok(Math.abs(d.trees[0][0] - (ix * PRAHA_TILE + 0.0001)) < 1e-9);
  assert.ok(Math.abs(d.trees[0][1] - (iy * PRAHA_TILE + 0.0002)) < 1e-9);
  assert.equal(d.rows[0].id, 7);
  assert.equal(d.rows[0].pts.length, 2);
  assert.equal(d.noParking[0].ring.length, 3);
  assert.deepEqual([d.sections[0].mk, d.sections[0].road, d.sections[0].kind, d.sections[0].pts.length], [3, 0, 44, 2]);
});
