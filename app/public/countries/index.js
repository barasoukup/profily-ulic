// The states the app knows by their ISO 3166-1 code (Bára 16. 11. 2026: a state = one module here, its signs' folder
// and its line in tools/countries.mjs), loaded at once (signs.js, rules.js and the drawing read them synchronously).
// A place in none of them takes default.js (the Czech rules, ISO null).
import CZ from "./CZ.js";
import SK from "./SK.js";
import AT from "./AT.js";
import DE from "./DE.js";
import CH from "./CH.js";
import LI from "./LI.js";
import NL from "./NL.js";
import BE from "./BE.js";
import LU from "./LU.js";
import PL from "./PL.js";
import FR from "./FR.js";
import ES from "./ES.js";
import PT from "./PT.js";
import MC from "./MC.js";
import CY from "./CY.js";
import MT from "./MT.js";
import IT from "./IT.js";
import EE from "./EE.js";
import LT from "./LT.js";
import SI from "./SI.js";
import FI from "./FI.js";
import DK from "./DK.js";
import DEFAULT from "./default.js";

export const COUNTRIES = { CZ, SK, AT, DE, CH, LI, NL, BE, LU, PL, FR, ES, PT, MC, CY, MT, IT, EE, SI, FI, DK, LT };
// The states of another continent, loaded when a cut is there (late.js, america.js).
export const addCountries = (more) => Object.assign(COUNTRIES, more);
export const countryOf = (code) => (code && Object.hasOwn(COUNTRIES, code) ? COUNTRIES[code] : DEFAULT);
