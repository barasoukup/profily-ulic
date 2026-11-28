// The roof and the gable behind the wall, by the look.
import { houseHash, LOOKS } from "../../house-looks.js";
import { BARN_RISE, GABLE_RISE, gableOn, RIDGE, SMALL_RIDGE, TENEMENT_RIDGE, tenementGable } from "./form.js";
import { DOOR, FRAME, GLASS, ROOF, WINDOWS } from "./tables.js";
import { drawGableOutline } from "./gable.js";
import { EDGE, el, tint } from "../svg.js";
import { REGIONAL } from "./style.js";

// The roof, by the look: its drawing (a table, the look from roofLook).
const ROOFS = { cornice: drawBrickCornice, gable: drawGableOutline, gabled: drawGabledRoof, village: drawVillageRoof, mansard: drawMansardRoof, pitched: drawPitchedRoof };
function roofLook({ kind, style, f }) {
  if (kind === "cihlovy") return "cornice";
  if (gableOn(kind)) return "gable";
  if (GABLE_RISE[kind]) return "gabled";
  if (kind === "statek") return "village";
  if (style === "sikma" && f.roofRows) return "mansard";
  return !f.flat ? "pitched" : null;
}
// --- Roof and gable, behind the wall ---
export function drawRoof(hs) {
  ROOFS[roofLook(hs)]?.(hs);
}

function drawBrickCornice(hs) {
  const { box, dot, outline, poly, tile, top, wall } = hs;
  // The North Sea cornice house (lijstgevel): behind the white wooden cornice the band of a roof whose ridge runs
  // away from the street (seen like a village house's), black glazed tiles, a ridge, a chimney at the back.
  const zr = top + 200;
  box(EDGE - 110, EDGE - 66, zr - 30, zr + 70, tint(wall, 0.95));
  box(EDGE - 116, EDGE - 60, zr + 62, zr + 72, tint(wall, 0.7));
  poly([[-24, top - 6], [14, zr], [EDGE, zr], [EDGE, top - 6]], tile[0]); // the slope runs down to the cornice, its foot cut slanting
  for (let z = top + 30; z < zr - 8; z += 30) box(8 + (z - top) * 0.1, EDGE, z, z + 4, tile[1], { "fill-opacity": 0.6 });
  box(14, EDGE, zr - 8, zr + 4, tile[1]);
  box(-26, EDGE, top - 8, top + 6, tint(tile[1], 0.85)); dot(-26, top - 2, 7, tint(tile[1], 0.7)); // the eaves' gutter
  box(EDGE - 154, EDGE - 96, top + 66, top + 134, "#e9e4d8", outline); box(EDGE - 146, EDGE - 104, top + 74, top + 126, GLASS); box(EDGE - 127, EDGE - 123, top + 74, top + 126, "#e9e4d8"); // a roof light: frame, glass
}

