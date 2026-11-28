// Windows and ground floors of the town and village houses (the tenement, the regional looks).
import { houseHash } from "../../house-looks.js";
import { ARCADE_D, gableAxes, gableOn, stoepZ } from "./form.js";
import { DOOR, FRAME, GLASS, GLINT, STONE, WINDOWS } from "./tables.js";
import { EDGE, tint } from "../svg.js";

export function drawTownFacade(hs) {
  const { box, colAxes, f, floorZ, full, info, kind, med, outline, poly, shutters, style, window } = hs;
  // Door near the street (arched in a tenement), windows behind it, and on every floor above.
  const win = WINDOWS[kind] || WINDOWS[style];
  // A gable turned towards us: the door in the front column, the house mirror-symmetric to the gable's axis.
  const gAxes = gableOn(kind) ? gableAxes(kind) : null, dd = gAxes ? gAxes[0] - 65 : 0;
  if (kind === "statek") {
    Object.assign(hs, { win });
    drawVillageGroundFloor(hs);
  } else {
    Object.assign(hs, { dd });
    drawTownGroundFloor(hs);
  }
  // The windows above stand in the axes of the door and of the ground-floor window.
  // Behind an arcade (drawn over the front 2.6 m) the ground-floor window moves back, clear of it.
  const backAxis = gAxes ? gAxes[1] - win.w / 2 : (125 + EDGE - 30 - win.w) / 2;
  const groundAt = info?.arcade ? Math.min(ARCADE_D + 25, EDGE - 40 - win.w) : backAxis;
  const shut = med && kind !== "azulejo" && kind !== "galeria";
  const win2 = (d, z, w, h, n) => { window(d, z, w, h, n); if (shut) shutters(d, z, w, h, n); };
  if (kind === "haussmann") {
    // The shop window of the ground floor, under the entresol's band.
    const s0 = 175, s1 = EDGE + 30, sTop = Math.min(f.ground - 150, 330); // on past the cut
    box(s0 - 8, s1 + 8, 40, sTop + 8, "#3f4a3c");
    box(s0, s1, 48, sTop, GLASS);
    poly([[s0 + (s1 - s0) * 0.55, sTop], [s1, sTop], [s1, sTop - 110]], GLINT);
    box((s0 + s1) / 2 - 2, (s0 + s1) / 2 + 2, 48, sTop, "#3f4a3c");
    window(groundAt + 20, sTop + 50, win.w * 0.8, Math.min(110, f.ground - sTop - 90), 0); // the entresol's window
  } else if (kind !== "statek") {
    win2(groundAt, f.ground * win.sill + (style === "sikma" ? 40 : 0) + (stoepZ(kind, info)), win.w, win.h * f.storey, 0);
    if (!info?.arcade) for (const c of (gAxes || colAxes(win.w)).slice(2)) win2(c - win.w / 2, f.ground * win.sill + (style === "sikma" ? 40 : 0) + stoepZ(kind, info), win.w, win.h * f.storey, 1);
  }
  for (let k = 1; k < full; k++) {
    if (kind === "galeria") { // the glazed gallery over the whole wall, joining the one over the street
      const z = floorZ(k), h = f.storey;
      box(0, EDGE, z + 6, z + h - 6, "#f4f4f0", outline);
      box(6, EDGE, z + 0.28 * h, z + h - 14, "#7f95a8");
      poly([[EDGE * 0.45, z + h - 14], [EDGE, z + h - 14], [EDGE, z + 0.45 * h]], "#a9bccb");
      for (let d = 6 + 44; d < EDGE; d += 44) box(d - 3, d + 3, z + 0.28 * h, z + h - 14, "#f4f4f0");
      for (let d = 6 + 22; d < EDGE; d += 44) box(d - 1.5, d + 1.5, z + 0.7 * h, z + h - 14, "#f4f4f0");
      box(6, EDGE, z + 0.7 * h - 3, z + 0.7 * h + 3, "#f4f4f0");
      box(0, EDGE, z + 0.24 * h, z + 0.28 * h, "#f4f4f0");
      continue;
    }
    for (const [i, c] of (gAxes || (kind === "statek" ? [95, 205] : colAxes(win.w))).entries()) {
      win2(c - win.w / 2, floorZ(k) + win.sill * f.storey, win.w, win.h * f.storey, k * 3 + i);
    }
  }
}

function drawVillageGroundFloor(hs) {
  const { box, dot, f, wall, win, window } = hs;
  // A village house: no door by the street; small windows with a cross, the plank door into the yard behind.
  for (const d of [60, 170]) window(d, f.ground * win.sill, win.w, win.h * f.storey, d); // (the upper floors keep these two axes)
  box(262, 352, 0, 205, tint(wall, 0.8));
  box(268, 346, 0, 199, DOOR);
  for (let d = 281; d < 346; d += 13) box(d - 1, d + 1, 0, 199, tint(DOOR, 0.8));
  dot(334, 100, 5, "#f2d27a");
}

