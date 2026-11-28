// The side wall with its plinth, an arcade and the street facade seen edge-on.
import { ARCADE_D, gableOn } from "./form.js";
import { EDGE, el, GROUND, tint } from "../svg.js";
import { FRAME, GLASS, PALETTES, SKLEP, STONE } from "./tables.js";

export function drawWall(hs) {
  const { X, box, brick, det, dot, f, g, kind, office, outline, style, surface, top, wall, wood, x } = hs;
  // --- The side wall, with its plinth (drawn before the door, which stands on the ground) ---
  // Under the building: a cellar band and the same earth as under the street.
  const cellar = GROUND + 60 - surface;
  el("rect", { x, y: surface, width: EDGE, height: cellar, fill: SKLEP }, g);
  box(0, EDGE, -8, 0, tint(SKLEP, 0.85));
  const dCellar = style === "hala" || office ? 32 : 230; // under the ground-floor window, not under the door
  if (!["plocha", "statek", "garaz", "kostel", "malta", "kypr", "drevak", "puukaupunki"].includes(kind)) { // a panel house has it in the plinth, a village house has no cellar window
    box(dCellar, dCellar + 66, -cellar * 0.55 - 6, -cellar * 0.55 + 31, FRAME); // a cellar window
    box(dCellar + 6, dCellar + 60, -cellar * 0.55, -cellar * 0.55 + 25, GLASS);
  }
  el("rect", { x, y: GROUND + 60, width: EDGE, height: 40, fill: "#9b7f5f" }, g);
  // The wall runs on past the cut (Bára 23. 11. 2026): no strip and no outline there, only along the street and the top.
  box(0, EDGE, 0, top, wall);
  // Under a gable turned towards us no line at the wall's top: the gable goes on from the wall without a seam.
  el("path", { d: `${gableOn(kind) ? "" : `M${X(EDGE)} ${surface - top} L`}${gableOn(kind) ? "M" : ""}${X(0)} ${surface - top} L${X(0)} ${surface}`, fill: "none", ...outline }, g);
  // The regional walls: brick courses, azulejo tiles, the ashlar of Malta and Cyprus, boards, Haussmann's rustication.
  if (brick) for (let z = 30, i = 0; z < top; z += 30, i++) { // brick courses with staggered joints (a bond, not boards)
    box(0, EDGE, z - 1.2, z + 1.2, tint(wall, 0.86));
    for (let d = i % 2 ? 50 : 20; d < EDGE; d += 60) box(d - 1, d + 1, z - 30, z, tint(wall, 0.88)); // symmetric to the middle (a gable's axis)
  }
  if (kind === "azulejo") {
    const line = tint(wall, 0.8);
    for (let z = 50; z < top; z += 15) box(0, EDGE, z - 0.6, z + 0.6, line);
    for (let d = 15; d < EDGE; d += 15) box(d - 0.6, d + 0.6, 50, top, line);
    for (let z = 57, i = 0; z < top; z += 15, i++) for (let d = i % 2 ? 7 : 22; d < EDGE; d += 30) dot(d, z, 2.2, tint(wall, 0.62)); // the pattern, as a dot
    box(0, 22, 0, top, "#f0ece2"); // the white stone of the corner
  }
  if (kind === "malta" || (kind === "kypr" && wall !== PALETTES.kypr[2])) {
    for (let z = 34, i = 0; z < top; z += 34, i++) {
      box(0, EDGE, z - 1, z + 1, tint(wall, 0.88));
      for (let d = i % 2 ? 35 : 70; d < EDGE; d += 70) box(d - 1, d + 1, z, Math.min(z + 34, top), tint(wall, 0.9));
    }
  }
  if (wood) {
    const z0 = kind === "tallinnamaja" ? f.ground : 0;
    if (z0) { box(0, EDGE, 0, z0, "#cfc6b0", outline); box(-6, EDGE, z0 - 8, z0 + 4, "#f6f4ee", outline); } // the rendered stone ground floor
    if (det.boards === "vertical") for (let d = 25; d < EDGE; d += 25) box(d - 2, d + 2, z0 + 40, top, tint(wall, 0.8)); // board and batten
    else for (let z = z0 + 15; z < top; z += 15) box(0, EDGE, z - 0.8, z + 0.8, tint(wall, 0.84));
    box(0, 22, z0 + 30, top, "#f6f4ee"); // the white corner board at the street (the house does not turn at the cut)
  }
  if (kind === "haussmann") { // the rusticated shop floor and entresol: light stone, joints every 40 cm
    const RS = tint(wall, 1.04);
    box(0, EDGE, 40, f.ground - 24, RS);
    for (let z = 80; z < f.ground - 24; z += 40) box(0, EDGE, z - 2.5, z + 2.5, tint(wall, 0.84));
  }
  const plinth = office ? [20, "#8a867d"] : {
    haussmann: [40, "#9a958c"], stredomori: [90, tint(wall, 0.78)], azulejo: [40, "#9c968c"], galeria: [60, "#8f8a80"], malta: [30, tint(wall, 0.85)],
    kypr: [30, tint(wall, 0.8)], cihlovy: [50, "#5b5f62"], stit: [50, "#5b5f62"], dansky: [50, "#5b5f62"], stenstad: [60, "#8f8b86"],
    drevak: [40, "#6e6b66"], puukaupunki: [40, "#6e6b66"], tallinnamaja: [40, "#8f8a80"], hanza: [50, "#bdb6a4"], kostel: [120, STONE], garaz: [15, "#8a867d"], skola: [90, "#a59c88"], mestan: [70, STONE], sorela: [100, "#a89a7f"], vila: [70, "#a59c88"], kostka: [110, "#8f8a80"], novyrd: [30, "#56585b"], statek: [55, "#8a8173"] }[kind]
    || { sikma: [90, STONE], funkce: [60, "#8f887c"], povalecny: [45, "#8c8a85"], moderni: [30, "#56585b"], plocha: [100, "#8a867d"], nizky: [60, "#a59c88"] }[style];
  if (plinth) box(-8, EDGE, 0, plinth[0], plinth[1]);
  Object.assign(hs, { plinth });
}

