// The index of the packed OSM tiles on R2 (.github/workflows/osm-tiles.yml): from the bucket's listing
// (aws s3api list-objects-v2 --output json), the newest file of each state (<code>-<date>-<hash>.posm, by the upload
// time) into index.json ({ files: { cz: …, sk: … }, attribution }, osmpack.js PackSet), and the files to delete (all
// but the two newest of each state) into a list of keys.
//   node tools/osm_index.mjs list.json index.json delete.txt [meta dir]
import fs from "node:fs";

// metas: the index.json each job wrote beside its file (pack_osm_tiles.mjs), whose bbox of the chosen file is kept.
export function osmIndex(listing, metas = []) {
  const by = {};
  for (const o of listing?.Contents || []) {
    const name = o.Key.replace(/^osm\//, ""), m = /^([a-z]{2}(?:_[a-z]{2})?)-\d{4}-\d\d-\d\d(-[0-9a-f]+)?\.posm$/.exec(name);
    if (m) (by[m[1]] ??= []).push({ key: o.Key, name, at: Date.parse(o.LastModified) });
  }
  const files = {}, remove = [];
  for (const [code, list] of Object.entries(by).sort()) {
    list.sort((a, b) => b.at - a.at);
    files[code] = list[0].name;
    remove.push(...list.slice(2).map((x) => x.key));
  }
  const bbox = {};
  for (const m of metas) for (const [code, file] of Object.entries(m.files || {})) if (files[code] === file && m.bbox?.[code]) bbox[code] = m.bbox[code];
  return { index: { files, ...(Object.keys(bbox).length && { bbox }), attribution: "© OpenStreetMap contributors, ODbL 1.0" }, remove };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const [list, out, del, metaDir] = process.argv.slice(2);
  const metas = metaDir && fs.existsSync(metaDir) ? fs.readdirSync(metaDir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(`${metaDir}/${f}`, "utf8"))) : [];
  const { index, remove } = osmIndex(JSON.parse(fs.readFileSync(list, "utf8")), metas);
  if (!Object.keys(index.files).length) { console.error("na R2 nejsou žádné dlaždice"); process.exit(1); }
  fs.writeFileSync(out, JSON.stringify(index, null, 1) + "\n");
  fs.writeFileSync(del, remove.join("\n") + (remove.length ? "\n" : ""));
}
