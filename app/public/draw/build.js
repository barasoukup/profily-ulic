// The whole picture of a profile: the edges, the parts with their furniture, labels, wires, networks, signs, credits.
import { HDV_UNDER, PARKING_POSITION, PARKING_USE, partLabel, SOURCES, TYPES } from "../types.js";
import { t as tr } from "../i18n.js";
import { artKey, CITY_ART, cityArt, exportCredits, sprite } from "./art.js";
import { CAR_TRACK, isRaised, KERB_PAVING, laneDir, ORIENT_LABEL, turnLabel } from "./parts.js";
import { CURB, DROP, EDGE, el, fmt, GROUND, NS, setDrop, totalWidth, twoLines } from "./svg.js";
import { drawEdge, setLabelTop } from "./buildings/edge.js";
import { drawItem, lampLight, nearestRoadway, ROADWAY } from "./items.js";
import { drawNetworks, NET_TOP, undergroundDrop } from "./networks.js";
import { drawPermeable, drawRailway, drawTramBed, SOIL_PARTS, TOPSOIL } from "./ground.js";
import { drawSigns, layoutSigns, signsShown } from "./signs.js";
import { drawUnder, drawWaterPart, underDepth } from "./water.js";
import { edgeHeight, facades } from "./buildings/form.js";
import { edgeInfo } from "./buildings/info.js";
import { spanPlan, spanWire, tramSprite, WIRE_H, wiredLanes } from "./overhead.js";

const SIGN_SIZE = 125; // traffic signs under the labels in an export: width of a basic sign (cm)

const H = 1000;

const PEOPLE = ["people-01", "people-05", "people-12", "people-20", "people-27"];

const TALL_SHARE = 0.45; // the most of the view's width a building may rise above the ground

// ---------- Rainwater management (types.js water, HDV_UNDER; Bára after Magdalena, 12. 11. 2026) ----------
// Simplified, as Magdalena advised at this scale: a swale is a shallow dip with perennials, a pond a deeper one
// with water, a surface trench gravel to the top; under a part, a trench of gravel, a tank or a shaft in the earth
// below it (schematic depths, not to scale); permeable paving shows its open joints. Blue arrows show where the
// rain runs in from the paved parts beside a swale, a trench or a pond.
const MEDIAN_LAMP = new Set(["delici", "zelen", "stromorad", "tramvaj"]); // parts where a lamp lights both roadways

