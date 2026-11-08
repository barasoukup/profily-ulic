// SVG drawing and direct editing of a street profile. Drawing units are centimetres,
// matching the Streetmix illustrations (1 px = 1 cm).
import { TYPES, SOURCES, PARKING_USE } from "./types.js";

const NS = "http://www.w3.org/2000/svg";
const GROUND = 760; // roadway surface
const CURB = 15;
const EDGE = 400; // width drawn for the building / open edge
const FLOOR = 3.5; // typical floor height for estimating floors from a building's height (m)
const H = 1000;

const SPRITE_FILES = [
  "car-inbound", "car-outbound", "streetcar-inbound", "streetcar-outbound", "bus-inbound", "bus-outbound",
  "biker-01-inbound", "biker-01-outbound", "people-01", "people-05", "people-12", "people-20", "people-27",
  "tree", "bush",
  "car-sideways-left", "car-sideways-right", "car-angled-front-left", "car-angled-front-right",
  "bench-center", "cafe-seating-occupied", "bike-rack-perpendicular-left", "bikeshare-left",
  "transit-shelter-01-left", "transit-shelter-01-right", "bollard", "planter-box", "guardrail",
  "lamp-modern-left", "lamp-modern-right",
];
const PEOPLE = ["people-01", "people-05", "people-12", "people-20", "people-27"];
// Prague illustrations (praha/) standing in for Streetmix ones; the rest stays Streetmix.
const PRAHA = {
  "streetcar-inbound": "t3-inbound", "streetcar-outbound": "t3-outbound", "bus-inbound": "bus-inbound", "bus-outbound": "bus-outbound",
  "lamp-modern-left": "lamp-left", "lamp-modern-right": "lamp-right", "bench-center": "bench-center",
  "bike-rack-perpendicular-left": "bike-rack", "bollard": "bollard",
  "transit-shelter-01-left": "transit-shelter-left", "transit-shelter-01-right": "transit-shelter-right",
  "transit-shelter-tram-left": "transit-shelter-tram-left", "transit-shelter-tram-right": "transit-shelter-tram-right",
};
// Prague buildings are drawn from the side (we look along the street): the outline tells the type.
export const BUILDING_STYLES = { sikma: "dům se šikmou střechou", plocha: "dům s plochou střechou", nizky: "nízký dům", hala: "hala" };
const OLD_STYLES = { centrum: "sikma", "centrum-obchod": "sikma", sidliste: "plocha", "sidliste-lodzie": "plocha", rd: "nizky" };
const HOUSE_TYPES = new Set(["house", "detached", "semidetached_house", "terrace", "bungalow", "villa", "farm", "garage", "garages", "shed"]);
const HALL_TYPES = new Set(["retail", "supermarket", "industrial", "manufacture", "warehouse", "hangar", "sports_hall", "service", "commercial_hall"]);
const HALL_AREA = 1200; // m²: a footprint this big on up to 3 floors reads as a hall
const FLAT_RESIDENTIAL = new Set(["apartments", "residential", "dormitory"]); // flat-roofed homes get balconies
// IPR "Podlažnosti" roof shape (domain URK_STRECHA): 1 pitched, 3 flat, 4 atypical (mix), 5 dome, 99 unknown.
const IPR_ROOF = { 1: "sikma", 3: "plocha", 5: "sikma" };
const INNER_KM = 3; // within this from the centre an unknown building is taken for a pitched-roof tenement
const STOREY = { sikma: 360, plocha: 290, nizky: 300, hala: 700 }; // typical storey (cm); a hall is one tall storey
const DEFAULT_FLOORS = { sikma: 5, plocha: 8, nizky: 1, hala: 1 };
const PITCH = Math.tan((40 * Math.PI) / 180);
const RIDGE = 260; // ridge of a family house, from its street facade (cm)
// Side windows: width and gap (cm), sill and height as a share of the storey.
const WINDOWS = { sikma: { w: 85, gap: 60, sill: 0.24, h: 0.56 }, plocha: { w: 120, gap: 50, sill: 0.3, h: 0.45 },
  nizky: { w: 85, gap: 70, sill: 0.3, h: 0.45 }, hala: {} };
// Streetmix-like colours: saturated pastel walls, dark glass with a diagonal glint, cream frames.
const PALETTES = {
  sikma: ["#e7b96a", "#d99a86", "#8fb79a", "#86a9c6", "#e0c98f"],
  plocha: ["#f2b84b", "#5fae7a", "#4f8fc4", "#e9785a"], // accent on a light pastel wall
  plochaWall: ["#e6dcc4", "#d6e2e6", "#ecd5c7", "#dfe6cf"],
  nizky: ["#efd29a", "#ece4d2", "#e6bfa9"],
  hala: ["#e0574f", "#3f88c5", "#4caf7d"],
};
const ROOF = { tile: "#c25a3c", tileDark: "#8f3f2b", slate: "#4f5d6b", slateDark: "#36414c" };
const BRICK = "#b8644a", SKLEP = "#8e8a82";
const GLASS = "#2f3557", GLINT = "#454a75", LIT = "#f4d98c", FRAME = "#f6efdf", DOOR = "#7a4f3a", STONE = "#b9ab8f";
const OFFICE_TYPES = new Set(["office", "commercial", "civic", "government", "public", "school", "university", "hospital", "hotel"]);
const TALL_SHARE = 0.45; // the most of the view's width a building may rise above the ground
let labelTop = -Infinity; // building labels stay below this y (set per drawing in buildSvg)
const sprites = {};
let art = "praha"; // "praha" or "streetmix"
export const setArt = (a) => { art = a; };
export const getArt = () => art;

// A missing or broken illustration is left out of the drawing instead of stopping the app.
async function loadSprite(key, path) {
  try {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`${r.status}`);
    const text = await r.text();
    const vb = text.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
    if (!vb) throw new Error("bez viewBox");
    const uri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(text);
    sprites[key] = { uri, w: vb[2], h: vb[3] };
  } catch (err) {
    console.warn("ilustrace chybí", path, err.message);
  }
}

export async function loadSprites() {
  await Promise.all([
    ...SPRITE_FILES.map((name) => loadSprite(name, `streetmix/${name}.svg`)),
    ...[...new Set(Object.values(PRAHA))].map((file) => loadSprite(`praha/${file}`, `praha/${file}.svg`)),
  ]);
}

const el = (name, attrs = {}, parent) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};

const fmt = (m) => m.toFixed(2).replace(".", ",") + " m";
export const totalWidth = (p) => p.segments.reduce((a, s) => a + s.width, 0);

const TURNS = { left: "vlevo", slight_left: "mírně vlevo", sharp_left: "ostře vlevo", through: "rovně", right: "vpravo",
  slight_right: "mírně vpravo", sharp_right: "ostře vpravo", reverse: "otočení", merge_to_left: "připojení", merge_to_right: "připojení" };
