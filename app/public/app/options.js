// The switches that decide how a cut is estimated, read once (flags.js) and handed to the estimate's parameters.
import { flag } from "../flags.js";
import { HATCH_PARAMS } from "../lanes-ortho.js";
import { P as ORTHO_P } from "../ortho-osm.js";
import { LOOKS as HOUSE_LOOKS } from "../house-looks.js";

// The gabled house looks with the gable's outline (house-looks.js; Bára to approve it, 23. 11. 2026): ?stit=1.
if (flag("stit") === "1") HOUSE_LOOKS.gables = true;
// ?off=… switches named parts of the estimate off (the A/B tests, evaluation/ortho-osm/regression.mjs).
{ const off = flag("off"); if (off) { ORTHO_P.off = new Set(off.split(",")); HATCH_PARAMS.off = ORTHO_P.off.has("srafy"); } }
// A side the user stretched beyond the usual reach goes on past the last path or sidewalk (ortho-osm.js stretch): on by
// default, no measuring (Bára 27. 11. 2026: only a hand-stretched side, a deliberate act); ?dosah=0 off. (The random A/B of
// 27. 11. 2026, 12 cuts at 32 m: better 0, worse 1, measured cuts nobody stretched.)
ORTHO_P.stretchOn = flag("dosah") !== "0";
if (flag("axisroad") === "0") ORTHO_P.axisroad = false;
// The model also decides sidewalk, green and other between the kerb and the house (on since 19. 11. 2026, Bára;
// hold-out: sidewalk F1 +5 [3, 7] pp); ?aiplochy=0: the rules' own.
if (flag("aiplochy") !== "0") ORTHO_P.aiWalk = true;
// Lanes and shoulders from the road markings of the orthophoto (lanes-ortho.js); ?orto=0 leaves the rules' profile.
export const LANES_ORTHO = flag("orto") !== "0";
// The carriageway's kerbs of the orthophoto-and-OSM estimate read by a trained model (ai-kerbs.js), a trial: ?ai=1.
// On by default since 19. 11. 2026 (Bára); ?ai=0 leaves the estimate's own kerbs. The model and onnxruntime load only
// at the first cut estimated from the orthophoto (ai-kerbs.js imports them on demand).
export const AI_KERBS = flag("ai") !== "0";
// ?mapa=0: the estimate from the orthophoto and OSM even where a technical map answers (its surfaces, lines, tracks and
// parking sections left out), to compare the two (evaluation/ortho-osm/errors.mjs, Bára 18. 11. 2026).
export const NO_MAP = flag("mapa") === "0";