export function buildSvg(profile, opts = {}) {
  const hs = {};
  const segs = profile.segments;
  const total = totalWidth(profile) * 100;
  // The earth under the street, with its metres: for the networks (a trial, Prague) and for a rainwater object
  // under a part, which is drawn at its depth and size (with the networks or alone, also in Porovnat and exports).
  const nets = opts.underground?.items?.length ? opts.underground : null;
  // In Porovnat both profiles take the deeper one's earth (opts.deep), so they keep one scale (Fable).
  const deepest = Math.max(opts.deep || 0, underDepth(profile));
  const under = nets || (deepest ? { items: [], span: { left: total / 100 }, kinds: {} } : null);
  setDrop(under ? undergroundDrop(under.items, under.kinds, deepest) : 0);
  const view = opts.view || [-EDGE, Math.max(total + 2 * EDGE, 2400)];
  const vx = view[0] - (view[1] - (total + 2 * EDGE)) / 2;
  // Tall buildings at the edges extend the drawing upwards.
  // Tall lamps and traction poles too (Fable: a 10 m lamp was cut off above a street without houses).
  const tallest = Math.max(0, ...["left", "right"].map((k) =>
    edgeHeight(profile.edges?.[k], profile.edges?.[`${k}Info`], profile.edges?.[`${k}Style`])),
    ...segs.flatMap((s) => (s.items || []).map((it) => (it.kind === "lampa" ? (it.h || lampLight()) * 100 + 80 : it.kind === "sloup_trakce" ? 960 : 0))));
  // A tower beside a narrow street would squash the street into a strip: the view shows at most
  // TALL_SHARE of its width above the ground, and taller buildings are cut with a break line.
  // opts.whole: the buildings whole (the sheets of evaluation/archive/regional-buildings).
  const shown = opts.whole ? tallest : Math.min(tallest, Math.max(1300, view[1] * TALL_SHARE));
  // The top row (total width, cut ends A/B) sits above the tallest building and its floor label.
  const y0 = Math.min(0, GROUND - shown - 140) - 110;
  setLabelTop(y0 + 190);
  // An export's title gets a band of its own above the top row (it covered the A of the cut's end).
  const yv = opts.title ? y0 - 130 : y0;
  // The bottom: the label rows, then the signs and the credits line of an export (set after the signs are laid out).
  let bottom = (opts.credits ? H + 110 : H) + DROP;
  const svg = el("svg", { xmlns: NS, viewBox: `${vx} ${yv} ${view[1]} ${bottom - yv}`, "font-family": "Inter, system-ui, sans-serif",
    role: "img", "aria-label": tr("profile.crossSectionTotalW", { w: fmt(total / 100) }) + segs.map((s) => `${partLabel(s)} ${fmt(s.width)}`).join(", ") });
  const bg = el("rect", { class: "bg", x: vx, y: yv, width: view[1], height: bottom - yv, fill: "#fbfaf6" }, svg);

  const firstRaised = isRaised(segs[0]);
  const lastRaised = isRaised(segs.at(-1));
  Object.assign(hs, { firstRaised, lastRaised, opts, profile, svg, total, yv });
  drawEdges(hs);

  let x = 0;
  const bounds = [0], undersLater = [], spans = spanPlan(segs, profile.edges, total, facades(profile.edges));
  segs.forEach((s, i) => {
    const hs = {};
    Object.assign(hs, { i, opts, s, segs, spans, svg, total, undersLater, x });
    drawSegment(hs);
    const { w } = hs;
    x += w;
    bounds.push(x);
  });

  Object.assign(hs, { svg, total, y0 });
  drawTopRow(hs);

  Object.assign(hs, { bounds, segs, spans, svg });
  drawOverheadWires(hs);

  Object.assign(hs, { svg, total, under, undersLater });
  drawEarth(hs);

  Object.assign(hs, { bounds, opts, svg, vx, yv });
  drawTitleAndHandles(hs);
  if (opts.signs !== false && signsShown) {
    drawSigns(svg, profile, bounds);
    // Without the page's fitting (an export): the rows below the labels at a fixed size, the picture as tall
    // as they need.
    const end = layoutSigns(svg, SIGN_SIZE, GROUND + DROP + 320, 3.6);
    if (end > GROUND + DROP + 320) bottom += end - H - DROP + 20;
  }
  if (opts.credits) {
    // Exported pictures carry the attribution their sources require (CC BY-SA for the illustrations): the
    // lines of exportCredits (or the given ones), each broken at " · " to the picture's width, the picture
    // made as tall as they need.
    const FS = 24, LH = 32, fit = Math.max(40, Math.floor((view[1] - 60) / (FS * 0.52)));
    const rows = creditRows(Array.isArray(opts.credits) ? opts.credits : exportCredits(), fit);
    bottom += (rows.length - 1) * LH;
    rows.forEach((row, i) => {
      el("text", { class: "credits", x: vx + 30, y: bottom - 25 - (rows.length - 1 - i) * LH, "font-size": FS, fill: "#6b6a65" }, svg).textContent = row;
    });
  }
  svg.setAttribute("viewBox", `${vx} ${yv} ${view[1]} ${bottom - yv}`);
  bg.setAttribute("height", bottom - yv);
  svg.dataset.view = JSON.stringify(view);
  return svg;
}

