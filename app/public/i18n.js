// Languages of the app (Bára 12. 11. 2026): Czech, Slovak, English and German (Slovak since 15. 11. 2026, German
// since 16. 11. 2026), all 24 official languages of the EU since 17. 11. 2026 (machine translations: a native speaker
// should read them). Every text has a key named in English by where and what it is (Bára 27. 11. 2026: no Czech
// sentences as keys): t("common.sidewalk") is "Chodník" in Czech (locales/cs.json, the source of the texts), "Pavement"
// in English (locales/en.json), "Gehweg" in German. One flat JSON file per language, the format the translators' tools
// (Weblate, Crowdin) read; a new text: node tools/i18n_add.mjs <key> "<cs>" "<en>". The language is never the state of
// the cut (city.country): a German interface on a cut in Prague shows Czech signs, rules and data. {name} in a text
// takes vars.name.
// The language: ?lang=sk in the address, else the visitor's last choice, else the browser's: the first of its
// languages that the app speaks, English for everyone else (Bára). Changing it reloads the page (the cut and the
// design are kept in localStorage), so modules may translate their tables once, when they load.
// Only the page's language is loaded (locales/<lang>.json, by a top-level await: the modules importing i18n.js wait
// for it), not all 24 (docs/architecture-countries.md, point 4); Czech when it cannot be loaded.
// globalThis.PROFILY_LANG sets it for a script or a test (Node has no browser to ask).

// The languages, each named in itself, in the EU's protocol order (by the name in the language itself; Bára
// 17. 11. 2026: names only, no flags, a language is not a state).
export const LANGS = {
  bg: "Български", cs: "Čeština", da: "Dansk", de: "Deutsch", et: "Eesti", el: "Ελληνικά", en: "English", es: "Español",
  fr: "Français", ga: "Gaeilge", hr: "Hrvatski", it: "Italiano", lv: "Latviešu", lt: "Lietuvių", hu: "Magyar", mt: "Malti",
  nl: "Nederlands", pl: "Polski", pt: "Português", ro: "Română", sk: "Slovenčina", sl: "Slovenščina", fi: "Suomi", sv: "Svenska",
};
const KEY = "profily-lang";

