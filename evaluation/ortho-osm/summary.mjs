// The tables of REPORT.md from data/<city>/results.json (run.mjs):
//   node evaluation/ortho-osm/summary.mjs [--by]   → printed, and results/souhrn.md (committed)
import fs from "node:fs/promises";
import path from "node:path";
import { ROOT, SOURCES, median } from "./lib.mjs";

const BY = process.argv.includes("--by");
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : "–");
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2).replace(".", ",") : "–");
function stats(errs) {
  const a = errs.filter(Number.isFinite).map(Math.abs);
  return { n: a.length, med: median(a), in05: a.filter((x) => x <= 0.5).length, in1: a.filter((x) => x <= 1).length };
}
const cell = (s) => (s.n ? `${f2(s.med)} · ${pct(s.in05, s.n)} · ${pct(s.in1, s.n)}` : "–");
const lines = [];
const say = (s = "") => { lines.push(s); console.log(s); };

// Lanes from the boundaries across a carriageway (its edges and the lines between): every gap of 2.4–5.5 m is a
// lane, a wider one round(gap / 3.5) lanes (a line missing), a narrower one a shoulder or a strip (not counted).
// The same rule for the marks by eye and for the orthophoto's lines.
export function lanesFrom(s, e, lines) {
  const b = [s, ...lines.filter((t) => t > s + 0.7 && t < e - 0.7).sort((x, y) => x - y), e];
  let n = 0;
  for (let i = 1; i < b.length; i++) { const g = b[i] - b[i - 1]; if (g >= 2.4 && g <= 5.5) n++; else if (g > 5.5) n += Math.round(g / 3.5); }
  return n;
}
// One method's errors over a set of cuts: kerbs (both sides), carriageway width, sidewalks (sides with a facade both in
// the truth and in OSM), the kerb-to-facade space.
function errorsOf(recs, get) {
  const kerb = [], width = [], sw = [], space = [];
  for (const r of recs) {
    const t = r.truth.way, k = get.kerbs(r);
    if (!t || !k) continue;
    kerb.push(k.A - t.s, k.B - t.e);
    width.push(k.B - k.A - (t.e - t.s));
    const s = get.sw(r);
    for (const side of ["A", "B"]) {
      const tf = r.truth.facade[side];
      if (tf === null || !s?.[side] || r.osmFacade[side] === null) continue;
      const ts = r.truth.side[side];
      // Sidewalks only where the truth has nothing else between kerb and facade (≤ 0.5 m of green or other).
      if (ts.green + ts.other <= 0.5) sw.push(s[side].sidewalk - ts.sidewalk);
      space.push(s[side].space - Math.abs(tf - (side === "A" ? t.s : t.e)));
    }
  }
  return { kerb: stats(kerb), width: stats(width), sw: stats(sw), space: stats(space) };
}
const METHODS = {
  M0: { kerbs: (r) => r.m0, sw: (r) => r.m0sw, image: false },
  M1: { kerbs: (r, k) => r.by[k]?.m1, sw: (r, k) => r.by[k]?.m1sw },
  M2: { kerbs: (r, k) => r.by[k]?.m2, sw: (r, k) => r.by[k]?.m2sw },
};
const getter = (m, k) => ({ kerbs: (r) => METHODS[m].kerbs(r, k), sw: (r) => METHODS[m].sw(r, k) });

