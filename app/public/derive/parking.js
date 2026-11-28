// Parking parts: orientation by depth, merging, perpendicular depth, cars on the kerb, kerb islands.
import { country } from "../city.js";
import { t, num } from "../i18n.js";
import { ROADWAY, WALK } from "./part-types.js";

export const ORIENT = { parallel: "podelne", diagonal: "sikme", perpendicular: "kolme" };

// Without a tag, the depth of the parking strip tells the orientation (a car is ~2 m wide, ~4.5 m long).
export const orientFromDepth = (w) => (w < 3.2 ? "podelne" : w < PERP_MIN ? "sikme" : "kolme");
// ČSN 73 6056: perpendicular stalls are 5.0 m deep, 4.5 m where cars overhang the kerb.
export const PERP_MIN = 4.5;

// TSK parking sections carry the number of stalls (PS_ZPS): the section length along the
// street per stall tells the orientation (parallel ~5.5–6.5 m, angled ~3.5 m, perpendicular
// ~2.5 m, more with driveways and trees in between). The depth across the street settles
// borderline cases: a perpendicular stall needs ~5 m, a parallel one ~2–2.5 m.
export function orientFromStalls(poly, dir) {
  const ring = poly.rings[0];
  const along = ring.map(([x, y]) => x * dir[0] + y * dir[1]);
  const length = Math.max(...along) - Math.min(...along);
  // Mean depth = area / length, robust on curved streets.
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  const depth = Math.abs(area) / 2 / (length || 1);
  if (depth >= 4.9) return "kolme";
  if (depth < 3) return "podelne";
  if (poly.count < 2) return depth >= 4 ? "sikme" : undefined;
  const perStall = length / poly.count;
  // A section 4 m deep or more cannot be parallel parking (driveways between stalls inflate the length per stall).
  if (depth >= 4) return perStall >= 3.4 ? "sikme" : "kolme";
  return perStall >= 4.8 ? "podelne" : perStall >= 3.4 ? "sikme" : "kolme";
}

const ISLAND_MAX = 6; // widest paved strip between carriageways still taken as an island (m)

// keep: the kerbs of the law's parking strips left out of this profile (deriveProfile lawAt): the sidewalk behind such a
// kerb is one as it was with the strip (Calle de Yolanda de Bar and Avenida Sáinz de Varanda in Zaragoza, 25. 11. 2026).
export function markIslands(segs, keep = []) {
  segs.forEach((x, i) => {
    if (!WALK.has(x.type) || x.e - x.s > ISLAND_MAX) return;
    if (keep.some(({ t, sg }) => Math.abs((sg < 0 ? x.s : x.e) - t) < 0.3)) return;
    // Between two carriageways: a parking strip (e.g. a small car park beyond the sidewalk) does not count.
    const lane = (y) => ROADWAY.has(y?.type) && y.type !== "parkovani";
    if (lane(segs[i - 1]) && lane(segs[i + 1])) x.type = "delici";
  });
  return segs;
}

