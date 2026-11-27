// A line of the norms ("cyklopruh: min. 1,5 m, základ 1,85 m (ERA 2010)") told from its parts (Bára 27. 11. 2026, level B of
// docs/i18n-simplify.md): the name of the rule (rule.<id>), the values as numbers with a word from a small set (norm.min,
// norm.std, norm.rec …: "min. {v}", "základ {v}", "doporučeno {v}") and the source as names (a handbook, an act) with the
// words of where in it (norm.table "tab. {n}", norm.article "čl. {n}" …). The numbers are written as the language writes
// them (3,50 / 3.50), a length in feet with its metres. Where a row has conditions or a prose source ("při 50 km/h",
// "podle příručky kantonu Bern") it stays one text of its own: a key of country.<ISO>.<name>.
import { t, ref, text, numField } from "./i18n.js";

const metres = (v) => `${numField(v)} m`;
const feet = (ft) => `${numField(ft)} ft (${metres(ft * 0.3048)})`;
const range = (a, b, f) => `${f(a)}–${f(b)}`;
// A value: 2.5, [2, 2.5], { ft: 10 }, { ft: [10, 12] }, { dims: [2, 6] } (a stall's width × length).
function value(v) {
  if (typeof v === "number") return metres(v);
  if (Array.isArray(v)) return `${numField(v[0])}–${metres(v[1])}`;
  if (v.dims) return `${numField(v.dims[0])} × ${metres(v.dims[1])}`;
  const ft = v.ft;
  return Array.isArray(ft) ? `${numField(ft[0])}–${numField(ft[1])} ft (${range(ft[0] * 0.3048, ft[1] * 0.3048, numField)} m)` : feet(ft);
}
// The source: names as they are, a place in them (["table", "11"]) in the words of the language.
const source = (parts) => parts.map((p) => (typeof p === "string" ? p : text(ref(`norm.${p[0]}`, { n: p[1] })))).join(", ");

// rule: the id of the rule (rule.<id>); values: [[word or null, value], …]; src: the names the line goes by.
export function norm(rule, values, src = []) {
  const shown = values.map(([word, v]) => (word ? text(ref(`norm.${word}`, { v: value(v) })) : value(v))).join(", ");
  const name = text(ref(`rule.${rule}`));
  return src.length ? t("norm.line", { rule: name, values: shown, source: source(src) }) : t("norm.lineNoSource", { rule: name, values: shown });
}
