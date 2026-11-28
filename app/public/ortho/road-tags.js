import { sameLevel } from "./osm-along.js";

// ---------- the carriageway OSM implies ----------
export const num = (v) => { const x = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(x) ? x : null; };
export const ONEWAY = (t) => t.oneway === "yes" || t.oneway === "1" || t.oneway === "-1" || t.junction === "roundabout" || t.highway === "motorway";
// Lane width by the road's class (the app's 3 m, wider on main roads, narrower in residential streets).
const LANE_W = { motorway: 3.5, trunk: 3.5, primary: 3.25, secondary: 3.25, tertiary: 3.0 };
export const laneWidth = (hw) => LANE_W[String(hw).replace("_link", "")] ?? 2.75;
// Parking at one side of the way (left / right of its drawing direction), the street-parking schemes old and new:
// its kind and how much of the carriageway it takes (m).
// Only parking on the carriageway counts (lane, street_side, half of half_on_kerb); no_parking, no_stopping, yes and
// the like take nothing. The old scheme: parking:lane:<side>=parallel|diagonal|perpendicular|marked with the place in
// parking:lane:<side>:<orientation>=on_street|half_on_kerb|on_kerb|lay_by.
const OLD_ORIENT = ["parallel", "diagonal", "perpendicular", "marked", "inline"];
function parkingSide(t, side) {
  const v = t[`parking:${side}`] ?? t["parking:both"], orient = t[`parking:${side}:orientation`] ?? t["parking:both:orientation"];
  const old = t[`parking:lane:${side}`] ?? t["parking:lane:both"];
  let kind = v ?? null, or = orient ?? "parallel";
  if (!kind && old) {
    if (OLD_ORIENT.includes(old)) {
      or = old === "marked" || old === "inline" ? "parallel" : old;
      const at = t[`parking:lane:${side}:${old}`] ?? t[`parking:lane:both:${old}`];
      kind = at === "on_kerb" ? "on_kerb" : at === "half_on_kerb" ? "half_on_kerb" : at === "lay_by" || at === "street_side" ? "street_side" : "lane";
    } else kind = old;
  }
  if (!["lane", "street_side", "half_on_kerb"].includes(kind)) return { kind, w: 0 };
  const full = or === "perpendicular" ? 5 : or === "diagonal" ? 4.5 : 2.0;
  return { kind, w: kind === "half_on_kerb" ? full / 2 : full, or };
}
// The orientation of the parking OSM has on the carriageway at a side of the way ("left", "right"): "parallel",
// "diagonal", "perpendicular", or null (none tagged, or on the kerb).
export function parkingOrient(t, side) {
  const p = parkingSide(t || {}, side);
  return p.w && p.kind !== "half_on_kerb" && ["parallel", "diagonal", "perpendicular"].includes(p.or) ? p.or : null;
}
const cyclewaySide = (t, side) => { const v = t[`cycleway:${side}`] ?? t["cycleway:both"] ?? t.cycleway; return v === "lane" || v === "share_busway" ? 1.5 : 0; };
// own: osmAlong's own. Returns { w, reach: { A, B } (from the axis), lanes, parking, sidewalk, sidewalkW, from }; side A
// of the cut is t < axis, the way's left is side B when it runs with u.
export function osmRoad(own) {
  const t = own.tags, ow = ONEWAY(t), hw = t.highway;
  const lanes = num(t.lanes) ?? (hw === "living_street" || hw === "pedestrian" || hw === "service" ? 1 : ow ? 1 : 2);
  const leftIs = own.along > 0 ? "B" : "A", rightIs = leftIs === "A" ? "B" : "A";
  const pl = parkingSide(t, "left"), pr = parkingSide(t, "right");
  const parking = { [leftIs]: pl.w, [rightIs]: pr.w }, parkKind = { [leftIs]: pl.kind, [rightIs]: pr.kind };
  const cyc = cyclewaySide(t, "left") + cyclewaySide(t, "right");
  const width = num(t.width);
  // A width tag between one lane and 40 m is the carriageway's width (it is meant so; sometimes it is the street's).
  const w = width && width >= 2.5 && width <= 40 ? width : Math.max(lanes, 1) * laneWidth(hw) + parking.A + parking.B + cyc;
  const sw = (side) => t[`sidewalk:${side}`] ?? t["sidewalk:both"] ?? (t.sidewalk === "both" || t.sidewalk === side ? "yes" : t.sidewalk === "no" || t.sidewalk === "none" ? "no" : t.sidewalk === "separate" ? "separate" : t.sidewalk === "left" || t.sidewalk === "right" ? "no" : null);
  const swW = (side) => num(t[`sidewalk:${side}:width`] ?? t["sidewalk:both:width"] ?? t["sidewalk:width"]);
  return { w, reach: { A: w / 2, B: w / 2 }, lanes, oneway: ow, parking, parkKind, sidewalk: { [leftIs]: sw("left"), [rightIs]: sw("right") }, sidewalkW: { [leftIs]: swW("left"), [rightIs]: swW("right") }, from: width ? "width" : num(t.lanes) ? "lanes" : "výchozí" };
}
// Tram tracks in the street: where OSM tracks cross the cut within the expected carriageway, it reaches at least
// 1.7 m past the outer track's axis (half a tram and a little).
export function withRails(road, o) {
  const axis = o.own.t, far = Math.max(road.reach.A, road.reach.B), rails = o.ways.filter((w) => w.tags.railway === "tram" && sameLevel(w, o) && Math.abs(w.t - axis) < far + 3.5);
  // A two-way street with its tracks in the roadway (embedded_rails) but not mapped apart: two tracks 3 m apart about
  // the axis, so the roadway reaches at least 1.5 + 1.7 m each way (Josefstädter Straße in 2019 read 4.7 m on the photo
  // and drew trams of 2.0 and 2.7 m).
  if (!rails.length && o.own.tags.embedded_rails === "tram" && !ONEWAY(o.own.tags)) {
    const reach = { A: Math.max(road.reach.A, 3.2), B: Math.max(road.reach.B, 3.2) };
    return { ...road, reach, w: reach.A + reach.B, rails: 2, embeddedOnly: true };
  }
  if (!rails.length || (o.own.tags.embedded_rails === undefined && !rails.some((w) => Math.abs(w.t - axis) < far))) return road;
  const reach = { ...road.reach };
  for (const w of rails) { const side = w.t < axis ? "A" : "B"; reach[side] = Math.max(reach[side], Math.abs(w.t - axis) + 1.7); }
  return { ...road, reach, w: reach.A + reach.B, rails: rails.length };
}
// Where a kerb may lie on each side: up to the facade, 0.75 m short of a separately mapped sidewalk (its line is the
// sidewalk's middle), halfway to a partner carriageway (ways of the street's own level only); at most 25 m.
export function limits(o, axis) {
  const lim = { A: axis - 25, B: axis + 25 };
  const near = (side, t, back = 0) => { if (side === "A" && t < axis && t + back > lim.A) lim.A = t + back; if (side === "B" && t > axis && t - back < lim.B) lim.B = t - back; };
  for (const side of ["A", "B"]) if (o.facade[side] !== null) near(side, o.facade[side]);
  for (const w of o.ways) {
    if (!sameLevel(w, o)) continue;
    const hw = w.tags.highway, side = w.t < axis ? "A" : "B";
    if (hw === "footway" && w.tags.footway === "sidewalk") near(side, w.t, 0.75);
    if ((w.id === o.pairId || ["motorway", "trunk", "primary", "secondary", "tertiary"].includes(String(hw).replace("_link", "")) && w.tags.oneway === "yes") && Math.abs(w.t - axis) > 4) near(side, (w.t + axis) / 2);
    // Tracks between the street's two carriageways mapped as roads too (a tram bed: Radlinského): the kerb stays 1.7 m
    // off the nearer rail (only these: with all of Prague's tracks the regression lost a point).
    if (o.pairT !== undefined && w.tags.railway === "tram" && w.tags.highway && (w.t - axis) * (o.pairT - axis) > 0 && Math.abs(w.t - axis) < Math.abs(o.pairT - axis)) near(side, w.t, 1.7);
  }
  return lim;
}
// The other carriageway of a street of two one-way ones (Suché mýto in Bratislava; Bára 16. 11. 2026): the nearest
// one-way street way of the same level and name (unnamed: of the same class), 4 to 35 m from the clicked one. Its
// kerbs are read as the clicked one's; the strip between them is a median.
export function partnerOf(o) {
  const own = o.own, tg = own.tags;
  if (!ONEWAY(tg)) return null;
  const same = (w) => (tg.name ? w.tags.name === tg.name : String(w.tags.highway).replace("_link", "") === String(tg.highway).replace("_link", ""));
  const c = o.ways.filter((w) => STREET.test(w.tags.highway || "") && !w.tags.railway && ONEWAY(w.tags) && sameLevel(w, o) && same(w) && Math.abs(w.t - own.t) > 4 && Math.abs(w.t - own.t) < 35);
  // Of the same class first (Bára 18. 11. 2026, Košická in Bratislava: the one-lane residential side road 8.5 m off
  // was taken for the other carriageway of the primary 9.9 m off, which then was left out).
  const cls = (w) => String(w.tags.highway).replace("_link", "");
  const rank = (w) => (cls(w) === cls(own) ? 0 : 1000) + Math.abs(w.t - own.t);
  return c.length ? c.reduce((a, b) => (rank(b) < rank(a) ? b : a)) : null;
}
export const STREET = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|pedestrian|road)(_link)?$/;
// A path for walkers and cyclists in one (C 9): a footway or path with bicycle=designated and not segregated=yes (the
// segregated one stays a cycle track as before: its two halves are not measured), a cycle way with foot=designated and not
// segregated, or segregated=no. One part along the street, not a cycle track
// (Brandenburger Straße in Leipzig: a path=sidewalk with oneway:bicycle=yes drew two cycle tracks).
export const OSM_SHARED = (t) => (["path", "footway"].includes(t.highway) ? t.bicycle === "designated" && t.segregated !== "yes"
  : t.highway === "cycleway" && (t.segregated === "no" || (t.foot === "designated" && t.segregated !== "yes")));
export const OSM_SIDEWALK = (t) => t.highway === "footway" && t.footway === "sidewalk";
export const OSM_CYCLEWAY = (t) => (t.highway === "cycleway" || (["path", "footway"].includes(t.highway) && t.bicycle === "designated"));
