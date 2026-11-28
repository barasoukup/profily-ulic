// Holes in a design: a part deleted, narrowed or not filled stays an empty part, so the parts beyond keep their places.
import { isHole } from "../profile.js";
import { state } from "./state.js";

// Holes in a design (Bára): a deleted part, a narrowed one or what a new part did not fill stays an empty part of
// its width (Neurčeno drawn by the user, at road level), so the parts beyond keep their places (and the networks
// under them their places under them). The design keeps the street's width.
export const HOLE = "nezname";
// Where edits keep the street's places: Návrh and correcting the data in Stav (Bára).
export const keepsPlace = () => state.mode === "navrh" || (state.mode === "stav" && state.fixing);
export function mergeHoles(segs) {
  for (let k = segs.length - 1; k > 0; k--) if (isHole(segs[k]) && isHole(segs[k - 1])) {
    segs[k - 1].width = +(segs[k - 1].width + segs[k].width).toFixed(2);
    segs.splice(k, 1);
  }
  for (let k = segs.length - 1; k >= 0; k--) if (isHole(segs[k]) && segs[k].width < 0.01) segs.splice(k, 1);
}
// The room on the right of part i: holes whole, other parts down to their least width.
const roomRight = (segs, i) => segs.slice(i + 1).reduce((a, x) => a + Math.max(0, x.width - (isHole(x) ? 0 : minWidth(x))), 0);
// A part's new width: in Návrh and in a correction the rest keeps its place: a narrower part leaves a hole after it, a wider one takes
// the room from the right (a hole first, then the next parts down to their least width) and grows no more than
// there is room; elsewhere just the width.
export function setWidth(segs, i, w) {
  const s = segs[i];
  if (!keepsPlace()) { s.width = w; return; }
  const d = +(Math.min(w, s.width + roomRight(segs, i)) - s.width).toFixed(2);
  if (!d) return;
  s.width = +(s.width + d).toFixed(2);
  if (d < 0) {
    if (isHole(segs[i + 1])) segs[i + 1].width = +(segs[i + 1].width - d).toFixed(2);
    else segs.splice(i + 1, 0, { type: HOLE, width: -d, source: "user" });
    return;
  }
  let need = d;
  for (const pass of [isHole, (x) => !isHole(x)]) for (let k = i + 1; k < segs.length && need > 0.001; k++) {
    if (!pass(segs[k])) continue;
    const take = Math.min(need, Math.max(0, segs[k].width - (isHole(segs[k]) ? 0 : minWidth(segs[k]))));
    segs[k].width = +(segs[k].width - take).toFixed(2);
    need = +(need - take).toFixed(2);
  }
  mergeHoles(segs);
}
// Where a new part from the palette goes in Návrh, taking its room so the street keeps its width: into the selected
// hole; after the selected part, from a hole right after it, then from the part down to its least width; with
// nothing selected into the widest hole, else from the last part. Its width is cut to the room; -1: no room.
export function placeNew(segs, sel, seg) {
  const holes = segs.map((x, k) => (isHole(x) ? k : -1)).filter((k) => k >= 0);
  let from, at;
  if (sel !== null && isHole(segs[sel])) { from = [sel]; at = sel; }
  else if (sel !== null) { from = [...(isHole(segs[sel + 1]) ? [sel + 1] : []), sel]; at = sel + 1; }
  else if (holes.length) { const k = holes.reduce((b, x) => (segs[x].width > segs[b].width ? x : b)); from = [k]; at = k; }
  else { from = [segs.length - 1]; at = segs.length; }
  const room = from.reduce((a, k) => a + Math.max(0, segs[k].width - (isHole(segs[k]) ? 0 : minWidth(segs[k]))), 0);
  // Not a sliver: at least 1 m (or the new part's own least width, if more), else "no room".
  if (room < Math.max(Math.min(1, seg.width), minWidth(seg))) return -1;
  seg.width = +Math.min(seg.width, room).toFixed(2);
  let need = seg.width;
  for (const k of from) {
    const take = Math.min(need, Math.max(0, segs[k].width - (isHole(segs[k]) ? 0 : minWidth(segs[k]))));
    segs[k].width = +(segs[k].width - take).toFixed(2);
    need = +(need - take).toFixed(2);
  }
  // A hole used up goes; the new part takes its place.
  if (isHole(segs[at]) && segs[at].width < 0.01) segs.splice(at, 1);
  return at;
}
const minWidth = (seg) => (seg.type === "parkovani" && seg.orient === "kolme" ? 4.5 : 0.2);
