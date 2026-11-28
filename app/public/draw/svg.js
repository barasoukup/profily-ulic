// The primitives of the drawing: SVG elements, the sizes (cm), the earth drop under the street, clip ids, stacked export.
import { num } from "../i18n.js";

export const NS = "http://www.w3.org/2000/svg";
export const GROUND = 760; // roadway surface

export const CURB = 15;
export const EDGE = 400; // width drawn for the building / open edge

// How far the rows under the ground (sources, labels, signs) move down to make room for the networks under the
// street (site.js, a trial): 0 without them.
export let DROP = 0;
export const setDrop = (v) => { DROP = v; };

export const el = (name, attrs = {}, parent) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};

export const fmt = (m) => num(m) + " m";
export const totalWidth = (p) => p.segments.reduce((a, s) => a + s.width, 0);

// anchor: the picture's x (its own units) that stands at cx; the middle when not given.
// The most even split of a name into two lines (null for one word).
export function twoLines(text) {
  // A name of two things ("Jízdní pruh ↑, piktokoridor ↓") breaks after the comma.
  const comma = text.indexOf(", ");
  if (comma > 0) return [text.slice(0, comma + 1), text.slice(comma + 2)];
  const words = text.split(" ");
  let best = null;
  for (let j = 1; j < words.length; j++) {
    const a = words.slice(0, j).join(" "), b = words.slice(j).join(" ");
    if (!best || Math.max(a.length, b.length) < Math.max(best[0].length, best[1].length)) best = [a, b];
  }
  return best;
}

let clipN = 0;
export const nextClip = () => ++clipN;

// Darker or lighter shade of a hex colour (k < 1 darkens).
export const tint = (hex, k) => "#" + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * k)))
  .toString(16).padStart(2, "0")).join("");

export function svgString(svgs, gap = 40) {
  if (svgs.length === 1) return new XMLSerializer().serializeToString(svgs[0]);
  // Stack several profiles vertically into one SVG.
  const boxes = svgs.map((s) => s.getAttribute("viewBox").split(" ").map(Number));
  const width = Math.max(...boxes.map((b) => b[2]));
  const height = boxes.reduce((a, b) => a + b[3] + gap, -gap);
  const out = el("svg", { xmlns: NS, viewBox: `0 0 ${width} ${height}` });
  let y = 0;
  svgs.forEach((s, i) => {
    const b = boxes[i];
    const inner = s.cloneNode(true);
    inner.setAttribute("x", (width - b[2]) / 2);
    inner.setAttribute("y", y);
    inner.setAttribute("width", b[2]);
    inner.setAttribute("height", b[3]);
    out.appendChild(inner);
    y += b[3] + gap;
  });
  return new XMLSerializer().serializeToString(out);
}
