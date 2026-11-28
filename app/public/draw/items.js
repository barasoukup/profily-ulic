// Street furniture and barriers standing on a part: lamps, benches, trees, poles, stop posts, fences.
import { LAMP_H } from "../types.js";
import { artKey, CITY_ART, cityArt, ownSprite, sprite, sprites } from "./art.js";
import { el, nextClip } from "./svg.js";
import { POLE_SCALE } from "./overhead.js";

// A green roof laid on a stop shelter (rainwater management 5.1.1) where the city has no picture of it: a planted strip
// on the shelter's roof (restored 27. 11. 2026, Bára: the function was lost and a green shelter threw a ReferenceError).
function greenRoof(g, name, x, top, right) {
  const s = (cityArt() && sprites[`${artKey()}/${CITY_ART[artKey()]?.[name]}`]) || sprites[name];
  if (!s) return;
  const prague = s.w === 270 && s.h === 360, x0 = x - s.w / 2;
  const [a, b] = prague ? (right ? [s.w - 198, s.w - 13] : [13, 198]) : [s.w * 0.08, s.w * 0.92];
  const y = top - s.h + (prague ? 95 : 0);
  el("rect", { x: x0 + a, y: y - 9, width: b - a, height: 9, rx: 2, fill: "#7a6a52" }, g);
  for (let u = x0 + a + 6; u < x0 + b - 4; u += 12) el("circle", { cx: u, cy: y - 10, r: 6, fill: (u / 12) % 2 < 1 ? "#6aa84f" : "#86b55a" }, g);
}

export const ROADWAY = new Set(["pruh", "krajnice", "obsluzna", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "cyklopruh", "ochranny_pruh", "parkovani"]);

// Which side of an item (at f of part i) the nearest roadway lies on, "left" or "right" (by metres along the
// profile), or null when there is none.
export function nearestRoadway(segs, i, f) {
  let left = Infinity, right = Infinity, d = (f ?? 0.5) * segs[i].width;
  for (let k = i - 1; k >= 0; d += segs[k].width, k--) if (ROADWAY.has(segs[k].type)) { left = d; break; }
  d = (1 - (f ?? 0.5)) * segs[i].width;
  for (let k = i + 1; k < segs.length; d += segs[k].width, k++) if (ROADWAY.has(segs[k].type)) { right = d; break; }
  return left === Infinity && right === Infinity ? null : left <= right ? "left" : "right";
}
// Where the luminaire of the city's lamp picture hangs (m): Brno's at 7.4 m, the others' (Prague's and its copies,
// Streetmix's) at LAMP_H (Fable: Brno's "6 m" came out lower than a 5 m post-top lamp).
export const lampLight = () => (artKey() === "brno" ? 7.4 : LAMP_H);

