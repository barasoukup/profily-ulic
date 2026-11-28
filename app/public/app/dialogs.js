// The dialogs and menus of the header: the report of a badly built cut, About, and the closing of the menus.
import { country } from "../city.js";
import { logOn, sendReport, shortProfile } from "../log.js";
import { setupAbout } from "../about.js";
import { t as tr, lang } from "../i18n.js";
import { cutLog } from "./logging.js";
import { state, $, status, streetName } from "./state.js";

// Reporting a badly built cut (Bára): what is wrong, in the visitor's words, with the cut and its profile as the
// app built it (and as corrected, if the visitor corrected it), into the log (kind "hlaseni", logging/reports.mjs).
// [value in the log, label]
const REPORT_WHAT = [["šířky", tr("app.widths")], ["pruhy", tr("app.lanes")], ["chodník", tr("app.pavement")], ["parkování", tr("common.parkingLowercase")], ["tramvaj", tr("app.tram2")],
  ["cyklisté", tr("common.cyclists")], ["zeleň a stromy", tr("app.greeneryTrees")], ["domy", tr("app.buildings")], ["značky", tr("app.signs")], ["jiné", tr("common.other")]];
$("#report-what").append(...REPORT_WHAT.map(([w, label]) => {
  const l = document.createElement("label");
  l.append(Object.assign(document.createElement("input"), { type: "checkbox", value: w }), label);
  return l;
}));
// Only where the log runs (the web, not a local run), so the dialog never thanks for a report nobody got; from
// the Stav bar and from the Soubor menu (also in Návrh, where wrong widths are often noticed).
for (const b of ["#btn-report", "#menu-report"]) $(b).hidden = !logOn;
const openReport = () => {
  if (!state.cut || !state.stav) return status(tr("app.firstClickStreetMap"), "error");
  $("#report-title").textContent = tr("app.streetWhatWrongCut", { street: streetName(state.cut) });
  $("#report-status").textContent = "";
  $("#report-send").disabled = false;
  $("#report-dialog").showModal();
  $("#report-text").focus();
};
$("#btn-report").onclick = $("#menu-report").onclick = openReport;
$("#report-close").onclick = $("#report-cancel").onclick = () => $("#report-dialog").close();
$("#report-send").onclick = async () => {
  const co = [...document.querySelectorAll("#report-what input:checked")].map((i) => i.value);
  const text = $("#report-text").value.trim().slice(0, 1000);
  if (!text && !co.length) { $("#report-status").textContent = tr("app.pleaseWriteWhatWrong"); $("#report-text").focus(); return; }
  $("#report-send").disabled = true;
  $("#report-status").textContent = tr("common.sending");
  // The Stav as it is now always goes along; what the app built, when this page built it (a restored or loaded
  // profile has no such record).
  const ok = await sendReport("hlaseni", {
    ...cutLog(), bearing: +state.cut.bearing.toFixed(1), reachLeft: state.cut.reach?.left, reachRight: state.cut.reach?.right,
    profile: { co, text, stav: shortProfile(state.stav), ...(state.computed && { vypocet: shortProfile(state.computed) }), opraveno: !!state.stavEdited },
  });
  if (!ok) {
    $("#report-send").disabled = false;
    $("#report-status").textContent = tr("app.reportCouldNotSent");
    return;
  }
  $("#report-text").value = "";
  for (const i of document.querySelectorAll("#report-what input")) i.checked = false;
  $("#report-dialog").close();
  status(tr("app.thankYouReportHas"), "ok");
};
// About (menu Soubor): the app, its author, where it has which data, a message (about.js).
setupAbout({ $, lang, country: () => country,
  cut: () => (location.hash.startsWith("#rez=") ? location.href.split("#")[0] + location.hash.split("&")[0] : null) });
// The header menus close after a choice or a click elsewhere.
document.addEventListener("click", (e) => {
  for (const d of document.querySelectorAll("details.menu[open]")) {
    if (!d.contains(e.target) || e.target.closest(".menu-list button:not(.switch)")) d.open = false;
  }
});
