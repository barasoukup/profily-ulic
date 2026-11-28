// The flat roof: parapet, set-back floors, factory roof lights.
import { EDGE, tint } from "../svg.js";
import { FRAME, GLASS, GLINT, ROOF, WINDOWS } from "./tables.js";

export function drawFlatRoof(hs) {
  const { box, dark, f, kind, med, office, outline, poly, sawtooth, shade, style, top, trim, wall } = hs;
  // --- Flat roof: parapet, set-back floors, factory roof lights ---
  if (f.flat) {
    const back = f.roofRows ? (style === "funkce" || style === "moderni" ? 200 : 160) : 0;
    if (f.roofRows) {
      Object.assign(hs, { back });
      drawSetBackFloors(hs);
    }
    const zr = top + f.roofRows * f.storey;
    if (sawtooth) {
      // Saw-tooth roof lights standing on the roof, and a brick chimney behind.
      box(EDGE - 120, EDGE - 70, zr, zr + 420, wall, outline);
      for (let z = zr + 30; z < zr + 420; z += 30) box(EDGE - 120, EDGE - 70, z - 2, z + 2, tint(wall, 0.85));
      box(EDGE - 126, EDGE - 64, zr + 405, zr + 420, "#8a5a48");
      const tooth = (d) => zr + 170 - (d * 170) / 180; // height of the tooth's slope
      for (const d0 of [0, 180]) {
        poly([[d0, zr], [d0, zr + 170], [d0 + 180, zr]], ROOF.slate, outline);
        poly([[d0, zr], [d0, zr + 170], [d0 + 26, tooth(26)], [d0 + 26, zr]], FRAME);
        poly([[d0 + 5, zr + 8], [d0 + 5, zr + 160], [d0 + 21, tooth(21) - 8], [d0 + 21, zr + 8]], GLASS);
        poly([[d0 + 5, zr + 110], [d0 + 5, zr + 140], [d0 + 21, zr + 90], [d0 + 21, zr + 60]], GLINT);
      }
    } else {
      if (style === "plocha" && !office && !f.roofRows) { // the lift's machine room on the roof
        box(EDGE - 230, EDGE - 70, zr, zr + 230, tint(wall, 0.92), outline);
        box(EDGE - 236, EDGE - 64, zr + 222, zr + 236, dark);
        box(EDGE - 190, EDGE - 150, zr + 120, zr + 170, "#8f979d"); // louvre
      }
      if (style === "hala") { // an air-handling unit on the roof
        box(EDGE - 150, EDGE - 60, zr, zr + 100, "#aab2b8", outline);
        for (let d = EDGE - 140; d < EDGE - 70; d += 18) box(d, d + 8, zr + 50, zr + 88, "#8f979d");
      }
      if (med) {
        // The south's flat roof terrace: a parapet with a balustrade (Spain, Italy, Portugal), Malta's plain parapet a
        // metre high, a low one in Cyprus; a water tank or a stair house on it.
        const ph = kind === "kypr" ? 50 : 100, top2 = zr + ph;
        box(EDGE - 170, EDGE - 70, zr, zr + 210, tint(wall, 0.95), outline); // the stair house
        box(EDGE - 176, EDGE - 64, zr + 204, zr + 214, tint(wall, 0.75));
        if (kind === "malta" || kind === "kypr") box(-16, EDGE, zr, top2, tint(wall, 1.03), outline);
        else {
          box(-20, EDGE, zr, zr + 18, trim, outline);
          for (let d = -10; d < EDGE - 10; d += 22) box(d, d + 9, zr + 18, top2 - 14, trim, { stroke: dark, "stroke-width": 0.8, "vector-effect": "non-scaling-stroke" });
          box(-20, EDGE, top2 - 14, top2, trim, outline);
        }
        box(-22, EDGE, top2, top2 + 6, tint(wall, 0.8));
      } else if (style === "moderni") { // a crisp parapet with a dark coping
        box(back - 4, EDGE, zr, zr + 50, wall, outline);
        box(back - 8, EDGE, zr + 50, zr + 56, "#3c3f43");
      } else if (style === "povalecny") { // a thin parapet under a metal coping
        box(back - 4, EDGE, zr, zr + 30, tint(wall, 0.96), outline);
        box(back - 9, EDGE, zr + 30, zr + 36, "#6d7074");
      } else if (style === "funkce") { // a thin slab overhanging the wall, its shadow under it
        box(back, EDGE, zr - 12, zr, shade);
        box(back - 45, EDGE, zr, zr + 24, trim, outline);
      } else {
        box(back - 8, EDGE, zr, zr + 40, tint(wall, 0.93), outline);
        box(back - 8, EDGE, zr + 32, zr + 42, dark);
      }
    }
  }
}