// Street furniture and barriers standing at x on a surface at height top.
function drawItem(g, it, x, top, right) {
  const line = (attrs) => el("rect", attrs, g);
  switch (it.kind) {
    case "lampa": return sprite(g, right ? "lamp-modern-right" : "lamp-modern-left", x, top);
    // The Prague bench has its back on the left: on the right half it turns to face the street too.
    case "lavicka": return sprite(g, "bench-center", x, top, right);
    case "stojan_kola": return sprite(g, "bike-rack-perpendicular-left", x, top);
    case "sdilena_kola": return sprite(g, "bikeshare-left", x, top);
    case "pristresek": {
      const side = right ? "right" : "left";
      return sprite(g, art === "praha" && it.tram ? `transit-shelter-tram-${side}` : `transit-shelter-01-${side}`, x, top);
    }
    case "sloupek": return sprite(g, "bollard", x, top);
    case "kvetinac": return sprite(g, "planter-box", x, top);
    case "svodidlo": return sprite(g, "guardrail", x, top);
    case "zahradka": return sprite(g, "cafe-seating-occupied", x, top);
    case "zivy_plot": return sprite(g, "bush", x, top);
    case "plot":
      line({ x: x - 4, y: top - 150, width: 8, height: 150, fill: "#6b6a65" });
      for (let k = 0; k < 3; k++) line({ x: x - 30, y: top - 140 + k * 45, width: 60, height: 5, fill: "#6b6a65" });
      return;
    case "zabradli":
      line({ x: x - 3, y: top - 100, width: 6, height: 100, fill: "#55534d" });
      line({ x: x - 40, y: top - 100, width: 80, height: 6, fill: "#55534d" });
      return;
    case "oporna_zed":
      line({ x: x - 15, y: top - 120, width: 30, height: 120, fill: "#a39e92" });
      return;
    case "rozcestnik":
      line({ x: x - 4, y: top - 230, width: 8, height: 230, fill: "#3d3b36" });
      line({ x: x - 40, y: top - 240, width: 80, height: 60, fill: "#2f5f8f" });
      return;
    case "taxi":
      line({ x: x - 4, y: top - 230, width: 8, height: 230, fill: "#3d3b36" });
      line({ x: x - 45, y: top - 250, width: 90, height: 45, fill: "#e8c23a" });
      el("text", { x, y: top - 218, "text-anchor": "middle", "font-size": 30, fill: "#1f1f1d" }, g).textContent = "TAXI";
      return;
    case "svah":
      el("path", { d: `M ${x - 40} ${top} L ${x} ${top - 40} L ${x + 40} ${top} Z`, fill: "#9b7f5f", opacity: 0.6 }, g);
      return;
  }
}

// Direction of the nearest driving lane, so parked cars face the traffic next to them.
function laneDir(segs, i) {
  for (let d = 1; d < segs.length; d++) {
    for (const j of [i - d, i + d]) {
      if (["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu"].includes(segs[j]?.type)) return segs[j].dir || "forward";
    }
  }
  return "forward";
}

export const ORIENT_LABEL = { podelne: "podélné", sikme: "šikmé", kolme: "kolmé" };
export const turnLabel = (v) => v.split(";").map((x) => TURNS[x] || x).join(" + ");

function sprite(g, name, cx, bottom, flip = false) {
  const s = (art === "praha" && sprites[`praha/${PRAHA[name]}`]) || sprites[name];
  if (!s) return;
  const img = el("image", { href: s.uri, width: s.w, height: s.h, x: cx - s.w / 2, y: bottom - s.h }, g);
  if (flip) img.setAttribute("transform", `translate(${2 * cx} 0) scale(-1 1)`);
}

// Building height in metres: tagged in OSM, else from floors (FLOOR per floor).
export function buildingHeight(info) {
  if (!info) return null;
  return info.height || (info.levels ? info.levels * FLOOR : null);
}

// Floors: IPR "Podlažnosti" (cornice + roof floors) or OSM building:levels.
export function buildingLevels(info) {
  if (!info?.levels) return null;
  return { n: info.levels, cornice: info.cornice, roof: info.roof };
}

// Building style: set by hand, else from IPR (roof shape, kind of object, footprint) and the OSM building type.
// Checked on the 100 sample cuts (evaluation/data/budovy3-hodnoceni-*.md).
export function buildingStyle(info, chosen) {
  const set = OLD_STYLES[chosen] || chosen;
  if (BUILDING_STYLES[set]) return set;
  const h = buildingHeight(info);
  const n = info?.levels || (h ? Math.round(h / FLOOR) : null);
  const roof = IPR_ROOF[info?.roofType];
  const cornice = info?.cornice || info?.levels; // a height alone says nothing about floors in a hall
  // Halls: an OSM shop or works building, or a big low footprint, unless IPR says pitched roof on 3+ floors.
  const big = info?.area >= HALL_AREA && !HOUSE_TYPES.has(info?.type);
  if ((HALL_TYPES.has(info?.type) || big || (info?.iprKind === 3 && info?.area >= HALL_AREA / 4)) && !(cornice > 2) && roof !== "sikma") return "hala";
  if (info?.iprKind === 6 || HOUSE_TYPES.has(info?.type) || (n && n <= 2)) return "nizky";
  if (roof) return roof;
  // Nothing known about the building: a tenement in the inner city, a small house elsewhere (least misleading).
  if (!n) return info?.km > INNER_KM ? "nizky" : "sikma";
  return info?.km > INNER_KM ? "plocha" : "sikma";
}

// Side outline of a Prague building: floors, storey height, roof floors and the height of each part (cm).
function buildingForm(info, style) {
  const lv = buildingLevels(info);
  const h = buildingHeight(info);
  const n = style === "hala" ? 1 : Math.max(1, lv?.n || (h ? Math.round(h / FLOOR) : DEFAULT_FLOORS[style]));
  const roofRows = style !== "hala" && lv?.roof && lv.cornice ? Math.min(lv.roof, n - 1) : 0;
  const S = STOREY[style];
  // A known height sets the storey (within reason); pitched roofs sit above it.
  const storey = h ? Math.min(S * 1.5, Math.max(S * 0.7, (h * 100) / n)) : S;
  // Tenements have a taller ground floor.
  const ground = style === "sikma" ? storey * 1.2 : storey;
  const body = ground + (n - roofRows - 1) * storey;
  const flat = style === "plocha" || style === "hala" || (style === "nizky" && IPR_ROOF[info?.roofType] === "plocha");
  const sawtooth = style === "hala" && ["industrial", "manufacture"].includes(info?.type) && IPR_ROOF[info?.roofType] !== "plocha";
  // A family house shows its ridge inside the 4 m strip; a tenement's ridge lies deeper, past the cut.
  const pitched = style === "nizky" ? (RIDGE + 55) * PITCH + 45 : (EDGE + 35) * PITCH + 45;
  const roofH = flat ? roofRows * storey + (sawtooth ? 430 : style === "hala" ? 110 : 50) : roofRows ? roofRows * storey + 170 : pitched;
  return { n, roofRows, storey, ground, body, roofH, flat, chimney: flat ? 0 : 70 };
}

