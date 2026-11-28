// The windows and the ground floor, by the look (the groups of looks are in facades-*.js).
import { drawChurchFacade, drawFactoryFacade, drawGarageFacade, drawHallFacade, drawOfficeFacade, drawSchoolFacade } from "./facades-halls.js";
import { drawFunctionalistFacade, drawModernFacade, drawPanelFacade, drawPostwarFacade } from "./facades-flats.js";
import { drawTownFacade } from "./facades-town.js";

// The windows and the ground floor, by the look.
const FACADES = { factory: drawFactoryFacade, hall: drawHallFacade, office: drawOfficeFacade, moderni: drawModernFacade, funkce: drawFunctionalistFacade,
  povalecny: drawPostwarFacade, plocha: drawPanelFacade, kostel: drawChurchFacade, garaz: drawGarageFacade, skola: drawSchoolFacade, town: drawTownFacade };
function facadeLook({ factory, style, office, kind }) {
  if (factory) return "factory";
  if (style === "hala") return "hall";
  if (office) return "office";
  if (["moderni", "funkce", "povalecny", "plocha"].includes(style)) return style;
  return ["kostel", "garaz", "skola"].includes(kind) ? kind : "town";
}
// Windows and the ground floor. A panel house and a school keep their windows (and columns) for a set-back floor
// (setBack(z of the floor, n, its front): below).
export function drawFacade(hs) {
  hs.setBack = null;
  FACADES[facadeLook(hs)](hs);
}
