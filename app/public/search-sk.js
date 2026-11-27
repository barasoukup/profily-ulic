// Address search in Slovakia (Bára 15. 11. 2026): RÚIAN knows the Czech Republic only. ZBGIS of ÚGKK SR answers
// the browser (CORS) with its find operation (its query answers 503): the streets of the Ministry of the Interior
// (Ulice_MVSR, axes as lines), the municipalities (Uzemnospravne_clenenie, layer Obec) and the address points of the
// Register of addresses (RA_Adresne_body). find matches a whole field (or a part of it) only, so "Hlavná Košice" is
// asked as "Hlavná" and the town is told apart here. Asked only where Slovakia is likely (search.js), with the same
// debounce and cancelling as RÚIAN. The items look like RÚIAN's (text "street, town", type Ulice/Obec/AdresniMisto)
// so search.js ranks them together; sk carries what locate needs.
import { norm } from "./search.js";

export const ZBGIS = "https://zbgis.skgeodesy.sk/zbgis/rest/services";
const STREETS = `${ZBGIS}/Ulice_MVSR/MapServer`;
const ADMIN = `${ZBGIS}/Uzemnospravne_clenenie/MapServer`;
const ADDRESSES = `${ZBGIS}/RA_Adresne_body/MapServer`;
const MAX = 40; // items kept from one answer (a common name has hundreds of streets)

// Slovak letters that Czech does not have: a query typed in Slovak.
export const looksSlovak = (text) => /[äôľĺŕ]/i.test(text);

// A field of a find answer, by its name or its alias (ZBGIS gives either, layer by layer).
const field = (a, ...names) => { for (const n of names) if (a?.[n] !== undefined && a[n] !== "Null") return String(a[n]).trim(); return ""; };
const findUrl = (service, params) => `${service}/find?${new URLSearchParams({ contains: "true", returnGeometry: "false", f: "json", ...params })}`;

// The query split: the street (or town) words, the house number, the remaining words (the town, maybe).
export function splitQuery(text) {
  const words = String(text || "").trim().split(/[\s,]+/).filter(Boolean);
  const i = words.findIndex((w) => /^\d+[a-z]?(\/\d+[a-z]?)?$/i.test(w));
  return i < 0 ? { name: words.join(" "), number: "", rest: [] } : { name: words.slice(0, i).join(" "), number: words[i].toLowerCase(), rest: words.slice(i + 1) };
}
// Does the town (a municipality, a city district "Košice-Staré Mesto") match the words given for it?
export const townMatches = (town, words) => {
  const t = ` ${norm(town)} `;
  return words.length > 0 && words.every((w) => t.includes(` ${norm(w)} `));
};

export function parseStreets(json) {
  const seen = new Set(), out = [];
  for (const r of json?.results || []) {
    const a = r.attributes, name = field(a, "STRT_NAME", "Názov ulice"), town = field(a, "MUNI_NAME", "Názov obce"), id = field(a, "STRT_ID");
    if (!name || !id || seen.has(id)) continue;
    seen.add(id);
    out.push({ text: `${name}, ${town}`, type: "Ulice", sk: { street: id } });
  }
  return out;
}
export function parseTowns(json) {
  const seen = new Set(), out = [];
  for (const r of json?.results || []) {
    const a = r.attributes, name = field(a, "NM4", "Názov obce"), district = field(a, "NM3", "Názov okresu"), id = field(a, "IDN4", "Číslo obce");
    if (!name || !id || seen.has(id)) continue;
    seen.add(id);
    out.push({ text: district ? `${name} (${district})` : name, type: "Obec", sk: { town: id } });
  }
  return out;
}
// Address points of a street, those with the number asked for (orientation or registration number).
export function parseAddresses(json, number, townWords = []) {
  const out = [];
  for (const r of json?.results || []) {
    const a = r.attributes;
    const street = field(a, "STREETNAME", "Názov ulice"), town = field(a, "MUNICIPALITYNAME", "Názov obce");
    const sup = field(a, "PROPERTYREGISTRATIONNUMBER", "Súpisné číslo"), orient = field(a, "BUILDINGNUMBER", "Orientačné číslo").toLowerCase();
    const [n1, n2] = number.split("/");
    // "12": the orientation number first (the one on the street), the registration number after it.
    const fits = n2 ? sup === n1 && orient === n2 : orient === n1 || sup === n1;
    if (!fits || (townWords.length && !townMatches(town, townWords))) continue;
    const lat = parseFloat(field(a, "ADDRESSPOINTAXISB", "Zemepisná šírka (ETRS89)").replace(",", "."));
    const lon = parseFloat(field(a, "ADDRESSPOINTAXISL", "Zemepisná dĺžka (ETRS89)").replace(",", "."));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const no = sup && orient ? `${sup}/${orient}` : sup || orient;
    out.push({ byOrient: !n2 && orient === n1, text: `${street} ${no}, ${field(a, "POSTALCODE", "PSČ")} ${town}`.replace(/\s+/g, " "), type: "AdresniMisto", sk: { lat, lon, streetName: street, townCode: field(a, "MUNICIPALITYCODE", "Externý kód obce") } });
  }
  return out.sort((a, b) => b.byOrient - a.byOrient).map(({ byOrient, ...it }) => it);
}

