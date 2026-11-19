// Where the estimate from the orthophoto and OSM goes wrong systematically (Bára 18. 11. 2026: "tyto dětské chyby
// nejdřív odchytat … hledat v čem systematicky jen orto přístup blbne"): the estimate as the app makes it (ortho-osm.js
// orthoOsmPolys, derive.js deriveProfile with the lane lines of the same image, trimToEnds) against MTVU along the cut
// (the regression's cuts of Prague and Brno, ČÚZK 12.5 cm: the orthophoto the rest of Czechia has), metre by metre and
// by kinds of error. No request (the images are cached in evaluation/ortofoto/data).
//   node evaluation/ortofoto-osm/chyby.mjs [praha|brno …]   → vysledky/chyby.md (counts, the metres confused, links)
import fs from "node:fs/promises";
import { cuts, truthOf, osmAround, stripOf, ROOT } from "./lib.mjs";
import { orthoOsmPolys, trimToEnds, P } from "../../pilot/public/ortho-osm.js";
import { localFrame, deriveProfile, lanesFromShoulders, splitTwoWayLane, capWideLanes, pedestrianZone, widenNarrowTrams } from "../../pilot/public/derive.js";
import { applyLanes } from "../../pilot/public/lanes-ortho.js";

const CITIES = process.argv.slice(2).filter((a) => /^[a-z]+$/.test(a));
P.off = new Set((process.env.OFF || "").split(",").filter(Boolean));
P.cars = process.env.CARS === "1";
P.carsColour = process.env.AUTA === "1";
const KEY = process.env.SRC || "cuzk12";
const BASE = "http://localhost:5293/?lang=cs&osm=balik";

// Coarse kinds, the same for both: roadway (lanes, shoulders, bus and tram lanes), parking, sidewalk (and cycle
// tracks), green, tram bed, other (paved areas, medians, walls…), unknown.
const ROADWAY = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "krajnice", "cyklopruh", "ochranny_pruh", "obsluzna"]);
const KINDS = ["vozovka", "stání", "chodník", "zeleň", "tram. těleso", "jiné", "neurčeno"];
const estKind = (type) => (ROADWAY.has(type) ? "vozovka" : type === "parkovani" ? "stání" : ["chodnik", "chodnik_kola", "stezka_sdilena", "cyklostezka", "nastupiste"].includes(type) ? "chodník"
  : ["zelen", "stromorad"].includes(type) ? "zeleň" : type === "tramvaj" ? "tram. těleso" : type === "nezname" ? "neurčeno" : "jiné");
const runKind = (c) => (c === 700 || c === 701 || (c >= 9700 && c < 9800 && !(c >= 9704 && c <= 9708)) ? "vozovka" : c === 704 || (c >= 9704 && c <= 9708) ? "stání"
  : c === 702 || c === 703 ? "chodník" : c >= 400 && c < 500 ? "zeleň" : c === 705 ? "tram. těleso" : "jiné");
const LANES = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "obsluzna"]);

function laid(p) {
  const out = [];
  let t = p.extent[1];
  for (const s of p.segments) { out.push({ ...s, s: t - s.width, e: t }); t -= s.width; }
  return out;
}
const at = (parts, t) => parts.find((x) => x.s <= t && t < x.e);
// Runs of one kind (gaps under 0.5 m of another bridged): [{ s, e }].
function runsOf(parts, is) {
  const out = [];
  for (const x of [...parts].sort((a, b) => a.s - b.s)) {
    if (!is(x)) continue;
    const last = out.at(-1);
    if (last && x.s - last.e < 0.5) last.e = Math.max(last.e, x.e); else out.push({ s: x.s, e: x.e });
  }
  return out.filter((r) => r.e - r.s >= 1);
}

const report = ["# Kde odhad z ortofota a OSM systematicky chybuje (" + new Date().toISOString().slice(0, 10) + ")", "",
  `Odhad tak, jak ho dělá aplikace (\`?mapa=0\`), proti MTVU podél řezu; ortofoto ${KEY}. Skript \`evaluation/ortofoto-osm/chyby.mjs\`.`,
  "Odkazy: **odhad** = jen ortofoto a OSM (`?mapa=0`), **mapa** = jak aplikace řez kreslí z technické mapy (server na 5293).", ""];
