// Address search in Estonia (Bára 23. 11. 2026): the Land and Spatial Development Board's In-ADS gazetteer
// (aks.geoportaal.ee, CORS *; the old inaadress.maaamet.ee redirects without CORS), one request a pause in typing
// (search.js debounces and cancels). The items look like RÚIAN's (text, type AdresniMisto / Ulice / Obec).
export const INADS = "https://aks.geoportaal.ee/inaks/inaadress/gazetteer";
const MAX = 15;
// A query that is likely Estonian (asked where the map shows another state and nothing else was found).
export const looksEstonian = (text) => /\b(tänav|tn|mnt|maantee|puiestee|pst|tee|väljak|põik)\b|[õäöü]|\b(tallinn|tartu|pärnu|narva|viljandi|rakvere|kuressaare|haapsalu|kohtla-järve)\b/i.test(text);
const KIND = { EHITISHOONE: "AdresniMisto", EHITIS: "AdresniMisto", KATASTRIYKSUS: "AdresniMisto", LIIKLUSPIND: "Ulice", TANAV: "Ulice", ASUSTUSYKSUS: "Obec", OMAVALITSUS: "Obec" };
export function parseEe(json) {
  const out = [];
  for (const a of json?.addresses || []) {
    const lon = Number(a.viitepunkt_l), lat = Number(a.viitepunkt_b), type = KIND[a.liikVal] || "AdresniMisto";
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || !a.ipikkaadress) continue;
    const text = a.ipikkaadress.split(", ").filter((x) => !/maakond$/.test(x)).join(", ");
    out.push({ text, type, at: type === "Ulice" && a.liikluspind ? { lon, lat, street: a.liikluspind } : { lon, lat } });
  }
  const seen = new Set();
  return out.filter((it) => !seen.has(it.text) && seen.add(it.text)).slice(0, MAX);
}
export async function findEe(text, getJSON, signal) {
  const q = String(text || "").trim();
  if (q.length < 3) return [];
  return parseEe(await getJSON(`${INADS}?${new URLSearchParams({ address: q, results: String(MAX), features: "EHITISHOONE,LIIKLUSPIND,ASUSTUSYKSUS,OMAVALITSUS" })}`, signal));
}
