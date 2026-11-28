// Phase 6 of deriveProfile: the kept runs as parts of the profile (roadways with their lanes, tram beds, parking,
// platforms, sidewalks and cycle tracks, the rest as the surface says), the tram belt and the surface of the beds.
import { typeFromMtvu, isMinorStructure } from "../types.js";
import { roadwayParts } from "./profile-roadway.js";
import { tramWithBus } from "./tags.js";
import { MEDIAN } from "./classify.js";
import { bedOf, bedSurfaces } from "./tram.js";
import { inside } from "./geometry.js";
import { OSM_OUTDOOR, OSM_PARKING, OSM_PLATFORM, isTskParking } from "./polygons.js";
import { cycleTrack, sidewalkUse } from "./walkways.js";
import { TRAFFIC, TRAM_KINDS } from "./part-types.js";

const GRASS_BED_MIN = 2.5; // a green area at least this wide with tracks in it is a grass tram bed (m)

// Is a run the national DTM's tram area (dmvs.js: in the roadway or apart from it), not MTVU's separate bed?
function dtmTramIn(ctx, r) {  const { at, polys } = ctx; const [x, y] = at((r.s + r.e) / 2); return polys.some((p) => p.dtmTram && x >= p.bbox[0] && x <= p.bbox[2] && y >= p.bbox[1] && y <= p.bbox[3] && inside(p.rings, x, y)); }

// A run that is no roadway as a part.
function otherPart(ctx, r) {
  const { kept, cross, tramTs, way, axisT, dir, segs } = ctx;
  const type = typeFromMtvu(r.code);
  if (r.code === MEDIAN) {
    segs.push({ type: "delici", s: r.s, e: r.e, source: "dtm" });
  } else if (isMinorStructure(r.code)) {
    segs.push({ type: "zed", s: r.s, e: r.e, source: "dtm" });
  } else if (r.code === OSM_PLATFORM) {
    segs.push({ type: "nastupiste", s: r.s, e: r.e, source: "osm" });
  } else if (isTskParking(r.code)) {
    segs.push({ type: "parkovani", s: r.s, e: r.e, source: "tsk", orient: r.orient, use: r.use });
  } else if (r.code === OSM_OUTDOOR) {
    segs.push({ type: "zahradka", s: r.s, e: r.e, source: "osm" });
  } else if (r.code === OSM_PARKING) {
    segs.push({ type: "parkovani", s: r.s, e: r.e, source: "osm", orient: r.orient });
  } else if (type === "tramvaj" && dtmTramIn(ctx, r) && [kept[kept.indexOf(r) - 1], kept[kept.indexOf(r) + 1]].every((n) => n && (n.code === 700 || n.code === 701))) {
    // The national DTM's tram area with the roadway on both sides and no curb or green between: the tracks lie
    // in the roadway (Olomouc, Sokolská; Bára), a track each way when it is wide enough.
    const parts = r.e - r.s > 5 ? [[r.s, (r.s + r.e) / 2, "forward"], [(r.s + r.e) / 2, r.e, "backward"]] : [[r.s, r.e, undefined]];
    for (const [a, b, d] of parts) segs.push({ type: "tramvaj_v_pruhu", s: a, e: b, dir: d, source: "dtm" });
  } else if (type === "tramvaj" || (type === "zelen" && r.e - r.s >= GRASS_BED_MIN && tramTs.some((t) => t > r.s + 0.5 && t < r.e - 0.5))) {
    // A separate tram bed (MTVU 705 and the towns' equivalents), or a green area with tracks in it: a bed
    // of grass. Wider than 5 m it carries a track each way.
    const bed = type === "zelen" ? { kind: "trava", source: "dtm" } : bedOf(cross, r);
    // A green area is a bed only round its tracks (1.75 m beyond the outer axes); the rest stays green (Werichova:
    // a 36 m lawn with two tracks drew two trams of 18 m).
    let s0 = r.s, e0 = r.e;
    if (type === "zelen") {
      const ins = tramTs.filter((t) => t > r.s && t < r.e);
      s0 = Math.max(r.s, Math.min(...ins) - 1.75); e0 = Math.min(r.e, Math.max(...ins) + 1.75);
      if (s0 - r.s < 0.5) s0 = r.s;
      if (r.e - e0 < 0.5) e0 = r.e;
      if (s0 > r.s) segs.push({ type: "zelen", s: r.s, e: s0, source: r.code === null ? "odhad" : "dtm" });
    }
    const parts = e0 - s0 > 5 ? [[s0, (s0 + e0) / 2, "forward"], [(s0 + e0) / 2, e0, "backward"]] : [[s0, e0, undefined]];
    for (const [a, b, d] of parts) segs.push({ type: "tramvaj", s: a, e: b, dir: d, bed: bed.kind, bedSource: bed.source, source: "dtm" });
    if (e0 < r.e) segs.push({ type: "zelen", s: e0, e: r.e, source: r.code === null ? "odhad" : "dtm" });
  } else if (type === "railway") {
    // A railway track of OSM beside the street (ortho-osm.js heavyRail): a gravel bed; a narrow gauge is drawn narrower.
    segs.push({ type: "railway", s: r.s, e: r.e, source: "osm", ...(cross.some((c) => c.way.tags?.railway === "narrow_gauge" && c.t > r.s - 0.3 && c.t < r.e + 0.3) && { narrow: true }) });
  } else if (type === "cyklostezka") {
    segs.push(...cycleTrack(r, cross, dir));
  } else {
    if (type === "chodnik") segs.push(...sidewalkUse(r, cross, way, axisT, dir));
    else segs.push({ type, s: r.s, e: r.e, source: r.code === null ? "odhad" : "dtm", ...(type === "parkovani" && r.orient && { orient: r.orient }) });
  }
}