function drawTownGroundFloor(hs) {
  const { WF, arch, box, brick, canopy, dark, dd, dot, f, info, kind, med, outline, pal, plinth, poly, shutterCol, style, tile, top, wall } = hs;
  if (kind === "sorela") { // a rusticated ground floor: stone blocks with deep joints, under the windows and the door
    box(0, EDGE, plinth[0], f.ground - 22, tint(STONE, 1.12));
    for (let z = plinth[0] + 40, i = 0; z < f.ground - 30; z += 40, i++) {
      box(0, EDGE, z - 3, z + 3, tint(STONE, 0.85));
      for (let d = i % 2 ? 40 : 0; d < EDGE; d += 80) if (d) box(d - 2, d + 2, z, Math.min(z + 40, f.ground - 22), tint(STONE, 0.85));
    }
  }
  // A canal house of the North Sea has its door up its stoep from the street (every other house).
  const stoep = stoepZ(kind, info) > 0;
  const z0 = stoepZ(kind, info); // the door at the level of the street (no flight of steps; Bára 27. 11. 2026: not even the cube house)
  const doorH = Math.min(240, f.ground * 0.72);
  const doorFrame = kind === "novyrd" ? "#3c3f43" : FRAME;
  box(dd ? 0 : 10, 120 + dd, z0, z0 + 14, tint(plinth?.[1] || STONE, 1.15)); // doorstep (the landing)
  if (stoep) { // five steps out into the street with an iron rail
    for (let i = 0; i < 5; i++) box(-(5 - i) * 22, 10, i * 15, (i + 1) * 15, "#6a6e71", outline);
    box(-112, -108, 0, 100, "#2b2d2f");
    poly([[-112, 96], [-2, z0 + 96], [-2, z0 + 102], [-112, 102]], "#2b2d2f");
    box(-4, 0, z0, z0 + 100, "#2b2d2f");
  }
  const doorCol = brick ? (houseHash(info) % 3 ? "#23382c" : "#1f2224") : kind === "haussmann" ? "#3f4a3c" : kind === "malta" ? pal("maltaAccent") : kind === "kypr" ? shutterCol : med ? "#6b4a30" : DOOR;
  if (kind === "haussmann") {
    // The porte cochère: a tall arched carriage door in a stone frame, its fanlight.
    const dh = Math.min(f.ground - 80, 400) - 60;
    box(8, 152, 0, dh + 10, tint(wall, 0.9), outline);
    arch(80, dh + 10, 72, tint(wall, 0.9));
    box(16, 144, 14, dh, doorCol);
    arch(80, dh, 64, GLASS);
    for (const d of [56, 104]) box(d - 2, d + 2, dh, dh + 60, FRAME);
    box(78, 82, 14, dh, tint(doorCol, 0.7));
    for (const zz of [60, dh * 0.5]) box(16, 144, zz, zz + 4, tint(doorCol, 0.8));
  } else {
  box(16 + dd, 114 + dd, z0 + 14, z0 + doorH + 10, doorFrame);
  box(24 + dd, 106 + dd, z0 + 14, z0 + doorH, kind === "novyrd" ? "#3c3f43" : doorCol);
  dot(94 + dd, z0 + doorH * 0.4, 5, "#f2d27a");
  }
  if (kind === "haussmann") {}
  else if (kind === "sikma" || kind === "mestan" || kind === "stenstad" || kind === "dansky" || kind === "hanza" || med) { arch(65 + dd, doorH + 10, 49, kind === "hanza" ? "#bdb6a4" : FRAME); arch(65 + dd, doorH + 10, 41, GLASS); } // arched transom
  else if (brick) { box(16 + dd, 114 + dd, z0 + doorH + 10, z0 + doorH + 50, WF); box(24 + dd, 106 + dd, z0 + doorH + 14, z0 + doorH + 46, GLASS); } // a top light
  else if (kind === "drevak") {
    // The little porch (farstukvist): two posts and a gabled roof over the door, seen from the front.
    // (between the corner board and the wall's top: clear of both, under the eaves)
    const zp = Math.min(doorH + 30, top - 66);
    box(26, 34, 0, zp, "#f6f4ee", outline);
    box(110, 118, 0, zp, "#f6f4ee", outline);
    poly([[22, zp], [72, zp + 42], [122, zp]], tile[0], outline);
    poly([[36, zp + 4], [72, zp + 32], [108, zp + 4]], wall);
    box(22, 122, zp - 6, zp + 2, "#f6f4ee");
  }
  else if (kind === "sorela") { // a stone surround and a top light
    box(4, 126, 0, doorH + 70, tint(plinth[1], 1.1), outline);
    box(16, 114, 14, doorH + 50, FRAME);
    box(24, 106, 14, doorH, DOOR);
    box(24, 106, doorH + 10, doorH + 42, GLASS);
  } else if (kind === "novyrd") box(34, 50, z0 + 30, z0 + doorH - 20, GLASS); // a slot of glass in the door
  else {
    box(30, 100, z0 + doorH * 0.7, z0 + doorH - 8, GLASS);
    canopy(16, 114, z0 + doorH + 10, style === "nizky" ? tile[0] : dark);
  }
}
