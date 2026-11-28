// The profile on the screen: the zoom, the fitting of the drawing and of its labels to the width, the scrolling and the networks' tip.
import { layoutSigns, twoLines } from "../profile.js";
import { $ } from "./state.js";

// A wide street would shrink to unreadable: the profile keeps a minimum scale (px per cm of the drawing;
// more on a phone, where fingers need bigger targets) and scrolls sideways instead.
const MIN_SCALE = { phone: 0.17, desktop: 0.17 };
// The width goes into a CSS variable, so drawings the editor redraws while dragging keep it.
// The magnifier (Bára: wide streets and the networks under them): the drawing's width times zoom, the wrap
// scrolling; the view keeps its middle.
const ZOOM_MAX = 6;
let zoom = 1;
for (const b of document.querySelectorAll("#zoom-ctl button")) b.onclick = () => {
  const wrap = $("#profile-wrap"), mid = (wrap.scrollLeft + wrap.clientWidth / 2) / (wrap.scrollWidth || 1);
  zoom = Math.min(ZOOM_MAX, Math.max(1, zoom * (b.dataset.z === "1" ? 1.5 : 1 / 1.5)));
  if (zoom < 1.05) zoom = 1;
  fitPhone();
  wrap.scrollLeft = mid * wrap.scrollWidth - wrap.clientWidth / 2;
};
// The networks' tip: the name and depth by the pointer at once (no waiting for a title), a tap on a phone.
function netTip(e) {
  const g = e.target.closest?.(".networks g[data-tip]"), tip = $("#net-tip");
  if (!g) { tip.hidden = true; return; }
  tip.textContent = g.dataset.tip;
  tip.hidden = false;
  const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8), y = Math.max(8, e.clientY - tip.offsetHeight - 12);
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
}
$("#profile").addEventListener("pointermove", netTip);
$("#profile").addEventListener("pointerdown", netTip);
$("#profile").addEventListener("pointerleave", () => { $("#net-tip").hidden = true; });
export function fitPhone(box = $("#profile")) {
  const vbWidth = Math.max(0, ...[...box.querySelectorAll("svg")].map((svg) => Number(svg.getAttribute("viewBox")?.split(" ")[2]) || 0));
  const scale = matchMedia("(max-width: 760px)").matches ? MIN_SCALE.phone : MIN_SCALE.desktop;
  const width = Math.max(box.clientWidth, vbWidth * scale) * zoom;
  box.style.setProperty("--fit-width", `${width}px`);
  box.classList.toggle("zoomed", zoom > 1);
  $("#zoom-ctl [data-z='-1']").disabled = zoom <= 1;
  $("#zoom-ctl [data-z='1']").disabled = zoom >= ZOOM_MAX;
  box.closest("#profile-wrap")?.classList.toggle("scrolls", width > box.clientWidth + 1);
  scrollFade();
  requestAnimationFrame(() => fitLabels(box));
}
const coarse = matchMedia("(pointer: coarse)").matches;
// Labels in the drawing keep a readable size on screen (k = drawing units per CSS pixel); a label
// wider than its part shrinks a little, and a name that still does not fit is left out.
const SIGN_PX = 32; // width of a basic traffic sign under the profile on screen (CSS px)
const LABEL_PX = { "lbl-w": 13, "lbl-t": 11, "lbl-total": 14, "lbl-title": 13, "lbl-floor": 11 };
export function fitLabels(box) {
  for (const svg of box.querySelectorAll("svg")) {
    const [, , vw, vh] = (svg.getAttribute("viewBox") || "").split(" ").map(Number);
    const rect = svg.getBoundingClientRect();
    // A height cap shrinks the drawing inside its box (preserveAspectRatio meet): use the tighter fit.
    const k = Math.max(vw / (rect.width || 1), vh / (rect.height || 1));
    if (!isFinite(k) || k <= 0) continue;
    // When any part is too narrow for "3,60 m", all widths go without the unit (it stays at Celkem).
    const widths = [...svg.querySelectorAll("text.lbl-w")];
    for (const t of widths) { t.dataset.full ??= t.textContent; t.dataset.row = 0; }
    const bare = widths.some((t) => t.dataset.full.length * 0.56 * LABEL_PX["lbl-w"] * k > Number(t.dataset.w));
    for (const t of widths) t.textContent = bare ? t.dataset.full.replace(/ m$/, "") : t.dataset.full;
    for (const t of svg.querySelectorAll("text.lbl-floor")) {
      // Floors over a slim building: the height is left out before the label runs into A/B.
      t.dataset.full ??= t.textContent;
      const short = t.dataset.full.split(" · ")[0];
      t.textContent = t.dataset.full.length * 0.56 * 10 * k > Number(t.dataset.w) ? short : t.dataset.full;
    }
    // Names drawn on two lines start again from one line (data-full).
    for (const t of svg.querySelectorAll("text.lbl-t[data-full]:not(.lbl-floor)")) t.textContent = t.dataset.full;
    for (const t of svg.querySelectorAll("text.lbl-w, text.lbl-t, text.lbl-total, text.lbl-title, text.lbl-floor")) {
      const cls = ["lbl-w", "lbl-total", "lbl-t", "lbl-title", "lbl-floor"].find((c) => t.classList.contains(c));
      let size = LABEL_PX[cls] * k;
      const w = Number(t.dataset.w);
      const est = t.textContent.length * 0.56 * size;
      if (w && est > w * 0.96) size = Math.max((w * 0.96) / (t.textContent.length * 0.56), cls === "lbl-w" ? 11 * k : 10 * k);
      t.style.fontSize = `${size}px`;
      // The floor count above a building may reach past it (data-free), other names are left out.
      t.style.display = w && t.textContent.length * 0.56 * size > w * 1.05 && cls !== "lbl-w" && !t.dataset.free ? "none" : "";
    }
    // A long name that does not fit under its part goes on two lines before it is left out.
    for (const n of svg.querySelectorAll("text.lbl-turn")) n.dataset.row = 2;
    for (const t of svg.querySelectorAll("text.lbl-t[data-row='1'][data-full]:not(.lbl-floor)")) {
      const w = Number(t.dataset.w), full = t.dataset.full, best = twoLines(full);
      if (parseFloat(t.style.fontSize) * full.length * 0.56 <= w * 1.05 || !best) continue;
      const longest = Math.max(best[0].length, best[1].length);
      const size = Math.max(Math.min(LABEL_PX["lbl-t"] * k, (w * 0.96) / (longest * 0.56)), 10 * k);
      if (longest * 0.56 * size > w * 1.05) { t.style.display = "none"; continue; }
      t.textContent = "";
      t.style.fontSize = `${size}px`;
      t.style.display = "";
      best.forEach((line, j) => {
        const ts = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        ts.setAttribute("x", t.getAttribute("x"));
        ts.setAttribute("dy", j ? "1.15em" : "0");
        ts.textContent = line;
        t.append(ts);
      });
      // The turn arrows under it move one row down.
      for (const n of t.parentNode.querySelectorAll("text.lbl-turn")) n.dataset.row = 3;
    }
    // Rows under the ground (width, type, turns) are stacked by their screen size; when they need
    // more room than the drawing has below the ground, the drawing grows downwards.
    // Widths that would run into the one before drop a row (a narrow part has no name there).
    let prevEnd = -Infinity;
    for (const t of svg.querySelectorAll("text.lbl-w")) {
      const half = (t.textContent.length * 0.56 * parseFloat(t.style.fontSize)) / 2, cx = Number(t.getAttribute("x"));
      if (cx - half < prevEnd + 4 * k) {
        t.dataset.row = 1;
        for (const n of t.parentNode.querySelectorAll("text.lbl-t:not(.lbl-floor)")) n.style.display = "none";
      } else prevEnd = cx + half;
    }
    // A width in the second row wins over a neighbour's name it would touch.
    const span = (t) => { const h = (t.textContent.length * 0.56 * parseFloat(t.style.fontSize)) / 2, x = Number(t.getAttribute("x")); return [x - h - 3 * k, x + h + 3 * k]; };
    for (const t of widths.filter((t) => t.dataset.row === "1")) {
      const [a, b] = span(t);
      for (const n of svg.querySelectorAll("text.lbl-t[data-row='1']")) {
        if (n.style.display === "none") continue;
        const [c, d] = span(n);
        if (c < b && d > a) n.style.display = "none";
      }
    }
    const DROP = Number(svg.dataset.drop) || 0, GROUND = 760 + DROP, H = 1000 + DROP; // the networks' room (site.js)
    const row = (n) => GROUND + 130 + LABEL_PX["lbl-w"] * k + (n > 0 ? n * 1.3 * LABEL_PX["lbl-t"] * k : 0);
    for (const t of svg.querySelectorAll("text[data-row]")) t.setAttribute("y", row(Number(t.dataset.row)));
    const lowest = Math.max(1, ...[...svg.querySelectorAll("text[data-row]")].filter((t) => t.style.display !== "none")
      .map((t) => Number(t.dataset.row) + (t.querySelector("tspan") ? 1 : 0)));
    // The row of traffic signs below the labels, at a readable size on screen (profile.js layoutSigns).
    const signsEnd = layoutSigns(svg, SIGN_PX * k, row(lowest) + 0.9 * LABEL_PX["lbl-t"] * k, k);
    const bottom = Math.max(H, row(lowest) + 0.5 * LABEL_PX["lbl-t"] * k, signsEnd);
    const [vx, vy] = svg.getAttribute("viewBox").split(" ").map(Number);
    if (Math.abs(vy + vh - bottom) > 1) {
      svg.setAttribute("viewBox", `${vx} ${vy} ${vw} ${bottom - vy}`);
      svg.querySelector("rect.bg")?.setAttribute("height", bottom - vy);
    }
    // Drag handles: a finger-sized grab area (44 px) and a knob that stays visible on a phone.
    for (const h of svg.querySelectorAll(".handle")) {
      const grab = h.querySelector(".grab"), knob = h.querySelector("circle.knob"), arrow = h.querySelector("path.knob");
      const bx = Number(knob.getAttribute("cx")), cy = Number(knob.getAttribute("cy"));
      const w = Math.max(80, 44 * k), r = Math.max(18, 8 * k);
      grab.setAttribute("x", bx - w / 2);
      grab.setAttribute("width", w);
      // On a touch screen only the knob takes the finger: a swipe anywhere else scrolls the
      // profile instead of changing a width by accident.
      if (coarse) { grab.setAttribute("y", cy - w / 2); grab.setAttribute("height", w); }
      knob.setAttribute("r", r);
      knob.setAttribute("stroke-width", r / 3.6);
      arrow.setAttribute("transform", `translate(${bx} ${cy}) scale(${r / 18}) translate(${-bx} ${-cy})`);
    }
    layoutTop(svg, k);
    // The title tag (Stav / Návrh in Porovnat) wraps its text at the new size.
    const title = svg.querySelector("text.lbl-title"), bg = svg.querySelector("rect.title-bg");
    if (title && bg) {
      const b = title.getBBox(), pad = 7 * k;
      Object.entries({ x: b.x - pad * 1.4, y: b.y - pad, width: b.width + pad * 2.8, height: b.height + pad * 2, rx: pad * 1.2 })
        .forEach(([a, v]) => bg.setAttribute(a, v));
    }
  }
}
addEventListener("resize", () => fitPhone());
// The top row (total width, cut ends A/B) at a readable size, and the view starting just above the
// highest thing drawn: no empty sky over a street without tall buildings, no label over a roof.
function layoutTop(svg, k) {
  const [vx, vy, vw, vh] = svg.getAttribute("viewBox").split(" ").map(Number);
  let top = Infinity;
  for (const c of svg.children) {
    if (c.matches("rect.bg, .top-row, .title-bg, .lbl-title, .handle")) continue;
    if (c.dataset.top) {
      // A torn building: its visible top and the floor label over it.
      const label = c.querySelector(".lbl-floor");
      top = Math.min(top, Number(c.dataset.top), label && label.style.display !== "none" ? label.getBBox().y : Infinity);
      continue;
    }
    const b = c.getBBox();
    if (b.width && b.height) top = Math.min(top, b.y);
  }
  if (!isFinite(top)) return;
  const r = 10 * k, pad = 8 * k;
  const y0 = Math.min(top - 2 * r - pad - 10 * k, 160);
  svg.setAttribute("viewBox", `${vx} ${y0} ${vw} ${vy + vh - y0}`);
  const bg = svg.querySelector("rect.bg");
  bg?.setAttribute("y", y0);
  bg?.setAttribute("height", vy + vh - y0);
  const cy = y0 + pad + r;
  // On a narrow street the total would run into A and B: they step aside, out over the edges.
  const total = svg.querySelector("text.lbl-total.top-row");
  const mid = Number(total?.getAttribute("x") || 0);
  const half = total ? (total.textContent.length * 0.56 * parseFloat(total.style.fontSize || 14 * k)) / 2 : 0;
  const ends = [Math.min(0, mid - half - 1.4 * r), Math.max(2 * mid, mid + half + 1.4 * r)];
  let end = 0;
  for (const e of svg.querySelectorAll(".top-row")) {
    if (e.tagName === "circle") {
      e.setAttribute("cx", ends[end]); e.setAttribute("cy", cy); e.setAttribute("r", r); e.setAttribute("stroke-width", 1.5 * k);
    } else if (e === total) e.setAttribute("y", cy + 0.36 * parseFloat(e.style.fontSize || 14 * k));
    else { e.setAttribute("x", ends[end++]); e.style.fontSize = `${13 * k}px`; e.setAttribute("y", cy + 0.36 * 13 * k); }
  }
}
// A wide profile that scrolls fades out on the side where more of it is hidden.
function scrollFade() {
  const wrap = $("#profile-wrap");
  const more = wrap.classList.contains("scrolls");
  wrap.classList.toggle("fade-l", more && wrap.scrollLeft > 4);
  wrap.classList.toggle("fade-r", more && wrap.scrollLeft + wrap.clientWidth < wrap.scrollWidth - 4);
  $("#scroll-hint").hidden = !more;
  document.querySelector(".scroll-btn.l").hidden = !wrap.classList.contains("fade-l");
  document.querySelector(".scroll-btn.r").hidden = !wrap.classList.contains("fade-r");
}
for (const b of document.querySelectorAll(".scroll-btn")) {
  b.onclick = () => { const wrap = $("#profile-wrap"); wrap.scrollBy({ left: Number(b.dataset.dir) * wrap.clientWidth * 0.7, behavior: "smooth" }); };
}
$("#profile-wrap").addEventListener("scroll", scrollFade, { passive: true });
