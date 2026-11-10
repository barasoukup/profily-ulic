// Address search (pilot/public/search.js): the answers of the RÚIAN search service of ČÚZK parsed, ranked
// (the street of the named town first, an address with the typed number first) and labelled.
import { test } from "node:test";
import assert from "node:assert/strict";
import { norm, parseSuggestions, rankResults, formatLabel, score, nearestOnPaths, streetMiddle, suggestUrl, MAX_SHOWN } from "../pilot/public/search.js";

const sug = (...rows) => ({ suggestions: rows.map(([text, magicKey, type]) => ({ text, magicKey, type, isCollection: false })) });

test("normalizace dotazu", () => {
  assert.equal(norm("  Náměstí Svobody,  BRNO "), "namesti svobody brno");
  assert.equal(norm("Frýdek-Místek"), "frydek mistek");
  assert.equal(norm("Mánesova 409/12"), "manesova 409/12");
});

test("návrhy: vrstva a objectid z magicKey, bez duplicit obce jako úřadu", () => {
  const items = parseSuggestions(sug(
    ["Brno (Jihomoravský kraj)", "14_1897", "ObecSRozsirenouPusobnosti"],
    ["Brno (Jihomoravský kraj)", "13_2661", "ObecSPoverenymObecnimUradem"],
    ["Brno (Brno-město)", "12_14796", "Obec"],
    ["Brno (Brno-město)", "12_14796", "Obec"],
    ["bez klíče", "", "Obec"],
    ["Mánesova, Praha", "4_36012", "Ulice"],
  ));
  assert.deepEqual(items.map((i) => [i.type, i.layer, i.oid]), [["Obec", 12, 14796], ["Ulice", 4, 36012]]);
  assert.deepEqual(parseSuggestions(null), []);
  assert.deepEqual(parseSuggestions({ error: { code: 500 } }), []);
});

test("popisky", () => {
  assert.deepEqual(formatLabel({ text: "Mánesova 409/12, Vinohrady, 12000 Praha 2", type: "AdresniMisto" }), { main: "Mánesova 409/12", sub: "Vinohrady, 12000 Praha 2", kind: "adresa" });
  assert.deepEqual(formatLabel({ text: "Jiráskova, Česká Třebová", type: "Ulice" }), { main: "Jiráskova", sub: "Česká Třebová", kind: "ulice" });
  assert.deepEqual(formatLabel({ text: "Manětín (Plzeň-sever)", type: "Obec" }), { main: "Manětín", sub: "Plzeň-sever", kind: "obec" });
  assert.deepEqual(formatLabel({ text: "Brno-Líšeň", type: "MestskyObvodMestskaCastVeStatutarnimMesteAHlavnimMestePraze" }), { main: "Brno-Líšeň", sub: "", kind: "městská část" });
});

test("pořadí: ulice ve jmenovaném městě první", () => {
  const items = parseSuggestions(sug(
    ["Jiráskova 896, 56002 Česká Třebová", "1_2178225", "AdresniMisto"],
    ["Jiráskova, Česká Třebová", "4_67516", "Ulice"],
    ["Jiráskova 773, 56002 Česká Třebová", "1_2179451", "AdresniMisto"],
  ));
  assert.equal(rankResults(items, "Jiráskova Česká Třebová")[0].text, "Jiráskova, Česká Třebová");
  const brno = parseSuggestions(sug(
    ["náměstí Svobody 97/3, Brno-město, 60200 Brno", "1_2262989", "AdresniMisto"],
    ["náměstí Svobody, Brno", "4_70775", "Ulice"],
  ));
  assert.equal(rankResults(brno, "Náměstí Svobody Brno")[0].type, "Ulice");
});

test("pořadí: s číslem domu vyhrává adresa s tím číslem", () => {
  const items = parseSuggestions(sug(
    ["Mánesova, Praha", "4_36012", "Ulice"],
    ["Mánesova 812/6, Vinohrady, 12000 Praha 2", "1_1199118", "AdresniMisto"],
    ["Mánesova 409/12, Vinohrady, 12000 Praha 2", "1_1199065", "AdresniMisto"],
  ));
  assert.equal(rankResults(items, "Mánesova 12, Praha")[0].text, "Mánesova 409/12, Vinohrady, 12000 Praha 2");
  assert.equal(rankResults(items, "Mánesova 409 Praha")[0].oid, 1199065);
  assert.equal(rankResults(items, "Mánesova Praha")[0].type, "Ulice");
});

test("pořadí: bez města dostane přednost statutární město, jinak pořadí služby", () => {
  const items = parseSuggestions(sug(
    ["Českobrodská, Mukařov", "4_131439", "Ulice"],
    ["Českobrodská, Pořičany", "4_121015", "Ulice"],
    ["Českobrodská, Praha", "4_124214", "Ulice"],
    ["Českobrodská 1329, Kyje, 19800 Praha 9", "1_1", "AdresniMisto"],
  ));
  assert.deepEqual(rankResults(items, "Českobrodská").map((i) => i.text), ["Českobrodská, Praha", "Českobrodská, Mukařov", "Českobrodská, Pořičany", "Českobrodská 1329, Kyje, 19800 Praha 9"]);
  assert.ok(score(items[0], "Českobrodská Mukařov") > score(items[2], "Českobrodská Mukařov"));
});

test("nejvýš osm návrhů", () => {
  const many = parseSuggestions(sug(...Array.from({ length: 15 }, (_, i) => [`Ulice ${i}, Obec ${i}`, `4_${i}`, "Ulice"])));
  assert.equal(rankResults(many, "Ulice").length, MAX_SHOWN);
});

test("adresa dotazu", () => {
  const u = new URL(suggestUrl("Mánesova 12, Praha"));
  assert.equal(u.host, "ags.cuzk.gov.cz");
  assert.match(u.pathname, /Vyhledavaci_sluzba_nad_daty_RUIAN\/MapServer\/exts\/GeocodeSOE\/suggest$/);
  assert.equal(u.searchParams.get("text"), "Mánesova 12, Praha");
  assert.equal(u.searchParams.get("f"), "json");
});

test("bod na ulici a střed ulice", () => {
  const paths = [[[14.0, 50.0], [14.002, 50.0]], [[14.002, 50.0], [14.002, 50.002]]];
  const p = nearestOnPaths(paths, [14.001, 50.0005]);
  assert.ok(Math.abs(p[0] - 14.001) < 1e-9 && Math.abs(p[1] - 50.0) < 1e-9);
  // An L-shaped street: its centre lies off it, the middle is put back on it.
  const m = streetMiddle(paths);
  const onLine = Math.abs(m[1] - 50.0) < 1e-9 || Math.abs(m[0] - 14.002) < 1e-9;
  assert.ok(onLine, String(m));
  assert.equal(streetMiddle([]), null);
  assert.equal(nearestOnPaths([], [14, 50]), null);
});