function drawGabledRoof(hs) {
  const { box, brick, info, kind, outline, poly, tile, top, wall, window } = hs;
  // A house with its gable to the street (the North Sea's step, neck or bell gable; the Hanseatic house of Tallinn): the
  // band of its roof up to the ridge running away from the street, as a village house's. The gable stands edge-on at
  // the street; with ?stit=1 (LOOKS.gables, Bára to approve) its outline is drawn over the band as if turned towards us.
  const H = GABLE_RISE[kind], zr = top + H;
  box(EDGE - 120, EDGE - 76, zr - 40, zr + 70, kind === "hanza" ? "#c46a4b" : tint(wall, 0.95));
  box(EDGE - 126, EDGE - 70, zr + 62, zr + 72, "#8d4a34");
  box(0, EDGE, top - 10, zr, tile[0]);
  for (let z = top + 24, i = 0; z < zr - 10; z += 32, i++) {
    box(0, EDGE, z, z + 5, tile[1], { "fill-opacity": 0.55 });
    for (let d = i % 2 ? 10 : 30; d < EDGE; d += 40) box(d, d + 3, z - 27, z, tile[1], { "fill-opacity": 0.3 });
  }
  box(0, EDGE, zr - 10, zr + 6, tile[1]); // ridge
  const beamZ = zr - 70;
  if (LOOKS.gables) {
    // The gable's outline: rising from the cornice to its top over the middle of the strip (d = 200).
    const h = houseHash(info), a = 6, b = EDGE - 6, c = EDGE / 2, gTop = zr + 40;
    const form = kind === "hanza" ? (h % 4 === 0 ? "trap" : "plain") : ["trap", "hals", "klok"][h % 3];
    let pts;
    if (form === "trap") { // a stepped gable: four steps each side and a top block
      const steps = 4, sh = (gTop - top) / (steps + 1), sw = (c - 45 - a) / steps;
      pts = [[a, top]];
      for (let i = 0; i < steps; i++) pts.push([a + i * sw, top + (i + 1) * sh], [a + (i + 1) * sw, top + (i + 1) * sh]);
      pts.push([c - 45, gTop], [c + 45, gTop]);
      for (let i = steps - 1; i >= 0; i--) pts.push([b - (i + 1) * sw, top + (i + 1) * sh], [b - i * sw, top + (i + 1) * sh]);
      pts.push([b, top]);
    } else if (form === "hals") { // a neck gable: shoulders with volutes, the neck under a small pediment
      const zs = top + (gTop - top) * 0.42, nk = 70;
      pts = [[a, top], [a, zs - 30], [c - nk - 60, zs], [c - nk, zs], [c - nk, gTop - 50], [c, gTop], [c + nk, gTop - 50], [c + nk, zs], [c + nk + 60, zs], [b, zs - 30], [b, top]];
    } else if (form === "klok") { // a bell gable: an S curve to a round top
      const left = [], H2 = gTop - top;
      for (let i = 0; i <= 12; i++) {
        const u = (i / 12) * 0.86, sm = Math.min(1, Math.max(0, (u - 0.08) / 0.7)), s2 = sm * sm * (3 - 2 * sm);
        left.push([c - (60 + (c - a - 60) * (1 - s2)), top + u * H2]);
      }
      for (let i = 1; i <= 6; i++) { const v = i / 6; left.push([c - 60 * Math.cos((v * Math.PI) / 2), top + H2 * (0.86 + 0.14 * Math.sin((v * Math.PI) / 2))]); }
      pts = [[a, top], ...left, ...left.slice(0, -1).reverse().map(([d, z]) => [2 * c - d, z]), [b, top]];
    } else pts = [[a, top], [c, gTop], [b, top]]; // a plain steep gable
    poly(pts, wall, outline);
    if (brick || kind === "stit") for (let z = top + 30; z < gTop; z += 30) { // brick courses inside the outline (clipped by eye: short of its edge)
      const inside = pts.filter(([, pz]) => pz >= z);
      if (inside.length) { const d0 = Math.min(...inside.map(([pd]) => pd)) + 6, d1 = Math.max(...inside.map(([pd]) => pd)) - 6; if (d1 > d0) box(d0, d1, z - 1.5, z + 1.5, tint(wall, 0.88)); }
    }
    if (form === "trap" || form === "hals" || form === "klok") for (const [pd, pz] of pts.slice(1, -1)) if (pz > top + 20) box(pd - 4, pd + 4, pz, pz + 6, "#efe9dc"); // white copings
    // Windows of the attic floors and the loft door under the beam.
    const win = WINDOWS[kind];
    for (const d of [c - 95, c + 95 - win.w * 0.8]) window(d, top + 40, win.w * 0.8, Math.min(120, (gTop - top) * 0.3), 7);
    box(c - 36, c + 36, beamZ - 150, beamZ - 20, DOOR, outline);
    box(c - 2, c + 2, beamZ - 150, beamZ - 20, tint(DOOR, 0.7));
  } else {
    // Without the licence: the gable's plate, edge-on, rising past the ridge.
    box(-12, 12, top, zr + 80, tint(wall, 0.95), outline);
    if (brick || kind === "stit") for (let z = top + 30; z < zr + 80; z += 30) box(-12, 12, z - 1.5, z + 1.5, tint(wall, 0.85));
  }
  // The hoist beam over the street, its hook.
  box(-80, 12, beamZ, beamZ + 22, "#5b4632", outline);
  box(-74, -70, beamZ - 40, beamZ, "#3a3a3a");
}

