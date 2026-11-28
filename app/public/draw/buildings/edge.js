// The edge of the profile: a house or an open edge (a garden, a fence, water) with the floors label.
import { t as tr } from "../../i18n.js";
import { buildingHeight, buildingLevels } from "./info.js";
import { buildingStyle } from "./style.js";
import { cityArt, sprite } from "../art.js";
import { drawPrahaBuilding } from "./house.js";
import { DROP, EDGE, el, fmt, GROUND } from "../svg.js";

let labelTop = -Infinity; // building labels stay below this y (set per drawing in buildSvg)
export const setLabelTop = (v) => { labelTop = v; };

// The floor count above an edge building starts at its outer side, clear of the cut end A/B.
const floorLabelAt = (x, side) => (side === "left" ? { x: x + 12, "text-anchor": "start" } : { x: x + EDGE - 12, "text-anchor": "end" });

export function drawEdge(svg, x, kind, side, surface, info, style) {
  const g = el("g", {}, svg);
  if (kind === "budova" && cityArt()) {
    let top = drawPrahaBuilding(g, x, side, surface, info, style);
    if (top < labelTop) {
      // Cut off above the view: a torn edge in the background colour says the building goes on.
      const yb = labelTop + 20;
      let d = `M${x - 4} ${yb - 4000} L${x - 4} ${yb}`;
      for (let i = 0; i <= 8; i++) d += ` L${x + (i * (EDGE + 8)) / 8 - 4} ${yb + (i % 2 ? 22 : 0)}`;
      el("path", { d: d + ` L${x + EDGE + 4} ${yb - 4000} Z`, fill: "#fbfaf6" }, g);
      // Balconies and cornices over the street are cut at the same line.
      el("rect", { x: side === "left" ? x + EDGE : x - 160, y: yb - 4000, width: 160, height: 4000 - 4, fill: "#fbfaf6" }, g);
      top = yb - 10;
      g.dataset.top = top; // what shows of it, for the page fitting the view (app.js layoutTop)
    }
    const lv = buildingLevels(info);
    const h = buildingHeight(info);
    if (lv || h) {
      const text = lv ? (lv.cornice && lv.roof ? tr("profile.nRoofFl", { n: lv.cornice, roof: lv.roof }) : tr("profile.nFl", { n: lv.n }))
        : buildingStyle(info, style) === "hala" ? tr("profile.hall") : "";
      el("text", { ...floorLabelAt(x, side), y: top - 25, "font-size": 32, fill: "#4f4e49", class: "lbl-floor", "data-w": EDGE - 24, "data-free": 1 }, g).textContent =
        [text, h ? `${info.height ? "" : "≈ "}${fmt(h).replace(/[,.]00 /, " ")}` : ""].filter(Boolean).join(" · ");
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
      const text = lv.cornice && lv.roof ? tr("profile.nRoofFl", { n: lv.cornice, roof: lv.roof }) : tr("profile.nFl", { n: lv.n });
      el("text", { ...floorLabelAt(x, side), y: top - 25, "font-size": 32, fill: "#4f4e49", class: "lbl-floor", "data-w": EDGE - 24, "data-free": 1 }, g).textContent =
        text + (h ? ` · ${info.height ? "" : "≈ "}${fmt(h).replace(/[,.]00 /, " ")}` : "");
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
  el("text", { class: "lbl-t", "data-row": 1, "data-w": EDGE, x: x + EDGE / 2, y: GROUND + DROP + 215, "text-anchor": "middle", "font-size": 30, fill: "#6b6a65" },
    g).textContent = { budova: tr("common.building"), stavba: tr("common.smallStructure"), voda: tr("profile.waterRiverPond"), zahrada: tr("profile.gardenMeadowOffStreet"), zelen: tr("profile.greeneryOffStreet"), parkoviste: tr("profile.carParkOffStreet"), plot: tr("profile.behindFenceOffStreet") }[kind] || "";
  return g;
}