function drawSegment(hs) {
  const { i, opts, s, segs, spans, svg, total, undersLater, x } = hs;
  const t = TYPES[s.type] || TYPES.nezname;
  const w = s.width * 100;
  const top = isRaised(s) ? GROUND - CURB : GROUND;
  // Cars across the kerb (half_on_kerb): the half on the sidewalk side is raised (kerbLeft: the sidewalk is
  // on the left of the part).
  const half = s.type === "parkovani" && s.position === "half_on_kerb";
  const kerbLeft = half && (isRaised(segs[i - 1]) !== isRaised(segs[i + 1]) ? isRaised(segs[i - 1]) : x + w / 2 < total / 2);
  const g = el("g", { class: "seg" + (opts.selected === i ? " selected" : "") + (opts.changed?.has(i) ? " changed" : ""), "data-i": i }, svg);
  // Name and width on hover, also for parts too narrow for a label.
  el("title", {}, g).textContent = `${partLabel(s)}, ${fmt(s.width)}`;
  el("rect", { class: "ground", x, y: top, width: w, height: GROUND + 60 - top, fill: s.color || (s.position === "on_kerb" ? KERB_PAVING : t.color) }, g);
  // Green parts: grass on topsoil, not a green block all the way down (Bára: nothing that looks like a slab under
  // the green).
  if (SOIL_PARTS.has(s.type)) el("rect", { x, y: top + 12, width: w, height: GROUND + 60 - top - 12, fill: TOPSOIL }, g);
  if (half) {
    // The sidewalk half in the sidewalk's paving, with the kerb stone in the middle of the car.
    el("rect", { x: kerbLeft ? x : x + w / 2, y: GROUND - CURB, width: w / 2, height: CURB + 60, fill: KERB_PAVING }, g);
    el("rect", { x: x + w / 2 - (kerbLeft ? 12 : 0), y: GROUND - CURB, width: 12, height: CURB + 8, fill: "#c9c5ba", stroke: "#8d887c", "stroke-width": 1 }, g);
  }
  el("rect", { x, y: GROUND + 60, width: w, height: 40, fill: "#9b7f5f" }, g);
  el("rect", { x: x + 4, y: GROUND + DROP + 104, width: Math.max(w - 8, 1), height: 14, fill: SOURCES[s.source]?.color || "#999" }, g);
  const cx = x + w / 2;
  const forward = s.dir !== "backward";
  if (t.rails) drawRailway(g, s, x, w, top);
  if (t.bed) drawTramBed(g, s, x, w, top, TYPES[segs[i - 1]?.type]?.bed, TYPES[segs[i + 1]?.type]?.bed);
  // Under the part: drawn after the networks' earth (below), which would cover it.
  if (s.under) undersLater.push([s, x, w]);
  if (t.water) drawWaterPart(g, s, x, w, top, segs[i - 1], segs[i + 1]);
  if (s.permeable) drawPermeable(g, x, w, top, s.permeable === "nezpevneny");
  if (t.marked) {
    // A reserved tram lane: a wide solid line (25 cm) on the roadway where a part that is no tram lies beside.
    if (!TYPES[segs[i - 1]?.type]?.tracks) el("rect", { x: x + 4, y: top - 3, width: 25, height: 4, fill: "#f2f0ea" }, g);
    if (!TYPES[segs[i + 1]?.type]?.tracks) el("rect", { x: x + w - 29, y: top - 3, width: 25, height: 4, fill: "#f2f0ea" }, g);
  }
  // Hatching (V 13) read on the orthophoto: oblique stripes of paint in the top layer of the roadway.
  if (s.hatched) for (let hx = x + 6; hx + 30 <= x + w - 4; hx += 40) el("polygon", { class: "hatch", points: `${hx},${top} ${hx + 16},${top} ${hx + 30},${top + 36} ${hx + 14},${top + 36}`, fill: "#f2f0ea", "fill-opacity": 0.8 }, g);
  if (t.tracks) {
    for (const dx of [-72, 72]) el("rect", { x: cx + dx - 6, y: top - 6, width: 12, height: 8, fill: "#3d3b36" }, g);
  }
  Object.assign(hs, { cx, forward, g, half, i, kerbLeft, s, segs, t, top, total, w, x });
  drawSegmentSprites(hs);
  if (t.wall) el("rect", { x, y: top - 90, width: w, height: 90, fill: t.color }, g);
  Object.assign(hs, { g, i, s, segs, spans, top, total, w, x });
  drawSegmentItems(hs);
  Object.assign(hs, { cx, forward, g, s, t, w });
  drawSegmentLabels(hs);
  Object.assign(hs, { g, s, t, top, w, x });
  drawSegmentCyclist(hs);
  if (opts.onSelect) {
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", `${partLabel(s)}, ${fmt(s.width)}, ${SOURCES[s.source]?.label || ""}`);
    g.addEventListener("click", () => opts.onSelect(i));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); opts.onSelect(i); } });
  }
  Object.assign(hs, { w });
}