export function edgeHeight(kind, info, style) {
  if (kind !== "budova") return 0;
  if (art !== "praha") return (buildingHeight(info) || 0) * 100;
  const f = buildingForm(info, buildingStyle(info, style));
  return f.body + f.roofH + f.chimney;
}

// Darker or lighter shade of a hex colour (k < 1 darkens).
const tint = (hex, k) => "#" + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * k)))
  .toString(16).padStart(2, "0")).join("");

// d = distance from the street facade into the building (negative: towards the street), z = height above the surface.
function drawPrahaBuilding(g, x, side, surface, info, chosen) {
  const style = buildingStyle(info, chosen);
  const f = buildingForm(info, style);
  const seed = (info?.levels || 0) * 7 + Math.round((info?.km || 0) * 10) + (side === "left" ? 0 : 3);
  const pal = (k) => PALETTES[k][seed % PALETTES[k].length];
  const accent = pal(style === "plocha" ? "plocha" : style === "hala" ? "hala" : style);
  const factory = style === "hala" && ["industrial", "manufacture"].includes(info?.type);
  const sawtooth = factory && IPR_ROOF[info?.roofType] !== "plocha";
  const shop = style === "hala" && ["retail", "supermarket"].includes(info?.type);
  const wall = style === "plocha" ? pal("plochaWall") : factory ? BRICK : style === "hala" ? "#cdd4d9" : accent;
  const shade = tint(wall, 0.88), dark = tint(wall, 0.7), trim = tint(wall, 1.12);
  const office = style === "plocha" && OFFICE_TYPES.has(info?.type);
  // Balconies take a colour of their own, two steps round the palette from the insulation field.
  const balcony = PALETTES.plocha[(seed + 2) % PALETTES.plocha.length];
  const X = (d) => (side === "left" ? x + EDGE - d : x + d);
  const poly = (pts, fill, extra = {}) => el("path", { d: "M" + pts.map(([d, z]) => `${X(d)} ${surface - z}`).join(" L") + " Z", fill, ...extra }, g);
  const box = (d0, d1, z0, z1, fill, extra) => poly([[d0, z0], [d1, z0], [d1, z1], [d0, z1]], fill, extra);
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

  // A Streetmix window: cream frame, dark glass with a glint, a transom, a sill with its shadow; now and then
  // a lit pane, a flower box or a curtain.
  const window = (d, z, w, h, n) => {
    const luck = (((n + seed * 31) * 2654435761) >>> 0) % 13; // scatters the lit panes, flowers and curtains
    const lit = luck === 5;
    box(d - 10, d + w + 10, z - 22, z - 10, shade); // shadow under the sill
    box(d - 7, d + w + 7, z - 7, z + h + 7, FRAME);
    box(d, d + w, z, z + h, lit ? LIT : GLASS);
    poly([[d + w * 0.5, z + h], [d + w, z + h], [d + w, z + h * 0.55]], lit ? "#f8e7b5" : GLINT);
    box(d + w / 2 - 3, d + w / 2 + 3, z, z + h, FRAME);
    box(d, d + w, z + h * 0.7 - 3, z + h * 0.7 + 3, FRAME);
    box(d - 12, d + w + 12, z - 12, z - 4, dark); // sill
    if ((luck === 2 || luck === 9 || luck === 11 || n === 3) && !lit) {
      box(d - 4, d + w + 4, z - 28, z - 12, "#9b6a45");
      for (let i = 0; i < 4; i++) dot(d + 6 + (i * (w - 12)) / 3, z - 6, 9, i % 2 ? "#e2607a" : "#6fae4f");
    } else if (luck === 7) { // a net curtain with a wavy hem
      box(d + 4, d + w / 3, z + 14, z + h - 4, "#efe6cf", { "fill-opacity": 0.5 });
      for (let i = 0; i < 3; i++) dot(d + 4 + ((i + 0.5) * (w / 3 - 4)) / 3, z + 14, 5, "#efe6cf");
    }
  };
  // A canopy over a door on the side wall, seen from the front: a slab, its shadow, two brackets.
  const canopy = (d0, d1, z, fill) => {
    const over = Math.min(20, d0 - 4); // never past the facade
    box(d0 - over, d1 + over, z, z + 12, tint(wall, 0.8));
    box(d0 - over, d1 + over, z + 12, z + 32, fill);
    for (const d of [d0 - over + 8, d1 + over - 8]) poly([[d - 6, z + 12], [d + 6, z + 12], [d, z - 14]], tint(fill, 0.85));
  };
  const row = (d0, d1, z, h, n) => {
    const win = WINDOWS[style];
    const count = Math.max(1, Math.floor((d1 - d0 - win.gap) / (win.w + win.gap)));
    const start = d0 + (d1 - d0 - count * win.w - (count - 1) * win.gap) / 2;
    for (let i = 0; i < count; i++) window(start + i * (win.w + win.gap), z, win.w, h, n * 3 + i);
  };

  // --- Roof and gable, behind the wall ---
  if (style === "sikma" && f.roofRows) {
    // Mansard: steep slate slope with a dormer, shallow top; the gable end has the attic windows.
    const rise = f.roofRows * f.storey, run = rise * 0.28, zt = top + rise;
    const zBack = zt + (EDGE - run) * 0.3;
    // Chimney first: the roof and the gable hide its foot.
    box(EDGE - 175, EDGE - 125, zt, zBack + 80, "#c46a4b");
    box(EDGE - 183, EDGE - 117, zBack + 70, zBack + 82, "#8d4a34");
    poly([[0, top], [run, zt], [EDGE, zBack], [EDGE, top]], shade, outline);
    // A slate slab as thick as the tiled ones: dark underside, then the slate, a gutter at the foot and at the break.
    poly([[-30, top - 4], [run - 16, zt + 40], [EDGE, zBack + 40], [EDGE, zBack], [run, zt], [0, top]], ROOF.slate);
    poly([[-8, top], [run - 4, zt + 10], [EDGE, zBack + 10], [EDGE, zBack], [run, zt], [0, top]], ROOF.slateDark);
    dot(-26, top - 6, 10, ROOF.slateDark);
    dot(run - 14, zt + 30, 8, ROOF.slateDark);
    for (let k = 0; k < f.roofRows; k++) row(run + 40, EDGE - 40, top + k * f.storey + 0.25 * f.storey, 0.5 * f.storey, full + k);
    // Dormer: only its cheek shows, between the steep slope and its face, under a little roof.
    const slopeD = (z) => ((z - top) / rise) * run;
    const zb = top + rise * 0.3, zc = zb + 140, dF = Math.max(4, slopeD(zb) - 30);
    poly([[slopeD(zb), zb], [dF, zb], [dF, zc], [slopeD(zc), zc]], tint(ROOF.slate, 1.35), outline);
    box(dF, dF + 10, zb, zc, ROOF.slateDark); // the window frame, edge-on
    poly([[dF - 14, zc], [slopeD(zc), zc], [slopeD(zc), zc + 34], [dF - 14, zc + 14]], ROOF.slateDark); // its little roof
  } else if (!f.flat) {
    const eave = style === "nizky" ? 55 : 35;
    const ridge = style === "nizky" ? RIDGE : EDGE + 200;
    // The underside of the roof meets the wall top at the facade; the eaves reach lower, over the street.
    const z = (d) => top + 12 + Math.min(d, ridge) * PITCH - Math.max(0, d - ridge) * PITCH;
    // Chimney first (the roof hides its foot), then the gable up to the roof, then a thick tiled slab.
    const dc = style === "nizky" ? RIDGE + 50 : EDGE - 80;
    box(dc - 24, dc + 24, top, z(dc) + 100, "#c46a4b");
    box(dc - 32, dc + 32, z(dc) + 90, z(dc) + 102, "#8d4a34");
    poly([[0, top], [Math.min(ridge, EDGE), z(Math.min(ridge, EDGE)) - 12], [EDGE, z(EDGE) - 12], [EDGE, top]], shade, outline);
    const slab = (d0, d1) => {
      poly([[d0, z(d0)], [d1, z(d1)], [d1, z(d1) + 30], [d0, z(d0) + 30]], ROOF.tile);
      poly([[d0, z(d0) - 12], [d1, z(d1) - 12], [d1, z(d1)], [d0, z(d0)]], ROOF.tileDark);
    };
    slab(-eave, Math.min(ridge, EDGE));
    if (ridge < EDGE) slab(ridge, EDGE);
    box(0, EDGE, top - 26, top, shade); // shadow under the eaves
    if (style === "sikma") for (const d of [-eave + 10, -eave / 2 + 2]) box(d - 5, d + 5, top - 16, z(d) - 12, ROOF.tileDark); // brackets
    else dot(-eave + 2, z(-eave) - 16, 10, tint(ROOF.tileDark, 0.9)); // gutter
    if (f.roofRows || style === "nizky") {
      // A window in the gable, under the ridge where the gable is highest, kept clear of the roof.
      const ww = 75, wh = Math.min(95, z(RIDGE - ww / 2 - 10) - 12 - top - 60 - 10);
      window(RIDGE - ww / 2, top + 50, ww, wh, 1);
    } else {
      dot(200, top + 100, 30, FRAME); // a round window in the gable, well under the roof
      dot(200, top + 100, 22, GLASS);
    }
  }

  // --- The side wall, with its plinth (drawn before the door, which stands on the ground) ---
  // Under the building: a cellar band and the same earth as under the street.
  const cellar = GROUND + 60 - surface;
  el("rect", { x, y: surface, width: EDGE, height: cellar, fill: SKLEP }, g);
  box(0, EDGE, -8, 0, tint(SKLEP, 0.85));
  const dCellar = style === "hala" || office ? 32 : 230; // under the ground-floor window, not under the door
  box(dCellar, dCellar + 66, -cellar * 0.55 - 6, -cellar * 0.55 + 31, FRAME); // a cellar window
  box(dCellar + 6, dCellar + 60, -cellar * 0.55, -cellar * 0.55 + 25, GLASS);
  el("rect", { x, y: GROUND + 60, width: EDGE, height: 40, fill: "#9b7f5f" }, g);
  box(0, EDGE, 0, top, wall, outline);
  box(EDGE - 30, EDGE, 0, top, shade); // the wall turns away at the cut
  const plinth = office ? [20, "#8a867d"] : { sikma: [90, STONE], plocha: [80, "#8a867d"], nizky: [60, "#a59c88"] }[style];
  if (style === "plocha" && !office) {
    // Prague estate insulation ("parrot" colours): a big coloured field, a quieter ground floor.
    box(EDGE * 0.45, EDGE - 30, 0, top, tint(accent, 1.22));
    box(0, EDGE * 0.45, 0, f.ground, tint(wall, 0.92));
  }
  if (plinth) box(-8, EDGE - 30, 0, plinth[0], plinth[1]);

  // Windows and the ground floor.
  if (factory) {
    // A Prague brick factory hall: brick courses, a dark plinth, tall gridded industrial windows.
    for (let z = 30; z < top; z += 30) box(0, EDGE - 30, z - 2, z + 2, tint(wall, 0.88));
    box(0, EDGE - 30, 0, 70, "#8a5a48");
    const wh = Math.min(top - 220, 420), z0 = 120;
    for (const d of [130, 255]) {
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
  } else if (style === "hala") {
    const zr = top * 0.55, hr = Math.min(170, top * 0.25);
    for (let d = 20; d < EDGE - 30; d += 30) box(d, d + 3, 0, top - 40, shade); // corrugated cladding
    box(0, EDGE - 30, zr - 8, zr + hr + 8, FRAME);
    box(8, EDGE - 38, zr, zr + hr, GLASS);
    poly([[EDGE - 170, zr + hr], [EDGE - 120, zr + hr], [EDGE - 180, zr], [EDGE - 230, zr]], GLINT);
    const span = EDGE - 46, parts = Math.round(span / 120);
    for (let i = 1; i < parts; i++) box(8 + (i * span) / parts - 3, 8 + (i * span) / parts + 3, zr, zr + hr, FRAME);
    box(0, EDGE - 30, top - 80, top - 40, accent); // coloured band
    if (shop) {
      box(0, 190, 0, 310, FRAME);
      box(8, 182, 0, 300, GLASS);
      box(93, 97, 0, 300, FRAME);
      poly([[100, 300], [182, 300], [182, 200]], GLINT);
    } else {
      box(150, 340, 0, 340, "#9aa3aa", outline); // roller door
      for (let z = 20; z < 340; z += 30) box(150, 340, z, z + 4, "#868f96");
    }
  } else if (office) {
    // Offices: ribbon windows with mullions, a glazed ground floor.
    for (let k = 0; k < full; k++) {
      const z0 = floorZ(k), h = floorH(k);
      box(0, EDGE - 40, z0 + h * 0.08, z0 + h * (k ? 0.82 : 0.9), FRAME);
      box(8, EDGE - 48, z0 + h * 0.12, z0 + h * (k ? 0.78 : 0.86), GLASS);
      const gTop = z0 + h * (k ? 0.78 : 0.86);
      poly([[EDGE - 150, gTop], [EDGE - 100, gTop], [EDGE - 160, z0 + h * 0.12], [EDGE - 210, z0 + h * 0.12]], GLINT);
      for (let d = 8 + 120; d < EDGE - 48; d += 120) box(d - 3, d + 3, z0 + h * 0.12, gTop, FRAME);
      if (k) { box(0, EDGE, z0 - 4, z0 + h * 0.08, accent); box(EDGE - 30, EDGE, z0 - 4, z0 + h * 0.08, tint(accent, 0.9)); } // spandrel band
    }
    box(14, 116, 0, 262, FRAME); // glazed entrance with a flat canopy
    box(22, 108, 0, 254, GLASS);
    box(63, 67, 0, 254, FRAME);
    canopy(14, 116, 262, dark);
  } else {
    // Door near the street (arched in a tenement), windows behind it, and on every floor above.
    const doorH = Math.min(240, f.ground * 0.72);
    box(10, 120, 0, 14, tint(plinth?.[1] || STONE, 1.15)); // doorstep
    box(16, 114, 14, doorH + 10, FRAME);
    box(24, 106, 14, doorH, DOOR);
    dot(94, doorH * 0.4, 5, "#f2d27a");
    if (style === "sikma") { arch(65, doorH + 10, 49, FRAME); arch(65, doorH + 10, 41, GLASS); } // arched transom
    else {
      box(30, 100, doorH * 0.7, doorH - 8, GLASS);
      canopy(16, 114, doorH + 10, style === "nizky" ? ROOF.tile : dark);
    }
    // The windows above stand in the axes of the door and of the ground-floor window.
    const win = WINDOWS[style];
    const groundAt = (125 + EDGE - 30 - win.w) / 2;
    window(groundAt, f.ground * win.sill + (style === "sikma" ? 40 : 0), win.w, win.h * f.storey, 0);
    const front = Math.max(65, 35 + win.w / 2); // the front axis keeps clear of the facade
    for (let k = 1; k < full; k++) {
      for (const [i, c] of [front, groundAt + win.w / 2].entries()) window(c - win.w / 2, floorZ(k) + win.sill * f.storey, win.w, win.h * f.storey, k * 3 + i);
    }
  }

  // --- Flat roof: parapet, set-back floors, factory roof lights ---
  if (f.flat) {
    const back = f.roofRows ? 160 : 0;
    if (f.roofRows) {
      box(0, back, top, top + 40, tint(wall, 0.93), outline); // parapet in front of the set-back floor
      box(back, EDGE - 40, top, top + f.roofRows * f.storey, wall, outline);
      for (let k = 0; k < f.roofRows; k++) row(back, EDGE - 40, top + k * f.storey + 0.3 * f.storey, 0.45 * f.storey, full + k);
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
      if (style === "hala") { // an air-handling unit on the roof
        box(EDGE - 150, EDGE - 60, zr, zr + 100, "#aab2b8", outline);
        for (let d = EDGE - 140; d < EDGE - 70; d += 18) box(d, d + 8, zr + 50, zr + 88, "#8f979d");
      }
      box(back - 8, f.roofRows ? EDGE - 32 : EDGE, zr, zr + 40, tint(wall, 0.93), outline);
      box(back - 8, f.roofRows ? EDGE - 32 : EDGE, zr + 32, zr + 42, dark);
    }
  }

  // --- What sticks out towards the street ---
  box(0, 10, plinth ? plinth[0] : 0, top, dark); // the street facade, seen edge-on
  if (style === "sikma") {
    box(-18, EDGE, f.ground - 18, f.ground, trim, outline); // string course
    box(EDGE - 30, EDGE, f.ground - 18, f.ground, tint(trim, 0.9));
    box(-18, EDGE, f.ground - 30, f.ground - 18, shade);
    // Main cornice in three steps, the wall's colour lightened, with its shadow on the wall.
    const corn = tint(wall, 1.15);
    box(-14, EDGE, top - 58, top - 44, corn, outline);
    box(-28, EDGE, top - 44, top - 22, corn, outline);
    box(-44, EDGE, top - 22, top, corn, outline);
    box(EDGE - 30, EDGE, top - 58, top, tint(corn, 0.9));
    box(0, EDGE, top - 76, top - 58, shade);
  } else if (style === "plocha") {
    if (!office) {
      for (let k = 1; k < full; k++) { // balconies with coloured parapets and a pot of flowers now and then
        const z = floorZ(k);
        box(-130, 0, z - 8, z, tint(wall, 0.75)); // shadow under the slab
        box(-130, 0, z, z + 16, "#8a867d");
        box(-130, -4, z + 16, z + 108, balcony, { stroke: tint(accent, 0.75), "stroke-width": 1.5, "vector-effect": "non-scaling-stroke" });
        box(-130, -4, z + 100, z + 112, tint(balcony, 0.8));
        if (k % 3 === 1) { box(-112, -82, z + 112, z + 134, "#b5714a"); dot(-97, z + 146, 16, "#6fae4f"); dot(-90, z + 158, 7, "#e2607a"); }
      }
    }
  } else if (style === "hala") {
    box(-4, 0, 0, top, dark);
    if (shop) {
      // The awning's side: a wedge sloping out over the entrance, stripes along it, a scalloped valance, an arm.
      const z0 = 420, z1 = 340, reach = 240, za = (d) => z0 - ((z0 - z1) * d) / reach;
      const aOut = { stroke: tint(accent, 0.75), "stroke-width": 1.5, "vector-effect": "non-scaling-stroke" };
      poly([[0, z0 + 30], [-reach, z1], [-reach, z1 - 60], [0, z0 - 30]], accent, aOut);
      for (const k of [14, 34]) poly([[0, z0 + 30 - k], [-reach, z1 - k], [-reach, z1 - k - 8], [0, z0 + 22 - k]], "#fbf6ea");
      box(-reach, -reach + 14, z1 - 100, z1 - 60, accent, aOut); // valance
      dot(-reach + 7, z1 - 100, 10, accent); // scalloped hem
      poly([[0, 300], [-reach + 10, z1 - 60], [-reach + 4, z1 - 66], [0, 292]], "#5f666c");
      // A projecting sign, seen flat from the side, with a trolley on it.
      const zs = Math.max(500, top * 0.7);
      box(-20, 0, zs + 45, zs + 62, dark);
      box(-170, -20, zs, zs + 110, accent, aOut);
      dot(-95, zs + 55, 40, "#fbf6ea");
      poly([[-120, zs + 70], [-70, zs + 70], [-78, zs + 48], [-112, zs + 48]], accent);
      dot(-110, zs + 40, 6, accent);
      dot(-80, zs + 40, 6, accent);
    }
  }
  return surface - (top + f.roofH + f.chimney);
}

// The floor count above an edge building starts at its outer side, clear of the cut end A/B.
const floorLabelAt = (x, side) => (side === "left" ? { x: x + 12, "text-anchor": "start" } : { x: x + EDGE - 12, "text-anchor": "end" });

function drawEdge(svg, x, kind, side, surface, info, style) {
  const g = el("g", {}, svg);
  if (kind === "budova" && art === "praha") {
    let top = drawPrahaBuilding(g, x, side, surface, info, style);
    if (top < labelTop) {
      // Cut off above the view: a torn edge in the background colour says the building goes on.
      const yb = labelTop + 20;
      let d = `M${x - 4} ${yb - 4000} L${x - 4} ${yb}`;
      for (let i = 0; i <= 8; i++) d += ` L${x + (i * (EDGE + 8)) / 8 - 4} ${yb + (i % 2 ? 22 : 0)}`;
      el("path", { d: d + ` L${x + EDGE + 4} ${yb - 4000} Z`, fill: "#fbfaf6" }, g);
      top = yb - 10;
      g.dataset.top = top; // what shows of it, for the page fitting the view (app.js layoutTop)
    }
    const lv = buildingLevels(info);
    const h = buildingHeight(info);
    if (lv || h) {
      const text = lv ? (lv.cornice && lv.roof ? `${lv.cornice} + ${lv.roof} NP` : `${lv.n} NP`)
        : buildingStyle(info, style) === "hala" ? "hala" : "";
      el("text", { ...floorLabelAt(x, side), y: top - 25, "font-size": 32, fill: "#4f4e49", class: "lbl-floor", "data-w": EDGE - 24, "data-free": 1 }, g).textContent =
        [text, h ? `${info.height ? "" : "≈ "}${fmt(h).replace(",00", "")}` : ""].filter(Boolean).join(" · ");
    }
  } else if (kind === "budova") {
    const h = buildingHeight(info);
    const lv = buildingLevels(info);
    const top = h ? surface - h * 100 : 120;
    const rows = lv?.n || 5;
    const fh = (surface - top) / rows;
    // Roof / set-back floors above the cornice are drawn narrower and darker.
    const roofRows = lv?.roof && lv.cornice ? lv.roof : 0;
    const corniceY = surface - (rows - roofRows) * fh;
    const inset = roofRows ? 80 : 0;
    if (roofRows) {
      const rx = side === "left" ? x : x + inset;
      el("rect", { x: rx, y: top, width: EDGE - inset, height: corniceY - top, fill: "#c9bfae", stroke: "#b9ad97", "stroke-width": 3 }, g);
    }
    el("rect", { x, y: corniceY, width: EDGE, height: surface - corniceY, fill: "#ddd3c2", stroke: "#b9ad97", "stroke-width": 3 }, g);
    for (let row = 0; row < rows; row++) {
      const above = row < roofRows;
      for (let col = 0; col < 3; col++) {
        const wx = x + 50 + col * 120;
        if (above && (side === "left" ? wx + 70 > x + EDGE - inset : wx < x + inset)) continue;
        el("rect", { x: wx, y: top + row * fh + fh * 0.25, width: 70, height: fh * 0.5, fill: "#9fb4c2" }, g);
      }
    }
    if (lv) {
      const text = lv.cornice && lv.roof ? `${lv.cornice} + ${lv.roof} NP` : `${lv.n} NP`;
      el("text", { ...floorLabelAt(x, side), y: top - 25, "font-size": 32, fill: "#4f4e49", class: "lbl-floor", "data-w": EDGE - 24, "data-free": 1 }, g).textContent =
        text + (h ? ` · ${info.height ? "" : "≈ "}${fmt(h).replace(",00", "")}` : "");
    }
  } else if (kind === "stavba") {
    // Minor structure (garage, kiosk, wall): a low block.
    el("rect", { x, y: surface, width: EDGE, height: 60 + GROUND - surface, fill: "#e6e3da" }, g);
    const bx = side === "left" ? x + EDGE - 220 : x;
    el("rect", { x: bx, y: surface - 260, width: 220, height: 260, fill: "#cfc8ba", stroke: "#b9ad97", "stroke-width": 3 }, g);
  } else if (kind === "zahrada") {
    el("rect", { x, y: surface, width: EDGE, height: 60 + GROUND - surface, fill: "#a7c66b" }, g);
    const fx = side === "left" ? x + EDGE - 10 : x;
    el("rect", { x: fx, y: surface - 140, width: 10, height: 140, fill: "#6b6a65" }, g);
    for (let k = 0; k < 4; k++) el("rect", { x: side === "left" ? x + EDGE - 160 : x, y: surface - 140 + k * 40, width: 170, height: 6, fill: "#6b6a65" }, g);
    sprite(g, "bush", x + EDGE / 2, surface);
    sprite(g, "tree", side === "left" ? x + 120 : x + EDGE - 120, surface);
  } else if (kind === "voda") {
    el("rect", { x, y: GROUND + 20, width: EDGE, height: 80, fill: "#7fa9cf" }, g);
  } else if (kind === "plot") {
    // Fence or wall: the ground behind it is outside the street.
    el("rect", { x, y: surface, width: EDGE, height: 60 + GROUND - surface, fill: "#e6e3da" }, g);
    const fx = side === "left" ? x + EDGE - 10 : x;
    el("rect", { x: fx, y: surface - 160, width: 10, height: 160, fill: "#6b6a65" }, g);
    for (let k = 0; k < 3; k++) el("rect", { x: side === "left" ? x + EDGE - 120 : x, y: surface - 150 + k * 50, width: 130, height: 6, fill: "#6b6a65" }, g);
  } else if (kind === "parkoviste") {
    el("rect", { x, y: GROUND, width: EDGE, height: 60, fill: "#7b7b78" }, g);
    sprite(g, "car-sideways-left", x + EDGE / 2, GROUND);
  } else if (kind === "zelen") {
    el("rect", { x, y: surface, width: EDGE, height: 60 + GROUND - surface, fill: "#8fbf55" }, g);
    sprite(g, "tree", x + EDGE / 2, surface);
  } else {
    el("rect", { x, y: surface, width: EDGE, height: 60 + GROUND - surface, fill: "#e6e3da" }, g);
  }
  el("text", { class: "lbl-t", "data-row": 1, "data-w": EDGE, x: x + EDGE / 2, y: GROUND + 215, "text-anchor": "middle", "font-size": 30, fill: "#6b6a65" },
    g).textContent = { budova: "budova", stavba: "drobná stavba", voda: "vodní tok / plocha", zahrada: "zahrada, louka (mimo ulici)", zelen: "zeleň (mimo ulici)", parkoviste: "parkoviště (mimo ulici)", plot: "za plotem (mimo ulici)" }[kind] || "";
  return g;
}

// Build an SVG element. opts: {editable, selected, view: [x0, width], onSelect(i)}
export function buildSvg(profile, opts = {}) {
  const segs = profile.segments;
  const total = totalWidth(profile) * 100;
  const view = opts.view || [-EDGE, Math.max(total + 2 * EDGE, 2400)];
  const vx = view[0] - (view[1] - (total + 2 * EDGE)) / 2;
  // Tall buildings at the edges extend the drawing upwards.
  const tallest = Math.max(0, ...["left", "right"].map((k) =>
    edgeHeight(profile.edges?.[k], profile.edges?.[`${k}Info`], profile.edges?.[`${k}Style`])));
  // A tower beside a narrow street would squash the street into a strip: the view shows at most
  // TALL_SHARE of its width above the ground, and taller buildings are cut with a break line.
  const shown = Math.min(tallest, Math.max(1300, view[1] * TALL_SHARE));
  // The top row (total width, cut ends A/B) sits above the tallest building and its floor label.
  const y0 = Math.min(0, GROUND - shown - 140) - 110;
  labelTop = y0 + 190;
  // An export has no screen fitting: the bottom leaves room for all label rows and the credits line.
  const bottom = opts.credits ? H + 110 : H;
  const svg = el("svg", { xmlns: NS, viewBox: `${vx} ${y0} ${view[1]} ${bottom - y0}`, "font-family": "Inter, system-ui, sans-serif",
    role: "img", "aria-label": `Příčný profil, celkem ${fmt(total / 100)}: ` + segs.map((s) => `${TYPES[s.type]?.label || s.type} ${fmt(s.width)}`).join(", ") });
  el("rect", { class: "bg", x: vx, y: y0, width: view[1], height: bottom - y0, fill: "#fbfaf6" }, svg);
  if (opts.credits) {
    // Exported pictures carry the attribution their sources require (CC BY-SA for the illustrations).
    el("text", { x: vx + 30, y: bottom - 25, "font-size": 24, fill: "#6b6a65" }, svg).textContent =
      (art === "praha" ? "Ilustrace © Streetmix (CC BY-SA 4.0) a Profily ulic" : "Ilustrace © Streetmix (CC BY-SA 4.0)") + " · data © IPR Praha a TSK hl. m. Prahy (podlažnosti a parkování CC BY 4.0) · © přispěvatelé OpenStreetMap (ODbL) · obrázek CC BY-SA 4.0";
  }

  const firstRaised = segs[0] && TYPES[segs[0].type]?.raised;
  const lastRaised = segs.at(-1) && TYPES[segs.at(-1).type]?.raised;
  drawEdge(svg, -EDGE, profile.edges?.left || "volno", "left", firstRaised ? GROUND - CURB : GROUND, profile.edges?.leftInfo, profile.edges?.leftStyle);
  drawEdge(svg, total, profile.edges?.right || "volno", "right", lastRaised ? GROUND - CURB : GROUND, profile.edges?.rightInfo, profile.edges?.rightStyle);

  let x = 0;
  const bounds = [0];
  segs.forEach((s, i) => {
    const t = TYPES[s.type] || TYPES.nezname;
    const w = s.width * 100;
    const top = t.raised ? GROUND - CURB : GROUND;
    const g = el("g", { class: "seg" + (opts.selected === i ? " selected" : "") + (opts.changed?.has(i) ? " changed" : ""), "data-i": i }, svg);
    // Name and width on hover, also for parts too narrow for a label.
    el("title", {}, g).textContent = `${t.label}, ${fmt(s.width)}`;
    el("rect", { class: "ground", x, y: top, width: w, height: GROUND + 60 - top, fill: s.color || t.color }, g);
    el("rect", { x, y: GROUND + 60, width: w, height: 40, fill: "#9b7f5f" }, g);
    el("rect", { x: x + 4, y: GROUND + 104, width: Math.max(w - 8, 1), height: 14, fill: SOURCES[s.source]?.color || "#999" }, g);
    const cx = x + w / 2;
    const forward = s.dir !== "backward";
    if (t.tracks) {
      for (const dx of [-72, 72]) el("rect", { x: cx + dx - 6, y: top - 6, width: 12, height: 8, fill: "#3d3b36" }, g);
    }
    if (t.sprite === "people") {
      const n = w >= 300 ? 2 : w >= 140 ? 1 : 0;
      for (let k = 0; k < n; k++) sprite(g, PEOPLE[(i * 2 + k) % PEOPLE.length], x + (w * (k + 1)) / (n + 1), top, k % 2 === 1);
    } else if (s.type === "parkovani" && w >= 180) {
      // Parked car drawn by orientation: front view (parallel), side view (perpendicular), angled.
      const right = cx > total / 2;
      const name = s.orient === "kolme" ? `car-sideways-${right ? "right" : "left"}`
        : s.orient === "sikme" ? `car-angled-front-${right ? "right" : "left"}`
        : laneDir(segs, i) === "backward" ? "car-inbound" : "car-outbound";
      sprite(g, name, cx, top);
    } else if (t.sprite === "car" && w >= 180) {
      sprite(g, forward ? "car-outbound" : "car-inbound", cx, top);
    } else if (t.sprite === "streetcar" && w >= 240) {
      sprite(g, forward ? "streetcar-outbound" : "streetcar-inbound", cx, top - 2);
    } else if (t.sprite === "bus" && w >= 250) {
      sprite(g, forward ? "bus-outbound" : "bus-inbound", cx, top);
    } else if (t.sprite === "biker" && w >= 80) {
      sprite(g, forward ? "biker-01-outbound" : "biker-01-inbound", cx, top);
    } else if (t.sprite === "tree" && w >= 100) {
      sprite(g, "tree", cx, top);
    } else if (t.sprite === "bush" && w >= 100) {
      sprite(g, "bush", cx, top);
    } else if (t.sprite === "cafe" && w >= 150) {
      sprite(g, "cafe-seating-occupied", cx, top);
    }
    if (t.wall) el("rect", { x, y: top - 90, width: w, height: 90, fill: t.color }, g);
    for (const it of s.items || []) drawItem(g, it, x + it.f * w, top, x + it.f * w > total / 2);
    el("text", { class: "lbl-w", "data-row": 0, "data-w": w, x: cx, y: GROUND + 170, "text-anchor": "middle", "font-size": 40, "font-weight": 600, fill: "#1f1f1d" }, g).textContent = fmt(s.width);
    if (w >= 80) {
      const contra = s.bikeDir && s.bikeDir !== (s.dir || "forward");
      const label = s.type === "parkovani" && s.use ? `Stání ${PARKING_USE[s.use]}`
        : s.type === "parkovani" && s.orient ? `Stání ${ORIENT_LABEL[s.orient]}`
        : (t.short || t.label) + (t.directional && s.dir ? (forward ? " ↑" : " ↓") : s.type === "pruh" ? " ↑↓" : "") +
          (contra ? ` kola ${s.bikeDir === "backward" ? "↓" : "↑"}` : "");
      el("text", { class: "lbl-t", "data-row": 1, "data-w": w, x: cx, y: GROUND + 215, "text-anchor": "middle", "font-size": 28, fill: "#4f4e49" }, g).textContent = label;
    }
    if (s.turn) {
      el("text", { class: "lbl-t lbl-turn", "data-row": 2, "data-w": w, x: cx, y: GROUND + 255, "text-anchor": "middle", "font-size": 28, fill: "#185fa5" }, g).textContent = turnLabel(s.turn);
    }
    if (t.sharrow || s.bikeDir || t.bike) {
      // Cyclist sharing the lane (with a painted pictogram on a piktokoridor), possibly in contraflow.
      const bikeFwd = (s.bikeDir || s.dir) !== "backward";
      if (t.sharrow) el("rect", { x: cx - 60, y: top - 4, width: 120, height: 6, fill: "#f2f0ea" }, g);
      sprite(g, bikeFwd ? "biker-01-outbound" : "biker-01-inbound", x + Math.min(w * 0.2, 60) + 20, top);
    }
    if (opts.onSelect) {
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", `${t.label}, ${fmt(s.width)}, ${SOURCES[s.source]?.label || ""}`);
      g.addEventListener("click", () => opts.onSelect(i));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); opts.onSelect(i); } });
    }
    x += w;
    bounds.push(x);
  });

  el("text", { class: "lbl-total top-row", x: total / 2, y: y0 + 70, "text-anchor": "middle", "font-size": 46, "font-weight": 600, fill: "#1f1f1d" }, svg).textContent =
    `Celkem ${fmt(total / 100)}`;
  // Ends of the cut, lettered as on the map (A = left end, B = right end), above everything else.
  // On a narrow street A and B step aside so the total does not run into them (the page redoes
  // this at screen size in layoutTop, an export keeps it).
  const half = (`Celkem ${fmt(total / 100)}`.length * 0.56 * 46) / 2;
  const ends = [Math.min(0, total / 2 - half - 70), Math.max(total, total / 2 + half + 70)];
  for (const [letter, x] of [["A", ends[0]], ["B", ends[1]]]) {
    el("circle", { class: "top-row", cx: x, cy: y0 + 70, r: 52, fill: "#d8413f", stroke: "#fff", "stroke-width": 8 }, svg);
    el("text", { class: "top-row", x, y: y0 + 94, "text-anchor": "middle", "font-size": 68, "font-weight": 700, fill: "#fff" }, svg).textContent = letter;
  }

  if (opts.title) {
    // A title tag in the top left corner, over the building there.
    el("rect", { class: "title-bg", x: vx + 16, y: y0 + 34, width: 60 + opts.title.length * 22, height: 80, rx: 16, fill: "#1d1d1b" }, svg);
    el("text", { class: "lbl-title", x: vx + 46, y: y0 + 90, "font-size": 46, "font-weight": 700, fill: "#fff" }, svg).textContent = opts.title;
  }

  if (opts.editable) {
    bounds.forEach((bx, k) => {
      const h = el("g", { class: "handle", "data-k": k }, svg);
      el("line", { x1: bx, x2: bx, y1: GROUND - 300, y2: GROUND + 120, stroke: "#8a877e", "stroke-width": 2, "stroke-dasharray": "8 6" }, h);
      el("rect", { class: "grab", x: bx - 40, y: GROUND - 340, width: 80, height: 460, fill: "transparent" }, h);
      el("circle", { class: "knob", cx: bx, cy: GROUND - 300, r: 18, fill: "#fff", stroke: "#185fa5", "stroke-width": 5 }, h);
      el("path", { class: "knob", d: `M${bx - 8} ${GROUND - 300} h16 M${bx - 8} ${GROUND - 300} l5 -5 M${bx - 8} ${GROUND - 300} l5 5 M${bx + 8} ${GROUND - 300} l-5 -5 M${bx + 8} ${GROUND - 300} l-5 5`, stroke: "#185fa5", "stroke-width": 3, fill: "none" }, h);
    });
  }
  svg.dataset.view = JSON.stringify(view);
  return svg;
}

