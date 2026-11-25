// Draws the North American furniture (Bára 25. 11. 2026): node evaluation/north-america-art/furniture/draw.mjs
// Own drawings by dimensions and photos listed in ZDROJE.md; 1 px = 1 cm, the bottom edge = the sidewalk. Each picture is
// drawn for the left half of the street (the roadway on the right; a lamp's "left" picture has its arm to the left, as
// Prague's), the right one is its mirror. The pictograms are symmetric, so the mirror needs no text of its own.
import fs from "node:fs";
const PUB = new URL("../../../pilot/public/", import.meta.url);
const PROP = new URL("./navrhy/", import.meta.url);
const R = (x, y, w, h, f, rx) => `<rect x="${+x.toFixed(2)}" y="${+y.toFixed(2)}" width="${+w.toFixed(2)}" height="${+h.toFixed(2)}"${rx ? ` rx="${rx}"` : ""} fill="${f}"/>`;
const P = (d, f) => `<path d="${d}" fill="${f}"/>`;
const L = (d, s, w, cap = "butt") => `<path d="${d}" stroke="${s}" stroke-width="${w}" fill="none" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
const C = (x, y, r, f) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`;
const svg = (w, h, note, body) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">\n  <!-- ${note} 1 px = 1 cm. -->\n  ${body.flat(9).join("\n  ")}\n</svg>\n`;
const write = (f, s, base = PUB) => { const u = new URL(f, base); fs.mkdirSync(new URL("./", u), { recursive: true }); fs.writeFileSync(u, s); };
// Both sides: name-left, name-right (the mirror).
const pair = (name, w, h, note, body, base) => {
  write(`${name}-left.svg`, svg(w, h, note, body), base);
  write(`${name}-right.svg`, svg(w, h, note + " Mirror of the left one.", [`<g transform="matrix(-1 0 0 1 ${w} 0)">`, ...body, "</g>"]), base);
};
const GALV = ["#b4b9bb", "#8f9699", "#d0d4d5"], BLACK = ["#34393c", "#23272a", "#666e72"], GLASS = "#d7e1e0", WHITE = "#f4f4f0";
// A round or fluted tapered shaft about x: from y0 (half width a) to y1 (half width b), light at the left, shade right.
const shaft = (x, y0, y1, a, b, [m, s, l], flutes = 0) => [
  P(`M${x - a} ${y0} H${x + a} L${x + b} ${y1} H${x - b} Z`, m),
  P(`M${x + a * 0.3} ${y0} H${x + a} L${x + b} ${y1} H${x + b * 0.3} Z`, s),
  P(`M${x - a * 0.72} ${y0} H${x - a * 0.4} L${x - b * 0.4} ${y1} H${x - b * 0.72} Z`, l),
  ...(flutes ? [-0.1, 0.62].map((k) => L(`M${x + a * k} ${y0} L${x + b * k} ${y1}`, s === BLACK[1] ? "#191c1e" : "#7c8386", 1)) : []),
];
// A ring (collar) of a turned post.
const ring = (x, y, h, r, [m, s, l], rx = 1) => [R(x - r, y, 2 * r, h, m, rx), R(x + r * 0.3, y, r * 0.7, h, s, rx), R(x - r * 0.8, y, r * 0.5, Math.min(1.4, h / 2), l)];
// A bus from the front (own pictogram): w wide about (cx, cy).
const bus = (cx, cy, w, f, b) => { const k = w / 20, X = (v) => cx + v * k, Y = (v) => cy + v * k; return [
  R(X(-10), Y(-9.5), 20 * k, 17 * k, f, 2.6 * k), R(X(-7.8), Y(-4.6), 15.6 * k, 6 * k, b, 0.7 * k), R(X(-5.4), Y(-8), 10.8 * k, 1.9 * k, b, 0.6 * k),
  C(X(-6.6), Y(4.6), 1.35 * k, b), C(X(6.6), Y(4.6), 1.35 * k, b), R(X(-8), Y(7), 4 * k, 3 * k, f, 0.9 * k), R(X(4), Y(7), 4 * k, 3 * k, f, 0.9 * k),
  R(X(-12.2), Y(-5), 1.6 * k, 4.6 * k, f, 0.7 * k), R(X(10.6), Y(-5), 1.6 * k, 4.6 * k, f, 0.7 * k)]; };
// A streetcar from the front (own pictogram): a trolley pole's wire above, the rails below.
const tram = (cx, cy, w, f, b) => { const k = w / 20, X = (v) => cx + v * k, Y = (v) => cy + v * k; return [
  P(`M${X(-7.4)} ${Y(8)} L${X(-8)} ${Y(-2)} Q${X(-7.6)} ${Y(-6)} ${X(-4)} ${Y(-6)} H${X(4)} Q${X(7.6)} ${Y(-6)} ${X(8)} ${Y(-2)} L${X(7.4)} ${Y(8)} Z`, f), R(X(-5.6), Y(-3.4), 11.2 * k, 6 * k, b, k),
  L(`M${X(-3.4)} ${Y(-6)} L${X(0)} ${Y(-12)} L${X(3.4)} ${Y(-6)} M${X(-9)} ${Y(-12.4)} H${X(9)}`, f, 1.7 * k), L(`M${X(-6)} ${Y(8.6)} L${X(-9.4)} ${Y(13)} M${X(6)} ${Y(8.6)} L${X(9.4)} ${Y(13)}`, f, 1.9 * k)]; };

/* ---------- lamps ---------- */
// Cobra head, LED: the hood humped over the driver, flat glass; its slip-fitter at (x, y), 72 cm long, to the left.
const cobra = (x, y) => [
  P(`M${x + 4} ${y - 4} L${x - 14} ${y - 8} Q${x - 28} ${y - 14} ${x - 46} ${y - 10} Q${x - 64} ${y - 6} ${x - 68} ${y + 3} L${x - 68} ${y + 5} L${x - 16} ${y + 6} L${x + 4} ${y + 4} Z`, "#8b9194"),
  P(`M${x + 4} ${y - 4} L${x - 14} ${y - 8} Q${x - 28} ${y - 14} ${x - 46} ${y - 10} Q${x - 60} ${y - 7} ${x - 66} ${y - 1} Q${x - 44} ${y - 7} ${x - 16} ${y - 3} L${x + 4} ${y - 0.6} Z`, "#b4b9bb"),
  P(`M${x - 68} ${y + 4} L${x - 24} ${y + 5.6} L${x - 25} ${y + 8.4} Q${x - 50} ${y + 11} ${x - 66} ${y + 7} Z`, "#e6dca8"),
  R(x - 37, y - 18.5, 8, 6, "#55595b", 1.5)];
// The transformer base of an American pole: a cast box 56 cm (22 in) high.
const xbase = (x, c = GALV) => [
  P(`M${x - 15} 874 H${x + 15} L${x + 19} 922 H${x - 19} Z`, c[0]), P(`M${x + 5} 874 H${x + 15} L${x + 19} 922 H${x + 7} Z`, c[1]),
  R(x - 20, 922, 40, 8, c[1]), R(x - 20, 922, 27, 2, c[2]), P(`M${x - 9} 886 H${x + 2} L${x + 3} 910 H${x - 10} Z`, c[1]), P(`M${x - 8} 888 H${x + 1} L${x + 1.8} 908 H${x - 8.7} Z`, c[0]),
  R(x - 13, 870, 26, 4, c[2]), R(x + 4, 870, 9, 4, c[1])];
// Shared: a round tapered galvanised pole with a single upsweep (davit-like) arm, the cobra head at 8.7 m.
const cobraTop = [
  L("M348 178 C344 118 300 78 226 64 L208 62", GALV[0], 8), L("M350 180 C346 122 301 81.5 226 67 L208 65", GALV[1], 2.4),
  cobra(206, 62), R(340, 172, 16, 5, GALV[2], 1), R(340, 177, 16, 14, GALV[0]), R(351, 177, 5, 14, GALV[1])];
