// Fixes from the check of 1000 Slovak cuts (evaluation/slovensko/kontrola/ZPRAVA.md, Bára 16. 11. 2026).
import { test } from "node:test";
import assert from "node:assert/strict";
import { splitTwoWayLane, capWideLanes } from "../pilot/public/derive.js";

const seg = (type, width, extra = {}) => ({ type, width, source: "ortofoto", ...extra });

test("obousměrka s jedním pruhem od 5 m má dva pruhy, jednosměrka a lanes=1 ne", () => {
  const s = [seg("chodnik", 2), seg("pruh", 6), seg("chodnik", 2)];
  assert.equal(splitTwoWayLane(s, { highway: "residential" }), 1);
  assert.deepEqual(s.map((x) => [x.type, x.width, x.dir]), [["chodnik", 2, undefined], ["pruh", 3, "backward"], ["pruh", 3, "forward"], ["chodnik", 2, undefined]]);
  assert.equal(splitTwoWayLane([seg("pruh", 4.9)], { highway: "residential" }), 0);
  assert.equal(splitTwoWayLane([seg("pruh", 6)], { highway: "residential", oneway: "yes" }), 0);
  assert.equal(splitTwoWayLane([seg("pruh", 6)], { highway: "residential", lanes: "1" }), 0);
  assert.equal(splitTwoWayLane([seg("pruh", 6)], { highway: "living_street" }), 0);
});

test("pruh širší než strop o metr a víc: zbytek krajnice, k té, co už u pruhu je", () => {
  const s = [seg("chodnik", 2), seg("pruh", 6.1, { dir: "forward" }), seg("chodnik", 2)];
  assert.equal(capWideLanes(s, { highway: "residential", oneway: "yes" }), 1);
  assert.equal(s.filter((x) => x.type === "pruh")[0].width, 4.5);
  assert.equal(s.filter((x) => x.type === "krajnice").reduce((a, x) => a + x.width, 0).toFixed(2), "1.60");
  const k = [seg("zelen", 2), seg("pruh", 6.3), seg("krajnice", 1.87), seg("pruh", 2.98)];
  capWideLanes(k, { highway: "residential" });
  assert.deepEqual(k.map((x) => [x.type, x.width]), [["zelen", 2], ["pruh", 4.5], ["krajnice", 3.67], ["pruh", 2.98]]);
  const z = [seg("pruh", 6.3)];
  assert.equal(capWideLanes(z, { highway: "living_street" }), 0);
  const mid = [seg("pruh", 3), seg("pruh", 6), seg("pruh", 3)];
  assert.equal(capWideLanes(mid, { highway: "primary" }), 0);
});

test("obousměrka s OSM lanes=2: pruh a krajnice od 1,5 m jsou dva pruhy, užší krajnice zůstane", () => {
  const s = [seg("chodnik", 2), seg("pruh", 4.03), seg("krajnice", 2.17), seg("chodnik", 2)];
  assert.equal(splitTwoWayLane(s, { highway: "residential", lanes: "2" }), 1);
  assert.deepEqual(s.map((x) => [x.type, x.width]), [["chodnik", 2], ["pruh", 3.1], ["pruh", 3.1], ["chodnik", 2]]);
  const t = [seg("krajnice", 1.2), seg("pruh", 3.9), seg("chodnik", 2)];
  assert.equal(splitTwoWayLane(t, { highway: "residential", lanes: "2" }), 0);
  const u = [seg("pruh", 4.03), seg("krajnice", 2.17)];
  assert.equal(splitTwoWayLane(u, { highway: "residential" }), 0);
});

test("obousměrka s krajnicí od 1,5 m po obou stranách: k pruhům jen užší", () => {
  const s = [seg("krajnice", 2.27), seg("pruh", 3.9), seg("krajnice", 3.43)];
  assert.equal(splitTwoWayLane(s, { highway: "secondary", lanes: "2" }), 1);
  assert.deepEqual(s.map((x) => [x.type, x.width]), [["pruh", 3.09], ["pruh", 3.08], ["krajnice", 3.43]]);
});

test("cyklostezka z OSM přes odhadnutý díl: vyřízne se pás její šířky, ne z pruhu ani poblíž jiného dílu pro kola", async () => {
  const { carveCycleways } = await import("../pilot/public/derive.js");
  const s = [seg("zelen", 3.95), seg("chodnik", 6), seg("krajnice", 4.15), seg("plocha", 3.5)];
  assert.equal(carveCycleways(s, [{ at: 12.7, tags: { highway: "cycleway" } }]), 1);
  assert.deepEqual(s.map((x) => [x.type, x.width]), [["zelen", 3.95], ["chodnik", 6], ["krajnice", 1.5], ["cyklostezka", 2.65], ["plocha", 3.5]]);
  const lane = [seg("pruh", 4.5), seg("chodnik", 2)];
  assert.equal(carveCycleways(lane, [{ at: 2, tags: { highway: "cycleway" } }]), 0);
  const near = [seg("cyklostezka", 2), seg("plocha", 3)];
  assert.equal(carveCycleways(near, [{ at: 2.5, tags: { highway: "cycleway" } }]), 0);
});

test("vozovka jen z krajnic dostane pruh; koleje z OSM v odhadnutém dílu jsou tramvajový pás", async () => {
  const { lanesFromShoulders, carveTramTracks } = await import("../pilot/public/derive.js");
  const s = [seg("chodnik", 2.6), seg("krajnice", 1.67), seg("krajnice", 2.43), seg("chodnik", 2.65)];
  assert.equal(lanesFromShoulders(s, { highway: "residential" }), 1);
  assert.deepEqual(s.map((x) => [x.type, x.width]), [["chodnik", 2.6], ["pruh", 4.1], ["chodnik", 2.65]]);
  const w = [seg("krajnice", 3), seg("krajnice", 3)];
  lanesFromShoulders(w, { highway: "residential" });
  assert.deepEqual(w.map((x) => [x.type, x.width, x.dir]), [["pruh", 3, "backward"], ["pruh", 3, "forward"]]);
  assert.equal(lanesFromShoulders([seg("pruh", 3), seg("krajnice", 2)], {}), 0);
  const t = [seg("pruh", 3), seg("delici", 3.5, { source: "odhad" }), seg("pruh", 4)];
  assert.equal(carveTramTracks(t, [{ at: 4.7, tags: { railway: "tram" } }]), 1);
  assert.deepEqual(t.map((x) => [x.type, x.width]), [["pruh", 3], ["tramvaj", 3.5], ["pruh", 4]]);
  const twice = [seg("nezname", 3.5, { source: "odhad" })];
  carveTramTracks(twice, [{ at: 1.8, tags: { railway: "tram" } }, { at: 1.91, tags: { railway: "tram" } }]);
  assert.deepEqual(twice.map((x) => [x.type, x.width]), [["tramvaj", 3.5]]);
});
