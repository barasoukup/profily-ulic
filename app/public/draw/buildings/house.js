// A house seen from the side, drawn as a sequence of stages over one context (hs): see drawPrahaBuilding.
import { AMERICA } from "../../houses-america-spec.js";
import { addBalconyHelpers, drawRegionalBalconies } from "./balconies.js";
import { BASE_STYLE, buildingStyle, houseDetails, IPR_ROOF, MED_LOOKS, REGIONAL } from "./style.js";
import { BRICK, FRAME, GLASS, GLINT, LIT, PALETTES, ROOF, ROOF_OF, ROOF_PICK } from "./tables.js";
import { buildingForm } from "./form.js";
import { drawAmericanHouse } from "./america.js";
import { drawArcade, drawStreetFacadeEdge, drawWall } from "./walls.js";
import { drawFacade } from "./facades.js";
import { drawFlatRoof } from "./flat-roofs.js";
import { drawRoof } from "./roofs.js";
import { drawSideFeatures } from "./sides.js";
import { EDGE, el, tint } from "../svg.js";

// d = distance from the street facade into the building (negative: towards the street), z = height above the surface.
let CUT_N = 0;
export function drawPrahaBuilding(root, x, side, surface, info, chosen) {
  const hs = { root, x, side, surface, info, chosen };
  makeHouse(hs);
  if (AMERICA[hs.kind]) return drawAmericanHouse(hs); // North America: a drawing of its own over the same cellar and earth
  addWindowHelpers(hs);
  drawRoof(hs);
  drawWall(hs);
  drawFacade(hs);
  drawFlatRoof(hs);
  drawArcade(hs);
  // --- What sticks out towards the street ---
  drawStreetFacadeEdge(hs);
  drawSideFeatures(hs);
  addBalconyHelpers(hs);
  drawRegionalBalconies(hs);
  return surface - (hs.top + hs.f.roofH + hs.f.chimney);
}