pair("northamerica/lamp", 370, 930, "North American street lamp: cobra head on a davit arm, tapered galvanised steel pole on a cast transformer base (22 in). Light at 8.7 m (28 ft 6 in pole, DDOT), the arm 1.8 m; pole about 1.3 times wider for legibility, the head its real size (0.72 m). Foot at x = 348.",
  [cobraTop, shaft(348, 188, 872, 6, 11, GALV), xbase(348)]);
// New York: the octagonal pole with the standard 8 ft arm and the flat LED cobra head (Street Design Manual 4.1.1).
pair("newyork/lamp", 370, 930, "New York standard street light: tapered octagonal galvanised pole, 8 ft arm rising 3 ft, LED cobra head, 22 in base; 30 ft overall (Street Design Manual 4.1.1, NYC DOT LP-038: shaft 25 ft, 7.7 in at the bottom, 4.2 in at the top). Foot at x = 348.",
  [L("M347 118 C334 84 300 62 258 53 L176 38", GALV[0], 6.5), L("M347 121 C334 87.2 300 65.2 258 56.2 L176 41", GALV[1], 2),
    L("M346 160 C340 140 330 104 318 80", GALV[1], 3), P("M180 31 L160 29 Q124 25 108 34 L106 40 L160 45 L180 45 Z", "#8b9194"), P("M180 31 L160 29 Q124 25 108 34 L108 37 L160 35 L180 36.5 Z", "#b4b9bb"), P("M108 40 L154 44.4 L154 47.6 L109 43.6 Z", "#e6dca8"), R(138, 23, 7, 5, "#55595b", 1.5),
    shaft(348, 106, 872, 5.5, 11, GALV), P("M342 106 L344 100 H352 L354 106 Z", GALV[1]), R(340.5, 114, 15, 10, GALV[0], 1), R(350, 114, 5.5, 10, GALV[1], 1), R(340.5, 157, 15, 8, GALV[0], 1), R(350, 157, 5.5, 8, GALV[1], 1),
    L("M350.2 124 L351.6 872 M345.6 124 L344.6 872", "#7c8386", 1.2), xbase(348)]);
// New York: Bishop's Crook, 26 ft 3 in, black.
const tear = (x, y, light = "#e9e2c4") => [ // a teardrop pendant hanging from (x, y): 68 cm long, 35 wide
  R(x - 3.5, y, 7, 9, BLACK[0]), P(`M${x - 6} ${y + 8} H${x + 6} L${x + 10} ${y + 14} H${x - 10} Z`, BLACK[2]), R(x - 10, y + 14, 20, 15, BLACK[0], 2), R(x + 3, y + 14, 7, 15, BLACK[1], 2), L(`M${x - 5} ${y + 16} V${y + 27} M${x} ${y + 16} V${y + 27}`, BLACK[2], 1.1), R(x - 12, y + 28, 24, 3, BLACK[2], 1),
  P(`M${x - 11} ${y + 31} H${x + 11} C${x + 14} ${y + 35} ${x + 13} ${y + 42} ${x + 16.5} ${y + 50} H${x - 16.5} C${x - 13} ${y + 42} ${x - 14} ${y + 35} ${x - 11} ${y + 31} Z`, BLACK[0]), P(`M${x + 4} ${y + 31} H${x + 11} C${x + 14} ${y + 35} ${x + 13} ${y + 42} ${x + 16.5} ${y + 50} H${x + 7} Z`, BLACK[1]), L(`M${x - 8} ${y + 33} Q${x - 10} ${y + 42} ${x - 12} ${y + 49} M${x - 2} ${y + 33} L${x - 4} ${y + 46}`, BLACK[2], 1.2), R(x - 17.5, y + 49, 35, 3.4, BLACK[0], 1.4),
  P(`M${x - 13} ${y + 52} H${x + 13} Q${x + 13} ${y + 60} ${x + 5} ${y + 66} Q${x} ${y + 69} ${x - 5} ${y + 66} Q${x - 13} ${y + 60} ${x - 13} ${y + 52} Z`, light), P(`M${x + 5} ${y + 52} H${x + 13} Q${x + 13} ${y + 60} ${x + 5} ${y + 66} Z`, "#d3cba8")];
const K = 45, KX = 348 - 2 * K; // the crook's radius and its free end
const crook = [
  // one large spiral springing from the shaft, curling inside the arch and touching it on both sides; two small leaves
  L("M346 250 C338 240 325 234 311 232 C286 228 270 210 273 188 C276 168 298 158 314 168 C328 177 327 198 311 201 C299 203 291 191 298 183 C302 179 308 181 308 186", BLACK[0], 4.6, "round"),
  L("M290 224 C282 222 276 228 279 234 M284 170 C276 168 272 160 268 160 M330 238 C332 228 340 222 345 222", BLACK[0], 3.6, "round"), C(308, 187, 4, BLACK[0]), C(279, 235, 3.4, BLACK[0]), C(327, 176, 3, BLACK[0]), L("M312 170 C320 168 330 168 342 176", BLACK[0], 3.4, "round"),
  L(`M348 262 V192 A${K} ${K} 0 0 0 ${KX} 192 V206`, BLACK[0], 9), L(`M351 262 V192 A${K + 3} ${K + 3} 0 0 0 303 144`, BLACK[1], 3), L(`M345 256 V192 A${K - 3} ${K - 3} 0 0 0 268 169`, BLACK[2], 1.4), R(340.5, 226, 15, 5, BLACK[0], 1), R(340.5, 196, 15, 4, BLACK[0], 1), R(KX - 7, 200, 14, 4, BLACK[0], 1), C(303, 140.5, 4, BLACK[0]), C(303, 135.5, 2.2, BLACK[0]), tear(KX, 204)];
const wrapBands = [655, 685, 715, 745].map((y) => { const r = 9 + ((y - 642) / 130) * 3 - 0.4; return P(`M${348 - r} ${y + 14} L${348 + r} ${y - 8} V${y - 4} L${348 - r} ${y + 18} Z`, "#50585b"); });
pair("newyork/lamp-bishop", 370, 930, "New York Bishop's Crook (historic districts): ductile iron post, aluminium arm, black, teardrop pendant; 26 ft 3 in (8.0 m) overall (Street Design Manual 4.2.2), the light hangs at 6.6 m, 0.9 m before the post. Foot at x = 348.",
  [crook, shaft(348, 290, 640, 5.5, 8, BLACK, 1), ring(348, 256, 6, 9, BLACK), P("M339 290 L342 262 H354 L357 290 Z", BLACK[0]), P("M351 262 H354 L357 290 H351 Z", BLACK[1]), ring(348, 286, 5, 11, BLACK), ring(348, 520, 5, 10.5, BLACK), ring(348, 636, 6, 13, BLACK),
    shaft(348, 642, 772, 9, 12, BLACK), wrapBands, ring(348, 770, 7, 16, BLACK), P("M335 777 H361 Q366 790 365 806 H331 Q330 790 335 777 Z", BLACK[0]), P("M353 777 H361 Q366 790 365 806 H354 Z", BLACK[1]), L("M338 780 Q335 792 335 804 M344 780 Q342 792 342 804", BLACK[2], 1.2),
    ring(348, 804, 6, 18, BLACK), P("M333 810 H363 L366 896 H330 Z", BLACK[0]), P("M352 810 H363 L366 896 H353 Z", BLACK[1]), R(336, 822, 13, 56, BLACK[2], 1), R(337.2, 823.4, 11.6, 54, BLACK[0], 1), R(327, 896, 42, 10, BLACK[0], 1), R(352, 896, 17, 10, BLACK[1], 1), R(326, 906, 44, 24, BLACK[0]), R(352, 906, 18, 24, BLACK[1]), R(326, 906, 26, 1.6, BLACK[2])]);