for (const city of CITIES.length ? CITIES : ["praha", "brno"]) {
  const list = await cuts(city);
  const conf = Object.fromEntries(KINDS.map((a) => [a, Object.fromEntries(KINDS.map((b) => [b, 0]))]));
  const ev = { shoulder: [], shoulderWide: [], lanesMore: [], lanesLess: [], ways: [], unknown: [], walkWide: [], walkNarrow: [], greenForWalk: [], walkForGreen: [], parkFalse: [], parkMissed: [], roadWide: [], roadNarrow: [], kerbIn: [], kerbOut: [] };
  let n = 0, shoulderTruth = 0;
  const unk = { inside: 0, outside: 0, under: {} }, bed = {}, kerbD = [], kerbByPark = {}, gapIn = {}, whyIn = {};
  for (const c of list) {
    const st = await stripOf(city, KEY, c);
    if (!st) continue;
    const osm = { elements: await osmAround(c.cut.lat, c.cut.lon, 70) };
    const frame = localFrame(c.cut.lat, c.cut.lon), b = (c.cut.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)];
    const way = osm.elements.find((e) => e.type === "way" && e.id === c.cut.wayId);
    if (!way) continue;
    const polys = orthoOsmPolys({ osm, frame, dir, way, st });
    const truth = truthOf(c, 0);
    if (!polys || !truth.way) continue;
    // As lanes-ortho.js laneImage: Y (yellower than blue) and D (green less red) too.
    if (!st.Y) {
      st.Y = new Float32Array(st.nt * st.nu); st.D = new Float32Array(st.nt * st.nu);
      for (let q = 0; q < st.nt * st.nu; q++) { const r = st.rgb[q * 3], g = st.rgb[q * 3 + 1], bl = st.rgb[q * 3 + 2]; st.Y[q] = Number.isNaN(st.L[q]) ? NaN : (r + g) / 2 - bl; st.D[q] = Number.isNaN(st.L[q]) ? NaN : g - r; }
    }
    // As app.js: the estimate, its ends, then the lanes and shoulders read on the image and the lane rules.
    const p = trimToEnds(deriveProfile({ center: [0, 0], dir, half: 40, polys, osm, frame, way, reach: { left: 40, right: 40 }, lanesImage: st }), polys.ends);
    if (!p?.segments?.length || !p.extent) continue;
    if (!process.env.NOLANES) applyLanes(p, { source: KEY, st });
    lanesFromShoulders(p.segments, way.tags); splitTwoWayLane(p.segments, way.tags); capWideLanes(p.segments, way.tags);
    pedestrianZone(p.segments, way.tags, { measured: false }); widenNarrowTrams(p.segments);
    n++;
    const est = laid(p), runs = c.a.runs, mtvu = laid({ segments: c.a.segments, extent: c.a.extent });
    const rez = `#rez=${c.cut.lat.toFixed(6)},${c.cut.lon.toFixed(6)},${Math.round(c.cut.bearing)},22.0,22.0`;
    const id = { n: c.n, name: c.cut.name || "?", links: `[odhad](${BASE}&mapa=0${rez}) · [mapa](${BASE}${rez})` };
    // Metre by metre over what both cover.
    const lo = Math.max(p.extent[0], c.a.extent[0]), hi = Math.min(p.extent[1], c.a.extent[1]);
    for (let t = lo + 0.05; t < hi; t += 0.1) {
      const r = runs.find((x) => x.s <= t && t < x.e), x = at(est, t);
      if (!r || !x || r.code === 601 || x.type === "budova") continue;
      conf[runKind(r.code)][estKind(x.type)] += 0.1;
      if (process.env.BED && r.code === 705) { (bed[c.n] ??= { name: c.cut.name, types: {} }).types[x.type] = ((bed[c.n].types[x.type] || 0) + 0.1); }
    }
    // The carriageway nearest the axis in both: its width, lanes, shoulders.
    const eRoad = runsOf(est, (x) => ROADWAY.has(x.type) || x.type === "parkovani"), tRoad = runsOf(runs.map((r) => ({ ...r, type: runKind(r.code) })), (x) => x.type === "vozovka" || x.type === "stání");
    const near = (rs) => rs.sort((a, b) => Math.min(Math.abs(a.s), Math.abs(a.e), a.s < 0 && a.e > 0 ? 0 : 99) - Math.min(Math.abs(b.s), Math.abs(b.e), b.s < 0 && b.e > 0 ? 0 : 99))[0];
    const eW = near([...eRoad]), tW = truth.way;
    if (eW && tW) {
      const d = (eW.e - eW.s) - (tW.e - tW.s);
      if (d > 1.5) ev.roadWide.push({ ...id, v: d }); else if (d < -1.5) ev.roadNarrow.push({ ...id, v: -d });
    }
    if (eRoad.length !== tRoad.length) ev.ways.push({ ...id, v: `${eRoad.length} místo ${tRoad.length}` });
    // The street's outer kerbs: the outer edges of its roadways (medians and tram beds between them inside), the
    // estimate's against MTVU's (the roadways of either within 4 m of a roadway reaching the axis's 6 m).
    const envelope = (rs) => {
      const sorted = [...rs].sort((a, b) => a.s - b.s), core = sorted.filter((r) => r.s < 6 && r.e > -6);
      if (!core.length) return null;
      let lo = Math.min(...core.map((r) => r.s)), hi = Math.max(...core.map((r) => r.e));
      for (let grew = true; grew;) { grew = false; for (const r of sorted) { if (r.e < lo && lo - r.e <= 4 && r.s < lo) { lo = r.s; grew = true; } if (r.s > hi && r.s - hi <= 4 && r.e > hi) { hi = r.e; grew = true; } } }
      return { lo, hi };
    };
    const eEnv = envelope(runsOf(est, (x) => ROADWAY.has(x.type) || x.type === "parkovani" || x.type === "tramvaj")), tEnv = envelope(runsOf(runs.map((r) => ({ ...r, type: runKind(r.code) })), (x) => x.type === "vozovka" || x.type === "stání" || x.type === "tram. těleso"));
    if (eEnv && tEnv) for (const [side, d] of [["A", eEnv.lo - tEnv.lo], ["B", tEnv.hi - eEnv.hi]]) {
      kerbD.push(d);
      { const tk = side === "A" ? tEnv.lo : tEnv.hi, park = runs.some((r) => runKind(r.code) === "stání" && (side === "A" ? r.s - tk < 1 && r.s >= tk - 0.5 : tk - r.e < 1 && r.e <= tk + 0.5));
        (kerbByPark[park ? "stání" : "bez"] ??= []).push(d); }
      // In the gap between the two kerbs: what the estimate draws and what MTVU has.
      const [g0, g1] = side === "A" ? [Math.min(eEnv.lo, tEnv.lo), Math.max(eEnv.lo, tEnv.lo)] : [Math.min(eEnv.hi, tEnv.hi), Math.max(eEnv.hi, tEnv.hi)];
      const gapE = {}, gapT = {};
      for (let t = g0 + 0.05; t < g1; t += 0.1) { const x = at(est, t), r = runs.find((q) => q.s <= t && t < q.e); if (x) gapE[x.type] = (gapE[x.type] || 0) + 0.1; if (r) gapT[r.code] = (gapT[r.code] || 0) + 0.1; }
      const fmt = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([q, w]) => `${q} ${w.toFixed(1)}`).join(", ");
      const why = polys.kerbs?.why?.[side] || "";
      if (d > 1) { ev.kerbIn.push({ ...id, v: d, side, note: `odhad ${fmt(gapE)}; MTVU ${fmt(gapT)}; obruba z: ${why}` }); for (const [q, w] of Object.entries(gapE)) gapIn[q] = (gapIn[q] || 0) + w; whyIn[why] = (whyIn[why] || 0) + 1; }
      else if (d < -1) ev.kerbOut.push({ ...id, v: -d, side, note: `odhad ${fmt(gapE)}; MTVU ${fmt(gapT)}; obruba z: ${why}` });
    }
    const sh = est.filter((x) => x.type === "krajnice").reduce((a, x) => a + x.width, 0);
    const shT = mtvu.filter((x) => x.type === "krajnice").reduce((a, x) => a + x.width, 0);
    if (shT > 0) shoulderTruth++;
    if (sh > 0) ev.shoulder.push({ ...id, v: sh });
    if (sh >= 1.5) ev.shoulderWide.push({ ...id, v: sh });
    const ln = est.filter((x) => LANES.has(x.type)).length, lnT = mtvu.filter((x) => LANES.has(x.type)).length;
    if (ln > lnT) ev.lanesMore.push({ ...id, v: `${ln} místo ${lnT}` }); else if (ln < lnT) ev.lanesLess.push({ ...id, v: `${ln} místo ${lnT}` });
    const un = est.filter((x) => x.type === "nezname").reduce((a, x) => a + x.width, 0);
    if (un >= 1) {
      // What MTVU has under it, and where it lies: between two roadways of the estimate (inside) or beyond them (outside).
      const under = {}, roads = est.filter((x) => ROADWAY.has(x.type) || x.type === "parkovani"), rLo = Math.min(...roads.map((x) => x.s)), rHi = Math.max(...roads.map((x) => x.e));
      let inside = 0, outside = 0;
      for (const x of est.filter((q) => q.type === "nezname")) {
        for (let t = x.s + 0.05; t < x.e; t += 0.1) { const r = runs.find((q) => q.s <= t && t < q.e); const kk = r ? (r.code === 601 ? "budova" : runKind(r.code)) : "nic"; under[kk] = (under[kk] || 0) + 0.1; }
        if (x.s >= rLo && x.e <= rHi) inside += x.width; else outside += x.width;
      }
      ev.unknown.push({ ...id, v: un, note: `uvnitř ${inside.toFixed(1)}, vně ${outside.toFixed(1)}; MTVU: ${Object.entries(under).sort((a, b) => b[1] - a[1]).map(([q, w]) => `${q} ${w.toFixed(1)}`).join(", ")}` });
      unk.inside += inside; unk.outside += outside; for (const [q, w] of Object.entries(under)) unk.under[q] = (unk.under[q] || 0) + w;
    }
    // Per side: the sidewalk's width, green taken for sidewalk and back, parking.
    const lo2 = Math.min(...est.filter((x) => ROADWAY.has(x.type) || x.type === "parkovani").map((x) => x.s)), hi2 = Math.max(...est.filter((x) => ROADWAY.has(x.type) || x.type === "parkovani").map((x) => x.e));
    for (const [side, inner, sg] of [["A", lo2, -1], ["B", hi2, 1]]) {
      const t = truth.side?.[side];
      if (!t || truth.facade[side] === null) continue;
      const mine = est.filter((x) => estKind(x.type) === "chodník" && (sg < 0 ? x.e <= inner + 0.01 : x.s >= inner - 0.01)).reduce((a, x) => a + (x.e - x.s), 0);
      const d = mine - t.sidewalk;
      if (d > 1.5) ev.walkWide.push({ ...id, v: d, side }); else if (d < -1.5) ev.walkNarrow.push({ ...id, v: -d, side });
      const pk = est.some((x) => x.type === "parkovani" && (sg < 0 ? x.s - lo2 < 3 : hi2 - x.e < 3));
      if (t.parking && !pk) ev.parkMissed.push({ ...id, side }); else if (!t.parking && pk) ev.parkFalse.push({ ...id, side });
    }
  }
  // The report.
  const m = (x) => x.toFixed(0);
  report.push(`## ${city} (${n} řezů)`, "", "Metry podél řezů: řádek = MTVU, sloupec = odhad (budovy vynechané).", "",
    `| MTVU \\ odhad | ${KINDS.join(" | ")} | správně |`, `|---|${KINDS.map(() => "---").join("|")}|---|`);
  for (const a of KINDS) {
    const row = conf[a], tot = KINDS.reduce((s, b) => s + row[b], 0);
    if (tot < 1) continue;
    report.push(`| **${a}** | ${KINDS.map((b) => (b === a ? `**${m(row[b])}**` : m(row[b]))).join(" | ")} | ${Math.round((100 * row[a]) / tot)} % |`);
  }
  const E = [["shoulder", "krajnice v odhadu (m celkem)", `MTVU profil má krajnici v ${shoulderTruth} řezech`], ["shoulderWide", "krajnice 1,5 m a víc"], ["lanesMore", "víc pruhů než profil z MTVU"], ["lanesLess", "méně pruhů"],
    ["ways", "jiný počet vozovek"], ["roadWide", "vozovka u osy o 1,5 m a víc širší (m)"], ["roadNarrow", "vozovka u osy o 1,5 m a víc užší (m)"],
    ["kerbIn", "vnější obruba ulice o 1 m a víc dovnitř (stran, m)"], ["kerbOut", "vnější obruba ulice o 1 m a víc ven (stran, m)"], ["unknown", "Neurčeno 1 m a víc (m)"],
    ["walkWide", "chodník o 1,5 m a víc širší (m)"], ["walkNarrow", "chodník o 1,5 m a víc užší (m)"], ["parkFalse", "stání navíc"], ["parkMissed", "stání chybí"]];
  report.push("", "| Chyba | řezů | |", "|---|---|---|");
  for (const [k, label, note] of E) report.push(`| ${label} | ${ev[k].length} z ${n} | ${note || ""} |`);
  for (const [k, label] of E) {
    if (!ev[k].length) continue;
    const rows = [...ev[k]].sort((a, b) => (typeof b.v === "number" ? b.v : 0) - (typeof a.v === "number" ? a.v : 0)).slice(0, 12);
    report.push("", `### ${label} (${ev[k].length})`, "");
    for (const r of rows) report.push(`- ${r.name} (${r.n}${r.side ? `, strana ${r.side}` : ""})${r.v !== undefined ? `: ${typeof r.v === "number" ? r.v.toFixed(1) : r.v}` : ""}${r.note ? ` (${r.note})` : ""} · ${r.links}`);
  }
  report.push("", `Neurčeno celkem: uvnitř ulice (mezi vozovkami) ${unk.inside.toFixed(0)} m, vně ${unk.outside.toFixed(0)} m; MTVU pod ním: ${Object.entries(unk.under).sort((a, b) => b[1] - a[1]).map(([q, w]) => `${q} ${w.toFixed(0)} m`).join(", ")}`, "");
  console.log(city, JSON.stringify(unk));
  const bins = [[-99, -2], [-2, -1], [-1, -0.5], [-0.5, 0.5], [0.5, 1], [1, 2], [2, 5], [5, 99]];
  const hist = bins.map(([a, b]) => `${a}..${b}: ${kerbD.filter((d) => d >= a && d < b).length}`).join(" · ");
  console.log(city, "obruby (+ dovnitř):", hist);
  console.log(city, "v mezeře u obrub uvnitř (odhad):", JSON.stringify(Object.fromEntries(Object.entries(gapIn).map(([q, w]) => [q, Math.round(w)]))), "obruba z:", JSON.stringify(whyIn));
  for (const [k2, ds] of Object.entries(kerbByPark)) console.log(city, k2, ds.length, bins.map(([a, b]) => `${a}..${b}: ${ds.filter((d) => d >= a && d < b).length}`).join(" · "));
  report.push(`Vnější obruby ulice (strany, + = odhad uvnitř, − = venku, m): ${hist}`, "");
  if (process.env.BED) console.log(JSON.stringify(bed));
  console.log(city, n, Object.fromEntries(Object.entries(ev).map(([k, v]) => [k, v.length])));
}
await fs.mkdir(`${ROOT}/vysledky`, { recursive: true });
await fs.writeFile(`${ROOT}/vysledky/chyby.md`, report.join("\n") + "\n");
