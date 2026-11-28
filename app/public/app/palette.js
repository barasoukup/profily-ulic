// The palette of parts to add in Návrh ("+ Přidat díl") and the hints of the types.
import { TYPES, DEFAULT_WIDTH } from "../types.js";
import { isHole } from "../profile.js";
import { t as tr } from "../i18n.js";
import { edited } from "./history.js";
import { placeNew } from "./holes.js";
import { state, $, status, render } from "./state.js";

// What a part with a term for a name is, in plain words (Fable: for lay people as well as experts).
export const TYPE_HINTS = {
  pruleh: tr("app.shallowGrassedDitchRainwater"),
  ryha: tr("app.gravelFilledTrenchRainwater"),
  nadrz: tr("app.basinHoldsRainwaterBack"),
  pruh_piktokoridor: tr("app.trafficLaneBicycleSymbols"),
  ochranny_pruh: tr("app.cycleLaneBehindBroken"),
  cyklopruh: tr("app.cycleLaneBehindSolid"),
  tramvaj: tr("app.tracksOffCarriagewaySeparated"),
  tramvaj_pruh: tr("app.laneCarriagewayTramsOnly"),
  tramvaj_v_pruhu: tr("app.tracksLaneCarsUse"),
  krajnice: tr("app.edgeCarriagewayOutsideTraffic"),
  obsluzna: tr("app.narrowRoadHousesParking"),
  delici: tr("app.stripBetweenDirectionsTraffic"),
  nastupiste: tr("app.wherePeopleWaitBoard"),
};
// Parts to add, grouped as people look for them.
const PALETTE_GROUPS = [
  [tr("app.walking"), ["chodnik", "chodnik_kola", "nastupiste"]],
  // The shared path is first a cycling path in the lists (Bára).
  [tr("app.cycling"), ["cyklopruh", "ochranny_pruh", "pruh_piktokoridor", "cyklostezka", "stezka_sdilena"]],
  [tr("app.carsBuses"), ["pruh", "parkovani", "bus", "bus_cyklo", "obsluzna", "krajnice"]],
  [tr("app.tram"), ["tramvaj_v_pruhu", "tramvaj_pruh", "tramvaj"]],
  [tr("common.railway"), ["railway"]],
  [tr("app.greeneryOther"), ["zelen", "stromorad", "predzahradka", "delici", "plocha", "zahradka", "zed"]],
  [tr("app.rainwater"), ["pruleh", "ryha", "nadrz", "voda"]],
];
// The palette's groups with the types in none of them under "Další" (withUnknown: the editor's list also offers
// "Neurčeno", the palette does not add it).
export function paletteGroups(withUnknown = false) {
  const shown = new Set(PALETTE_GROUPS.flatMap(([, ks]) => ks));
  const rest = Object.keys(TYPES).filter((k) => !shown.has(k) && (withUnknown || k !== "nezname"));
  return [...PALETTE_GROUPS, [tr("app.more"), rest]].map(([t, ks]) => [t, ks.filter((k) => TYPES[k])]).filter(([, ks]) => ks.length);
}
// The palette folded into "+ Přidat díl" (Fable: 27 parts always under the card made two screens of it); once
// opened it stays open for the visit.
let paletteOpen = false;
export function renderPalette(p) {
  const pal = $("#palette");
  pal.replaceChildren();
  const box = pal.appendChild(Object.assign(document.createElement("details"), { open: paletteOpen }));
  box.ontoggle = () => { paletteOpen = box.open; };
  box.append(Object.assign(document.createElement("summary"), { className: "btn", textContent: tr("app.addPart") }));
  const hint = document.createElement("div");
  hint.className = "pal-note muted";
  const selSeg = p.segments[state.selected];
  hint.textContent = state.mode === "navrh" && isHole(selSeg) ? tr("app.newPartFillsSelected")
    : state.mode === "navrh" ? (state.selected === null ? tr("app.newPartGoesEmpty") : tr("app.newPartGoesRight"))
    : state.selected === null ? tr("app.newPartGoesEnd") : tr("app.newPartGoesRightSelected");
  box.append(hint);
  for (const [title, list] of paletteGroups()) {
    const group = Object.assign(document.createElement("div"), { className: "pal-group" });
    group.append(Object.assign(document.createElement("span"), { className: "pal-name", textContent: title }));
    for (const k of list) {
      const t = TYPES[k];
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.style.setProperty("--c", t.color);
      chip.textContent = t.label;
      if (TYPE_HINTS[k]) chip.title = TYPE_HINTS[k];
      chip.onclick = () => {
        const segs = p.segments, seg = { type: k, width: DEFAULT_WIDTH[k], source: "user" };
        if (t.directional) seg.dir = "forward";
        let at = state.selected === null ? segs.length : state.selected + 1;
        if (state.mode === "navrh" && segs.length) at = placeNew(segs, state.selected, seg);
        if (at < 0) { status(tr("app.noRoomNewPart"), "error"); return; }
        segs.splice(at, 0, seg);
        state.selected = at;
        edited();
        render();
      };
      group.append(chip);
    }
    box.append(group);
  }
}