function makeHouse(hs) {
  const { chosen, info, root, side, surface, x } = hs;
  const kind = buildingStyle(info, chosen), style = BASE_STYLE[kind] || kind;
  // The house runs on past the cut (Bára 23. 11. 2026): the next window of its rhythm, standing across the cut, is cut
  // off there by the frame.
  const clipId = `cut${++CUT_N}`, cp = el("clipPath", { id: clipId }, root);
  el("rect", { x: side === "left" ? x : x + EDGE - 1e5, y: -1e5, width: 1e5, height: 2e5 }, cp);
  const g = el("g", { "clip-path": `url(#${clipId})` }, root);
  const f = buildingForm(info, kind);
  // tint belongs to the house (set by derive.js), so a flipped profile keeps each house's colours.
  const seed = (info?.levels || 0) * 7 + Math.round((info?.km || 0) * 10) + (info?.tint ?? (side === "left" ? 0 : 3));
  const det = REGIONAL.has(kind) || AMERICA[kind] ? houseDetails(kind, info) : {};
  const pal = (k) => (k === kind && det.palette ? det.palette : PALETTES[k])[seed % (k === kind && det.palette ? det.palette : PALETTES[k]).length];
  const accent = pal(PALETTES[kind] ? kind : style);
  const med = MED_LOOKS.has(kind), brick = kind === "cihlovy" || kind === "stit" || kind === "dansky", wood = style === "drevo";
  const factory = style === "hala" && ["industrial", "manufacture"].includes(info?.type);
  const sawtooth = factory && IPR_ROOF[info?.roofType] !== "plocha";
  const shop = style === "hala" && ["retail", "supermarket"].includes(info?.type);
  const office = kind === "kancelar";
  // Window frames: brown wood in the cube, anthracite in a new house, cream elsewhere.
  // White frames in the north and in Paris.
  const WF = kind === "kostka" ? "#6b4a35" : kind === "novyrd" ? "#3c3f43" : brick || wood || kind === "stenstad" || kind === "haussmann" || kind === "hanza" ? "#f4f2ec" : FRAME;
  const tile = ROOF_PICK[kind]?.[(seed >> 1) % ROOF_PICK[kind].length] || ROOF_OF[kind] || [ROOF.tile, ROOF.tileDark];
  // A panel house is one colour: the light shade of its insulation colour (Bára: no two-tone field).
  const wall = style === "plocha" ? (office ? pal("plochaWall") : tint(accent, 1.22)) : factory ? BRICK : style === "hala" ? "#cdd4d9" : accent;
  const shade = tint(wall, 0.88), dark = tint(wall, 0.7), trim = tint(wall, 1.12);
  const X = (d) => (side === "left" ? x + EDGE - d : x + d);
  const poly = (pts, fill, extra = {}) => el("path", { d: "M" + pts.map(([d, z]) => `${X(d)} ${surface - z}`).join(" L") + " Z", fill, ...extra }, g);
  // A box reaching the cut has no outline there (the wall runs on past it, Bára 23. 11. 2026): only its top, front and
  // bottom are stroked.
  const box = (d0, d1, z0, z1, fill, extra) => {
    if (!extra?.stroke || d1 < EDGE) return poly([[d0, z0], [d1, z0], [d1, z1], [d0, z1]], fill, extra);
    const { stroke, "stroke-width": sw, "vector-effect": ve, ...rest } = extra;
    poly([[d0, z0], [d1, z0], [d1, z1], [d0, z1]], fill, rest);
    return el("path", { d: `M${X(EDGE)} ${surface - z1} L${X(d0)} ${surface - z1} L${X(d0)} ${surface - z0} L${X(EDGE)} ${surface - z0}`, fill: "none", stroke, "stroke-width": sw, "vector-effect": ve }, g);
  };
  const dot = (d, z, r, fill) => el("circle", { cx: X(d), cy: surface - z, r, fill }, g);
  const outline = { stroke: dark, "stroke-width": 1.5, "vector-effect": "non-scaling-stroke" };
  // Half disc of radius r standing on z, centred at d (an arched transom).
  const arch = (d, z, r, fill) => {
    const [x1, x2] = [X(d - r), X(d + r)].sort((a, b) => a - b);
    el("path", { d: `M${x1} ${surface - z} A ${r} ${r} 0 0 1 ${x2} ${surface - z} Z`, fill }, g);
  };
  const top = f.body;
  const full = f.n - f.roofRows;
  const floorZ = (k) => (k === 0 ? 0 : f.ground + (k - 1) * f.storey); // bottom of floor k
  const floorH = (k) => (k === 0 ? f.ground : f.storey);

  // The window columns of a look (their centres): the front one clear of the facade, the back one in the middle between
  // the door and the old end of the wall, then on the same pitch to the cut and one across it (Bára 23. 11. 2026: no more
  // wall at the cut than between two windows, the next window is there, out of the frame).
  const colAxes = (w) => { const a = Math.max(65, 35 + w / 2), b = (125 + EDGE - 30) / 2, out = [a, b]; for (let c = 2 * b - a; c - w / 2 < EDGE; c += b - a) out.push(c); return out; };
  Object.assign(hs, { kind, style, g, f, seed, det, pal, accent, med, brick, wood, factory, sawtooth, shop, office, WF, tile, wall, shade, dark, trim, X, poly, box, dot, outline, arch, top, full, floorZ, floorH, colAxes });
}

