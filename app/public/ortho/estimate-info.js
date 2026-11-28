import { columns, usable } from "./columns.js";
import { GREEN_AREA } from "./measures.js";

// The sources of the estimate's houses (osmAlong): of the facades that end the sides, else of every house the cut
// crosses; an element's "from" (gis.js ruianOutlines RÚIAN, towns/lithuania.js GRPK), else OSM. The state's own
// register first, OSM last.
// A planimetric map's gaps between two roadways taken as medians (towns/planimetrics.js gapsBetweenRoads, Toronto), told on
// the orthophoto: green as the estimate's rest (GREEN_AREA) is the grass strip it is (401), the rest stays the median. Not by
// yellowness or saturation (the deleted outer gaps of Boston did): on Toronto's orthophoto the concrete islands are as yellow and saturated
// as dry grass (the 26 judged medians of the second review: concrete green 0–0.01, grass 0.11–0.42, the dry one of Markham
// Road 0). At least MEDIAN_SEEN m of it seen. Returns how many changed.
const MEDIAN_SEEN = 0.8;
export function medianGapsByImage(polys, dir, st) {
  if (!usable(st) || !polys.some((p) => p.medianGap && p.code === 9950)) return 0;
  const cols = columns(st), normal = [-dir[1], dir[0]];
  let n = 0;
  for (const p of polys) {
    if (!p.medianGap || p.code !== 9950) continue;
    const ts = p.rings[0].map(([x, y]) => x * normal[0] + y * normal[1]), a = Math.min(...ts), b = Math.max(...ts);
    const g = [];
    // (Not the edges: a kerb's shadow or a painted line.)
    for (let i = cols.ti(a + 0.2); i < cols.ti(b - 0.2); i++) if (i >= 0 && i < cols.nt && Number.isFinite(cols.green[i])) g.push(cols.green[i]);
    if (g.length * st.res < MEDIAN_SEEN) continue;
    if (g.reduce((x, y) => x + y, 0) / g.length < GREEN_AREA) continue;
    Object.assign(p, { code: 401, label: "zeleň (ortofoto)", guess: true });
    n++;
  }
  return n;
}
export function houseSources(o) {
  const facades = ["A", "B"].map((side) => o.facadeFrom?.[side]).filter(Boolean);
  const all = facades.length ? facades : o.buildings.map((b) => b.from);
  const set = [...new Set(all.length ? all : ["OSM"])];
  return set.sort((a, b) => (a === "OSM") - (b === "OSM"));
}
// The note under the street's name for a profile of the estimate (app.js): where its kerbs and its houses come from.
// fb: orthoOsmPolys' result; tried: an orthophoto was looked for here; tr: i18n.js t; list: the names joined in the
// page's language (Intl.ListFormat), "{a} a {b}" by default. The source's name is not declined (Bára 17. 11. 2026).
export function estimateNote(fb, tried, tr, list = (xs) => xs.join(" a ")) {
  const houses = list(fb.houses?.length ? fb.houses : ["OSM"]);
  return fb.image ? tr("orthoOsm.kerbsEstimatedOrthophotoBuildings", { houses })
    : tried ? tr("orthoOsm.orthophotoDidNotHelp", { houses })
    : tr("orthoOsm.kerbsFollowOsmBuildings", { houses });
}
