// Languages of the app (Bára 12. 11. 2026): Czech, and English for now. The Czech text is the key: t("Chodník")
// is "Sidewalk" in English (en.js), and a text missing there stays Czech. {name} in a text takes vars.name.
// The language: ?lang=en in the address, else the visitor's last choice, else the browser's (Czech and Slovak
// read Czech, everyone else English). Changing it reloads the page (the cut and the design are kept in
// localStorage), so modules may translate their tables once, when they load.
// globalThis.PROFILY_LANG sets it for a script or a test (Node has no browser to ask).
import { EN, EN_HTML, EN_ATTRIBUTION } from "./en.js";

export const LANGS = { cs: "Čeština", en: "English" };
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
  return browser.some((l) => /^(cs|sk)\b/i.test(l || "")) || !browser.length ? "cs" : "en";
}
export const lang = pick();
const DICT = lang === "en" ? EN : {};

export const t = (cs, vars) => {
  const s = DICT[cs] ?? cs;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
};

// A text to be translated later, by t(variable): only marks it for en.js (and tests/i18n.test.js).
export const mark = (cs) => cs;

// A map layer's credit, written in Czech ("technická mapa © Statutární město Brno"): its common words replaced.
export const attribution = (text) => (lang === "cs" ? text : EN_ATTRIBUTION.reduce((a, [cs, en]) => a.replaceAll(cs, en), text));

// A number in the language's way: 3,50 in Czech, 3.50 in English.
export const num = (v, digits = 2) => (lang === "cs" ? v.toFixed(digits).replace(".", ",") : v.toFixed(digits));

// Switch the language: remembered, the address loses its ?lang (so it does not win next time), the page reloads.
export function setLang(l) {
  try { localStorage.setItem(KEY, l); } catch {}
  const url = new URL(location.href);
  url.searchParams.delete("lang");
  if (url.href === location.href) location.reload();
  else location.replace(url.href);
}

// The page's own texts (index.html): its text nodes and the attributes people read, looked up whole; an element
// with data-i18n gets the HTML of EN_HTML under that name (the footer with its links).
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
  for (const el of document.querySelectorAll("[data-i18n]")) if (EN_HTML[el.dataset.i18n]) el.innerHTML = EN_HTML[el.dataset.i18n];
  if (DICT[document.title]) document.title = DICT[document.title];
}
