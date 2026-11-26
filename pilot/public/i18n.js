// Languages of the app (Bára 12. 11. 2026): Czech, Slovak, English and German (Slovak since 15. 11. 2026, German
// since 16. 11. 2026), all 24 official languages of the EU since 17. 11. 2026 (machine translations: a native speaker
// should read them). The Czech text is the key: t("Chodník") is "Sidewalk" in English (en.js), "Chodník" in Slovak
// (sk.js), "Gehweg" in German (de.js), "Trottoir" in French (fr.js), and a text missing there stays Czech. The language
// is never the state of the cut (city.country): a German interface on a cut in Prague shows Czech signs, rules and
// data. {name} in a text takes vars.name.
// The language: ?lang=sk in the address, else the visitor's last choice, else the browser's: the first of its
// languages that the app speaks, English for everyone else (Bára). Changing it reloads the page (the cut and the
// design are kept in localStorage), so modules may translate their tables once, when they load.
// Only the page's language is loaded (<lang>.js, by a top-level await: the modules importing i18n.js wait for it), not
// all 23 tables (docs/architecture-countries.md, point 4).
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
  if (!browser.length) return "cs";
  for (const l of browser) {
    const code = /^([a-z]{2})\b/i.exec(l || "")?.[1].toLowerCase();
    if (Object.hasOwn(LANGS, code ?? "")) return code;
  }
  return "en";
}
export let lang = pick();
// The texts of the language: the app's, the page's whole elements (data-i18n), the city's, the map credits' words
// (<lang>.js exports them as FR, FR_HTML, FR_CITY, FR_ATTRIBUTION).
const CS = [{}, {}, {}, []];
async function load(l) {
  if (l === "cs" || !Object.hasOwn(LANGS, l)) return CS;
  const m = await import(`./${l}.js`), U = l.toUpperCase();
  return [m[U], m[`${U}_HTML`], m[`${U}_CITY`], m[`${U}_ATTRIBUTION`]];
}
let DICT, HTML, CITY_TEXTS, ATTRIBUTION;
const use = (texts) => { [DICT, HTML, CITY_TEXTS, ATTRIBUTION] = texts; };
use(await load(lang).catch(() => ((lang = "cs"), CS)));
// The city's texts (city.js) in the language: its server, data and credits as sentences take them; none in Czech.
// A town whose texts are another town's (Boston's metro, Boston's; city.js STATE_TOWNS).
const TEXT_ALIAS = { bostonmetro: "boston" };
export const cityTexts = (id, like) => CITY_TEXTS[id] || CITY_TEXTS[TEXT_ALIAS[id]] || CITY_TEXTS[like];
// How the language writes numbers: a decimal comma everywhere but in English, Irish and Maltese (3,50 / 3.50); per cent
// with a space ("44 %": Czech, Slovak, German DIN 5008, French, Spanish, Croatian, Slovenian, the Nordic and Baltic
// languages but Latvian) or without ("44%": English, Irish, Maltese, Dutch, Polish, Italian, Portuguese, Romanian,
// Greek, Bulgarian, Hungarian, Latvian; as the translators reported the norms). Fable: "44%" in English.
const POINT = new Set(["en", "ga", "mt"]);
const PCT_TIGHT = new Set(["en", "ga", "mt", "nl", "pl", "it", "pt", "ro", "el", "bg", "hu", "lv"]);
const comma = () => !POINT.has(lang);

export const t = (cs, vars) => {
  const s = DICT[cs] ?? cs;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
};

// A text to be translated later, by t(variable): only marks it for the languages' tables (and tests/i18n.test.js).
export const mark = (cs) => cs;

// A map layer's credit, written in Czech ("technická mapa © Statutární město Brno"): its common words replaced.
export const attribution = (text) => ATTRIBUTION.reduce((a, [cs, other]) => a.replaceAll(cs, other), text);

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
// own texts again from their Czech, then the app draws itself anew from its state; else the page reloads.
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

// The page's own texts (index.html): its text nodes and the attributes people read, looked up whole; an element
// with data-i18n gets the HTML of the language's own (EN_HTML, FR_HTML…) under that name (the footer with its links).
const ATTRS = ["title", "aria-label", "placeholder", "content", "alt", "data-label"];
// Each text keeps its Czech the first time it is translated (a text node's __cs, an attribute's data-cs-<name>, an
// element's __csHtml), so the page can be translated again into another language.
const CS_TITLE = typeof document !== "undefined" ? document.title : "";
export function translatePage(root = document) {
  document.documentElement.lang = lang;
  const walk = document.createTreeWalker(root.body || root, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    n.__cs ??= n.nodeValue;
    const text = n.__cs.trim();
    if (text && (DICT[text] || n.nodeValue !== n.__cs)) n.nodeValue = n.__cs.replace(text, DICT[text] ?? text);
  }
  for (const el of document.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(","))) {
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      if (!el.hasAttribute(`data-cs-${a}`)) el.setAttribute(`data-cs-${a}`, el.getAttribute(a));
      const v = el.getAttribute(`data-cs-${a}`).trim();
      el.setAttribute(a, DICT[v] ?? v);
    }
  }
  for (const el of document.querySelectorAll("[data-i18n]")) {
    el.__csHtml ??= el.innerHTML;
    el.innerHTML = HTML[el.dataset.i18n] ?? el.__csHtml;
  }
  document.title = DICT[CS_TITLE] ?? CS_TITLE;
}
