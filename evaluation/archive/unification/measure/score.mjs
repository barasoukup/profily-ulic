// Part 1: the official judged points in two arms (O: all the switches off, N: today's code; OSK: O with Slovakia without the
// law's parking, as it was) against the same judgements (as score-states.mjs), per state, per switch and per cut.
//   node score.mjs            (results/oficialni.json, results/znacky.json; FILE=… another collection)
import fs from "node:fs";
import { compare } from "../../../universal/compare.mjs";
const here = (f) => new URL(f, import.meta.url);
const rows = JSON.parse(fs.readFileSync(here(process.env.FILE || "results/oficialni.json")));
const tags = JSON.parse(fs.readFileSync(here("results/znacky.json")));
const J = new Map(), U = here("../../../universal/results/");
for (const f of fs.readdirSync(U).filter((f) => /^u-.*\.jsonl$/.test(f))) for (const l of fs.readFileSync(new URL(f, U), "utf8").split("\n").filter(Boolean)) { const j = JSON.parse(l); if (j.usable) J.set(j.id, j); }
const serv = {};
for (const f of fs.readdirSync(U).filter((f) => /^sluzebni-/.test(f))) for (const r of JSON.parse(fs.readFileSync(new URL(f, U)))) if (r.service) serv[r.id] = r.service;
const NO = new Set(["driveway", "parking_aisle", "drive-through"]);
const ROAD = ["pruh", "pruh_piktokoridor", "obsluzna", "bus", "bus_cyklo", "tramvaj_v_pruhu"];
const P = (c) => (c?.segments || []).map(([t, w]) => [t, w]);
export const key = (c) => P(c).map((x) => x.join(" ")).join(" · ");
const cmp = (id, c) => { const j = J.get(id); return compare(j.parts, P(c), true, false, { A: j.facadeA === false, B: j.facadeB === false }); };
for (const r of rows) if (r.country === "SK") r.OSK ||= r.N; // arms the same as N are not stored
const OFF = ["mapfill", "lawlanes", "parkshare", "obsluzne", "protejsi", "ulicky", "osaroad", "pocetpruhu", "widereach"];
const ok = rows.filter((r) => J.has(r.id) && r.N?.segments?.length && !NO.has(tags[r.id]?.service ?? serv[r.id]));
const isRoad = (r, k) => [...P(r[k]).map((p) => p[0]), ...J.get(r.id).parts.map((p) => String(p[0]).replace("?", ""))].some((t) => ROAD.includes(t));
const pct = (a, n) => (n ? `${Math.round((100 * a) / n)} %` : "–");
const stat = (R, k) => { const s = R.map((r) => cmp(r.id, r[k])), n = s.length; return { n, same: pct(s.filter((x) => x.same).length, n), score: pct(s.reduce((a, x) => a + x.score, 0), n), lanes: pct(s.filter((x) => x.lanesA === x.lanesB).length, n), w1: pct(s.filter((x) => Math.abs(x.widthA - x.widthB) <= 1).length, n), w2: pct(s.filter((x) => Math.abs(x.widthA - x.widthB) <= 2).length, n) }; };
const ORDER = ["CZ", "SK", "AT", "DE", "CH", "LI", "NL", "BE", "LU", "PL", "FR", "ES", "PT", "CY", "MT", "IT", "EE", "SI", "LT", "FI", "DK"];
const bw = (r, K, B) => { const a = cmp(r.id, r[K]), b = cmp(r.id, r[B]); const d = b.score - a.score; if (Math.abs(d) > 1e-9) return d > 0 ? "lépe" : "hůř"; const l = (Math.abs(b.lanesA - b.lanesB)) - Math.abs(a.lanesA - a.lanesB); if (l) return l < 0 ? "lépe" : "hůř"; const w = Math.abs(b.widthA - b.widthB) - Math.abs(a.widthA - a.widthB); return Math.abs(w) <= 0.3 ? "stejně" : w < 0 ? "lépe š" : "hůř š"; };
console.log("| stát | řezů | shoda složení O → N | složení stejné | pruhy stejně | šířka do 1 m | do 2 m | změněno | lépe : hůř : stejně (složení, pak pruhy) |\n|---|---|---|---|---|---|---|---|---|");
let all = [];
for (const s of [...ORDER, "vše"]) {
  const R = ok.filter((r) => (s === "vše" || r.country === s) && r.N && r.O && (isRoad(r, "N") || isRoad(r, "O")) && r.O.segments?.length), old = s === "SK" ? "OSK" : "O";
  if (!R.length) continue;
  const a = stat(R, old), b = stat(R, "N"), ch = R.filter((r) => key(r[old]) !== key(r.N)), v = ch.map((r) => bw(r, old, "N")), c = (k) => v.filter((x) => x === k).length;
  if (s !== "vše") all.push(...ch.map((r) => [r, old]));
  console.log(`| ${s} | ${a.n} | ${a.score} → **${b.score}** | ${a.same} → ${b.same} | ${a.lanes} → ${b.lanes} | ${a.w1} → ${b.w1} | ${a.w2} → ${b.w2} | ${ch.length} | ${c("lépe")} : ${c("hůř")} : ${c("stejně") + c("lépe š") + c("hůř š")} |`);
}
console.log("\nZměněné řezy (přičtení: který vypínač sám změní dnešní profil):");
const by = {};
for (const [r, old] of all) {
  const who = OFF.filter((k) => r[k]?.segments && key(r[k]) !== key(r.N)); if (r.country === "SK" && r.OSK && key(r.OSK) !== key(r.O)) who.push("parkGuess SK");
  const a = cmp(r.id, r[old]), b = cmp(r.id, r.N);
  console.log(`- ${r.id} ${r.N.name || "(bez jména)"} [${who.join(", ") || "jen dohromady"}] ${Math.round(100 * a.score)} → ${Math.round(100 * b.score)} %, pruhy ${a.lanesB} → ${b.lanesB} (posuzovatel ${a.lanesA}), šířka ${a.widthB.toFixed(1)} → ${b.widthB.toFixed(1)} (${a.widthA.toFixed(1)})\n  - O: ${key(r[old])}\n  - N: ${key(r.N)}\n  - posuzovatel: ${J.get(r.id).parts.map((x) => x.join(" ")).join(" · ")}`);
}
console.log("\nJednotlivé vypínače proti posuzovatelům (vypnuto → dnes):");
for (const k of [...OFF, "OSK"]) {
  const R = ok.filter((r) => r[k]?.segments?.length && key(r[k]) !== key(r.N) && (k !== "OSK" || r.country === "SK")), v = R.map((r) => [r.country, bw(r, k, "N")]);
  console.log(`- ${k}: změněno ${R.length}; složení/pruhy lépe ${v.filter((x) => x[1] === "lépe").length}, hůř ${v.filter((x) => x[1] === "hůř").length}, jinak stejné (šířka lépe ${v.filter((x) => x[1] === "lépe š").length}, hůř ${v.filter((x) => x[1] === "hůř š").length}, stejně ${v.filter((x) => x[1] === "stejně").length}); ` + ORDER.map((s) => [s, v.filter((x) => x[0] === s)]).filter(([, x]) => x.length).map(([s, x]) => `${s} ${x.filter((y) => y[1] === "lépe").length}:${x.filter((y) => y[1] === "hůř").length}:${x.filter((y) => !/^(lépe|hůř)$/.test(y[1])).length}`).join(", "));
}
