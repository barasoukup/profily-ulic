// The index of the packed OSM tiles on R2 (.github/workflows/osm-tiles.yml): from the bucket's listing
// (aws s3api list-objects-v2 --output json), the newest file of each state (<code>-<date>-<hash>.posm, by the upload
// time) into index.json ({ files: { cz: …, sk: … }, attribution }, osmpack.js PackSet), and the files to delete (all
// but the newest of each state; Bára 26. 11. 2026: two copies of 106 packs would pass the 10 GB of R2's free tier)
// into a list of keys.
// A new file much smaller than the one before it (under MIN_SHARE of its size: a cut-down extract of Geofabrik, a build
// with tiles missing) is not taken: the state keeps its previous file and nothing of it is deleted, so a bad build does
// not delete the last good one (the hostile review of 26. 11. 2026); the run says so (suspect).
//   node tools/osm_index.mjs list.json index.json delete.txt [meta dir]
import fs from "node:fs";

// metas: the index.json each job wrote beside its file (pack_osm_tiles.mjs), whose bbox of the chosen file is kept.
export const MIN_SHARE = 0.7;
export function osmIndex(listing, metas = []) {
  const by = {};
  for (const o of listing?.Contents || []) {
    const name = o.Key.replace(/^osm\//, ""), m = /^([a-z]{2}(?:_[a-z]{1,8})*)-\d{4}-\d\d-\d\d(-[0-9a-f]+)?\.posm$/.exec(name);
    if (m) (by[m[1]] ??= []).push({ key: o.Key, name, at: Date.parse(o.LastModified), size: Number(o.Size) || 0 });
  }
  const files = {}, remove = [], suspect = [];
  for (const [code, list] of Object.entries(by).sort()) {
    list.sort((a, b) => b.at - a.at);
    if (list.length > 1 && list[1].size > 0 && list[0].size < MIN_SHARE * list[1].size) {
      files[code] = list[1].name;
      suspect.push(list[0].name);
      continue;
    }
    files[code] = list[0].name;
    remove.push(...list.slice(1).map((x) => x.key));
  }
  const bbox = {};
  for (const m of metas) for (const [code, file] of Object.entries(m.files || {})) if (files[code] === file && m.bbox?.[code]) bbox[code] = m.bbox[code];
  return { index: { files, ...(Object.keys(bbox).length && { bbox }), attribution: "© OpenStreetMap contributors, ODbL 1.0" }, remove, suspect };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const [list, out, del, metaDir] = process.argv.slice(2);
  const metas = metaDir && fs.existsSync(metaDir) ? fs.readdirSync(metaDir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(`${metaDir}/${f}`, "utf8"))) : [];
  const { index, remove, suspect } = osmIndex(JSON.parse(fs.readFileSync(list, "utf8")), metas);
  for (const name of suspect) console.error(`::warning::${name} je o víc než ${Math.round((1 - MIN_SHARE) * 100)} % menší než předchozí soubor státu: index ho nebere, nic se nemaže`);
  if (!Object.keys(index.files).length) { console.error("na R2 nejsou žádné dlaždice"); process.exit(1); }
  fs.writeFileSync(out, JSON.stringify(index, null, 1) + "\n");
  fs.writeFileSync(del, remove.join("\n") + (remove.length ? "\n" : ""));
}