// The items for a query: streets (the whole query, else without its last words, which may be the town), towns,
// and with a house number the address points. getJSON(url, signal) is search.js's.
export async function findSk(text, getJSON, signal) {
  const { name, number, rest } = splitQuery(text);
  if (norm(name).length < 3) return [];
  const words = name.split(" ");
  const streetsOf = async (n) => parseStreets(await getJSON(findUrl(STREETS, { searchText: n, layers: "0", searchFields: "STRT_NAME" }), signal));
  const towns = number ? Promise.resolve([]) : getJSON(findUrl(ADMIN, { searchText: name, layers: "3", searchFields: "NM4" }), signal).then(parseTowns, () => []);
  let streets = await streetsOf(name), townWords = rest;
  // "Hlavná Košice": no street of that name; the street is "Hlavná", the rest names its town.
  for (let k = words.length - 1; !streets.length && k >= 1 && words.length - k <= 2; k--) {
    streets = (await streetsOf(words.slice(0, k).join(" "))).filter((s) => townMatches(s.text.split(", ")[1], words.slice(k)));
    if (streets.length) townWords = [...words.slice(k), ...rest];
  }
  // A town named after the number (or found above): its streets first, before the first MAX are kept.
  if (townWords.length) streets.sort((a, b) => townMatches(b.text.split(", ")[1], townWords) - townMatches(a.text.split(", ")[1], townWords));
  let addresses = [];
  if (number) {
    const street = streets[0]?.text.split(", ")[0] || name;
    addresses = parseAddresses(await getJSON(findUrl(ADDRESSES, { searchText: street, contains: "false", layers: "0", searchFields: "STREETNAME" }), signal), number, townWords);
  }
  return [...addresses, ...streets, ...(await towns)].slice(0, MAX);
}

// Where a chosen item of Slovakia goes ({ lon, lat, paths } or a point): the street's axis, the town's outline
// simplified, the address point.
export async function locateSk(item, getJSON, signal) {
  if (item.sk.street) {
    const r = (await getJSON(findUrl(STREETS, { searchText: item.sk.street, contains: "false", layers: "0", searchFields: "STRT_ID", returnGeometry: "true", sr: "4326", maxAllowableOffset: "0.00001" }), signal)).results?.[0];
    return { paths: r?.geometry?.paths || null };
  }
  if (item.sk.town) {
    const r = (await getJSON(findUrl(ADMIN, { searchText: item.sk.town, contains: "false", layers: "3", searchFields: "IDN4", returnGeometry: "true", sr: "4326", maxAllowableOffset: "0.002" }), signal)).results?.[0];
    const pts = (r?.geometry?.rings || []).flat();
    if (!pts.length) return {};
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    return { point: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2] };
  }
  // An address: the axis of its street in its town, for the point of the street nearest to the house.
  const found = await getJSON(findUrl(STREETS, { searchText: item.sk.streetName, contains: "false", layers: "0", searchFields: "STRT_NAME", returnGeometry: "true", sr: "4326", maxAllowableOffset: "0.00001" }), signal).catch(() => null);
  const own = (found?.results || []).find((r) => field(r.attributes, "MUNI_CODE") === item.sk.townCode);
  return { point: [item.sk.lon, item.sk.lat], paths: own?.geometry?.paths || null };
}
