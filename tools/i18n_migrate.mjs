// One-off conversion of the translations (Bára 27. 11. 2026, variant A of docs/i18n-plan.md on the branch i18n-plan): the Czech sentence as the
// key → named keys and one standard JSON file per language (app/public/locales/<lang>.json, flat: "area.name": "text"),
// Czech a language like the others (cs.json). Run once on the code before the conversion (it reads the old
// app/public/<lang>.js tables and rewrites the code); kept for the record of how the keys came about.
//   node tools/i18n_migrate.mjs            → writes locales/*.json, rewrites the code and index.html, deletes <lang>.js
//   node tools/i18n_migrate.mjs --dry      → only prints the keys (locales/_keys.tsv is not written either)
// What it does:
// 1. reads the old tables (EN, EN_HTML, EN_CITY, EN_ATTRIBUTION and their equivalents) of the 23 languages;
// 2. names each of the texts: <area>.<words of its English>, the area by where the code uses it (the file; "common"
//    for a text of more files, "note" for the notes after the street's name, "page" for index.html);
// 3. writes locales/<lang>.json (texts, html.footer, city.<id>.<field>, attribution.<name>) and
//    locales/legacy-cs-keys.json (the Czech sentence → key of what saved cuts and the browser kept in Czech);
// 4. rewrites t("…"), tr("…"), mark("…") in the code to the keys, the texts that flow through variables (notes,
//    credits of orthophotos, base map names), the city's texts out of city.js, and index.html to data-t attributes.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const PUB = path.join(ROOT, "app", "public");
const DRY = process.argv.includes("--dry");
const LANGS = ["bg", "cs", "da", "de", "et", "el", "en", "es", "fr", "ga", "hr", "it", "lv", "lt", "hu", "mt", "nl", "pl", "pt", "ro", "sk", "sl", "fi", "sv"];
const OTHER = LANGS.filter((l) => l !== "cs");
const read = (f) => fs.readFileSync(path.join(PUB, f), "utf8");
const write = (f, s) => { if (!DRY) fs.writeFileSync(path.join(PUB, f), s); };

// ---------- 1. the old tables ----------
const OLD = {};
for (const l of OTHER) {
  const m = await import(path.join(PUB, `${l}.js`)), U = l.toUpperCase();
  OLD[l] = { texts: m[U], html: m[`${U}_HTML`], city: m[`${U}_CITY`], attribution: m[`${U}_ATTRIBUTION`] };
}
const EN = OLD.en.texts;
// The Czech city texts as city.js has them (cs: no table, the city's own fields).
const { cityById } = await import(path.join(PUB, "city.js"));
const FIELDS = ["server", "dataName", "dataShort", "techMap", "parkingSource", "rulesHead", "credit"];

// ---------- 2. where the code uses each text ----------
const FILES = [...fs.readdirSync(PUB).filter((f) => f.endsWith(".js")), ...["towns", "countries"].flatMap((d) => fs.readdirSync(path.join(PUB, d)).map((f) => `${d}/${f}`))]
  .filter((f) => f.endsWith(".js") && !LANGS.some((l) => f === `${l}.js`));
const CALL = /\b(t|tr|mark)\(\s*"((?:[^"\\]|\\.)*)"/g;
const uses = new Map(); // cs → Map(file → count)
const use = (cs, f) => { if (!uses.has(cs)) uses.set(cs, new Map()); uses.get(cs).set(f, (uses.get(cs).get(f) || 0) + 1); };
for (const f of FILES) for (const m of read(f).matchAll(CALL)) use(JSON.parse(`"${m[2]}"`), f);

