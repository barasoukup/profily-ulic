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
  "tree", "bush", "lamp-modern-both",
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
const HALL_TYPES = new Set(["retail", "supermarket", "industrial", "manufacture", "warehouse", "hangar", "sports_hall", "service", "transportation"]);
const FLAT_RESIDENTIAL = new Set(["apartments", "residential", "dormitory"]); // flat-roofed homes get balconies
// IPR "Podlažnosti" roof shape (domain URK_STRECHA): 1 pitched, 3 flat, 4 atypical (mix), 5 dome, 99 unknown.
const IPR_ROOF = { 1: "sikma", 3: "plocha", 5: "sikma" };
const INNER_KM = 3; // within this from the centre an unknown building is taken for a pitched-roof tenement
const STOREY = { sikma: 360, plocha: 290, nizky: 300, hala: 700 }; // typical storey (cm); a hall is one tall storey
const DEFAULT_FLOORS = { sikma: 5, plocha: 8, nizky: 1, hala: 1 };
const PITCH = Math.tan((40 * Math.PI) / 180);
// Side windows: width and gap (cm), sill and height as a share of the storey.
const WINDOWS = { sikma: { w: 80, gap: 55, sill: 0.25, h: 0.55 }, plocha: { w: 120, gap: 45, sill: 0.3, h: 0.45 },
  nizky: { w: 80, gap: 60, sill: 0.3, h: 0.45 }, hala: {} };
const GLASS = "#9fb4c2";
const BUILDING_COLORS = {
  sikma: { wall: "#e8dcc2", line: "#d8caa9", trim: "#f3ead6", roof: "#b8502e", roofDark: "#9c4227", mansard: "#4a5560" },
  plocha: { wall: "#e9e5dc", line: "#d6d0c4", trim: "#d9d3c5", roof: "#c9c3b4", accent: "#e1b23f", sokl: "#8a867d" },
  nizky: { wall: "#ecdcb0", line: "#dccb9c", trim: "#f3e8c8", roof: "#b8502e", roofDark: "#9c4227", sokl: "#a59c88" },
  hala: { wall: "#c9ced2", line: "#b7bdc2", trim: "#aeb4b9", roof: "#9aa1a7", glass: "#8fa6b6", canopy: "#5f666c" },
};
const sprites = {};
let art = "praha"; // "praha" or "streetmix"
export const setArt = (a) => { art = a; };
export const getArt = () => art;

async function loadSprite(key, path) {
  const text = await (await fetch(path)).text();
  const vb = text.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const uri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(text)));
  sprites[key] = { uri, w: vb[2], h: vb[3] };
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

// Building style: set by hand, else from the OSM building type, the IPR roof type and the number of floors.
export function buildingStyle(info, chosen) {
  const set = OLD_STYLES[chosen] || chosen;
  if (BUILDING_STYLES[set]) return set;
  const h = buildingHeight(info);
  const n = info?.levels || (h ? Math.round(h / FLOOR) : null);
  if (HALL_TYPES.has(info?.type) && !(n > 4)) return "hala";
  if (HOUSE_TYPES.has(info?.type) || (n && n <= 2)) return "nizky";
  if (IPR_ROOF[info?.roofType]) return IPR_ROOF[info.roofType];
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
  const body = (n - roofRows) * storey;
  const flat = style === "plocha" || style === "hala" || (style === "nizky" && IPR_ROOF[info?.roofType] === "plocha");
  const sawtooth = style === "hala" && ["industrial", "manufacture"].includes(info?.type);
  const roofH = flat ? roofRows * storey + (sawtooth ? 230 : 80) : roofRows ? roofRows * storey + 140 : EDGE * PITCH;
  return { n, roofRows, storey, body, roofH, flat, chimney: flat ? 0 : 70 };
}

export function edgeHeight(kind, info, style) {
  if (kind !== "budova") return 0;
  if (art !== "praha") return (buildingHeight(info) || 0) * 100;
  const f = buildingForm(info, buildingStyle(info, style));
  return f.body + f.roofH + f.chimney;
}

