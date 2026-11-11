// What visitors corrected and designed, from the log of edits (kind "upravy", pilot/public/app.js logEdits):
// each record as a short list of changes, then the most common changes per kind (oprava = the detection was
// wrong, navrh = what people want of their streets). Run from logging/ (wrangler signed in to Bára's account):
//   node upravy.mjs            all records
//   node upravy.mjs oprava     only corrections of the data
import { execFileSync } from "node:child_process";

const only = process.argv[2];
const sql = `SELECT ts, detail, city, street, lat, lon, bearing, profile FROM events WHERE kind='upravy'${only ? ` AND detail='${only.replace(/\W/g, "")}'` : ""} ORDER BY id`;
const out = execFileSync("npx", ["wrangler", "d1", "execute", "profily-ulic-log", "--remote", "--json", "--command", sql], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const rows = JSON.parse(out)[0].results;

const m = (w) => `${(+w).toFixed(2).replace(".", ",")} m`;
const name = (x) => x.t + (x.o ? ` ${x.o}` : "") + (x.e ? ` (${x.e})` : "");
const signs = (x) => (x.z || []).join(" ");
// The changes from one short profile to another: part by part when the parts are the same kinds in the
// same order, otherwise the kinds that came and went (with their widths).
function changes(a, b) {
  const list = [];
  if (a.l !== b.l) list.push(`kraj A: ${a.l} → ${b.l}`);
  if (a.r !== b.r) list.push(`kraj B: ${a.r} → ${b.r}`);
  if (a.s.length === b.s.length && a.s.every((x, i) => x.t === b.s[i].t)) {
    a.s.forEach((x, i) => {
      const y = b.s[i];
      if (Math.abs(x.w - y.w) >= 0.01) list.push(`${x.t}: ${m(x.w)} → ${m(y.w)}`);
      for (const k of ["d", "b", "o", "p", "e", "n"]) if ((x[k] || "") !== (y[k] || "")) list.push(`${x.t} ${k}: ${x[k] || "–"} → ${y[k] || "–"}`);
      if (signs(x) !== signs(y)) list.push(`${x.t} značky: ${signs(x) || "–"} → ${signs(y) || "–"}`);
    });
    return list;
  }
  const left = [...b.s];
  for (const x of a.s) {
    const i = left.findIndex((y) => name(y) === name(x));
    if (i < 0) { list.push(`− ${name(x)} ${m(x.w)}`); continue; }
    const [y] = left.splice(i, 1);
    if (Math.abs(x.w - y.w) >= 0.01) list.push(`${name(x)}: ${m(x.w)} → ${m(y.w)}`);
  }
  for (const y of left) list.push(`+ ${name(y)} ${m(y.w)}`);
  return list;
}

const tally = {};
for (const r of rows) {
  const { pred, po } = JSON.parse(r.profile);
  const list = changes(pred, po);
  console.log(`\n${r.ts.slice(0, 16).replace("T", " ")}  ${r.detail.toUpperCase()}  ${r.street || "?"} (${r.city})  #rez=${(+r.lat).toFixed(6)},${(+r.lon).toFixed(6)},${Math.round(r.bearing)}`);
  for (const c of list) console.log("   " + c);
  // For the summary: a change without its widths ("pruh: … → …", "+ cyklopruh").
  for (const c of new Set(list.map((c) => c.replace(/\s*[\d,]+ m/g, "").replace(/: →$/, ": šířka")))) {
    const t = (tally[r.detail] ??= {});
    t[c] = (t[c] || 0) + 1;
  }
}
for (const [kind, t] of Object.entries(tally)) {
  console.log(`\nNejčastější změny – ${kind} (${rows.filter((r) => r.detail === kind).length} záznamů):`);
  for (const [c, n] of Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`  ${String(n).padStart(4)}  ${c}`);
}
if (!rows.length) console.log("Zatím žádné záznamy úprav.");