function drawEdges(hs) {
  const { firstRaised, lastRaised, opts, profile, svg, total, yv } = hs;
  // The edges (a building, a fence, a garden…): selected by a click like the parts (Bára: a panel house that is a
  // two-storey town house, or a garden).
  for (const [side, x, raised] of [["left", -EDGE, firstRaised], ["right", total, lastRaised]]) {
    const kind = profile.edges?.[side] || "volno";
    const g = drawEdge(svg, x, kind, side, raised ? GROUND - CURB : GROUND, edgeInfo(profile.edges, side), profile.edges?.[`${side}Style`]);
    if (!opts.onEdge) continue;
    g.classList.add("edge");
    if (opts.selectedEdge === side) g.classList.add("selected");
    // Its whole column is the target, the open ground of "volno" too.
    g.prepend(el("rect", { x, y: yv, width: EDGE, height: GROUND + DROP + 260 - yv, fill: "transparent" }));
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", side === "left" ? tr("common.leftEdge") : tr("common.rightEdge"));
    g.addEventListener("click", () => opts.onEdge(side));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); opts.onEdge(side); } });
  }
}

function drawTopRow(hs) {
  const { svg, total, y0 } = hs;
  el("text", { class: "lbl-total top-row", x: total / 2, y: y0 + 70, "text-anchor": "middle", "font-size": 46, "font-weight": 600, fill: "#1f1f1d" }, svg).textContent =
    tr("common.totalW", { w: fmt(total / 100) });
  // Ends of the cut, lettered as on the map (A = left end, B = right end), above everything else.
  // On a narrow street A and B step aside so the total does not run into them (the page redoes
  // this at screen size in layoutTop, an export keeps it).
  const half = (tr("common.totalW", { w: fmt(total / 100) }).length * 0.56 * 46) / 2;
  const ends = [Math.min(0, total / 2 - half - 70), Math.max(total, total / 2 + half + 70)];
  for (const [letter, x] of [["A", ends[0]], ["B", ends[1]]]) {
    el("circle", { class: "top-row", cx: x, cy: y0 + 70, r: 52, fill: "#d8413f", stroke: "#fff", "stroke-width": 8 }, svg);
    el("text", { class: "top-row", x, y: y0 + 94, "text-anchor": "middle", "font-size": 68, "font-weight": 700, fill: "#fff" }, svg).textContent = letter;
  }
}

function drawOverheadWires(hs) {
  const { bounds, segs, spans, svg } = hs;
  if (spans.wires.length) { const sg = el("g", { class: "span-wires", "pointer-events": "none" }, svg); for (const w of spans.wires) spanWire(sg, w); }

  // Trolley wires over the lanes under them (OSM trolley_wire): a span wire across, from the first wired lane
  // to the last, and the two contact wires (0.6 m apart, 5.4 m above the road) over each lane, hung from it.
  const wired = wiredLanes(segs, bounds);
  if (wired.length) {
    const wg = el("g", { class: "trolley-wires" }, svg);
    const yContact = GROUND - WIRE_H, ySpan = GROUND - WIRE_H - 60;
    el("line", { x1: bounds[wired[0]] + 20, x2: bounds[wired.at(-1) + 1] - 20, y1: ySpan, y2: ySpan, stroke: "#4a4945", "stroke-width": 2.5 }, wg);
    for (const i of wired) {
      const cx = (bounds[i] + bounds[i + 1]) / 2;
      for (const dx of [-30, 30]) {
        el("line", { x1: cx + dx, x2: cx + dx, y1: ySpan, y2: yContact, stroke: "#4a4945", "stroke-width": 1.5 }, wg);
        el("circle", { cx: cx + dx, cy: yContact, r: 5, fill: "#2b2a27" }, wg);
      }
    }
  }
}

function drawEarth(hs) {
  const { svg, total, under, undersLater } = hs;
  if (under) drawNetworks(svg, under, total);
  // Rainwater objects under the parts, over the networks' earth (Fable's review).
  if (undersLater.length) {
    const ug = el("g", { class: "under" }, svg);
    for (const [s, x, w] of undersLater) drawUnder(ug, s, x, w);
    // The networks over them, so a pipe running through a tank shows (and its tooltip works).
    const over = el("g", { class: "networks" }, svg);
    for (const n of [...svg.querySelectorAll("g.networks > g")]) if (n.dataset.tip) over.append(n);
    if (!over.childNodes.length) over.remove();
  }
  svg.dataset.drop = DROP;
}

