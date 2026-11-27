// Address search in Slovakia from ZBGIS (search-sk.js): answers of its find operation as they came on 15. 11. 2026,
// no request.
import { test } from "node:test";
import assert from "node:assert/strict";
import { splitQuery, townMatches, parseStreets, parseTowns, parseAddresses, findSk, locateSk, looksSlovak } from "../app/public/search-sk.js";
import { rankResults } from "../app/public/search.js";

const street = (id, name, town, code = "SK0") => ({ attributes: { STRT_ID: id, STRT_NAME: name, MUNI_NAME: town, MUNI_CODE: code } });
const address = (street, sup, orient, town, lat, lon) => ({ attributes: { "Názov ulice": street, "Súpisné číslo": sup, "Orientačné číslo": orient, "Názov obce": town, "PSČ": "04001",
  "Externý kód obce": "SK0", "Zemepisná šírka (ETRS89)": lat, "Zemepisná dĺžka (ETRS89)": lon } });

test("dotaz: ulice, číslo, město", () => {
  assert.deepEqual(splitQuery("Hlavná 12 Košice"), { name: "Hlavná", number: "12", rest: ["Košice"] });
  assert.deepEqual(splitQuery("Suché mýto"), { name: "Suché mýto", number: "", rest: [] });
  assert.ok(townMatches("Košice-Staré Mesto", ["kosice"]));
  assert.ok(!townMatches("Bratislava-Nové Mesto", ["Košice"]));
  assert.ok(looksSlovak("Hlavná ulica Ľubochňa") && !looksSlovak("Hlavní"));
});

test("odpovědi ZBGIS jako položky hledání", () => {
  const s = parseStreets({ results: [street("1", "Hlavná", "Gajary"), street("1", "Hlavná", "Gajary"), street("2", "Hlavná", "Košice-Staré Mesto")] });
  assert.deepEqual(s.map((i) => i.text), ["Hlavná, Gajary", "Hlavná, Košice-Staré Mesto"]);
  assert.deepEqual(parseTowns({ results: [{ attributes: { NM4: "Trnava", NM3: "Trnava", IDN4: "506" } }] })[0], { text: "Trnava (Trnava)", type: "Obec", sk: { town: "506" } });
  const a = parseAddresses({ results: [address("Hlavná", "12", "18", "Košice-Staré Mesto", "48,7190", "21,2584"), address("Hlavná", "9", "12", "Košice-Staré Mesto", "48,7188", "21,2586"),
    address("Hlavná", "5", "12", "Gajary", "48,4", "17,0")] }, "12", ["Košice"]);
  // The orientation number first; the town named filters.
  assert.deepEqual(a.map((i) => i.text), ["Hlavná 9/12, 04001 Košice-Staré Mesto", "Hlavná 12/18, 04001 Košice-Staré Mesto"]);
  assert.deepEqual([a[0].sk.lat, a[0].sk.lon], [48.7188, 21.2586]);
});

test("Hlavná Košice: ulice v pojmenovaném městě první, poloha z osy ulice", async () => {
  const asked = [];
  const getJSON = async (url) => {
    const u = new URL(url), text = u.searchParams.get("searchText");
    asked.push(`${u.pathname.split("/")[4]} ${text}`);
    if (u.pathname.includes("Ulice_MVSR") && text === "Hlavná") return { results: [street("1", "Hlavná", "Gajary"), street("2", "Hlavná", "Košice-Staré Mesto")] };
    if (u.pathname.includes("Ulice_MVSR") && text === "2") return { results: [{ ...street("2", "Hlavná", "Košice-Staré Mesto"), geometry: { paths: [[[21.258, 48.718], [21.258, 48.722]]] } }] };
    return { results: [] };
  };
  const items = rankResults(await findSk("Hlavná Košice", getJSON), "Hlavná Košice");
  assert.equal(items[0].text, "Hlavná, Košice-Staré Mesto");
  assert.deepEqual(asked.slice(0, 3).sort(), ["Ulice_MVSR Hlavná", "Ulice_MVSR Hlavná Košice", "Uzemnospravne_clenenie Hlavná Košice"]);
  assert.deepEqual(await locateSk(items[0], getJSON), { paths: [[[21.258, 48.718], [21.258, 48.722]]] });
});
