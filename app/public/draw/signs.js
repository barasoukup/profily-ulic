// The row of traffic signs under the labels of the profile.
import { country } from "../city.js";
import { plateFile, PLATES, signDir, signFile, signLabel, SPEED_TEMPLATES } from "../signs.js";
import { el } from "./svg.js";

// The row of traffic signs under the profile, in the page and the exports; the menu's switch (app.js) turns it off.
export let signsShown = true;
export const setSignsShown = (on) => { signsShown = on; };
export const getSignsShown = () => signsShown;

// Build an SVG element. opts: {editable, selected, view: [x0, width], onSelect(i), selectedEdge, onEdge(side)}
// Traffic-sign icons of the state of the cut (signs-CZ/ for CZ, signs-SK/ for SK; city.country, ISO 3166-1), loaded
// on first use: file → { uri, w, h }. A template (B 20a or 253 with another speed, E 13 with a text) gets its text
// filled in before it becomes a data URI.
const signArt = new Map();
const signCountry = () => country.code; // null: the Czech signs (countries/default.js)
const signKey = (a) => `${a.dir}/${a.file}${a.text ? `|${a.text}` : ""}`;
async function loadSignFile(a) {
  const key = signKey(a);
  const { dir, file, text } = a;
  if (signArt.has(key)) return;
  signArt.set(key, null);
  try {
    const r = await fetch(`${dir}/${file}.svg`);
    if (!r.ok) throw new Error(r.status);
    let svg = await r.text();
    if (text) svg = svg.replace(/(<text id="[vt]"[^>]*>)[^<]*/, `$1${text.replace(/[<&]/g, "")}`);
    const vb = svg.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
    signArt.set(key, { uri: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg), w: vb[2], h: vb[3], u: signUnits(dir, vb[2], vb[3]) });
  } catch (err) {
    console.warn("značka chybí", file, err.message);
  }
}
// The width of a sign in units of a basic sign (100 in its viewBox = 500 mm). The Czech and Slovak sets are drawn so;
// the sets taken from Wikimedia Commons (AT, DE) come in their authors' units (a round sign 600, 960 or 100 wide), so
// their size goes by their shape (the review of Germany, 17. 11. 2026: Z 274 drawn six times too big, Austria's 10a-30
// ten times bigger than its 10a-50): as tall as a basic sign, a wide one (an arrow, a plate) 1.5 wide.
export function signUnits(dir, w, h) {
  if (dir === "signs-CZ" || dir === "signs-SK") return w / 100;
  return w / h > 1.6 ? 1.5 : w / h;
}
// The file (and filled-in text) of a sign and of its plate.
const signArtOf = (x, seg) => {
  const file = signFile(x, seg, signCountry());
  return { dir: signDir(signCountry()), file, text: SPEED_TEMPLATES.has(file) ? String(x.v) : null };
};
const plateArtOf = (x, seg) => {
  const file = plateFile(x, seg, signCountry());
  return file && { dir: signDir(signCountry()), file, text: file === "E13" ? PLATES[x.plate] : null };
};
// All signs of the profiles, loaded before drawing (the row is drawn from the cache).
// Resolves to true when something new was loaded (the drawing then needs redrawing).
export async function loadSigns(...profiles) {
  const all = profiles.filter(Boolean).flatMap((p) => p.segments.flatMap((s) => (s.signs || []).map((x) => [x, s])));
  const todo = all.flatMap(([x, s]) => [signArtOf(x, s), plateArtOf(x, s)].filter((a) => a?.file)).filter((a) => !signArt.has(signKey(a)));
  await Promise.all(todo.map(loadSignFile));
  return todo.length > 0;
}
const artFor = (a) => (a ? signArt.get(signKey(a)) : null);

