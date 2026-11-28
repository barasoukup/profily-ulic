import { RAIL_KINDS } from "../types.js";
import { sameLevel } from "./osm-along.js";
import { P } from "./settings.js";

// A railway track on the ground beside the street (Bára 27. 11. 2026, Rudolfstraße in Linz: the profile left the track
// out): OSM railway=rail, light_rail, narrow_gauge or subway at the street's level (not a tunnel or a bridge over or
// under it, not abandoned, disused or razed ones), running along it (within 35° of its direction). ?off=railway: none.
const RAIL_ALONG = 0.7; // |across| / |along| of the track's direction at the cut
export const heavyRail = (w, o) => !!RAIL_KINDS[w.tags.railway] && sameLevel(w, o) && !P.off?.has("railway") && (!w.d || Math.abs(w.d[0]) <= RAIL_ALONG * Math.abs(w.d[1]));
// Half the width of a track's bed (types.js RAIL_KINDS) and the most tracks one side takes (a station's yard is no street).
// A track farther than RAIL_GAP from the last thing of the street (its kerb or sidewalk) is no part of it (the first blind A/B,
// 27. 11. 2026: a track 16 m off behind trees drew a bed and moved the estimate's parking).
export const RAIL_GAP = 10;
export const railHalf = (w) => RAIL_KINDS[w.tags.railway][0] / 2, MAX_RAILS = 4;
// One track mapped twice (two ways on the same line, or a curve crossing the cut twice) counts once.
export const railTracks = (ws) => ws.filter((w) => !ws.some((v) => v !== w && v.tags.railway === w.tags.railway && Math.abs(v.t - w.t) < 1.5 && (Math.abs(v.t - w.t) > 1e-9 ? v.t < w.t : v.id < w.id)));
// Half the width of a tram bed beyond its outer track axis (a 3.3 m track, as derive.js carveTramTracks).
export const TRACK_HALF = 1.75;
