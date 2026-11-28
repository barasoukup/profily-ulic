// Address search (app/public/search.js): the answers of the RÚIAN search service of ČÚZK parsed, ranked
// (the street of the named town first, an address with the typed number first) and labelled.
import { test } from "node:test";
import assert from "node:assert/strict";
import { norm } from "../app/public/search/text.js";
import { rankResults, formatLabel, score, MAX_SHOWN } from "../app/public/search/rank.js";
import { nearestOnPaths, streetMiddle } from "../app/public/search/geometry.js";
import { parseSuggestions, suggestUrl } from "../app/public/search/ruian.js";

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

// ---------- which services ask, in what order, and what the person sees (plan step 16) ----------
// Characterisation: about 45 queries on the map of different states and places, each with synthetic answers (no network).
// The expected requests, options, notes and picks are in fixtures/search-behaviour.json; the registry of searches must
// give the same. To write the file again after an intended change: UPDATE_SEARCH=1 node --test tests/search.test.js
import fs from "node:fs";
import { mountSearch } from "../app/public/search.js";
import { setDkToken } from "../app/public/keys.js";
import { installPage, shown } from "./helpers/search-harness.js";

const FIXTURE = new URL("./fixtures/search-behaviour.json", import.meta.url);
const feat = (properties, lon, lat) => ({ properties, geometry: { coordinates: [lon, lat] } });
const photonStreet = (name, lon, lat, cc, city) => feat({ osm_key: "highway", name, countrycode: cc, city }, lon, lat);
const photonAddress = (street, no, lon, lat, cc, city) => feat({ street, housenumber: no, countrycode: cc, city, postcode: "1" }, lon, lat);
const photonTown = (name, lon, lat, cc) => feat({ osm_key: "place", osm_value: "city", name, countrycode: cc, state: "S" }, lon, lat);
const skStreet = (id, name, town, paths) => ({ attributes: { STRT_ID: id, STRT_NAME: name, MUNI_NAME: town, MUNI_CODE: "KE" }, geometry: { paths } });
const skAddress = (street, sup, orient, town, lat, lon) => ({ attributes: { "Názov ulice": street, "Súpisné číslo": sup, "Orientačné číslo": orient, "Názov obce": town, "PSČ": "04001", "Externý kód obce": "KE", "Zemepisná šírka (ETRS89)": lat, "Zemepisná dĺžka (ETRS89)": lon } });
const wienPoint = (name, street, onr, plz, lon, lat) => ({ properties: { NAME: name, NAME_STR: street, ONR_VON: onr, PLZ: plz }, geometry: { type: "Point", coordinates: [lon, lat] } });
const line = (...pts) => ({ type: "LineString", coordinates: pts });
const PRAGUE = [50.08, 14.43], BRATISLAVA = [48.15, 17.11], KOSICE = [48.72, 21.26], VIENNA = [48.2, 16.37], GRAZ = [47.07, 15.44], BERLIN = [52.52, 13.4], ZURICH = [47.37, 8.54],
  BRUSSELS = [50.85, 4.35], SF = [37.77, -122.42], AMSTERDAM = [52.37, 4.9], KRAKOW = [50.06, 19.94], PARIS = [48.86, 2.35], MADRID = [40.42, -3.7], TALLINN = [59.44, 24.75],
  LJUBLJANA = [46.05, 14.5], HELSINKI = [60.17, 24.94], COPENHAGEN = [55.68, 12.57];
