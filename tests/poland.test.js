// Poland (Bára 21. 11. 2026): Kraków's base map (towns/poland.js), GUGiK's address search (search-pl.js), the state by
// its border, the signs, norms and parking law. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Polsko: mapa povrchů Krakova (druhy MJO na kódy MTVU), vypínač ?krakow=0", async () => {
  const P = await import("../pilot/public/towns/poland.js");
  assert.equal(P.krakowCode({ kod_nz: "Jezdnia (KTJZ01)" }), 701);
  assert.equal(P.krakowCode({ kod_nz: "Chodnik (KTCR02)" }), 702);
  assert.equal(P.krakowCode({ kod_nz: "Plac (KTPL01)" }), 1003);
  assert.equal(P.krakowCode({ kod_nz: "Krawężnik (KTKR01)" }), null);
  assert.equal(P.krakowCode({ kod_nz: "Ścieżka (KTCR04)" }), 703, "cyklostezka (červená, na ortofotu u Kuklińskiego)");
  globalThis.PROFILY_PL = { krakow: "0" };
  try { assert.deepEqual(await P.sources.surfaces("19.936,50.060,19.939,50.062"), { features: [], abroad: true }); } finally { delete globalThis.PROFILY_PL; }
  assert.deepEqual(await P.sources.surfaces("21.010,52.230,21.013,52.232"), { features: [], abroad: true }, "Varšava: bez mapy, bez dotazu");
});

test("Polsko: hledání GUGiK UUG", async () => {
  const S = await import("../pilot/public/search-pl.js");
  const out = S.parsePl({ results: { 1: { city: "Kraków", street: "ulica Floriańska", number: "3", code: "31-019", x: "19.9394", y: "50.0622" } } });
  assert.deepEqual(out, [{ text: "Floriańska 3, 31-019 Kraków", type: "AdresniMisto", at: { lon: 19.9394, lat: 50.0622, street: "Floriańska" } }]);
  assert.ok(S.looksPolish("ul. Floriańska 3") && S.looksPolish("Łódź") && !S.looksPolish("Vinohradská 12"));
  // The usual Polish order "street number, town" and the town first without a comma (the hostile review).
  assert.ok(S.queryForms("Floriańska 3, Kraków").includes("Kraków, Floriańska 3"));
  assert.ok(S.queryForms("Floriańska 3 Kraków").includes("Kraków, Floriańska 3"));
  assert.ok(S.queryForms("Kraków Floriańska 3").includes("Kraków, Floriańska 3"));
  assert.equal(S.parsePl({ results: { 1: { city: "Kraków", x: "19.94", y: "50.06" } } })[0].type, "Obec", "samotné město není řez");
});

test("Polsko: stát podle hranic", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8")));
  assert.equal(C.cityAt(52.2297, 21.0122), "poland"); // Warszawa
  assert.equal(C.cityAt(50.0614, 19.9383), "poland"); // Kraków
  assert.equal(C.cityAt(49.7477, 18.6262), "cesko"); // Český Těšín
  assert.equal(C.cityAt(52.343, 14.551), "germany"); // Frankfurt (Oder)
  // The exact border of PRG (the hostile review: GISCO gave Germany a strip of these towns).
  assert.equal(C.cityAt(51.1555, 14.999), "poland"); // Zgorzelec by the Altstadtbrücke
  assert.equal(C.cityAt(51.1555, 14.99), "germany"); // Görlitz
  assert.equal(C.cityAt(52.35, 14.557), "poland"); // Słubice
  assert.equal(C.cityAt(51.95, 14.728), "poland"); // Gubin
  assert.equal(C.countryOfCity("poland").code, "PL");
});

test("Polsko: značky, normy, zákon o stání", async () => {
  const { default: PL } = await import("../pilot/public/countries/PL.js");
  assert.equal(PL.signs.file({ k: "oneway" }, { dir: "forward" }), "D-3");
  assert.equal(PL.signs.file({ k: "oneway", plate: "protismer" }, { dir: "backward" }), "B-2_T-22");
  assert.equal(PL.signs.file({ k: "b20a", v: 50 }), "B-33-50");
  assert.equal(PL.signs.file({ k: "ip27a" }), null, "Polsko nemá značku pěší zóny");
  assert.equal(PL.signs.plate({ k: "ztp" }), "T-29");
  for (const k of ["B-1", "B-2", "B-2_T-22", "B-33-50", "B-43-30", "D-3", "D-3_T-22", "D-18", "T-29", "D-40", "C-13", "C-13-16", "C-16"]) {
    assert.match(fs.readFileSync(new URL(`../pilot/public/signs-PL/${k}.svg`, import.meta.url), "utf8"), /<svg[^>]*viewBox="[-\d.]+ [-\d.]+ [\d.]+ [\d.]+"/, k);
  }
  assert.equal(PL.limits({ type: "chodnik" }, [], 0).zaklad, 1.8);
  assert.equal(PL.limits({ type: "pruh" }, [{ type: "pruh", roadClass: "mk3" }, { type: "pruh" }], 0).min, 2.5);
  assert.equal(PL.tramBelt([], 6.5).length, 1);
  assert.equal(PL.lawNeed(true, 1, 2.5), 3);
  assert.equal(PL.parkByCycleLane, true, "RMI 2022 § 44: podélné stání vedle cyklopruhu s odstupem");
  assert.equal(PL.signs.file({ k: "c10a", walk: "left" }), "C-13-16b");
  assert.equal(PL.signs.file({ k: "c10a" }), "C-13-16a");
  assert.equal(PL.limits({ type: "pruh" }, [{ type: "pruh", roadClass: "mk3" }], 0).min, 3.5, "jednopruhová vozovka");
  assert.equal(PL.tramBelt([{ type: "tramvaj_pruh" }, { type: "tramvaj_pruh" }], 6.5)[0].level, "zaklad", "kolejiště ve vozovce TC/TD: 6 a 7 m");
});
