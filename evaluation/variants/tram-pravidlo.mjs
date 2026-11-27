// The surface of a tram bed (evaluation/archive/rules-2026-11/REPORT.md, section 4), (b): the rule without the
// orthophoto (derive.js bedSurfaces: buses → asphalt, a wide bed between carriageways → gravel, else panels).
import { deriveProfile as derive } from "../../app/public/derive.js";
export const about = "pravidlo bez ortofota";
export const deriveProfile = (args) => derive({ ...args, ortho: null });