// Post-top lamps (anchored in the middle of a 140 cm wide picture, art.js LAMP_PICTURES).
const X = 70, CREAM = ["#f1ecd9", "#ded6ba", "#fbf9f0"];
const globe = (x, y) => [ // Washington globe, 43 cm wide, fullest above the middle, 58 high from its cup
  P(`M${x - 13} ${y} H${x + 13} C${x + 20} ${y - 10} ${x + 23.5} ${y - 22} ${x + 21.5} ${y - 36} C${x + 20} ${y - 46} ${x + 14} ${y - 53} ${x + 9} ${y - 58} H${x - 9} C${x - 14} ${y - 53} ${x - 20} ${y - 46} ${x - 21.5} ${y - 36} C${x - 23.5} ${y - 22} ${x - 20} ${y - 10} ${x - 13} ${y} Z`, CREAM[0]),
  P(`M${x + 13} ${y} C${x + 20} ${y - 10} ${x + 23.5} ${y - 22} ${x + 21.5} ${y - 36} C${x + 20} ${y - 46} ${x + 14} ${y - 53} ${x + 9} ${y - 58} C${x + 16} ${y - 42} ${x + 15} ${y - 18} ${x + 6} ${y} Z`, CREAM[1]),
  P(`M${x - 13} ${y - 48} Q${x - 19} ${y - 38} ${x - 16.5} ${y - 24} Q${x - 14.5} ${y - 38} ${x - 10} ${y - 49} Z`, CREAM[2])];
pair("washington/lamp", 140, 930, "Washington Globe (Washington Upright No. 16, DDOT Streetlight Policy and Design Guidelines 2013): 16 ft fluted post, black, on a 24 in base, one opal globe; 5.6 m overall, the light at 5.2 m. Centred (post-top).",
  [P("M60.5 385 L62 379 H78 L79.5 385 Z", BLACK[0]), R(60.5, 383, 14, 1.4, BLACK[2]), R(64.5, 373, 11, 7, BLACK[0], 1.5), P("M65 373 Q66 366 69 365 H71 Q74 366 75 373 Z", BLACK[0]), R(68.4, 357, 3.2, 9, BLACK[0], 1.4), C(70, 357.5, 2.4, BLACK[0]), globe(X, 441),
    ring(X, 439, 7, 17, BLACK), P("M56 446 H84 Q82 456 77 462 H63 Q58 456 56 446 Z", BLACK[0]), P("M75 446 H84 Q82 456 77 462 H73 Z", BLACK[1]), ring(X, 462, 5, 11.5, BLACK), ring(X, 480, 4, 10.5, BLACK), shaft(X, 467, 480, 7, 7.5, BLACK),
    shaft(X, 484, 832, 7.5, 10, BLACK, 1), L("M69 486 L68 830", BLACK[2], 1.1), ring(X, 830, 6, 14, BLACK), P("M58 836 H82 Q90 848 90 862 H50 Q50 848 58 836 Z", BLACK[0]), P("M74 836 H82 Q90 848 90 862 H76 Z", BLACK[1]), P("M56 845 Q53 852 53 859 H57 Q57 851 60 845 Z", BLACK[2]),
    ring(X, 860, 6, 24, BLACK), P("M48 866 H92 L98 904 H42 Z", BLACK[0]), P("M78 866 H92 L98 904 H80 Z", BLACK[1]), L("M60 867 L57 903", BLACK[2], 1.4), R(40, 902, 60, 8, BLACK[0], 1), R(79, 902, 21, 8, BLACK[1], 1), R(39.5, 910, 61, 20, BLACK[0]), R(79, 910, 21.5, 20, BLACK[1]), R(39.5, 910, 39, 1.6, BLACK[2])]);
pair("boston/lamp", 140, 930, "Boston Neighborhood Acorn (Boston Street Lighting Standards, October 2026: fixture L.1.1 35 5/8 in high, steel post 13 ft 4 in L.1.2.2, 12 flat flutes, 6.57 in shaft, 18 in wrap base 28 7/8 in high). Overall about 5.1 m, the light at 4.7 m. Centred (post-top).",
  [R(64.5, 415, 11, 8, "#7c8386", 2), R(63.5, 422, 13, 4, BLACK[0], 1), P("M63 426 H77 L76 433 H64 Z", BLACK[0]), R(62, 432, 16, 3, BLACK[2], 1), P("M55 449 C57 441 60 436 63 434.5 H77 C80 436 83 441 85 449 Z", BLACK[0]), P("M74 434.5 H77 C80 436 83 441 85 449 H77 Z", BLACK[1]), L("M65 436 Q61 441 59.5 448", BLACK[2], 1.3), R(53.5, 448, 33, 4, BLACK[0], 1.5), R(76, 448, 10.5, 4, BLACK[1], 1.5),
    P("M54.5 452 H85.5 C90.5 456 92.4 463 91 472 C89.4 483 84 491 80.5 498 H59.5 C56 491 50.6 483 49 472 C47.6 463 49.5 456 54.5 452 Z", CREAM[0]), P("M76 452 H85.5 C90.5 456 92.4 463 91 472 C89.4 483 84 491 80.5 498 H73 C79 486 82 466 76 452 Z", CREAM[1]), P("M55.5 455 C51.6 460 51.4 468 53.6 477 Q54.6 481 56.4 484 C55 474 55 464 59 455 Z", CREAM[2]), L("M70 452 V498 M62 452 C56.5 464 59 484 64.5 498 M78 452 C83.5 464 81 484 75.5 498", "#d8d0b4", 0.8),
    ring(X, 496, 6, 13, BLACK), R(62, 502, 16, 4, BLACK[0]), P("M57 506 H83 Q81 518 76 526 H64 Q59 518 57 506 Z", BLACK[0]), P("M74 506 H83 Q81 518 76 526 H72 Z", BLACK[1]), L("M60 508 Q62 518 66 525 M65 508 Q66 518 68 525 M70 508 V525 M75 508 Q75 518 73 525", BLACK[2], 1.2), ring(X, 525, 5, 10.5, BLACK), P("M62.5 530 H77.5 L76 538 H64 Z", BLACK[0]),
    shaft(X, 530, 858, 7.5, 8.4, BLACK, 1), L("M69.4 532 V856", BLACK[2], 1.1), ring(X, 856, 5, 12, BLACK), P("M60 861 H80 Q90 872 91 888 H49 Q50 872 60 861 Z", BLACK[0]), P("M74 861 H80 Q90 872 91 888 H77 Z", BLACK[1]), L("M59 863 Q53 874 52.5 886 M64 863 Q59 874 59 886 M69 863 Q67.5 874 67.5 886 M75 863 Q78 874 78 886 M80 864 Q86 874 86.5 886", BLACK[2], 1.3), ring(X, 886, 6, 23, BLACK), P("M49 892 H91 L92 924 Q92 930 88 930 H52 Q48 930 48 924 Z", BLACK[0]), P("M76 892 H91 L92 924 Q92 930 88 930 H77 Z", BLACK[1]), R(53, 896, 2.4, 26, BLACK[2], 1), R(48.2, 918, 43.6, 2.4, BLACK[1]), R(48.2, 917, 28, 1.2, BLACK[2])]);
