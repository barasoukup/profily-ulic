// What the cut line crosses: OSM ways, technical-map lines and tracks; the other carriageway of a divided street.
import { P as ORTHO_P } from "../ortho-osm.js";
import { MINOR, busOnly, drivingDot, inTunnel, isOnewayTags } from "./tags.js";
import { segIntersect } from "./geometry.js";

const tunnelTrack = (t, way) => !!t?.railway && !t.highway && inTunnel(t) && !inTunnel(way?.tags) && !ORTHO_P.off?.has("tunneltracks");
// Where OSM ways cross the cut, as offsets along the normal. way: the cut's street.
export function crossings(osm, frame, center, normal, half, way = null) {
  const a = [center[0] - normal[0] * half, center[1] - normal[1] * half];
  const b = [center[0] + normal[0] * half, center[1] + normal[1] * half];
  const out = [];
  for (const el of osm.elements || []) {
    if (el.type !== "way" || !el.geometry || tunnelTrack(el.tags, way)) continue;
    const pts = el.geometry.map((g) => frame.toXY(g.lon, g.lat));
    for (let i = 0; i < pts.length - 1; i++) {
      const hit = segIntersect(a, b, pts[i], pts[i + 1]);
      if (hit === null) continue;
      const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1];
      const len = Math.hypot(dx, dy) || 1;
      out.push({ t: hit * 2 * half - half, way: el, d: [dx / len, dy / len] });
    }
  }
  return out;
}

// Crossings of plain polylines (local coordinates) with the cut.
export function lineCrossings(lines, center, normal, half) {
  const a = [center[0] - normal[0] * half, center[1] - normal[1] * half];
  const b = [center[0] + normal[0] * half, center[1] + normal[1] * half];
  const out = [];
  for (const pts of lines) {
    for (let i = 0; i < pts.length - 1; i++) {
      const hit = segIntersect(a, b, pts[i], pts[i + 1]);
      if (hit !== null) out.push(hit * 2 * half - half);
    }
  }
  return out;
}

export function trackLines(json, frame) {
  return (json.features || [])
    .filter((f) => Number(f.attributes?.CTMTP_KOD ?? 55010) === 55010)
    .flatMap((f) => (f.geometry?.paths || []).map((p) => p.map(([lon, lat]) => frame.toXY(lon, lat))));
}

// Barrier and slope lines of the technical map (everything but track axes), with their code; its points
// (Prague's layer 9: poles, stop poles, bollards, trees) as {code, point}; Prague's open data (sources.js)
// with string codes: trees (od_strom, points), tree rows (od_stromorad) and street sections of TSK
// (od_usek, with their class in cls).
export function techLines(json, frame) {
  const codeOf = (f) => { const c = f.attributes?.CTMTP_KOD; return typeof c === "string" && isNaN(c) ? c : Number(c); };
  return (json.features || [])
    .filter((f) => codeOf(f) !== 55010)
    .flatMap((f) => {
      const code = codeOf(f), a = f.attributes;
      if (f.geometry?.x !== undefined) return [{ code, point: frame.toXY(f.geometry.x, f.geometry.y) }];
      const cls = code === OD_SECTION ? { mk: a.MK, road: a.SIL, motorway: a.DALNICE, kind: a.TYP } : undefined;
      return (f.geometry?.paths || []).map((p) => ({ code, pts: p.map(([lon, lat]) => frame.toXY(lon, lat)), ...(cls ? { cls } : {}) }));
    });
}
export const OD_TREE = "od_strom", OD_ROW = "od_stromorad", OD_SECTION = "od_usek"; // as sources.js

export function dualPartner(cross, way, half) {
  const own = cross.find((c) => c.way.id === way.id);
  if (!own || !isOnewayTags(way.tags) || !way.tags.name) return null;
  return cross
    .filter((c) => c.way.id !== way.id && isOnewayTags(c.way.tags) && c.way.tags.name === way.tags.name && (!MINOR.has(c.way.tags.highway) || busOnly(c.way.tags)) &&
      drivingDot(c, own) < 0 && Math.abs(c.t - own.t) < half)
    // A bus-only carriageway only when no other is there (Evropská in Prague: the buses' ways on the tram belt are not
    // the street's other half).
    .sort((a, b) => busOnly(a.way.tags) - busOnly(b.way.tags) || Math.abs(a.t - own.t) - Math.abs(b.t - own.t))[0] || null;
}