const RUIAN_STREET = [["/4/query", { features: [{ geometry: { paths: [[[14.43, 50.08], [14.431, 50.081], [14.432, 50.082]]] } }] }]];
const RUIAN_ADDRESS = [["/1/query", { features: [{ geometry: { x: 14.431, y: 50.0805 }, attributes: { ulice: 123 } }] }], ...RUIAN_STREET];
const czSuggest = sug(["Mánesova 12, Vinohrady, 12000 Praha 2", "1_100", "AdresniMisto"], ["Mánesova, Praha", "4_36012", "Ulice"], ["Mánesova, Kladno", "4_36013", "Ulice"], ["Praha (Praha)", "12_5", "Obec"]);
const photonDE = [["photon.komoot.io", { features: [photonAddress("Unter den Linden", "1", 13.39, 52.517, "DE", "Berlin"), photonStreet("Unter den Linden", 13.38, 52.516, "DE", "Berlin"), photonStreet("Unter den Linden", 13.38, 52.516, "AT", "Wien")] }]];
const nlDoc = [["api.pdok.nl", { response: { docs: [{ type: "adres", weergavenaam: "Prinsengracht 263, Amsterdam", centroide_ll: "POINT(4.884 52.375)", straatnaam: "Prinsengracht" }] } }]];
const plHit = { results: { 1: { x: "19.94", y: "50.06", street: "ulica Floriańska", number: "3", city: "Kraków", code: "31-021" } } };
const eeHit = [["aks.geoportaal.ee", { addresses: [{ liikVal: "EHITISHOONE", viitepunkt_l: "24.76", viitepunkt_b: "59.43", ipikkaadress: "Narva mnt 10, Tallinn, Harju maakond" }] }]];
const guHit = [["ipi.eprostor.gov.si", { features: [{ properties: { ULICA_NAZIV: "Trubarjeva cesta", HS_STEVILKA: 5, NASELJE_NAZIV: "Ljubljana" }, geometry: { coordinates: [14.51, 46.05] } }] }]];
const wienAddress = [["ADRESSENOGD", { features: [wienPoint("Neubaugasse 12-14", "Neubaugasse", "12", "1070", 16.3497, 48.1993)] }], ["STRASSENGRAPHOGD", { features: [{ geometry: line([16.349, 48.199], [16.351, 48.1996]) }] }]];
const dkAddress = [{ husnummertekst: "10", visningstekst: "Nørrebrogade 10, 2200 København N", vejnavn: "Nørrebrogade", geometri: { coordinates: [[12.55, 55.69]] } }];
const photonDK = [["photon.komoot.io", { features: [photonStreet("Nørrebrogade", 12.55, 55.69, "DK", "København")] }]];

