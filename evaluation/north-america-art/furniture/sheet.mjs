// The contact sheet: node evaluation/north-america-art/furniture/sheet.mjs out.svg [dark]  (then qlmanage -t renders it)
// Every piece at one scale (1 px = 1 cm) beside the Czech one and a person of 1.75 m (Streetmix people-01).
import fs from "node:fs";
const PUB = new URL("../../../pilot/public/", import.meta.url);
const [out, theme] = process.argv.slice(2);
const bg = theme === "dark" ? "#23272a" : "#f3f1ec", ink = theme === "dark" ? "#e8e8e4" : "#222";
let n = 0;
const load = (f) => { const t = fs.readFileSync(new URL(f.startsWith("navrhy") ? `../../evaluation/north-america-art/furniture/${f}` : f, PUB), "utf8"); const vb = t.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  // ids of a picture are made its own in the sheet
  const k = `p${n++}_`; return { w: vb[2], h: vb[3], vb, body: t.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/id="([^"]+)"/g, `id="${k}$1"`).replace(/url\(#/g, `url(#${k}`).replace(/href="#/g, `href="#${k}`) }; };
const rows = JSON.parse(process.env.ROWS || "null") || [
  [["praha/lamp-left", "Česko"], ["northamerica/lamp-left", "shared"], ["newyork/lamp-left", "New York"], ["newyork/lamp-bishop-left", "Bishop's Crook"], ["washington/lamp-globe-left", "Wash. Globe *"], ["boston/lamp-acorn-left", "Boston acorn *"], ["sanfrancisco/lamp-path-of-gold-left", "Path of Gold *"], ["northamerica/lamp-right", "shared right"]],
  [["cesko/sloup-trakce-left", "Česko"], ["northamerica/sloup-trakce-left", "shared"], ["cesko/sloup-trakce-lampa-left", "Česko"], ["northamerica/sloup-trakce-lampa-left", "shared"], ["northamerica/sloup-trakce-lampa-right", "right"], ["northamerica/lamp-right", "shared right"]],
  [["cesko/oznacnik-left", "Česko"], ["northamerica/oznacnik-left", "shared bus"], ["northamerica/oznacnik-tram-left", "shared tram"], ["washington/oznacnik-left", "Washington"], ["newyork/oznacnik-left", "New York"], ["toronto/oznacnik-left", "Toronto bus"], ["toronto/oznacnik-tram-left", "Toronto tram"], ["boston/oznacnik-left", "Boston"], ["sanfrancisco/oznacnik-left", "San Francisco"], ["washington/oznacnik-right", "right"], ["cesko/bench-center", "Česko"], ["northamerica/bench-center", "shared"], ["cesko/bike-rack", "Česko"], ["northamerica/bike-rack", "shared"], ["cesko/bollard", "Česko"], ["northamerica/bollard", "shared"], ["navrhy/hydrant", "proposal"], ["navrhy/parking-meter", "proposal"]],
  [["cesko/transit-shelter-left", "Česko"], ["northamerica/transit-shelter-left", "shared"], ["washington/transit-shelter-left", "Washington"], ["toronto/transit-shelter-left", "Toronto"], ["cesko/transit-shelter-green-left", "Česko green"], ["northamerica/transit-shelter-green-left", "shared green"], ["washington/transit-shelter-green-left", "Wash. green"], ["toronto/transit-shelter-green-left", "Toronto green"], ["northamerica/transit-shelter-right", "right"]],
];
const person = load("streetmix/people-01.svg");
let y = 30, W = 0, body = "";
for (const row of rows) {
  const ps = row.map(([f, l]) => [load(`${f}.svg`), l]), h = Math.max(...ps.map(([p]) => p.h)) + 20;
  let x = 30;
  body += `<rect x="0" y="${y + h}" width="9000" height="3" fill="${ink}" opacity=".35"/>`;
  const put = (p, l, s = 1) => { body += `<svg x="${x}" y="${y + h - p.h * s}" width="${p.w * s}" height="${p.h * s}" viewBox="${p.vb.join(" ")}">${p.body}</svg><text x="${x + (p.w * s) / 2}" y="${y + h + 32}" font-family="Helvetica" font-size="24" fill="${ink}" text-anchor="middle">${l}</text>`; x += p.w * s + Math.max(55, 20 + l.length * 11 - p.w * s); };
  // people-01 is drawn 1.76 m high.
  put(person, "1,75 m");
  for (const [p, l] of ps) put(p, l);
  W = Math.max(W, x); y += h + 70;
}
const S = Math.max(W, y);
fs.writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}"><rect width="${S}" height="${S}" fill="${bg}"/>${body.replaceAll('width="9000"', `width="${W}"`)}</svg>`);
console.log(W, y, S);
