// What every service's items have in common (they look like RÚIAN's: text, type AdresniMisto / Ulice / Obec…): the label
// shown, the score, the order. The best first (exact street plus town), the order of the services otherwise.
import { t } from "../i18n.js";
import { norm } from "./text.js";

export const MAX_SHOWN = 8;

// The layers of RÚIAN's service, as the magicKey's prefix ("1_1199065" = layer 1, objectid 1199065); the other
// services use the first three types.
export const KINDS = {
  AdresniMisto: { label: t("search.address"), zoom: 19, rank: 25 },
  Ulice: { label: t("common.streetLowercase"), zoom: 19, rank: 30 },
  Obec: { label: t("search.municipality"), zoom: 15, rank: 28 },
  CastObce: { label: t("search.partMunicipality"), zoom: 16, rank: 20 },
  MestskyObvodMestskaCastVeStatutarnimMesteAHlavnimMestePraze: { label: t("search.cityDistrict"), zoom: 15, rank: 18 },
  SpravniObvodVHlavnimMestePraze: { label: t("search.administrativeDistrict"), zoom: 14, rank: 6 },
  KatastralniUzemi: { label: t("search.cadastralArea"), zoom: 15, rank: 12 },
  ZakladniSidelniJednotka: { label: t("search.basicSettlementUnit"), zoom: 17, rank: 8 },
  ParcelaDefinicniBod: { label: t("search.parcel"), zoom: 19, rank: 5 },
  Okres: { label: t("search.district"), zoom: 11, rank: 4 },
  VyssiUzemneSamospravnyCelek: { label: t("search.region"), zoom: 9, rank: 3 },
};
// Statutory cities: a street of the same name elsewhere comes after theirs when the query names no town.
const BIG = new Set(["praha", "brno", "ostrava", "plzen", "liberec", "olomouc", "ceske budejovice", "hradec kralove", "usti nad labem",
  "pardubice", "zlin", "havirov", "kladno", "most", "opava", "frydek mistek", "karvina", "jihlava", "teplice", "decin", "chomutov",
  "jablonec nad nisou", "mlada boleslav", "prostejov", "prerov", "trebic", "trinec", "tabor", "znojmo", "kromeriz", "karlovy vary"]);

// "Mánesova 409/12, Vinohrady, 12000 Praha 2" → main "Mánesova 409/12", sub "Vinohrady, 12000 Praha 2";
// "Manětín (Plzeň-sever)" → "Manětín", "Plzeň-sever".
export function formatLabel(item) {
  const kind = KINDS[item.type]?.label || t("search.place");
  const p = /^(.*?) \(([^)]*)\)$/.exec(item.text);
  if (p) return { main: p[1], sub: p[2], kind };
  const i = item.text.indexOf(", ");
  return i < 0 ? { main: item.text, sub: "", kind } : { main: item.text.slice(0, i), sub: item.text.slice(i + 2), kind };
}

// The name without house numbers and the town (the last part without the PSČ and the district's number).
function parts(item) {
  const { main, sub } = formatLabel(item);
  const name = norm(main.replace(/\s+\d+[a-zA-Z]?(\/\d+[a-zA-Z]?)?$/, ""));
  const numbers = (main.match(/\d+[a-zA-Z]?/g) || []).map((n) => n.toLowerCase());
  const last = sub.split(", ").pop() || "";
  const town = item.type === "Ulice" || item.type === "AdresniMisto" ? norm(last.replace(/^\d{5}\s*/, "").replace(/\s+\d+$/, "")) : "";
  return { name, numbers, town };
}

export function score(item, query) {
  const q = norm(query);
  const words = q.split(" ");
  const qNumbers = words.filter((w) => /^\d+[a-z]?$/.test(w) || /^\d+[a-z]?\/\d+[a-z]?$/.test(w)).flatMap((w) => w.split("/"));
  const { name, numbers, town } = parts(item);
  let s = KINDS[item.type]?.rank ?? 0;
  if (name && (q === name || q.startsWith(name + " "))) s += 40; // the whole name typed
  else if (name && name.startsWith(q)) s += 20; // still typing it
  // Slovakia: the town of a street is a municipality or a city district ("Košice-Staré Mesto"); the words of the
  // query beyond the street's name may name it.
  const extra = words.filter((w) => w && !/^\d/.test(w) && !` ${name} `.includes(` ${w} `));
  const townWords = ` ${town} `;
  const townNamed = town && (` ${q} `.includes(` ${town} `) || (item.sk && extra.length > 0 && extra.every((w) => townWords.includes(` ${w} `))));
  if (townNamed) s += 30;
  else if (item.type === "Ulice" && BIG.has(town)) s += 10; // addresses stay after the streets of other towns
  if (qNumbers.length) {
    if (item.type === "AdresniMisto" && qNumbers.every((n) => numbers.includes(n))) s += 50;
    else if (item.type === "Ulice") s -= 10; // a number asks for an address
  }
  return s;
}

// The best first (exact street plus town), the service's order otherwise; at most MAX_SHOWN.
export function rankResults(items, query, max = MAX_SHOWN) {
  return items.map((it, i) => ({ it, i, s: score(it, query) }))
    .sort((a, b) => b.s - a.s || a.i - b.i).slice(0, max).map((e) => e.it);
}
