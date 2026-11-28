// Windows and ground floors of the blocks of flats: modern, functionalist, postwar, panel.
import { EDGE, tint } from "../svg.js";
import { FRAME, GLASS, GLINT, LIT, PV_METAL, PV_SHUTTER, WINDOWS } from "./tables.js";

export function drawModernFacade(hs) {
  const { box, f, floorZ, full, plinth, poly, seed, top, wall } = hs;
  // A new-built block of flats (after 1995): crisp render with an accent panel (anthracite or
  // larch), tall windows down to the floor in anthracite frames, a glazed lobby on the ground
  // floor; glass balconies and the slab edges are drawn with what sticks out.
  const ANTH = "#3c3f43", LARCH = "#b98a5a";
  const accentPanel = seed % 2 ? ANTH : LARCH;
  box(EDGE - 150, EDGE, plinth[0], top, accentPanel); // the accent panel at the back
  if (accentPanel === LARCH) for (let d = EDGE - 140; d < EDGE; d += 14) box(d, d + 2, plinth[0], top, tint(LARCH, 0.85));
  // Lobby: a glazed entrance, anthracite frame, a letter-box panel.
  box(10, 150, plinth[0], f.ground - 30, ANTH);
  box(18, 142, plinth[0] + 8, f.ground - 38, GLASS);
  poly([[90, f.ground - 38], [142, f.ground - 38], [142, f.ground - 120]], GLINT);
  box(78, 82, plinth[0] + 8, f.ground - 38, ANTH);
  box(165, EDGE - 165, plinth[0] + 60, f.ground - 50, ANTH); // ground-floor window
  box(171, EDGE - 171, plinth[0] + 66, f.ground - 56, GLASS);
  box(EDGE - 115, EDGE - 35, plinth[0] + 60, f.ground - 50, ANTH); // and one in the accent panel
  box(EDGE - 109, EDGE - 41, plinth[0] + 66, f.ground - 56, GLASS);
  const french = (d0, d1, z, h, n) => { // a window to the floor with a fixed lower pane
    const luck = (((n + seed * 31) * 2654435761) >>> 0) % 13;
    box(d0, d1, z, z + h, ANTH);
    box(d0 + 5, d1 - 5, z + 5, z + h - 5, luck === 5 ? LIT : GLASS);
    poly([[d0 + (d1 - d0) * 0.5, z + h - 5], [d1 - 5, z + h - 5], [d1 - 5, z + h * 0.55]], luck === 5 ? "#f8e7b5" : GLINT);
    box(d0, d1, z + 95, z + 99, ANTH); // the glass balustrade's line inside
    box((d0 + d1) / 2 - 2, (d0 + d1) / 2 + 2, z + 99, z + h, ANTH);
  };
  for (let k = 1; k < full; k++) {
    const z0 = floorZ(k), h = f.storey;
    french(20, 120, z0 + 10, 0.82 * h, k * 3); // to the balcony at the street end
    french(150, EDGE - 160, z0 + 10, 0.82 * h, k * 3 + 1);
    french(EDGE - 120, EDGE - 30, z0 + 10, 0.82 * h, k * 3 + 2); // in the accent panel, a pier's width from the cut
    box(0, EDGE, z0 - 3, z0 + 3, tint(wall, 0.9)); // floor line
  }
}