function drawVillageRoof(hs) {
  const { box, dot, outline, shade, tile, top } = hs;
  // A village house with its gable to the street: we see its long side, so the roof shows as a band of tiles
  // from the eaves up to the ridge running away from the street; the gable stands edge-on at the street with its
  // verge board, a chimney over the ridge.
  const zr = top + BARN_RISE;
  box(EDGE - 150, EDGE - 100, zr - 40, zr + 90, "#c46a4b");
  box(EDGE - 158, EDGE - 92, zr + 80, zr + 92, "#8d4a34");
  box(-25, EDGE, top - 14, zr, tile[0]);
  for (let z = top + 24, i = 0; z < zr - 10; z += 34, i++) {
    box(-25, EDGE, z, z + 5, tile[1], { "fill-opacity": 0.55 }); // rows of tiles
    for (let d = i % 2 ? -5 : 15; d < EDGE; d += 40) box(d, d + 3, z - 29, z, tile[1], { "fill-opacity": 0.35 }); // and their joints
  }
  box(EDGE - 124, EDGE - 66, top + 136, top + 204, "#e9e4d8", outline); box(EDGE - 116, EDGE - 74, top + 144, top + 196, GLASS); box(EDGE - 97, EDGE - 93, top + 144, top + 196, "#e9e4d8"); // a roof light: frame, glass
  box(-25, EDGE, zr - 10, zr + 6, tile[1]); // ridge tiles
  box(-27, EDGE, top - 24, top - 10, "#6b6f72", outline); dot(-27, top - 17, 7, "#6b6f72"); // gutter
  box(-30, -12, top - 22, zr + 8, "#8a6a4a", outline); // the verge board of the gable, edge-on
  box(0, EDGE, top - 40, top - 22, shade); // shadow under the eaves
}