// Path of Gold: the three tear-shaped globes on a trolley pole of Market Street.
const GREEN = ["#3a4a47", "#293634", "#647a74"], AMBER = ["#f0e3c0", "#dccb9c", "#faf4e0"];
// A tear-shaped lantern, 41 cm wide, 74 high over its cup: six glass panels between dark ribs, a small stepped cap.
const lantern = (x, y) => [P(`M${x - 11} ${y} H${x + 11} C${x + 18} ${y - 12} ${x + 22} ${y - 24} ${x + 20} ${y - 35} C${x + 18.6} ${y - 43} ${x + 15} ${y - 48} ${x + 11} ${y - 51} H${x - 11} C${x - 15} ${y - 48} ${x - 18.6} ${y - 43} ${x - 20} ${y - 35} C${x - 22} ${y - 24} ${x - 18} ${y - 12} ${x - 11} ${y} Z`, AMBER[0]),
  P(`M${x + 11} ${y} C${x + 18} ${y - 12} ${x + 22} ${y - 24} ${x + 20} ${y - 35} C${x + 18.6} ${y - 43} ${x + 15} ${y - 48} ${x + 11} ${y - 51} H${x + 6} C${x + 13} ${y - 36} ${x + 11} ${y - 14} ${x + 4} ${y} Z`, AMBER[1]), P(`M${x - 13} ${y - 45} C${x - 18} ${y - 36} ${x - 17} ${y - 20} ${x - 11} ${y - 7} C${x - 13} ${y - 20} ${x - 13.4} ${y - 34} ${x - 10} ${y - 45} Z`, AMBER[2]),
  L(`M${x - 11} ${y} C${x - 18} ${y - 12} ${x - 22} ${y - 24} ${x - 20} ${y - 35} C${x - 18.6} ${y - 43} ${x - 15} ${y - 48} ${x - 11} ${y - 51} M${x + 11} ${y} C${x + 18} ${y - 12} ${x + 22} ${y - 24} ${x + 20} ${y - 35} C${x + 18.6} ${y - 43} ${x + 15} ${y - 48} ${x + 11} ${y - 51} M${x - 4} ${y} C${x - 8} ${y - 14} ${x - 9} ${y - 36} ${x - 4} ${y - 51} M${x + 4} ${y} C${x + 8} ${y - 14} ${x + 9} ${y - 36} ${x + 4} ${y - 51}`, GREEN[0], 1.5),
  R(x - 13, y - 53, 26, 4, GREEN[0], 1.2), R(x + 4, y - 53, 9, 4, GREEN[1], 1.2), P(`M${x - 10} ${y - 53} L${x - 7} ${y - 59} H${x + 7} L${x + 10} ${y - 53} Z`, GREEN[0]), P(`M${x - 6} ${y - 59} Q${x - 4} ${y - 64} ${x - 2.4} ${y - 65} H${x + 2.4} Q${x + 4} ${y - 64} ${x + 6} ${y - 59} Z`, GREEN[0]), L(`M${x - 8} ${y - 54} L${x - 5.6} ${y - 58.4}`, GREEN[2], 1.2), R(x - 1.6, y - 74, 3.2, 10, GREEN[0], 1.5), C(x, y - 72, 2.4, GREEN[0]),
  R(x - 14, y - 1, 28, 5, GREEN[0], 1.5), R(x + 4, y - 1, 10, 5, GREEN[1], 1.5), P(`M${x - 12} ${y + 4} H${x + 12} Q${x + 10} ${y + 16} ${x + 6} ${y + 22} H${x - 6} Q${x - 10} ${y + 16} ${x - 12} ${y + 4} Z`, GREEN[0]), P(`M${x + 4} ${y + 4} H${x + 12} Q${x + 10} ${y + 16} ${x + 6} ${y + 22} H${x + 2} Z`, GREEN[1])];
// The heavy pendant under a side cup.
const pendant = (x, y) => [P(`M${x - 8} ${y} H${x + 8} Q${x + 8} ${y + 14} ${x + 4.6} ${y + 26} L${x + 2.6} ${y + 40} Q${x} ${y + 46} ${x - 2.6} ${y + 40} L${x - 4.6} ${y + 26} Q${x - 8} ${y + 14} ${x - 8} ${y} Z`, GREEN[0]), P(`M${x + 2} ${y} H${x + 8} Q${x + 8} ${y + 14} ${x + 4.6} ${y + 26} L${x + 2.6} ${y + 40} Z`, GREEN[1]), R(x - 9, y, 18, 4, GREEN[0], 1)];
pair("sanfrancisco/lamp", 140, 985, "San Francisco Path of Gold light standard (Market Street, city landmark 200): cast and wrought iron, three tear-shaped glass lanterns; 32 ft 3 in (9.83 m) overall (2018-002022COA), the light at 9.2 m. Centred (post-top).",
  [lantern(70, 76), P("M62 96 H78 L83 132 H57 Z", GREEN[0]), P("M72 96 H78 L83 132 H74 Z", GREEN[1]), L("M65.4 98 L62 128", GREEN[2], 1.5), ring(70, 92, 5, 12, GREEN), ring(70, 106, 5, 13, GREEN),
    P("M24 138 H42 C50 137 55 130 58 122 H82 C85 130 90 137 98 138 H116 V150 H104 C94 151 88 158 84 170 H56 C52 158 46 151 36 150 H24 Z", GREEN[0]), P("M74 122 H82 C85 130 90 137 98 138 H116 V150 H104 C94 151 88 158 84 170 H74 Z", GREEN[1]), L("M30 140 H43 C52 138 56 132 60 125 M46 151 C53 154 56 160 59 168", GREEN[2], 1.6),
    pendant(24, 146), pendant(116, 146), lantern(24, 124), lantern(116, 124), P("M57 168 H83 L79 206 H61 Z", GREEN[0]), P("M74 168 H83 L79 206 H73 Z", GREEN[1]), L("M62 172 L64.5 203 M68 172 L68.6 203", GREEN[2], 1.5), ring(70, 164, 7, 17, GREEN), ring(70, 204, 7, 13.5, GREEN),
    shaft(70, 211, 600, 8, 10, GREEN, 1), L("M69 212 L68.4 598", GREEN[2], 1.1), ring(70, 340, 7, 12.5, GREEN), ring(70, 590, 12, 15, GREEN), shaft(70, 602, 790, 11, 13, GREEN, 1), L("M67.6 606 L66.6 788 M72.6 606 L72.8 788", GREEN[2], 1.1), ring(70, 786, 6, 16, GREEN), P("M57 792 H83 Q88 800 88 812 H52 Q52 800 57 792 Z", GREEN[0]), P("M76 792 H83 Q88 800 88 812 H77 Z", GREEN[1]), ring(70, 810, 6, 20, GREEN),
    P("M52 816 H88 L92 884 H48 Z", GREEN[0]), P("M78 816 H88 L92 884 H80 Z", GREEN[1]), P("M55.6 824 H74 L75 874 H53 Z", GREEN[2]), P("M57.4 826.6 H72.4 L73.2 871 H55 Z", GREEN[0]), P("M65 832 L70 850 L65 867 L59.6 850 Z", GREEN[2]), ring(70, 882, 8, 25, GREEN), P("M47 890 H93 Q98 904 98 920 H42 Q42 904 47 890 Z", GREEN[0]), P("M80 890 H93 Q98 904 98 920 H82 Z", GREEN[1]), L("M54 892 Q50 904 50 918 M62 892 Q59 904 59 918 M71 892 V918", GREEN[2], 1.5), ring(70, 918, 8, 30, GREEN), R(40, 926, 60, 59, GREEN[0]), R(80, 926, 20, 59, GREEN[1]), R(46, 936, 30, 36, GREEN[2], 1), R(47.6, 937.6, 26.8, 32.8, GREEN[0], 1), R(38, 976, 64, 9, GREEN[1])]);

