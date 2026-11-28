// The tables of the looks: window sizes, roof coverings, wall colours.
import { AMERICA_PALETTES } from "../../houses-america-spec.js";

// Side windows: width and gap (cm), sill and height as a share of the storey.
export const WINDOWS = { sikma: { w: 85, gap: 60, sill: 0.24, h: 0.56 }, plocha: { w: 120, gap: 50, sill: 0.3, h: 0.45 },
  nizky: { w: 85, gap: 70, sill: 0.3, h: 0.45 }, funkce: { w: 110, gap: 60, sill: 0.3, h: 0.5 }, moderni: { w: 120, gap: 40, sill: 0.05, h: 0.8 }, hala: {},
  sorela: { w: 90, gap: 70, sill: 0.28, h: 0.52 }, typovy: { w: 100, gap: 80, sill: 0.3, h: 0.47 }, povalecny: { w: 130, gap: 50, sill: 0.33, h: 0.45 }, mestan: { w: 80, gap: 90, sill: 0.3, h: 0.45 }, vila: { w: 90, gap: 70, sill: 0.3, h: 0.47 }, kostka: { w: 140, gap: 60, sill: 0.32, h: 0.42 },
  novyrd: { w: 110, gap: 50, sill: 0.1, h: 0.72 }, statek: { w: 70, gap: 90, sill: 0.32, h: 0.4 },
  // The regional looks (docs/house-types-europe.md): French windows to the floor in Paris and the south, the big sash
  // windows of the North Sea close together, small ones in the Hanseatic and wooden houses.
  haussmann: { w: 115, gap: 100, sill: 0.04, h: 0.7 }, stredomori: { w: 100, gap: 100, sill: 0.04, h: 0.72 }, azulejo: { w: 95, gap: 85, sill: 0.05, h: 0.7 },
  galeria: { w: 100, gap: 100, sill: 0.04, h: 0.72 }, malta: { w: 110, gap: 140, sill: 0.08, h: 0.66 }, kypr: { w: 100, gap: 120, sill: 0.1, h: 0.62 },
  cihlovy: { w: 110, gap: 50, sill: 0.18, h: 0.66 }, stit: { w: 110, gap: 50, sill: 0.18, h: 0.66 }, dansky: { w: 95, gap: 75, sill: 0.28, h: 0.56 },
  stenstad: { w: 100, gap: 90, sill: 0.27, h: 0.56 }, drevak: { w: 90, gap: 110, sill: 0.32, h: 0.45 }, puukaupunki: { w: 90, gap: 100, sill: 0.33, h: 0.47 },
  tallinnamaja: { w: 90, gap: 80, sill: 0.3, h: 0.5 }, hanza: { w: 80, gap: 80, sill: 0.3, h: 0.48 } };
// Roof coverings of the family houses: the cube's sheet or fibre-cement, the new house's anthracite concrete tiles.
export const ROOF_OF = { kostka: ["#7a7f84", "#5c6065"], novyrd: ["#44474b", "#2e3033"], kostel: ["#4f5d6b", "#36414c"], // slate
  // The regional looks: Roman tiles of the south, Galicia's slate, the North Sea's black glazed tiles, the Hanseatic
  // red tiles; more by the house (ROOF_PICK).
  haussmann: ["#8d969b", "#6c757a"], stredomori: ["#c0673f", "#9a4c30"], azulejo: ["#c0673f", "#9a4c30"], kypr: ["#c0673f", "#9a4c30"],
  galeria: ["#4f5d6b", "#36414c"], cihlovy: ["#3f4142", "#2c2e2f"], stit: ["#3f4142", "#2c2e2f"], hanza: ["#b0553b", "#8f3f2b"] };
