// The photos of the samples (sample.json: Toronto F.., sample-osm.json: OSM E..) cut to each house's direction, mixed in a fixed
// order, for two blind judges (no floors of the app shown).   node prepare.mjs <scratch dir with F..jpg and E..jpg> <pack dir>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const HERE = path.dirname(new URL(import.meta.url).pathname), PH = process.argv[2], OUT = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });
const rows = [...JSON.parse(fs.readFileSync(path.join(HERE, "sample.json"))).rows, ...JSON.parse(fs.readFileSync(path.join(HERE, "sample-osm.json"))).rows];
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const order = rows.map((r) => r.id).sort(() => rnd() - 0.5);
for (const r of rows) {
  const f = path.join(PH, `${r.id}.jpg`), [w, h] = execFileSync("magick", ["identify", "-format", "%w %h", f]).toString().split(" ").map(Number);
  const cw = Math.round(w * (r.pano ? 0.22 : 0.6)), x = Math.round(w * (0.5 + r.off / (r.pano ? 360 : 72)) - cw / 2);
  execFileSync("magick", [f, "-virtual-pixel", r.pano ? "tile" : "black", "-distort", "SRT", `${x + cw / 2},${h / 2} 1 0 ${w / 2},${h / 2}`, "-gravity", "center", "-crop", `${cw}x${r.pano ? Math.round(h * 0.6) : h}+0+0`, "+repage", "-resize", "1000x1000", path.join(OUT, `${r.id}.jpg`)]);
}
fs.writeFileSync(path.join(OUT, "ZADANI.md"), `# Kolik má dům podlaží

Na každé fotce \`<id>.jpg\` je uprostřed budova u ulice (fotka z ulice, budova je ve středu snímku; když je vidět víc budov, platí ta uprostřed).
Urči počet nadzemních podlaží, která jsou vidět z ulice: přízemí se počítá, suterén s okny nad terénem jako půl podlaží, obytný
štít nebo podkroví s okny jako půl podlaží. Nezjišťuj nic jinde.

Budovy (v tomto pořadí): ${order.join(", ")}

Výstup jeden JSON řádek na budovu:
\`{"id": "F01", "floors": 2, "kind": "detached|semidetached|terrace|apartments|shop|other", "sure": "high|mid|low"}\`; když budova nejde poznat, \`"floors": null\`.
`);
console.log(rows.length, "budov");
