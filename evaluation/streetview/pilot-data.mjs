// The Prague pilot of judging profiles by street-level photos (Bára 17. 11. 2026): 30 cuts of the regression set
// (evaluation/ortofoto-osm, every third Prague cut), each with two profiles: the truth (the app's profile from IPR MTVU,
// ab-city-stejne) and the estimate from the orthophoto and OSM (as regrese.mjs makes it). From each, the features a
// photo can show: lanes, parking per side, cycle facilities, tram, sidewalk per side, trees, median.
//   node evaluation/streetview/pilot-data.mjs > evaluation/streetview/pilot.json
import { cuts, osmAround, stripOf } from "../ortofoto-osm/lib.mjs";
import { orthoOsmPolys } from "../../pilot/public/ortho-osm.js";
import { localFrame, deriveProfile } from "../../pilot/public/derive.js";

const LANE = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "obsluzna"]);
const ROAD = new Set([...LANE, "tramvaj_pruh", "krajnice", "parkovani", "cyklopruh", "ochranny_pruh"]);
const CYCLE = new Set(["cyklopruh", "ochranny_pruh", "cyklostezka", "chodnik_kola", "stezka_sdilena", "bus_cyklo", "pruh_piktokoridor"]);
const WALK = new Set(["chodnik", "chodnik_kola", "stezka_sdilena", "nastupiste"]);
export function features(segments) {
  const types = segments.map((s) => (Array.isArray(s) ? s[0] : s.type));
  const road = types.map((t, i) => (ROAD.has(t) ? i : -1)).filter((i) => i >= 0);
  const lo = road.length ? road[0] : types.length >> 1, hi = road.length ? road.at(-1) : types.length >> 1;
  const side = (from, to, set) => types.slice(from, to).some((t) => set.has(t));
  return {
    lanes: types.filter((t) => LANE.has(t)).length,
    parkingLeft: types.slice(lo, lo + 2).includes("parkovani") || side(0, lo, new Set(["parkovani"])),
    parkingRight: types.slice(Math.max(0, hi - 1), hi + 1).includes("parkovani") || side(hi + 1, types.length, new Set(["parkovani"])),
    cycle: types.some((t) => CYCLE.has(t)),
    tram: types.some((t) => /^tramvaj/.test(t)),
    sidewalkLeft: side(0, lo, WALK),
    sidewalkRight: side(hi + 1, types.length, WALK),
    trees: types.includes("stromorad"),
    // As the judge's brief says: a strip between the two directions, a tram bed in the middle included (between lanes).
    median: types.slice(lo + 1, hi).some((t, k, arr) => ["delici", "zelen", "stromorad", "nastupiste"].includes(t) || (/^tramvaj/.test(t) && types.slice(lo, lo + 1 + k).some((x) => LANE.has(x)) && types.slice(lo + 2 + k, hi + 1).some((x) => LANE.has(x)))),
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const out = [];
  const list = await cuts("praha"); // all 87 (Mapillary has photos of about half: the main streets)
  for (const c of list) {
    const row = { id: `p${c.n}`, lat: c.cut.lat, lon: c.cut.lon, bearing: c.cut.bearing, name: c.cut.name || "",
      truth: c.a.segments.map((s) => [s.type, +s.width.toFixed(2)]) };
    const st = await stripOf("praha", "ipr10", c);
    const osm = { elements: await osmAround(c.cut.lat, c.cut.lon, 70) };
    const frame = localFrame(c.cut.lat, c.cut.lon), b = (c.cut.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)];
    const way = osm.elements.find((e) => e.type === "way" && e.id === c.cut.wayId);
    const polys = st && way ? orthoOsmPolys({ osm, frame, dir, way, st }) : null;
    const p = polys ? deriveProfile({ center: [0, 0], dir, half: 40, polys, osm, frame, way, reach: { left: 40, right: 40 } }) : null;
    row.estimate = p?.segments?.length ? p.segments.map((s) => [s.type, +s.width.toFixed(2)]) : null;
    row.fTruth = features(row.truth);
    row.fEstimate = row.estimate ? features(row.estimate) : null;
    out.push(row);
  }
  console.log(JSON.stringify(out, null, 1));
}
