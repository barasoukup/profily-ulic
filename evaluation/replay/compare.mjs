// Compares two runs of the replay (evaluation/replay/harness.js) cut by cut, field by field: what a visitor would see
// must not change in a rebuild (docs/architecture-countries.md). Prints the differing fields of each cut with the first
// place they differ, and a count per field.
//   node evaluation/replay/compare.mjs <run A> <run B> [--field=svg,credits] [--ignore=city.country] [--show=5]
// --ignore: fields left out (a dot for a key inside one, e.g. city.countryModule); misses: the requests run B asked that
// the recording does not have (a changed request is a change too).
import fs from "node:fs";
import path from "node:path";

import { OUT } from "./paths.mjs";
const args = process.argv.slice(2), opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const [A, B] = args.filter((a) => !a.startsWith("--"));
// A run in Node (node.mjs) writes only some of the fields (its _done.json lists them): only those are compared.
const doneOf = (run) => { try { return JSON.parse(fs.readFileSync(path.join(OUT, run, "_done.json"), "utf8")); } catch { return {}; } };
const nodeFields = doneOf(A).fields || doneOf(B).fields;
const only = opt("field")?.split(",") || nodeFields, ignore = (opt("ignore") || "").split(",").filter(Boolean), SHOW = Number(opt("show") ?? 8);
const ids = (run) => fs.readdirSync(path.join(OUT, run)).filter((f) => /^\d+\.json$/.test(f)).map((f) => +f.slice(0, -5)).sort((a, b) => a - b);
const read = (run, id) => JSON.parse(fs.readFileSync(path.join(OUT, run, `${id}.json`), "utf8"));
const drop = (o) => {
  for (const k of ignore) {
    const [a, ...rest] = k.split(".");
    if (!rest.length) delete o[a];
    else if (o[a] && typeof o[a] === "object") { let x = o[a]; for (const r of rest.slice(0, -1)) x = x?.[r]; if (x) delete x[rest.at(-1)]; }
  }
  return o;
};
// The clip paths of the drawing are numbered by a counter of the page (profile.js): renumbered by first use, so that
// a drawing made after another number of drawings compares equal.
const renum = (s) => { const m = new Map(); return s.replace(/\b(pc|pole|cut)\d+\b/g, (x, p) => (m.has(x) || m.set(x, `${p}${m.size}`), m.get(x))); };
// The page's own elements carry the keys of their texts since 27. 11. 2026 (data-t="…", index.html): not compared.
const noKeys = (s) => s.replace(/ data-t(?:-[\w-]+)?="[^"]*"/g, "");
// --digits=N: numbers compared to N significant digits (a run in Node against one in the page: their engines' Math.sin,
// cos, atan2 … differ in the last bit, README "Přehrávka v Node").
const DIGITS = opt("digits") ? Number(opt("digits")) : null;
const round = DIGITS ? (_, v) => (typeof v === "number" && !Number.isInteger(v) ? +v.toPrecision(DIGITS) : v) : undefined;
const text = (v) => (v === undefined ? undefined : noKeys(renum(typeof v === "string" ? v : JSON.stringify(v, round))));
const where = (a, b) => {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return `@${i}: «${a.slice(Math.max(0, i - 60), i + 80)}» ≠ «${b.slice(Math.max(0, i - 60), i + 80)}»`;
};
// Since the keys of the texts (27. 11. 2026): a cut keeps its note as a key, not its Czech ("note.mapDown"), and the
// city's texts come last in the composed city (from locales/<lang>.json): the note is compared as its Czech
// (locales/cs.json), the city with its fields in one order. What a visitor sees is the same.
const CS = (() => { try { return JSON.parse(fs.readFileSync(new URL("../../app/public/locales/cs.json", import.meta.url), "utf8")); } catch { return {}; } })();
const sorted = (v) => (Array.isArray(v) ? v.map(sorted) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sorted(v[k])])) : v);
const csNote = (c) => { if (c && typeof c.note === "string" && CS[c.note] !== undefined) c.note = CS[c.note]; };
const a = ids(A), bs = new Set(ids(B)), count = {};
let same = 0, diff = 0, shown = 0;
const missing = a.filter((id) => !bs.has(id));
for (const id of a) {
  if (!bs.has(id)) continue;
  const x = drop(read(A, id)), y = drop(read(B, id));
  // Of the console's notes the uncaught errors count (warnings name timings and retries, which may differ).
  for (const o of [x, y]) o.errors = (o.notes || []).filter((n) => /^(uncaught|unhandled):/.test(n));
  const keys = [...new Set([...Object.keys(x), ...Object.keys(y)])].filter((k) => !only || only.includes(k)).filter((k) => k !== "notes");
  // Porovnat as the page shows it: its drawings are laid out by measuring the labels in the window (not repeatable), so
  // only its titles and list of changes count; the drawings are those of the export (svg, svgNavrh).
  for (const o of [x, y]) if (typeof o.compare === "string") o.compare = o.compare.replace(/<svg[\s\S]*?<\/svg>/g, "<svg/>");
  // A failure's stack names ports and lines of the harness: its message (first line) is what counts.
  for (const o of [x, y]) if (typeof o.failed === "string") o.failed = o.failed.split("\n")[0];
  for (const o of [x, y]) { csNote(o.cut); csNote(o.restored?.cut); if (o.city) o.city = sorted(o.city); }
  const bad = keys.filter((k) => text(x[k]) !== text(y[k]));
  if (!bad.length) { same++; continue; }
  diff++;
  for (const k of bad) count[k] = (count[k] || 0) + 1;
  if (shown++ < SHOW) {
    console.log(`— řez ${id} (${x.town}): ${bad.join(", ")}`);
    for (const k of bad.slice(0, 4)) console.log(`   ${k} ${where(text(x[k]) ?? "", text(y[k]) ?? "")}`);
  }
}
// A run that found no street anywhere would compare equal to itself: how many cuts of each run have a profile.
const stats = (run) => { let ok = 0, no = 0, fail = 0, miss = 0; for (const id of ids(run)) { const o = read(run, id); if (o.failed) fail++; else if (o.stav) ok++; else no++; if (o.misses?.length) miss++; } return `${ok} s profilem, ${no} bez, ${fail} spadlo, ${miss} s chybějící odpovědí`; };
console.log(`${A}: ${stats(A)}\n${B}: ${stats(B)}`);
console.log(`${A} → ${B}: ${same} stejně, ${diff} jinak${missing.length ? `, ${missing.length} chybí v ${B}` : ""}${diff ? " · " + Object.entries(count).map(([k, n]) => `${k} ${n}`).join(", ") : ""}`);
process.exitCode = diff || missing.length ? 1 : 0;