const all = {};
for (const city of ["praha", "brno"]) {
  try { all[city] = JSON.parse(await fs.readFile(path.join(ROOT, "data", city, "results.json"), "utf8")); } catch {}
}
say("Chyba v m: medián |chyby| · podíl do 0,5 m · podíl do 1 m. Obruby: obě strany vozovky u osy OSM.");
for (const [city, recs] of Object.entries(all)) {
  const withWay = recs.filter((r) => r.truth.way), ok = withWay.filter((r) => !r.complex), complex = withWay.filter((r) => r.complex);
  say(`\n### ${city === "praha" ? "Praha" : "Brno"} (${recs.length} řezů, ${withWay.length} s vozovkou MTVU u osy OSM; ${complex.length} z nich má v jedné ploše MTVU víc vozovek OSM nebo křižovatku a jsou zvlášť dole)\n`);
  say("| metoda | ortofoto | obruby | šířka vozovky | chodník | obruba–fasáda |");
  say("|---|---|---|---|---|---|");
  const m0 = errorsOf(ok, getter("M0"));
  say(`| M0 jen OSM | – | ${cell(m0.kerb)} | ${cell(m0.width)} | ${cell(m0.sw)} (${m0.sw.n}) | ${cell(m0.space)} |`);
  for (const m of ["M1", "M2"]) for (const k of Object.keys(SOURCES[city])) {
    const e = errorsOf(ok, getter(m, k));
    say(`| ${m === "M1" ? "M1 jen ortofoto" : "M2 OSM + ortofoto"} | ${SOURCES[city][k].label} | ${cell(e.kerb)} | ${cell(e.width)} | ${cell(e.sw)} (${e.sw.n}) | ${cell(e.space)} |`);
  }
  {
    const a = errorsOf(complex, getter("M0")), k = Object.keys(SOURCES[city])[0], b = errorsOf(complex, getter("M2", k));
    say(`\nŘezy s víc vozovkami OSM v jedné ploše MTVU nebo u křižovatky (${complex.length}): obruby M0 ${cell(a.kerb)}, M2 (${SOURCES[city][k].label}) ${cell(b.kerb)}.`);
  }
  // Facades.
  const fe = [];
  let miss = 0, have = 0;
  for (const r of recs) for (const s of ["A", "B"]) {
    if (r.truth.facade[s] === null) continue;
    have++;
    if (r.osmFacade[s] === null) miss++; else fe.push(r.osmFacade[s] - r.truth.facade[s]);
  }
  const fs_ = stats(fe);
  say(`\nFasády (domy OSM proti MTVU): ${have} stran s domem, OSM ho na řezu nemá u ${miss}; u ostatních ${cell(fs_)}.`);
  const tot = [];
  for (const r of recs) if (r.truth.facade.A !== null && r.truth.facade.B !== null && r.osmFacade.A !== null && r.osmFacade.B !== null) tot.push(r.osmFacade.B - r.osmFacade.A - (r.truth.facade.B - r.truth.facade.A));
  say(`Celková šířka fasáda–fasáda (obě fasády v MTVU i OSM, ${tot.length} řezů): ${cell(stats(tot))}.`);
  // Lanes: against the marks by eye.
  // Lanes against the marks by eye, on carriageways with at least one marked line inside (all of the city's marked
  // ones but the complex cuts, where a marked carriageway may hold both directions and OSM counts one).
  const lanesRows = [];
  for (const r of ok) for (const m of r.marked) {
    if (Math.min(m.e, r.truth.way.e) - Math.max(m.s, r.truth.way.s) < 0.5 * (r.truth.way.e - r.truth.way.s)) continue;
    if (!m.lines.some((t) => t > m.s + 0.7 && t < m.e - 0.7)) continue;
    lanesRows.push({ r, m, lanes: lanesFrom(m.s, m.e, m.lines) });
    break;
  }
  if (lanesRows.length) {
    say(`\nPočet jízdních pruhů proti značkám okem (${lanesRows.length} vozovek s čarami; pruh = mezera 2,4–5,5 m mezi okraji a čarami):`);
    const osm = lanesRows.filter(({ r, lanes }) => r.road.lanes === lanes).length;
    say(`- OSM lanes (jinak 1 nebo 2 podle jednosměrky): ${pct(osm, lanesRows.length)}`);
    for (const k of Object.keys(SOURCES[city])) {
      const v = lanesRows.filter(({ r }) => r.by[k]?.m2);
      const ortho = (r, lines, s, e) => (lines?.length ? lanesFrom(s, e, lines) : null);
      const m2 = v.filter(({ r, lanes }) => (ortho(r, r.by[k].linesM2, r.by[k].m2.A, r.by[k].m2.B) ?? r.road.lanes) === lanes).length;
      const tr = v.filter(({ r, lanes }) => (ortho(r, r.by[k].linesTrue, r.truth.way.s, r.truth.way.e) ?? r.road.lanes) === lanes).length;
      say(`- ${SOURCES[city][k].label}: čáry ve vozovce M2 (jinak OSM) ${pct(m2, v.length)}; čáry ve skutečné vozovce ${pct(tr, v.length)}`);
    }
  }
  // Parking side: the truth (MTVU 704, TSK/Brno parking at a kerb) against the OSM tags.
  const pk = { tagged: 0, right: 0, n: 0, truthYes: 0, foundYes: 0, sides: 0 };
  for (const r of ok) {
    if (city === "praha" && !r.inZps) continue; // Prague's parking sections only in the paid zones
    for (const s of ["A", "B"]) {
      pk.sides++;
      const truth = r.truth.side?.[s]?.parking, kind = r.road.parkKind[s];
      if (truth) pk.truthYes++;
      if (!kind) continue;
      pk.tagged++;
      const says = !["no", "none", "fire_lane"].includes(kind);
      if (says === truth) pk.right++;
      if (truth && says) pk.foundYes++;
    }
  }
  say(`\nStání u obruby (strany vozovek${city === "praha" ? " v placených zónách" : ""}: ${pk.sides}, s pravdivým stáním ${pk.truthYes}): OSM parking:* má ${pk.tagged} stran, z nich sedí ${pct(pk.right, pk.tagged)}; stání nalezené podle OSM ${pk.foundYes} z ${pk.truthYes}.`);
  if (BY) {
    for (const k of Object.keys(SOURCES[city])) {
      say(`\nM2, ${SOURCES[city][k].label}, obruby podle typu a příčin:\n`);
      say("| skupina | řezů | M0 obruby | M2 obruby | M2 šířka vozovky |");
      say("|---|---|---|---|---|");
      const groups = { "hlavní": (r) => r.group === "hlavní", "sběrná": (r) => r.group === "sběrná", "místní": (r) => r.group === "místní" };
      for (const fl of ["stromy", "stín", "stání", "úzká", "osa mimo"]) groups[fl] = (r) => r.by[k]?.flags.includes(fl);
      groups["bez potíží"] = (r) => r.by[k] && !r.by[k].flags.length;
      for (const [g, test] of Object.entries(groups)) {
        const v = ok.filter(test), a = errorsOf(v, getter("M0")), b = errorsOf(v, getter("M2", k));
        say(`| ${g} | ${v.length} | ${cell(a.kerb)} | ${cell(b.kerb)} | ${cell(b.width)} |`);
      }
    }
  }
}
await fs.mkdir(path.join(ROOT, "results"), { recursive: true });
await fs.writeFile(path.join(ROOT, "results", BY ? "podle-typu.md" : "souhrn.md"), lines.join("\n") + "\n");
