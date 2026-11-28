// Lanes and shoulders from the orthophoto (Bára 11.–12. 11. 2026; evaluation/orthophoto/REPORT.md): the road markings
// along the street split the carriageway, where the rules only divide it evenly. On a click one image of the
// orthophoto around the cut (±25 m, snapped to the source's pixels: Prague IPR 10 cm, Brno 2025 with its shift,
// Plzeň 2024, else ČÚZK 12.5 cm) is asked in parallel with the other sources; once the profile is derived, the
// lines running along each carriageway of the surface map are found and the profile's lanes and shoulders between
// them are redrawn (source "ortofoto"), and parking paved apart from the asphalt is split off. The map and these
// orthophotos agree within about 0.2 m, so the image is used as it is, without fitting.
// The detector (evaluation/orthophoto/lines.mjs m4, m5): per pixel "brighter than its row's surroundings", per column
// the share of such pixels along ±20 m in pieces of 5 m (a line repeats, an arrow does not), searched turned and
// bent (one direction and curve per carriageway), narrow peaks, solid or dashed by their gaps; then the lines whose
// gaps look like lanes, chosen together. Anything doubtful leaves the rules' profile as it is.
//
// The entry of the orthophoto's lanes (docs/code-health-plan.md step 14, Bára 28. 11. 2026): its parts are in ortho/ —
// sources.js (the orthophoto of each state and its URLs), regions.js (the Länder, the regions of Belgium), si-retry.js
// (Slovenia's server that hangs), image.js (the image and the square asked and sampled), lines.js (the lines and the
// lane lines), lanes.js (the profile's lanes and shoulders), hatch.js (V 13); this file only names what the app imports.

export {
  AT_ORTHO, CH_ORTHO, NL_ORTHO, BE_ORTHO, LU_ORTHO, PL_ORTHO, FR_ORTHO, ES_ORTHO, PT_ORTHO, PT_MAINLAND, ES_NOT_PNOA,
  CY_ORTHO, MT_ORTHO, TO_ORTHO_WHO, IT_ORTHO, itOrthoAt, EE_ORTHO, SI_ORTHO, FI_ORTHO, fiOrthoAt, DC_ORTHO,
  NYS_ORTHO, MA_ORTHO, US_ORTHO, CA_ORTHO, usOrthoAt, caOrthoAt, orthoHereAt, DK_ORTHO, SK_ORTHO, DE_ORTHO, deWmsUrl
} from "./ortho/sources.js";
export { SI_RETRY } from "./ortho/si-retry.js";
export { landAt, landsAt, beRegionsAt } from "./ortho/regions.js";
export { RETRY_429_MS, askImage, laneImage, orthoPatch } from "./ortho/image.js";
export { brightMap, strongLines, laneLines, CENTRE, centreLine } from "./ortho/lines.js";
export { applyLanes } from "./ortho/lanes.js";
export { HATCH_PARAMS, hatchCells, hatchBands } from "./ortho/hatch.js";
