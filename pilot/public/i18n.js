// Languages of the app (Bára 12. 11. 2026): Czech, Slovak and English (Slovak since 15. 11. 2026). The Czech
// text is the key: t("Chodník") is "Sidewalk" in English (en.js), "Chodník" in Slovak (sk.js), and a text missing
// there stays Czech. {name} in a text takes vars.name.
// The language: ?lang=sk in the address, else the visitor's last choice, else the browser's: the first of its
// languages that the app speaks, English for everyone else (Bára). Changing it reloads the page (the cut and the
// design are kept in localStorage), so modules may translate their tables once, when they load.
// globalThis.PROFILY_LANG sets it for a script or a test (Node has no browser to ask).
import { EN, EN_HTML, EN_CITY, EN_ATTRIBUTION } from "./en.js";
import { SK, SK_HTML, SK_CITY, SK_ATTRIBUTION } from "./sk.js";

export const LANGS = { cs: "Čeština", sk: "Slovenčina", en: "English" };
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
export const lang = pick();
// The texts of the language: the app's, the page's whole elements (data-i18n), the city's, the map credits' words.
const TEXTS = { cs: [{}, {}, {}, []], en: [EN, EN_HTML, EN_CITY, EN_ATTRIBUTION], sk: [SK, SK_HTML, SK_CITY, SK_ATTRIBUTION] };
const [DICT, HTML, CITY_TEXTS, ATTRIBUTION] = TEXTS[lang] || TEXTS.cs;
// The city's texts (city.js) in the language: its server, data and credits as sentences take them; none in Czech.
export const cityTexts = (id, like) => CITY_TEXTS[id] || CITY_TEXTS[like];
// Czech and Slovak write numbers alike (3,50 and "44 %"), English its own way.
const COMMA = lang !== "en";

export const t = (cs, vars) => {
  const s = DICT[cs] ?? cs;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
};

// A text to be translated later, by t(variable): only marks it for en.js and sk.js (and tests/i18n.test.js).
export const mark = (cs) => cs;

// A map layer's credit, written in Czech ("technická mapa © Statutární město Brno"): its common words replaced.
export const attribution = (text) => ATTRIBUTION.reduce((a, [cs, other]) => a.replaceAll(cs, other), text);

// A number in the language's way: 3,50 in Czech and Slovak, 3.50 in English.
export const num = (v, digits = 2) => (COMMA ? v.toFixed(digits).replace(".", ",") : v.toFixed(digits));
// Per cent as written in the language: "44 %" in Czech, "44%" in English (Fable).
export const pct = (v) => (COMMA ? `${Math.round(v)} %` : `${Math.round(v)}%`);
// A number for a field the user types into, without trailing zeros ("2,5", "3"), and back from what was typed (a
// comma or a point); NaN when it is no number. The fields are text, not number, inputs: those show the browser's
// own decimal mark whatever the page's language (Fable: "5,1" in English).
export const numField = (v) => num(v).replace(/[,.]?0+$/, "");
export const readNum = (text) => (/^\s*-?\d*[,.]?\d+\s*$/.test(text) ? Number(text.replace(",", ".")) : NaN);

// Switch the language: remembered, the address loses its ?lang (so it does not win next time), the page reloads.
export function setLang(l) {
  try { localStorage.setItem(KEY, l); } catch {}
  const url = new URL(location.href);
  url.searchParams.delete("lang");
  if (url.href === location.href) location.reload();
  else location.replace(url.href);
}

// The page's own texts (index.html): its text nodes and the attributes people read, looked up whole; an element
// with data-i18n gets the HTML of the language's own (EN_HTML, SK_HTML) under that name (the footer with its links).
const ATTRS = ["title", "aria-label", "placeholder", "content", "alt", "data-label"];
export function translatePage(root = document) {
  document.documentElement.lang = lang;
  if (lang === "cs") return;
  const walk = document.createTreeWalker(root.body || root, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const text = n.nodeValue.trim();
    if (text && DICT[text]) n.nodeValue = n.nodeValue.replace(text, DICT[text]);
  }
  for (const el of document.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(","))) {
    for (const a of ATTRS) {
      const v = el.getAttribute(a)?.trim();
      if (v && DICT[v]) el.setAttribute(a, DICT[v]);
    }
  }
  for (const el of document.querySelectorAll("[data-i18n]")) if (HTML[el.dataset.i18n]) el.innerHTML = HTML[el.dataset.i18n];
  if (DICT[document.title]) document.title = DICT[document.title];
}