function drawMansardRoof(hs) {
  const { X, box, colAxes, dot, f, full, g, kind, outline, poly, shade, style, surface, tile, top, wall, window } = hs;
  // Mansard: steep slate slope with a dormer, shallow top; the gable end has the attic windows. Haussmann's is zinc,
  // with a row of brick chimney stacks on the ridge.
  const SL = kind === "haussmann" ? "#8d969b" : kind === "stenstad" ? tile[0] : ROOF.slate, SD = kind === "haussmann" ? "#6c757a" : kind === "stenstad" ? tile[1] : ROOF.slateDark;
  const rise = f.roofRows * f.storey, run = rise * 0.28, zt = top + rise;
  const zBack = zt + (EDGE - run) * 0.3;
  // Chimney first: the roof and the gable hide its foot.
  box(EDGE - 175, EDGE - 125, zt, zBack + 80, "#c46a4b");
  box(EDGE - 183, EDGE - 117, zBack + 70, zBack + 82, "#8d4a34");
  if (kind === "haussmann") for (const dc of [EDGE - 290, EDGE - 70].filter((d) => d > run + 40)) { // more stacks, each with its pots
    const zc = zt + (dc - run) * 0.3;
    box(dc - 22, dc + 22, zt, zc + 90, "#b8644a");
    box(dc - 28, dc + 28, zc + 82, zc + 94, "#8d4a34");
    for (const p of [-12, 0, 12]) box(dc + p - 4, dc + p + 4, zc + 94, zc + 112, "#a0553c");
  }
  poly([[0, top], [run, zt], [EDGE, zBack], [EDGE, top]], kind === "haussmann" ? "#a7b0b5" : kind === "stenstad" ? tint(tile[0], 1.15) : shade, outline);
  // A slate slab as thick as the tiled ones: dark underside, then the slate, a gutter at the foot and at the break.
  poly([[-30, top - 4], [run - 16, zt + 40], [EDGE, zBack + 40], [EDGE, zBack], [run, zt], [0, top]], SL);
  poly([[-8, top], [run - 4, zt + 10], [EDGE, zBack + 10], [EDGE, zBack], [run, zt], [0, top]], SD);
  dot(-26, top - 6, 10, SD);
  dot(run - 14, zt + 30, 8, SD);
  // The mansard keeps the columns of the floors below (as wide as theirs): a column where it stands clear of the slope.
  // The regional looks put each window in a dormer's face.
  const win = WINDOWS[kind] || WINDOWS[style], cols = colAxes(win.w).map((c) => c - win.w / 2);
  for (let k = 0; k < f.roofRows; k++) {
    const z0 = top + k * f.storey + 0.25 * f.storey, h = 0.5 * f.storey;
    for (const [i, d0] of cols.entries()) if (d0 >= ((z0 + h - top) / rise) * run + 10 && d0 < EDGE) {
      if (REGIONAL.has(kind)) box(d0 - 18, d0 + win.w + 18, z0 - 16, z0 + h + 22, kind === "haussmann" ? "#f1ece1" : tint(wall, 1.05), outline); // the dormer's face
      window(d0, z0, win.w, h, REGIONAL.has(kind) ? (full + k) * 3 + i : (full + k) * 3);
      if (kind === "haussmann") { const [x1, x2] = [X(d0 - 26), X(d0 + win.w + 26)].sort((p, q) => p - q); el("path", { d: `M${x1} ${surface - z0 - h - 22} Q ${(x1 + x2) / 2} ${surface - z0 - h - 74} ${x2} ${surface - z0 - h - 22} Z`, fill: "#f1ece1", ...outline }, g); }
      else if (REGIONAL.has(kind)) poly([[d0 - 26, z0 + h + 22], [d0 + win.w / 2, z0 + h + 60], [d0 + win.w + 26, z0 + h + 22]], SL, outline);
    }
  }
  // Dormer: only its cheek shows, between the steep slope and its face, under a little roof.
  const slopeD = (z) => ((z - top) / rise) * run;
  const zb = REGIONAL.has(kind) ? top + 0.25 * f.storey - 16 : top + rise * 0.3, zc = REGIONAL.has(kind) ? zb + 0.5 * f.storey + 38 : zb + 140, dF = Math.max(4, slopeD(zb) - 30);
  poly([[slopeD(zb), zb], [dF, zb], [dF, zc], [slopeD(zc), zc]], kind === "haussmann" ? "#7f888d" : tint(SL, 1.35), outline);
  box(dF, dF + 10, zb, zc, SD); // the window frame, edge-on
  if (kind === "haussmann") { // a zinc dormer with its little arched hood
    poly([[dF - 16, zc], [slopeD(zc) + 6, zc], [slopeD(zc) + 6, zc + 22], [dF - 16, zc + 22]], "#9aa3a8", outline);
    const [x1, x2] = [X(dF - 16), X(slopeD(zc) + 6)].sort((p, q) => p - q);
    el("path", { d: `M${x1} ${surface - zc - 22} Q ${(x1 + x2) / 2} ${surface - zc - 60} ${x2} ${surface - zc - 22} Z`, fill: "#9aa3a8", ...outline }, g);
  } else poly([[dF - 14, zc], [slopeD(zc), zc], [slopeD(zc), zc + 34], [dF - 14, zc + 14]], SD); // its little roof
}

