// The About dialog (Bára 24. 11. 2026; menu Soubor → O aplikaci): what the app does and who made it, the overview map of
// where it has which data (coverage.json, made by tools/build_coverage.mjs from the modules) and a message to Bára
// through the Worker of logging/ (POST /contact, the same Worker as the log of cuts). No e-mail address on the page.
import { t } from "./i18n.js";
import { LOG_URL } from "./config.js";

// The Worker's address for messages: the log's (LOG_URL, filled by the deploy) with /contact; none without it.
export const CONTACT_URL = LOG_URL ? new URL("/contact", LOG_URL).href : "";
export const CONTACT_MAX = 3000;

// A message to the Worker: "ok", "off" (no Worker set or none answering), "limit" (too many this hour), "fail".
export async function sendContact(data, { url = CONTACT_URL, fetchFn = globalThis.fetch } = {}) {
  if (!url) return "off";
  try {
    const r = await fetchFn(url, { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "text/plain" }, signal: AbortSignal.timeout(10000) });
    return r.ok ? "ok" : r.status === 429 ? "limit" : r.status === 404 || r.status === 503 ? "off" : "fail";
  } catch {
    return "off";
  }
}

// The classes of the overview map, drawn in the order of coverage.json (later over earlier).
const COLORS = { surface: "#1d6b52", ortho: "#7fbf8e", osm: "#d9ecb8" };
let map = null;
async function showMap(el) {
  if (map) { map.invalidateSize(); return; }
  const L = globalThis.L;
  map = L.map(el, { scrollWheelZoom: false, worldCopyJump: true, zoomSnap: 0.5 }).setView([50, 12], 3);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 12, opacity: 0.55, attribution: `© <a href="https://www.openstreetmap.org/copyright">${t("přispěvatelé OpenStreetMap")}</a>` }).addTo(map);
  try {
    const data = await (await fetch("coverage.json")).json();
    const layer = L.geoJSON(data, { interactive: false, style: (f) => ({ color: "#3d5a48", weight: 0.4, fillColor: COLORS[f.properties.c] || "#ccc", fillOpacity: 0.8 }) }).addTo(map);
    map.fitBounds(layer.getBounds(), { padding: [4, 4] });
  } catch (err) {
    console.warn("coverage.json", err);
  }
}

// The dialog: cut() gives the link of the current cut (or null), country() the state of the cut (its module,
// countries/<ISO>.js: its code and the author's name as its credits give it), lang the page's.
export function setupAbout({ $, cut, country, lang }) {
  const dlg = $("#about-dialog"), status = $("#contact-status"), send = $("#contact-send");
  const say = (text) => { status.textContent = text; };
  $("#menu-about").onclick = () => {
    // The author's name is a text of the language (Bára 26. 11. 2026): "Bára Soukupová" in Czech and Slovak, "Bara
    // Soukup" in the others, whatever the state of the cut.
    $("#about-author").textContent = t("Autorka: {name}", { name: t("Bára Soukupová") });
    const link = cut();
    $("#contact-cut").disabled = !link;
    $("#contact-cut-row").hidden = !link;
    send.disabled = !CONTACT_URL;
    say(CONTACT_URL ? "" : t("Odesílání zpráv tu zatím nejde."));
    dlg.showModal();
    showMap($("#about-map"));
  };
  $("#about-close").onclick = () => dlg.close();
  // The footer's "kontakt" links open the dialog at the form (Bára 24. 11. 2026: the form instead of the e-mail address).
  // Delegated, because the footer's text is replaced by the language's; the hash stays (#rez= is the cut's link).
  document.addEventListener("click", (e) => {
    if (!e.target.closest?.(".open-contact")) return;
    e.preventDefault();
    $("#menu-about").onclick();
    $("#contact-text").scrollIntoView({ block: "center" });
    $("#contact-text").focus({ preventScroll: true });
  });
  send.onclick = async () => {
    const message = $("#contact-text").value.trim().slice(0, CONTACT_MAX), email = $("#contact-email").value.trim();
    if (!message) { say(t("Napište prosím zprávu.")); $("#contact-text").focus(); return; }
    if (email && !$("#contact-email").checkValidity()) { say(t("E-mail nevypadá správně.")); $("#contact-email").focus(); return; }
    send.disabled = true;
    say(t("Odesílám…"));
    const result = await sendContact({ message, email, cut: $("#contact-cut").checked ? cut() : null, website: $("#contact-web").value, lang, country: country().code || null });
    send.disabled = false;
    if (result === "ok") {
      $("#contact-text").value = "";
      $("#contact-cut").checked = false;
      say(t("Děkujeme, zpráva odešla."));
    } else say(result === "limit" ? t("Zpráv je teď moc, zkuste to prosím za hodinu.") : result === "off" ? t("Odesílání zpráv tu zatím nejde.") : t("Zprávu se nepodařilo odeslat, zkuste to prosím za chvíli."));
  };
}