// index.html: the text nodes and attributes translatePage looked up whole.
const HTML_SRC = read("index.html");
const ATTRS = ["title", "aria-label", "placeholder", "content", "alt", "data-label"];
const pageWork = [];
{
  const skip = []; // [from, to) of <script>, <style>, <noscript> and the footer replaced whole
  for (const m of HTML_SRC.matchAll(/<(script|style|noscript)\b[\s\S]*?<\/\1>/g)) skip.push([m.index, m.index + m[0].length]);
  const foot = /<div data-i18n="footer">/.exec(HTML_SRC);
  const footEnd = HTML_SRC.indexOf("</details>", foot.index);
  skip.push([foot.index + foot[0].length, HTML_SRC.lastIndexOf("</div>", footEnd)]);
  const inSkip = (i) => skip.some(([a, b]) => i >= a && i < b);
  const bodyAt = HTML_SRC.indexOf("<body");
  // Text between tags.
  for (const m of HTML_SRC.matchAll(/>([^<]+)</g)) {
    const at = m.index + 1;
    if (at < bodyAt || inSkip(at)) continue;
    const text = m[1].trim();
    if (!text) continue;
    if (/\s{2,}|\n/.test(text) && EN[text.replace(/\s+/g, " ")] !== undefined) console.warn("víceřádkový text stránky (dřív se nepřekládal):", text);
    if (EN[text] === undefined) continue;
    use(text, "index.html");
    pageWork.push({ kind: "text", at, len: m[1].length, raw: m[1], text });
  }
  // Attributes (head and body: the old translatePage looked them up over the whole document).
  for (const m of HTML_SRC.matchAll(/<(\w+)\b[^>]*>/g)) {
    if (inSkip(m.index)) continue;
    for (const a of ATTRS) {
      const v = new RegExp(`\\s${a}="([^"]*)"`).exec(m[0]);
      if (!v || EN[v[1].trim()] === undefined) continue;
      use(v[1].trim(), "index.html");
      pageWork.push({ kind: "attr", at: m.index, tag: m[0], attr: a, text: v[1].trim() });
    }
  }
  const title = /<title>([^<]*)<\/title>/.exec(HTML_SRC);
  if (EN[title[1]] !== undefined) { use(title[1], "index.html"); pageWork.push({ kind: "title", at: title.index, text: title[1] }); }
}

// ---------- 3. the keys ----------
const STOP = new Set("a an the of to and or is are be been it its this that these those for in on at by with from as than then there here into per s".split(" "));
const ascii = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const words = (en) => ascii(en.replace(/<[^>]+>/g, " ").replace(/\{(\w+)\}/g, " $1 ").replace(/[’']s\b/g, ""))
  .split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w.toLowerCase()).filter((w) => !STOP.has(w))
  .filter((w, i, a) => w !== a[i - 1]);
const camel = (ws) => ws.map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w)).join("");
const stem = (f) => camel(path.basename(f, ".js").split(/[^A-Za-z0-9]+/).map((w) => w.toLowerCase()));
const AREA = { "city.js": "cities", "maplayers.js": "layers", "index.html": "page" };
function areaOf(cs) {
  if (cs.startsWith(" · ")) return "note";
  const files = [...(uses.get(cs) || new Map()).keys()];
  if (!files.length) throw new Error(`nikde nepoužitý text: ${cs}`);
  if (files.length > 1) return "common";
  const f = files[0];
  if (AREA[f]) return AREA[f];
  if (f.startsWith("countries/")) return `country.${stem(f)}`;
  if (f.startsWith("towns/")) return `town.${stem(f)}`;
  return stem(f);
}
const KEY = new Map(); // cs → key
const taken = new Set();
function name(area, en) {
  const ws = words(en);
  if (!ws.length) ws.push("text");
  if (/^\d/.test(ws[0])) ws.unshift("n");
  for (let n = Math.min(4, ws.length); n <= Math.min(ws.length, 8); n++) {
    const k = `${area}.${camel(ws.slice(0, n)).slice(0, 48)}`;
    if (!taken.has(k)) return taken.add(k), k;
  }
  const base = `${area}.${camel(ws.slice(0, 4)).slice(0, 48)}`;
  for (let i = 2; ; i++) if (!taken.has(`${base}${i}`)) return taken.add(`${base}${i}`), `${base}${i}`;
}
for (const cs of Object.keys(EN)) KEY.set(cs, name(areaOf(cs), EN[cs]));
// Names the words of the English made worse (read through after the first run).
const RENAME = {
  "note.surfaceMapDidNot": "note.mapDown", "note.officialCadastralSurveyDid": "note.cadastralSurveyDown",
  "note.newYorkSurfaceMap": "note.newYorkMapDown", "note.sanFranciscoSurfaceMap": "note.sanFranciscoMapDown",
  "about.baraSoukup": "about.authorFullName", "about.eMailDoesNot": "about.emailInvalid",
  "common.pavement": "common.sidewalk", "types.pavement": "types.onSidewalk", "types.halfPavement": "types.halfOnSidewalk",
  "types.pavementCyclingAllowed": "types.sidewalkCyclingAllowed", "common.street2": "common.streetLowercase", "common.parking2": "common.parkingLowercase",
  "cities.weDonTCover": "cities.closedCyprus", "cities.italyWeMakeProfiles": "cities.closedItaly", "cities.usaWeCurrentlyMake": "cities.closedUsa",
  "cities.canadaWeCurrentlyMake": "cities.closedCanada",
};
for (const k of KEY.values()) { const m = /^note\.(\w+)SurfaceMapDid$/.exec(k); if (m) RENAME[k] = `note.${m[1]}MapDown`; }
for (const [cs, k] of KEY) if (RENAME[k]) { if (taken.has(RENAME[k])) throw new Error(`obsazeno: ${RENAME[k]}`); taken.add(RENAME[k]); KEY.set(cs, RENAME[k]); }
for (const cs of uses.keys()) if (!KEY.has(cs)) throw new Error(`text bez překladu v en.js: ${cs}`);
const key = (cs) => { const k = KEY.get(cs); if (!k) throw new Error(`neznámý text: ${cs}`); return k; };

