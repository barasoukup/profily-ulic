// A cycle track's width rule by its whole width (the reviews of 24. 11. 2026, as Italy's countries/IT.js): derive.js
// cycleTrack splits a wide two-way track into two halves of opposite directions, so a half is judged with its partner:
// the two-way rule, moved by the partner's width (the two together against the whole track's figure). A track that is
// no such half takes `single`: a one-way track, or one without a direction, which derive.js gives a one-way track of
// OSM too (carveCycleways, the half of a segregated path), so it is never held to the two-way figure.
import { t } from "../i18n.js";
import { fmt } from "../norms.js";

export function cycleTrackLimits(s, segs = [], i = -1, single, twoWay) {
  const other = s.dir && [segs[i - 1], segs[i + 1]].find((x) => x?.type === "cyklostezka" && x.dir && x.dir !== s.dir);
  if (!other || !twoWay) return single;
  const w = other.width || 0;
  return {
    min: twoWay.min > 0 ? twoWay.min - w : 0,
    zaklad: twoWay.zaklad - w,
    why: t("country.cycletrack.wholeTwoWayCycle", { w: fmt((s.width || 0) + w), why: twoWay.why }),
  };
}