// Parking on the sidewalk (on_kerb / half_on_kerb in OSM; Bára 10. 11. 2026). The technical map draws a sidewalk
// there, as it does not know that cars stand on it, so the car's strip is taken out of the sidewalk at the kerb:
// on_kerb the whole car (2 m parallel, 4.5 m oblique, 5 m perpendicular), raised; half_on_kerb half of it, the
// other half being the roadway strip splitRoadway left at the curb; both halves make one part across the kerb.
// The sidewalk keeps KERB_REST at least: on a narrower one the car's strip is narrowed (the data say cars stand
// there), down to KERB_CAR_MIN (on_kerb) or KERB_HALF_MIN (the sidewalk half); below that nothing is carved and the
// profile's notice says so. A part beside the kerb that is no sidewalk (green, a paved area) takes the car alike.
const KERB_REST = 0.5, KERB_CAR_MIN = 1, KERB_HALF_MIN = 0.3;
const KERB_HOST = new Set([...WALK, "zelen", "nezname"]);
const fmtM = (v) => `${num(v)} m`;
export function carveKerbParking(segs, reqs, notes = []) {
  let out = segs;
  const say = (text) => { if (!notes.includes(text)) notes.push(text); };
  for (const q of reqs) {
    const L = q.side === "L"; // L: the sidewalk lies at larger offsets, beyond q.at
    const gap = (x) => (L ? x.s - q.at : q.at - x.e);
    if (q.bay) {
      const bay = out.find((x) => x.type === "parkovani" && Math.abs(gap(x)) < 0.1);
      if (bay && !bay.position) bay.position = q.pos;
      continue;
    }
    const hi = out.findIndex((x) => KERB_HOST.has(x.type) && gap(x) > -0.1 && gap(x) < 0.6);
    const host = out[hi];
    const half = q.pos === "half_on_kerb";
    const pi = half ? out.findIndex((x) => x.position === "half_on_kerb" && Math.abs((L ? x.e : x.s) - q.at) < 0.1) : -1;
    const piece = out[pi];
    const avail = host ? host.e - host.s : 0;
    const want = half ? q.w / 2 : q.w;
    const take = Math.min(want, avail - KERB_REST);
    if (half && !piece) {
      if (host) say(t("derive.parkingHalfPavementOsm"));
      continue;
    }
    if (!host || take < (half ? KERB_HALF_MIN : KERB_CAR_MIN) - 1e-9) {
      if (host || !half) say(!host ? t("derive.parkingPavementOsmNo")
        : half ? t("derive.parkingHalfPavementOsmPavement", { w: fmtM(avail) })
        : t("derive.parkingPavementOsmPavement", { w: fmtM(avail) }));
      if (piece) {
        // The roadway half goes back to the lane beside it.
        const lane = out[L ? pi - 1 : pi + 1];
        if (lane && ROADWAY.has(lane.type)) { if (L) lane.e = piece.e; else lane.s = piece.s; }
        else Object.assign(piece, { position: undefined });
        if (lane && ROADWAY.has(lane.type)) out = out.filter((_, k) => k !== pi);
      }
      continue;
    }
    if (take < want - 1e-9) {
      const v = { w: fmtM(avail), rest: fmtM(avail - take) };
      say(half ? t("derive.parkingHalfPavementOsmPavementOnly", v)
        : t("derive.parkingPavementOsmPavementOnly", v));
    }
    // From the roadway half (or the kerb) to the cut edge in the sidewalk; thin parts between go with the car.
    const from = L ? (piece ? piece.s : host.s) : host.e - take;
    const to = L ? host.s + take : (piece ? piece.e : host.e);
    const park = { type: "parkovani", s: from, e: to, source: "osm", orient: q.orient, position: q.pos };
    if (piece?.lawFree !== undefined) Object.assign(park, { lawFree: piece.lawFree, lawNeed: piece.lawNeed });
    const rest = L ? { ...host, s: park.e } : { ...host, e: park.s };
    const lo = Math.min(hi, pi < 0 ? hi : pi), up = Math.max(hi, pi < 0 ? hi : pi);
    out = [...out.slice(0, lo), ...(L ? [park, rest] : [rest, park]), ...out.slice(up + 1)];
    if (park.lawFree !== undefined) say(country.halfKerbNote(fmtM(park.lawFree), fmtM(park.lawNeed)));
  }
  return out;
}

// Two parking strips side by side are one parking strip. Next to a TSK section, the extra
// strip of the technical-map parking area (MTVU 704) is the space in front of the stalls,
// which belongs to the driving lane beside it.
export function mergeParking(segs) {
  for (let i = 0; i < segs.length - 1; i++) {
    const a = segs[i], b = segs[i + 1];
    if (a.type !== "parkovani" || b.type !== "parkovani") continue;
    const [keep, extra, extraIdx] = b.source === "tsk" && a.source !== "tsk" ? [b, a, i] : [a, b, i + 1];
    const lane = segs[extraIdx === i ? i - 1 : i + 2];
    if (keep.source === "tsk" && extra.source !== "tsk" && ROADWAY.has(lane?.type) && lane.type !== "parkovani") {
      if (extraIdx === i) lane.e = extra.e; else lane.s = extra.s;
      lane.source = "dtm";
    } else {
      keep.s = Math.min(keep.s, extra.s);
      keep.e = Math.max(keep.e, extra.e);
    }
    keep.position ??= extra.position;
    segs.splice(extraIdx, 1);
    i--;
  }
  return segs;
}

// Perpendicular stalls need PERP_MIN of depth: cars overhang the kerb, so a shallower measured
// strip borrows the missing depth from the sidewalk / green strip behind it.
export function perpDepth(segs) {
  segs.forEach((x, i) => {
    if (x.type !== "parkovani" || x.e - x.s >= PERP_MIN) return;
    if ((x.orient || orientFromDepth(x.e - x.s)) !== "kolme") return;
    const need = PERP_MIN - (x.e - x.s);
    const raised = (y) => y && (WALK.has(y.type) || ["zelen", "stromorad"].includes(y.type)) && y.e - y.s > need + 1;
    const prev = segs[i - 1], next = segs[i + 1];
    // The kerb side is the raised neighbour (the other side is the roadway).
    const host = raised(next) && !raised(prev) ? next : raised(prev) && !raised(next) ? prev : null;
    // Nothing to borrow from: a strip this shallow cannot hold perpendicular stalls.
    if (!host) { x.orient = "sikme"; return; }
    if (host === next) { x.e += need; host.s += need; } else { x.s -= need; host.e -= need; }
    x.orient = "kolme";
    x.overhang = true;
  });
  return segs;
}