function pick() {
  if (globalThis.PROFILY_LANG) return globalThis.PROFILY_LANG;
  if (typeof location === "undefined") return "cs";
  const asked = new URLSearchParams(location.search).get("lang");
  if (Object.hasOwn(LANGS, asked ?? "")) {
    try { localStorage.setItem(KEY, asked); } catch {}
    return asked;
  }
  try { if (Object.hasOwn(LANGS, localStorage.getItem(KEY) ?? "")) return localStorage.getItem(KEY); } catch {}
  const browser = (typeof navigator !== "undefined" && (navigator.languages || [navigator.language])) || [];
  // A browser that tells no language gets English too, as one whose languages the app has none of (Bára 27. 11. 2026).
  for (const l of browser) {
    const code = /^([a-z]{2})\b/i.exec(l || "")?.[1].toLowerCase();
    if (Object.hasOwn(LANGS, code ?? "")) return code;
  }
  return "en";
}
export let lang = pick();
// The texts of the language (locales/<lang>.json): the app's and the page's (data-t), the page's whole elements
// (html.*), the cities' (city.<id>.<field>), the map credits' words (attribution.*). In the browser by fetch, in Node
// (the tests, the tools) from the file.
const readJson = async (name) => {
  const url = new URL(`./locales/${name}.json`, import.meta.url);
  if (url.protocol === "file:") return JSON.parse(globalThis.process.getBuiltinModule("node:fs").readFileSync(url, "utf8"));
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url.pathname}: ${r.status}`);
  return r.json();
};
const load = (l) => readJson(Object.hasOwn(LANGS, l) ? l : "cs");
// What saved cuts and the browser kept in Czech before the keys (27. 11. 2026): the note after the street's name
// (cut.note in a saved file, a link #rez=, the browser's storage) and the name of the base map; the Czech sentence →
// its key. Frozen: a new text never goes here.
let LEGACY = {}, DICT = {}, CITY_TEXTS = {};
const use = (texts) => {
  DICT = texts;
  CITY_TEXTS = {};
  for (const [k, v] of Object.entries(texts)) {
    const m = /^city\.([^.]+)\.(\w+)$/.exec(k);
    if (m) (CITY_TEXTS[m[1]] ??= {})[m[2]] = v;
  }
};
{
  const [texts, legacy] = await Promise.all([load(lang).catch(() => ((lang = "cs"), load("cs"))).catch(() => ({})), readJson("legacy-cs-keys").catch(() => ({}))]);
  use(texts);
  LEGACY = legacy;
}
// The city's texts (city.js) in the language: its server, data and credits as sentences take them. A town without
// texts of its own takes its state's (like); one whose texts are another town's (Boston's metro, Boston's; city.js
// STATE_TOWNS).
const TEXT_ALIAS = { bostonmetro: "boston" };
export const cityTexts = (id, like) => CITY_TEXTS[id] || CITY_TEXTS[TEXT_ALIAS[id]] || CITY_TEXTS[like];
// How the language writes numbers: a decimal comma everywhere but in English, Irish and Maltese (3,50 / 3.50); per cent
// with a space ("44 %": Czech, Slovak, German DIN 5008, French, Spanish, Croatian, Slovenian, the Nordic and Baltic
// languages but Latvian) or without ("44%": English, Irish, Maltese, Dutch, Polish, Italian, Portuguese, Romanian,
// Greek, Bulgarian, Hungarian, Latvian; as the translators reported the norms). Fable: "44%" in English.
const POINT = new Set(["en", "ga", "mt"]);
const PCT_TIGHT = new Set(["en", "ga", "mt", "nl", "pl", "it", "pt", "ro", "el", "bg", "hu", "lv"]);
const comma = () => !POINT.has(lang);

// The text of a key in the page's language, {name} filled from vars. A key it does not know (a text of the data, a
// name) comes back as it is, a Czech sentence of a cut saved before the keys through LEGACY.
export const t = (key, vars) => {
  const s = DICT[key] ?? DICT[LEGACY[key]] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
};

// A key to be translated later, by t(variable): only marks it for tests/i18n.test.js.
export const mark = (key) => key;

// A map layer's credit, written in Czech in the code ("technická mapa © Statutární město Brno"): its common words
// replaced by the language's (attribution.*), in this order (longest first: "technická mapa" before "mapa ©").
const ATTRIBUTION = [["přispěvatelé OpenStreetMap", "attribution.openstreetmapContributors"], ["technická mapa", "attribution.technicalMap"],
  ["účelová mapa", "attribution.thematicMap"], ["objektová mapa", "attribution.objectMap"], ["ortofoto", "attribution.orthophoto"],
  ["mapa ©", "attribution.map"], ["© kraje", "attribution.regions"]];
export const attribution = (text) => ATTRIBUTION.reduce((a, [cs, key]) => a.replaceAll(cs, t(key)), text);

// A number in the language's way: 3,50 in Czech, French or Polish, 3.50 in English.
export const num = (v, digits = 2) => (comma() ? v.toFixed(digits).replace(".", ",") : v.toFixed(digits));
// Per cent as written in the language: "44 %" in Czech, "44%" in English (Fable).
export const pct = (v) => (PCT_TIGHT.has(lang) ? `${Math.round(v)}%` : `${Math.round(v)} %`);
// A number for a field the user types into, without trailing zeros ("2,5", "3"), and back from what was typed (a
// comma or a point); NaN when it is no number. The fields are text, not number, inputs: those show the browser's
// own decimal mark whatever the page's language (Fable: "5,1" in English).
export const numField = (v) => num(v).replace(/[,.]?0+$/, "");
export const readNum = (text) => (/^\s*-?\d*[,.]?\d+\s*$/.test(text) ? Number(text.replace(",", ".")) : NaN);

// Switch the language: remembered, the address loses its ?lang (so it does not win next time). In place where the
// app listens (onLangChange: Bára 16. 11. 2026, a change of language changes the texts and nothing else): the page's
// own texts again from their keys, then the app draws itself anew from its state; else the page reloads.
const listeners = [];
export const onLangChange = (cb) => listeners.push(cb);
export async function setLang(l) {
  try { localStorage.setItem(KEY, l); } catch {}
  const url = new URL(location.href);
  url.searchParams.delete("lang");
  if (!listeners.length) { if (url.href === location.href) location.reload(); else location.replace(url.href); return; }
  history.replaceState(history.state, "", url.href);
  use(await load(l));
  lang = l;
  translatePage();
  for (const cb of listeners) cb(l);
}

// The page's own texts (index.html): an element with data-t="key" gets the key's text (its spaces around kept), an
// attribute named in data-t-<attribute>="key" the key's text, an element with data-t-html="key" the key's HTML (the
// footer with its links). index.html keeps the Czech for a browser without JavaScript and for link previews
// (tests/i18n.test.js: the same as cs.json).
const ATTRS = ["title", "aria-label", "placeholder", "content", "alt", "data-label"];
export function translatePage(root = document) {
  document.documentElement.lang = lang;
  for (const el of root.querySelectorAll("[data-t]")) {
    const n = [...el.childNodes].find((x) => x.nodeType === 3 && x.nodeValue.trim());
    if (n) n.nodeValue = n.nodeValue.replace(/^(\s*)[\s\S]*?(\s*)$/, (m, a, b) => a + t(el.dataset.t) + b);
    else el.textContent = t(el.dataset.t);
  }
  for (const a of ATTRS) for (const el of root.querySelectorAll(`[data-t-${a}]`)) el.setAttribute(a, t(el.getAttribute(`data-t-${a}`)));
  for (const el of root.querySelectorAll("[data-t-html]")) el.innerHTML = t(el.dataset.tHtml);
}