/* ---------- overhead-line poles ---------- */
const pole = (lamp) => [
  lamp ? ['<g transform="translate(0 0)">', L("M348 148 C344 106 310 92 250 84 L232 83", GALV[0], 8), L("M350 150 C346 109 310 95 250 87 L232 86", GALV[1], 2.4), cobra(230, 83), "</g>"] : "",
  // the bracket: a pipe held by two flat-bar hangers from the pole, the wire on its end
  L("M344 214 L120 356", "#8f9699", 3), L("M344 300 C300 312 270 330 250 357", "#8f9699", 5), R(42, 355, 300, 8, GALV[0]), R(42, 360, 300, 3, GALV[1]), R(38, 354, 5, 10, GALV[1], 2),
  L("M318 230.5 L306 238", "#6b4a36", 7), R(296, 352.5, 14, 13, "#6b4a36", 2), R(114, 352, 10, 14, GALV[1], 1),
  R(58, 363, 8, 16, "#6b4a36", 2), L("M62 379V417", "#55595b", 2.5), R(55.5, 415, 13, 6, "#55595b", 1), C(62, 424, 3.4, "#2f3234"),
  shaft(348, 62, 946, 9, 14.5, GALV), P("M339 62 Q339 54 348 53 Q357 54 357 62 Z", GALV[0]), P("M351 53.4 Q357 55 357 62 H350.7 Z", GALV[1]),
  R(335.5, 350, 25, 18, GALV[0], 2), R(351, 350, 9.5, 18, GALV[1], 2), R(337, 294, 22, 12, GALV[0], 2), R(351, 294, 8, 12, GALV[1], 2), R(246, 352, 10, 14, GALV[1], 1), R(337, 207, 22, 12, GALV[0], 2), R(351, 207, 8, 12, GALV[1], 2), lamp ? [R(338, 136, 21, 16, "#9da4a7", 2), R(351, 136, 8, 16, "#7c8386", 2)] : "",
  // the collar over the anchor base, the hand hole, the number plate
  P("M333 946 H363 L369 978 H327 Z", GALV[0]), P("M353 946 H363 L369 978 H355 Z", GALV[1]), R(326, 978, 44, 32, GALV[0]), R(355, 978, 15, 32, GALV[1]), R(324, 975, 46, 5, GALV[1], 1), R(324, 975, 30, 1.6, GALV[2]), R(340, 880, 9, 24, GALV[1], 2), R(341, 881, 7, 22, GALV[0], 2), R(339, 720, 12, 22, "#e9c53a", 1), R(341.5, 724, 7, 2.4, "#2f3234"), R(341.5, 729, 7, 2.4, "#2f3234"), R(341.5, 734, 7, 2.4, "#2f3234")];
for (const lamp of [false, true]) pair(`northamerica/sloup-trakce${lamp ? "-lampa" : ""}`, 370, 1010, `North American streetcar overhead pole${lamp ? " with a cobra-head lamp" : ""}: one tapered galvanised steel tube 9.5 m, a pipe bracket held by a tie and a knee, dark insulators, the contact wire at 5.9 m, 2.86 m from the pole (as the other sets' poles). Foot at x = 348.`, pole(lamp));

/* ---------- small pieces ---------- */
const bike = fs.readFileSync(new URL("praha/bike-rack.svg", PUB), "utf8").match(/<!-- kola:[\s\S]*?(?=\s*<!-- stojan:)/)[0].replace(/<!--[\s\S]*?-->/g, "");
write("northamerica/bike-rack.svg", svg(180, 120, "Inverted-U bike rack: bent 2 in steel tube, 36 in (91 cm) high, 30 in (76 cm) wide, flanges on the sidewalk; the bike of the Prague picture.",
  [bike, L("M52 118 V49 A20 20 0 0 1 72 29 H108 A20 20 0 0 1 128 49 V118", "#4a5053", 5.2), L("M50.6 118 V49 A21.4 21.4 0 0 1 72 27.6 H108", "#8b9296", 1.3), L("M130 118 V49 A22 22 0 0 0 118 29.6", "#2d3133", 1.4), R(46, 117.6, 12, 2.4, "#2d3133"), R(122, 117.6, 12, 2.4, "#2d3133")]));
write("northamerica/bollard.svg", svg(20, 100, "Pipe bollard: steel pipe 4.5 in (11.4 cm), 30 in (76 cm) above the sidewalk, domed for drainage (NYC DOT cutsheet 2021).",
  [P("M4.3 27.6 Q10 20.6 15.7 27.6 V100 H4.3 Z", "#9da4a7"), P("M11.8 24.4 Q14 25.4 15.7 27.6 V100 H11.8 Z", "#767d80"), R(5.6, 28, 1.9, 72, "#c9ced0"), R(4.3, 34, 11.4, 5, "#f2c230"), R(11.8, 34, 3.9, 5, "#c79a1d"), R(2.4, 97.4, 15.2, 2.6, "#767d80", 0.8), R(2.4, 97.4, 10, 0.9, "#c9ced0")]));
const slat = (x, y, a) => `<rect x="${x - 2.9}" y="${y - 1.9}" width="5.8" height="3.8" rx="0.8" fill="#6b7276" transform="rotate(${a} ${x} ${y})"/><rect x="${x - 2.9}" y="${y - 1.9}" width="5.8" height="1.2" rx="0.6" fill="#9aa1a4" transform="rotate(${a} ${x} ${y})"/>`;
const seat = [[17, 9, -108], [18.2, 16.6, -108], [20.6, 24, -110], [23.4, 31, -114], [27.2, 37.6, -128], [33, 42.6, 26], [40.4, 45, 10], [48, 45.6, 0], [55.6, 45.2, -3], [63.2, 44.6, -4], [70.8, 45.4, 18]];
write("northamerica/bench-center.svg", svg(90, 90, "American street bench, seen from its end: back on the left, one sits to the right. Steel slats (6 x 4 cm, their ends) on a black cast end frame with a loop arm. Seat 46 cm, back 86 cm, armrest 64 cm, 62 cm deep.",
  [// the end frame: the rail under the slats, the two legs on feet, the stretcher
    P("M14.4 8 Q13 10 14 13 L20 34 C22 42 25 48 25.4 56 L22.4 86 H27.6 L31 58 C40 55 58 54 66 57 L69 86 H74.2 L71.8 52 Q71.6 48.6 68 48.4 C58 49 48 50.4 40 49 C30 46.6 25 36 21.6 25 L17.6 8 Q16 6 14.4 8 Z", "#3a4043"),
    P("M14.4 8 Q13 10 14 13 L20 34 C22 42 25 48 25.4 56 L22.4 86 H24 L27 56 C26.6 47 23.4 41 21.4 33 L15.8 13 Z", "#666e72"), P("M66 57 L69 86 H70.8 L68.4 56 Z M71.8 52 L74.2 86 H72.6 L70 52 Z", "#23272a"),
    R(18.6, 85.6, 12, 4.4, "#23272a", 1.4), R(66, 85.6, 12, 4.4, "#23272a", 1.4), L("M26.4 72 C40 66 56 66 70 72", "#3a4043", 2.6),
    seat.map(([x, y, a]) => slat(x, y, a)),
    // the arm
    L("M22.6 28 C34 24 54 23 64 25.6 Q72.6 28 71.6 35 Q71 41 68.8 48", "#3a4043", 3.2, "round"), L("M24 27 C35 23.2 54 22 63.6 24.4", "#666e72", 1.1, "round")]));

/* ---------- stops ---------- */
// A perforated square sign post, 6 cm (2.5 in), and a pole.
const perf = (x, y, y1 = 340) => [R(x - 3.2, y, 6.4, y1 - y, GALV[0]), R(x + 1.2, y, 2, y1 - y, GALV[1]), ...Array.from({ length: Math.floor((y1 - y - 20) / 15) }, (_, i) => C(x - 0.6, +(y + 8 + i * 15).toFixed(1), 0.9, "#7c8386")), R(x - 4.6, y1 - 14, 9.2, 14, GALV[1])];
const tube = (x, y, r, c, y1 = 340) => [R(x - r, y, 2 * r, y1 - y, c[0], Math.min(r, 2)), R(x + r * 0.35, y, r * 0.65, y1 - y, c[1], 1), R(x - r * 0.75, y, r * 0.4, y1 - y, c[2])];
const lines = (x, y, w, n, f = "#9a9b9c") => Array.from({ length: n }, (_, i) => R(x, y + i * 4, i % 3 === 2 ? w * 0.7 : w, 1.4, f));
// The schedule case under the sign (at eye level).
const caseBox = (x, y, w = 24, h = 52) => [R(x - w / 2, y, w, h, "#55595b", 1.5), R(x - w / 2 + 2, y + 2, w - 4, h - 4, WHITE), R(x - w / 2 + 4, y + 5, w - 8, 4, "#1f56a8"), lines(x - w / 2 + 4, y + 13, w - 8, 8)];
const usSign = (x, pict) => [R(x - 16, 25, 32, 47, "#6f7679", 3.6), R(x - 15.2, 25.8, 30.4, 45.4, "#1d5fa8", 3), L(`M${x - 13.4} 70 Q${x - 13.8} 69 ${x - 13.4} 30 Q${x - 13.4} 27.4 ${x - 11} 27.4 H${x + 11} Q${x + 13.4} 27.4 ${x + 13.4} 30 V67 Q${x + 13.4} 69.6 ${x + 11} 69.6 H${x - 11}`, WHITE, 0.9), pict,
  R(x - 9, 56, 18, 3, WHITE, 1), R(x - 7, 62, 14, 2.2, WHITE, 1), R(x - 16, 74, 32, 21, "#6f7679", 2), R(x - 15.2, 74.8, 30.4, 19.4, WHITE, 1.6), R(x - 12, 78, 11, 5.6, "#2a2b2a", 1), R(x + 1.6, 78, 10.4, 5.6, "#2a2b2a", 1), R(x - 12, 87, 24, 1.6, "#9a9b9c"), R(x - 12, 90, 16, 1.6, "#9a9b9c")];
