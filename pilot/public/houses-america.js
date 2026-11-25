// The houses of North America (docs/house-types-north-america.md; Bára 25. 11. 2026): their measures and their drawing
// in the app's side view (profile.js drawPrahaBuilding hands it its helpers), one drawing a look, from shared parts
// (sash window, clapboards, brick, porch, stairs, cornice on brackets, shop front). Which house gets which look:
// house-looks.js northAmericaLook. d = distance from the street facade into the house (negative: towards the street),
// z = height above the ground, in cm. Everything that stands before the facade (a bay, a porch, a stoop, a fire escape)
// is drawn from the side; the facade's door and windows are drawn on the side wall, as in the other houses.

// storey, floors: the typical storey (cm) and the floors of a house of no known floors; groundK: the ground floor in
// storeys; base: how high the first floor stands over the sidewalk (an English basement, a stoop, a porch); attic: the
// wall over the top floor's windows; roof: how high the roof rises over the wall.
export const AMERICA = {
  bayrow: { storey: 320, floors: 2, base: 105, attic: 70, roof: 190 },
  porchrow: { storey: 290, floors: 2, base: 95, attic: 20, roof: 190 },
  framehouse: { storey: 270, floors: 2, base: 75, attic: 10, roof: 330 },
  brickblock: { storey: 290, floors: 4, base: 45, attic: 45, roof: 60 },
  slab: { storey: 275, floors: 8, groundK: 1.25, base: 0, attic: 20, roof: 300 },
  podium: { storey: 300, floors: 5, groundK: 1.5, base: 0, attic: 30, roof: 70 },
  glasstower: { storey: 310, floors: 12, groundK: 1.6, base: 0, attic: 20, roof: 320 },
  mainstreet: { storey: 340, floors: 2, groundK: 1.15, base: 0, attic: 90, roof: 60 },
  stripmall: { storey: 480, floors: 1, base: 0, attic: 60, roof: 120 },
  brownstone: { storey: 340, floors: 4, base: 120, attic: 75, roof: 60 },
  tenement: { storey: 310, floors: 5, groundK: 1.15, base: 0, attic: 60, roof: 120 },
  tripledecker: { storey: 285, floors: 3, base: 80, attic: 30, roof: 90 },
  baygable: { storey: 310, floors: 2, base: 70, attic: 20, roof: 400 },
  victorian: { storey: 320, floors: 3, base: 0, attic: 60, roof: 130 },
};
const BRICKS = ["#9c4a36", "#a9573f", "#8a4031", "#b0654a"];
const SIDING = ["#f1efe8", "#d3d8d6", "#b9c6cc", "#c9cfb6", "#eadfbe", "#a9b4ae"];
export const AMERICA_PALETTES = {
  bayrow: ["#9c4a36", "#8a4031", "#a9573f", "#b9b3a4", "#a04e3a"],
  porchrow: ["#a9573f", "#9c4a36", "#b98a64", "#8f4a38"],
  framehouse: SIDING,
  brickblock: ["#a9573f", "#b98f68", "#9c4a36", "#c2a27c"],
  slab: ["#d8d0c0", "#c9b59a", "#b98f74", "#e2ded4"],
  podium: ["#c9c5bb", "#b9a58a", "#a9b0b2"],
  glasstower: ["#6f95a8", "#7ba0ab", "#6a8a9c"],
  mainstreet: ["#a9573f", "#8a4031", "#c2a27c", "#b9b3a4"],
  stripmall: ["#dccfb4", "#c9b59a", "#e4ddcd", "#b98f74"],
  brownstone: ["#7d5140", "#74493a", "#8a5c48", "#6e4a3e"],
  tenement: ["#a24c36", "#b98a5c", "#8a4031", "#c39a6c"],
  tripledecker: ["#e8e0c8", "#b9c6cc", "#d3d8d6", "#c9cfb6", "#d9b78f"],
  baygable: ["#9c4a36", "#a9573f", "#8f4536"],
  victorian: ["#a9c0c9", "#e6cf9a", "#d9a6a0", "#b5c8a0", "#c7b8d6", "#e9e2d0"],
};
const GLASS = "#2f3557", GLINT = "#454a75", LIT = "#f4d98c", WHITE = "#f4f2ec", IRON = "#2b2d2f", LIME = "#ddd3bd", METAL = "#9aa0a3", PAINT = "#e2ddd0"; // PAINT: painted wood that stands before the pale sky
const SHOP = "#45547c";
const SHINGLE = [["#6d6a66", "#4f4d4a"], ["#7a6455", "#5b4a3f"], ["#565c62", "#3e4348"]];
const LETTERS = ["#f6efdf", "#f4d98c"];
export const isBrick = (wall) => parseInt(wall.slice(1, 3), 16) - parseInt(wall.slice(5, 7), 16) > 70;

