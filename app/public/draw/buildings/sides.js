// What sticks out of the side wall towards the street, by the look.
import { EDGE, tint } from "../svg.js";
import { FRAME, GLASS, PV_METAL, STONE } from "./tables.js";

// What sticks out of the house towards the street, by the look.
const SIDES = { sorela: drawSorelaSide, typovy: drawBrickBlockSide, sikma: drawTenementSide, moderni: drawModernSide, povalecny: drawPostwarSide,
  funkce: drawFunctionalistSide, hala: drawHallSide };
function sideLook({ kind, style }) {
  return kind === "sorela" || kind === "typovy" ? kind : style;
}
export function drawSideFeatures(hs) {
  SIDES[sideLook(hs)]?.(hs);
}

function drawSorelaSide(hs) {
  const { box, f, outline, shade, top, wall } = hs;
  // Sorela: a stone band over the rusticated ground floor, a plain frieze and a heavy profiled cornice.
  box(-20, EDGE, f.ground - 22, f.ground, tint(STONE, 1.05), outline);
  const corn = tint(wall, 1.15);
  box(0, EDGE, top - 90, top - 62, tint(wall, 0.94)); // the frieze
  box(-4, EDGE, top - 124, top - 114, corn, outline); // its architrave line
  box(-12, EDGE, top - 62, top - 48, corn, outline);
  box(-30, EDGE, top - 48, top - 26, corn, outline);
  box(-52, EDGE, top - 26, top, corn, outline);
  box(0, EDGE, top - 104, top - 90, shade);
}

function drawBrickBlockSide(hs) {
  const { box, top, wall } = hs;
  box(0, EDGE, top - 30, top, tint(wall, 0.92)); // a plain eaves band, nothing more
}

function drawTenementSide(hs) {
  const { box, f, kind, outline, shade, top, trim, wall } = hs;
  box(-18, EDGE, f.ground - 18, f.ground, trim, outline); // string course
  box(-18, EDGE, f.ground - 30, f.ground - 18, shade);
  // Main cornice in three steps, the wall's colour lightened, with its shadow on the wall.
  const corn = tint(wall, 1.15);
  if (kind === "sikma" || kind === "mestan") {
    // Under the cornice the frieze, a shade lighter, over an architrave line; consoles carry the cornice.
    const zf = top - 58 - Math.min(60, f.storey * 0.17);
    box(0, EDGE, zf, top - 58, tint(wall, 1.07));
    box(-6, EDGE, zf - 12, zf, corn, outline);
    box(0, EDGE, zf - 20, zf - 12, shade);
    for (let d = 15; d < EDGE; d += 42) box(d, d + 12, top - 88, top - 58, corn, outline);
  } else box(0, EDGE, top - 76, top - 58, shade);
  box(-14, EDGE, top - 58, top - 44, corn, outline);
  box(-28, EDGE, top - 44, top - 22, corn, outline);
  box(-44, EDGE, top - 22, top, corn, outline);
}

function drawModernSide(hs) {
  const { box, dot, f, floorZ, full, outline, seed, wall } = hs;
  for (let k = 1; k < full; k++) { // balconies: a thin white slab, a frameless glass balustrade
    const z = floorZ(k);
    box(-140, 0, z - 4, z, tint(wall, 0.75));
    box(-145, 0, z, z + 18, "#f4f3f0", outline);
    box(-140, -4, z + 18, z + 110, "#bcd3dc", { "fill-opacity": 0.5 });
    box(-140, -4, z + 106, z + 110, "#8e9aa0");
    if ((k + seed) % 3 === 2) { box(-110, -80, z + 18, z + 42, "#9c9a92"); dot(-95, z + 56, 16, "#6fae4f"); }
  }
  box(-60, 160, f.ground - 22, f.ground - 10, "#3c3f43"); // canopy over the lobby
}

function drawPostwarSide(hs) {
  const { box, dot, floorZ, full, outline, pal, seed, wall } = hs;
  // Balconies on the upper floors: a thin concrete slab, a front of ribbed sheet in a colour of the time, a rail.
  const front = pal("povalecnyAccent");
  for (let k = 1; k < full; k++) {
    const z = floorZ(k);
    box(-125, 0, z - 6, z, tint(wall, 0.78));
    box(-130, 0, z, z + 14, "#dcd8cf", outline);
    box(-124, -6, z + 14, z + 96, front, { stroke: tint(front, 0.75), "stroke-width": 1.5, "vector-effect": "non-scaling-stroke" });
    for (let d = -114; d < -12; d += 14) box(d, d + 3, z + 18, z + 92, tint(front, 0.86));
    box(-128, -2, z + 96, z + 102, PV_METAL);
    if ((k + seed) % 3 === 1) { box(-100, -72, z + 96, z + 116, "#b5714a"); dot(-86, z + 128, 15, "#6fae4f"); }
  }
}