function drawPitchedRoof(hs) {
  const { box, dot, f, kind, med, outline, poly, shade, style, tile, top, wall, window, wood } = hs;
  const eave = { stredomori: 45, azulejo: 30, galeria: 40, kypr: 40, stenstad: 20, dansky: 30, drevak: 45, puukaupunki: 40, tallinnamaja: 45 }[kind]
    ?? (style === "nizky" ? (kind === "kostka" ? 30 : 55) : 35);
  const small = style === "nizky" || SMALL_RIDGE.has(kind);
  const ridge = small ? RIDGE : tenementGable(kind, f.roofRows, f.flat) ? TENEMENT_RIDGE : EDGE + 200, P = f.pitch;
  // The underside of the roof meets the wall top at the facade; the eaves reach lower, over the street.
  const z = (d) => top + 12 + Math.min(d, ridge) * P - Math.max(0, d - ridge) * P;
  // Chimney first (the roof hides its foot), then the gable up to the roof, then a thick tiled slab.
  const dc = small ? RIDGE + 50 : EDGE - 80;
  if (kind === "typovy") { // a second chimney, well inside the slope (its foot under the tiles, clear of the roof's edge)
    const d2 = EDGE - 230;
    box(d2 - 22, d2 + 22, top, z(d2) + 90, "#c46a4b");
    box(d2 - 30, d2 + 30, z(d2) + 80, z(d2) + 92, "#8d4a34");
  }
  if (kind !== "kostel") { // a church has no chimney
    box(dc - 24, dc + 24, top, z(dc) + 100, "#c46a4b");
    box(dc - 32, dc + 32, z(dc) + 90, z(dc) + 102, "#8d4a34");
  }
  poly([[0, top], [Math.min(ridge, EDGE), z(Math.min(ridge, EDGE)) - 12], [EDGE, z(EDGE) - 12], [EDGE, top]], ["kostka", "vila", "sorela", "typovy", "mestan", "skola", "kostel", "dansky"].includes(kind) ? tint(tile[0], 1.08)
    : tenementGable(kind, f.roofRows, f.flat) ? tint(wall, 1.04) : shade, outline); // a hipped roof shows its slope; a tenement's gable is its plastered wall
  const slab = (d0, d1) => {
    poly([[d0, z(d0)], [d1, z(d1)], [d1, z(d1) + 30], [d0, z(d0) + 30]], tile[0]);
    poly([[d0, z(d0) - 12], [d1, z(d1) - 12], [d1, z(d1)], [d0, z(d0)]], tile[1]);
  };
  slab(-eave, Math.min(ridge, EDGE));
  if (ridge < EDGE) slab(ridge, EDGE);
  box(0, EDGE, top - 26, top, shade); // shadow under the eaves
  if (style === "sikma" && kind !== "typovy" && kind !== "stenstad") for (const d of [-eave + 10, -eave / 2 + 2]) box(d - 5, d + 5, top - 16, z(d) - 12, ROOF.tileDark); // brackets
  else if (wood && kind !== "tallinnamaja") box(-eave, -eave + 8, z(-eave) - 40, z(-eave) + 4, "#f6f4ee"); // the white fascia board
  else dot(-eave + 2, z(-eave) - 16, 10, tint(tile[1], 0.9)); // gutter
  if (tenementGable(kind, f.roofRows, f.flat)) dot(-eave + 2, z(-eave) - 16, 10, tint(tile[1], 0.9)); // and a tenement's gutter at its eaves
  if (kind === "stenstad") {
    Object.assign(hs, { eave, ridge, z });
    drawStenstadRoof(hs);
  } else if (kind === "dansky") { // a white dormer (kvist) in the slope, rows of tiles or slates
    Object.assign(hs, { P, z });
    drawDanishRoof(hs);
  } else if (med && !small) { // rows of Roman tiles (coppi, teja árabe), the eaves' double row
    for (let zr = top + 40; zr < z(EDGE) - 26; zr += 26) box((zr - top - 12) / P + 8, EDGE, zr, zr + 5, tile[1], { "fill-opacity": 0.4 });
    for (let d = -eave + 6; d < -2; d += 14) dot(d, z(d) + 4, 6, tint(tile[0], 0.85));
  } else if (kind === "tallinnamaja") { // a sheet roof's seams, a small gable window over the eaves floor
    for (let d = -eave + 20; d < EDGE; d += 60) box(d - 2, d + 2, z(d) + 30, z(d) + 36, tint(tile[0], 1.4));
    const da = (125 + EDGE - 30) / 2; // in the axis of the back column below
    dot(da, top + 80, 24, "#f6f4ee");
    dot(da, top + 80, 17, GLASS);
  } else if (kind === "kostka") {} // the low hipped roof of the cube has no gable
  else if (kind === "skola" || kind === "kostel") { // rows of tiles (slates on a church), no gable
    for (let zr = top + 40; zr < z(Math.min(ridge, EDGE)) - 30; zr += 34) box((zr - top - 12) / P + 8, EDGE, zr, zr + 4, tile[1], { "fill-opacity": 0.35 });
  } else if (kind === "typovy") { // rows of tiles and a second chimney
    for (let zr = top + 40; zr < z(Math.min(ridge, EDGE)) - 30; zr += 34) box((zr - top - 12) / P + 8, EDGE, zr, zr + 4, tile[1], { "fill-opacity": 0.35 });
  }
  else if (kind === "vila" || kind === "sorela" || kind === "mestan") { // a hipped roof: rows of tiles on the slope, a dormer with its little gable
    Object.assign(hs, { P, ridge, z });
    drawVillaRoof(hs);
  }
  else if (kind === "novyrd") { // a new house: a larch-clad gable with a square window
    Object.assign(hs, { ridge, z });
    drawNewHouseRoof(hs);
  } else if (wood) { // the wooden houses: the gable's window in the back column of the floors below, clear of the roof
    const ww = WINDOWS[kind].w, d0 = (125 + EDGE - 30 - ww) / 2;
    hs.noBox = true;
    window(d0, top + 50, ww, Math.min(95, Math.min(z(d0 - 10), z(d0 + ww + 10)) - 12 - top - 60 - 10), 1);
    hs.noBox = false;
  } else if (f.roofRows || small) {
    // A window in the gable in the back column of the floors below (as wide as theirs), kept clear of the roof.
    const ww = (WINDOWS[kind] || WINDOWS[style]).w, d0 = (125 + EDGE - 30 - ww) / 2;
    window(d0, top + 50, ww, Math.min(95, Math.min(z(d0 - 10), z(d0 + ww + 10)) - 12 - top - 60 - 10), 1);
  } else {
    // The round window (volské oko) in the middle of the gable, under its ridge (Bára 23. 11. 2026).
    const dc = ridge, zc = top + (z(ridge) - top) * 0.55;
    dot(dc, zc, 40, tint(wall, 1.15)); // its plaster surround
    dot(dc, zc, 34, FRAME);
    dot(dc, zc, 27, GLASS);
  }
}