const usPost = (x, pict, y1) => [perf(x, 20, y1), usSign(x, pict), caseBox(x, 150)];
const NOTE = "shade on the right (left half of the street); the bottom edge = the sidewalk, the middle = the post's axis.";
pair("northamerica/oznacnik", 50, 340, `North American bus stop: a 12 x 18 in (30 x 46 cm) sign with a plain bus pictogram and a plate of routes, a schedule case, on a perforated square steel post (2.5 in), 3.2 m; the sign's bottom edge at 2.45 m (at least 7 ft). No agency's mark. ${NOTE}`, usPost(25, bus(25, 43, 17, WHITE, "#1d5fa8")));
pair("northamerica/oznacnik-tram", 50, 340, `North American streetcar stop: as the bus stop, with a streetcar pictogram. ${NOTE}`, usPost(25, tram(25, 42.4, 17, WHITE, "#1d5fa8")));
// Washington: the flag of Metrobus stops, plain: 36 x 18 in on a U-channel post; the board towards the sidewalk.
const NAVY = "#1f2f63", WRED = "#c8102e";
const dcPost = [R(82.2, 44, 5.6, 296, "#c3c8ca"), R(86, 44, 1.8, 296, "#8f9699"), R(82.2, 44, 1.2, 296, "#dfe2e3"), Array.from({ length: 25 }, (_, i) => C(84.8, 100 + i * 9, 1, "#4b5154")),
    R(15, 42, 62, 47, "#8f9699", 2), R(15.6, 42.6, 62, 11.4, NAVY), R(15.6, 54, 62, 29, WRED), R(15.6, 83, 62, 5.4, WHITE), R(20, 46, 9, 4.4, "#8fa0cf", 1), R(32, 45.6, 20, 5.2, WHITE, 1), R(36, 59, 28, 11, WHITE, 1.5), R(20, 60, 11, 2, "#eab9c0"), R(20, 64, 9, 2, "#eab9c0"), R(36, 74, 24, 3, "#f3d3d8", 1), R(20, 85, 20, 1.6, "#55595b"), R(54, 85, 18, 1.6, "#55595b"),
    P("M74 89 V36 A11.5 11.5 0 0 1 97 36 V86 Q97 89 94 89 Z", "#7c8386"), P("M74.8 88.2 V36 A10.7 10.7 0 0 1 96.2 36 V86 Q96.2 88.2 94 88.2 Z", WHITE), P("M92 27 A10.7 10.7 0 0 1 96.2 36 V86 Q96.2 88.2 94 88.2 H92 Z", "#dcddd9"), C(85.5, 36.4, 8.6, NAVY), bus(85.5, 36.2, 9.4, WHITE, NAVY), R(82.6, 50, 5.8, 17, WRED, 1), R(82.6, 69, 5.8, 14, NAVY, 1), C(85.5, 47.6, 0.8, "#7c8386"), caseBox(85, 150, 22, 50)];
pair("washington/oznacnik", 170, 340, `Washington Metrobus stop without the operator's name and mark: the flag 36 x 18 in (91 x 46 cm; WMATA 2009) of a white upright panel with a navy disc and a red and navy board, a schedule case, on a U-channel post; the board's bottom edge at 2.5 m. ${NOTE}`,
  dcPost);
// New York: a disc on a dark green pole, a red band in it, route plates to both sides under it, the timetable box.
const NYB = "#1f3f87", NYG = ["#40604f", "#2d483b", "#678a77"];
pair("newyork/oznacnik", 90, 340, `New York bus stop: a blue disc with a red lower band (about 50 cm, estimated from photos), plates of the destinations and routes under it, a four-sided timetable case at the eye's height, on a dark green pole; 3.4 m. No agency's mark. ${NOTE}`,
  [tube(45, 46, 3.2, NYG), C(45, 26, 25.4, "#22304f"), C(45, 26, 24.6, NYB), P("M21.6 33.6 A24.6 24.6 0 0 0 68.4 33.6 Z", WRED), L("M21.6 33.6 H68.4", WHITE, 1.2), bus(45, 20, 22, WHITE, NYB), R(33, 38.4, 24, 3.2, WHITE, 1), R(38, 43.8, 14, 2.2, "#f3d3d8", 1),
    R(4, 58, 37, 22, NYB, 1.5), R(8, 62, 24, 3, WHITE, 1), R(8, 68, 28, 2, "#a9b6d6"), R(8, 73, 20, 2, "#a9b6d6"), R(3.4, 79, 38.2, 17.6, "#7c8386", 1), R(4.2, 80, 36.6, 15.8, WHITE, 0.6), R(8, 85, 22, 2.6, "#2a2b2a"), R(8, 90, 16, 2, "#9a9b9c"), R(49, 58, 28, 19, NYB, 1.5), R(53, 62, 15, 4.4, WHITE, 1), R(53, 70, 11, 3, "#a9b6d6"),
    R(35, 158, 20, 74, "#8f9699", 1.5), R(36.5, 161, 13, 68, WHITE), P("M49.5 161 L54 163 V227 L49.5 229 Z", "#d5d8d8"), R(38, 164, 7, 4, NYB), L("M40 174 V222 M40 176 H47 M40 190 H47 M40 204 H47 M40 218 H47", "#3a63b0", 1.2), R(33.5, 155, 23, 3.4, "#6f7679", 1), R(33.5, 232, 23, 3.4, "#6f7679", 1), R(40.4, 334, 9.2, 6, NYG[1])]);
// Toronto: the wrap on a pole, white between red bands with the routes' red boxes.
const ttc = (x, y1, pict) => [tube(x, 100, 6.5, GALV, y1), R(x - 12, 14, 24, 152, "#8f9699", 2.4), R(x - 11.4, 14.6, 22.8, 150.8, WHITE, 2), R(x + 4.6, 14.6, 6.8, 150.8, "#d5d6d2", 2), R(x - 11.4, 14.6, 2.2, 150.8, "#e3e4e0", 2),
  P(`M${x - 11.4} 44 V16.6 Q${x - 11.4} 14.6 ${x - 9} 14.6 H${x + 9} Q${x + 11.4} 14.6 ${x + 11.4} 16.6 V44 Z`, "#d0202e"), P(`M${x + 4.6} 14.6 H${x + 9} Q${x + 11.4} 14.6 ${x + 11.4} 16.6 V44 H${x + 4.6} Z`, "#a51822"), P(`M${x - 11.4} 136 H${x + 11.4} V165.4 H${x - 11.4} Z`, "#d0202e"), P(`M${x + 4.6} 136 H${x + 11.4} V165.4 H${x + 4.6} Z`, "#a51822"), pict,
  [49, 65, 81].map((y) => [R(x - 9.4, y, 18.8, 14.6, "#d0202e", 2.2), R(x - 5, y + 4, 10, 6.6, WHITE, 1)]), R(x - 9, 124, 18, 8, "#2a2b2a", 0.8), R(x - 7, 127, 14, 1.8, WHITE), R(x - 6.5, 146, 13, 11, "#1d5fa8", 1), R(x - 4, 149.6, 8, 3.6, WHITE, 1), R(x - 9, y1 - 6, 18, 6, GALV[1])];
