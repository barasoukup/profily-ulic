// The junction rule and the OSM axis fixes, one for every city (Bára 25. 11. 2026, evaluation/sjednoceni/praha): service
// ways and alleys join like streets, a paved divider between two
// roadways under a single axis stays the median, and the counted lanes (the USA pilot). No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { localFrame, snapToWay, awayFromJunctions, deriveProfile, mtvuPolygons, splitTwoWayLane } from "../pilot/public/derive.js";
import { P } from "../pilot/public/ortho-osm.js";

const LAT = 50.08, LON = 14.42;
const frame = localFrame(LAT, LON);
const ll = (x, y) => { const [lon, lat] = frame.toLonLat(x, y); return { lat, lon }; };
const line = (id, tags, xy) => ({ type: "way", id, tags, geometry: xy.map(([x, y]) => ll(x, y)) });
const nearOf = (way) => { const pts = way.geometry.map((g) => frame.toXY(g.lon, g.lat)); return { ...snapToWay(pts, [pts[0][0], 0]), way, pts }; };
const off = (k, f) => { P.off = new Set([k]); try { return f(); } finally { P.off = new Set(); } };

test("obslužná cesta je křižovatka (ne vjezd), ?off=obsluzne vypne", () => {
  const way = line(1, { highway: "residential", name: "A" }, [[0, -100], [0, 0], [0, 100]]);
  const svc = line(2, { highway: "service" }, [[0, 0], [60, 0]]);
  const drive = line(3, { highway: "service", service: "driveway" }, [[0, 0], [60, 0]]);
  const near = nearOf(way);
  assert.ok(Math.abs(awayFromJunctions({ elements: [way, svc] }, frame, near).point[1]) >= 15 - 1e-6);
  assert.ok(Math.abs(awayFromJunctions({ elements: [way, drive] }, frame, near).point[1]) < 0.01);
  assert.ok(Math.abs(off("obsluzne", () => awayFromJunctions({ elements: [way, svc] }, frame, near)).point[1]) < 0.01);
});

test("ústí uličky je křižovatka (OSM service=alley i plocha uličky)", () => {
  const way = line(1, { highway: "residential", name: "A" }, [[0, -100], [0, 100]]);
  const near = nearOf(way);
  // An alley's area 4 m wide from the kerb (x 5 m) eastwards at the cut.
  const alley = { type: "area", id: -1, tags: { service: "alley" }, geometry: [[5, -2], [40, -2], [40, 2], [5, 2], [5, -2]].map(([x, y]) => ll(x, y)) };
  assert.ok(Math.abs(awayFromJunctions({ elements: [way, alley] }, frame, near).point[1]) >= 6 + 2 - 0.5);
  assert.ok(Math.abs(off("ulicky", () => awayFromJunctions({ elements: [way, alley] }, frame, near)).point[1]) < 0.01);
  // An alley way joins even with the service ways off.
  const way2 = line(1, { highway: "residential", name: "A" }, [[0, -100], [0, 0], [0, 100]]);
  const aw = line(2, { highway: "service", service: "alley" }, [[0, 0], [60, 0]]);
  assert.ok(Math.abs(off("obsluzne", () => awayFromJunctions({ elements: [way2, aw] }, frame, nearOf(way2))).point[1]) >= 15 - 1e-6);
});

test("obslužná cesta neodsune řez na křižovatku protější vozovky (Poděbradská č. 20)", () => {
  const west = line(1, { highway: "primary", name: "B", oneway: "yes" }, [[-6, -100], [-6, -8], [-6, 100]]);
  const east = line(2, { highway: "primary", name: "B", oneway: "yes" }, [[6, 100], [6, 12], [6, -100]]);
  const svc = line(3, { highway: "service" }, [[-6, -8], [-60, -8]]), car = line(4, { highway: "service" }, [[6, 12], [60, 12]]);
  const near = nearOf(west), y = (els) => awayFromJunctions({ elements: els }, frame, near).point[1];
  assert.ok(Math.abs(y([west, east, svc, car])) < 0.01, "zůstane");
  assert.ok(off("protejsi", () => y([west, east, svc, car])) >= 7 - 1e-6);
  assert.ok(y([west, east, svc]) >= 7 - 1e-6, "bez křižovatky naproti se odsune");
  // A street joining pushes the cut as before.
  const street = line(3, { highway: "residential", name: "C" }, [[-6, -8], [-60, -8]]);
  assert.ok(Math.abs(y([west, east, street, car]) + 8) >= 15 - 1e-6);
});

// A single OSM axis on a paved divider of 1.5 m between two roadways (Generála Šišky, Prague č. 42).
function divided() {
  const rect = (x0, x1, code) => ({ attributes: { CTVUK_KOD: code }, geometry: { rings: [[[x0, -60], [x1, -60], [x1, 60], [x0, 60], [x0, -60]].map(([x, y]) => frame.toLonLat(x, y))] } });
  const polys = mtvuPolygons({ features: [rect(-11, -8, 702), rect(-8, -0.5, 701), rect(-0.5, 1, 1003), rect(1, 8.5, 701), rect(8.5, 11.5, 702)] }, frame);
  const way = line(1, { highway: "tertiary", name: "D", lanes: "4" }, [[0, -100], [0, 100]]);
  return deriveProfile({ center: [0, 0], dir: [0, 1], half: 40, polys, osm: { elements: [way] }, frame, way, noParkGuess: true }).segments;
}

test("zpevněný dělicí pás mezi dvěma vozovkami pod osou zůstane pásem", () => {
  const segs = divided();
  const roads = segs.filter((s) => s.type === "pruh").map((s) => s.width);
  assert.ok(!segs.some((s) => s.type === "pruh" && s.width < 2.5), segs.map((s) => `${s.type} ${s.width}`).join(" | "));
  assert.ok(Math.abs(roads.reduce((a, b) => a + b, 0) - 15) < 0.1, "vozovky 7,5 + 7,5 m bez pásu");
  // Without the test (?off=osaroad): the old rule makes the divider a roadway.
  const old = off("osaroad", divided).filter((s) => s.type === "pruh").reduce((a, s) => a + s.width, 0);
  assert.ok(old > 16, `stará pravidla ${old}`);
});

test("spočítané pruhy: obousměrka se stáním se dělí od 4 m, bez počtu od 5 m", () => {
  const segs = () => [{ type: "chodnik", width: 2 }, { type: "parkovani", width: 2.4 }, { type: "pruh", width: 4.3 }, { type: "chodnik", width: 2 }];
  const a = segs(); splitTwoWayLane(a, { highway: "residential", lanes: "2" });
  assert.equal(a.filter((s) => s.type === "pruh").length, 2);
  const b = segs(); splitTwoWayLane(b, { highway: "residential" });
  assert.equal(b.filter((s) => s.type === "pruh").length, 1);
  const d = segs().filter((s) => s.type !== "parkovani"); splitTwoWayLane(d, { highway: "residential", lanes: "2" });
  assert.equal(d.filter((s) => s.type === "pruh").length, 1, "bez stání zůstane jeden pruh");
  const c = segs(); off("pocetpruhu", () => splitTwoWayLane(c, { highway: "residential", lanes: "2" }));
  assert.equal(c.filter((s) => s.type === "pruh").length, 1);
});