// Each case: services (countries/<ISO>.js search), center of the map, where it is (inVienna, inCzechia), the query, the answers and a pick.
const CASES = [
  { name: "CZ: adresa v Praze, výběr adresy", services: [], center: PRAGUE, text: "Mánesova 12 Praha", replies: [["GeocodeSOE/suggest", czSuggest], ...RUIAN_ADDRESS], pick: 0 },
  { name: "CZ: ulice v Praze, výběr ulice", services: [], center: PRAGUE, text: "Mánesova", replies: [["GeocodeSOE/suggest", czSuggest], ...RUIAN_STREET], pick: 1 },
  { name: "CZ: obec, výběr bez řezu", services: [], center: PRAGUE, text: "Praha", replies: [["GeocodeSOE/suggest", czSuggest], ["findAddressCandidates", { candidates: [{ location: { x: 14.42, y: 50.09 } }] }]], pick: 0 },
  { name: "CZ: dotaz krátký, nic se neptá", services: [], center: PRAGUE, text: "Ma", replies: [] },
  { name: "CZ: prázdný výsledek", services: [], center: PRAGUE, text: "xyzxyzxyz", replies: [] },
  { name: "CZ: výpadek RÚIAN je chyba", services: [], center: PRAGUE, text: "Mánesova", replies: [["GeocodeSOE/suggest", { status: 503 }]] },
  { name: "CZ: výběr selže, hlásí chybu", services: [], center: PRAGUE, text: "Mánesova", replies: [["GeocodeSOE/suggest", czSuggest], ["/4/query", { status: 503 }]], pick: 1 },
  { name: "CZ: slovenská písmena, RÚIAN a ZBGIS naráz", services: [], center: PRAGUE, text: "Hlavná Ľubochňa", replies: [["GeocodeSOE/suggest", sug(["Hlavní, Brno", "4_9", "Ulice"])], ["Ulice_MVSR", { results: [skStreet("77", "Hlavná", "Ľubochňa")] }]] },
  { name: "CZ: německy vypadající dotaz, který RÚIAN nenajde", services: [], center: PRAGUE, text: "Hauptstraße 5 Berlin", replies: photonDE },
  { name: "CZ: dotaz s Wien, Vídeň a Photon", services: [], center: PRAGUE, text: "Praterstraße Wien", replies: [["ADRESSENOGD", { features: [wienPoint("Praterstraße 20", "Praterstraße", "20", "1020", 16.39, 48.215)] }], ["photon.komoot.io", { features: [photonStreet("Praterstraße", 16.4, 48.216, "AT", "Wien")] }]] },
  { name: "CZ: holandsky vypadající dotaz", services: [], center: PRAGUE, text: "Prinsengracht 263", replies: nlDoc },
  { name: "CZ: polský dotaz, UUG napoprvé prázdné, podruhé najde", services: [], center: PRAGUE, text: "Floriańska 3, Kraków", replies: [["address=Krak", plHit]] },
  { name: "CZ: polský dotaz, UUG nic, Photon v Polsku", services: [], center: PRAGUE, text: "ulica Długa 5", replies: [["photon.komoot.io", { features: [photonStreet("Długa", 19.9, 50.07, "PL", "Kraków")] }]] },
  { name: "CZ: francouzský dotaz, nic jiného nenašlo", services: [], center: PRAGUE, text: "rue de Rivoli Paris", replies: [["data.geopf.fr", { features: [{ properties: { type: "street", label: "Rue de Rivoli 75001 Paris", street: "Rue de Rivoli" }, geometry: { coordinates: [2.34, 48.86] } }] }]] },
  { name: "CZ: španělský dotaz, CartoCiudad s find", services: [], center: PRAGUE, text: "calle Mayor Madrid", replies: [["/candidates", [{ type: "callejero", address: "CALLE MAYOR, Madrid", id: "9" }, { type: "portal", address: "CALLE MAYOR 3", portalNumber: 3, muni: "Madrid", lat: 40.41, lng: -3.7 }]], ["/find", { geom: "LINESTRING(-3.7 40.41,-3.71 40.42)", address: "CALLE MAYOR, Madrid" }]] },
  { name: "CZ: estonský dotaz", services: [], center: PRAGUE, text: "Narva mnt 10 Tallinn", replies: eeHit },
  { name: "CZ: slovinský dotaz s číslem, GURS a Photon", services: [], center: PRAGUE, text: "Trubarjeva cesta 5 Ljubljana", replies: [...guHit, ["photon.komoot.io", { features: [photonStreet("Trubarjeva cesta", 14.5, 46.05, "SI", "Ljubljana")] }]] },
  { name: "CZ: finský dotaz s číslem, Ryhti a Photon", services: [], center: PRAGUE, text: "Mannerheimintie 5 Helsinki", replies: [["paikkatiedot.ymparisto.fi", { features: [{ properties: { address_fin: "Mannerheimintie 5", address_name_fin: "Mannerheimintie", postal_office_fin: "HELSINKI" }, geometry: { coordinates: [24.94, 60.17] } }] }]] },
  { name: "CZ: nic nepřipomíná jinou zemi", services: [], center: PRAGUE, text: "qwertzuiop", replies: [] },
  { name: "SK: ulice a město, výběr ulice", services: ["zbgis"], center: KOSICE, inCzechia: false, text: "Hlavná Košice", replies: [["Ulice_MVSR", { results: [skStreet("1", "Hlavná", "Gajary", [[[17.0, 48.4], [17.001, 48.401]]]), skStreet("2", "Hlavná", "Košice-Staré Mesto", [[[21.258, 48.718], [21.258, 48.722]]])] }]], pick: 0 },
  { name: "SK: adresa s číslem, výběr adresy", services: ["zbgis"], center: KOSICE, inCzechia: false, text: "Hlavná 12 Košice", replies: [["Ulice_MVSR", { results: [skStreet("2", "Hlavná", "Košice-Staré Mesto", [[[21.258, 48.718], [21.258, 48.722]]])] }], ["RA_Adresne_body", { results: [skAddress("Hlavná", "9", "12", "Košice-Staré Mesto", "48,7188", "21,2586")] }]], pick: 0 },
  { name: "SK: obec, výběr obce", services: ["zbgis"], center: BRATISLAVA, inCzechia: false, text: "Trnava", replies: [["Uzemnospravne_clenenie", { results: [{ attributes: { NM4: "Trnava", NM3: "Trnava", IDN4: "506" }, geometry: { rings: [[[17.5, 48.3], [17.7, 48.4]]] } }] }]], pick: 0 },
  { name: "SK: nic nenajde, RÚIAN až nakonec", services: ["zbgis"], center: BRATISLAVA, inCzechia: false, text: "xyzxyzxyz", replies: [] },
  { name: "SK: výpadek ZBGIS i RÚIAN, nic nenalezeno", services: ["zbgis"], center: BRATISLAVA, inCzechia: false, text: "Hlavná", replies: [["zbgis.skgeodesy.sk", { status: 503 }], ["ags.cuzk.gov.cz", { status: 503 }]] },
  { name: "SK: český dotaz v Bratislavě, RÚIAN najde jen pozdě", services: ["zbgis"], center: BRATISLAVA, inCzechia: false, text: "Mánesova Praha", replies: [["GeocodeSOE/suggest", czSuggest]] },
  { name: "AT: Vídeň, adresa s číslem, výběr", services: ["photon"], center: VIENNA, inVienna: true, inCzechia: false, text: "Neubaugasse 12", replies: wienAddress, pick: 0 },
  { name: "AT: Vídeň, ulice, k tomu Photon", services: ["photon"], center: VIENNA, inVienna: true, inCzechia: false, text: "Mariahilfer Straße", replies: [["ADRESSENOGD", { features: [wienPoint("a 1", "Mariahilfer Straße", "1", "1060", 16.3, 48.2), wienPoint("a 9", "Mariahilfer Straße", "9", "1060", 16.31, 48.201)] }], ["photon.komoot.io", { features: [photonStreet("Mariahilfer Straße", 16.3, 48.2, "AT", "Wien")] }]] },
  { name: "AT: Graz jen Photon", services: ["photon"], center: GRAZ, inCzechia: false, text: "Herrengasse", replies: [["photon.komoot.io", { features: [photonStreet("Herrengasse", 15.44, 47.07, "AT", "Graz"), photonTown("Graz", 15.44, 47.07, "AT")] }]] },
  { name: "AT: výpadek Vídně, Photon zůstane", services: ["photon"], center: VIENNA, inVienna: true, inCzechia: false, text: "Neubaugasse", replies: [["data.wien.gv.at", { status: 500 }], ["photon.komoot.io", { features: [photonStreet("Neubaugasse", 16.35, 48.2, "AT", "Wien")] }]] },
  { name: "DE: Berlín Photon u středu mapy, výběr", services: ["photon-de"], center: BERLIN, inCzechia: false, text: "Unter den Linden 1", replies: photonDE, pick: 0 },
  { name: "CH: Curych, Photon CH a LI", services: ["photon-ch"], center: ZURICH, inCzechia: false, text: "Bahnhofstrasse Zürich", replies: [["photon.komoot.io", { features: [photonStreet("Bahnhofstrasse", 8.54, 47.37, "CH", "Zürich")] }]] },
  { name: "BE: Brusel, Photon BE a LU", services: ["photon-be"], center: BRUSSELS, inCzechia: false, text: "Rue Neuve", replies: [["photon.komoot.io", { features: [photonStreet("Rue Neuve", 4.35, 50.85, "BE", "Bruxelles")] }]] },
  { name: "US: San Francisco, jeden dotaz s obdélníkem metra", services: ["photon-us"], center: SF, inCzechia: false, text: "Market Street San Francisco", replies: [["photon.komoot.io", { features: [photonStreet("Market Street", -122.41, 37.78, "US", "San Francisco")] }]] },
  { name: "NL: PDOK, výběr adresy", services: ["pdok"], center: AMSTERDAM, inCzechia: false, text: "Prinsengracht 263", replies: nlDoc, pick: 0 },
  { name: "PL: UUG, třetí tvar dotazu, výběr", services: ["uug"], center: KRAKOW, inCzechia: false, text: "Kraków Floriańska 3", replies: [["address=Krak%C3%B3w%2C", plHit]], pick: 0 },
  { name: "PL: UUG nic, Photon v Polsku", services: ["uug"], center: KRAKOW, inCzechia: false, text: "Floriańska", replies: [["photon.komoot.io", { features: [photonStreet("Floriańska", 19.94, 50.06, "PL", "Kraków")] }]] },
  { name: "FR: Géoplateforme u středu mapy", services: ["geopf"], center: PARIS, inCzechia: false, text: "rue de Rivoli", replies: [["data.geopf.fr", { features: [{ properties: { type: "housenumber", label: "1 Rue de Rivoli 75004 Paris", street: "Rue de Rivoli" }, geometry: { coordinates: [2.36, 48.855] } }] }]], pick: 0 },
  { name: "ES: CartoCiudad s find pro první", services: ["cartociudad"], center: MADRID, inCzechia: false, text: "Gran Via", replies: [["/candidates", [{ type: "callejero", address: "CALLE GRAN VIA, Madrid", id: "5" }]], ["/find", { geom: "MULTILINESTRING((-3.7 40.42,-3.71 40.421))", address: "CALLE GRAN VIA, Madrid" }]] },
  { name: "EE: In-ADS", services: ["inads"], center: TALLINN, inCzechia: false, text: "Narva mnt 10", replies: eeHit },
  { name: "SI: Photon SI a GURS s číslem", services: ["photon-si", "gurs"], center: LJUBLJANA, inCzechia: false, text: "Trubarjeva cesta 5", replies: [...guHit, ["photon.komoot.io", { features: [photonStreet("Trubarjeva cesta", 14.5, 46.05, "SI", "Ljubljana")] }]] },
  { name: "FI: Photon FI a Ryhti, první dotaz prázdný, druhý najde", services: ["photon-fi", "ryhti"], center: HELSINKI, inCzechia: false, text: "Bulevardi 5 Helsinki", replies: [["ILIKE", { features: [{ properties: { address_fin: "Bulevardi 5", address_name_fin: "Bulevardi", postal_office_fin: "HELSINKI" }, geometry: { coordinates: [24.94, 60.165] } }] }]] },
  { name: "DK: GSearch s tokenem, adresa, Photon se neptá", services: ["gsearch", "photon-dk"], center: COPENHAGEN, inCzechia: false, token: true, text: "Nørrebrogade 10", replies: [["gsearch/v2.0/husnummer", dkAddress]], pick: 0 },
  { name: "DK: GSearch s tokenem, ulice a obce", services: ["gsearch", "photon-dk"], center: COPENHAGEN, inCzechia: false, token: true, text: "Odense", replies: [["navngivenvej", [{ vejnavn: "Odensevej", visningstekst: "Odensevej, Odense", geometri: { type: "LineString", coordinates: [[10.4, 55.4], [10.41, 55.41]] } }]], ["stednavn", [{ stednavn_type: "bebyggelse", skrivemaade: "Odense", visningstekst: "Odense", bbox: { type: "Polygon", coordinates: [[[10.3, 55.3], [10.5, 55.5]]] } }]]] },
  { name: "DK: token odmítnut (401), Photon DK", services: ["gsearch", "photon-dk"], center: COPENHAGEN, inCzechia: false, token: true, text: "Nørrebrogade", replies: [["api.dataforsyningen.dk", { status: 401 }], ...photonDK] },
  { name: "DK: bez tokenu, jen Photon DK", services: ["gsearch", "photon-dk"], center: COPENHAGEN, inCzechia: false, token: false, text: "Nørrebrogade", replies: photonDK },
  { name: "SK mapa: německý dotaz, Photon", services: ["zbgis"], center: BRATISLAVA, inCzechia: false, text: "Hauptstraße 5", replies: photonDE },
];

