// Checks of the 1000 Slovak cuts (window.__res of sber.js) against what OSM says on the cut line (Bára 16. 11. 2026).
// Each finding is a suspicion, not a verdict. A module: run in the app's page (served from pilot/public for the run),
// report(window.__res) returns the Markdown of podezreni.md; findings(rows) the findings by kind for the A/B.
const BIKE_PARTS = new Set(["cyklostezka", "cyklopruh", "ochranny_pruh", "chodnik_kola", "stezka_sdilena", "bus_cyklo", "pruh_piktokoridor"]);
const WALK_PARTS = new Set(["chodnik", "chodnik_kola", "stezka_sdilena", "nastupiste"]);
const LANE_PARTS = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh"]);
const TRAM_PARTS = new Set(["tramvaj", "tramvaj_v_pruhu", "tramvaj_pruh"]);
const ROADS = new Set(["motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "living_street",
  "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link"]);
const PATHS = new Set(["footway", "path", "cycleway", "steps", "pedestrian", "bridleway"]);

export const link = (r) => `https://streetspace.eu/profily/#rez=${r.lat.toFixed(6)},${r.lon.toFixed(6)},${Math.round(r.bearing)},${r.reach.left.toFixed(1)},${r.reach.right.toFixed(1)}`;
const isBikeWay = (t) => t.highway === "cycleway" || (["path", "footway"].includes(t.highway) && t.bicycle === "designated");
const roadBike = (t) => Object.entries(t).some(([k, v]) => k.startsWith("cycleway") && k.split(":").length <= 2 && ["lane", "track", "opposite_lane", "opposite_track"].includes(v));

export function findings(rows) {
  const F = {};
  const add = (k, r, why) => (F[k] ||= []).push({ r, why });
  for (const r of rows) {
    if (r.error || !r.segs?.length) { add("bez profilu", r, r.error || "žádné díly"); continue; }
    const segs = r.segs, cross = r.cross || [], types = segs.map((s) => s[0]);
    const total = segs.reduce((a, s) => a + s[1], 0);
    const pos = []; let x = 0;
    for (const s of segs) { pos.push([x, x + s[1], s[0]]); x += s[1]; }
    const partAt = (at) => pos.find((p) => p[0] - 0.5 <= at && at <= p[1] + 0.5)?.[2] ?? null;
    const hasBike = types.some((t) => BIKE_PARTS.has(t));
    // 1. a cycle way crosses the cut, the profile has no bicycle part
    const bw = cross.find((c) => isBikeWay(c.tags));
    if (bw && !hasBike) add("cyklostezka z OSM chybí", r, `${bw.tags.highway} v ${bw.at.toFixed(1)} m, díl tam: ${partAt(bw.at)}`);
    // 2. a road tagged with cycle lanes or tracks, no bicycle part
    const rb = cross.find((c) => ROADS.has(c.tags.highway) && roadBike(c.tags));
    if (rb && !hasBike) add("cyklopruh na silnici (OSM) chybí", r, Object.entries(rb.tags).filter(([k]) => k.startsWith("cycleway")).map(([k, v]) => `${k}=${v}`).join(", "));
    // 3. a sidewalk mapped on its own crosses the cut where the profile has a roadway part
    const sw = cross.find((c) => c.tags.highway === "footway" && c.tags.footway === "sidewalk" && (LANE_PARTS.has(partAt(c.at)) || ["parkovani", "obsluzna", "krajnice"].includes(partAt(c.at))));
    if (sw) add("chodník z OSM leží ve vozovce profilu", r, `chodník v ${sw.at.toFixed(1)} m, díl tam: ${partAt(sw.at)}`);
    // 4. lanes: the cut street's OSM lanes against the lane parts
    const own = cross.filter((c) => ROADS.has(c.tags.highway) && (c.tags.name || "") === (r.name || ""));
    const lanesOsm = own.reduce((a, c) => a + (/^\d+$/.test(c.tags.lanes || "") ? +c.tags.lanes : 0), 0);
    const lanesProf = types.filter((t) => LANE_PARTS.has(t)).length;
    if (lanesOsm && lanesProf && lanesOsm !== lanesProf && new Set(own.map((c) => c.id)).size === own.length) add("počet pruhů jiný než OSM lanes", r, `OSM ${lanesOsm}, profil ${lanesProf}`);
    // 5. tram tracks cross the cut, no tram part
    const trams = cross.filter((c) => c.tags.railway === "tram").length;
    if (trams && !types.some((t) => TRAM_PARTS.has(t))) add("koleje tramvaje bez tramvaje", r, `${trams} kolejí`);
    // 6. odd widths: a lane over its street's cap by a shoulder or more (the rule: lane 4 m, local 4.5 m, motorway
    // 3.75 m, the rest a shoulder from 1 m; not in zones), a zone's roadway over 8 m
    const hw = own[0]?.tags.highway || "";
    const cap = { motorway: 3.75, trunk: 3.75, residential: 4.5, unclassified: 4.5, service: 4.5 }[hw] ?? 4;
    const zone = ["living_street", "pedestrian"].includes(hw);
    const wide = !zone && segs.find((s) => s[0] === "pruh" && s[1] >= cap + 1);
    if (wide) add("pruh nad strop o 1 m a víc", r, `${wide[1].toFixed(2)} m (${hw}, strop ${cap} m)`);
    const zw = zone && segs.find((s) => s[0] === "pruh" && s[1] > 8);
    if (zw) add("obytná nebo pěší zóna s vozovkou nad 8 m", r, `${zw[1].toFixed(2)} m`);
    // 6b. a two-way street of OSM lanes 2 or more drawn as one lane and a shoulder of 1.7 m or more (parked cars?)
    const twoWay = own.length === 1 && own[0].tags.oneway !== "yes" && !zone && (+own[0].tags.lanes || 2) >= 2;
    const lanesHere = segs.filter((s) => s[0] === "pruh");
    const sh = segs.find((s) => s[0] === "krajnice" && s[1] >= 1.7);
    if (twoWay && lanesHere.length === 1 && sh) add("obousměrka jako jeden pruh a široká krajnice (stání?)", r, `pruh ${lanesHere[0][1]} + krajnice ${sh[1]} m`);
    const wideWalk = segs.find((s) => s[0] === "chodnik" && s[1] > 9);
    if (wideWalk) add("široký chodník (> 9 m)", r, `${wideWalk[1].toFixed(2)} m`);
    // 7. the cut's own way is a path, a footway or a cycle way, yet the profile has driving lanes
    const mid = r.span?.left ?? total / 2;
    const near = cross.reduce((b, c) => (!b || Math.abs(c.at - mid) < Math.abs(b.at - mid) ? c : b), null);
    if (near && Math.abs(near.at - mid) < 3 && PATHS.has(near.tags.highway) && types.some((t) => LANE_PARTS.has(t)))
      add("pěšina nebo cyklostezka nakreslená jako silnice", r, `${near.tags.highway}: ${types.join(" | ")}`);
    // 8. a road with no lane at all
    if (own.some((c) => ROADS.has(c.tags.highway) && c.tags.highway !== "living_street") && !types.some((t) => LANE_PARTS.has(t) || t === "obsluzna"))
      add("ulice bez jízdního pruhu", r, types.join(" | "));
  }
  return F;
}

