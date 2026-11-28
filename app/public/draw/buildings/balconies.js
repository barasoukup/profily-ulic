// The regional looks: balconies, galleries, cornices (docs/house-types-europe.md).
import { DOOR, GLASS } from "./tables.js";
import { EDGE, tint } from "../svg.js";
import { GABLE_RISE, gableAxes, gableOn } from "./form.js";

export function addBalconyHelpers(hs) {
  const { box, outline, poly, wall } = hs;
  // --- The regional looks: balconies, galleries, cornices (docs/house-types-europe.md) ---
  const IRON = "#2b2d2f";
  // An iron railing seen from the side: its top and bottom rails and the bars between them.
  const railing = (d0, d1, z, h, col = IRON) => {
    box(d0, d1, z + h - 5, z + h, col);
    box(d0, d1, z + 8, z + 11, col);
    for (let d = d0; d <= d1 - 3; d += 11) box(d, d + 3, z, z + h, col);
  };
  // A balcony: its slab with a moulded edge, brackets under it, the railing.
  const balcony = (z, deep, h = 100, slab = 15) => {
    box(-deep, 0, z - 6, z, tint(wall, 0.75));
    box(-deep - 4, 0, z, z + slab, tint(wall, 1.06), outline);
    for (const d of deep > 50 ? [-deep + 14, -22] : [-deep / 2]) poly([[d - 9, z], [d + 9, z], [d, z - 34]], tint(wall, 0.9), outline);
    railing(-deep, -3, z + slab, h);
  };
  Object.assign(hs, { railing, balcony });
}

// The regional looks: balconies, galleries, cornices (docs/house-types-europe.md), by the look.
const BALCONIES = { haussmann: drawHaussmannBalconies, med: drawMediterraneanBalconies, cihlovy: drawBrickHouseBalconies, dansky: drawDanishBalconies,
  gabled: drawGabledBalconies, stenstad: drawStenstadBalconies };
function balconyLook({ kind, med, seed, full }) {
  if (kind === "haussmann") return kind;
  if (med) return "med";
  if (kind === "cihlovy" || kind === "dansky") return kind;
  if (GABLE_RISE[kind]) return "gabled";
  return kind === "stenstad" && seed % 3 === 0 && full >= 4 ? "stenstad" : null;
}
export function drawRegionalBalconies(hs) {
  BALCONIES[balconyLook(hs)]?.(hs);
}

function drawHaussmannBalconies(hs) {
  const { balcony, box, f, floorZ, full, outline, railing, wall } = hs;
  // The long stone balconies with iron railings on the 2nd and 5th floor (2e and 5e étage), on the others a French
  // balconette at the window; a cordon over the entresol. A low Brussels house: a balconette on the 1st floor only.
  const long = full >= 5 ? new Set([2, full - 1]) : new Set();
  for (let k = 1; k < full; k++) {
    const z = floorZ(k);
    if (long.has(k)) { balcony(z, 70); box(0, EDGE, z, z + 15, tint(wall, 1.06), outline); railing(0, EDGE, z + 15, 100); } // and along the wall
    else if (full >= 5 || k === 1) railing(-15, -2, z + f.storey * 0.05, 95);
  }
}