export function drawFunctionalistFacade(hs) {
  const { box, dot, f, floorZ, full, outline, plinth, poly, seed, trim, wall } = hs;
  // A functionalist tenement (1925–45): smooth light plaster in horizontal bands (a parapet band
  // on every floor), a clad ground floor with a shop window in a steel frame and the house door
  // under a thin canopy, "Prague windows" (a large undivided fixed pane between two narrow
  // casements with top lights) lying flat, a balcony door at the street end, sometimes a bay.
  const STEEL = "#3f4144";
  const cladding = seed % 2 ? ["#d8ccb3", 40, 1000] : seed % 4 === 0 ? ["#4f6a5a", 20, 10] : ["#7a4a3c", 20, 10];
  const [clad, cw, chh] = cladding; // travertine slabs, or ceramic tiles 20 × 10 cm
  box(0, EDGE, plinth[0], f.ground - 20, clad);
  for (let z = plinth[0] + (chh < 100 ? chh : 40); z < f.ground - 20; z += chh < 100 ? chh : 40) box(0, EDGE, z - 0.5, z + 0.5, chh < 100 ? "#e9e4d8" : tint(clad, 0.9), chh < 100 ? { "fill-opacity": 0.5 } : {});
  for (let d = cw; d < EDGE; d += cw) box(d - 0.5, d + 0.5, plinth[0], f.ground - 20, chh < 100 ? "#e9e4d8" : tint(clad, 0.9), chh < 100 ? { "fill-opacity": 0.5 } : {});
  // House door: steel, glass behind a three-bar grille, a top light, a thin canopy over the pavement.
  const doorTop = Math.min(240, f.ground - 90);
  box(14, 134, 0, doorTop + 48, STEEL);
  box(22, 126, 8, doorTop, GLASS);
  box(22, 126, doorTop + 8, doorTop + 40, GLASS);
  for (let z = 60; z < doorTop; z += 30) box(22, 126, z, z + 4, STEEL);
  box(-90, 0, doorTop + 52, doorTop + 58, tint(wall, 0.7));
  box(-90, 140, doorTop + 58, doorTop + 70, trim, outline);
  // Shop: a big window in a steel frame on a granite sill, the fascia for its lettering.
  const s0 = 160, s1 = EDGE - 40, sTop = f.ground - 80;
  box(s0 - 6, s1 + 6, 40, sTop + 6, STEEL);
  box(s0, s1, 46, sTop, GLASS);
  poly([[s0 + (s1 - s0) * 0.55, sTop], [s1, sTop], [s1, sTop - 120]], GLINT);
  box((s0 + s1) / 2 - 2, (s0 + s1) / 2 + 2, 46, sTop, STEEL);
  box(s0 - 6, s1 + 6, sTop + 6, sTop + 36, "#efe6d2", outline); // fascia with "letters"
  for (let i = 0; i < 4; i++) box(s0 + 20 + i * 34, s0 + 38 + i * 34, sTop + 14, sTop + 28, STEEL);
  const W = Math.min(200, EDGE - 30 - 150 - 20), wd = 150;
  const prague = (z, h, n) => { // the "Prague window": thin frames, the middle pane undivided
    const luck = (((n + seed * 31) * 2654435761) >>> 0) % 13, d = wd, w = W;
    box(d - 4, d + w + 4, z - 4, z + h + 4, FRAME);
    box(d, d + w, z, z + h, luck === 5 ? LIT : GLASS);
    poly([[d + w * 0.5, z + h], [d + w * 0.78, z + h], [d + w * 0.78, z + h * 0.45]], luck === 5 ? "#f8e7b5" : GLINT);
    for (const t of [0.22, 0.78]) box(d + w * t - 2, d + w * t + 2, z, z + h, FRAME);
    for (const [a0, a1] of [[d, d + w * 0.22], [d + w * 0.78, d + w]]) box(a0, a1, z + h * 0.74 - 2, z + h * 0.74 + 2, FRAME); // top lights of the casements
    if (luck === 2 || luck === 9) for (let i = 0; i < 5; i++) dot(d + 10 + (i * (w - 20)) / 4, z + 4, 8, i % 2 ? "#e2607a" : "#6fae4f");
  };
  for (let k = 1; k < full; k++) {
    const z0 = floorZ(k), h = f.storey, sill = z0 + 0.3 * h;
    box(0, EDGE, sill - 60, sill - 10, tint(wall, 0.95)); // parapet zone and band: the horizontal lines
    box(-4, EDGE, sill - 10, sill - 2, "#f4efe4", outline);
    prague(sill, 0.48 * h, k);
    box(20, 104, z0, z0 + 0.82 * h, FRAME); // balcony door at the street end
    box(25, 99, z0 + 5, z0 + 0.82 * h - 5, GLASS);
    box(25, 99, z0 + 0.62 * h, z0 + 0.62 * h + 4, FRAME);
  }
}