// A town's own post-top lamp (a set's lamp-post-top: Washington's globe, Boston's acorn; Bára 25. 11. 2026), or false
// where the set has none. The picture is centred and has its foot at its bottom; its light (data-light) comes to the
// chosen height, the head (above POST_TOP) and the foot (below POST_FOOT) at their size, the straight shaft between
// them longer or shorter.
const POST_TOP = 540, POST_FOOT = 830;
function postTopLamp(g, x, top, h) {
  const s = ownSprite("lamp-post-top");
  if (!s?.light) return false;
  const base = top - s.h, d = Math.max(h * 100 - s.light, POST_TOP - POST_FOOT + 20), shaft = POST_FOOT - POST_TOP;
  const part = (y0, y1, transform) => {
    const id = `lamp${nextClip()}`, og = el("g", transform ? { transform } : {}, g);
    el("rect", { x: x - s.w / 2, y: base + y0, width: s.w, height: y1 - y0 }, el("clipPath", { id }, og));
    sprite(el("g", { "clip-path": `url(#${id})` }, og), "lamp-post-top", x, top);
  };
  part(0, POST_TOP + 1, `translate(0 ${-d})`);
  part(POST_TOP - 1, POST_FOOT + 1, `translate(0 ${base + POST_FOOT}) scale(1 ${(shaft + d) / shaft}) translate(0 ${-(base + POST_FOOT)})`);
  part(POST_FOOT - 1, s.h);
  return true;
}
export function drawItem(g, it, x, top, right) {
  const line = (attrs) => el("rect", attrs, g);
  switch (it.kind) {
    // The lamp's arm reaches over the street: on the right half the arm points left. Its foot (not
    // the middle of the picture) stands at x: x = 348 in the "left" picture, 22 in the "right" one.
    case "lampa": {
      // A lamp of its own height (it.h, m; Bára: a small lamp is not a big one made smaller). From 6 m the city's
      // lamp with its mast longer or shorter: the bracket and luminaire (the top 300 cm of the 930 cm picture) and
      // the foot (its bottom 130 cm) at their size, the mast between them stretched. Up to 5 m a post-top lamp: a
      // slim pole with the luminaire on top, as in parks and quiet streets (the set's own picture, lamp-post-top, where
      // it has one).
      const name = right ? "lamp-modern-left" : "lamp-modern-right", anchor = right ? 348 : 22;
      if (!it.h) return sprite(g, name, x, top, false, anchor);
      const dark = artKey() === "brno", pole = dark ? "#3d4246" : "#b5b9ba", shade = dark ? "#2c3033" : "#94989a";
      if (it.h <= 5) {
        if (postTopLamp(g, x, top, it.h)) return;
        const head = top - it.h * 100;
        el("path", { d: `M${x - 15} ${top} L${x - 13} ${top - 70} H${x + 13} L${x + 15} ${top} Z`, fill: dark ? "#33373a" : "#727678" }, g);
        el("rect", { x: x - 6, y: head + 30, width: 12, height: it.h * 100 - 100, fill: pole }, g);
        el("rect", { x: x + 2, y: head + 30, width: 4, height: it.h * 100 - 100, fill: shade }, g);
        el("path", { d: `M${x - 30} ${head + 30} L${x - 22} ${head + 8} H${x + 22} L${x + 30} ${head + 30} Z`, fill: dark ? "#3d4246" : "#2f3335" }, g); // the luminaire
        el("rect", { x: x - 26, y: head + 26, width: 52, height: 4, fill: "#b9c2c1" }, g); // its glass, facing down
        el("rect", { x: x - 3, y: head, width: 6, height: 9, rx: 2, fill: dark ? "#3d4246" : "#2f3335" }, g);
        return;
      }
      const d = it.h * 100 - lampLight() * 100, base = top - 930;
      const part = (y0, y1, transform) => {
        const id = `lamp${nextClip()}`, og = el("g", transform ? { transform } : {}, g);
        el("rect", { x: x - 400, y: base + y0, width: 800, height: y1 - y0 }, el("clipPath", { id }, og));
        sprite(el("g", { "clip-path": `url(#${id})` }, og), name, x, top, false, anchor);
      };
      part(0, 301, `translate(0 ${-d})`); // the top up or down by d
      part(299, 801, `translate(0 ${base + 800}) scale(1 ${(500 + d) / 500}) translate(0 ${-(base + 800)})`); // the mast
      part(799, 930); // the foot
      return;
    }
    // The Prague bench has its back on the left: on the right half it turns to face the street too.
    case "lavicka": return sprite(g, "bench-center", x, top, right);
    case "strom": return sprite(g, "tree", x, top);
    // A rack across the street shows a bike from its side; one along it (it.along, Magdalena) a bike from the front
    // beside the rack seen edge-on (about 0.8 m of room in a row instead of 1.9 m; app.js spreadItems).
    case "stojan_kola": {
      if (!it.along) return sprite(g, "bike-rack-perpendicular-left", x, top);
      const rack = artKey() === "praha" ? "#3a332e" : "#7c8082", tyre = "#2c2c2c", frame = "#5f7f8e";
      el("rect", { x: x - 8, y: top - 104, width: 16, height: 5, rx: 2.5, fill: tyre }, g); // the saddle, behind and higher
      el("ellipse", { cx: x, cy: top - 33, rx: 4, ry: 32, fill: "none", stroke: tyre, "stroke-width": 4 }, g); // the wheel, edge-on
      el("path", { d: `M${x} ${top - 66} L${x} ${top - 92}`, stroke: frame, "stroke-width": 4, "stroke-linecap": "round" }, g); // the fork
      el("path", { d: `M${x - 30} ${top - 90} Q${x} ${top - 99} ${x + 30} ${top - 90}`, fill: "none", stroke: "#4a4d4f", "stroke-width": 3, "stroke-linecap": "round" }, g);
      for (const d of [-30, 30]) el("rect", { x: x + d - 3, y: top - 93, width: 6, height: 7, rx: 2, fill: tyre }, g); // the grips
      el("circle", { cx: x, cy: top - 82, r: 3.5, fill: "#f2e9a0", stroke: tyre, "stroke-width": 1 }, g); // the lamp
      // The rack beside the wheel, seen edge-on: one tube.
      el("rect", { x: right ? x - 18 : x + 12, y: top - 80, width: 6, height: 80, rx: 3, fill: rack }, g);
      return;
    }
    case "sdilena_kola": return sprite(g, "bikeshare-left", x, top);
    case "pristresek": case "pristresek_zeleny": {
      const side = right ? "right" : "left";
      // A green roof (rainwater management 5.1.1): the city's own picture of it where there is one.
      // (A tram stop keeps its own shelter, with the roof laid on it.)
      if (it.kind === "pristresek_zeleny" && !it.tram && ownSprite(`transit-shelter-green-${side}`)) return sprite(g, `transit-shelter-green-${side}`, x, top);
      // A tram stop's own shelter where the city has one (Prague, Brno), else the bus stop's.
      const name = it.tram && ownSprite(`transit-shelter-tram-${side}`) ? `transit-shelter-tram-${side}` : `transit-shelter-01-${side}`;
      sprite(g, name, x, top);
      if (it.kind === "pristresek_zeleny") greenRoof(g, name, x, top, right);
      return;
    }
    case "sloupek": return sprite(g, "bollard", x, top);
    // Tram overhead-line pole (technical map): a 9 m steel pole with its bracket over the tracks; a street
    // lamp mounted on it (OSM) is drawn with it.
    case "sloup_trakce": {
      // The city's own pole (praha/tram-pole-*): its bracket over the tracks, on the right half pointing left;
      // a pole between the tracks (it.center) carries brackets over both (Bára's photo, Prague).
      const lamp = it.lamp ? "-lamp" : "";
      if (ownSprite(`tram-pole${lamp}-left`)) {
        // Scaled so the wire hangs at WIRE_H, where the trams' pantographs and the trolleybuses' poles reach.
        // A pole between the tracks reaches with each bracket to the middle of its track (it.reach, cm; the picture's
        // wire hangs 290 cm from the pole).
        const sx = it.reach ? it.reach / 290 : POLE_SCALE;
        const pg = el("g", { transform: `translate(${x} ${top}) scale(${sx} ${POLE_SCALE}) translate(${-x} ${-top})` }, g);
        // A pole away from the tracks (it.span) holds a span wire to them (spanPlan, drawn with the street), not a bracket (Bára, 17. listopadu): the picture without its bracket (all of the same shape: the
        // shaft, and the lamp above the bracket's tie at 165 cm from the top of the 1010 cm picture).
        if (it.span) {
          const id = `pole${nextClip()}`, cp = el("clipPath", { id }, pg);
          el("rect", { x: x - 30, y: top - 1010, width: 60, height: 1010 }, cp);
          el("rect", { x: x - 200, y: top - 1010, width: 400, height: 165 }, cp);
          pg.setAttribute("clip-path", `url(#${id})`);
        }
        if (it.center || !right) sprite(pg, `tram-pole${lamp}-right`, x, top, false, 22);
        if (it.center || right) sprite(pg, `tram-pole${lamp}-left`, x, top, false, 348);
        return;
      }
      if (it.lamp) sprite(g, right ? "lamp-modern-left" : "lamp-modern-right", x, top, false, right ? 348 : 22);
      const arm = right ? -1 : 1;
      el("path", { d: `M ${x - 14} ${top} L ${x - 9} ${top - 900} L ${x + 9} ${top - 900} L ${x + 14} ${top} Z`, fill: "#5b6460" }, g);
      if (it.span) return; // a span wire instead of the bracket (spanPlan)
      line({ x: Math.min(x, x + arm * 260), y: top - 830, width: 260, height: 7, fill: "#5b6460" });
      el("line", { x1: x, y1: top - 760, x2: x + arm * 260, y2: top - 826, stroke: "#5b6460", "stroke-width": 4 }, g);
      return;
    }
    // Stop pole (označník zastávky, technical map).
    case "oznacnik":
      if (ownSprite("stop-post-left")) return sprite(g, `stop-post${it.tram ? "-tram" : ""}-${right ? "right" : "left"}`, x, top);
      line({ x: x - 4, y: top - 280, width: 8, height: 280, fill: "#3d3b36" });
      line({ x: x - 26, y: top - 300, width: 52, height: 64, fill: "#fff", stroke: "#b5302a", "stroke-width": 5 });
      el("text", { x, y: top - 256, "text-anchor": "middle", "font-size": 30, "font-weight": "bold", fill: "#1f1f1d" }, g).textContent = "Z";
      return;
    case "kvetinac": return sprite(g, "planter-box", x, top);
    case "svodidlo": return sprite(g, "guardrail", x, top);
    case "zahradka": return sprite(g, "cafe-seating-occupied", x, top);
    case "zivy_plot": {
      // A hedge seen along the street: a dense green block 1.3 m high and 0.8 m wide with a rounded top, not the small
      // bush a green part draws in its middle (Bára 27. 11. 2026: the hedge on Stübelallee in Dresden was drawn as one
      // bush among the lawn's own and nobody saw it).
      line({ x: x - 40, y: top - 130, width: 80, height: 130, fill: "#5f8f3a", rx: 30 });
      for (const [dx, dy, r, c] of [[-16, -98, 17, "#78a64a"], [14, -108, 15, "#4d7a2e"], [-12, -60, 16, "#4d7a2e"], [16, -44, 14, "#78a64a"], [-6, -20, 13, "#78a64a"]]) el("circle", { cx: x + dx, cy: top + dy, r, fill: c }, g);
      return;
    }
    case "plot":
      line({ x: x - 4, y: top - 150, width: 8, height: 150, fill: "#6b6a65" });
      for (let k = 0; k < 3; k++) line({ x: x - 30, y: top - 140 + k * 45, width: 60, height: 5, fill: "#6b6a65" });
      return;
    case "zabradli":
      // A railing seen along the street: its post 1.1 m high, the handrail on top and a rail halfway (on a bridge's edge
      // it.f is 0 or 1; drawn just inside the part).
      line({ x: x - 3, y: top - 110, width: 6, height: 110, fill: "#55534d" });
      line({ x: x - 9, y: top - 116, width: 18, height: 10, rx: 4, fill: "#55534d" });
      line({ x: x - 7, y: top - 58, width: 14, height: 6, fill: "#55534d" });
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
