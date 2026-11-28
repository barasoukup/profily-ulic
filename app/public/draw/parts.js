// What the drawing needs to know about a part: its labels, whether it is raised, which way the traffic goes.
import { country } from "../city.js";
import { t as tr } from "../i18n.js";
import { TURNS, TYPES } from "../types.js";

// Direction of the nearest driving lane, so parked cars face the traffic next to them.
// A lane with no direction of its own is a two-way one (a single lane of a two-way street): its traffic runs on the
// right of the roadway forward (the left where traffic keeps left), so the cars parked on each side stand with the
// traffic of their side (Broulíkova: Bára 27. 11. 2026, the car on the left side turned). `right`: the part is on the
// right half of the profile.
export function laneDir(segs, i, right) {
  for (let d = 1; d < segs.length; d++) {
    for (const j of [i - d, i + d]) {
      if (["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu"].includes(segs[j]?.type)) {
        if (segs[j].dir || right === undefined) return segs[j].dir || "forward";
        return right !== !!country.leftHand ? "forward" : "backward";
      }
    }
  }
  return "forward";
}

export const ORIENT_LABEL = { podelne: tr("common.parallel"), sikme: tr("common.angled"), kolme: tr("common.perpendicular") };
export const CAR_TRACK = 170; // wheel to wheel of the parked car's sprite (cm), for its tilt across the kerb
export const KERB_PAVING = "#c4c0b4"; // the sidewalk's paving under parked cars, a shade darker than the sidewalk
// On the curb: raised types, and cars parked fully on the sidewalk.
// An empty place left in a design (a deleted part: Neurčeno by the user) lies at road level, no kerbs (Fable).
export const isHole = (s) => s?.type === "nezname" && s.source === "user";
export const isRaised = (s) => !!s && !isHole(s) && (!!TYPES[s.type]?.raised || (s.type === "parkovani" && s.position === "on_kerb"));
export const turnLabel = (v) => v.split(";").map((x) => TURNS[x] || x).join(" + ");