function drawStenstadRoof(hs) {
  const { box, eave, poly, ridge, tile, z } = hs;
  // A sheet roof: the standing seams' ribs on the slope, the snow guard (snöräcke) along the eaves, a roof ladder.
  for (let d = -eave + 20; d < Math.min(ridge, EDGE); d += 60) box(d - 2, d + 2, z(d) + 30, z(d) + 38, tint(tile[0], 1.5));
  const zg = (d) => z(d) + 30;
  for (const d of [-eave + 14, 10, 34]) box(d - 2, d + 2, zg(d), zg(d) + 32, "#2b2d2f");
  poly([[-eave + 10, zg(-eave + 10) + 26], [40, zg(40) + 26], [40, zg(40) + 32], [-eave + 10, zg(-eave + 10) + 32]], "#2b2d2f");
  poly([[-eave + 10, zg(-eave + 10) + 12], [40, zg(40) + 12], [40, zg(40) + 15], [-eave + 10, zg(-eave + 10) + 15]], "#2b2d2f");
  for (let d = 120; d < EDGE - 40; d += 36) box(d - 10, d + 10, z(d) + 30, z(d) + 36, "#4a4d50"); // the roof walkway
}

function drawDanishRoof(hs) {
  const { P, box, outline, poly, tile, top, window, z } = hs;
  for (let zr = top + 40; zr < z(EDGE) - 30; zr += 34) box((zr - top - 12) / P + 8, EDGE, zr, zr + 4, tile[1], { "fill-opacity": 0.35 });
  // in the back column of the floors below (its window as wide as theirs), sitting on the slope
  const ww = WINDOWS.dansky.w, dd0 = (125 + EDGE - 30 - ww) / 2, dc = dd0 + ww / 2, hw = ww / 2 + 36;
  const zf = top + (dc - hw) * P - 36, hf = Math.min(120, zf - top - 14), zb = zf - hf; // centred, a true gable of the roof's pitch under its ridge
  box(dc - hw + 12, dc + hw - 12, zb, zf, "#f4f2ec", outline);
  poly([[dc - hw, zf - 4], [dc, zf - 4 + hw * P], [dc + hw, zf - 4]], tile[1], outline);
  window(dd0, zb + 16, ww, hf - 32, 4);
}