// Tracks lying apart from the carriageway become a tram belt, buses on tracks are marked, the beds get their surface.
function fixTramParts(ctx) {
  const { segs, cross, tramTs, ortho, at, dir, way } = ctx;
  // Tracks with no car lane beside them in their roadway, while the cars have lanes of their own
  // elsewhere in the street, lie between the carriageways (Patočkova): a tram belt.
  if (segs.some((x) => x.type === "pruh")) {
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].type !== "tramvaj_v_pruhu") continue;
      let j = i;
      while (segs[j + 1]?.type === "tramvaj_v_pruhu") j++;
      const besideCars = [segs[i - 1], segs[j + 1]].some((x) => x && TRAFFIC.has(x.type) && x.type !== "tramvaj_v_pruhu");
      // Tracks of a street with rails in its roadway (embedded_rails) are a reserved tram lane, level with it;
      // without, the tracks lie apart from the carriageway: a separate tram bed (Bára).
      if (!besideCars) {
        for (let k = i; k <= j; k++) {
          if (segs[k].embedded) segs[k].type = "tramvaj_pruh";
          else Object.assign(segs[k], { type: "tramvaj", bed: "panely", bedSource: "odhad" });
        }
      }
      i = j;
    }
  }
  // Buses on the tram tracks (psv / bus = yes or designated, highway=busway on a tram way): the tram part is
  // a lane for trams and buses (Prague: about 186 such tracks).
  const busTracks = cross.filter((c) => c.way.tags?.railway === "tram" && tramWithBus(c.way.tags)).map((c) => c.t);
  for (const x of segs) if (TRAM_KINDS.has(x.type) && busTracks.some((t) => t >= x.s - 0.3 && t <= x.e + 0.3)) x.withBus = true;
  // The surface of the beds nobody describes: the orthophoto (ortho: ortho.js bedOrtho) and the rules.
  bedSurfaces(segs, { rails: tramTs, ortho, at, dir, highway: way.tags?.highway });
}

// ctx.segs, kerbReqs (cars on the sidewalk to carve out), roads (each roadway's own tags) and inZps (a paid parking zone).
export function buildParts(ctx) {
  const { kept, parking, zoneKnown } = ctx;
  Object.assign(ctx, { segs: [], kerbReqs: [], roads: [], inZps: zoneKnown ?? parking.some((p) => p.kind === "useky") });
  for (const r of kept) {
    if (r.code === 701 || r.code === 700) roadwayParts(ctx, r);
    else otherPart(ctx, r);
  }
  fixTramParts(ctx);
}
