// The gable turned towards us (?stit=1).
import { houseHash } from "../../house-looks.js";
import { el, tint } from "../svg.js";
import { GABLE_C, GABLE_LOW, GABLE_TOP, gableAxes, gableC, gableForm } from "./form.js";
import { WINDOWS } from "./tables.js";

// The gable turned towards us (?stit=1): its outline over the wall's width, the roof hidden behind it; its windows in
// the columns of the floors below (GABLE_AXES), one in the axis where it narrows; the hoist beam (end-on, under its
// little hood in Amsterdam) above the uppermost window, in Tallinn over a loading door in the axis.
export function drawGableOutline(hs) {
  const { X, box, dot, f, g, info, kind, outline, poly, surface, top, wall, window } = hs;
  const S = f.storey, c = gableC(), form = gableForm(kind, info), win = WINDOWS[kind], axes = gableAxes(kind), ax0 = axes[0], ax1 = axes.at(-1);
  const sc = c / GABLE_C; // the widths of the outline grow with a wider house (the variant)
  const u = (k) => top + k * S * (f.n < 2 ? GABLE_LOW : 1);
  const STONE_W = "#efe9dc", SANDSTONE = "#e3d6b8", CAP = kind === "hanza" ? "#8f8a80" : STONE_W;
  // The left half of the outline as [half-width, height in storeys], from the wall's top up; mirrored for the right.
  let half, pedestal = null;
  const steps = (list, crown) => { const h = [[c, 0]]; let w = c; for (const [k, hw] of list) { h.push([w, k], [hw, k]); w = hw; } h.push([w, crown]); return h; };
  if (form === "trap" && kind === "stit") half = steps([[0.86, 155 * sc], [1.12, 122 * sc], [1.38, 90 * sc]], 2.22);
  else if (form === "trap") half = steps([[0.75, 135 * sc], [1.2, 100 * sc], [1.65, 68 * sc]], 2.3);
  else if (form === "hals") half = [[c, 0], [c, 0.86], [80 * sc, 0.86], [80 * sc, 2.0], [96 * sc, 2.0], [96 * sc, 2.06]];
  else if (form === "klok") {
    half = [[c, 0], [c, 0.86]];
    const B = 112 * sc;
    for (let i = 1; i <= 10; i++) { const t = i / 10, sm = t * t * (3 - 2 * t); half.push([c - (c - B) * sm, 0.86 + 0.5 * t]); }
    half.push([B, 1.9]);
    for (let i = 1; i <= 8; i++) { const v = (i / 8) * (Math.PI / 2); half.push([B * Math.cos(v), 1.9 + ((90 * sc) / S) * Math.sin(v)]); }
  } else half = [[c, 0], [0, GABLE_TOP.plain]];
  const left = half.map(([hw, k]) => [c - hw, u(k)]);
  const right = left.slice().reverse().map(([d, z]) => [2 * c - d, z]);
  let pts = [...left, ...right];
  if (form === "hals") { // the pediment over the neck's cornice: triangular or rounded (by the house's place)
    const zc = u(2.06), round = (houseHash(info) >> 3) % 2;
    const ped = round ? Array.from({ length: 9 }, (_, i) => { const v = (i / 8) * Math.PI; return [c - 88 * sc * Math.cos(v), zc + 70 * Math.sin(v)]; })
      : [[c - 92 * sc, zc], [c, zc + 0.3 * S], [c + 92 * sc, zc]];
    pts = [...left, ...ped, ...right];
    pedestal = ped;
  }
  // The gable itself over the whole wall, outlined along its edge only (no line, no step at its foot).
  poly(pts, wall);
  el("path", { d: "M" + pts.map(([d, z]) => `${X(d)} ${surface - z}`).join(" L"), fill: "none", ...(kind === "hanza" ? { stroke: tint(wall, 0.5), "stroke-width": 2.2, "vector-effect": "non-scaling-stroke" } : outline) }, g);
  // How wide the gable is at height z (the run of the outline holding the axis).
  const hwAt = (z) => {
    let best = -Infinity;
    for (let i = 0; i + 1 < left.length; i++) {
      const [d0, z0] = left[i], [d1, z1] = left[i + 1];
      if ((z0 <= z && z <= z1) || (z1 <= z && z <= z0)) best = Math.max(best, z1 === z0 ? Math.min(d0, d1) : d0 + ((z - z0) / (z1 - z0)) * (d1 - d0));
    }
    return best === -Infinity ? 0 : c - best;
  };
  const fits = (dc, w, z0, z1) => [z0, (z0 + z1) / 2, z1].every((z) => Math.abs(dc - c) + w / 2 + 16 <= hwAt(z));
  if (kind === "stit") for (let z = top + 30; z < u(2.6); z += 30) { const hw = hwAt(z) - 6; if (hw > 20) box(c - hw, c + hw, z - 1.5, z + 1.5, tint(wall, 0.88)); }
  else box(c - hwAt(top + 20), c + hwAt(top + 20), top - 6, top + 6, tint(wall, 0.9)); // the band between the floors and the gable
  // The copings along the outline (white sandstone in Amsterdam, grey stone in Tallinn).
  const open = pts.slice(1, -1);
  el("path", { d: "M" + open.map(([d, z]) => `${X(d)} ${surface - z}`).join(" L"), fill: "none", stroke: CAP, "stroke-width": kind === "hanza" ? 8 : 11, "stroke-linejoin": "round" }, g);
  if (pedestal) poly(pedestal, SANDSTONE, outline); // the pediment in sandstone
  // The claw pieces at the neck's shoulders, with a scroll at the outer end; the bell's scrolls at its foot.
  if (form === "hals" || form === "klok") for (const sgn of [-1, 1]) {
    if (form === "hals") {
      const claw = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12, sm = t * t * (3 - 2 * t); claw.push([c + sgn * (c - 14 - (c - 94 * sc) * t), u(0.86) + 40 + (0.5 * S - 40) * sm]); } // an S scroll
      claw.push([c + sgn * 80 * sc, u(0.86)], [c + sgn * (c - 4), u(0.86)]);
      poly(claw, SANDSTONE, outline);
    }
    dot(c + sgn * (c - 34), u(0.86) + 26, 24, SANDSTONE);
    dot(c + sgn * (c - 34), u(0.86) + 26, 15, tint(SANDSTONE, 0.8));
    dot(c + sgn * (c - 37), u(0.86) + 28, 9, SANDSTONE);
  }
  if (form === "klok") { // a stone vase on the round top, a little scroll each side of its foot
    const zt = u(1.9) + 90 * sc;
    box(c - 22, c + 22, zt, zt + 12, STONE_W, outline);
    dot(c, zt + 34, 20, STONE_W);
    box(c - 8, c + 8, zt + 50, zt + 62, STONE_W);
    for (const sgn of [-1, 1]) dot(c + sgn * 32, zt + 4, 10, STONE_W);
  }
  if (form === "trap" && kind === "stit") { box(c - 16, c + 16, u(2.22) + 4, u(2.22) + 16, STONE_W, outline); dot(c, u(2.22) + 30, 14, STONE_W); } // a stone ball on top
  // The windows: a floor of the gable holds both columns where they fit, else one window in the axis.
  const gh = win.h * 0.85 * S, ww = win.w;
  hs.noBox = true;
  let lastTop = top;
  for (let k = 0; k < 3; k++) {
    const z0 = u(k + win.sill), z1 = z0 + gh;
    if (fits(ax0, ww, z0, z1) && fits(ax1, ww, z0, z1)) { for (const [i, a] of axes.entries()) window(a - ww / 2, z0, ww, gh, 20 + k * 3 + i); lastTop = z1; }
    else if (fits(c, ww, z0, z1)) { window(c - ww / 2, z0, ww, gh, 20 + k * 3); lastTop = z1; }
    else break;
  }
  // Tallinn: the loading door in the axis over the windows; the beam above it (or above the uppermost window).
  let beamZ = lastTop + 80; // the hook and its rope hang clear of the uppermost window
  if (kind === "hanza") {
    const dw = 50, z0 = lastTop + 0.15 * S, z1 = z0 + 0.3 * S;
    if (fits(c, dw - 14, z0, z1)) {
      box(c - dw / 2 - 5, c + dw / 2 + 5, z0 - 5, z1 + 5, "#bdb6a4");
      box(c - dw / 2, c + dw / 2, z0, z1, "#6b4a30");
      box(c - 1.5, c + 1.5, z0, z1, tint("#6b4a30", 0.7));
      beamZ = z1 + 66;
    }
  }
  hs.noBox = false;
  box(c - 14, c + 14, beamZ, beamZ + 26, "#5b4632", outline); // the beam's end
  box(c - 1.5, c + 1.5, beamZ - 40, beamZ, "#3a3a3a"); // its hook
  box(c - 7, c + 1.5, beamZ - 44, beamZ - 40, "#3a3a3a");
  if (kind === "stit") poly([[c - 36, beamZ + 30], [c, beamZ + 56], [c + 36, beamZ + 30]], "#5b4632", outline); // the hood over it
}
