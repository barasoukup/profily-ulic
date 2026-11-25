// node yard-score.mjs : two judges a house (posudek4.json {a, b}), the pairs of the three arms. A house goes to an arm when
// no judge prefers the other; opposite = the two judges disagree; unclear: either could not see the house.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), R = (f) => JSON.parse(fs.readFileSync(path.join(HERE, f)));
const key = R("vysledky/klic4.json"), J = R("vysledky/posudek4.json"), files = fs.readdirSync(HERE).filter((f) => /^vzorek4-/.test(f));
const place = (q, L) => { const g = q.rank.replace(/\s/g, "").split(">"); const i = g.findIndex((x) => x.split("=").includes(L)); return i < 0 ? 9 : i; };
const vote = (q, x, y) => (q.best === "unclear" ? null : q.best === "same" || x === y ? 0 : Math.sign(place(q, y) - place(q, x)));
const binom = (a, b) => { const n = a + b, k = Math.min(a, b); let s = 0, c = 1; for (let i = 0; i <= k; i++) { s += c; c = (c * (n - i)) / (i + 1); } return n ? Math.min(1, (2 * s) / 2 ** n) : 1; };
const table = (name, set, x, y) => {
  const T = {}, add = (k, v) => { for (const s of [k, "all"]) { T[s] ??= { [x]: 0, [y]: 0, same: 0, opposite: 0, unclear: 0 }; T[s][v]++; } };
  let agree = 0, both = 0;
  for (const f of files) for (const s of R(f).rows) {
    if (!s.id.slice(2).startsWith(set) || key[s.id][x] === key[s.id][y]) continue;
    const v = ["a", "b"].map((j) => vote(J[j][s.id], key[s.id][x], key[s.id][y])), iso = s.id.slice(0, 2);
    if (v.includes(null)) { add(iso, "unclear"); continue; }
    both++; if (v[0] === v[1]) agree++;
    const t = v[0] + v[1], h = v[0] * v[1] < 0 ? "opposite" : t > 0 ? x : t < 0 ? y : "same";
    add(iso, h);
    if (process.argv[2] === "-v") console.log(s.id, h, v.join(), `${s.arms.old.look}>${s.arms.today.look}>${s.arms.new.look}`, s.arms.new.info.type || "-", s.arms.new.info.levels || "-", s.arms.new.info.block?.hull, "|", J.a[s.id].type, "|", J.b[s.id].type);
  }
  console.log(`\n${name}: ${x} : ${y}`);
  for (const [k, t] of Object.entries(T)) console.log(k.padEnd(4), `${t[x]} : ${t[y]}`, `same ${t.same}, opposite ${t.opposite}, unclear ${t.unclear}`, `p ${binom(t[x], t[y]).toFixed(3)}`);
  console.log(`judges agree ${agree}/${both}`);
};
table("the rule", "y", "new", "today");
table("the rule's houses, against ?off=vsedomy", "y", "new", "old");
table("the rule's houses, today against ?off=vsedomy", "y", "today", "old");
table("other houses (today = new) against ?off=vsedomy", "a", "new", "old");
const V = {};
for (const f of files) for (const s of R(f).rows) if (s.id[2] === "y") for (const j of "ab") for (const a of ["old", "today", "new"]) { const r = J[j][s.id].best === "unclear" ? null : J[j][s.id].r[key[s.id][a] - 1]; if (r) { V[a] ??= {}; V[a][r] = (V[a][r] || 0) + 1; } }
console.log("\nthe rule's houses, both judges", V);