function drawMediterraneanBalconies(hs) {
  const { balcony, box, det, f, floorZ, full, kind, outline, pal, poly, seed, shade, top, trim, wall } = hs;
  // The crowning cornice; on every floor a small balcony at each window (deeper on the piano nobile), the iron railing.
  if (!f.flat) { box(-40, EDGE, top - 30, top, trim, outline); box(0, EDGE, top - 46, top - 30, shade); }
  else box(-30, EDGE, top - 26, top, trim, outline);
  if (kind === "galeria") {
    // Northern Spain's glazed gallery (mirador) over the facade from the 1st floor: white frames in a dense grid.
    for (let k = 1; k < full; k++) {
      const z = floorZ(k), h = f.storey;
      box(-84, 0, z - 8, z + 6, tint(wall, 0.85), outline);
      if (k === 1) for (const d of [-70, -20]) poly([[d - 10, z - 8], [d + 10, z - 8], [d, z - 46]], tint(wall, 0.8), outline);
      box(-80, -2, z + 6, z + h - 6, "#f4f4f0", outline);
      box(-74, -8, z + 0.28 * h, z + h - 14, "#7f95a8");
      poly([[-50, z + h - 14], [-8, z + h - 14], [-8, z + 0.5 * h]], "#a9bccb");
      for (let d = -74 + 22; d < -8; d += 22) box(d - 2, d + 2, z + 0.28 * h, z + h - 14, "#f4f4f0");
      box(-74, -8, z + 0.66 * h - 2, z + 0.66 * h + 2, "#f4f4f0");
      box(-80, -2, z + 0.24 * h, z + 0.28 * h, "#f4f4f0");
    }
  } else if (kind === "malta") {
    // The gallarija: a closed wooden balcony on the 1st floor (and the 2nd of a taller house) on stone brackets, its
    // lower third panelled, louvred windows over it, a little lid on top.
    const col = pal("maltaAccent");
    for (const k of full >= 4 ? [1, 2] : full >= 2 ? [1] : []) {
      const z = floorZ(k) + 20, h = f.storey * 0.8;
      for (const d of [-60, -35, -10]) poly([[d - 9, z], [d + 9, z], [d + 4, z - 50], [d - 2, z - 50]], tint(wall, 0.92), outline);
      box(-74, 0, z - 10, z, tint(wall, 0.95), outline);
      box(-70, 0, z, z + h, col, { stroke: tint(col, 0.65), "stroke-width": 1.5, "vector-effect": "non-scaling-stroke" });
      box(-66, -4, z + h * 0.3 - 3, z + h * 0.3 + 3, tint(col, 1.3));
      for (const [a, b] of [[-64, -40], [-34, -8]]) {
        box(a, b, z + h * 0.38, z + h - 14, tint(col, 0.75));
        for (let zz = z + h * 0.38 + 8; zz < z + h - 16; zz += 9) box(a + 2, b - 2, zz - 1.5, zz + 1.5, tint(col, 1.25));
      }
      poly([[-80, z + h], [0, z + h], [0, z + h + 26], [-74, z + h + 8]], tint(col, 0.8), outline);
    }
  } else if (kind === "kypr") {
    if (full >= 2) balcony(floorZ(1), 80, 95, 12); // one balcony over the entrance
  } else {
    for (let k = 1; k < full; k++) {
      const z = floorZ(k), luck = (((k * 5 + seed * 31) * 2654435761) >>> 0) % 7;
      balcony(z, k === 1 ? 65 : 45, 95, 10);
      if (det.blinds && luck < 3) { // a striped canvas awning (toldo) over the balcony
        const zt = z + f.storey * 0.92, AW = luck === 1 ? "#3f7a5a" : luck === 2 ? "#b8553f" : "#3c6fa8";
        poly([[0, zt], [-70, zt - 80], [-70, zt - 104], [0, zt - 24]], AW, outline);
        poly([[0, zt - 8], [-70, zt - 88], [-70, zt - 96], [0, zt - 16]], "#f6f1e6");
        box(-74, -62, zt - 130, zt - 96, AW, outline); // the valance
      }
    }
  }
}

function drawBrickHouseBalconies(hs) {
  const { box, f, outline, shade, top } = hs;
  // The white wooden cornice on small brackets, a band of sandstone over the ground floor.
  box(-35, EDGE, top - 34, top, "#f4f2ec", outline);
  for (let d = -30; d < 0; d += 14) box(d, d + 6, top - 52, top - 34, "#e6e2d8");
  box(0, EDGE, top - 50, top - 34, shade);
  box(-8, EDGE, f.ground - 14, f.ground, "#d8cfb5", outline);
}

function drawDanishBalconies(hs) {
  const { box, f, floorZ, full, outline, railing, seed, shade, top } = hs;
  box(-10, EDGE, f.ground - 18, f.ground, "#ece5d5", outline); // a light rendered band over the shop floor
  box(-30, EDGE, top - 30, top, "#ece5d5", outline); // the cornice
  box(0, EDGE, top - 46, top - 30, shade);
  if (seed % 2) for (let k = 1; k < full; k++) railing(-14, -2, floorZ(k) + f.storey * 0.25, 70); // French balconettes
}

function drawGabledBalconies(hs) {
  const { arch, box, f, kind, outline, pal } = hs;
  box(-8, EDGE, f.ground - 14, f.ground, kind === "hanza" ? "#bdb6a4" : "#d8cfb5", outline); // a band over the hall
  if (kind === "hanza") { // the limestone portal round the door (in the front column under a gable turned towards us)
    const dd = gableOn(kind) ? gableAxes(kind)[0] - 65 : 0;
    box(6 + dd, 124 + dd, 0, Math.min(240, f.ground * 0.72) + 60, "#bdb6a4", outline);
    box(16 + dd, 114 + dd, 14, Math.min(240, f.ground * 0.72) + 10, pal("hanza") === "#efeee6" ? "#6b4a30" : DOOR);
    arch(65 + dd, Math.min(240, f.ground * 0.72) + 10, 49, "#bdb6a4");
    arch(65 + dd, Math.min(240, f.ground * 0.72) + 10, 41, GLASS);
  }
}

function drawStenstadBalconies(hs) {
  const { balcony, floorZ } = hs;
  for (const k of [2, 3]) balcony(floorZ(k), 60, 95, 12); // the Jugend balconies with iron railings
}