pair("toronto/oznacnik", 50, 340, `Toronto stop pole: a white wrap between two red bands with red boxes of the routes (1.5 m high, 24 cm, estimated from photos), on a steel pole 13 cm; 3.3 m. No operator's mark. ${NOTE}`, ttc(25, 340, bus(25, 30, 17, WHITE, "#d0202e")));
pair("toronto/oznacnik-tram", 50, 340, `Toronto streetcar stop pole: as the bus stop's, with a streetcar pictogram. ${NOTE}`, ttc(25, 340, tram(25, 29, 16, WHITE, "#d0202e")));
// Boston: a round-topped panel, black cap, yellow, red foot.
const YEL = "#f0a222";
pair("boston/oznacnik", 50, 340, `Boston bus stop: a round-topped yellow panel 32 x 92 cm (estimated from photos) with a black cap and a red foot, on a steel post; its bottom edge at 2.3 m. No agency's mark. ${NOTE}`,
  [tube(25, 30, 2.9, GALV), P("M8 108 V32 A17 17 0 0 1 42 32 V108 Q42 111 39 111 H11 Q8 111 8 108 Z", "#2a2b2a"), P("M9 107.6 V32 A16 16 0 0 1 41 32 V107.6 Q41 110 38.6 110 H11.4 Q9 110 9 107.6 Z", WHITE), P("M10.2 98 V42 H39.8 V98 Z", YEL), P("M10.2 41 V32 A14.8 14.8 0 0 1 39.8 32 V41 Z", "#1c1d1c"), P("M10.2 98 H39.8 V107.4 Q39.8 108.8 38.4 108.8 H11.6 Q10.2 108.8 10.2 107.4 Z", WRED), P("M36 42 H39.8 V98 H36 Z", "#d99a1c"), bus(25, 31, 18.5, YEL, "#1c1d1c"), C(25, 66, 1.1, "#7c5a12"), C(25, 94, 1.1, "#7c5a12"),
    R(13.4, 47, 10, 5.4, "#1c1d1c", 0.8), R(26, 47.4, 9, 1.8, "#1c1d1c"), R(26, 51, 7, 1.4, "#1c1d1c"), R(13.4, 56, 10, 5.4, "#1c1d1c", 0.8), R(26, 56.4, 9, 1.8, "#1c1d1c"), R(26, 60, 6, 1.4, "#1c1d1c"), R(13.4, 72, 21, 2, "#6b5115"), R(13.4, 78, 15, 2, "#6b5115"), R(14, 101, 22, 2.2, WHITE), R(18, 105, 14, 1.6, "#f3d3d8"), R(20.6, 334, 8.8, 6, GALV[1])]);
// San Francisco: a dark panel on the side of a round pole.
pair("sanfrancisco/oznacnik", 100, 340, `San Francisco stop: a dark grey panel 40 x 105 cm (estimated from photos) with a red field and the rows of routes, at the side of a galvanised pole 11 cm; 3.3 m. No operator's mark. ${NOTE}`,
  [R(5, 26, 41, 108, "#33363f", 1.5), R(5, 26, 41, 46, "#c5203f", 1.5), bus(25.5, 48, 25, WHITE, "#c5203f"), R(11, 64, 29, 3.4, WHITE, 1), R(8.6, 77, 8.6, 8.6, "#3f8fc9", 4.3), R(20, 78, 18, 2.4, WHITE), R(20, 82.6, 13, 1.6, "#a7abb5"), R(5, 89, 41, 13, "#c5203f"), R(8.6, 92, 9.4, 6.6, WHITE, 1), R(21, 92.6, 18, 2, WHITE), R(21, 96.4, 12, 1.6, "#f3d3d8"), R(8.6, 105, 9.4, 6.6, WHITE, 1), R(21, 105.6, 18, 2, WHITE), R(21, 109.4, 14, 1.6, "#a7abb5"), R(8.6, 119, 30, 2, "#8b8f99"), R(8.6, 125, 20, 2, "#8b8f99"),
    tube(50, 12, 5.6, GALV), P("M44.4 14 Q50 7 55.6 14 Z", GALV[1]), R(44, 34, 12, 3, "#6f7679"), R(44, 122, 12, 3, "#6f7679"), R(44.4, 142, 11.2, 22, WHITE), R(44.4, 147, 11.2, 4, WRED), R(52.2, 142, 3.4, 22, "rgba(0,0,0,.15)"), R(42, 334, 16, 6, GALV[1])]);

/* ---------- shelters ---------- */
const DKA = ["#6b7276", "#50575a", "#8c9497"];
// Shared: an aluminium shelter from its end: depth 5 ft, the roof's underside 8 ft, sloping to the back; back wall left.
const sedum = fs.readFileSync(new URL("praha/transit-shelter-green-left.svg", PUB), "utf8").match(/<!-- rozchodníky[\s\S]*?(?=\s*<!-- obrubový)/)[0].replace(/<!--[\s\S]*?-->/g, "");
const post = (x, y0, w = 8, c = DKA) => [R(x, y0, w, 360 - y0, c[0]), R(x + w * 0.65, y0, w * 0.35, 360 - y0, c[1]), R(x, y0, w * 0.2, 360 - y0, c[2])];
const US_STOP = ['<g transform="translate(219 20)">', usPost(25, bus(25, 43, 17, WHITE, "#1d5fa8"), 340), "</g>"];
const DC_STOP = ['<g transform="translate(165 20)">', dcPost, "</g>"];
const shelter = (green, stop = US_STOP) => [
  // the end wall's glass in clamps, the bench within
  R(31, 118, 127, 228, GLASS), P("M31 300 L124 118 H154 L31 346 Z", "#e6eeec"), P("M92 346 L158 216 V228 L99 346 Z", "#e6eeec"),
  R(30, 256, 7, 4, "#454b4e"), P("M34 252 H39.6 L42 298 H36.4 Z", "#5d6468"), P("M34 252 H35.6 L38 298 H36.4 Z", "#8c9497"), R(34, 296, 56, 8, "#5d6468", 1.5), R(34, 296, 56, 2, "#8c9497", 1), R(40, 304, 7, 56, "#5d6468"), R(76, 304, 7, 56, "#5d6468"), R(44.6, 304, 2.4, 56, "#454b4e"), R(80.6, 304, 2.4, 56, "#454b4e"),
  R(96, 158, 26, 38, "#8c9497", 1), R(97, 159, 24, 36, WHITE, 1), R(99.5, 162, 19, 5, "#1d5fa8"), lines(99.5, 171, 19, 5),
  R(31, 214, 127, 4, DKA[0]), R(31, 214, 127, 1.2, DKA[2]), R(31, 346, 127, 6, DKA[1]), R(31, 118, 127, 4, DKA[0]), post(22, 112, 9), post(158, 108, 9), [130, 330].map((y) => [R(29, y, 6, 8, DKA[1], 1), R(155, y, 6, 8, DKA[1], 1)]),
  R(18, 356, 17, 4, DKA[1]), R(154, 356, 17, 4, DKA[1]),
  // the roof
  green ? ['<g transform="rotate(-2.46 103 104)">', P("M16 104 H188 V95 H16 Z", "#8a7458"), R(16, 101, 172, 3, "#4a4036"), '<g transform="translate(0 8) rotate(-0.64 103 88)">', sedum, "</g>", R(12, 95, 4.4, 11, DKA[0]), R(187, 95, 4.4, 11, DKA[0]), "</g>"]
    : [P("M14 108 L192 100.2 Q104 84 14 108 Z", "#c3d6d4"), L("M14 108 Q104 84 192 100.2", "#8c9497", 2), L("M72 96.4 L73 105 M132 93.6 L133 102.6", "#8c9497", 1.2)],
  P("M10 108 L196 100 V113 L10 121 Z", DKA[0]), P("M10 108 L196 100 V102.6 L10 110.6 Z", DKA[2]), P("M10 118.6 L196 110.6 V113 L10 121 Z", DKA[1]),
  stop];
