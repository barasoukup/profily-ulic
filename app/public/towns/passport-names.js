// The towns of towns/passports.js by name (the export's credits, city.js creditLines; the saved cut, validate.js),
// apart from the passports' code so city.js need not import it (that imports city.js). Also the towns left out after
// the A/B test of 26. 11. 2026 (towns/passports.js): a cut saved or exported with their passport keeps its credit; not Šlapanice and Kuřim (Bára 26. 11. 2026: left out of the credits too, so that they do not mislead).
export const PASSPORT_NAMES = { chomutov: "Chomutov", sumperk: "Šumperk", roznov: "Rožnov pod Radhoštěm", litomerice: "Litoměřice",
  chotebor: "Chotěboř", prachatice: "Prachatice", roudnice: "Roudnice nad Labem" };
// The towns whose passport is of green only.
export const GREEN_PASSPORTS = new Set(["prachatice", "roudnice"]);