function drawSetBackFloors(hs) {
  const { back, box, colAxes, f, full, kind, office, outline, poly, style, top, trim, wall, window } = hs;
  if (style === "moderni") { // a terrace behind a glass balustrade in front of the set-back floor
    box(-30, EDGE, top - 8, top + 14, "#e9e8e4", outline);
    box(-26, back, top + 14, top + 110, "#bcd3dc", { "fill-opacity": 0.55 });
    box(-26, back, top + 106, top + 112, "#8e9aa0");
  } else if (style === "funkce") { // a roof terrace with a tubular railing in front of the set-back floor
    box(-45, EDGE, top - 12, top + 12, trim, outline);
    for (const z of [55, 100]) box(-30, back, top + z, top + z + 5, "#5d5f62");
    for (const d of [-30, back / 2 - 10]) box(d, d + 5, top + 12, top + 105, "#5d5f62");
  } else if (style === "povalecny") { // a terrace in front of the set-back floor: a thin slab, a metal railing
    box(-10, back, top, top + 16, tint(wall, 0.93), outline);
    box(-6, back, top + 100, top + 105, "#6d7074");
    for (let d = -6; d < back; d += 14) box(d, d + 2.5, top + 16, top + 100, "#6d7074");
  } else box(0, back, top, top + 40, tint(wall, 0.93), outline); // parapet in front of the set-back floor
  box(back, EDGE, top, top + f.roofRows * f.storey, wall, outline); // the set-back floor runs on past the cut
  if (style === "funkce" || style === "moderni") { // the set-back floor is glazed towards its terrace: one band
    for (let k = 0; k < f.roofRows; k++) {
      const z = top + k * f.storey + 0.25 * f.storey, h = 0.55 * f.storey;
      box(back + 6, EDGE - 46, z - 4, z + h + 4, FRAME);
      box(back + 10, EDGE - 50, z, z + h, GLASS);
      // its mullions on the lines of the windows below: the Prague window's casement, the modern window's edge
      const mullions = style === "funkce" ? [150 + Math.min(200, EDGE - 200) * 0.78] : [EDGE - 160, (EDGE - 160 + EDGE - 50) / 2];
      for (const d of mullions) box(d - 2, d + 2, z, z + h, FRAME);
    }
  } else if (style === "povalecny") { // the set-back floor's window in the axis of the windows below
    const win = WINDOWS.povalecny, wd0 = (126 + EDGE - 30 - win.w) / 2;
    for (let k = 0; k < f.roofRows; k++) for (const wd of [wd0, 2 * wd0 + win.w / 2 - 60]) if (wd >= back + 10) {
      const z = top + k * f.storey + win.sill * f.storey, h = win.h * f.storey;
      box(wd - 5, wd + win.w + 5, z - 5, z + h + 5, FRAME);
      box(wd, wd + win.w, z, z + h, GLASS);
      poly([[wd + win.w * 0.55, z + h], [wd + win.w, z + h], [wd + win.w, z + h * 0.5]], GLINT);
      box(wd + win.w / 2 - 3, wd + win.w / 2 + 3, z, z + h, FRAME);
      box(wd - 8, wd + win.w + 8, z + h + 5, z + h + 26, tint(wall, 0.94), outline); // the shutter box
      box(wd - 10, wd + win.w + 10, z - 12, z - 5, "#b9b6ae");
    }
  } else if (office) { // the offices' ribbon window, its mullions on the grid of the floors below
    for (let k = 0; k < f.roofRows; k++) {
      const z0 = top + k * f.storey, h = f.storey, g0 = z0 + h * 0.12, g1 = z0 + h * 0.78;
      box(back, EDGE, z0 + h * 0.08, z0 + h * 0.82, FRAME);
      box(back + 8, EDGE, g0, g1, GLASS);
      poly([[EDGE - 150, g1], [EDGE - 100, g1], [EDGE - 160, g0], [EDGE - 210, g0]], GLINT);
      for (let d = 8 + 120; d < EDGE; d += 120) if (d > back + 8) box(d - 3, d + 3, g0, g1, FRAME);
    }
  } else if (hs.setBack) for (let k = 0; k < f.roofRows; k++) hs.setBack(top + k * f.storey, full + k, back);
  else { // the columns of the floors below where they stand on the set-back floor
    const win = WINDOWS[kind] || WINDOWS[style], cols = colAxes(win.w).map((c) => c - win.w / 2);
    for (let k = 0; k < f.roofRows; k++) for (const [i, d0] of cols.entries()) if (d0 >= back + 10 && d0 < EDGE)
      window(d0, top + k * f.storey + win.sill * f.storey, win.w, win.h * f.storey, (full + k) * 3 + i);
  }
}
