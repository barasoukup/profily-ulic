// The profile as drawn: render() and draw() (Stav, Návrh, Porovnat), the shares of the street, the comparison, the warnings
// of the rules and the width check.
import { TYPES, partLabel, TRAM_BEDS, HDV_UNDER, underSize } from "../types.js";
import { loadSigns, buildSvg, mountEditor, totalWidth, underDepth } from "../profile.js";
import { shares, surfaces } from "../shares.js";
import { checkRules, checkUnder, checkTrees } from "../rules.js";
import { city } from "../city.js";
import { cutDataParts, dataText } from "../data.js";
import { t as tr, pct } from "../i18n.js";
import { drawSelection, helpSeen } from "./cutview.js";
import { renderEditor } from "./editor.js";
import { fitPhone, fitLabels } from "./fit.js";
import { edited } from "./history.js";
import { renderPalette } from "./palette.js";
import { state, $, current, streetName, canEdit, fmtM, setRender } from "./state.js";
import { loadUnderground, drawNetLines, undergroundFor } from "./underground.js";

// render() rebuilds the drawing, the editor and the palette: keyboard focus inside them goes back
// to the same place (the selected part, or the control at the same position, so "+ + +" keeps
// working) instead of falling to the top of the page.
// A field changed by Tab has lost the focus when its change redraws the editor (Fable: the size fields could not be
// filled in one after another): the focus goes on from that field, to the next one (or back with Shift).
const FOCUSABLE = "button, select, input, label.btn, [tabindex]";
let changed = null, tabbed = 0;
addEventListener("change", (e) => { changed = e.target; }, true);
addEventListener("keydown", (e) => { tabbed = e.key === "Tab" ? (e.shiftKey ? -1 : 1) : 0; }, true);
function render() {
  // Sign icons load on first use; the drawing is redone once they are there.
  loadSigns(state.stav, state.navrh).then((fresh) => fresh && render(), () => {});
  const left = document.activeElement === document.body && changed?.isConnected;
  const a = left ? changed : document.activeElement;
  changed = null;
  const box = a?.closest?.("#profile, #editor, #palette");
  const index = box && box.id !== "profile" ? [...box.querySelectorAll(FOCUSABLE)].indexOf(a) + (left ? tabbed : 0) : -1;
  draw();
  drawSelection();
  loadUnderground(); // a cut restored from storage or a link asks for its networks too (once per cut)
  drawNetLines();
  if (!box) return;
  let target;
  if (box.id === "profile") target = $(`#profile g.seg[data-i="${state.selected ?? a.dataset?.i}"]`);
  else {
    const all = [...$(`#${box.id}`).querySelectorAll(FOCUSABLE)];
    target = all[Math.min(index, all.length - 1)] || $("#editor .ed-head h3");
  }
  if (target) {
    if (!target.hasAttribute("tabindex") && !/^(BUTTON|SELECT|INPUT)$/.test(target.tagName)) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }
}
// Whose data the profile shows: the city's, and a town's passport when the cut took it (towns/passports.js; Bára:
// the cut's information should say where its data come from). The parts of the line are data.js cutDataParts.
function cutData() {
  const sources = state.cut?.sources;
  const parts = cutDataParts(sources, { abroad: city.abroad, noOrtho: sources?.noOrtho });
  return parts ? dataText(parts) : city.dataShort;
}
function draw() {
  document.title = state.stav && state.cut ? `${streetName(state.cut)} – ${tr("common.streetProfile")}` : tr("common.streetProfile");
  document.querySelectorAll(".seg-toggle button").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === state.mode);
    b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode));
  });
  const box = $("#profile");
  document.body.dataset.mode = state.stav ? state.mode : "";
  // Where the parts come from matters while looking at the data, not while designing (Fable's look at the interface).
  $("#legend").hidden = !state.stav || state.mode !== "stav";
  $("#profile-head").hidden = !state.stav;
  $("#map-help").hidden = !state.stav || helpSeen();
  $("#stav-cta").hidden = !state.stav || state.mode !== "stav";
  $("#stav-cta").classList.toggle("fixing", !!state.fixing);
  $("#stav-text").textContent = state.fixing
    ? tr("app.youCorrectingExistingData")
    : tr("app.streetDataShowNot", { data: cutData() });
  $("#btn-fix").textContent = state.fixing ? tr("app.done") : tr("common.correctData");
  // The footer's short line names the data of the cut's place (Bára: IPR only in Prague), the general services
  // without a cut; the opened footer keeps all the sources.
  $("#footer-data").textContent = state.stav && state.cut ? tr("app.data", { data: cutData() }) : tr("common.dataNationalCityMap");
  if (state.stav) {
    // Under the street's name: the width, and in every mode what the data of the street are (an estimate, a map that
    // failed…; Bára 16. 11. 2026 after Fable: an estimate is not forgotten while designing).
    $("#profile-sub").textContent = tr("common.totalW", { w: fmtM(totalWidth(state.mode === "navrh" ? state.navrh : state.stav)) }) + tr(state.cut?.note || "");
  }
  if (!state.stav) {
    box.innerHTML = `<div class="empty">
      <img src="${city.emptyImg}" alt="" width="96" height="126">
      <div><h1 class="empty-title">${tr("app.streetCrossSection")}</h1>
      <ol><li>${tr("app.clickStreetMapAbout")}</li><li>${tr("app.profileFacadeBuiltOpen")}</li>
      <li>${tr("app.editProposalDragBorders")}</li></ol></div></div>`;
    $("#editor").replaceChildren();
    $("#palette").replaceChildren();
    renderShares();
    return;
  }
  if (state.mode === "porovnat") {
    box.replaceChildren();
    const changed = changedParts(state.stav, state.navrh);
    // One depth of earth for both, so they keep one scale (a rainwater object in the design only, Fable).
    const deep = Math.max(underDepth(state.stav), underDepth(state.navrh));
    for (const [title, p, opts] of [[tr("common.existing"), state.stav, { deep }], [tr("common.proposal"), state.navrh, { changed, deep }]]) {
      const h = Object.assign(document.createElement("h3"), { className: "compare-title", textContent: title });
      if (opts.changed?.size) h.append(Object.assign(document.createElement("span"), { className: "muted", textContent: tr("note.changedPartsOutlined") }));
      box.append(h, buildSvg(p, opts));
    }
    box.appendChild(diffList(state.stav, state.navrh));
    renderShares();
    $("#editor").replaceChildren();
    $("#palette").replaceChildren();
    $("#rule-check").hidden = true; // the design's warnings belong to Návrh (they stayed from another street, Fable)
    renderWidthCheck();
    fitPhone(box);
    return;
  }
  const p = current();
  mountEditor(box, p, {
    editable: canEdit(),
    selected: state.selected,
    onSelect: (i) => { state.selected = i; state.edge = null; render(); },
    selectedEdge: state.edge,
    onEdge: (side) => { state.edge = side; state.selected = null; render(); },
    onChange: () => { edited(); render(); },
    onRedraw: (b) => fitLabels(b),
    underground: undergroundFor(),
  });
  renderEditor(p);
  if (state.mode === "navrh") renderPalette(p);
  else $("#palette").replaceChildren();
  renderWidthCheck();
  renderRuleCheck(p, box);
  renderShares();
  fitPhone(box);
}
// How the street's width is shared out, as one bar per profile (Stav and Návrh side by side in
// Porovnat), with the groups' metres and per cent.
function renderShares() {
  const box = $("#shares");
  if (!state.stav) { box.hidden = true; return; }
  box.hidden = false;
  box.replaceChildren();
  shareBars(box, tr("app.shareStreetSpace"), shares, ["auta", "mhd", "kola"], tr("app.sharedLanesPathsCount"));
  // How much of it lets the rain in (Magdalena, 13. 11. 2026), by the parts' surfaces.
  shareBars(box, tr("app.streetSurface"), surfaces, ["nepropustne"]);
}
// One bar per profile (Stav and Návrh in Porovnat) of the groups of fn (shares.js), with the groups' metres and per
// cent, in Porovnat with the share before; dark: groups with white figures.
function shareBars(box, heading, fn, dark, note) {
  const rows = state.mode === "porovnat" ? [[tr("common.existing"), state.stav], [tr("common.proposal"), state.navrh]] : [[null, current()]];

  const sec = box.appendChild(Object.assign(document.createElement("section"), { className: "share-sec" }));
  sec.append(Object.assign(document.createElement("h3"), { textContent: heading }));
  const before = state.mode === "porovnat" ? Object.fromEntries(fn(state.stav).map((g) => [g.key, g.pct])) : null;
  for (const [title, p] of rows) {
    const row = Object.assign(document.createElement("div"), { className: "share-row" });
    if (title) row.append(Object.assign(document.createElement("span"), { className: "share-title", textContent: title }));
    const bar = Object.assign(document.createElement("div"), { className: "share-bar", role: "img" });
    const list = fn(p).filter((g) => g.m > 0);
    bar.setAttribute("aria-label", `${heading}: ` + list.map((g) => `${g.label} ${pct(g.pct)}`).join(", "));
    for (const g of list) {
      const part = Object.assign(document.createElement("span"), { title: `${g.label}: ${fmtM(g.m)} (${pct(g.pct)})` });
      part.style.flexGrow = g.m;
      part.style.background = g.color;
      if (g.pct >= 9) part.textContent = pct(g.pct);
      if (dark.includes(g.key)) part.classList.add("dark");
      bar.append(part);
    }
    row.append(bar);
    sec.append(row);
  }
  // The legend: every group with its share (and in Porovnat the share before, Fable: "p. b." is for experts).
  const legend = Object.assign(document.createElement("div"), { className: "share-legend" });
  for (const g of fn(state.mode === "porovnat" ? state.navrh : current())) {
    if (!g.m && !(before && before[g.key])) continue;
    const d = before ? Math.round(g.pct - before[g.key]) : 0;
    const item = Object.assign(document.createElement("span"), { textContent: `${g.label} ${fmtM(g.m)} · ${pct(g.pct)}${d ? ` (${tr("app.wasP", { p: pct(before[g.key] || 0) })})` : ""}` });
    item.style.setProperty("--c", g.color);
    legend.append(item);
  }
  sec.append(legend);
  if (note) sec.append(Object.assign(document.createElement("div"), { className: "share-note", textContent: note }));
}
// Parts of the design that differ from the current state: edited by hand, or (same parts in the
// same order) of another width, or with another rainwater object under them, paving or items (Fable's review:
// changes a width does not show).
const hidden = (s) => JSON.stringify([s.under || "", s.under ? underSize(s) : "", s.permeable || "", s.bed || "", (s.items || []).map((it) => [it.kind, it.h || 0, !!it.along])]);
function changedParts(a, b) {
  const same = a.segments.length === b.segments.length && a.segments.every((s, i) => s.type === b.segments[i].type);
  const out = new Set();
  b.segments.forEach((s, i) => {
    if (same ? Math.abs(s.width - a.segments[i].width) >= 0.01 || hidden(a.segments[i]) !== hidden(s) : s.source === "user") out.add(i);
  });
  return out;
}
// What the design changes, part by part: same parts in the same order compare width by width;
// otherwise the parts that came and went.
function diffList(a, b) {
  const div = Object.assign(document.createElement("div"), { className: "diff" });
  const name = (s) => partLabel(s);
  const items = [];
  if (a.segments.length === b.segments.length && a.segments.every((s, i) => s.type === b.segments[i].type)) {
    a.segments.forEach((s, i) => {
      const d = +(b.segments[i].width - s.width).toFixed(2);
      if (d) items.push({ i, text: `${name(s)}: ${fmtM(s.width)} → ${fmtM(b.segments[i].width)} (${d > 0 ? "+" : "−"}${fmtM(Math.abs(d))})` });
      else if (TYPES[s.type]?.bed && (s.bed || "panely") !== (b.segments[i].bed || "panely")) items.push({ i, text: tr("app.typeTrackBedSurface", { type: name(s), from: TRAM_BEDS[s.bed || "panely"]?.label, to: TRAM_BEDS[b.segments[i].bed || "panely"]?.label }) });
      else if ((s.under || "") !== (b.segments[i].under || "")) items.push({ i, text: tr("app.typeBelowSurfaceWhat", { type: name(s), what: HDV_UNDER[b.segments[i].under]?.label || tr("app.nothing") }) });
      else if (hidden(s) !== hidden(b.segments[i])) items.push({ i, text: tr("app.typeOtherItemsPaving", { type: name(s) }) });
    });
  } else {
    const count = (p) => p.segments.reduce((m, s) => m.set(name(s), (m.get(name(s)) || 0) + s.width), new Map());
    const ca = count(a), cb = count(b);
    for (const k of new Set([...ca.keys(), ...cb.keys()])) {
      const wa = ca.get(k) || 0, wb = cb.get(k) || 0;
      if (Math.abs(wa - wb) >= 0.01) items.push({ text: `${k}: ${wa ? fmtM(wa) : "–"} → ${wb ? fmtM(wb) : "–"}` });
    }
  }
  div.innerHTML = `<h3>${tr("app.changesProposal")}</h3>`;
  const ul = document.createElement("ul");
  for (const it of items.length ? items : [{ text: tr("app.proposalSameExistingStreet") }]) {
    const li = Object.assign(document.createElement("li"), { textContent: it.text });
    if (it.i !== undefined) {
      // Pointing at a change lights up that part in both profiles.
      const mark = (on) => document.querySelectorAll(`#profile g.seg[data-i="${it.i}"]`).forEach((g) => g.classList.toggle("hover", on));
      li.onmouseenter = () => mark(true);
      li.onmouseleave = () => mark(false);
    }
    ul.append(li);
  }
  div.append(ul);
  return div;
}
// Widths against the IPR manual (rules.js; in Brno only as a guide), in Návrh only: a list under the profile and the parts
// outlined in the drawing (red: below the minimum, orange: below the basic width). A click on a
// line selects that part.
function renderRuleCheck(p, box) {
  const el = $("#rule-check");
  if (state.mode !== "navrh") { el.hidden = true; return; }
  // The widths by the manual, and (with the networks on) rainwater objects and new trees near a network: each under
  // its own head.
  const nets = undergroundFor(), widths = checkRules(p, state.cut), clashes = [...checkUnder(p, nets), ...checkTrees(p, state.stav, nets)];
  const found = [...widths, ...clashes];
  for (const f of found) box.querySelector(`g.seg[data-i="${f.i}"]`)?.classList.add(`warn-${f.level}`);
  if (!found.length) { el.hidden = true; el.replaceChildren(); return; }
  el.hidden = false;
  el.replaceChildren();
  for (const [head, list] of [[city.rulesHead, widths], [tr("app.undergroundNetworks"), clashes]]) if (list.length) el.append(Object.assign(document.createElement("div"), { textContent: head }), warnList(list));
}
function warnList(found) {
  const ul = document.createElement("ul");
  for (const f of found) {
    const li = Object.assign(document.createElement("li"), { className: f.level });
    // Short, with the rule after it in grey (Fable: the long sentences with brackets in brackets read badly).
    if (f.short) li.append(Object.assign(document.createElement("strong"), { textContent: f.short }), " ", Object.assign(document.createElement("span"), { className: "muted", textContent: f.why }));
    else li.textContent = f.text;
    li.onclick = () => { state.selected = f.i; render(); };
    li.tabIndex = 0;
    li.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.onclick(); } };
    ul.append(li);
  }
  return ul;
}
// The street is as wide as the current state (façade to façade): the design must fill exactly that
// width. Shown in Návrh and Porovnat; "Dorovnat" puts the difference into the selected part (or the
// widest one).
function renderWidthCheck() {
  const box = $("#width-check");
  // In Návrh against the street; while correcting the data (Stav), against the width measured before.
  const fixing = state.mode === "stav" && state.fixing && state.fixBase;
  if (!state.stav || !state.navrh || (state.mode === "stav" && !fixing)) { box.hidden = true; return; }
  const edit = fixing ? state.stav : state.navrh;
  const target = fixing ? state.fixBase : totalWidth(state.stav), now = totalWidth(edit);
  const diff = +(now - target).toFixed(2);
  box.hidden = false;
  box.className = Math.abs(diff) < 0.01 ? "ok" : "off";
  // Only when the width does not fit (Fable: "drží šířku" all the time said nothing).
  if (Math.abs(diff) < 0.01) { box.hidden = true; return; }
  const v = { d: fmtM(Math.abs(diff)), w: fmtM(target), now: fmtM(now) };
  box.textContent = fixing
    ? (diff > 0 ? tr("app.afterCorrectionsProfileD", v) : tr("app.afterCorrectionsProfileDNarrower", v))
    : (diff > 0 ? tr("app.proposalDWiderStreet", v) : tr("app.proposalDNarrowerStreet", v));
  if (state.mode !== "navrh" && !fixing) return;
  const segs = edit.segments;
  // The selected part when it can take the difference, else the widest part that can.
  const fits = (x) => x && x.width - diff >= 0.5;
  const seg = fits(segs[state.selected]) ? segs[state.selected]
    : segs.filter(fits).reduce((b, x) => (!b || x.width > b.width ? x : b), null);
  if (!seg) return;
  const btn = document.createElement("button");
  btn.textContent = tr("app.balanceTypeW", { type: partLabel(seg), w: fmtM(seg.width - diff) });
  btn.onclick = () => {
    seg.width = +(seg.width - diff).toFixed(2);
    seg.source = "user";
    edited();
    render();
  };
  box.append(" ", btn);
}

setRender(render);