export function drawPostwarFacade(hs) {
  const { box, dot, f, floorZ, full, outline, plinth, poly, seed, wall } = hs;
  // A postwar block of flats in the west (1946–90; Bára 23. 11. 2026): plain smooth render without ornament; a glazed
  // house door in a light metal frame up two steps under a thin slab, regular rows of wide windows with roller
  // shutters (the shutter box over each, some let half down), a balcony door at the street end. No panel joints, no
  // machine room. The balconies stick out (below), the flat roof has a thin parapet (the roof).
  const doorTop = Math.min(230, f.ground - 50);
  box(6, 138, 0, 10, tint(plinth[1], 1.18), outline); // two steps
  box(12, 132, 10, 20, tint(plinth[1], 1.18), outline);
  box(16, 126, 20, doorTop + 40, PV_METAL);
  for (const [d0, d1] of [[22, 68], [72, 120]]) {
    box(d0, d1, 26, doorTop, GLASS);
    poly([[d0 + (d1 - d0) * 0.5, doorTop], [d1, doorTop], [d1, doorTop - 50]], GLINT);
  }
  box(22, 120, doorTop + 6, doorTop + 34, GLASS); // top light
  box(60, 64, 90, 140, "#5d5f62"); // handle
  box(-70, 140, doorTop + 40, doorTop + 46, tint(wall, 0.72)); // the canopy's shadow and its thin slab
  box(-75, 140, doorTop + 46, doorTop + 58, "#dcd8cf", outline);
  // A window of two casements with its roller shutter.
  const shuttered = (d, z, w, h, n) => {
    const luck = (((n + seed * 31) * 2654435761) >>> 0) % 13, lit = luck === 5;
    const down = luck === 3 || luck === 10 ? 0.5 : luck === 7 ? 0.85 : 0.1; // how far the shutter is let down
    box(d - 5, d + w + 5, z - 5, z + h + 5, FRAME);
    box(d, d + w, z, z + h, lit ? LIT : GLASS);
    poly([[d + w * 0.55, z + h], [d + w, z + h], [d + w, z + h * 0.5]], lit ? "#f8e7b5" : GLINT);
    box(d + w / 2 - 3, d + w / 2 + 3, z, z + h, FRAME);
    box(d, d + w, z + h * (1 - down), z + h, PV_SHUTTER);
    for (let zz = z + h - 8; zz > z + h * (1 - down) + 2; zz -= 8) box(d, d + w, zz - 1, zz, tint(PV_SHUTTER, 0.85));
    box(d - 8, d + w + 8, z + h + 5, z + h + 26, tint(wall, 0.94), outline); // the shutter box
    box(d - 10, d + w + 10, z - 12, z - 5, "#b9b6ae"); // the sill
    if ((luck === 2 || luck === 9) && !lit) for (let i = 0; i < 5; i++) dot(d + 10 + (i * (w - 20)) / 4, z + 5, 8, i % 2 ? "#e2607a" : "#6fae4f");
  };
  const win = WINDOWS.povalecny, wd = (126 + EDGE - 30 - win.w) / 2; // in the axis between the door and the back
  const wd2 = 2 * wd + win.w / 2 - 60; // the next window, on the pitch from the balcony door, across the cut
  for (const [i, d] of [wd, wd2].entries()) shuttered(d, plinth[0] + 0.3 * f.ground, win.w, win.h * f.storey, i);
  for (let k = 1; k < full; k++) {
    const z0 = floorZ(k), h = f.storey;
    box(20, 100, z0, z0 + 0.8 * h, FRAME); // the balcony door at the street end, its shutter box
    box(26, 94, z0 + 6, z0 + 0.8 * h - 6, GLASS);
    box(26, 94, z0 + 0.55 * h, z0 + 0.55 * h + 4, FRAME);
    box(14, 106, z0 + 0.8 * h, z0 + 0.8 * h + 20, tint(wall, 0.94), outline);
    for (const [i, d] of [wd, wd2].entries()) shuttered(d, z0 + win.sill * h, win.w, win.h * h, k * 3 + i);
  }
}