// d = distance from the street facade into the building (negative: towards the street), z = height above the surface.
function drawPrahaBuilding(g, x, side, surface, info, chosen) {
  const style = buildingStyle(info, chosen);
  const f = buildingForm(info, style);
  const c = BUILDING_COLORS[style];
  const X = (d) => (side === "left" ? x + EDGE - d : x + d);
  const poly = (pts, fill) => el("path", { d: "M" + pts.map(([d, z]) => `${X(d)} ${surface - z}`).join(" L") + " Z", fill }, g);
  const box = (d0, d1, z0, z1, fill) => poly([[d0, z0], [d1, z0], [d1, z1], [d0, z1]], fill);
  const top = f.body;

  // Roof first, so the walls and cornice overlap its foot.
  if (style === "sikma" && f.roofRows) {
    // Mansard: a steep lower slope (with a dormer), a shallow upper one.
    const rise = f.roofRows * f.storey;
    poly([[0, top], [rise * 0.3, top + rise], [EDGE, top + rise + (EDGE - rise * 0.3) * 0.35], [EDGE, top]], c.mansard);
    const zd = top + rise * 0.25;
    box(rise * 0.06, rise * 0.3 + 30, zd, zd + 150, c.trim); // dormer cheek
    poly([[rise * 0.06 - 8, zd + 150], [rise * 0.3 + 40, zd + 150], [rise * 0.3 + 40, zd + 175]], c.mansard);
  } else if (!f.flat) {
    // Pitched roof with the eaves over the street; an attic floor gets a dormer.
    const eave = style === "nizky" ? 50 : 30;
    poly([[-eave, top - 15], [EDGE, top + (EDGE + eave) * PITCH - 15], [EDGE, top]], c.roof);
    poly([[-eave, top - 15], [-eave, top - 3], [EDGE, top + (EDGE + eave) * PITCH - 3], [EDGE, top + (EDGE + eave) * PITCH - 15]], c.roofDark);
    if (f.roofRows) {
      const z = top + 90 * PITCH;
      box(70, 230, z - 20, z + 150, c.wall);
      poly([[60, z + 150], [240, z + 150], [240, z + 150 + 40]], c.roofDark);
    }
  } else {
    // Flat roof: set-back floors above the cornice, then a parapet.
    const back = f.roofRows ? 220 : 0;
    if (f.roofRows) box(back, EDGE, top, top + f.roofRows * f.storey, c.wall);
    const zr = top + f.roofRows * f.storey;
    box(back - 5, EDGE, zr, zr + 80, c.trim);
    if (style === "hala" && ["industrial", "manufacture"].includes(info?.type)) {
      // Saw-tooth roof lights of a factory.
      for (const d0 of [0, 200]) {
        poly([[d0 + 20, zr + 80], [d0 + 20, zr + 230], [d0 + 200, zr + 80]], c.roof);
        box(d0 + 20, d0 + 30, zr + 80, zr + 230, c.glass);
      }
    }
  }
  if (!f.flat) {
    const z = top + (EDGE - 120) * PITCH * (f.roofRows && style === "sikma" ? 0.35 : 1);
    const zc = style === "sikma" && f.roofRows ? top + f.roofRows * f.storey + (EDGE - 120 - f.roofRows * f.storey * 0.3) * 0.35 : z;
    box(EDGE - 145, EDGE - 100, zc - 40, zc + f.chimney, c.trim);
    box(EDGE - 150, EDGE - 95, zc + f.chimney - 8, zc + f.chimney, c.line);
  }

  // The side wall, with faint floor lines and windows like the Streetmix buildings.
  box(0, EDGE, 0, top, c.wall);
  const full = f.n - f.roofRows;
  for (let k = 1; k < full; k++) box(0, EDGE, k * f.storey - 2, k * f.storey + 2, c.line);
  const win = WINDOWS[style];
  const windowsAt = (d0, d1, z) => {
    for (let d = d0 + win.gap; d + win.w <= d1 - win.gap / 2; d += win.w + win.gap) {
      box(d - 5, d + win.w + 5, z - 6, z, c.line); // sill
      box(d, d + win.w, z, z + win.h * f.storey, GLASS);
    }
  };
  if (style === "hala") box(0, EDGE, top * 0.45, top * 0.45 + Math.min(180, top * 0.3), GLASS); // ribbon window
  else for (let k = 0; k < full; k++) windowsAt(0, EDGE, k * f.storey + win.sill * f.storey);
  if (f.flat && f.roofRows) for (let k = 0; k < f.roofRows; k++) windowsAt(220, EDGE, top + k * f.storey + win.sill * f.storey);

  box(0, 8, 0, top, c.line); // the street facade, seen edge-on
  // What sticks out towards the street.
  if (style === "sikma") {
    box(-6, 0, 0, 60, c.line); // plinth
    box(-12, 0, f.storey - 14, f.storey, c.trim); // string course over the ground floor
    box(-35, 20, top - 45, top, c.trim); // main cornice
    box(-35, 20, top - 45, top - 38, c.line);
  } else if (style === "plocha") {
    box(-6, 0, 0, 80, c.sokl);
    if (FLAT_RESIDENTIAL.has(info?.type) || !info?.type) {
      // Balconies or loggia parapets on every floor above the ground floor.
      for (let k = 1; k < f.n - f.roofRows; k++) {
        box(-120, 0, k * f.storey, k * f.storey + 16, c.sokl);
        box(-120, -6, k * f.storey + 16, k * f.storey + 105, c.accent);
      }
    }
  } else if (style === "nizky") {
    box(-6, 0, 0, 60, c.sokl);
  } else if (style === "hala") {
    box(-4, 0, 0, top, c.trim);
    if (["retail", "supermarket"].includes(info?.type)) box(-250, 0, 330, 360, c.canopy); // entrance canopy
  }
  return surface - (top + f.roofH + f.chimney);
}

