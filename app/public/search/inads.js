// Address search in Estonia (Bára 23. 11. 2026): the Land and Spatial Development Board's In-ADS gazetteer
// (aks.geoportaal.ee, CORS *; the old inaadress.maaamet.ee redirects without CORS), one request a pause in typing
// (search.js debounces and cancels). The items look like RÚIAN's (text, type AdresniMisto / Ulice / Obec).
// After the hostile review (24. 11. 2026): the service answers 400 to any feature type it does not know (LIIKLUSPIND,
// ASUSTUSYKSUS, OMAVALITSUS, ASUSTUS, ASULA); only the ones in FEATURES were tried and answer 200. Settlements,
// municipalities and counties come as "EHAK".
export const INADS = "https://aks.geoportaal.ee/inaks/inaadress/gazetteer";
export const FEATURES = ["EHITISHOONE", "TANAV", "EHAK"];
const MAX = 15;
// A query that is likely Estonian (asked where the map shows another state and nothing else was found): õ (only
// Estonian among our languages), an Estonian street word or a town's name; ä, ö, ü alone are German, Finnish, Swedish
// and Slovak too.
export const looksEstonian = (text) => /õ|(?<![\p{L}])(tänav|tn|mnt|maantee|puiestee|pst|väljak|põik|tee|linnaosa|vald|alevik|küla)(?![\p{L}])|(?<![\p{L}])(tallinn|tartu|pärnu|narva|viljandi|rakvere|kuressaare|haapsalu|kohtla-järve|paide|valga|võru|jõhvi)(?![\p{L}])/iu.test(text);
const KIND = { EHITISHOONE: "AdresniMisto", EHITIS: "AdresniMisto", KATASTRIYKSUS: "AdresniMisto", TANAV: "Ulice", EHAK: "Obec" };
export function parseEe(json) {
  const out = [];
  for (const a of json?.addresses || []) {
    const lon = Number(a.viitepunkt_l), lat = Number(a.viitepunkt_b), type = KIND[a.liikVal] || "AdresniMisto";
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || !a.ipikkaadress) continue;
    // The county is left out unless it is all there is ("Tartu maakond"); a town that is its own municipality is
    // named twice ("Tartu linn, Tartu linn"): once.
    const parts = String(a.ipikkaadress).split(", ").map((x) => x.trim()).filter(Boolean);
    const short = parts.filter((x, i) => !(/maakond$/.test(x) && parts.length > 1) && x !== parts[i - 1]);
    const text = short.join(", ");
    if (!text) continue;
    out.push({ text, type, at: type === "Ulice" && a.liikluspind ? { lon, lat, street: a.liikluspind } : { lon, lat } });
  }
  const seen = new Set();
  return out.filter((it) => !seen.has(it.text) && seen.add(it.text)).slice(0, MAX);
}
export const eeUrl = (q) => `${INADS}?${new URLSearchParams({ address: q, results: String(MAX), features: FEATURES.join(",") })}`;
export async function findEe(text, getJSON, signal) {
  const q = String(text || "").trim();
  if (q.length < 3) return [];
  return parseEe(await getJSON(eeUrl(q), signal));
}

// Where the map shows Estonia, or an Estonian-looking query nothing else found.
export const inadsService = {
  id: "inads",
  label: "In-ADS",
  merge: 7,
  looksLike: (query, ctx) => ctx.listed("inads") || (!ctx.found("ruian", "zbgis", "pdok", "uug", "photon", "geopf", "cartociudad") && looksEstonian(query)),
  find: (query, ctx) => findEe(query.trim(), ctx.getJSON, ctx.signal),
};
