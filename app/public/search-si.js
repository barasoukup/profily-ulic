// Address search in Slovenia (Bára 23. 11. 2026): Photon of komoot in the local language for free text (search-photon.js
// "photon-si"), and the house numbers of GURS's register (Kataster nepremičnin WFS, layer NASLOVI_HS, CORS *, CC BY 4.0)
// for a query with a number: the street's beginning and the number, as RÚIAN's address points (a FES filter; the server
// matches the beginning of the name, no full text). One request a pause in typing (search.js debounces and cancels).
export const GURS_NASLOVI = "https://ipi.eprostor.gov.si/wfs-si-gurs-kn/wfs";
const MAX = 15;
// A query that is likely Slovenian (asked where the map shows another state and nothing else was found): a Slovenian
// town, or a street word with no letter Slovenian lacks ("ulica" is Slovak, Polish and Croatian too, "cesta" Czech,
// "trg" Croatian: "Hlavná ulica", "Trg bana Jelačića" stay at home; the review of 24. 11. 2026) and "ulica" after the
// name as Slovenian has it ("Celovška ulica", not the Polish "ulica Długa").
const SI_TOWN = /(^|[^\p{L}])(ljubljana|maribor|celje|kranj|koper|velenje|novo mesto|ptuj|nova gorica|murska sobota|piran|bled)(?!\p{L})/iu;
const SI_WORD = /(^|[^\p{L}])(cesta|trg|nabrežje|pot)(?!\p{L})|\p{L}\s+ulica(?!\p{L})/iu;
export const looksSlovenian = (text) => SI_TOWN.test(text) || (SI_WORD.test(text) && !/[^a-zčšž]/i.test(text.replace(/[^\p{L}]/gu, "")));
// "Trubarjeva cesta 5a, Ljubljana" → { street, number, extra, town } (null without a house number). The number is the
// last one before the town, and a number with a full stop is a date of the street's name ("Cesta 27. aprila 31",
// "Ulica 1. maja"; the review of 24. 11. 2026).
export function parseSiQuery(text) {
  const m = /^\s*(.+)\s+(\d{1,4})(?!\d|\.)([a-zA-Z](?!\p{L}))?\s*(?:,\s*|\s+)?([^\d,][^,\d]*)?\s*$/u.exec(String(text || ""));
  if (!m || m[1].replace(/[^\p{L}]/gu, "").length < 3) return null;
  return { street: m[1].trim(), number: Number(m[2]), extra: m[3]?.toUpperCase() || null, town: m[4]?.trim() || null };
}
// "." is the filter's single character, so the date's full stop of "Cesta 27. aprila" matches itself.
const lit = (s) => s.replace(/[*!<>&"']/g, "");
const like = (field, value) => `<fes:PropertyIsLike wildCard="*" singleChar="." escapeChar="!" matchCase="false"><fes:ValueReference>${field}</fes:ValueReference><fes:Literal>${lit(value)}*</fes:Literal></fes:PropertyIsLike>`;
export function gursAddressUrl(q) {
  const parts = [like("ULICA_NAZIV", q.street), `<fes:PropertyIsEqualTo><fes:ValueReference>HS_STEVILKA</fes:ValueReference><fes:Literal>${q.number}</fes:Literal></fes:PropertyIsEqualTo>`, ...(q.town ? [like("NASELJE_NAZIV", q.town)] : [])];
  const filter = `<fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0"><fes:And>${parts.join("")}</fes:And></fes:Filter>`;
  return `${GURS_NASLOVI}?${new URLSearchParams({ SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: "SI.GURS.KN:NASLOVI_HS", outputFormat: "application/json", srsName: "EPSG:4326",
    count: String(MAX), PROPERTYNAME: "ULICA_NAZIV,HS_STEVILKA,HS_DODATEK,NASELJE_NAZIV,GEOM", FILTER: filter })}`;
}
// The items look like RÚIAN's (text, type AdresniMisto); with a letter asked, only that one.
export function parseSi(json, q = null) {
  const out = [];
  for (const f of json?.features || []) {
    const p = f.properties || {}, c = f.geometry?.coordinates;
    if (!c || !p.ULICA_NAZIV || p.HS_STEVILKA == null) continue;
    if (q?.extra && String(p.HS_DODATEK || "").toUpperCase() !== q.extra) continue;
    out.push({ text: `${p.ULICA_NAZIV} ${p.HS_STEVILKA}${p.HS_DODATEK ? p.HS_DODATEK.toLowerCase() : ""}, ${p.NASELJE_NAZIV}`, type: "AdresniMisto", at: { lon: c[0], lat: c[1], street: p.ULICA_NAZIV } });
  }
  const seen = new Set();
  return out.filter((it) => !seen.has(it.text) && seen.add(it.text)).slice(0, MAX);
}
export async function findSi(text, getJSON, signal) {
  const q = parseSiQuery(text);
  return q ? parseSi(await getJSON(gursAddressUrl(q), signal), q) : [];
}