// The map credits' words (i18n.js attribution): their Czech is what is looked for in a credit.
const ATTR_KEYS = OLD.en.attribution.map(([cs, en]) => [cs, name("attribution", en)]);

// ---------- 4. the files of the languages ----------
// The city's texts: of the ids that have their own (the others take their state's, city.js like), the fields that are
// texts (null and "" stay in city.js: no map, no credit).
const OWN = Object.keys(OLD.en.city);
const cityEntries = (get) => {
  const out = {};
  for (const id of OWN) for (const f of FIELDS) {
    const v = get(id)?.[f];
    if (typeof v === "string" && v !== "") out[`city.${id}.${f}`] = v;
  }
  return out;
};
const csHtmlFooter = (() => { const a = HTML_SRC.indexOf('<div data-i18n="footer">') + '<div data-i18n="footer">'.length; return HTML_SRC.slice(a, HTML_SRC.indexOf("</div>", HTML_SRC.indexOf("</a><br>", a))); })();
const tables = { cs: {} };
for (const cs of KEY.keys()) tables.cs[KEY.get(cs)] = cs;
tables.cs["html.footer"] = csHtmlFooter;
Object.assign(tables.cs, cityEntries((id) => cityById(id)));
for (const [cs, k] of ATTR_KEYS) tables.cs[k] = cs;
for (const l of OTHER) {
  const o = OLD[l], tab = {};
  for (const [cs, k] of KEY) { if (typeof o.texts[cs] !== "string") throw new Error(`${l}: chybí ${cs}`); tab[k] = o.texts[cs]; }
  tab["html.footer"] = o.html.footer;
  Object.assign(tab, cityEntries((id) => o.city[id]));
  const own = new Map(o.attribution);
  for (const [cs, k] of ATTR_KEYS) tab[k] = own.get(cs);
  tables[l] = tab;
}
// Every language has the keys of Czech, no more.
const csKeys = Object.keys(tables.cs).sort();
for (const l of OTHER) {
  const ks = Object.keys(tables[l]).sort();
  const extra = ks.filter((k) => !(k in tables.cs)), missing = csKeys.filter((k) => !(k in tables[l]));
  if (extra.length || missing.length) throw new Error(`${l}: navíc ${extra.join(", ")}; chybí ${missing.join(", ")}`);
}
const sorted = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
if (!DRY) fs.mkdirSync(path.join(PUB, "locales"), { recursive: true });
for (const l of LANGS) write(`locales/${l}.json`, JSON.stringify(sorted(tables[l]), null, 1) + "\n");
// What saved cuts and the browser kept in Czech: the notes after the street's name (cut.note, in a saved file, a link
// #rez=, localStorage, sessionStorage) and the names of the base maps (localStorage, "Technická mapa" before 17. 11. 2026).
const LEGACY = {};
for (const cs of KEY.keys()) if (cs.startsWith(" · ")) LEGACY[cs] = KEY.get(cs);
for (const cs of ["Mapa", "Ortofoto", "Mapa povrchů"]) LEGACY[cs] = key(cs);
LEGACY["Technická mapa"] = key("Mapa povrchů");
write("locales/legacy-cs-keys.json", JSON.stringify(sorted(LEGACY), null, 1) + "\n");
if (DRY) {
  for (const [cs, k] of KEY) console.log(`${k}\t${cs.slice(0, 80)}`);
  process.exit(0);
}