function addWindowHelpers(hs) {
  const { WF, box, brick, dark, det, dot, f, kind, med, outline, pal, poly, seed, shade, trim, wall, wood } = hs;
  // A Streetmix window: cream frame, dark glass with a glint, a transom, a sill with its shadow; now and then
  // a lit pane, a flower box or a curtain.
  hs.noBox = false; // no flower boxes (the gable's windows)
  const window = (d, z, w, h, n) => {
    const luck = (((n + seed * 31) * 2654435761) >>> 0) % 13; // scatters the lit panes, flowers and curtains
    const lit = luck === 5;
    box(d - 10, d + w + 10, z - 22, z - 10, shade); // shadow under the sill
    if (kind === "vila" || kind === "sorela") box(d - 20, d + w + 20, z - 12, z + h + 22, trim, outline); // the window surround (šambrána)
    if (kind === "sorela") box(d - 30, d + w + 30, z + h + 22, z + h + 34, tint(trim, 0.95), outline); // and a little cornice over it
    if (wood) box(d - 16, d + w + 16, z - 12, z + h + 26, "#f6f4ee", outline); // the white boards round a wooden window
    if (med || kind === "stenstad" || kind === "haussmann") box(d - 14, d + w + 14, z - 10, z + h + 16, tint(wall, 1.08)); // the surround a shade lighter
    if (brick) box(d - 10, d + w + 10, z + h + 7, z + h + 24, "#d8cfb5"); // a sandstone lintel
    box(d - 7, d + w + 7, z - 7, z + h + 7, WF);
    box(d, d + w, z, z + h, lit ? LIT : GLASS);
    poly([[d + w * 0.5, z + h], [d + w, z + h], [d + w, z + h * 0.55]], lit ? "#f8e7b5" : GLINT);
    if (kind !== "novyrd") box(d + w / 2 - 3, d + w / 2 + 3, z, z + h, WF);
    if (kind !== "statek") box(d, d + w, z + h * (kind === "kostka" ? 0.62 : 0.7) - 3, z + h * (kind === "kostka" ? 0.62 : 0.7) + 3, WF);
    else box(d, d + w, z + h * 0.5 - 3, z + h * 0.5 + 3, WF); // a village window: a cross
    if (kind === "drevak") box(d, d + w, z + h * 0.35 - 3, z + h * 0.35 + 3, WF); // six panes
    if (brick) box(d, d + w, z + h * 0.45 - 3, z + h * 0.45 + 3, WF); // the sash window's meeting rail
    box(d - 12, d + w + 12, z - 12, z - 4, dark); // sill
    if (kind === "haussmann" && z > f.ground) { // a French window: its low iron guard instead of a flower box
      box(d - 4, d + w + 4, z + h * 0.3 - 4, z + h * 0.3, "#2b2d2f");
      box(d - 4, d + w + 4, z + 4, z + 7, "#2b2d2f");
      for (let dd = d; dd <= d + w; dd += 10) box(dd - 1.2, dd + 1.2, z, z + h * 0.3, "#2b2d2f");
    } else if ((luck === 2 || luck === 9 || luck === 11 || n === 3) && !lit && !hs.noBox) {
      box(d - 4, d + w + 4, z - 28, z - 12, "#9b6a45");
      for (let i = 0; i < 4; i++) dot(d + 6 + (i * (w - 12)) / 3, z - 6, 9, i % 2 ? "#e2607a" : "#6fae4f");
    } else if (luck === 7) { // a net curtain with a wavy hem
      box(d + 4, d + w / 3, z + 14, z + h - 4, "#efe6cf", { "fill-opacity": 0.5 });
      for (let i = 0; i < 3; i++) dot(d + 4 + ((i + 0.5) * (w / 3 - 4)) / 3, z + 14, 5, "#efe6cf");
    }
  };
  // The south's shutters beside a window (persiane: louvred leaves, now and then one closed over it), or Spain's roller
  // blind let partly down under its box.
  const shutterCol = kind === "kypr" ? pal("kyprShutter") : kind === "malta" ? pal("maltaAccent") : pal("stredomoriShutter");
  const shutters = (d, z, w, h, n) => {
    const luck = (((n + seed * 31) * 2654435761) >>> 0) % 13;
    if (det.blinds) {
      const down = luck % 3 === 0 ? 0.6 : luck % 3 === 1 ? 0.3 : 0.1, BL = luck % 2 ? "#cdbb9a" : "#e3ddcf";
      box(d - 4, d + w + 4, z + h + 7, z + h + 24, tint(wall, 0.92), outline);
      box(d, d + w, z + h * (1 - down), z + h, BL);
      for (let zz = z + h - 7; zz > z + h * (1 - down) + 2; zz -= 7) box(d, d + w, zz - 1, zz, tint(BL, 0.82));
      return;
    }
    const leaf = (a, b) => {
      box(a, b, z - 4, z + h + 4, shutterCol, { stroke: tint(shutterCol, 0.7), "stroke-width": 1, "vector-effect": "non-scaling-stroke" });
      for (let zz = z + 8; zz < z + h; zz += 9) box(a + 4, b - 4, zz - 1.2, zz + 1.2, tint(shutterCol, 0.75));
    };
    if (luck === 4) { leaf(d, d + w / 2); leaf(d + w / 2, d + w); return; } // closed
    const lw = Math.min(w / 2, 48), lf = Math.min(lw, d - 20); // the front leaf stays on the wall
    if (lf >= lw) leaf(d - 8 - lf, d - 8); // a whole leaf or none (never one cut by the corner)
    leaf(d + w + 8, d + w + 8 + lw);
  };
  // A canopy over a door on the side wall, seen from the front: a slab, its shadow, two brackets.
  const canopy = (d0, d1, z, fill) => {
    const over = Math.min(20, d0 - 4); // never past the facade
    box(d0 - over, d1 + over, z, z + 12, tint(wall, 0.8));
    box(d0 - over, d1 + over, z + 12, z + 32, fill);
    for (const d of [d0 - over + 8, d1 + over - 8]) poly([[d - 6, z + 12], [d + 6, z + 12], [d, z - 14]], tint(fill, 0.85));
  };
  Object.assign(hs, { window, shutterCol, shutters, canopy });
}