async function runCase(c) {
  const page = installPage({ replies: c.replies, center: c.center });
  setDkToken(c.token ? "test-token" : "");
  try {
    let status = null, picked = null;
    mountSearch(page.map, {
      status: (msg, kind) => { status = [msg, kind]; page.settle?.(); },
      onPick: (p) => { picked = { item: p.item.text, cut: p.cut && [+p.cut.lon.toFixed(5), +p.cut.lat.toFixed(5)] }; page.settle?.(); },
      services: () => c.services, inVienna: () => !!c.inVienna, inCzechia: () => c.inCzechia !== false,
    });
    const shownOnce = new Promise((resolve) => { page.list.onReplace = resolve; });
    page.input.value = c.text;
    page.input.fire("keydown", { key: "Enter" });
    if (c.text.trim().length >= 3) await shownOnce; else await new Promise((r) => setImmediate(r));
    const out = { requests: [...page.requests], ...shown(page.list), warns: page.warns.length };
    if (c.pick !== undefined) {
      const before = page.requests.length;
      const done = new Promise((resolve) => { page.settle = resolve; });
      page.list.children[c.pick].fire("click");
      await done;
      out.pick = { requests: page.requests.slice(before), view: page.views[0] || null, picked, status };
    }
    return out;
  } finally { page.done(); setDkToken(""); }
}