function drawFunctionalistSide(hs) {
  const { box, dot, f, floorZ, full, outline, seed, trim, wall } = hs;
  box(-30, EDGE, f.ground - 20, f.ground, trim, outline); // a band over the ground floor
  // About two houses in five have a bay over the street from the 2nd floor up (Žižkov, Vršovice);
  // the others, and the 1st floor under a bay, have balconies with a solid lower part and one rail.
  const bay = seed % 5 < 2 && full >= 4;
  if (bay) {
    const z0 = floorZ(2) - 30, z1 = floorZ(full - 1) + f.storey;
    box(-80, 0, z0 - 10, z0, tint(wall, 0.8)); // soffit
    box(-80, 0, z0, z1, tint(wall, 1.03), outline);
    for (let k = 2; k < full; k++) {
      const zw = floorZ(k) + 0.3 * f.storey;
      box(-65, -15, zw - 4, zw + 0.48 * f.storey + 4, FRAME);
      box(-61, -19, zw, zw + 0.48 * f.storey, GLASS);
    }
  }
  for (let k = 1; k < (bay ? 2 : full); k++) {
    const z = floorZ(k), RAIL = "#5d5f62";
    box(-120, 0, z - 6, z, tint(wall, 0.8));
    box(-125, 0, z, z + 12, trim, outline); // slab
    box(-120, -4, z + 12, z + 60, tint(wall, 0.97), outline); // solid lower part
    box(-120, 0, z + 95, z + 100, RAIL); // the rail
    for (const d of [-120, -70, -20]) box(d, d + 4, z + 60, z + 95, RAIL);
    if ((k + seed) % 3 === 1) { box(-90, -60, z + 60, z + 80, "#b5714a"); dot(-75, z + 92, 14, "#6fae4f"); }
  }
}

function drawHallSide(hs) {
  const { accent, box, dark, dot, poly, shop, top } = hs;
  box(-4, 0, 0, top, dark);
  if (shop) {
    // The awning's side: a wedge sloping out over the entrance, stripes along it, a scalloped valance, an arm.
    // It sits just above the shop window, so a low hall gets it lower too.
    const shopH = Math.min(310, top * 0.5);
    const z0 = shopH + 110, z1 = z0 - 80, reach = 240;
    const aOut = { stroke: tint(accent, 0.75), "stroke-width": 1.5, "vector-effect": "non-scaling-stroke" };
    poly([[0, z0 + 30], [-reach, z1], [-reach, z1 - 60], [0, z0 - 30]], accent, aOut);
    for (const k of [14, 34]) poly([[0, z0 + 30 - k], [-reach, z1 - k], [-reach, z1 - k - 8], [0, z0 + 22 - k]], "#fbf6ea");
    box(-reach, -reach + 14, z1 - 100, z1 - 60, accent, aOut); // valance
    dot(-reach + 7, z1 - 100, 10, accent); // scalloped hem
    poly([[0, shopH - 10], [-reach + 10, z1 - 60], [-reach + 4, z1 - 66], [0, shopH - 18]], "#5f666c");
    // A projecting sign, seen flat from the side, with a trolley on it, on the wall above the
    // awning where there is room, else standing on the roof.
    const zs = Math.min(Math.max(500, top * 0.7), top - 130) >= z0 + 50 ? Math.min(Math.max(500, top * 0.7), top - 130) : top + 60;
    if (zs > top) box(-100, -90, top, zs, dark); // the sign's post on the roof edge
    box(-20, 0, zs + 45, zs + 62, dark);
    box(-170, -20, zs, zs + 110, accent, aOut);
    dot(-95, zs + 55, 40, "#fbf6ea");
    poly([[-120, zs + 70], [-70, zs + 70], [-78, zs + 48], [-112, zs + 48]], accent);
    dot(-110, zs + 40, 6, accent);
    dot(-80, zs + 40, 6, accent);
  }
}