// info's year and floors decide the era of an apartment house (cornice and stone base before 1946, balconies 1946–90);
// det: what the state's houseDetails say (front: "bay" | "flat" of a row house, palette, plain).
export function drawAmerican(kind, { g, el, X, surface, EDGE, f, seed, wall, det, info, box, poly, dot, arch, tint, outline, colAxes }) {
  const top = f.body, n = f.n, S = f.storey, base = f.base, G = f.ground; // G: the top of the ground floor
  const floorZ = (k) => (k === 0 ? base : G + (k - 1) * S);
  const y = info?.built ?? info?.start;
  const thin = (c) => ({ stroke: tint(c, 0.72), "stroke-width": 1.2, "vector-effect": "non-scaling-stroke" });
  const rnd = (k) => (((k + seed * 31 + 7) * 2654435761) >>> 0) % 13;
  const shade = tint(wall, 0.86), dark = tint(wall, 0.68), lite = tint(wall, 1.1);
  // ---- parts ----
  const bricks = (d0, d1, z0, z1, c) => {
    for (let z = Math.ceil(z0 / 30) * 30, i = Math.round(z / 30); z < z1; z += 30, i++) {
      box(d0, d1, z - 1, z + 1, tint(c, 0.87));
      for (let d = (i % 2 ? 50 : 20) + Math.floor(d0 / 60) * 60; d < d1; d += 60) if (d > d0) box(d - 0.9, d + 0.9, Math.max(z0, z - 30), z, tint(c, 0.89));
    }
  };
  const boards = (d0, d1, z0, z1, c) => { for (let z = z0 + 14; z < z1; z += 14) box(d0, d1, z - 0.8, z + 0.8, tint(c, 0.85)); };
  // A double-hung sash window: o.fr frame, o.lintel / o.sill colours, o.trim a board round it, o.muntin, o.hood.
  const sash = (d, z, w, h, k, o = {}) => {
    const lit = rnd(k) === 5, fr = o.fr || WHITE;
    if (o.trim) box(d - 14, d + w + 14, z - 8, z + h + 16, o.trim, thin(o.trim));
    const bow = (grow, rise, fill) => { const [x1, x2] = [X(d - grow), X(d + w + grow)].sort((a, b) => a - b), zb = z + h - 1; el("path", { d: `M${x1} ${surface - zb} Q ${(x1 + x2) / 2} ${surface - zb - rise} ${x2} ${surface - zb} Z`, fill }, g); };
    if (o.lintel && o.arch) bow(17, 76, o.lintel);
    else if (o.lintel) box(d - 12, d + w + 12, z + h + 5, z + h + 24, o.lintel, thin(o.lintel));
    if (o.hood) { // a hood on two brackets
      box(d - 16, d + w + 16, z + h + 5, z + h + 14, o.hood);
      poly([[d - 22, z + h + 14], [d + w + 22, z + h + 14], [d + w + 22, z + h + 26], [d + w / 2, z + h + (o.ped ? 48 : 26)], [d - 22, z + h + 26]], o.hood, thin(o.hood));
      for (const dd of [d - 14, d + w + 4]) box(dd, dd + 10, z + h - 16, z + h + 8, tint(o.hood, 0.92));
    }
    box(d - 6, d + w + 6, z - 6, z + h + (o.arch ? 0 : 6), fr);
    if (o.arch) { bow(6, 44, fr); bow(0, 32, lit ? LIT : GLASS); }
    box(d, d + w, z, z + h, lit ? LIT : GLASS);
    poly([[d + w * 0.5, z + h], [d + w, z + h], [d + w, z + h * 0.6]], lit ? "#f8e7b5" : GLINT);
    box(d, d + w, z + h * 0.5 - 3, z + h * 0.5 + 3, fr);
    if (o.twin) box(d + w / 2 - 5, d + w / 2 + 5, z, z + h, fr);
    if (o.muntin) box(d + w / 2 - 1.5, d + w / 2 + 1.5, z + (o.muntin === 2 ? 0 : h * 0.5), z + h, fr);
    if (rnd(k) === 7 || rnd(k) === 3) box(d, d + w, z + h * 0.72, z + h, "#d8d2c2", { "fill-opacity": 0.75 }); // a blind
    if (o.ac && rnd(k) === 2) { box(d + w * 0.2, d + w * 0.8, z, z + 34, "#c9c8c2", thin("#c9c8c2")); for (let q = z + 6; q < z + 30; q += 6) box(d + w * 0.26, d + w * 0.74, q, q + 2, "#8f9190"); } // a room air conditioner
    box(d - 12, d + w + 12, z - 14, z - 6, o.sill || tint(wall, 0.72));
  };
  const rail = (d0, d1, z, h, c = IRON, step = 11) => {
    box(d0, d1, z + h - 6, z + h, c);
    box(d0, d1, z + 6, z + 10, c);
    for (let d = d0; d <= d1 - 2; d += step) box(d, d + 3, z, z + h, c);
  };
  // A flight of steps from the first floor (z) at d = from out to the sidewalk: solid (stone) or open iron, with its rail.
  const flight = (from, z, o = {}) => {
    const steps = Math.max(2, Math.round(z / 18)), tr = o.tread || 27, r = z / steps, c = o.c || LIME;
    for (let i = 0; i < steps; i++) {
      const d1 = from - i * tr, zt = z - i * r;
      if (o.open) box(d1 - tr - 3, d1, zt - r, zt - r + 5, c);
      else box(d1 - tr, d1, 0, zt - r + (i === steps - 1 ? 0 : 0), c, thin(c));
    }
    const end = from - steps * tr;
    if (o.open) poly([[from, z - r - 14], [from, z - r - 2], [end, 0], [end + 12, 0]], c);
    const H = 92, rc = o.rail || IRON;
    poly([[from, z + H - 5], [from, z + H], [end, H], [end, H - 5]], rc);
    for (let i = 0; i <= steps; i++) box(from - i * tr - 2, from - i * tr + 1, z - i * r - (i ? 0 : r), z - i * r + H - 3, rc);
    if (o.newel) { box(end - 12, end + 8, 0, H + 14, o.newel, thin(o.newel)); box(end - 15, end + 11, H + 14, H + 22, tint(o.newel, 1.08)); }
    return end;
  };
  // A porch: its floor at z on piers or a skirt, posts, a railing, its roof (shed, or flat with a rail: the deck over it).
  const porch = (deep, z, zr, o = {}) => {
    const post = o.post || PAINT, pc = o.pier || "#8f6a58";
    if (o.skirt) { box(-deep, 0, 0, z - 14, o.skirt, thin(o.skirt)); if (o.lattice) for (let d = -deep + 12; d < 0; d += 12) box(d - 1, d + 1, 0, z - 14, tint(o.skirt, 0.8)); }
    else box(-deep, -deep + 40, 0, z - 14, pc, thin(pc));
    box(-deep - 8, 0, z - 14, z, o.floor || "#a9a59b", thin("#a9a59b"));
    if (!o.noRail) rail(-deep + 4, -2, z, 85, tint(post, 0.88), 13);
    if (o.halfPier) { box(-deep + 2, -deep + 40, z, z + 100, pc, thin(pc)); box(-deep - 2, -deep + 44, z + 100, z + 108, LIME); }
    for (const d of o.two ? [-deep + 12, -14] : [-deep + 12]) {
      box(d, d + 16, z + (o.halfPier && d < -20 ? 108 : 0), zr, post, thin(post));
      box(d - 4, d + 20, zr - 12, zr, post);
    }
    if (o.roof) {
      box(-deep - 14, 0, zr, zr + 18, WHITE, thin(WHITE));
      poly([[-deep - 24, zr + 18], [0, zr + (o.pitch || 70)], [0, zr + (o.pitch || 70) - 14], [-deep - 14, zr + 10]], o.roof[1]);
      poly([[-deep - 26, zr + 16], [-deep - 24, zr + 28], [0, zr + (o.pitch || 70) + 10], [0, zr + (o.pitch || 70) - 4]], o.roof[0], thin(o.roof[0]));
    }
  };
  // A cornice on brackets: h tall, reaching over the street.
  const cornice = (z, h, over, c, o = {}) => {
    box(-6, EDGE, z - h, z - 26, tint(c, 0.94));
    if (o.panel) for (let d = 20; d < EDGE; d += 92) box(d, d + 62, z - h + 14, z - 40, tint(c, 0.82));
    for (let d = o.panel ? 2 : 6; d < EDGE; d += o.panel ? 92 : 46) poly([[d, z - 26], [d + 12, z - 26], [d + 12, z - h + 6], [d + 3, z - h + 6]], tint(c, 0.85), thin(c));
    poly([[0, z - h + 4], [-over * 0.75, z - 26], [0, z - 26]], tint(c, 0.8)); // the bracket over the street
    box(-over * 0.8, EDGE, z - 26, z - 14, c, thin(c));
    box(-over, EDGE, z - 14, z, tint(c, 1.06), thin(c));
    box(0, EDGE, z - h - 10, z - h, shade);
    box(-8, EDGE, z - h, z - h + 8, c, thin(c));
  };
  // The front door with a transom on the side wall, its sill at z.
  const DOORS = ["#2f3f4f", "#7a2a24", "#23382c", "#3a2a20", "#4b5a3c"];
  const door = (z, o = {}) => {
    const h = o.h || 215, c = o.c || DOORS[rnd(3) % DOORS.length];
    if (o.surround) { box(4, 126, z, z + h + 66, o.surround, thin(o.surround)); }
    box(16, 114, z, z + h + 46, o.fr || WHITE);
    box(24, 106, z, z + h, c);
    box(34, 96, z + h * 0.45, z + h - 18, o.glass === false ? tint(c, 1.2) : GLASS);
    box(34, 96, z + 20, z + h * 0.38, tint(c, 1.25));
    box(24, 106, z + h + 8, z + h + 40, GLASS);
    dot(99, z + h * 0.44, 4, "#d9c27a");
    if (o.hood) { box(0, 130, z + h + 62, z + h + 76, o.hood, thin(o.hood)); poly([[-6, z + h + 76], [136, z + h + 76], [65, z + h + 118]], tint(o.hood, 1.05), thin(o.hood)); for (const d of [2, 116]) poly([[d, z + h + 62], [d + 14, z + h + 62], [d + 14, z + h + 14], [d + 5, z + h + 20]], tint(o.hood, 0.88)); }
  };
  // Shop front on the side wall: bulkhead, glass, transom, its sign board above.
  const shop = (c, zs, o = {}) => {
    const d0 = o.d0 ?? 14;
    box(d0 - 8, EDGE, 0, zs + 10, c, thin(c));
    box(d0, 112, 8, 222, tint(c, 0.8));
    box(d0 + 10, 104, 30, 214, GLASS);
    box(d0, 112, 230, zs, GLASS);
    for (let d = 128; d < EDGE; d += 180) {
      box(d, d + 164, 60, zs - 50, SHOP);
      poly([[d + 90, zs - 50], [d + 164, zs - 50], [d + 164, zs * 0.5]], GLINT);
      box(d, d + 164, zs - 42, zs, GLASS);
      box(d, d + 164, 14, 50, tint(c, 1.25));
    }
  };
  const sign = (z, h, c) => {
    box(0, EDGE, z, z + h, c, thin(c));
    const L = LETTERS[seed % 2];
    for (let i = 0, d = 60; i < 9; i++, d += 30) if (i !== 4) box(d, d + 18, z + h * 0.3, z + h * 0.7, L);
  };
  const awning = (z, reach, drop, c) => {
    poly([[0, z], [-reach, z - drop], [-reach, z - drop - 26], [0, z - 26]], tint(c, 0.82));
    poly([[0, z], [-reach, z - drop], [-reach, z - drop - 22], [0, z - 10]], c, thin(c));
    for (let d = -reach; d < 0; d += 14) dot(d + 7, z - drop - 22 + ((d + reach) / reach) * 8 - 2, d < -reach + 8 ? 6 : 0.1, c);
  };
  const chimney = (d, z0, z1, c = "#8f4a38") => { box(d - 28, d + 28, z0, z1, c, thin(c)); box(d - 34, d + 34, z1 - 12, z1, tint(c, 0.8)); for (const q of [-12, 12]) box(d + q - 7, d + q + 7, z1, z1 + 18, "#b06a4a"); };
  const parapet = (h, c, cap) => { box(-4, EDGE, top, top + h, c, thin(c)); box(-12, EDGE, top + h, top + h + 8, cap); };
  const rtu = (d, z) => { box(d, d + 110, z, z + 80, "#b5babd", thin("#b5babd")); for (let q = d + 12; q < d + 100; q += 18) box(q, q + 8, z + 26, z + 64, "#8f979d"); };
  const wallBase = (c, o = {}) => {
    box(0, EDGE, 0, top, c);
    if (o.brick) bricks(0, EDGE, 0, top, c);
    if (o.boards) boards(0, EDGE, base, top, c);
    el("path", { d: `M${X(EDGE)} ${surface - top} L${X(0)} ${surface - top} L${X(0)} ${surface}`, fill: "none", ...outline }, g);
  };
  const front = () => box(0, 10, 0, top, dark); // the street facade, edge-on

  // ---- the looks ----
  const brickWall = isBrick(wall);
  const each = (w, fn) => { for (const [i, c] of colAxes(w).entries()) if (c - w / 2 < EDGE) fn(i, c - w / 2); };
  if (kind === "bayrow") {
    // Washington's row house of 1870–1915: a raised first floor over an English basement, the projecting square bay
    // (its own face and narrow side window; a pointed slate roof or a gable on some), iron steps, a corbelled cornice.
    const bay = det.front !== "flat", CN = brickWall ? tint(wall, 0.78) : "#5d5f62";
    chimney(EDGE - 70, top - 10, top + 120);
    wallBase(wall, { brick: brickWall });
    box(-6, EDGE, 0, base - 10, tint(wall, 0.84));
    box(-8, EDGE, base - 10, base, LIME, thin(LIME)); // the water table
    sash(colAxes(85)[1] - 38, 22, 76, base - 60, 91, { sill: LIME });
    door(base, { h: Math.min(230, G - base - 80) });
    sash(colAxes(85)[1] - 42, base + 0.24 * S, 85, 0.56 * S, 1, { lintel: LIME, sill: LIME, arch: rnd(2) % 2 });
    if (colAxes(85)[2]) sash(colAxes(85)[2] - 42, base + 0.24 * S, 85, 0.56 * S, 2, { lintel: LIME, sill: LIME });
    for (let k = 1; k < n; k++) each(85, (i, d) => sash(d, floorZ(k) + 0.24 * S, 85, 0.56 * S, k * 3 + i, { lintel: LIME, sill: LIME }));
    front();
    cornice(top, 62, bay ? 24 : 40, CN);
    if (bay) {
      const D = 120, tower = rnd(1) % 3 === 0 && !det.round, zt = top - 12, bw = tint(wall, 1.05);
      box(-D, 0, 0, zt, bw, outline);
      if (brickWall) bricks(-D + 2, -2, 0, zt, bw);
      box(-D - 4, 0, base - 10, base, LIME, thin(LIME));
      sash(-D + 42, 22, 46, base - 60, 92, { sill: LIME });
      for (let k = 0; k < n; k++) {
        sash(-D + 40, floorZ(k) + 0.24 * S, 48, 0.56 * S, k * 5 + 40, { lintel: LIME, sill: LIME });
        if (k) box(-D - 3, 0, floorZ(k) - 16, floorZ(k) - 4, tint(bw, 0.86)); // a band of moulded brick
      }
      box(-D - 8, 0, zt - 34, zt - 18, CN, thin(CN));
      box(-D - 18, 0, zt - 18, zt, tint(CN, 1.1), thin(CN));
      if (tower) { poly([[-D - 20, zt], [8, zt], [-D / 2, zt + 170]], "#565c62", thin("#565c62")); for (let z = zt + 26; z < zt + 150; z += 26) { const r = (1 - (z - zt) / 170) * (D / 2 + 12); box(-D / 2 - r, -D / 2 + r, z - 1.5, z + 1.5, "#41464b"); } box(-D / 2 - 2, -D / 2 + 2, zt + 160, zt + 190, "#41464b"); }
      else { box(-D - 6, 10, zt, zt + 34, tint(bw, 0.92), thin(bw)); box(-D - 10, 10, zt + 34, zt + 42, LIME); }
    }
    flight(0, base, { open: true, c: IRON }); // the cast-iron steps
  } else if (kind === "porchrow") {
    // The porch-front row house of 1905–40 (Wardman's): a full-width porch on brick piers, the front of the roof a short
    // steep slope with a dormer, flat behind.
    const R = SHINGLE[seed % 3], P = 185;
    chimney(EDGE - 60, top, top + 150);
    wallBase(wall, { brick: brickWall });
    box(0, EDGE, top, top + 120, wall); if (brickWall) bricks(0, EDGE, top, top + 120, wall); // the party wall up to the flat roof
    poly([[-46, top - 8], [66, top + 128], [66, top + 112], [-30, top - 14]], R[1]);
    poly([[-48, top - 8], [-46, top + 6], [60, top + 140], [78, top + 140], [70, top + 124]], R[0], thin(R[0]));
    box(60, EDGE, top + 118, top + 130, LIME, thin(LIME));
    { // the dormer, its cheek and little roof
      poly([[-12, top + 36], [-12, top + 116], [52, top + 116]], tint(R[0], 1.25), thin(R[0]));
      poly([[-30, top + 112], [-30, top + 122], [70, top + 138], [60, top + 112]], R[0], thin(R[0]));
      box(-16, -8, top + 32, top + 116, WHITE);
    }
    box(-34, EDGE, top - 22, top - 8, WHITE, thin(WHITE));
    for (let d = 8; d < EDGE; d += 44) box(d, d + 14, top - 40, top - 22, tint(wall, 0.8));
    sash(colAxes(95)[1] - 38, 20, 76, base - 52, 91);
    door(base, { h: 205 });
    each(95, (i, d) => { if (i) sash(d, base + 0.26 * S, 95, 0.54 * S, i, { lintel: brickWall ? tint(wall, 0.8) : null, sill: LIME, muntin: 2 }); });
    for (let k = 1; k < n; k++) each(95, (i, d) => sash(d, floorZ(k) + 0.26 * S, 95, 0.52 * S, k * 3 + i, { lintel: tint(wall, 0.8), sill: LIME, muntin: 2 }));
    front();
    flight(-P - 6, base, { c: "#b5b1a7", rail: IRON, tread: 25 });
    porch(P, base, base + 235, { pier: tint(wall, 0.92), halfPier: true, post: PAINT, roof: R, pitch: 62 });
  } else if (kind === "framehouse") {
    // The detached house: clapboards (or brick), a gable roof of asphalt shingles, a front porch on posts.
    const R = SHINGLE[seed % 3], ridge = 260, P = Math.tan((34 * Math.PI) / 180), zz = (d) => top + 10 + (d < ridge ? d : 2 * ridge - d) * P, eave = 45;
    const bw = brickWall || det.brick;
    box(EDGE - 74, EDGE - 26, top, zz(ridge) + 60, "#9c5a44", thin("#9c5a44"));
    box(EDGE - 80, EDGE - 20, zz(ridge) + 50, zz(ridge) + 62, "#7d4636");
    poly([[0, top], [ridge, zz(ridge) - 12], [EDGE, zz(EDGE) - 12], [EDGE, top]], bw && rnd(4) % 2 ? "#e9e6dc" : wall, outline);
    if (!(bw && rnd(4) % 2 === 0)) for (let z = top + 14; z < zz(ridge) - 20; z += 14) { const d0 = (z - top) / P, d1 = Math.min(EDGE, 2 * ridge - d0); if (d1 > d0) box(d0 + 6, d1, z - 0.8, z + 0.8, tint(bw ? "#e9e6dc" : wall, 0.86)); }
    sash(ridge - 35, top + 34, 70, 92, 77, { trim: WHITE, muntin: 2 });
    wallBase(wall, bw ? { brick: true } : { boards: true });
    box(-6, EDGE, 0, base - 8, "#a59c8c"); for (let d = 30; d < EDGE; d += 60) box(d - 1, d + 1, 0, base - 8, "#8f8676");
    if (!bw) { box(0, 18, base, top, WHITE); box(-4, EDGE, base - 10, base, WHITE, thin(WHITE)); }
    const slab = (a, b) => { poly([[a, zz(a)], [b, zz(b)], [b, zz(b) + 26], [a, zz(a) + 26]], R[0]); poly([[a, zz(a) - 14], [b, zz(b) - 14], [b, zz(b)], [a, zz(a)]], WHITE); };
    slab(-eave, ridge); slab(ridge, EDGE);
    box(-eave - 8, -eave + 6, zz(-eave) - 10, zz(-eave) + 8, WHITE, thin(WHITE)); // the gutter
    door(base, { h: 205 });
    const shut = rnd(9) % 2 ? ["#39463f", "#2f3b4a", "#5a2f2a"][seed % 3] : null;
    const win = (d, z, k) => {
      sash(d, z, 88, 0.5 * S, k, bw ? { lintel: tint(wall, 0.82), sill: LIME, muntin: 2 } : { trim: WHITE, muntin: 2 });
      if (shut) for (const a of [d - 46, d + 90 + 14]) if (a > 18) { box(a, a + 30, z - 4, z + 0.5 * S + 4, shut, thin(shut)); for (let q = z + 10; q < z + 0.5 * S; q += 12) box(a + 4, a + 26, q, q + 2, tint(shut, 1.25)); }
    };
    each(88, (i, d) => { if (i) win(d, base + 0.28 * S, i); });
    for (let k = 1; k < n; k++) each(88, (i, d) => win(d, floorZ(k) + 0.26 * S, k * 3 + i));
    front();
    if (!det.stoop) {
      flight(-168, base, { c: "#b5b1a7", rail: tint(PAINT, 0.88), tread: 25 });
      porch(160, base, base + 225, { skirt: bw ? "#a59c8c" : "#e4e1d8", lattice: !bw, post: PAINT, roof: R, pitch: 72 });
    } else {
      flight(-70, base, { c: "#b5b1a7", rail: IRON, tread: 27 });
      box(-74, 0, 0, base, "#a59c8c", thin("#a59c8c"));
      poly([[-84, base + 236], [0, base + 262], [0, base + 276], [-90, base + 248]], R[0], thin(R[0])); // a hood over the door
      poly([[-60, base + 238], [0, base + 180], [0, base + 238]], WHITE, thin(WHITE));
    }
  } else if (kind === "brickblock") {
    // The brick apartment house: before 1946 a limestone base and a cornice (a canvas canopy to the curb from 6 floors),
    // else plain, with a white door surround: garden apartments and the like.
    const pre = !!y && y < 1946, high = n >= 5, W = high ? 105 : 115;
    wallBase(wall, { brick: true });
    if (pre && high) { box(0, EDGE, 0, G - 14, LIME); for (let z = 60; z < G - 20; z += 46) box(0, EDGE, z - 1.5, z + 1.5, tint(LIME, 0.86)); box(-14, EDGE, G - 16, G, tint(LIME, 1.05), thin(LIME)); }
    else { box(-6, EDGE, 0, base - 8, tint(wall, 0.8)); if (high) box(-6, EDGE, G - 10, G, LIME, thin(LIME)); }
    const dz = pre && high ? 14 : base;
    if (dz > 20) { box(6, 134, 0, dz / 2, "#b5b1a7", thin("#b5b1a7")); box(12, 128, dz / 2, dz, "#bfbbb1", thin("#bfbbb1")); }
    box(2, 128, dz, dz + 262, WHITE, thin(WHITE)); // the door surround, pilasters and entablature
    for (const d of [4, 112]) box(d, d + 14, dz, dz + 232, "#e6e3da", thin(WHITE));
    box(-4, 134, dz + 236, dz + 262, WHITE, thin(WHITE));
    if (!high) poly([[-8, dz + 262], [138, dz + 262], [65, dz + 300]], WHITE, thin(WHITE));
    box(22, 108, dz, dz + 218, "#3f4f46"); box(30, 63, dz + 70, dz + 206, GLASS); box(67, 100, dz + 70, dz + 206, GLASS);
    const opt = { lintel: pre || high ? LIME : tint(wall, 0.82), sill: LIME, muntin: 2, ac: true };
    each(W, (i, d) => { if (i) sash(d, base + 0.3 * S, W, 0.5 * S, i, { ...opt, twin: !high }); });
    for (let k = 1; k < n; k++) each(W, (i, d) => sash(d, floorZ(k) + 0.28 * S, W, 0.52 * S, k * 3 + i, { ...opt, twin: !high }));
    if (n >= 7) box(-6, EDGE, floorZ(n - 1) - 12, floorZ(n - 1), LIME, thin(LIME)); // the top floor's band
    front();
    if (pre) cornice(top, 56, 46, high ? "#c9bfa6" : "#e6e1d3");
    else box(0, EDGE, top - 34, top - 24, tint(wall, 0.82));
    parapet(pre ? 22 : 30, tint(wall, 0.94), LIME);
    if (pre && n >= 6) { // the canvas canopy to the curb, on its brass poles
      const c = ["#2f4f3f", "#5a2a30", "#2f3f5a"][seed % 3];
      box(-236, -230, 0, 232, "#b59a5a"); box(-120, -115, 0, 232, "#b59a5a");
      poly([[-244, 232], [0, 232], [0, 290], [-16, 296], [-228, 296], [-244, 284]], c, thin(c));
      for (let d = -240; d < 0; d += 16) dot(d + 8, 232, 8, c);
    } else if (high) { box(-120, 0, dz + 268, dz + 284, "#8f9190", thin("#8f9190")); poly([[-112, dz + 284], [-108, dz + 284], [0, dz + 350], [0, dz + 344]], IRON); }
  } else if (kind === "slab") {
    // The apartment slab of 1950–85: brick or concrete, floor slabs showing as bands, wide sliding windows, balconies
    // (det.balconies false: none known), a glazed lobby under a flat canopy, the machine room on the roof.
    const FR = "#8e9397", SLAB = "#cfcac0", balc = det.balconies !== false;
    box(EDGE - 250, EDGE - 60, top, top + 260, tint(wall, 0.92), thin(wall));
    box(EDGE - 256, EDGE - 54, top + 250, top + 262, tint(wall, 0.7));
    for (let d = EDGE - 220; d < EDGE - 100; d += 14) box(d, d + 7, top + 130, top + 210, "#8f979d");
    wallBase(wall, { brick: true });
    box(0, EDGE, 0, G - 24, "#5d6266"); // the lobby, set back behind the columns
    for (let d = 14; d < EDGE; d += 110) { box(d, d + 96, 8, G - 40, GLASS); poly([[d + 60, G - 40], [d + 96, G - 40], [d + 96, G * 0.4]], GLINT); box(d + 46, d + 50, 8, G - 40, FR); }
    for (const d of [120, 340]) box(d, d + 34, 0, G - 24, SLAB, thin(SLAB));
    box(-4, EDGE, G - 24, G - 4, SLAB, thin(SLAB));
    const slide = (d, z, w, h, k) => {
      const lit = rnd(k) === 5;
      box(d - 5, d + w + 5, z - 5, z + h + 5, FR);
      box(d, d + w, z, z + h, lit ? LIT : GLASS);
      poly([[d + w * 0.6, z + h], [d + w, z + h], [d + w, z + h * 0.5]], lit ? "#f8e7b5" : GLINT);
      box(d + w * 0.5 - 2, d + w * 0.5 + 2, z, z + h, FR);
      if (rnd(k) === 7 || rnd(k) === 2) box(d, d + w * 0.5, z, z + h, "#d8d2c2", { "fill-opacity": 0.7 });
      box(d - 8, d + w + 8, z - 12, z - 5, SLAB);
      box(d + w * 0.22, d + w * 0.78, z - 46, z - 20, "#8f9497", thin("#8f9497")); // the through-wall air unit's grille
    };
    for (let k = 1; k < n; k++) {
      const z = floorZ(k);
      box(-2, EDGE, z - 8, z + 4, SLAB);
      if (balc) { box(20, 110, z + 4, z + 0.82 * S, FR); box(26, 63, z + 10, z + 0.82 * S - 6, GLASS); box(67, 104, z + 10, z + 0.82 * S - 6, GLASS); }
      else slide(20, z + 0.34 * S, 100, 0.48 * S, k * 5);
      for (const [i, d] of [165, 345].entries()) slide(d, z + 0.34 * S, 130, 0.48 * S, k * 5 + i + 1);
    }
    front();
    if (balc) for (let k = 1; k < n; k++) { const z = floorZ(k); box(-140, 0, z - 10, z + 6, SLAB, thin(SLAB)); rail(-136, -2, z + 6, 100, "#6f767a", 10); if (rnd(k * 3) === 4) { box(-100, -72, z + 6, z + 40, "#8f7a5a"); dot(-86, z + 56, 18, "#6fae4f"); } }
    box(-160, 150, G - 60, G - 44, "#d9d5cb", thin("#d9d5cb")); // the canopy over the door
    box(-150, -142, 0, G - 60, "#8e9397");
    parapet(26, SLAB, tint(SLAB, 0.8));
  } else if (kind === "podium") {
    // The block of flats over shops of 2000–25 (five-over-one): a glazed ground floor in brick or concrete, above it flat
    // panels in two or three colours, shallow bays, narrow metal balconies, a thin projecting roof edge.
    const A = wall, B = ["#a5573c", "#4d5a63", "#c79a4a", "#6f7a5e"][seed % 4], W2 = "#ecebe6", FR = "#3c3f43", BR = "#7d5647";
    wallBase(W2);
    box(0, EDGE, G, top, A);
    box(215, EDGE, G, top, B);
    for (let z = G + S / 2; z < top; z += S / 2) box(0, EDGE, z - 1, z + 1, "#00000022");
    for (const d of [72, 143, 215, 300]) box(d - 1, d + 1, G, top, "#00000022");
    box(0, EDGE, 0, G - 16, BR); bricks(0, EDGE, 0, G - 16, BR);
    for (let d = 24; d < EDGE; d += 190) { const h = G - 110; box(d, d + 160, 0, h + 8, FR); box(d + 8, d + 152, 24, h - 64, GLASS); poly([[d + 90, h - 64], [d + 152, h - 64], [d + 152, h * 0.4]], GLINT); box(d + 8, d + 152, h - 54, h, GLASS); box(d + 78, d + 82, 24, h, FR); }
    box(-4, EDGE, G - 16, G + 6, FR);
    for (let d = 40; d < EDGE; d += 190) for (let i = 0; i < 6; i++) box(d + i * 18, d + i * 18 + 11, G - 72, G - 48, WHITE); // the shops' letters
    const win = (d, z, w, h, k) => { const lit = rnd(k) === 5; box(d - 4, d + w + 4, z - 4, z + h + 4, FR); box(d, d + w, z, z + h, lit ? LIT : GLASS); poly([[d + w * 0.5, z + h], [d + w, z + h], [d + w, z + h * 0.55]], lit ? "#f8e7b5" : GLINT); box(d + w * 0.62, d + w * 0.62 + 3, z, z + h, FR); box(d, d + w * 0.62, z + h * 0.28, z + h * 0.28 + 3, FR); };
    for (let k = 1; k < n; k++) { const z = floorZ(k); win(24, z + 20, 92, 0.74 * S, k * 3); win(232, z + 0.28 * S, 120, 0.52 * S, k * 3 + 1); win(388, z + 0.28 * S, 60, 0.52 * S, k * 3 + 2); box(22, 118, z + 20, z + 108, "#3c3f43", { "fill-opacity": 0.0 }); }
    front();
    const D = 62; // the shallow bay over the street, its floors glazed at the side, and balconies beside it
    box(-D, 0, G + 40, top - 20, W2, outline);
    for (let k = 1; k < n; k++) { const z = floorZ(k); box(-D + 12, -12, z + 0.26 * S + (k === 1 ? 20 : 0), z + 0.78 * S, FR); box(-D + 16, -16, z + 0.26 * S + 4 + (k === 1 ? 20 : 0), z + 0.78 * S - 4, GLASS); if (k > 1) box(-D, 0, z - 2, z, tint(W2, 0.85)); }
    for (let k = 1; k < n; k++) if (k % 2 === seed % 2) { const z = floorZ(k); box(-D - 76, -D, z + 34, z + 44, "#cfcfcb", thin("#cfcfcb")); rail(-D - 74, -D, z + 44, 100, FR, 10); }
    parapet(30, W2, FR);
    box(-74, EDGE, top + 34, top + 46, FR);
    box(-120, 0, G - 100, G - 90, FR); poly([[-112, G - 90], [-108, G - 90], [0, G - 30], [0, G - 36]], FR); // a metal canopy over the shops
  } else if (kind === "glasstower") {
    // The glass tower or condominium after 1990: a curtain wall of glass with mullions and spandrels, glass balconies, a
    // tall lobby with a thin canopy, louvred machine floors on top.
    const GL = wall, SP = tint(wall, 0.72), FR = "#e6eaec";
    box(60, EDGE, top, top + 270, "#a9b2b7", thin("#a9b2b7"));
    for (let z = top + 16; z < top + 260; z += 14) box(60, EDGE, z, z + 5, "#8d979d");
    wallBase(GL);
    for (let d = 0; d < EDGE; d += 75) poly([[d, G], [d + 75, G], [d + 75, top], [d, top]], Math.floor(d / 75 + seed) % 3 ? GL : tint(GL, 1.07));
    for (let k = 1; k < n; k++) {
      const z = floorZ(k);
      for (let d = 0, i = 0; d < EDGE; d += 75, i++) { const l = rnd(k * 7 + i); if (l === 5) box(d, d + 75, z + 0.25 * S, z + S, "#e9dcb0"); else if (l === 2) box(d, d + 75, z + 0.5 * S, z + S, "#c9d3d6"); }
      box(0, EDGE, z - 12, z + 0.2 * S, SP);
      box(0, EDGE, z - 14, z - 8, FR);
    }
    for (let d = 75; d < EDGE; d += 75) box(d - 2, d + 2, G, top, FR);
    for (let z = G + 200; z < top; z += 900) poly([[EDGE - 150, Math.min(top, z + 500)], [EDGE - 60, Math.min(top, z + 500)], [EDGE - 230, z], [EDGE - 320, z]], "#ffffff", { "fill-opacity": 0.1 });
    box(0, EDGE, 0, G - 14, "#3f464b"); // the lobby
    for (let d = 10; d < EDGE; d += 130) { box(d, d + 118, 6, G - 40, "#55707f"); poly([[d + 60, G - 40], [d + 118, G - 40], [d + 118, G * 0.4]], "#7895a3"); }
    for (const d of [8, 138, 268, 398]) box(d, d + 4, 6, G - 40, FR);
    box(22, 120, 6, 230, FR); box(28, 70, 12, 224, "#2f3a42"); box(74, 114, 12, 224, "#2f3a42");
    box(-6, EDGE, G - 18, G, "#e2e3e0", thin("#e2e3e0"));
    front();
    for (let k = 1; k < n; k++) { const z = floorZ(k); if (det.office) break; box(-130, 0, z - 14, z, "#e6e6e2", thin("#e6e6e2")); box(-126, -3, z, z + 100, "#bcd3dc", { "fill-opacity": 0.55 }); box(-126, -3, z + 96, z + 101, "#8e9aa0"); }
    box(-190, 0, G - 110, G - 98, "#3c3f43"); poly([[-180, G - 98], [-176, G - 98], [0, G - 40], [0, G - 46]], "#8e9397");
    box(-10, EDGE, top, top + 18, "#e2e3e0", thin("#e2e3e0"));
  } else if (kind === "mainstreet") {
    // The main-street building: a shop front with its sign board and a canvas awning, flats above with tall windows under
    // stone hoods, a bracketed cornice.
    const SC = ["#2f5f55", "#7a4a2a", "#7a352e", "#4a4f54"][seed % 4], zs = Math.min(290, G - 90);
    wallBase(wall, { brick: brickWall });
    shop(SC, zs);
    sign(zs + 12, Math.max(34, G - zs - 30), tint(SC, 0.85));
    box(-16, EDGE, G - 18, G - 4, tint(SC, 1.2), thin(SC));
    for (let k = 1; k < n; k++) each(85, (i, d) => sash(d, floorZ(k) + 0.18 * S, 85, 0.58 * S, k * 3 + i, { lintel: LIME, sill: LIME, arch: true, ac: true }));
    front();
    const CN = brickWall ? ["#6b5a48", "#4f5f55", "#d8ccb0"][seed % 3] : "#8a8577";
    cornice(top, 78, 48, CN, { panel: true });
    box(-4, EDGE, top, top + 30, tint(wall, 0.9), thin(wall));
    box(-8, EDGE, top + 30, top + 38, LIME);
    awning(zs + 8, 150, 62, ["#a8433a", "#3f6f5a", "#3c5f8f", "#c79a4a"][(seed >> 1) % 4]);
    box(-62, -4, G + 70, G + 74, IRON); box(-58, -14, G + 6, G + 70, tint(SC, 1.15), thin(SC)); box(-48, -24, G + 30, G + 46, LETTERS[0]); // the blade sign
  } else if (kind === "stripmall") {
    // The one-storey commercial box: strip mall, taxpayer block: shops behind a covered walk, a sign band, a flat roof.
    const SC = ["#b5483c", "#2f6f8f", "#3f7a4a", "#c98a2f"][seed % 4], zs = Math.min(270, top * 0.55), zb = Math.min(top - 60, zs + 130);
    rtu(EDGE - 150, top + 10);
    wallBase(wall, { brick: brickWall });
    box(-4, EDGE, 0, 40, tint(wall, 0.8));
    for (let d = 16; d < EDGE; d += 128) { box(d - 6, d + 112, 0, zs + 6, METAL); box(d, d + 106, d < 40 ? 8 : 44, zs - 44, GLASS); poly([[d + 60, zs - 44], [d + 106, zs - 44], [d + 106, zs * 0.5]], GLINT); box(d, d + 106, zs - 38, zs, GLASS); }
    box(18, 22, 100, 150, METAL);
    sign(zs + 22, zb - zs - 30, SC);
    front();
    // the covered walk: a flat canopy on posts
    box(-190, 0, zs + 8, zs + 46, tint(wall, 1.05), thin(wall));
    box(-194, 0, zs + 46, zs + 56, tint(SC, 0.9));
    box(-178, -162, 0, zs + 8, "#d9d5cb", thin("#d9d5cb"));
    box(-184, -156, 0, 34, tint(wall, 0.8));
    parapet(22, tint(wall, 0.95), METAL);
  } else if (kind === "brownstone") {
    // New York's brownstone, 1850–1900: a high stone stoop to the parlour floor over the garden floor, tall windows
    // under heavy hoods, smooth brown stone, a deep bracketed cornice of sheet metal.
    const ST = wall, HD = tint(wall, 1.28), CN = ["#4a3a33", "#33302d", "#5f4a3d"][seed % 3];
    chimney(EDGE - 60, top, top + 46);
    wallBase(wall);
    for (let z = 34; z < base - 14; z += 34) box(0, EDGE, z - 1.5, z + 1.5, tint(ST, 0.85)); // the rusticated garden floor
    for (let d = 40; d < EDGE; d += 80) box(d - 1, d + 1, 0, base - 14, tint(ST, 0.88));
    box(-10, EDGE, base - 14, base, lite, thin(ST));
    sash(colAxes(90)[1] - 40, 18, 80, base - 52, 90, { sill: lite });
    for (let q = colAxes(90)[1] - 38; q < colAxes(90)[1] + 42; q += 12) box(q, q + 2, 18, base - 34, IRON); // the window guard
    door(base, { h: Math.min(240, G - base - 90), surround: HD, hood: HD, c: "#4a2f20" });
    each(90, (i, d) => { if (i) sash(d, base + 0.14 * S, 90, 0.64 * S, i, { trim: HD, hood: HD, ped: true, sill: HD, fr: "#4a372b" }); });
    for (let k = 1; k < n; k++) each(90, (i, d) => sash(d, floorZ(k) + 0.18 * S, 90, (0.6 - 0.04 * k) * S, k * 3 + i, { trim: HD, hood: HD, sill: HD, fr: "#4a372b" }));
    front();
    cornice(top, 82, 66, CN, { panel: true });
    // the stoop: its stone cheek wall with the balustrade, the newel at the foot
    const steps = Math.round(base / 18), tr = 28, end = -steps * tr - 20;
    for (let i = 0; i < steps; i++) box(-20 - (i + 1) * tr, -20 - i * tr, 0, base - (i + 1) * (base / steps), tint(ST, 1.12), thin(ST));
    box(-20, 0, 0, base, tint(ST, 1.12), thin(ST));
    poly([[0, base + 66], [0, base + 82], [-20, base + 82], [end, 82], [end, 66], [-20, base + 66]], lite, thin(ST));
    poly([[0, base - 8], [0, base + 8], [-20, base + 8], [end, 8], [end, 0], [-20, base - 8]], lite, thin(ST));
    for (let d = -4, i = 0; d > end; d -= 16, i++) { const zc = d > -20 ? base : base + ((d + 20) / (steps * tr)) * base; box(d - 4, d + 4, zc + 6, zc + 68, lite, thin(ST)); }
    box(end - 24, end + 6, 0, 108, lite, thin(ST)); box(end - 29, end + 11, 108, 118, lite, thin(ST)); dot(end - 9, 126, 11, lite);
  } else if (kind === "tenement") {
    // The tenement of 1870–1915: five or six floors of brick over a shop, the iron fire escape on the street, a big
    // sheet-metal cornice.
    const SC = ["#3f5f4c", "#6a352e", "#8a5a34"][seed % 3], zs = Math.min(260, G - 80), CN = ["#8a8f7a", "#c9bfa6", "#4f5f55"][seed % 3];
    wallBase(wall, { brick: true });
    shop(SC, zs);
    sign(zs + 12, Math.max(30, G - zs - 34), tint(SC, 0.85));
    box(-10, EDGE, G - 18, G - 4, LIME, thin(LIME));
    for (let k = 1; k < n; k++) each(85, (i, d) => sash(d, floorZ(k) + 0.22 * S, 85, 0.54 * S, k * 3 + i, { lintel: LIME, sill: LIME, arch: k === n - 1, ac: true, hood: k === 1 ? LIME : null }));
    box(0, EDGE, floorZ(n - 1) - 12, floorZ(n - 1) - 2, LIME);
    front();
    cornice(top, 80, 72, CN, { panel: true });
    // the fire escape, seen from the side: a platform a floor, its railing, the ladders between
    const FE = "#2b2f31", D = 96;
    for (let k = 1; k < n; k++) {
      const z = floorZ(k) + 8;
      box(-D, 0, z, z + 7, FE);
      for (let d = -D + 6; d < 0; d += 12) box(d, d + 6, z + 1, z + 4, "#7b7f80");
      rail(-D, -2, z + 7, 88, FE, 12);
      poly([[-D + 14, z], [-D + 20, z], [0, z - 60], [0, z - 68]], FE); // its bracket
      if (k < n - 1) { // the stair up to the next
        const a = k % 2 ? [-D + 22, -22] : [-22, -D + 22];
        poly([[a[0] - 3, z + 7], [a[0] + 4, z + 7], [a[1] + 4, z + S], [a[1] - 3, z + S]], FE);
        for (let t = 0.08; t < 1; t += 0.08) { const d = a[0] + (a[1] - a[0]) * t; box(d - 9, d + 9, z + 7 + (S - 7) * t, z + 11 + (S - 7) * t, FE); }
      }
    }
    for (const d of [-D + 26, -D + 46]) box(d, d + 4, G - 130, floorZ(1) + 8, FE); // the drop ladder
    for (let z = G - 120; z < floorZ(1); z += 26) box(-D + 26, -D + 50, z, z + 3, FE);
    box(-4, EDGE, top, top + 24, tint(wall, 0.9), thin(wall));
  } else if (kind === "tripledecker") {
    // Boston's triple-decker, 1880–1930: three floors of wood, the porches stacked one over another on the street front,
    // a flat roof with a wide bracketed eave.
    const P = 175, TR = WHITE, PT = PAINT;
    wallBase(wall, { boards: true });
    box(-6, EDGE, 0, base - 8, "#8d8a84"); for (let z = 26; z < base - 8; z += 26) box(0, EDGE, z - 1, z + 1, "#767370");
    box(0, 18, base, top, TR);
    box(-4, EDGE, base - 10, base, TR, thin(TR));
    for (let k = 1; k < n; k++) box(0, EDGE, floorZ(k) - 8, floorZ(k) + 4, TR);
    door(base, { h: 205 });
    each(90, (i, d) => { if (i) sash(d, base + 0.27 * S, 90, 0.52 * S, i, { trim: TR }); });
    for (let k = 1; k < n; k++) each(90, (i, d) => sash(d, floorZ(k) + 0.27 * S, 90, 0.52 * S, k * 3 + i, { trim: TR }));
    front();
    cornice(top, 48, 40, TR);
    flight(-P - 6, base, { c: "#b5b1a7", rail: tint(PT, 0.88), tread: 25 });
    for (let k = 0; k < n; k++) {
      const z = floorZ(k), zr = k === n - 1 ? top - 40 : floorZ(k + 1) - 22;
      if (k === 0) { box(-P, 0, 0, z - 14, tint(wall, 0.92), thin(wall)); for (let d = -P + 12; d < 0; d += 12) box(d - 1, d + 1, 0, z - 14, tint(wall, 0.75)); }
      box(-P - 8, 0, z - 22, z, PT, thin(PT));
      for (const d of [-P + 4, -18]) { box(d, d + 15, z, zr, PT, thin(PT)); box(d - 4, d + 19, zr - 12, zr, PT); }
      rail(-P + 19, -18, z, 88, tint(PT, 0.86), 13);
    }
    box(-P - 8, 0, top - 42, top - 14, PT, thin(PT));
    box(-P - 34, 0, top - 14, top + 6, tint(PT, 0.95), thin(PT));
    for (let d = -P - 10; d < -10; d += 44) poly([[d, top - 14], [d + 9, top - 14], [d + 9, top - 36], [d + 4, top - 36]], tint(PT, 0.85), thin(PT));
    box(-30, EDGE, top, top + 12, "#6d6a66");
  } else if (kind === "baygable") {
    // Toronto's bay-and-gable, 1875–1900: red brick with buff bands, a two-storey bay under a steep gable with carved
    // bargeboards; its roof runs back from the street.
    // The gable is turned towards us, as the North Sea's (Bára 23. 11. 2026), over the bay's half of the house.
    const R = SHINGLE[2], rise = 290, zr = top + 190, BUFF = "#d8c08a", D = 85, hb = Math.min(n, 2), gc = 128, gw = 152, BB = "#f0e6d0";
    chimney(EDGE - 60, zr - 60, zr + 70);
    poly([[110, top], [110, zr], [EDGE, zr], [EDGE, top]], R[0]);
    for (let z = top + 22; z < zr - 8; z += 30) box(110, EDGE, z, z + 3, R[1], { "fill-opacity": 0.6 });
    box(110, EDGE, zr - 8, zr + 6, R[1]);
    poly([[gc - gw + 6, top], [gc, top + rise], [gc + gw - 6, top]], wall);
    for (let z = top + 30; z < top + rise - 20; z += 30) { const hw = (gw - 6) * (1 - (z - top) / rise); box(gc - hw, gc + hw, z - 1, z + 1, tint(wall, 0.87)); }
    const gableSide = () => {
      sash(gc - 32, top + 18, 64, 108, 70, { arch: true, lintel: BUFF, sill: BUFF });
      for (const sg of [-1, 1]) { // the carved bargeboards
        poly([[gc + sg * (gw + 14), top - 26], [gc, top + rise + 18], [gc, top + rise - 22], [gc + sg * (gw - 12), top - 18]], BB, thin(BB));
        for (let t = 0.1; t < 0.86; t += 0.1) dot(gc + sg * (gw - 16) * (1 - t), top - 10 + t * rise - 14, 6.5, BB);
        poly([[gc + sg * (gw + 18), top - 24], [gc, top + rise + 30], [gc, top + rise + 18], [gc + sg * (gw + 14), top - 26]], R[1]);
      }
      box(gc - 60, gc + 60, top + rise - 108, top + rise - 98, BB, thin(BB)); box(gc - 4, gc + 4, top + rise - 108, top + rise + 80, "#8a6a4a");
    };
    wallBase(wall, { brick: true });
    box(-6, EDGE, 0, base - 10, "#a59c8c");
    for (let k = 1; k < n; k++) box(0, EDGE, floorZ(k) - 18, floorZ(k) - 4, BUFF);
    box(0, EDGE, top - 22, top - 6, shade);
    door(base, { h: 215 });
    each(82, (i, d) => { if (i) sash(d, base + 0.24 * S, 82, 0.56 * S, i, { arch: true, lintel: BUFF, sill: BUFF }); });
    for (let k = 1; k < n; k++) each(82, (i, d) => sash(d, floorZ(k) + 0.22 * S, 82, 0.54 * S, k * 3 + i, { arch: true, lintel: BUFF, sill: BUFF }));
    front();
    const zb = floorZ(hb - 1) + S - 40, bw = tint(wall, 1.05); // the bay's top
    box(-D, 0, 0, zb, bw, outline); bricks(-D + 2, -2, 0, zb, bw);
    for (let k = 0; k < hb; k++) { sash(-D + 22, floorZ(k) + 0.24 * S, 42, 0.54 * S, k + 50, { lintel: BUFF, sill: BUFF }); box(-D - 4, 0, floorZ(k) - 14, floorZ(k), BUFF); }
    box(-D - 8, 0, zb - 10, zb + 4, WHITE, thin(WHITE));
    poly([[-D - 12, zb + 4], [0, zb + 4], [0, zb + 60]], R[0], thin(R[0]));
    gableSide();
    flight(-4, base, { c: "#b5b1a7", rail: IRON });
  } else if (kind === "victorian") {
    // San Francisco's wooden row house, 1870–1910: over a garage, an angled bay through the upper floors with its panels
    // and paired windows, painted trim, a bracketed cornice on a false front; plain (det.plain): the stucco house of the
    // 1920s–40s.
    const GD = ["#e9e4d8", "#b9b3a4", "#8f7a63"][seed % 3];
    const TR = det.plain ? tint(wall, 1.08) : "#f6f0e2", AC = ["#3f5f6f", "#7a3f3a", "#4f6a4a", "#5a4a6f"][seed % 4];
    wallBase(wall, det.plain ? {} : { boards: true });
    box(0, EDGE, 0, G - 14, det.plain ? tint(wall, 0.95) : tint(wall, 0.9));
    box(150, 350, 0, 216, TR, thin(TR)); box(160, 340, 0, 206, GD); // the garage door
    for (let i = 1; i < 4; i++) box(160, 340, i * 51, i * 51 + 3, tint(GD, 0.8));
    for (let d = 172; d < 330; d += 42) box(d, d + 30, 160, 194, GLASS);
    door(54, { h: 190, c: AC, surround: det.plain ? null : TR });
    for (let i = 0; i < 3; i++) box(6, 150 - i * 26, i * 18, (i + 1) * 18, "#b5b1a7", thin("#b5b1a7"));
    box(-14, EDGE, G - 16, G, TR, thin(TR));
    for (let k = 1; k < n; k++) {
      each(88, (i, d) => sash(d, floorZ(k) + 0.22 * S, 88, 0.54 * S, k * 3 + i, det.plain ? { trim: TR } : { trim: TR, hood: TR, ped: k === 1 }));
      if (!det.plain && k > 1) box(0, EDGE, floorZ(k) - 10, floorZ(k) + 2, TR);
    }
    front();
    if (n > 1) {
      const D = 92, z0 = G - 10, z1 = top - (det.plain ? 30 : 70);
      poly([[0, z0 - 44], [-D, z0], [0, z0]], tint(TR, 0.85), thin(TR));
      box(-D, 0, z0, z1, wall, outline);
      if (!det.plain) boards(-D, 0, z0, z1, wall);
      for (let k = 1; k < n; k++) {
        const z = floorZ(k);
        sash(-D + 20, z + 0.22 * S, 52, 0.54 * S, k + 60, { trim: TR });
        if (!det.plain) { box(-D + 8, -8, z + 0.02 * S, z + 0.13 * S, AC, thin(AC)); box(-D - 8, 0, z + 0.86 * S, z + 0.94 * S, TR, thin(TR)); for (const d of [-D, -14]) box(d, d + 12, z, z + 0.86 * S, TR); }
      }
      box(-D - 12, 0, z1 - 10, z1 + 6, TR, thin(TR));
    }
    if (det.plain) { box(-26, EDGE, top - 14, top, "#b5654a", thin("#b5654a")); for (let d = -20; d < EDGE; d += 22) dot(d, top - 14, 9, "#b5654a"); }
    else { cornice(top, 72, 60, TR, { panel: true }); box(-30, EDGE, top, top + 70, wall, thin(wall)); boards(-30, EDGE, top, top + 70, wall); box(-44, EDGE, top + 70, top + 86, TR, thin(TR)); }
  }
}