// ---------- 5. the code ----------
const lit = (s) => JSON.stringify(s);
const edit = (f, fn) => { const a = read(f), b = fn(a); if (a !== b) write(f, b); };
const must = (src, from, to, f) => { if (!src.includes(from)) throw new Error(`${f}: nenašla jsem ${from}`); return src.split(from).join(to); };
for (const f of FILES) edit(f, (src) => src.replace(CALL, (m, fn, s) => `${fn}(${lit(key(JSON.parse(`"${s}"`)))}`));

// Texts that flow through variables: the notes app.js writes itself, the base maps remembered by name, Belgium's
// orthophoto credits, the orthophotos whose credit lanes-ortho.js names.
edit("app.js", (src) => {
  src = must(src, 'import { t as tr, num,', 'import { t as tr, mark, num,', "app.js");
  src = must(src, '" · odhad z ortofota a OSM" : " · jen odhad z OSM"', `mark(${lit(key(" · odhad z ortofota a OSM"))}) : mark(${lit(key(" · jen odhad z OSM"))})`, "app.js");
  src = must(src, `// Remembered by its Czech name, so that the choice holds in either language.
const baseCs = Object.fromEntries(["Mapa", "Ortofoto", "Mapa povrchů", "OpenStreetMap"].map((cs) => [tr(cs), cs]));`,
  `// Remembered by its key, so that the choice holds in any language (OpenStreetMap by its name; a name remembered in Czech
// before 27. 11. 2026, locales/legacy-cs-keys.json).
const baseCs = Object.fromEntries([mark(${lit(key("Mapa"))}), mark(${lit(key("Ortofoto"))}), mark(${lit(key("Mapa povrchů"))}), "OpenStreetMap"].map((k) => [tr(k), k]));`, "app.js");
  src = must(src, `// "Technická mapa" is "Mapa povrchů" since 17. 11. 2026 (Bára: one name in every state): the old choice holds.
try { const saved = tr(localStorage.getItem(BASE_KEY)?.replace(/^Technická mapa$/, "Mapa povrchů") || ""); if (baseMaps[saved]) baseName = saved; } catch {}`,
  `// "Technická mapa" is "Mapa povrchů" since 17. 11. 2026 (Bára: one name in every state): the old choice holds
// (locales/legacy-cs-keys.json).
try { const saved = tr(localStorage.getItem(BASE_KEY) || ""); if (baseMaps[saved]) baseName = saved; } catch {}`, "app.js");
  for (const cs of ["ortofoto © SPW (Service public de Wallonie, CC BY 4.0)", "ortofoto: Bron: Luchtopnamen Digitaal Vlaanderen (Modellicentie gratis hergebruik v1.0)"]) {
    src = must(src, `, ${lit(cs)});`, `, mark(${lit(key(cs))}));`, "app.js");
  }
  return src;
});
edit("lanes-ortho.js", (src) => src.replace(/credit: ("(?:[^"\\]|\\.)*")/g, (m, s) => (KEY.has(JSON.parse(s)) ? `credit: ${lit(key(JSON.parse(s)))}` : m)));
edit("sources.js", (src) => must(src, "// The note is the Czech text (mark): the cut keeps it so, app.js translates it when it shows it.",
  "// The note is a key (mark): the cut keeps it so, app.js translates it when it shows it (a cut saved before 27. 11. 2026\n// keeps the Czech text: locales/legacy-cs-keys.json).", "sources.js"));
edit("app.js", (src) => must(src, "only (empty for a street without one) and its note as the Czech text, so a saved cut reads in either language",
  "only (empty for a street without one) and its note as a key (i18n.js), so a saved cut reads in any language", "app.js"));

// The city's texts leave city.js: they are city.<id>.<field> in locales/<lang>.json (cs.json the Czech).
edit("city.js", (src) => {
  const F = FIELDS.join("|");
  // Whole lines of a field with a text.
  src = src.replace(new RegExp(`^[ \\t]*(?:${F}): "(?:[^"\\\\]|\\\\.)+",?[ \\t]*(?://.*)?\\n`, "gm"), "");
  // Fields on a line with others (the states abroad, their helper): the texts out, null and "" stay.
  src = src.replace(new RegExp(`(?:${F}): "(?:[^"\\\\]|\\\\.)+",\\s*`, "g"), "");
  src = src.replace(new RegExp(`,\\s*(?:${F}): "(?:[^"\\\\]|\\\\.)+"(?=\\s*\\})`, "g"), "");
  return src;
});

// ---------- 6. index.html ----------
{
  let html = HTML_SRC;
  // From the end, so that the places found stay valid.
  const work = [...pageWork].sort((a, b) => b.at - a.at || (a.kind === "attr" ? 1 : -1));
  const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
  for (const w of work) {
    const k = key(w.text);
    if (w.kind === "title") { html = html.slice(0, w.at) + `<title data-t="${k}">` + html.slice(w.at + "<title>".length); continue; }
    if (w.kind === "attr") {
      const tag = html.slice(w.at, html.indexOf(">", w.at) + 1);
      const end = tag.endsWith("/>") ? tag.length - 2 : tag.length - 1;
      html = html.slice(0, w.at) + tag.slice(0, end) + ` data-t-${w.attr}="${k}"` + tag.slice(end) + html.slice(w.at + tag.length);
      continue;
    }
    // A text: the element's only content → data-t on the element; else in a span of its own.
    const before = html.lastIndexOf("<", w.at - 1), open = html.slice(before, w.at);
    const after = html.slice(w.at + w.len);
    const tag = /^<(\w+)\b/.exec(open)?.[1];
    const sole = tag && !VOID.test(tag) && !open.endsWith("/>") && after.startsWith(`</${tag}>`);
    if (sole) html = html.slice(0, before) + open.slice(0, -1) + ` data-t="${k}">` + html.slice(w.at);
    else {
      const [, lead, , trail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(w.raw);
      html = html.slice(0, w.at) + `${lead}<span data-t="${k}">${w.text}</span>${trail}` + html.slice(w.at + w.len);
    }
  }
  html = must(html, '<div data-i18n="footer">', '<div data-t-html="html.footer">', "index.html");
  write("index.html", html);
}

// ---------- 7. the old tables go ----------
for (const l of OTHER) fs.unlinkSync(path.join(PUB, `${l}.js`));
console.log(`${KEY.size} textů, ${Object.keys(tables.cs).length} klíčů v každém z ${LANGS.length} jazyků, ${pageWork.length} míst v index.html, ${Object.keys(LEGACY).length} starých českých textů`);