// Coverings that differ house by house: the stone town's sheet painted black or red-brown, Danish slate or red tile,
// the wooden houses' tiles, black or red or grey sheet.
export const ROOF_PICK = {
  stenstad: [["#3b3d3f", "#26282a"], ["#7a3b2e", "#5a2a20"]], dansky: [["#4f5960", "#394147"], ["#b65a3c", "#8f4129"]],
  drevak: [["#b0553b", "#8f3f2b"], ["#2e3133", "#1f2224"]], puukaupunki: [["#8d3b2c", "#6e2c20"], ["#7d8387", "#5f6468"]],
  tallinnamaja: [["#7d8387", "#5f6468"], ["#8f3f2b", "#6e2c20"]],
};
// Streetmix-like colours: saturated pastel walls, dark glass with a diagonal glint, cream frames.
export const PALETTES = {
  sikma: ["#e7b96a", "#d99a86", "#8fb79a", "#86a9c6", "#e0c98f"],
  // Panel houses: quiet colours (sand, warm grey, grey-blue, muted terracotta), the wall a lighter shade.
  plocha: ["#d2bd97", "#c5bcb0", "#aab6bd", "#c4ab9a"],
  plochaWall: ["#e6dcc4", "#d6e2e6", "#ecd5c7", "#dfe6cf"],
  nizky: ["#efd29a", "#ece4d2", "#e6bfa9"],
  // Functionalist tenements: light smooth plaster (cream, warm white, pale ochre, pale grey).
  funkce: ["#efe6d2", "#ebe7de", "#e8d9bb", "#dfe1dc", "#e6cf9f", "#d3d8cc"],
  // New-built flats: white or light grey render; the accent is anthracite or larch cladding.
  moderni: ["#f2f1ee", "#e4e4e1", "#ecebe6", "#d9dbdc"],
  hala: ["#e0574f", "#3f88c5", "#4caf7d"],
  // Sorela: warm ochre, salmon and sand render over a rusticated ground floor.
  sorela: ["#dcb98c", "#d6a48c", "#cfc69c", "#d9c2a3"],
  // Plain brick blocks of flats of the 1950s–60s (Street View of 25 houses, evaluation/archive/panel-buildings): smooth render in
  // sand, ochre, grey, a pitched tiled roof with chimneys.
  typovy: ["#d8c9a3", "#cfc2a8", "#c9c4b6", "#dcc79a"],
  // Postwar blocks of flats in the west (1946–90): plain light render (off-white, pale grey, pale yellow, pale
  // salmon, grey-green); the balcony fronts in a colour of the time (povalecnyAccent).
  povalecny: ["#ece6d6", "#e2dfd8", "#efe3c2", "#ead6c8", "#d9ded3", "#e6ddcb"],
  povalecnyAccent: ["#6f8796", "#b8664a", "#c9a440", "#6f8f72", "#8a8f94"],
  // Burgher houses on a town square: baroque pastels.
  mestan: ["#f0d58f", "#e9b9a6", "#f2ece0", "#b9cfb4", "#e7c7a0"],
  skola: ["#e8d6a8", "#e2c9b0", "#dfe0d6"],
  kostel: ["#efe9da", "#e9dcbf"],
  garaz: ["#bdb8ae", "#c9c3b5", "#a9aaa5"],
  vila: ["#efd29a", "#ece4d2", "#e6bfa9", "#dfe3d3"],
  // The "cube": brizolit, the rough grey, beige or ochre render of the 1960s–80s.
  kostka: ["#c9c2b2", "#bdb6a6", "#d3c7ad", "#b7bcb4"],
  novyrd: ["#f4f3ef", "#eceae4", "#f1ece2"],
  // A village house: limewash white, ochre or pale grey.
  statek: ["#f1ead9", "#ead9a2", "#e9e6dc"],
  // The regional looks (docs/house-types-europe.md, checked on street photos): Lutetian limestone; the south's ochre,
  // terracotta, yellow, salmon, off-white; azulejo tiles (blue, green, yellow, pink on white); northern Spain's stone or
  // white; Malta's globigerina limestone; Cyprus's sandstone or lime render; brick of the North Sea and Denmark; the
  // Nordic pastels; the wooden houses' paint; the Hanseatic render.
  haussmann: ["#e8dcc4", "#e3d5b8", "#efe6d3", "#ddd0b5", "#e6dccb"],
  stredomori: ["#e0b062", "#c4704f", "#ecd590", "#e8a98c", "#f1ede4", "#e1c27e", "#d7965a"],
  stredomoriShutter: ["#4f6b4a", "#3f6b5a", "#7a5a3c"],
  azulejo: ["#8fb0d6", "#86b3a2", "#efd88f", "#e6bcbc"],
  galeria: ["#b9b2a3", "#efece4", "#c9c2b2"],
  malta: ["#e2c891", "#d8bc7e", "#ead6a6", "#dcc59a"],
  maltaAccent: ["#2f6b3f", "#9c2f2a", "#2f4f7a", "#6b4a30"],
  kypr: ["#d8c39a", "#cdb48a", "#efe9dc"],
  kyprShutter: ["#4f6f5a", "#3d6f8f", "#6b4a30"],
  cihlovy: ["#8a3f2c", "#a24f35", "#6b3a2c", "#b65d3f", "#7a4a3a"],
  stit: ["#8a3f2c", "#a24f35", "#6b3a2c", "#b65d3f", "#7a4a3a"],
  dansky: ["#a64b33", "#9a4430", "#d7b46a", "#cfa95f"],
  stenstad: ["#e2b766", "#e0a184", "#b9c9a4", "#cfcabf", "#ecd9a0", "#e7c3b0", "#b4c0c8"],
  drevak: ["#8d2a1e", "#d9a441", "#e3c06a", "#f2f0ea", "#d5d3cc", "#b5c8a0"],
  puukaupunki: ["#e7c873", "#b5c8a0", "#a8bccc", "#9a3a2a", "#d9a441", "#d9a6a0"],
  tallinnamaja: ["#d9b36a", "#a9bf98", "#8ea4b3", "#e9d79a", "#8a6a4a", "#9aa596"],
  hanza: ["#efeee6", "#e2c27a", "#e6b8a6", "#c8c4bb", "#c9d4b4"],
  ...AMERICA_PALETTES,
};
export const ROOF = { tile: "#c25a3c", tileDark: "#8f3f2b", slate: "#4f5d6b", slateDark: "#36414c" };
export const BRICK = "#b8644a", SKLEP = "#8e8a82";
export const PV_METAL = "#8d9093", PV_SHUTTER = "#d6d2c8"; // the postwar block's door frame and roller shutters
export const GLASS = "#2f3557", GLINT = "#454a75", LIT = "#f4d98c", FRAME = "#f6efdf", DOOR = "#7a4f3a", STONE = "#b9ab8f";
