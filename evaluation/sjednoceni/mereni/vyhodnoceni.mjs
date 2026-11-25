// The blind judgements (data/<package>/posudek*.json) against the keys: N (today's code) against the switch off.
import fs from "node:fs";
const here = (f) => new URL(f, import.meta.url), sum = {}, out = [];
const save = {};
for (const p of ["ma1", "ma2", "mb1", "mb2", "mb3"]) {
  const key = JSON.parse(fs.readFileSync(here(`vysledky/klic-${p}.json`)));
  for (const f of fs.readdirSync(here(`data/${p}/`)).filter((f) => /^posudek.*json$/.test(f))) {
    const q = JSON.parse(fs.readFileSync(here(`data/${p}/${f}`)));
    for (const [n, v] of Object.entries(q)) {
      const k = key[n], sw = k.X === "N" ? k.Y : k.X, g = k.id.split("-").slice(1).join("-").replace(/-\d+$/, ""), w = /^[XY]$/.test(v.a) ? (k[v.a] === "N" ? "N" : "O") : v.a;
      (save[`${sw} ${k.id}`] ||= []).push({ w, j: v.j, d: v.d });
    }
  }
}
for (const [k, v] of Object.entries(save)) {
  const [sw, id] = k.split(" "), c = id.split("-")[1].toUpperCase();
  const n = v.filter((x) => x.w === "N").length, o = v.filter((x) => x.w === "O").length, w = n > o ? "N" : o > n ? "O" : v.some((x) => x.w === "N") ? "neshoda" : v[0].w;
  for (const g of [c, "vše"]) { const s = ((sum[sw] ||= {})[g] ||= {}); s[w] = (s[w] || 0) + 1; }
  out.push(`${sw} ${id}: **${w}** (${v.map((x) => `${x.w} ${x.j}: ${x.d}`).join(" | ")})`);
}
for (const [sw, G] of Object.entries(sum)) for (const [g, s] of Object.entries(G)) console.log(sw, g, JSON.stringify(s));
console.log(out.join("\n"));
fs.writeFileSync(here("vysledky/posudky.json"), JSON.stringify(save, null, 1));
