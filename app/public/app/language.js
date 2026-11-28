// The page's texts translated, and the language menu (the last item of the Soubor menu).
import { lang, LANGS, setLang, translatePage } from "../i18n.js";
import { state } from "./state.js";

translatePage();
// The languages, the last item of the Soubor menu (Bára 17. 11. 2026: hidden there, the browser's language decides
// first), each named in itself, without flags (24 languages: a language is not a state, Irish and English would mix).
{
  const list = document.querySelector("#lang-list");
  document.querySelector("#lang-current").textContent = LANGS[lang];
  for (const l of Object.keys(LANGS)) {
    const b = document.createElement("button");
    b.lang = l;
    b.textContent = LANGS[l];
    if (l === lang) b.setAttribute("aria-current", "true");
    // The page reloads in the other language: the mode goes along (Fable: Návrh fell back to Stav).
    // The tab's own cut goes along too (Bára: the profile was derived again): the browser keeps one saved cut for all
    // its tabs, the last one derived, so another tab's reload would not find its own.
    b.onclick = () => { if (l === lang) return; try { sessionStorage.setItem("profily-rezim", state.mode); if (state.stav) sessionStorage.setItem("profily-tab", JSON.stringify({ cut: state.cut, stav: state.stav, navrh: state.navrh, navrhEdited: state.navrhEdited })); } catch {} setLang(l); };
    list.append(b);
  }
}
