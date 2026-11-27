// Copies recordings of other working copies into the common folder (data/replay/ of the main repository, git ignores it).
// Bodies are stored once by their hash; of the index a cut is taken from the first source that has it (a cut recorded
// twice would play its answers twice). Nothing in the sources is changed or deleted.
//   node evaluation/replay/import.mjs <recording folder> [<recording folder> …]   (e.g. …/worktrees/x/evaluation/replay/data)
import fs from "node:fs";
import path from "node:path";
import { DATA } from "./paths.mjs";

fs.mkdirSync(path.join(DATA, "bodies"), { recursive: true });
const indexFile = path.join(DATA, "index.jsonl");
const have = new Set();
if (fs.existsSync(indexFile)) for (const l of fs.readFileSync(indexFile, "utf8").split("\n")) if (l) have.add(JSON.parse(l).cut);
for (const src of process.argv.slice(2)) {
  const idx = path.join(src, "index.jsonl");
  if (!fs.existsSync(idx)) { console.log(`${src}: bez index.jsonl`); continue; }
  const mine = new Set(), out = [];
  for (const l of fs.readFileSync(idx, "utf8").split("\n")) {
    if (!l) continue;
    const cut = JSON.parse(l).cut;
    if (have.has(cut)) continue;
    mine.add(cut); out.push(l);
  }
  let copied = 0;
  const bodies = path.join(src, "bodies");
  for (const d of fs.readdirSync(bodies)) {
    fs.mkdirSync(path.join(DATA, "bodies", d), { recursive: true });
    for (const f of fs.readdirSync(path.join(bodies, d))) {
      const to = path.join(DATA, "bodies", d, f);
      if (!fs.existsSync(to)) { fs.copyFileSync(path.join(bodies, d, f), to); copied++; }
    }
  }
  fs.appendFileSync(indexFile, out.length ? out.join("\n") + "\n" : "");
  for (const c of mine) have.add(c);
  console.log(`${src}: ${mine.size} řezů, ${out.length} odpovědí, ${copied} nových těl`);
}
