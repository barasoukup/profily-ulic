// Summary of the orthophoto experiment (run.mjs): per orthophoto, how often each detector found something and how
// it compares with the profile and with the other orthophotos.
//   CITY=praha node evaluation/ortofoto/analyze.mjs   → data/<city>/souhrn.md
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CITY = process.env.CITY || "praha";
const OUT = path.join(ROOT, "data", CITY);
const results = JSON.parse(await fs.readFile(path.join(OUT, "results.json"), "utf8"));
const sources = [...new Set(results.flatMap((r) => Object.keys(r.by)))];
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : "–");
const LANE = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "obsluzna"]);
const lines = [`# Ortofoto – souhrn pokusu, ${CITY} (${results.length} řezů)`, ""];

// ---------- 1. images and alignment ----------
lines.push("## Obrázky a doladění polohy", "", "| ortofoto | obrázků | doladěno | posun (medián, m) | posun > 1 m |", "|---|---|---|---|---|");
for (const k of sources) {
  const ok = results.filter((r) => r.by[k] && !r.by[k].error);
  const fitted = ok.filter((r) => r.by[k].fit >= 2);
  const sh = fitted.map((r) => Math.abs(r.by[k].shift)).sort((a, b) => a - b);
  lines.push(`| ${k} | ${ok.length} | ${fitted.length} | ${sh.length ? sh[sh.length >> 1].toFixed(2) : "–"} | ${sh.filter((x) => x > 1).length} |`);
}

{
  let n = 0, same = 0;
  for (const r of results) {
    const sh = Object.values(r.by).filter((b) => b && !b.error && b.fit >= 2).map((b) => b.shift);
    if (sh.length < 2) continue;
    n++;
    if (Math.max(...sh) - Math.min(...sh) <= 0.5) same++;
  }
  lines.push("", `Posun se mezi ortofoty shoduje (do 0,5 m) u ${same} z ${n} řezů.`);
}

// ---------- 2. lane markings ----------
// Profile boundaries between two lanes (pruh|pruh …) confirmed by a marking within 0.5 m; roadways with two or
// more lanes in the profile where markings were found at all; lane widths from the markings (two neighbouring
// markings 2.4–4.6 m apart) against the profile lane lying there.
lines.push("", "## Vodorovné značení a šířky pruhů", "", "| ortofoto | vozovek s ≥ 2 pruhy | s nalezenou čarou | hranic pruh/pruh | potvrzeno čarou (±0,5 m) | pruhů změřeno čarami | rozdíl šířky, medián | rozdíl > 0,3 m |", "|---|---|---|---|---|---|---|---|");
const widthDiffs = {};
for (const k of sources) {
  let ways = 0, withMarks = 0, inner = 0, ok = 0, measured = 0;
  const diffs = [];
  for (const r of results) {
    const b = r.by[k];
    if (!b || b.error) continue;
    for (const w of b.ways) {
      const parts = r.parts.filter((p) => p.s + b.shift >= w.s - 0.01 && p.e + b.shift <= w.e + 0.01);
      const lanes = parts.filter((p) => LANE.has(p.type));
      if (lanes.length >= 2) { ways++; if (w.marks.length) withMarks++; }
      for (const i of w.lanes.inner) if (/^(pruh|bus|tramvaj)[a-z_]*\|(pruh|bus|tramvaj)/.test(i.between)) { inner++; if (i.mark !== null) ok++; }
      const ms = w.marks.map((m) => m.t).sort((a, b) => a - b);
      for (let q = 1; q < ms.length; q++) {
        const gap = ms[q] - ms[q - 1];
        if (gap < 2.4 || gap > 4.6) continue;
        const mid = (ms[q] + ms[q - 1]) / 2 - b.shift;
        const lane = lanes.find((p) => p.s <= mid && p.e >= mid);
        if (!lane) continue;
        measured++;
        diffs.push(+(gap - lane.w).toFixed(2));
      }
    }
  }
  widthDiffs[k] = diffs;
  const ad = diffs.map(Math.abs).sort((a, b) => a - b);
  lines.push(`| ${k} | ${ways} | ${withMarks} (${pct(withMarks, ways)}) | ${inner} | ${ok} (${pct(ok, inner)}) | ${measured} | ${ad.length ? ad[ad.length >> 1].toFixed(2) : "–"} m | ${ad.filter((x) => x > 0.3).length} |`);
}

