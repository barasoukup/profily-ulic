// The blind A/B of Tallinn's surface map, round 2 (hostile review 24. 11. 2026, bod 5): named streets for cars only
// (sample2.json), A = without the map (?tallinn=0), B = with it (vysledky/rezy2.json, collected in the app on localhost).
//   node evaluation/estonia/ab/slepe.mjs prepare   X/Y in a random order (seed), the key in data/klic.json (git ignores
//                                                   data/), vysledky/slepe.json for the pictures:
//   ORTHO=ee IN=../../estonia/ab/vysledky/slepe.json OUT=../../estonia/ab/data/slepe TITLE="slepé A/B mapy Tallinnu" \
//     LA="varianta X" LB="varianta Y" node evaluation/slovensko/ab/obrazky.mjs
//   node evaluation/estonia/ab/slepe.mjs photos    a Mapillary photo along the street at each cut (data/foto-ulice/)
//   node evaluation/estonia/ab/slepe.mjs score     the judge's X/Y (vysledky/posudky2.json) unblinded with the key
import fs from "node:fs/promises";

const HERE = new URL("./", import.meta.url);
const rows = JSON.parse(await fs.readFile(new URL("vysledky/rezy2.json", HERE), "utf8"));
const sample = JSON.parse(await fs.readFile(new URL("sample2.json", HERE), "utf8"));
const cmd = process.argv[2];
if (cmd === "prepare") {
  let seed = 4242024;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const key = {}, out = [];
  for (const r of rows) {
    const swap = rnd() < 0.5;
    key[r.id] = swap ? { X: "B", Y: "A" } : { X: "A", Y: "B" };
    // The pictures take the cut's place from the B slot: both cuts are at the same place.
    out.push({ id: r.id, town: r.town, A: swap ? r.B : r.A, B: swap ? r.A : r.B });
  }
  await fs.mkdir(new URL("data/", HERE), { recursive: true });
  await fs.writeFile(new URL("data/klic.json", HERE), JSON.stringify(key, null, 1));
  await fs.writeFile(new URL("vysledky/slepe.json", HERE), JSON.stringify(out));
  console.log(out.length);
} else if (cmd === "photos") {
  const TOKEN = process.env.MAPILLARY_TOKEN || (await fs.readFile(new URL("../../streetview/token.local", HERE), "utf8").catch(() => "")).trim();
  if (!TOKEN) { console.error("chybí token Mapillary"); process.exit(1); }
  const FOTO = new URL("data/foto-ulice/", HERE);
  await fs.mkdir(FOTO, { recursive: true });
  const UA = { "User-Agent": "profily-ulic" }, angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
  for (const r of rows) {
    const c = r.B?.lat ? r.B : r.A;
    const meta = new URL(`${r.id}.json`, FOTO);
    if (!c?.lat || (await fs.stat(meta).catch(() => null))) continue;
    const d = 0.0003, q = new URLSearchParams({ access_token: TOKEN, bbox: [c.lon - d * 2, c.lat - d, c.lon + d * 2, c.lat + d].map((v) => v.toFixed(6)).join(","), limit: 500, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_1024_url,computed_geometry,geometry" });
    const json = await (await fetch(`https://graph.mapillary.com/images?${q}`, { headers: UA })).json();
    const mx = 111320 * Math.cos((c.lat * Math.PI) / 180), my = 110574;
    // Along the street (either way), within 20 m of the cut, newest first.
    const imgs = (json.data || []).map((x) => {
      const [lon, lat] = (x.computed_geometry || x.geometry).coordinates;
      return { id: x.id, at: x.captured_at, pano: !!x.is_pano, url: x.thumb_1024_url, compass: x.computed_compass_angle ?? x.compass_angle, d: Math.hypot((c.lon - lon) * mx, (c.lat - lat) * my) };
    }).filter((i) => i.d <= 20 && !i.pano && Math.min(angle(i.compass, c.bearing), angle(i.compass, c.bearing + 180)) <= 25).sort((a, b) => b.at - a.at);
    const im = imgs[0];
    if (im) await fs.writeFile(new URL(`${r.id}.jpg`, FOTO), Buffer.from(await (await fetch(im.url, { headers: UA })).arrayBuffer()));
    await fs.writeFile(meta, JSON.stringify({ photo: im ? { id: im.id, year: new Date(im.at).getFullYear(), d: +im.d.toFixed(1) } : null }));
    console.log(r.id, im ? `${new Date(im.at).getFullYear()} ${im.d.toFixed(0)} m` : "–");
    await new Promise((res) => setTimeout(res, 400));
  }
} else if (cmd === "score") {
  const key = JSON.parse(await fs.readFile(new URL("data/klic.json", HERE), "utf8"));
  const judged = JSON.parse(await fs.readFile(new URL("vysledky/posudky2.json", HERE), "utf8"));
  const hw = Object.fromEntries(sample.map((s) => [s.id, s.highway]));
  const tally = { B: 0, A: 0, stejne: 0, nejde: 0 }, by = {};
  const lines = [];
  for (const r of rows) {
    const j = judged[r.id];
    if (!j) continue;
    const v = j.better === "X" || j.better === "Y" ? key[r.id][j.better] : j.better === "stejne" ? "stejne" : "nejde";
    tally[v]++;
    const g = hw[r.id];
    (by[g] ??= { B: 0, A: 0, stejne: 0, nejde: 0 })[v]++;
    lines.push(`${r.id}\t${r.want}\t${g}\t${v}\t${j.photo ? "foto" : "bez fotky"}\t${j.why || ""}`);
  }
  await fs.writeFile(new URL("vysledky/posudky2-odslepene.tsv", HERE), lines.join("\n") + "\n");
  console.log("celkem", tally);
  for (const [g, t] of Object.entries(by)) console.log(g, t);
}
