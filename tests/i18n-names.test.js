// Names in the brackets after the kind of data (Bára 27. 11. 2026, docs/i18n-simplify.md): "mapa povrchů (Boston)", the
// notes a cut keeps with what they name, and the old notes of saved cuts (a Czech sentence, a removed key) that must
// still read right.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { t, mark, ref, text, place, ucfirst, list, countryName } from "../app/public/i18n.js";
import { part, cutDataParts, dataText } from "../app/public/data.js";

// The list format sets a no-break space after the short "a" (Czech typography).
const nbsp = (s) => s.replaceAll("\u00a0", " ");
const LEGACY = JSON.parse(fs.readFileSync(new URL("../app/public/locales/legacy-cs-keys.json", import.meta.url), "utf8"));

test("jméno v 1. pádě v závorce za druhovým slovem, seznam podle jazyka", () => {
  assert.equal(text(part("surfaceMap", place("boston"))), "mapa povrchů (Boston)");
  assert.equal(text(part("orthophoto", "MassGIS")), "ortofoto (MassGIS)");
  assert.equal(nbsp(dataText(cutDataParts({ cityMap: "boston" }))), "mapa povrchů (Boston), ortofoto (MassGIS) a OSM");
  assert.equal(nbsp(dataText(cutDataParts({ cityMap: "dc" }))), "mapa povrchů (Washington), inventář (DDOT), ortofoto a OSM");
  assert.equal(ucfirst("mapa povrchů (Boston)"), "Mapa povrchů (Boston)");
  assert.equal(nbsp(list(["A", "B", "C"])), "A, B a C");
  assert.equal(countryName("US"), "USA");
  assert.equal(t("place.wien"), "Vídeň");
});

test("poznámka řezu nese, co jmenuje, a čte se v jazyce stránky", () => {
  const note = mark("note.mapDownOrthoOsm", { name: part("surfaceMap", place("boston")) });
  assert.match(note, /^note\.mapDownOrthoOsm\|\{/);
  assert.equal(t(note), " · mapa povrchů (Boston) neodpovídá, odhad z ortofota a OSM");
  assert.equal(t(mark("note.mapDownOsm", { name: part("surfaceMap", "GRB") })), " · mapa povrchů (GRB) neodpovídá, jen odhad z OSM");
  assert.equal(t(ref("x.unknown").k), "x.unknown", "neznámý klíč zůstane");
});

test("staré poznámky uložených řezů: česká věta i odstraněný klíč se zobrazí novým zněním s jménem", () => {
  assert.equal(t(" · mapa povrchů Bostonu se nenačetla, odhad z ortofota a OSM"), " · mapa povrchů (Boston) neodpovídá, odhad z ortofota a OSM");
  assert.equal(t("note.bostonMapDown"), " · mapa povrchů (Boston) neodpovídá, odhad z ortofota a OSM");
  assert.equal(t(" · mapa povrchů Vilniusu neodpověděla, jen odhad z OSM"), " · mapa povrchů (Vilnius) neodpovídá, jen odhad z OSM");
  assert.equal(t("note.cityMapDown"), " · mapa povrchů neodpovídá, odhad z ortofota a OSM");
  assert.equal(t(" · úřední vyměřování neodpovědělo, odhad z ortofota a OSM"), " · úřední vyměřování neodpovídá, odhad z ortofota a OSM");
  assert.equal(t("note.washingtonMapDown"), t(mark("note.mapDownOrthoOsm", { name: part("surfaceMap", place("washington")) })));
  // Every old sentence and key reads as a whole text: no key, no {name}, no JSON left.
  for (const old of Object.keys(LEGACY).filter((k) => LEGACY[k].includes("|{"))) {
    const shown = t(old);
    assert.doesNotMatch(shown, /\{\w+\}|\|\{|^note\./, `${old} → ${shown}`);
  }
});

test("norma složená z pravidla, hodnot a zdroje: čísla podle jazyka, stopy s metry, místo ve zdroji slovem jazyka", async () => {
  const { norm } = await import("../app/public/norm-text.js");
  assert.equal(norm("cycleLane", [["min", 1.5], ["std", 1.85]], ["ERA 2010"]), "cyklopruh: min. 1,5 m, základ 1,85 m (ERA 2010)");
  assert.equal(norm("busLane", [["min", { ft: 11 }]], ["Boston Complete Streets Guidelines 2013", ["page", "103"]]),
    "pruh pro autobusy: min. 11 ft (3,35 m) (Boston Complete Streets Guidelines 2013, s. 103)");
  assert.equal(norm("busLane", [[null, { ft: [10, 12] }]]), "pruh pro autobusy: 10–12 ft (3,05–3,66 m)");
  assert.equal(norm("parallelParking", [[null, 2]]), "podélné stání: 2 m");
});
