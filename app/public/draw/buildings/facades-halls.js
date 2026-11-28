// Windows and ground floors of the halls, offices, churches, garages and schools.
import { DOOR, FRAME, GLASS, GLINT, LIT } from "./tables.js";
import { EDGE, tint } from "../svg.js";

export function drawFactoryFacade(hs) {
  const { arch, box, poly, top, wall } = hs;
  // A Prague brick factory hall: brick courses, a dark plinth, tall gridded industrial windows.
  for (let z = 30; z < top; z += 30) box(0, EDGE, z - 2, z + 2, tint(wall, 0.88));
  box(0, EDGE, 0, 70, "#8a5a48");
  const wh = Math.min(top - 220, 420), z0 = 120;
  for (const d of [130, 255, 380]) { // the third across the cut
    box(d - 8, d + 108, z0 - 8, z0 + wh + 8, FRAME);
    box(d, d + 100, z0, z0 + wh, GLASS);
    poly([[d + 50, z0 + wh], [d + 100, z0 + wh], [d + 100, z0 + wh * 0.6]], GLINT);
    for (let k = 33; k < 100; k += 33) box(d + k - 2, d + k + 2, z0, z0 + wh, FRAME);
    for (let k = 40; k < wh; k += 40) box(d, d + 100, z0 + k - 2, z0 + k + 2, FRAME);
    box(d - 14, d + 114, z0 + wh + 8, z0 + wh + 22, tint(wall, 0.75)); // brick lintel
  }
  // A plank door with an arched brick head, standing on the ground near the street.
  box(10, 120, 0, 14, "#9a8a7c");
  box(18, 112, 14, 270, tint(wall, 0.75));
  box(26, 104, 14, 262, DOOR);
  for (let d = 39; d < 104; d += 13) box(d - 1, d + 1, 14, 262, tint(DOOR, 0.8));
  arch(65, 270, 47, tint(wall, 0.75));
  arch(65, 270, 39, GLASS);
}

export function drawHallFacade(hs) {
  const { accent, box, outline, poly, shade, shop, top } = hs;
  // The ribbon window stays above the door or gate (a low hall gets a lower gate and a slimmer band).
  const gateH = Math.min(340, top * 0.5), shopH = Math.min(310, top * 0.5);
  const zr = Math.max(top * 0.55, (shop ? shopH : gateH) + 50), hr = Math.min(170, top * 0.25, top - 90 - zr);
  for (let d = 20; d < EDGE; d += 30) box(d, d + 3, 0, top - 40, shade); // corrugated cladding
  if (hr >= 40) {
    box(0, EDGE, zr - 8, zr + hr + 8, FRAME);
    box(8, EDGE, zr, zr + hr, GLASS);
    poly([[EDGE - 170, zr + hr], [EDGE - 120, zr + hr], [EDGE - 180, zr], [EDGE - 230, zr]], GLINT);
    const span = EDGE - 46, parts = Math.round(span / 120);
    for (let i = 1; i < parts; i++) box(8 + (i * span) / parts - 3, 8 + (i * span) / parts + 3, zr, zr + hr, FRAME);
  }
  box(0, EDGE, top - 80, top - 40, accent); // coloured band
  if (shop) {
    box(0, 190, 0, shopH, FRAME);
    box(8, 182, 0, shopH - 10, GLASS);
    box(93, 97, 0, shopH - 10, FRAME);
    poly([[100, shopH - 10], [182, shopH - 10], [182, shopH - 110]], GLINT);
  } else {
    box(150, 340, 0, gateH, "#9aa3aa", outline); // roller door
    for (let z = 20; z < gateH; z += 30) box(150, 340, z, z + 4, "#868f96");
  }
}

export function drawOfficeFacade(hs) {
  const { accent, box, canopy, dark, floorH, floorZ, full, poly } = hs;
  // Offices: ribbon windows with mullions, a glazed ground floor.
  for (let k = 0; k < full; k++) {
    const z0 = floorZ(k), h = floorH(k);
    box(0, EDGE, z0 + h * 0.08, z0 + h * (k ? 0.82 : 0.9), FRAME); // the ribbon runs on past the cut
    box(8, EDGE, z0 + h * 0.12, z0 + h * (k ? 0.78 : 0.86), GLASS);
    const gTop = z0 + h * (k ? 0.78 : 0.86);
    poly([[EDGE - 150, gTop], [EDGE - 100, gTop], [EDGE - 160, z0 + h * 0.12], [EDGE - 210, z0 + h * 0.12]], GLINT);
    for (let d = 8 + 120; d < EDGE; d += 120) box(d - 3, d + 3, z0 + h * 0.12, gTop, FRAME);
    if (k) { box(0, EDGE, z0 - 4, z0 + h * 0.08, accent); } // spandrel band
  }
  box(14, 116, 0, 262, FRAME); // glazed entrance with a flat canopy
  box(22, 108, 0, 254, GLASS);
  box(63, 67, 0, 254, FRAME);
  canopy(14, 116, 262, dark);
}

