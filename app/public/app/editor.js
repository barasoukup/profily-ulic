// The card of the selected part or edge under the profile (widths, types, items, signs, the look of a building).
import { TYPES, partLabel, SOURCES, ITEMS, PARKING_USE, PARKING_POSITION, TRAM_BEDS, TURN_CHOICES, HDV_UNDER, UNDER_TYPES, PERMEABLE_TYPES, SURFACES, LAMP_HEIGHTS, underSize } from "../types.js";
import { LOOKS as HOUSE_LOOKS } from "../house-looks.js";
import { SIGNS, SIGN_CHOICES, signLabel, signFits, drawable, MAX_PER_PART } from "../signs.js";
import { isHole, buildingStyle, edgeInfo, ROADWAY, nearestRoadway, BUILDING_STYLES, GABLE_LOOKS, turnLabel } from "../profile.js";
import { retype } from "../validate.js";
import { country } from "../city.js";
import { t as tr, numField, readNum } from "../i18n.js";
import { edited } from "./history.js";
import { HOLE, keepsPlace, mergeHoles, setWidth } from "./holes.js";
import { TYPE_HINTS, paletteGroups } from "./palette.js";
import { state, $, canEdit, render, fmtM } from "./state.js";

// Stav without "Opravit data": a click on a part only tells what it is and where it comes from.
function renderInfo(ed, s) {
  if (!s) return;
  const head = Object.assign(document.createElement("div"), { className: "ed-head" });
  head.append(Object.assign(document.createElement("h3"), { textContent: `${partLabel(s)}, ${fmtM(s.width)}` }),
    Object.assign(document.createElement("span"), { className: "muted", textContent: tr("app.source", { source: SOURCES[s.source]?.label || s.source || "–" }) }));
  const close = Object.assign(document.createElement("button"), { className: "close", textContent: "×", onclick: () => { state.selected = null; render(); } });
  close.setAttribute("aria-label", tr("common.close"));
  head.append(close);
  ed.append(head);
}
// What stands at an edge of the street, and the look of a building ("budova" alone lets the app guess it).
const EDGE_KINDS = () => [["stavba", tr("common.smallStructure")], ["zahrada", tr("app.gardenMeadow")], ["zelen", tr("app.parkGreenery")], ["voda", tr("common.water")],
  ["parkoviste", tr("app.carPark")], ["plot", tr("app.fence")], ["volno", tr("app.openSpace")]];
