// The states the app knows by their ISO 3166-1 code (Bára 16. 11. 2026: a state = one module here, its signs' folder
// and its line in tools/countries.mjs), loaded at once (signs.js, rules.js and the drawing read them synchronously).
// A place in none of them takes default.js (the Czech rules, ISO null).
import CZ from "./CZ.js";
import SK from "./SK.js";
import AT from "./AT.js";
import DE from "./DE.js";
import DEFAULT from "./default.js";

export const COUNTRIES = { CZ, SK, AT, DE };
export const countryOf = (code) => (code && Object.hasOwn(COUNTRIES, code) ? COUNTRIES[code] : DEFAULT);