// ---------- 3. what estimated shoulders hold ----------
lines.push("", "## Výplňová krajnice (odhad): co v ní je", "", "| ortofoto | krajnic | asfalt | šrafy | auta | nejasné | bez údaje |", "|---|---|---|---|---|---|---|");
for (const k of sources) {
  const c = { asfalt: 0, šrafy: 0, auta: 0, nejasné: 0, null: 0 };
  let n = 0;
  for (const r of results) for (const w of r.by[k]?.ways || []) for (const f of w.fills) if (f.type === "krajnice" && f.source === "odhad") { n++; c[f.verdict ?? "null"]++; }
  lines.push(`| ${k} | ${n} | ${c.asfalt} | ${c.šrafy} | ${c.auta} | ${c.nejasné} | ${c.null} |`);
}

// ---------- 4. parked cars at the kerbs ----------
lines.push("", "## Auta u obruby", "", "Pás 2 m u vnější obruby vozovky, ±20 m podél ulice; „řada aut“ = auta aspoň ve třetině metrových úseků.", "",
  "| ortofoto | obrub | se stáním v profilu (data) | z nich auta | stání odhadem | z nich auta | bez stání v profilu | z nich auta |", "|---|---|---|---|---|---|---|---|");
for (const k of sources) {
  let n = 0, data = 0, dataCars = 0, guess = 0, guessCars = 0, none = 0, noneCars = 0;
  for (const r of results) for (const w of r.by[k]?.ways || []) for (const kb of w.kerbs) {
    if (kb.cars === null || kb.cars === undefined) continue;
    n++;
    if (/parkovani \(odhad\)/.test(kb.profile || "")) { guess++; if (kb.cars) guessCars++; }
    else if (/parkovani/.test(kb.profile || "")) { data++; if (kb.cars) dataCars++; }
    else { none++; if (kb.cars) noneCars++; }
  }
  lines.push(`| ${k} | ${n} | ${data} | ${dataCars} (${pct(dataCars, data)}) | ${guess} | ${guessCars} (${pct(guessCars, guess)}) | ${none} | ${noneCars} (${pct(noneCars, none)}) |`);
}
// One-sided estimates: does the orthophoto put the cars on the side the rules chose?
lines.push("", "Odhad stání jen na jedné straně vozovky (pravidla nevědí, na které):", "", "| ortofoto | takových vozovek | auta na zvolené straně | auta na druhé straně | auta na obou | nikde |", "|---|---|---|---|---|---|");
for (const k of sources) {
  let n = 0, same = 0, other = 0, both = 0, none = 0;
  for (const r of results) for (const w of r.by[k]?.ways || []) {
    const [A, B] = w.kerbs;
    const gA = /parkovani \(odhad\)/.test(A.profile || ""), gB = /parkovani \(odhad\)/.test(B.profile || "");
    if (gA === gB || A.cars == null || B.cars == null) continue;
    n++;
    const chosen = gA ? A : B, rest = gA ? B : A;
    if (chosen.cars && rest.cars) both++; else if (chosen.cars) same++; else if (rest.cars) other++; else none++;
  }
  lines.push(`| ${k} | ${n} | ${same} | ${other} | ${both} | ${none} |`);
}

// ---------- 5. agreement between orthophotos ----------
const best = sources.includes("ipr05") ? "ipr05" : sources.includes("brno25") ? "brno25" : sources[0];
lines.push("", `## Shoda s nejjemnějším ortofotem (${best})`, "", "| ortofoto | obrub (obě s údajem) | stejný verdikt o autech | čar (vozovky) ±0,3 m společných |", "|---|---|---|---|");
for (const k of sources) {
  if (k === best) continue;
  let n = 0, same = 0, mA = 0, mB = 0, common = 0;
  for (const r of results) {
    const a = r.by[best], b = r.by[k];
    if (!a || !b || a.error || b.error || a.ways.length !== b.ways.length) continue;
    a.ways.forEach((wa, i) => {
      const wb = b.ways[i];
      wa.kerbs.forEach((ka, j) => { const kb = wb.kerbs[j]; if (ka.cars == null || kb.cars == null) return; n++; if (ka.cars === kb.cars) same++; });
      // Markings in the orthophoto's own place: compare after undoing each shift.
      const ta = wa.marks.map((m) => m.t - a.shift), tb = wb.marks.map((m) => m.t - b.shift);
      mA += ta.length; mB += tb.length;
      common += ta.filter((t) => tb.some((u) => Math.abs(u - t) <= 0.3)).length;
    });
  }
  lines.push(`| ${k} | ${n} | ${same} (${pct(same, n)}) | ${common} z ${mA} (${best}) / ${mB} (${k}) |`);
}
await fs.writeFile(path.join(OUT, "souhrn.md"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