export function drawArcade(hs) {
  const { X, box, f, g, info, outline, style, surface, wall } = hs;
  // --- An arcade (podloubí) where OSM has one by the facade (derive.js, info.arcade): the vaulted opening under the
  // front of the house seen from the side, a pillar at the street; doors and windows behind it are not seen.
  if (info?.arcade && style !== "hala") {
    // The vault stays under the ground floor's ceiling: a flatter (elliptic) arch where the floor is low.
    const a1 = ARCADE_D - 10, ah = Math.min(Math.max(200, f.ground - 150), f.ground - 70), rx = (a1 - 10) / 2;
    const ry = Math.max(20, Math.min(rx, f.ground - 40 - ah));
    box(10, a1 + 10, 0, ah + ry + 10, wall); // the wall over what stood there
    box(10, a1, 0, ah, "#5d564c");
    const [x1, x2] = [X(10), X(a1)].sort((p, q) => p - q);
    el("path", { d: `M${x1} ${surface - ah} A ${rx} ${ry} 0 0 1 ${x2} ${surface - ah} Z`, fill: "#5d564c" }, g);
    box(10, a1, 0, 30, "#7b7266"); // the paving under the arcade, lit
    box(-6, 10, 0, f.ground - 20, tint(wall, 0.92), outline); // the pillar by the street
    box(-16, 20, f.ground - 40, f.ground - 20, tint(STONE, 1.05), outline); // its capital
  }
}

export function drawStreetFacadeEdge(hs) {
  const { box, dark, plinth, top } = hs;
  box(0, 10, plinth ? plinth[0] : 0, top, dark); // the street facade, seen edge-on
}