function drawTitleAndHandles(hs) {
  const { bounds, opts, svg, vx, yv } = hs;
  if (opts.title) {
    // A title tag in the top left corner, over the building there.
    el("rect", { class: "title-bg", x: vx + 16, y: yv + 30, width: 60 + opts.title.length * 25, height: 80, rx: 16, fill: "#1d1d1b" }, svg);
    el("text", { class: "lbl-title", x: vx + 46, y: yv + 86, "font-size": 46, "font-weight": 700, fill: "#fff" }, svg).textContent = opts.title;
  }

  if (opts.editable) {
    bounds.forEach((bx, k) => {
      const h = el("g", { class: "handle", "data-k": k }, svg);
      el("line", { x1: bx, x2: bx, y1: GROUND - 300, y2: DROP ? NET_TOP : GROUND + 120, stroke: "#8a877e", "stroke-width": 2, "stroke-dasharray": "8 6" }, h);
      el("rect", { class: "grab", x: bx - 40, y: GROUND - 340, width: 80, height: 460, fill: "transparent" }, h);
      el("circle", { class: "knob", cx: bx, cy: GROUND - 300, r: 18, fill: "#fff", stroke: "#185fa5", "stroke-width": 5 }, h);
      el("path", { class: "knob", d: `M${bx - 8} ${GROUND - 300} h16 M${bx - 8} ${GROUND - 300} l5 -5 M${bx - 8} ${GROUND - 300} l5 5 M${bx + 8} ${GROUND - 300} l-5 -5 M${bx + 8} ${GROUND - 300} l-5 5`, stroke: "#185fa5", "stroke-width": 3, fill: "none" }, h);
    });
  }
}

function drawSegmentSprites(hs) {
  const { cx, forward, g, half, i, kerbLeft, s, segs, t, top, total, w, x } = hs;
  // Trees between the stalls (a tree item of a parking part, Bára): the tree stands behind the car, along the street.
  if (s.type === "parkovani") for (const it of s.items || []) if (it.kind === "strom") sprite(g, "tree", x + it.f * w, GROUND);
  if (t.sprite === "people" && t.withBike && w >= 140) {
    // Shared with cyclists: a walker and a cyclist side by side (only the cyclist when narrow).
    const bike = forward ? "biker-01-outbound" : "biker-01-inbound";
    if (w >= 240) {
      sprite(g, PEOPLE[(i * 2) % PEOPLE.length], x + w * 0.3, top);
      sprite(g, bike, x + w * 0.7, top);
    } else sprite(g, bike, cx, top);
  } else if (t.sprite === "people") {
    const n = w >= 300 ? 2 : w >= 140 ? 1 : 0;
    for (let k = 0; k < n; k++) sprite(g, PEOPLE[(i * 2 + k) % PEOPLE.length], x + (w * (k + 1)) / (n + 1), top, k % 2 === 1);
  } else if (s.type === "parkovani" && w >= (s.position ? 150 : 180)) {
    // Parked car drawn by orientation: front view (parallel), side view (perpendicular), angled.
    const right = cx > total / 2;
    const name = s.orient === "kolme" ? `car-sideways-${right ? "right" : "left"}`
      : s.orient === "sikme" ? `car-angled-front-${right ? "right" : "left"}`
      : laneDir(segs, i, right) === "backward" ? "car-inbound" : "car-outbound";
    if (half) {
      // Across the kerb: the car stands half a kerb up, tilted towards the roadway.
      // Higher on the sidewalk side, lower towards the roadway (SVG angles turn clockwise).
      const tilt = el("g", { transform: `rotate(${((kerbLeft ? 1 : -1) * Math.atan2(CURB, CAR_TRACK) * 180) / Math.PI} ${cx} ${GROUND - CURB / 2})` }, g);
      sprite(tilt, name, cx, GROUND - CURB / 2);
    } else sprite(g, name, cx, top);
  } else if (t.sprite === "car" && w >= 180 && s.trolley && cityArt() && CITY_ART[artKey()]?.["trolleybus-inbound"]) {
    // A lane only public transport may use (a zone with trolley wires): its trolleybus.
    sprite(g, `trolleybus-${forward ? "outbound" : "inbound"}`, cx, top);
  } else if (t.sprite === "car" && s.noCar) {
    // A lane private cars may not use (derive.js carsBanned), no public transport allowed: no vehicle.
  } else if (t.sprite === "car" && w >= 180) {
    sprite(g, forward ? "car-outbound" : "car-inbound", cx, top);
  } else if (t.sprite === "streetcar" && w >= 240) {
    tramSprite(g, forward ? "streetcar-outbound" : "streetcar-inbound", cx, top - 2);
  } else if (t.sprite === "bus" && w >= 250) {
    // Under trolley wires a trolleybus, where the city's illustrations have one (else the bus).
    const trolley = s.trolley && cityArt() && CITY_ART[artKey()]?.["trolleybus-inbound"];
    sprite(g, `${trolley ? "trolleybus" : "bus"}-${forward ? "outbound" : "inbound"}`, cx, top);
  } else if (t.sprite === "biker" && w >= 80) {
    sprite(g, forward ? "biker-01-outbound" : "biker-01-inbound", cx, top);
  } else if (t.sprite === "tree" && w >= 100) {
    sprite(g, "tree", cx, top);
  } else if (t.sprite === "bush" && w >= 100) {
    sprite(g, "bush", cx, top);
  } else if (t.sprite === "cafe" && w >= 150) {
    sprite(g, "cafe-seating-occupied", cx, top);
  }
}

