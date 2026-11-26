// The towns of towns/pasporty.js by name (the export's credits, city.js creditLines; the saved cut, validate.js),
// apart from the passports' code so city.js need not import it (that imports city.js). Also the towns left out after
// the A/B test of 26. 11. 2026 (towns/pasporty.js): a cut saved or exported with their passport keeps its credit.
export const PASSPORT_NAMES = { chomutov: "Chomutov", sumperk: "Šumperk", roznov: "Rožnov pod Radhoštěm", litomerice: "Litoměřice",
  chotebor: "Chotěboř", slapanice: "Šlapanice", kurim: "Kuřim", prachatice: "Prachatice", roudnice: "Roudnice nad Labem" };
// The towns whose passport is of green only.
export const GREEN_PASSPORTS = new Set(["prachatice", "roudnice"]);