function drawEdge(svg, x, kind, side, surface, info, style) {
  const g = el("g", {}, svg);
  if (kind === "budova" && art === "praha") {
    const top = drawPrahaBuilding(g, x, side, surface, info, style);
    const lv = buildingLevels(info);
    const h = buildingHeight(info);
    if (lv || h) {
      const text = lv ? (lv.cornice && lv.roof ? `${lv.cornice} + ${lv.roof} NP` : `${lv.n} NP`) : "";
      el("text", { x: x + EDGE / 2, y: top - 25, "text-anchor": "middle", "font-size": 32, fill: "#5f5e5a" }, g).textContent =
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
      el("text", { x: x + EDGE / 2, y: top - 25, "text-anchor": "middle", "font-size": 32, fill: "#5f5e5a" }, g).textContent =
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
  el("text", { x: x + EDGE / 2, y: GROUND + 170, "text-anchor": "middle", "font-size": 30, fill: "#8a877e" },
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
  // The top row (total width, cut ends A/B) sits above the tallest building and its floor label.
  const y0 = Math.min(0, GROUND - tallest - 140) - 110;
  const svg = el("svg", { xmlns: NS, viewBox: `${vx} ${y0} ${view[1]} ${H - y0}`, "font-family": "system-ui, sans-serif" });
  el("rect", { x: vx, y: y0, width: view[1], height: H - y0, fill: "#fbfaf6" }, svg);
  if (opts.title) {
    el("text", { x: vx + 30, y: y0 + 70, "font-size": 46, "font-weight": 600, fill: "#1f1f1d" }, svg).textContent = opts.title;
  }
  if (opts.credits) {
    // Exported pictures carry the attribution their sources require (CC BY-SA for the illustrations).
    el("text", { x: vx + 30, y: H - 20, "font-size": 24, fill: "#8a877e" }, svg).textContent =
      (art === "praha" ? "Ilustrace © Streetmix (CC BY-SA 4.0) a Profily ulic" : "Ilustrace © Streetmix (CC BY-SA 4.0)") + " · data © IPR Praha, TSK hl. m. Prahy (CC BY 4.0) · © přispěvatelé OpenStreetMap (ODbL) · obrázek CC BY-SA 4.0";
  }
  el("text", { x: total / 2, y: y0 + 70, "text-anchor": "middle", "font-size": 46, fill: "#1f1f1d" }, svg).textContent =
    `Celkem ${fmt(total / 100)}`;
  // Ends of the cut, lettered as on the map (A = left end, B = right end).
  for (const [letter, x] of [["A", 0], ["B", total]]) {
    el("circle", { cx: x, cy: y0 + 70, r: 52, fill: "#e24b4a", stroke: "#fff", "stroke-width": 8 }, svg);
    el("text", { x, y: y0 + 94, "text-anchor": "middle", "font-size": 68, "font-weight": 700, fill: "#fff" }, svg).textContent = letter;
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
    const g = el("g", { class: "seg" + (opts.selected === i ? " selected" : ""), "data-i": i }, svg);
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
    el("text", { x: cx, y: GROUND + 170, "text-anchor": "middle", "font-size": 40, fill: "#1f1f1d" }, g).textContent = fmt(s.width);
    if (w >= 150) {
      const contra = s.bikeDir && s.bikeDir !== (s.dir || "forward");
      const label = s.type === "parkovani" && s.use ? `Stání ${PARKING_USE[s.use]}`
        : s.type === "parkovani" && s.orient ? `Stání ${ORIENT_LABEL[s.orient]}`
        : (t.short || t.label) + (t.directional && s.dir ? (forward ? " ↑" : " ↓") : s.type === "pruh" ? " ↑↓" : "") +
          (contra ? ` kola ${s.bikeDir === "backward" ? "↓" : "↑"}` : "");
      el("text", { x: cx, y: GROUND + 215, "text-anchor": "middle", "font-size": 28, fill: "#5f5e5a" }, g).textContent = label;
    }
    if (s.turn) {
      el("text", { x: cx, y: GROUND + 255, "text-anchor": "middle", "font-size": 28, fill: "#185fa5" }, g).textContent = turnLabel(s.turn);
    }
    if (t.sharrow || s.bikeDir || t.bike) {
      // Cyclist sharing the lane (with a painted pictogram on a piktokoridor), possibly in contraflow.
      const bikeFwd = (s.bikeDir || s.dir) !== "backward";
      if (t.sharrow) el("rect", { x: cx - 60, y: top - 4, width: 120, height: 6, fill: "#f2f0ea" }, g);
      sprite(g, bikeFwd ? "biker-01-outbound" : "biker-01-inbound", x + Math.min(w * 0.2, 60) + 20, top);
    }
    if (opts.onSelect) g.addEventListener("click", () => opts.onSelect(i));
    x += w;
    bounds.push(x);
  });

  if (opts.editable) {
    bounds.forEach((bx, k) => {
      const h = el("g", { class: "handle", "data-k": k }, svg);
      el("line", { x1: bx, x2: bx, y1: GROUND - 300, y2: GROUND + 120, stroke: "#8a877e", "stroke-width": 2, "stroke-dasharray": "8 6" }, h);
      el("rect", { x: bx - 25, y: GROUND - 300, width: 50, height: 420, fill: "transparent" }, h);
      el("circle", { cx: bx, cy: GROUND - 300, r: 14, fill: "#fff", stroke: "#185fa5", "stroke-width": 4 }, h);
    });
  }
  svg.dataset.view = JSON.stringify(view);
  return svg;
}

// Narrowest width a segment can be dragged to: perpendicular parking keeps 4.5 m (ČSN 73 6056).
const minWidth = (seg) => (seg.type === "parkovani" && seg.orient === "kolme" ? 4.5 : 0.2);

// Mount an editable profile with draggable boundaries.
export function mountEditor(container, profile, { selected, onSelect, onChange }) {
  const draw = (view) => {
    container.replaceChildren(buildSvg(profile, { editable: true, selected, onSelect, view }));
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
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      onChange();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
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