pair("northamerica/transit-shelter", 270, 360, "North American bus shelter from its end: aluminium frame, glass walls, a low translucent vault on the roof's frame, a bench; 5 ft (1.5 m) deep, about 8 ft (2.5 m) high, back wall on the left, with the shared bus stop at the kerb. No advertisement.", shelter(false));
pair("northamerica/transit-shelter-green", 270, 360, "The North American bus shelter with a planted roof (the planting of Prague's green shelter).", shelter(true));
pair("washington/transit-shelter", 270, 360, "The North American bus shelter with the Washington bus stop at the kerb.", shelter(false, DC_STOP));
pair("washington/transit-shelter-green", 270, 360, "The North American bus shelter with a planted roof and the Washington bus stop at the kerb.", shelter(true, DC_STOP));
// Toronto: posts of tube, a curved glass roof, glass end wall.
const TA = ["#a9afb2", "#858c90", "#c9ced0"];
// The Prague planting bent along the roof's curve: each plant moved and turned to the arc's place.
const arc = (t) => { const u = 1 - t; return [u * u * 14 + 2 * u * t * 90 + t * t * 186, u * u * 118 + 2 * u * t * 66 + t * t * 88]; };
const toGreen = [P("M26 111 Q92 62 178 85.6 V78 Q92 54 26 102 Z", "#8a7458"), L("M26 109.6 Q92 60.6 178 84", "#4a4036", 2.4),
  Array.from({ length: 22 }, (_, i) => { const t = 0.09 + (i / 21) * 0.83, [x, y] = arc(t), [x2, y2] = arc(t + 0.01), a = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI, w = 5 + (i * 7) % 4, h = 8 + (i * 5) % 5;
    const [m, l] = [["#4f8a35", "#6aa84f"], ["#5f8f3a", "#86b46a"], ["#3f7a2d", "#5f8f3a"], ["#6c7a2a", "#8f9a3c"], ["#4f8a35", "#6aa84f"], ["#9e3b3b", "#c05a55"]][i % 6];
    return [`<g transform="translate(${x.toFixed(1)} ${(y - 6.5).toFixed(1)}) rotate(${a.toFixed(1)})">`, P(`M${-w} 0 Q0 ${-h - 4} ${w} 0 Z`, m), P(`M${-w} 0 Q${-w * 0.2} ${-h - 4} ${w * 0.3} 0 Z`, l), i % 5 === 2 ? C(0, -h * 0.6, 1.6, "#f2c94c") : "", i % 6 === 4 ? L("M-2 -1 Q-4 -10 -6 -14 M0 -1 V-17 M2 -1 Q4 -10 6 -13", "#7d9a6a", 1.5, "round") : "", "</g>"]; }),
  L("M28 109.4 L24.4 102", TA[1], 3.4), L("M177.6 85.4 L178.6 78", TA[1], 3.4)];
const toShelter = (green) => [
  R(44, 120, 100, 224, GLASS), R(44, 341, 100, 4, TA[1]), P("M44 300 L128 120 H144 L44 340 Z", "#e1edee"), R(44, 140, 100, 13, "#3f8fb8"), R(44, 222, 100, 2.6, TA[1]), R(40, 300, 46, 5, "#5a3f33"), R(40, 300, 46, 1.5, "#7a5a4a"), R(56, 305, 14, 55, TA[1]), R(56, 305, 4, 55, TA[0]),
  post(34, 106, 10, TA), post(144, 85, 10, TA), [134, 320].map((y) => [R(42, y + 0, 6, 8, TA[1], 1), R(140, y, 6, 8, TA[1], 1)]), P("M30 346 H48 L50 360 H28 Z", TA[0]), P("M42 346 H48 L50 360 H43 Z", TA[1]), P("M140 346 H158 L160 360 H138 Z", TA[0]), P("M152 346 H158 L160 360 H153 Z", TA[1]),
  P("M14 118 Q90 66 192 89 L192 92.4 Q92 70.6 15 121.6 Z", "#8ec4bd"), P("M14 118 Q90 66 192 89 V90.2 Q90 67.6 14.6 119.4 Z", "#c6e3dd"), L("M36 110 Q92 78 158 88", TA[1], 4),
  green ? [`<g transform="translate(0 3.5)">`, toGreen, "</g>"] : "",
  '<g transform="translate(219 20)">', ttc(25, 340, bus(25, 30, 17, WHITE, "#d0202e")), "</g>"];
pair("toronto/transit-shelter", 270, 360, "Toronto street shelter (the coordinated street furniture of 2007) from its end: tubular posts on cast feet, glass walls, a curved glass roof, a timber bench; about 1.2 m between the posts, the roof 1.7 m, 2.7 m high (estimated from photos); with the Toronto stop pole at the kerb. No advertisement, no operator's mark.", toShelter(false));
pair("toronto/transit-shelter-green", 270, 360, "The Toronto shelter with a planted roof.", toShelter(true));

/* ---------- proposals (not wired) ---------- */
const HY = ["#c8342b", "#9a231c", "#e2685f"];
write("hydrant.svg", svg(60, 100, "Proposal only: an American dry-barrel fire hydrant, 76 cm, the 4.5 in pumper nozzle to the front, two 2.5 in hose nozzles.",
  [R(16, 93, 28, 7, HY[1], 1), R(16, 93, 18, 2, HY[2]), P("M21 44 H39 L40 93 H20 Z", HY[0]), P("M33 44 H39 L40 93 H33 Z", HY[1]), R(23, 46, 2.6, 46, HY[2]), R(17, 76, 26, 5, HY[0], 1), R(34, 76, 9, 5, HY[1], 1), R(18, 81, 24, 2, HY[1]), R(7, 52, 46, 10, HY[0], 1), R(4, 50, 6, 14, HY[1], 2), R(50, 50, 6, 14, HY[1], 2), R(2, 54.5, 3, 5, HY[0]), R(55, 54.5, 3, 5, HY[0]), C(30, 58, 10, HY[1]), C(30, 58, 8, HY[0]), P("M30 54.6 L33 56.3 V59.7 L30 61.4 L27 59.7 V56.3 Z", HY[2]), R(17, 41, 26, 4.4, HY[0], 1), R(33, 41, 10, 4.4, HY[1], 1), P("M19 41 Q20 29 30 28 Q40 29 41 41 Z", HY[0]), P("M33 28.6 Q40 30 41 41 H34 Z", HY[1]), P("M22 38 Q23 31 28 30 Q25 33 25 38 Z", HY[2]), R(27.4, 24, 5.2, 5, HY[1], 1)]), PROP);
write("parking-meter.svg", svg(40, 160, "Proposal only: a single-space parking meter, 1.45 m, on a 2 in pipe.",
  [tube(20, 44, 3.4, GALV, 160), R(14, 156, 12, 4, GALV[1]), P("M9 46 V22 A11 11 0 0 1 31 22 V46 Q31 49 28 49 H12 Q9 49 9 46 Z", "#4b5154"), P("M25 12.4 A11 11 0 0 1 31 22 V46 Q31 49 28 49 H25 Z", "#33383a"), P("M12.5 28 V22 A7.5 7.5 0 0 1 27.5 22 V28 Z", "#cfdcd6"), R(14, 21, 12, 3, "#2a2b2a"), R(13, 32, 8, 2.4, "#1d1f20"), C(24, 40, 3, "#8c9497"), R(14, 37.6, 5, 6, "#1d5fa8", 1)]), PROP);