// What stands there first, the look of a building in a select of its own (Fable: one list of 13, most of them
// "Budova – …").
function edgeKindSelect(p, side) {
  const sel = document.createElement("select");
  const current = p.edges?.[side] || "volno";
  for (const [k, t] of [["budova", tr("common.building")], ...EDGE_KINDS()]) sel.add(new Option(t, k, false, current === k));
  sel.onchange = () => {
    if (sel.value === current) return;
    p.edges = { ...p.edges, [side]: sel.value };
    delete p.edges[`${side}Style`];
    edited();
    render();
  };
  return sel;
}
function edgeLookSelect(p, side) {
  const sel = document.createElement("select");
  const info = edgeInfo(p.edges, side);
  const style = buildingStyle(info);
  // A flat-roofed office is drawn as an office, not as a panel house.
  const guess = BUILDING_STYLES[style];
  // The gabled looks only with ?stit=1 (or where the file has one).
  const offered = Object.entries(BUILDING_STYLES).filter(([k]) => HOUSE_LOOKS.gables || !GABLE_LOOKS.has(k) || p.edges?.[`${side}Style`] === k);
  for (const [k, t] of [["", tr("app.estimateGuess", { guess })], ...offered]) sel.add(new Option(t, k, false, (p.edges?.[`${side}Style`] || "") === k));
  sel.onchange = () => {
    p.edges = { ...p.edges };
    if (sel.value) p.edges[`${side}Style`] = sel.value;
    else delete p.edges[`${side}Style`];
    edited();
    render();
  };
  return sel;
}
// Floors above the ground of the building at an edge: set by hand they stand for the data's floors and height
// (profile.js edgeInfo); emptied, the data's again.
function floorsInput(p, side) {
  const data = p.edges?.[`${side}Info`]?.levels;
  const floors = Object.assign(document.createElement("input"), { type: "number", min: 1, max: 60, step: 1, value: p.edges?.[`${side}Levels`] || data || "", placeholder: "–", className: "floors" });
  floors.setAttribute("aria-label", tr("app.floors"));
  floors.onchange = () => {
    const n = Math.round(Number(floors.value));
    // The look guessed so far stays: other floors would make the guess another house (a panel house of 2
    // floors a hall).
    const look = p.edges?.[`${side}Style`] || buildingStyle(edgeInfo(p.edges, side));
    p.edges = { ...p.edges, [`${side}Style`]: look };
    if (n >= 1 && n <= 60 && n !== data) p.edges[`${side}Levels`] = n;
    else delete p.edges[`${side}Levels`];
    edited();
    render();
  };
  return floors;
}
// A selected edge (Bára 12. 11. 2026: a "panel house" that is a two-storey town house, or a garden): what stands
// there and the building's floors; in Stav without "Opravit data" only what it is.
function renderEdge(ed, p, side) {
  const kind = p.edges?.[side] || "volno";
  const info = edgeInfo(p.edges, side);
  const style = kind === "budova" && buildingStyle(info, p.edges?.[`${side}Style`]);
  const name = kind === "budova" ? BUILDING_STYLES[style] + (info?.arcade ? tr("app.arcadeOsm") : "")
    : Object.fromEntries(EDGE_KINDS())[kind] || kind;
  const head = Object.assign(document.createElement("div"), { className: "ed-head" });
  head.append(Object.assign(document.createElement("h3"), { textContent: `${side === "left" ? tr("common.leftEdge") : tr("common.rightEdge")}: ${name}` }));
  const close = Object.assign(document.createElement("button"), { className: "close", textContent: "×", onclick: () => { state.edge = null; render(); } });
  close.setAttribute("aria-label", tr("app.closeSelection"));
  head.append(close);
  ed.append(head);
  if (!canEdit()) {
    if (info?.levels) ed.append(Object.assign(document.createElement("span"), { className: "muted", textContent: tr("app.nFloors", { n: info.levels }) + " · " }));
    ed.append(Object.assign(document.createElement("span"), { className: "muted", textContent: tr("app.changeProposalCorrectError") }));
    return;
  }
  const lab = (text, input) => { const l = document.createElement("label"); l.append(text, input); return l; };
  const row = ed.appendChild(Object.assign(document.createElement("div"), { className: "ed-row" }));
  row.append(lab(tr("app.whatStands"), edgeKindSelect(p, side)));
  if (kind === "budova") row.append(lab(tr("app.buildingStyle"), edgeLookSelect(p, side)), lab(tr("app.floors"), floorsInput(p, side)));
}
// Whether the card's "Další volby" is open, for the visit: once opened it stays open from part to part.
let moreOpen = false;
export function renderEditor(p) {
  const ed = $("#editor");
  ed.replaceChildren();
  ed.classList.remove("hint-only");
  const i = state.selected;
  const s = p.segments[i];
  if (state.edge) return renderEdge(ed, p, state.edge);
  if (!canEdit()) return renderInfo(ed, s);
  // Nothing selected: one line of what to do (Fable: the panel of the edges was in the way; a click on a house
  // at the edge opens its own card).
  if (s === undefined) {
    ed.append(Object.assign(document.createElement("p"), { className: "ed-hint muted", textContent: tr("app.clickPartProfileBuilding") }));
    ed.classList.add("hint-only");
    return;
  }
  // Grouped as the palette below (Bára: the long list grouped the same way); the rest under "Další".
  const type = document.createElement("select");
  for (const [title, keys] of paletteGroups(true)) {
    const og = Object.assign(document.createElement("optgroup"), { label: title });
    for (const k of keys) { const o = new Option(TYPES[k].label, k, false, k === s.type); if (TYPE_HINTS[k]) o.title = TYPE_HINTS[k]; og.append(o); }
    type.append(og);
  }
  type.onchange = () => { retype(s, type.value); s.source = "user"; done(); };
  const width = Object.assign(document.createElement("input"), { type: "text", inputMode: "decimal", value: numField(s.width), className: "num" });
  width.onchange = () => {
    // Perpendicular parking keeps at least 4.5 m (ČSN 73 6056).
    const min = s.type === "parkovani" && s.orient === "kolme" ? 4.5 : 0.2;
    const v = readNum(width.value);
    if (!Number.isFinite(v)) return render(); // not a number: the width stays
    setWidth(segs, segs.indexOf(s), Math.max(min, +v.toFixed(2)));
    spreadAll(s);
    s.source = "user";
    done();
  };
  const lab = (text, input) => { const l = document.createElement("label"); l.append(text, input); return l; };
  const btn = (text, fn, cls) => { const b = document.createElement("button"); b.textContent = text; b.onclick = fn; if (cls) b.className = cls; return b; };
  const segs = p.segments;
  const done = (sel = state.selected) => {
    if (keepsPlace()) mergeHoles(segs);
    // The selection stays on a part that is still there (holes merge, so the index may be past the end).
    state.selected = sel === null || sel === undefined || !segs.length ? null : Math.min(sel, segs.length - 1);
    edited();
    render();
  };
  // A headed card (Fable's look at the interface): the part and its moves in the head; the type, the width and
  // the one choice the part is mostly about; its items and signs; the rarer choices folded under "Další volby".
  const head = Object.assign(document.createElement("div"), { className: "ed-head" });
  head.append(Object.assign(document.createElement("h3"), { textContent: partLabel(s) }),
    Object.assign(document.createElement("span"), { className: "muted", textContent: tr("app.source", { source: SOURCES[s.source]?.label || s.source || "–" }) }));
  const acts = Object.assign(document.createElement("span"), { className: "ed-acts" });
  const act = (text, title, fn, cls, off) => { const b = btn(text, fn, cls); b.title = title; b.setAttribute("aria-label", title); b.disabled = !!off; return b; };
  acts.append(
    act("←", tr("app.moveLeft"), () => { if (i > 0) { [segs[i - 1], segs[i]] = [segs[i], segs[i - 1]]; done(i - 1); } }, "", i === 0),
    act("→", tr("app.moveRight"), () => { if (i < segs.length - 1) { [segs[i + 1], segs[i]] = [segs[i], segs[i + 1]]; done(i + 1); } }, "", i === segs.length - 1),
    act(tr("app.split"), tr("app.splitTwo"), () => { const h = +(s.width / 2).toFixed(2); segs.splice(i, 1, { ...s, width: h, source: "user" }, { ...s, width: +(s.width - h).toFixed(2), source: "user" }); done(); }),
    // After a delete the neighbour is selected, so "Dorovnat" offers to give it the width (renderWidthCheck).
    // In Návrh and in a correction a deleted part leaves a hole of its width, so what lies beyond it stays in its place (Bára: the
    // surface must not drift from what is under it).
    act(tr("app.delete"), tr("app.deletePart"), () => {
      if (keepsPlace()) { segs.splice(i, 1, { type: HOLE, width: s.width, source: "user" }); done(i); }
      else { segs.splice(i, 1); done(segs.length ? Math.max(0, i - 1) : null); }
    }, "danger", isHole(s)), // a hole is already the empty place
  );
  acts.append(btn("×", () => { state.selected = null; render(); }, "close"));
  acts.lastChild.setAttribute("aria-label", tr("app.closeSelection"));
  head.append(acts);
  const row = (into = ed) => into.appendChild(Object.assign(document.createElement("div"), { className: "ed-row" }));
  const step = (d) => btn(d > 0 ? "+" : "−", () => { setWidth(segs, i, Math.max(minW(), +(s.width + d).toFixed(2))); spreadAll(s); s.source = "user"; done(); }, "step");
  const minW = () => (s.type === "parkovani" && s.orient === "kolme" ? 4.5 : 0.2);
  ed.append(head);
  // What the part is, in plain words, where its name is a term (Fable: průleh, piktokoridor… for lay people).
  if (TYPE_HINTS[s.type]) ed.append(Object.assign(document.createElement("p"), { className: "ed-hint muted", textContent: TYPE_HINTS[s.type] }));
  const r1 = row();
  const wbox = Object.assign(document.createElement("span"), { className: "stepper" });
  wbox.append(step(-0.25), width, step(0.25));
  r1.append(lab(tr("app.type"), type), lab(tr("app.widthM"), wbox));
  // The rarer choices: their row inside the folded box, and what is set in them named on the fold.
  const moreBox = Object.assign(document.createElement("details"), { className: "ed-more", open: moreOpen });
  moreBox.ontoggle = () => { moreOpen = moreBox.open; };
  const summary = moreBox.appendChild(document.createElement("summary"));
  const r2 = row(moreBox), set = [];
  const opt = (sel) => sel.selectedOptions[0]?.textContent;
  if (TYPES[s.type]?.directional) {
    // Away from or towards the viewer; a lane of a two-way street with one axis has no direction and is drawn
    // "↑↓" (derive.js), so it can be made and kept here too. Another part without a direction says so.
    const dir = document.createElement("select");
    const both = s.type === "pruh" ? [["", tr("app.twoWay")]] : s.dir ? [] : [["", tr("app.noDirection")]];
    for (const [v, t] of [["forward", tr("app.awayViewer")], ["backward", tr("app.towardsViewer")], ...both]) dir.add(new Option(t, v, false, (s.dir || "") === v));
    dir.onchange = () => {
      const was = s.dir;
      if (dir.value) s.dir = dir.value; else delete s.dir;
      // Cyclists in the lane turn with it, so contraflow stays contraflow (Bára).
      if (s.bikeDir && was && s.dir && was !== s.dir) s.bikeDir = s.bikeDir === "backward" ? "forward" : "backward";
      done();
    };
    r1.append(lab(tr("app.direction"), dir));
  }
  if (s.type === "pruh" || s.type === "pruh_piktokoridor") {
    // Cyclists sharing the lane (drawn with the cars, "cyklisté ↓" in contraflow; a piktokoridor has them anyway).
    const bike = document.createElement("select");
    for (const [v, t] of [["", s.type === "pruh" ? tr("app.no") : tr("app.sameDirectionLane")], ["forward", tr("app.awayViewer")], ["backward", tr("app.towardsViewer")]]) bike.add(new Option(t, v, false, (s.bikeDir || "") === v));
    bike.onchange = () => { if (bike.value) s.bikeDir = bike.value; else delete s.bikeDir; s.source = "user"; done(); };
    r2.append(lab(tr("app.cyclistsLane"), bike));
    if (s.bikeDir) set.push(tr("app.cyclistsDir", { dir: opt(bike) }));
  }
  if (["pruh", "pruh_piktokoridor", "bus", "bus_cyklo"].includes(s.type)) {
    // Trolley wires over the lane (OSM trolley_wire): drawn above it; a bus lane under them carries the trolleybus.
    const wires = Object.assign(document.createElement("input"), { type: "checkbox", checked: !!s.wires });
    wires.onchange = () => {
      if (wires.checked) { s.wires = true; if (s.type.startsWith("bus")) s.trolley = true; } else { delete s.wires; delete s.trolley; }
      s.source = "user";
      done();
    };
    r2.append(lab(tr("app.trolleyWires") + " ", wires));
    if (s.wires) set.push(tr("app.trolleyWires2"));
  }
  if (s.type === "parkovani") {
    const orient = document.createElement("select");
    for (const [v, t] of [["podelne", tr("common.parallel")], ["sikme", tr("common.angled")], ["kolme", tr("common.perpendicular")]]) {
      orient.add(new Option(t, v, false, (s.orient || "podelne") === v));
    }
    orient.onchange = () => {
      s.orient = orient.value;
      // ČSN 73 6056 and Manuál C.2: perpendicular stalls 5.0 m deep (4.5 m with overhang); angled ones keep the rules
      // of perpendicular stalls (rules.js), so they start at 5.0 m too.
      if ((s.orient === "kolme" || s.orient === "sikme") && s.width < 4.5) setWidth(segs, segs.indexOf(s), 5);
      s.source = "user";
      done();
    };
    r1.append(lab(tr("app.layout"), orient));
    const use = document.createElement("select");
    for (const [v, t] of [["", tr("app.general")], ...Object.entries(PARKING_USE)]) use.add(new Option(t, v, false, (s.use || "") === v));
    use.onchange = () => { if (use.value) s.use = use.value; else delete s.use; s.source = "user"; done(); };
    r2.append(lab(tr("app.use"), use));
    if (s.use) set.push(opt(use));
    // Where the cars stand: in the roadway, on the sidewalk, or across the kerb (half on the sidewalk).
    const pos = document.createElement("select");
    for (const [v, t] of [["", tr("app.roadway")], ...Object.entries(PARKING_POSITION)]) pos.add(new Option(t, v, false, (s.position || "") === v));
    pos.onchange = () => { if (pos.value) s.position = pos.value; else delete s.position; s.source = "user"; done(); };
    r2.append(lab(tr("app.position"), pos));
    if (s.position) set.push(opt(pos));
  }
  if (TYPES[s.type]?.bed) {
    // The surface of a separate tram bed: panels, gravel or grass.
    const bed = document.createElement("select");
    for (const [v, t] of Object.entries(TRAM_BEDS)) bed.add(new Option(t.label, v, false, (s.bed || "panely") === v));
    bed.onchange = () => { s.bed = bed.value; delete s.bedGuess; s.source = "user"; done(); };
    r1.append(lab(tr("app.tramwaySurface"), bed));
  }
  if (PERMEABLE_TYPES.includes(s.type)) {
    // Ordinary, permeable paving (5.1.2) or unpaved.
    const perm = document.createElement("select");
    for (const [v, label] of Object.entries(SURFACES)) perm.add(new Option(label, v, false, String(s.permeable || "") === v));
    perm.onchange = () => { const v = perm.value; if (v === "true") s.permeable = true; else if (v) s.permeable = v; else delete s.permeable; s.source = "user"; done(); };
    r2.append(lab(tr("app.surface"), perm));
    if (s.permeable) set.push(opt(perm));
  }
  // Rainwater management (Bára after Magdalena): what lies under the part.
  if (UNDER_TYPES.includes(s.type)) {
    const under = document.createElement("select");
    for (const [v, t] of [["", tr("app.nothing")], ...Object.entries(HDV_UNDER).map(([k, u]) => [k, u.label])]) under.add(new Option(t, v, false, (s.under || "") === v));
    // Another object starts from its own default size.
    under.onchange = () => { if (under.value) s.under = under.value; else delete s.under; delete s.underSize; s.source = "user"; done(); };
    r2.append(lab(tr("app.belowSurface"), under));
    if (s.under) {
      set.push(opt(under));
      // Its size (types.js underSize; the standard sizes it by calculation): wide, from what depth, how high.
      const z = underSize(s), size = Object.assign(document.createElement("span"), { className: "under-size" });
      for (const [k, text, lo, hi] of [["w", tr("app.width"), 0.3, Math.max(0.3, s.width - 0.2)], ["top", tr("app.topDepth"), 0, 5], ["h", tr("app.height"), 0.2, 5]]) {
        const inp = Object.assign(document.createElement("input"), { type: "text", inputMode: "decimal", value: numField(z[k]), className: "num" });
        inp.onchange = () => {
          // An emptied field goes back to the default (Fable: it gave 0).
          const v = readNum(inp.value);
          if (!Number.isFinite(v)) { if (s.underSize) delete s.underSize[k]; }
          else s.underSize = { ...s.underSize, [k]: Math.min(hi, Math.max(lo, +v.toFixed(2))) };
          // Only what differs from the default travels in a link.
          const d = HDV_UNDER[s.under].size;
          if (s.underSize?.[k] === d[k]) delete s.underSize[k];
          if (s.underSize && !Object.keys(s.underSize).length) delete s.underSize;
          s.source = "user";
          done();
        };
        size.append(lab(text, inp));
      }
      size.append(Object.assign(document.createElement("span"), { className: "muted", textContent: tr("app.mDefaultEstimateSize") }));
      row(moreBox).append(size);
    }
  }
  if (TYPES[s.type]?.tracks) {
    // Buses may use the tram part (OSM psv / bus on the tracks).
    const bus = Object.assign(document.createElement("input"), { type: "checkbox", checked: !!s.withBus });
    bus.onchange = () => { if (bus.checked) s.withBus = true; else delete s.withBus; s.source = "user"; done(); };
    r2.append(lab(tr("app.alsoBuses") + " ", bus));
    if (s.withBus) set.push(tr("app.busesToo"));
  }
  if (["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu"].includes(s.type)) {
    // The usual arrows, and the lane's own from OSM when it is another combination (named as drawn).
    const turn = document.createElement("select");
    const turns = s.turn && !TURN_CHOICES.includes(s.turn) ? [...TURN_CHOICES, s.turn] : TURN_CHOICES;
    for (const [v, t] of [["", tr("app.noArrow")], ...turns.map((v) => [v, turnLabel(v)])]) {
      turn.add(new Option(t, v, false, (s.turn || "") === v));
    }
    turn.onchange = () => { if (turn.value) s.turn = turn.value; else delete s.turn; s.source = "user"; done(); };
    r2.append(lab(tr("app.laneArrows"), turn));
    if (s.turn) set.push(tr("app.arrowTurn", { turn: opt(turn) }));
  }
  // Merging gives the part's width to its neighbour, so the street keeps its width (Bára: a shoulder that is
  // really part of the lane).
  const merge = [[i - 1, tr("app.mergeLeft")], [i + 1, tr("app.mergeRight")]].filter(([j]) => segs[j]).map(([j, label]) => btn(label, () => {
    segs[j].width = +(segs[j].width + s.width).toFixed(2);
    segs[j].source = "user";
    segs.splice(i, 1);
    done(j < i ? j : i);
  }));
  if (merge.length) row(moreBox).append(...merge);
  summary.append(tr("app.moreOptions"));
  if (set.length) summary.append(Object.assign(document.createElement("span"), { className: "muted", textContent: ` · ${set.join(", ")}` }));
  // Items (furniture, barriers) inside the segment and its traffic signs (at most MAX_PER_PART): one row of tags.
  const items = document.createElement("span");
  items.className = "items";
  // The tags in the order the items stand (Fable: with three racks it was not clear which select was whose).
  if (s.items) s.items.sort((a, b) => a.f - b.f);
  (s.items || []).forEach((it, k) => {
    // A tag and its select stay together on one line (Fable).
    const pair = items.appendChild(Object.assign(document.createElement("span"), { className: "item-pair" }));
    pair.append(btn(`${ITEMS[it.kind] || it.kind} ×`, () => { s.items.splice(k, 1); spreadItems(s, it.kind); s.source = "user"; done(); }, "tag"));
    // A lamp's height and a bike rack's direction (Magdalena): a small select by its tag.
    const opts = it.kind === "lampa" ? [["", tr("app.heightUsual")], ...LAMP_HEIGHTS.map((h) => [String(h), tr("app.heightHM", { h })])]
      : it.kind === "stojan_kola" ? [["", tr("app.acrossStreet")], ["along", tr("app.alongStreet")]] : null;
    if (!opts) return;
    const sel = Object.assign(document.createElement("select"), { className: "item-opt" });
    sel.setAttribute("aria-label", it.kind === "lampa" ? tr("app.streetLightHeight") : tr("app.cycleStandOrientation"));
    for (const [v, t] of opts) sel.add(new Option(t, v, false, v === (it.kind === "lampa" ? String(it.h || "") : it.along ? "along" : "")));
    sel.onchange = () => {
      if (it.kind === "lampa") { if (sel.value) it.h = Number(sel.value); else delete it.h; }
      else { if (sel.value) it.along = true; else delete it.along; spreadItems(s, it.kind); }
      s.source = "user";
      done();
    };
    pair.append(sel);
  });
  const add = document.createElement("select");
  add.setAttribute("aria-label", tr("app.addItem2"));
  add.add(new Option(tr("app.addItem"), ""));
  for (const [k, t] of Object.entries(ITEMS)) add.add(new Option(t, k));
  add.onchange = () => { if (!add.value) return; (s.items ||= []).push({ kind: add.value, f: itemPlace(segs, i, add.value) }); spreadItems(s, add.value); s.source = "user"; done(); };
  items.append(add);
  row().append(items, signTags(s.signs, MAX_PER_PART, s.type, (list) => { if (list.length) s.signs = list; else delete s.signs; done(); }));
  ed.append(moreBox);
}
// "IP 11b Parkoviště (kolmé stání)" as "Parkoviště (kolmé stání) · IP 11b".
const codeLast = (label) => label.replace(/^((?:[A-Z]{1,2} \d+[a-z]?)(?: [/+] (?:[A-Z]{1,2} \d+[a-z]?))*) (.+)$/, "$2 · $1");
// Items of a kind that stand in a row (racks, benches, planters, bollards) are set side by side across their part,
// each as wide as it is (Bára: two or three bike racks on top of each other), around where they stood; when they do
// not fit, closer together.
const KERB_SET = 0.6, ITEM_W = { stojan_kola: 1.9, lavicka: 2.2, kvetinac: 1.2, sloupek: 1.0 };
const itemWidth = (it) => (it.kind === "stojan_kola" && it.along ? 0.8 : ITEM_W[it.kind]);
function spreadItems(s, kind) {
  const row = (s.items || []).filter((it) => it.kind === kind).sort((a, b) => a.f - b.f);
  if (row.length < 2 || !ITEM_W[kind]) return;
  const ws = row.map(itemWidth), need = ws.reduce((a, w) => a + w, 0), k = Math.min(1, s.width / need);
  // The row's middle where the items' middle was, kept inside the part.
  const mid = Math.min(Math.max(row.reduce((a, it) => a + it.f, 0) / row.length * s.width, (need * k) / 2), s.width - (need * k) / 2);
  let x = mid - (need * k) / 2;
  row.forEach((it, j) => { it.f = +((x + (ws[j] * k) / 2) / s.width).toFixed(3); x += ws[j] * k; });
}
// After a part's width changed: its rows again (Fable: narrowed, they overlapped).
const spreadAll = (s) => Object.keys(ITEM_W).forEach((kind) => spreadItems(s, kind));
// Where a new item stands across its part (f): a lamp or a traction pole KERB_SET from the kerb of the nearer roadway
// beside the part, to light it or hold its wire (Bára: lamps stand by the road), else in the middle.
// The roadway is looked for across the parts between, as the drawing turns the lamp's arm (nearestRoadway); a second
// lamp or pole in the part stands at the other edge, a third and more in the middle (Fable: they stood on each other).
function itemPlace(segs, i, kind) {
  const s = segs[i];
  if (!["lampa", "sloup_trakce"].includes(kind) || s.width < 2 * KERB_SET) return 0.5;
  const kerb = KERB_SET / s.width, n = (s.items || []).filter((it) => it.kind === kind).length;
  const side = nearestRoadway(segs, i, 0.5);
  const both = ROADWAY.has(segs[i - 1]?.type) && ROADWAY.has(segs[i + 1]?.type);
  if (!side || both) return n === 0 ? 0.5 : n === 1 ? kerb : 1 - kerb;
  const near = side === "left" ? kerb : 1 - kerb;
  return +(n === 0 ? near : n === 1 ? 1 - near : 0.5).toFixed(3);
}
// Tags of traffic signs with ×, and a select to add one (a speed limit asks for its number).
function signTags(list = [], max, type, set) {
  const box = Object.assign(document.createElement("span"), { className: "items" });
  // Only the signs the state of the cut has (Slovakia has no shared zone, Fable).
  const fits = Object.keys(SIGNS).filter((k) => signFits(k, type) && drawable({ k, v: 30 }, null, country.code));
  if (!fits.length && !list.length) return box; // no sign fits a green strip, a wall…
  // The name first and the sign's number after it (Fable: "IP 11b" first says nothing to most).
  const name = (x) => codeLast(signLabel(x, country.code));
  list.forEach((x, k) => {
    const b = document.createElement("button");
    b.className = "tag";
    b.textContent = `${name(x)} ×`;
    b.onclick = () => set(list.filter((_, j) => j !== k));
    box.append(b);
  });
  if (list.length < max && fits.length) {
    const add = document.createElement("select");
    add.add(new Option(tr("app.addSign"), ""));
    for (const k of fits) {
      add.add(new Option(name({ k }), k));
      for (const [ck, c] of Object.entries(SIGN_CHOICES)) if (c.k === k && drawable(c, null, country.code)) add.add(new Option(name(c), ck));
    }
    add.onchange = () => {
      const k = add.value;
      if (!k) return;
      const { label, ...x } = SIGN_CHOICES[k] || { k };
      if (k === "b20a") {
        const v = Number(prompt(tr("app.speedLimitKmH"), "30"));
        if (!(v > 0 && v <= 200)) return render();
        x.v = Math.round(v);
      }
      set([...list, x]);
    };
    box.append(add);
  }
  return box;
}