function drawSegmentItems(hs) {
  const { g, i, s, segs, spans, top, total, w, x } = hs;
  for (const it of s.items || []) {
    if (it.kind === "strom" && s.type === "parkovani") continue; // drawn behind the car
    let ix = x + it.f * w, onRight = ix > total / 2;
    if (it.kind === "pristresek" || it.kind === "pristresek_zeleny") {
      // A shelter opens towards the tram or bus beside its platform, its back wall at the platform's other edge,
      // by the cars (Bára, Jana Želivského).
      const transit = (n) => n && (TYPES[n.type]?.tracks || n.type === "bus" || n.type === "bus_cyklo");
      const toR = transit(segs[i + 1]), toL = transit(segs[i - 1]);
      if (toR !== toL) {
        onRight = toL;
        const half = Math.min(135, w / 2);
        ix = toR ? x + half : x + w - half;
      }
    }
    // A stop post at the platform's edge stays on the platform (it is 50 cm wide).
    if (it.kind === "oznacnik") ix = Math.min(Math.max(ix, x + 30), x + w - 30);
    // A railing at a part's edge (a bridge's, ortho-osm.js bridgeRailings) stands just inside it.
    if (it.kind === "zabradli") ix = Math.min(Math.max(ix, x + 10), x + w - 10);
    // A lamp reaches over the nearest roadway, not over the grass (Bára, VMO Dobrovského); in a median between
    // two roadways it lights both (Wilsonova): its arms reach over both sides.
    if (it.kind === "lampa") {
      const near = nearestRoadway(segs, i, it.f);
      if (near) onRight = near === "left";
      // Only on a true median (a dividing strip, green or a tram bed between two roadways of a big road), not on a
      // walkway island by a turn (Bára, náměstí Jana Palacha).
      // (A post-top lamp has no arms: once is enough.)
      if (MEDIAN_LAMP.has(s.type) && ROADWAY.has(segs[i - 1]?.type) && ROADWAY.has(segs[i + 1]?.type) && !(it.h <= 5)) drawItem(g, it, ix, top, !onRight);
    }
    const key = `${i}:${s.items.indexOf(it)}`;
    if (spans.free.has(key)) { drawItem(g, { ...it, span: true }, ix, top, spans.free.get(key)); continue; }
    drawItem(g, it.kind === "sloup_trakce" && it.center ? { ...it, reach: w / 2 } : it, ix, top, onRight);
  }
}