function drawVillaRoof(hs) {
  const { P, box, kind, outline, poly, ridge, tile, top, wall, window, z } = hs;
  for (let zr = top + 40; zr < z(Math.min(ridge, EDGE)) - 30; zr += 34) {
    const d0 = (zr - top - 12) / P, d1 = Math.min(EDGE, ridge + (z(ridge) - zr) / P);
    if (d1 > d0 + 20) box(d0 + 8, d1 - 8, zr, zr + 4, tile[1], { "fill-opacity": 0.35 });
  }
  // A dormer in the slope, centred on the back column of the floors below (as wide as theirs). Its little gable has the
  // main roof's pitch (P) and its eaves run parallel to the roof's edge, so it sits true on the slope (Bára 27. 11. 2026).
  const ww = WINDOWS[kind].w, d0 = (125 + EDGE - 30 - ww) / 2, dc = d0 + ww / 2, hw = ww / 2 + 36; // half the face's width + 12 of eaves
  const zf0 = top + (dc - hw) * P - 36; // the face's top: its street-side foot of the gable 0.4 m under the roof's edge
  const zf = Math.min(zf0, z(dc) - 33 - hw * P); // and its apex 0.3 m under the ridge's underside
  const hf = Math.min(104, zf - top - 14), zb = zf - hf;
  box(dc - hw + 12, dc + hw - 12, zb, zf, wall, outline);
  poly([[dc - hw, zf - 4], [dc, zf - 4 + hw * P], [dc + hw, zf - 4]], tile[0], outline); // the gable, pitch as the main roof
  box(dc - hw, dc + hw, zf - 10, zf - 4, tile[1]); // its eaves board
  window(d0, zb + 14, ww, hf - 28, 2);
}

function drawNewHouseRoof(hs) {
  const { box, ridge, top, z } = hs;
  for (let d = 30; d < Math.min(ridge, EDGE) * 2 - 30 && d < EDGE; d += 16) {
    const zt = Math.min(z(d), z(d + 8)) - 18;
    if (zt > top + 6) box(d, d + 8, top, zt, tint("#b98a5a", d % 32 ? 1 : 0.88));
  }
  const ww = WINDOWS.novyrd.w, dc = (125 + EDGE - 30) / 2; // in the back column of the floors below, as wide
  box(dc - ww / 2, dc + ww / 2, top + 30, top + 30 + ww, "#3c3f43");
  box(dc - ww / 2 + 6, dc + ww / 2 - 6, top + 36, top + 24 + ww, GLASS);
}
