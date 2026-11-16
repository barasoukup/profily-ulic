// Address search in Vienna (pilot/public/search-at.js): the query without "Wien", addresses and streets of the
// address points, the cut at the point.
import { test } from "node:test";
import assert from "node:assert/strict";
import { viennaQuery, parseAddresses, parseStreets, looksViennese } from "../pilot/public/search-at.js";
import { locate } from "../pilot/public/search.js";

const pt = (name, str, onr, plz, x, y) => ({ type: "Feature", properties: { NAME: name, NAME_STR: str, ONR_VON: onr, PLZ: plz }, geometry: { type: "Point", coordinates: [x, y] } });

test("Vídeň: dotaz bez slova Wien a PSČ, adresy a ulice z adresních bodů, řez v bodě", async () => {
  assert.deepEqual(viennaQuery("Neubaugasse 12 Wien"), { name: "Neubaugasse", number: "12" });
  assert.deepEqual(viennaQuery("Mariahilfer Straße, 1060 Wien"), { name: "Mariahilfer Straße", number: "" });
  assert.ok(looksViennese("Praterstraße Wien") && !looksViennese("Vídeňská, Brno"));
  const a = parseAddresses({ features: [pt("Neubaugasse 12-14", "Neubaugasse", "12", "1070", 16.3497, 48.1993)] });
  assert.equal(a[0].text, "Neubaugasse 12-14, 1070 Wien");
  assert.equal(a[0].type, "AdresniMisto");
  const s = parseStreets({ features: [pt("a 1", "A-Gasse", "1", "1010", 16.1, 48.1), pt("a 5", "A-Gasse", "5", "1010", 16.3, 48.3), pt("a 3", "A-Gasse", "3", "1010", 16.2, 48.2), pt("b 2", "B-Weg", "2", "1020", 16.5, 48.5)] });
  assert.equal(s.length, 2);
  assert.deepEqual(s[0].at, { lon: 16.2, lat: 48.2, street: "A-Gasse" }, "prostřední adresa ulice");
  assert.equal(a[0].at.street, "Neubaugasse");
  // Without a street name no request: the cut at the point (with one, the street's axis from the street graph).
  const where = await locate({ ...a[0], at: { ...a[0].at, street: undefined } });
  assert.deepEqual(where.cut, { lon: 16.3497, lat: 48.1993 });
});
