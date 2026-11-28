// The text of a query, shared by the services (search.js asks them, they do not import it back: that was a cycle).

// Lower case, no diacritics, punctuation and hyphens as spaces.
export const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9/]+/g, " ").trim();

// The query split: the street (or town) words, the house number, the remaining words (the town, maybe).
export function splitQuery(text) {
  const words = String(text || "").trim().split(/[\s,]+/).filter(Boolean);
  const i = words.findIndex((w) => /^\d+[a-z]?(\/\d+[a-z]?)?$/i.test(w));
  return i < 0 ? { name: words.join(" "), number: "", rest: [] } : { name: words.slice(0, i).join(" "), number: words[i].toLowerCase(), rest: words.slice(i + 1) };
}
