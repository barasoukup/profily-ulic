// The last cut kept in the browser (localStorage), and the switches it was made under.
import { flagPairs } from "../flags.js";
import { LANES_ORTHO } from "./options.js";
import { state } from "./state.js";

export const STORE = "streetdesign-pilot" + (LANES_ORTHO ? "" : "-bez-orto"); // the last cut (Prague's key from the time of one page per city); ?orto=0 its own
export function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({ cut: state.cut, stav: state.stav, navrh: state.navrh, navrhEdited: state.navrhEdited, opts: optsKey() }));
  } catch {}
}
// The link's switches but the language (?ai=1, ?pasport=0…): a cut saved under others is derived again, not restored.
export function optsKey() {
  return flagPairs().sort().map(([k, v]) => `${k}=${v}`).join("&");
}