function drawSegmentLabels(hs) {
  const { cx, forward, g, s, t, w } = hs;
  el("text", { class: "lbl-w", "data-row": 0, "data-w": w, x: cx, y: GROUND + DROP + 170, "text-anchor": "middle", "font-size": 40, "font-weight": 600, fill: "#1f1f1d" }, g).textContent = fmt(s.width);
  let wrapped = false;
  if (w >= 80) {
    const contra = s.bikeDir && s.bikeDir !== (s.dir || "forward");
    let label = TYPES[s.type]?.tracks && s.withBus ? `${t.label} + BUS` + (t.directional && s.dir ? (forward ? " ↑" : " ↓") : "")
      : s.type === "parkovani" && s.use ? tr("profile.parkingWhat", { what: PARKING_USE[s.use] })
      // Under a narrow part "Napůl na chodníku" alone (the long name would not fit on two lines).
      : s.type === "parkovani" && s.position ? (s.position === "half_on_kerb" && w < 300 ? tr("profile.halfPavement") : tr("profile.parkingWhat", { what: PARKING_POSITION[s.position] }))
      : s.type === "parkovani" && s.orient ? tr("profile.parkingWhat", { what: ORIENT_LABEL[s.orient] })
      // A lane with a piktokoridor is first a lane (Bára): "Jízdní pruh ↑, piktokoridor ↓" with the cyclists' direction
      // when it differs; cyclists in contraflow in a plain lane likewise.
      : s.type === "pruh_piktokoridor" ? `${TYPES.pruh.label}${s.dir ? (forward ? " ↑" : " ↓") : ""}, ${tr("profile.cycleSymbols")}${contra ? (s.bikeDir === "backward" ? " ↓" : " ↑") : ""}`
      : partLabel(s) + (t.directional && s.dir ? (forward ? " ↑" : " ↓") : s.type === "pruh" ? " ↑↓" : "") +
        (contra ? `, ${tr("common.cyclists")} ${s.bikeDir === "backward" ? "↓" : "↑"}` : "");
    // Trees between the stalls are named with the parking (Bára).
    if (s.type === "parkovani" && s.items?.some((it) => it.kind === "strom")) label += tr("profile.trees");
    // What lies under it (rainwater, types.js HDV_UNDER) and permeable paving, in the name.
    if (s.under && HDV_UNDER[s.under]) label += ` + ${HDV_UNDER[s.under].short}`;
    // "propustná dlažba": the surface graph counts it as partly permeable (Fable: two meanings of "propustný").
    if (s.permeable) label += s.permeable === "nezpevneny" ? tr("profile.unpaved") : tr("profile.permeablePaving");
    const name = el("text", { class: "lbl-t", "data-row": 1, "data-w": w, "data-full": label, x: cx, y: GROUND + DROP + 215, "text-anchor": "middle", "font-size": 28, fill: "#4f4e49" }, g);
    const lines = twoLines(label);
    if (label.length * 0.56 * 28 > w && lines) {
      // A long name under a narrow part goes on two lines (the page refits it to the screen).
      lines.forEach((line, j) => { el("tspan", { x: cx, dy: j ? "1.15em" : "0" }, name).textContent = line; });
      wrapped = true;
    } else name.textContent = label;
  }
  if (s.turn) {
    el("text", { class: "lbl-t lbl-turn", "data-row": 2, "data-w": w, x: cx, y: GROUND + DROP + (wrapped ? 290 : 255), "text-anchor": "middle", "font-size": 28, fill: "#185fa5" }, g).textContent = turnLabel(s.turn);
  }
}

function drawSegmentCyclist(hs) {
  const { g, s, t, top, w, x } = hs;
  if (t.sharrow || s.bikeDir || t.bike) {
    // Cyclist sharing the lane (with a painted pictogram on a piktokoridor), possibly in contraflow.
    const bikeFwd = (s.bikeDir || s.dir) !== "backward";
    // A cyclist keeps to the right of their direction: the lane's right edge riding away from the viewer, its left
    // edge riding towards them (Bára, Optátova in contraflow).
    const edge = Math.min(w * 0.2, 60) + 20;
    const bx = bikeFwd ? x + w - edge : x + edge;
    // The piktokoridor's double chevron in the cut of the road under the cyclist, pointing their way: V towards
    // the viewer, Λ away (Bára).
    if (t.sharrow) {
      const d = bikeFwd ? -1 : 1, y = GROUND + 30;
      el("path", { d: [-11, 11].map((o) => `M${bx - 20} ${y + o - 10 * d}L${bx} ${y + o + 10 * d}L${bx + 20} ${y + o - 10 * d}`).join(""),
        fill: "none", stroke: "#fff", "stroke-width": 6, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    }
    sprite(g, bikeFwd ? "biker-01-outbound" : "biker-01-inbound", bx, top);
  }
}

// The credit lines of an export, each broken at " · " to the picture's width (fit characters a row).
function creditRows(lines, fit) {
  const rows = [];
  for (const line of lines) {
    // Pieces with the separator before them; a part too long for a row breaks after its commas.
    const pieces = line.split(" · ").flatMap((part, i) => (part.length > fit ? part.split(/(?<=,) /) : [part])
      .map((t, j) => [j ? " " : i ? " · " : "", t]));
    let row = "";
    for (const [sep, t] of pieces) {
      if (row && row.length + sep.length + t.length > fit) { rows.push(row); row = t; } else row += row ? sep + t : t;
    }
    if (row) rows.push(row);
  }
  return rows;
}