export function report(rows) {
  const F = findings(rows);
  const kinds = Object.entries(F).sort((a, b) => b[1].length - a[1].length);
  const out = ["# Podezření na 1000 slovenských řezech", "", `${rows.length} řezů, automatická kontrola proti OSM na čáře řezu (kontrola.js). Podezření, ne verdikt.`, "",
    "| druh | řezů |", "|---|---|", ...kinds.map(([k, v]) => `| ${k} | ${v.length} |`)];
  for (const [k, v] of kinds) {
    out.push("", `## ${k} (${v.length})`, "");
    for (const { r, why } of v.slice(0, 40)) out.push(r.lat ? `- ${r.town} · ${r.name || "?"} · ${why} · [řez](${link(r)})` : `- ${r.town} · ${why}`);
    if (v.length > 40) out.push(`- … a dalších ${v.length - 40}`);
  }
  return out.join("\n") + "\n";
}

// A/B of two runs (rows of sber.js) on the same points: only cuts whose sources answered the same in both (a service
// that failed in one run changes the profile by itself: 39 of 59 differing cuts in the A/B of 16. 11. 2026).
export function compare(A, B) {
  const byA = Object.fromEntries(A.map((r) => [r.id, r]));
  const key = (r) => JSON.stringify((r.segs || []).map((s) => [s[0], s[1]]));
  const same = B.filter((r) => byA[r.id] && r.segs?.length && byA[r.id].segs?.length && JSON.stringify(r.sources) === JSON.stringify(byA[r.id].sources));
  const changed = same.filter((r) => key(r) !== key(byA[r.id])).map((r) => ({ id: r.id, name: r.name, link: r.lat ? link(r) : "", A: byA[r.id].segs.map((s) => `${s[0]} ${s[1]}`).join(" | "), B: r.segs.map((s) => `${s[0]} ${s[1]}`).join(" | ") }));
  const count = (rows) => Object.fromEntries(Object.entries(findings(rows)).map(([k, v]) => [k, v.length]));
  const ids = new Set(same.map((r) => r.id));
  return { compared: same.length, skipped: B.length - same.length, changed, findingsA: count(A.filter((r) => ids.has(r.id))), findingsB: count(same) };
}

// The B of a step that only rewrites the profile's parts (derive.js splitTwoWayLane, capWideLanes…), from a stored run
// without asking any service again (Bára: "šetřit zdroje"): each step gets the stored parts and the OSM tags of the
// cut's street (the crossing of its name nearest the cut's point). The ?off= switches of the page are set aside meanwhile.
export async function simulate(rows, stepNames) {
  const derive = await import("/derive.js"), { P } = await import("/ortho-osm.js");
  const off = P.off; P.off = undefined;
  try {
    return rows.map((r) => {
      if (!r.segs?.length) return r;
      const total = r.segs.reduce((a, s) => a + s[1], 0), mid = r.span?.left ?? total / 2;
      const named = (r.cross || []).filter((c) => c.tags.highway && (c.tags.name || "") === (r.name || ""));
      const own = named.reduce((b, c) => (!b || Math.abs(c.at - mid) < Math.abs(b.at - mid) ? c : b), null);
      const segments = r.segs.map((s) => ({ type: s[0], width: s[1], source: s[2], dir: s[3] || undefined }));
      for (const n of stepNames) derive[n](segments, own?.tags || {});
      return { ...r, segs: segments.map((s) => [s.type, s.width, s.source || "", s.dir || ""]) };
    });
  } finally { P.off = off; }
}