// The row of signs under the labels (no head: the signs are what the data say, not always what is on the
// street; Bára): each part's signs under the part with their plates, and a sign shared by neighbouring parts
// once under a bracket over them. size: the height of a sign in drawing units; top: the top of the row; px:
// drawing units per screen pixel (for the bracket and the dot). A part too narrow for its signs gets a grey
// dot. Returns the bottom (top without signs).
export function layoutSigns(svg, size, top, px = size / 32) {
  const groups0 = [...svg.querySelectorAll("g.sign-group")];
  if (!groups0.length) return top;
  // All signs at one size (Bára): the size that lets every part's signs fit its width, but no smaller than
  // MIN_K of the full size; a part too narrow even for that shows a dot.
  const MIN_K = 0.6, gap = size * 0.12;
  const rowTop = top + 6 * px;
  const groups = groups0.map((g) => {
    const stacks = [...g.querySelectorAll("g.sign")];
    const ws = stacks.map((st) => Number(st.querySelector("image").dataset.u) * size);
    const need = ws.reduce((a, w) => a + w, 0) + gap * (ws.length - 1);
    return { g, stacks, ws, need, fit: (Number(g.dataset.w) * 0.94) / need };
  });
  const k = Math.min(1, ...groups.map((x) => x.fit).filter((f) => f >= MIN_K));
  const lineH = [0, 0];
  const bracket = 8 * px; // room for the bracket above shared signs
  const anyBracket = [0, 1].map((l) => groups0.some((g) => Number(g.dataset.line || 0) === l && g.querySelector("path.sign-bracket")));
  for (const { g, stacks, ws, need, fit } of groups) {
    const cx = Number(g.dataset.cx), line = Number(g.dataset.line || 0);
    const hidden = fit < MIN_K;
    for (const st of stacks) st.style.display = hidden ? "none" : "";
    let dot = g.querySelector("circle.sign-more");
    if (hidden) {
      // Not room for the signs: a dot, their names in the title (and in the editor).
      dot ??= el("circle", { class: "sign-more", fill: "#a8a397" }, g);
      dot.setAttribute("cx", cx); dot.setAttribute("r", 3 * px); dot.dataset.dy = 4 * px;
      dot.querySelector("title") || (el("title", {}, dot).textContent = stacks.map((st) => st.querySelector("title")?.textContent).join(", "));
      lineH[line] = Math.max(lineH[line], 8 * px);
      continue;
    }
    dot?.remove();
    // Every sign of the line one under the other's bracket room, so all stand on one line (Bára).
    const pad = anyBracket[line] ? bracket : 0;
    let x = cx - (need * k) / 2;
    stacks.forEach((st, j) => {
      let y = pad;
      const sw = ws[j] * k;
      for (const im of st.querySelectorAll("image")) {
        const ar = Number(im.dataset.ar);
        const plate = im.dataset.plate === "plate";
        // Every sign at one scale: a basic sign is size wide, a plate as wide as its sign.
        const w = plate ? sw : Number(im.dataset.u) * size * k, h = w / ar;
        im.setAttribute("x", x + (sw - w) / 2); im.dataset.dy = y;
        im.setAttribute("width", w); im.setAttribute("height", h);
        y += h + size * 0.04;
      }
      lineH[line] = Math.max(lineH[line], y);
      x += (ws[j] + gap) * k;
    });
  }
  // The second line (shared signs under parts that have their own) starts below the first.
  const lineTop = [rowTop, rowTop + (lineH[0] ? lineH[0] + size * 0.1 : 0)];
  for (const { g } of groups) {
    const t = lineTop[Number(g.dataset.line || 0)];
    for (const im of g.querySelectorAll("image")) im.setAttribute("y", t + Number(im.dataset.dy));
    const dot = g.querySelector("circle.sign-more");
    if (dot) dot.setAttribute("cy", t + Number(dot.dataset.dy));
    const br = g.querySelector("path.sign-bracket");
    if (br) {
      // A bracket over the parts a shared sign belongs to, the sign in its middle below.
      const a = Number(g.dataset.x0) + 6 * px, b = Number(g.dataset.x1) - 6 * px, y = t + 2 * px;
      br.setAttribute("d", `M${a} ${y + 5 * px} V${y} H${b} V${y + 5 * px}`);
      br.setAttribute("stroke-width", 1.2 * px);
    }
  }
  const rowH = lineH[1] ? lineTop[1] - rowTop + lineH[1] : lineH[0];
  return rowTop + rowH + size * 0.2;
}

export function drawSigns(svg, profile, bounds) {
  const segs = profile.segments;
  const stack = (g, x, seg) => {
    const st = el("g", { class: "sign" }, g);
    const title = el("title", {}, st);
    title.textContent = signLabel(x, signCountry());
    for (const [a, plate] of [[signArtOf(x, seg), false], [plateArtOf(x, seg), true]]) {
      const art = artFor(a);
      if (!art) continue;
      // A plate (dodatková tabulka) is drawn as wide as its sign, a second symbol (the bike under the bus) as a sign.
      // data-u: the sign's width in units of a basic sign (100 in its viewBox = 500 mm), so a square IP 4b and an
      // upright IP 11 are as wide as on the street (Bára).
      el("image", { href: art.uri, "data-ar": art.w / art.h, "data-u": art.u ?? art.w / 100, ...(plate ? { "data-plate": a.file === "C8a" ? "symbol" : "plate" } : {}) }, st);
    }
    if (!st.querySelector("image")) st.remove();
  };
  // A sign shared by neighbouring parts (the street's speed or zone under all its lanes) is drawn once, in the
  // middle of the run (Bára); signs of one part under it. Same sign = same file, value and plate as drawn.
  const id = (x, s) => JSON.stringify([signArtOf(x, s), plateArtOf(x, s)]);
  const ids = segs.map((s) => (s.signs || []).map((x) => id(x, s)));
  const shared = new Map(); // "i-j" → [[sign, seg]] for runs of 2 and more parts
  const own = segs.map((s) => [...(s.signs || [])]);
  for (let i = 0; i < segs.length; i++) {
    for (const x of [...own[i]]) {
      const key = id(x, segs[i]);
      let j = i;
      while (j + 1 < segs.length && ids[j + 1].includes(key)) j++;
      if (j === i) continue;
      const span = `${i}-${j}`;
      if (!shared.has(span)) shared.set(span, []);
      shared.get(span).push([x, segs[i]]);
      for (let m = i; m <= j; m++) own[m] = own[m].filter((y) => id(y, segs[m]) !== key);
    }
  }
  own.forEach((list, i) => {
    if (!list.length) return;
    const g = el("g", { class: "sign-group", "data-line": 0, "data-cx": (bounds[i] + bounds[i + 1]) / 2, "data-w": bounds[i + 1] - bounds[i] }, svg);
    list.forEach((x) => stack(g, x, segs[i]));
  });
  for (const [span, list] of shared) {
    const [i, j] = span.split("-").map(Number);
    // Below the parts' own signs when any of the run's parts has some.
    const line = own.slice(i, j + 1).some((l) => l.length) ? 1 : 0;
    const g = el("g", { class: "sign-group", "data-line": line, "data-cx": (bounds[i] + bounds[j + 1]) / 2, "data-w": bounds[j + 1] - bounds[i], "data-x0": bounds[i], "data-x1": bounds[j + 1] }, svg);
    el("path", { class: "sign-bracket", fill: "none", stroke: "#a8a397" }, g);
    list.forEach(([x, s]) => stack(g, x, s));
  }
  for (const g of svg.querySelectorAll("g.sign-group")) if (!g.querySelector("image")) g.remove();
}
