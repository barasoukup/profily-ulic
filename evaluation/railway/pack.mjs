// The railway lines of the tiles build.sh made (the new kinds: rail, narrow_gauge, subway) → one tile folder → the small pack
// "rail" beside a state's own (osmpack.js PackSet merges the pieces of a tile from every pack that holds it), so the app
// sees them as it will once the weekly build keeps them. Never touches the real packs: the data folder of this worktree.
//   node evaluation/railway/pack.mjs <data dir with tiles-<ISO>> <out folder of the pack> [ISO …]
import fs from "node:fs";
import path from "node:path";
const [dir, out, ...isos] = process.argv.slice(2);
const KIND = /"railway":"(rail|narrow_gauge|subway)"/;
const tiles = new Map();
for (const iso of isos) {
  const d = path.join(dir, `tiles-${iso}`);
  for (const f of fs.readdirSync(d).filter((f) => /^-?\d+_-?\d+\.json$/.test(f))) {
    for (const l of fs.readFileSync(path.join(d, f), "utf8").split("\n")) if (l && KIND.test(l)) {
      const set = tiles.get(f) ?? tiles.set(f, new Set()).get(f);
      set.add(l);
    }
  }
}
const rt = path.join(dir, "tiles-rail");
fs.rmSync(rt, { recursive: true, force: true });
fs.mkdirSync(rt, { recursive: true });
let n = 0;
for (const [f, set] of tiles) { fs.writeFileSync(path.join(rt, f), [...set].join("\n") + "\n"); n += set.size; }
console.log(`${n} railway lines in ${tiles.size} tiles`);
fs.mkdirSync(out, { recursive: true });
