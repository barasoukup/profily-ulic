// The street from the orthophoto and OSM where no technical map answers (Bára 15. 11. 2026; evaluation/ortho-osm/
// REPORT.md, method M2): the surfaces derive.js needs are made up of the OSM buildings, a carriageway whose kerbs are
// read on the orthophoto of the click (lanes-ortho.js laneImage) near where OSM expects them (width, lanes, parking,
// tram tracks), and sidewalks from the kerbs to the buildings. Every surface but the buildings is an estimate
// (guess: the parts are "odhad"). Against MTVU (Prague, Brno, simple cuts): kerbs within 0.5 m at 39–49 %, within 1 m
// at 57–69 %, against 26–35 % / 51–59 % from OSM alone; with an OSM width tag much better.
//
// The entry (docs/code-health-plan.md step 14, Bára 28. 11. 2026): its parts are in ortho/ — osm-along.js (what OSM has
// along the cut), bridges.js, rail.js, road-tags.js (a road as OSM tags it), columns.js and kerbs.js (the image's
// columns and the kerbs read on them), polys.js (orthoOsmPolys, the surfaces), beside.js (beyond a passport),
// facade.js (the ends), estimate-info.js (the notes), measures.js (the metres the rules share), settings.js (P);
// this file only names what the app imports.

export { BUILDING_U, WATER, GREEN, osmAlong, onBridge } from "./ortho/osm-along.js";
export { deckSpans, deckAt, offDecks, bridgeWalks, bridgeRailings } from "./ortho/bridges.js";
export { heavyRail } from "./ortho/rail.js";
export { laneWidth, parkingOrient, osmRoad, withRails, limits, partnerOf } from "./ortho/road-tags.js";
export { columns, usable } from "./ortho/columns.js";
export { P } from "./ortho/settings.js";
export { KERB_SCORE, roadRef, roadLike, kerbs, kerbsOnImage } from "./ortho/kerbs.js";
export { orthoOsmPolys } from "./ortho/polys.js";
export { medianGapsByImage, houseSources, estimateNote } from "./ortho/estimate-info.js";
export { besidePassport } from "./ortho/beside.js";
export { facadeStrip, trimToEnds } from "./ortho/facade.js";
