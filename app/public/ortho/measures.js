
// ---------- the surfaces for derive.js ----------
// The MTVU codes the profile knows: 701 the roadway, 702 a sidewalk, 1003 a paved area, 601 a building. A sidewalk runs
// from the kerb to the facade, at most SIDEWALK_MAX (the rest greenery where the image is mostly green, else a
// paved area up to REST_MAX m, else nothing); with no facade within reach, only where OSM tags one (sidewalk:width,
// else the default SIDEWALK m), then nothing (the profile ends there). Where OSM says there is no sidewalk the space
// is treated as that rest.
// PIECE_GREEN: a piece between two lines of a town's map is green from this share of green columns (treetops over a
// sidewalk make some).
export const PIECE_GREEN = 0.35;
export const AI_RUN = 1.0;
export const ALONG = 10, SIDEWALK = 2.5, SIDEWALK_MAX = 6, HOUSE = 5, GREEN_AREA = 0.1; // evaluation/ortho-osm/green.mjs: on ČÚZK 12.5 cm 67 % (Prague) and 82 % (Brno) of the metres right
