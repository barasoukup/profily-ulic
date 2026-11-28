// The houses of North America: their drawing (houses-america.js) is loaded when a cut first needs it.
import { EDGE, el, GROUND, tint } from "../svg.js";
import { SKLEP } from "./tables.js";

let drawAmerican = null;
export const setAmericanDrawing = (f) => { drawAmerican = f; };
// A house of North America chosen by hand elsewhere: its drawing comes at once, "ready" asks for a new render.
export const artEvents = new EventTarget();
let drawing = null;
const askAmerican = () => { drawing ??= import("../../houses-america.js").then((m) => { drawAmerican = m.drawAmerican; artEvents.dispatchEvent(new Event("ready")); }, () => { drawing = null; }); };

export function drawAmericanHouse(hs) {
  const { X, box, colAxes, det, dot, f, g, info, kind, outline, poly, seed, surface, top, wall, x } = hs;
  const cellarA = GROUND + 60 - surface;
  el("rect", { x, y: surface, width: EDGE, height: cellarA, fill: SKLEP }, g);
  box(0, EDGE, -8, 0, tint(SKLEP, 0.85));
  el("rect", { x, y: GROUND + 60, width: EDGE, height: 40, fill: "#9b7f5f" }, g);
  if (!drawAmerican) { askAmerican(); box(0, EDGE, 0, top, wall, outline); } else drawAmerican(kind, { g, el, X, surface, EDGE, f, seed, wall, det, info, box, poly, dot, tint, outline, colAxes });
  return surface - (top + f.roofH);
}
