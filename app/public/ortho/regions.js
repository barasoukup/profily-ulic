
// The Länder a point may lie in (laender.json): the one it is in first, then those within about 2 km (the boundaries
// are of 1 : 1 000 000), at most three.
let laender = null;
const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
// The Land a point lies in, strictly (no neighbours within 2 km), or null outside Germany.
export async function landAt(lon, lat) {
  await landsAt(lon, lat);
  const all = await laender;
  return Object.keys(all).find((code) => inRings(all[code], lon, lat)) ?? null;
}
export async function landsAt(lon, lat, json = null) {
  laender ??= json ? Promise.resolve(json) : (async () => {
    const url = new URL("../laender.json", import.meta.url);
    if (url.protocol === "file:") return JSON.parse((await import("node:fs")).readFileSync(url, "utf8"));
    const r = await fetch(url);
    if (!r.ok) throw new Error(`laender.json ${r.status}`);
    return r.json();
  })();
  // A file that did not load is asked again next time (the review: Germany without orthophoto until a reload).
  const all = await laender.catch((err) => { laender = null; throw err; }), d = 0.02, near = [[0, 0], [d, 0], [-d, 0], [0, d], [0, -d], [d, d], [-d, -d], [d, -d], [-d, d]];
  const hits = Object.keys(all).map((code) => ({ code, n: near.findIndex(([dx, dy]) => inRings(all[code], lon + dx * 1.5, lat + dy)) })).filter((x) => x.n >= 0);
  return hits.sort((a, b) => a.n - b.n).slice(0, 3).map((x) => x.code);
}
// Belgium's regions (regions-be.json, tools/build_regions_be.mjs: bru, vl, wal): the one a point lies in first, then
// those within about 2 km (the language border is of 1 : 1 000 000).
let regionsBe = null;
export async function beRegionsAt(lon, lat, json = null) {
  regionsBe ??= json ? Promise.resolve(json) : (async () => {
    const url = new URL("../regions-be.json", import.meta.url);
    if (url.protocol === "file:") return JSON.parse((await import("node:fs")).readFileSync(url, "utf8"));
    const r = await fetch(url);
    if (!r.ok) throw new Error(`regions-be.json ${r.status}`);
    return r.json();
  })();
  const all = await regionsBe.catch((err) => { regionsBe = null; throw err; }), d = 0.02, near = [[0, 0], [d, 0], [-d, 0], [0, d], [0, -d], [d, d], [-d, -d], [d, -d], [-d, d]];
  const hits = Object.keys(all).map((code) => ({ code, n: near.findIndex(([dx, dy]) => inRings(all[code], lon + dx * 1.5, lat + dy)) })).filter((x) => x.n >= 0);
  return hits.sort((a, b) => a.n - b.n).map((x) => x.code);
}