// Narrowest width a segment can be dragged to: perpendicular parking keeps 4.5 m (ČSN 73 6056).
const minWidth = (seg) => (seg.type === "parkovani" && seg.orient === "kolme" ? 4.5 : 0.2);

// Mount an editable profile with draggable boundaries.
// onRedraw runs after each drawing (also while a handle is dragged), for the page to fit the labels.
export function mountEditor(container, profile, { selected, onSelect, onChange, onRedraw }) {
  const draw = (view) => {
    container.replaceChildren(buildSvg(profile, { editable: true, selected, onSelect, view }));
    onRedraw?.(container);
    return container.firstChild;
  };
  let svg = draw();
  svg.addEventListener("pointerdown", startDrag);

  function startDrag(ev) {
    const h = ev.target.closest(".handle");
    if (!h) return;
    ev.preventDefault();
    const k = Number(h.dataset.k);
    const view = JSON.parse(svg.dataset.view);
    const toCm = (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse()).x;
    };
    let last = toCm(ev);
    const segs = profile.segments;
    const move = (e) => {
      const xcm = toCm(e);
      let d = Math.round((xcm - last) / 5) * 0.05; // 5 cm steps
      if (!d) return;
      const a = segs[k - 1], b = segs[k];
      if (a && b) {
        d = Math.max(-(a.width - minWidth(a)), Math.min(b.width - minWidth(b), d));
        a.width = +(a.width + d).toFixed(2);
        b.width = +(b.width - d).toFixed(2);
        a.source = b.source = "user";
      } else if (b) {
        d = Math.min(b.width - minWidth(b), d);
        b.width = +(b.width - d).toFixed(2);
        b.source = "user";
      } else if (a) {
        d = Math.max(-(a.width - minWidth(a)), d);
        a.width = +(a.width + d).toFixed(2);
        a.source = "user";
      }
      last += d * 100;
      svg = draw(view);
      svg.addEventListener("pointerdown", startDrag);
    };
    // A cancelled touch (the browser took the gesture) ends the drag like lifting the finger.
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      onChange();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }
}

export function svgString(svgs, gap = 40) {
  if (svgs.length === 1) return new XMLSerializer().serializeToString(svgs[0]);
  // Stack several profiles vertically into one SVG.
  const boxes = svgs.map((s) => s.getAttribute("viewBox").split(" ").map(Number));
  const width = Math.max(...boxes.map((b) => b[2]));
  const height = boxes.reduce((a, b) => a + b[3] + gap, -gap);
  const out = el("svg", { xmlns: NS, viewBox: `0 0 ${width} ${height}` });
  let y = 0;
  svgs.forEach((s, i) => {
    const b = boxes[i];
    const inner = s.cloneNode(true);
    inner.setAttribute("x", (width - b[2]) / 2);
    inner.setAttribute("y", y);
    inner.setAttribute("width", b[2]);
    inner.setAttribute("height", b[3]);
    out.appendChild(inner);
    y += b[3] + gap;
  });
  return new XMLSerializer().serializeToString(out);
}