export function drawPanelFacade(hs) {
  const { accent, box, dot, f, floorZ, full, outline, plinth, poly, seed, top, wall } = hs;
  // A panel house (revitalised): the panel grid of joints, loggias let into the corner by the
  // street with coloured parapets, wide windows in the panel bays, an entrance under a slab.
  // Sizes of a Czech panel house (cm; T06B, VVÚ-ETA, PS-69): storey 280, a raised ground floor on
  // a 100 cm plinth, windows 200 × 150 on a 90 cm parapet set deep in the insulation, loggias
  // 120 deep at the street corner, the entrance at street level, panel joints showing through.
  const LOG = 120; // depth of the loggias from the street facade
  const STEP = 0; // the entrance is level with the pavement (Bára)
  const joint = tint(wall, 0.76);
  // A storey stretched by the building's known height (often 3.3–3.5 m from IPR) gets a taller
  // window on a higher parapet, so the wall between the rows does not gape.
  const WW = 190, WH = Math.min(175, 150 + Math.max(0, f.storey - 280) * 0.4), WD = (LOG + EDGE - 34 - WW) / 2;
  const WD2 = WD + WW + 2 * (WD - LOG); // the next panel's window across the cut (the joint at the back between them)
  const SILL = Math.min(90 + Math.max(0, f.storey - 280) * 0.3, f.storey - WH - 30);
  const PVC = "#f6f3ec";
  // A revitalised window: white plastic in three upright panes (Bára), in a deep reveal of the
  // insulation, a grey metal sill; a lit pane or flowers now and then.
  const panelWindow = (z, n, d = WD, w = WW) => {
    const luck = (((n + seed * 31) * 2654435761) >>> 0) % 11;
    const h = WH;
    box(d - 8, d + w + 8, z - 2, z + h + 8, tint(wall, 0.82)); // reveal
    box(d, d + w, z, z + h, PVC);
    box(d + 7, d + w - 7, z + 7, z + h - 7, luck === 4 ? LIT : GLASS);
    box(d + 7, d + w - 7, z + h - 15, z + h - 7, tint(luck === 4 ? LIT : GLASS, 0.75)); // shade of the lintel
    poly([[d + w * 0.62, z + h - 15], [d + w - 7, z + h - 15], [d + w - 7, z + h * 0.45]], luck === 4 ? "#f8e7b5" : GLINT);
    for (const t of [1 / 3, 2 / 3]) box(d + w * t - 4, d + w * t + 4, z, z + h, PVC); // mullions
    box(d - 12, d + w + 12, z - 9, z - 5, tint(wall, 0.9)); // shadow under the sill
    box(d - 12, d + w + 12, z - 5, z, "#c9ccd0"); // metal sill
    if (luck === 1 || luck === 8) for (let i = 0; i < 5; i++) dot(d + 14 + (i * (w - 28)) / 4, z + 6, 8, i % 2 ? "#d9748a" : "#7f9f6a");
  };
  hs.setBack = (z, n, back) => { // in the axis of the windows below, as wide as the floor allows
    const axis = WD + WW / 2, w = Math.min(WW, 2 * (axis - back - 12));
    panelWindow(z + SILL, n, axis - w / 2, w);
    panelWindow(z + SILL, n + 1, WD2);
  };
  // Cellar window in the plinth, above the pavement.
  box(200, 290, 30, 70, "#d9d6cf");
  box(206, 284, 36, 64, GLASS);
  // Entrance: level with the pavement, an anodised aluminium portal: a door leaf with a vertical handle,
  // a fixed side panel, a top light, a kick plate; a thin concrete canopy over it. It stands in
  // the column of the loggias, inside the facade.
  const ALU = "#bcbab4", door0 = 16, door1 = LOG - 8, doorTop = STEP + 210, lightTop = Math.min(STEP + 270, f.ground - 16);
  box(door0 - 6, door1 + 6, 0, 6, tint(plinth[1], 1.15)); // threshold
  box(door0 - 10, door1 + 10, STEP, lightTop + 10, tint(wall, 0.86)); // reveal around the portal
  box(door0, door1, STEP, lightTop, ALU);
  const panes = [[door0 + 8, door0 + 68], [door0 + 76, door1 - 8]]; // door leaf, side panel
  const ENTRY_GLASS = "#4a5578"; // lighter than the windows: the lit staircase shows through
  box(door0 + 8, door1 - 8, STEP + 8, STEP + 48, tint(ALU, 0.85)); // kick plate
  for (const [d0, d1] of panes) {
    box(d0, d1, STEP + 48, doorTop - 6, ENTRY_GLASS);
    poly([[d0 + (d1 - d0) * 0.55, doorTop - 6], [d1, doorTop - 6], [d1, doorTop - 60]], "#6a7396");
  }
  box(door0 + 56, door0 + 63, STEP + 80, STEP + 140, "#7d7a74"); // handle on the leaf
  box(door0 + 8, door1 - 8, doorTop + 2, lightTop - 8, ENTRY_GLASS); // top light
  panelWindow(plinth[0] + SILL, 0);
  panelWindow(plinth[0] + SILL, 1, WD2);
  for (let k = 1; k < full; k++) {
    const z0 = floorZ(k), h = f.storey;
    // The loggia: a recess, its ceiling slab, a solid parapet in the accent colour under a light coping.
    box(0, LOG, z0, z0 + h, tint(wall, 0.55));
    box(0, LOG, z0 + h - 18, z0 + h, tint(wall, 0.78));
    box(0, LOG, z0, z0 + 101, accent, outline);
    box(0, LOG, z0 + 98, z0 + 101, tint(accent, 0.7));
    box(-4, LOG, z0 + 101, z0 + 107, "#e8e5de"); // coping
    if ((k + seed) % 4 === 1) { box(28, 58, z0 + 107, z0 + 129, "#b5714a"); dot(43, z0 + 140, 15, "#7f9f6a"); }
    panelWindow(z0 + SILL, k);
    panelWindow(z0 + SILL, k + 7, WD2);
  }
  // Joints over everything: one at every floor, one at the loggias, one at the back.
  for (let k = 1; k <= full; k++) box(0, EDGE, floorZ(k) - 2, floorZ(k) + 3, joint);
  box(0, EDGE, plinth[0] - 2, plinth[0] + 2, tint(plinth[1], 0.8)); // top of the plinth
  box(LOG - 2, LOG + 3, lightTop + 30, top, joint); // the loggia joint starts above the canopy
  box(EDGE - 36, EDGE - 31, plinth[0], top, joint);
  box(-40, LOG, lightTop + 4, lightTop + 10, tint(wall, 0.6)); // canopy: shadow, slab, flashing
  box(-40, LOG, lightTop + 10, lightTop + 28, "#c4bfb5", outline);
  box(-40, LOG, lightTop + 28, lightTop + 31, "#9a9690");
}