test("hledání: každá služba, pořadí dotazů a to, co uživatel uvidí, se nemění", async () => {
  const got = {};
  for (const c of CASES) got[c.name] = await runCase(c);
  if (process.env.UPDATE_SEARCH) fs.writeFileSync(FIXTURE, JSON.stringify(got, null, 1) + "\n");
  const want = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  assert.deepEqual(Object.keys(got), Object.keys(want));
  for (const name of Object.keys(want)) assert.deepEqual(got[name], want[name], name);
});

test("hledání: stejný dotaz podruhé z paměti, bez nového dotazu na službu", async () => {
  const page = installPage({ replies: [["GeocodeSOE/suggest", czSuggest]], center: PRAGUE });
  try {
    mountSearch(page.map, { status() {}, onPick() {}, services: () => [], inCzechia: () => true });
    for (let i = 0; i < 2; i++) {
      const again = new Promise((resolve) => { page.list.onReplace = resolve; });
      page.input.value = "Mánesova"; page.list.hidden = true; page.list.children = [];
      page.input.fire("keydown", { key: "Enter" });
      await again;
    }
    assert.equal(page.requests.length, 1);
  } finally { page.done(); }
});

// ---------- the registry itself ----------
import { SERVICES } from "../app/public/search/registry.js";

test("registr hledání: služby mají id, looksLike a find, id i merge jsou jedinečné", () => {
  for (const s of SERVICES) {
    assert.equal(typeof s.id, "string");
    assert.equal(typeof s.looksLike, "function", s.id);
    assert.equal(typeof s.find, "function", s.id);
  }
  assert.equal(new Set(SERVICES.map((s) => s.id)).size, SERVICES.length);
  assert.equal(new Set(SERVICES.map((s) => s.merge)).size, SERVICES.length, "pořadí položek při shodě skóre je jednoznačné");
  assert.equal(SERVICES.filter((s) => s.parallel).length, 1, "jen RÚIAN a ZBGIS se ptají naráz");
});

test("registr hledání: každé id v countries/<ISO>.js search je služba registru nebo Photon", async () => {
  const known = new Set([...SERVICES.map((s) => s.id), "photon"]);
  const dir = new URL("../app/public/countries/", import.meta.url);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".js"))) {
    const mod = await import(new URL(f, dir));
    for (const country of Object.values(mod).filter((v) => Array.isArray(v?.search))) {
      for (const id of country.search) assert.ok(known.has(id) || id.startsWith("photon-"), `${f}: ${id}`);
    }
  }
});