export function drawChurchFacade(hs) {
  const { arch, box, outline, plinth, poly, top, wall } = hs;
  // A church seen from the side: tall pointed windows with tracery, a stepped buttress at the back.
  const GL = "#3d4a7a", w0 = Math.max(plinth[0] + 120, top * 0.3), w1 = top - 160;
  for (const d of [70, 200, 330]) { // the third across the cut, the church goes on
    box(d - 10, d + 80, w0 - 10, w1, tint(wall, 0.85));
    arch(d + 35, w1, 45, tint(wall, 0.85));
    box(d, d + 70, w0, w1, GL);
    arch(d + 35, w1, 35, GL);
    box(d + 33, d + 37, w0, w1 + 35, FRAME); // the mullion
    for (let zz = w0 + 60; zz < w1; zz += 60) box(d, d + 70, zz - 1, zz + 1, tint(GL, 1.3)); // leading
  }
  box(280, 320, 0, top * 0.75, tint(wall, 0.9), outline); // buttress, stepped, between the windows
  poly([[280, top * 0.75], [320, top * 0.75 + 40], [320, top * 0.75]], tint(wall, 0.8));
  box(-6, EDGE, top - 36, top, tint(wall, 1.08), outline); // the eaves cornice
}

export function drawGarageFacade(hs) {
  const { box, top, wall } = hs;
  // A row of garages seen from the side: a blank rendered wall, a vent, a thin roof slab sloping back.
  box(0, EDGE, 0, 12, tint(wall, 0.8));
  box(EDGE / 2 - 30, EDGE / 2 + 30, top - 70, top - 40, tint(wall, 0.7));
  for (let zz = top - 66; zz < top - 42; zz += 6) box(EDGE / 2 - 26, EDGE / 2 + 26, zz, zz + 2, tint(wall, 0.85));
}

export function drawSchoolFacade(hs) {
  const { box, canopy, dark, dot, f, floorZ, full, outline, plinth, poly, seed, trim, window } = hs;
  // A school: a wide double door up three steps under a canopy, big windows of three parts on every floor,
  // a string course between the floors.
  for (let i = 0; i < 3; i++) box(6, 150 - i * 12, i * 18, (i + 1) * 18, tint(plinth[1], 1.12), outline);
  box(12, 140, 54, 54 + 250, FRAME);
  box(20, 132, 54, 54 + 242, DOOR);
  box(74, 78, 54, 54 + 242, tint(DOOR, 0.8));
  box(20, 132, 54 + 190, 54 + 242, GLASS);
  canopy(12, 140, 54 + 255, dark);
  if (full > 1) { dot(76, floorZ(1) + f.storey * 0.55, 34, FRAME); dot(76, floorZ(1) + f.storey * 0.55, 28, "#f8f5ec"); // a clock over the door
    box(74, 78, floorZ(1) + f.storey * 0.55, floorZ(1) + f.storey * 0.55 + 22, "#3c3f43"); box(76, 96, floorZ(1) + f.storey * 0.55 - 2, floorZ(1) + f.storey * 0.55 + 2, "#3c3f43"); }
  const big = (z, h, n) => {
    const d0 = 170, d1 = EDGE - 45, luck = (((n + seed * 31) * 2654435761) >>> 0) % 13;
    box(d0 - 8, d1 + 8, z - 8, z + h + 8, FRAME);
    box(d0, d1, z, z + h, luck === 5 ? LIT : GLASS);
    poly([[d0 + (d1 - d0) * 0.6, z + h], [d1, z + h], [d1, z + h * 0.5]], luck === 5 ? "#f8e7b5" : GLINT);
    for (const t of [1 / 3, 2 / 3]) box(d0 + (d1 - d0) * t - 3, d0 + (d1 - d0) * t + 3, z, z + h, FRAME);
    box(d0, d1, z + h * 0.72 - 3, z + h * 0.72 + 3, FRAME);
    box(d0 - 14, d1 + 14, z - 14, z - 6, dark); // sill
  };
  big(f.ground * 0.3, f.ground * 0.55, 0);
  hs.setBack = (z, n, back) => { if (back <= 160) big(z + f.storey * 0.25, f.storey * 0.6, n); };
  for (let k = 1; k < full; k++) {
    box(-10, EDGE, floorZ(k) - 10, floorZ(k), trim, outline); // string course
    big(floorZ(k) + f.storey * 0.25, f.storey * 0.6, k);
    if (k > 1) window(40, floorZ(k) + f.storey * 0.3, 80, f.storey * 0.5, k * 7); // a narrower window by the street
  }
}
