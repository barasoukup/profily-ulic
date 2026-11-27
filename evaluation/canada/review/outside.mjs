// The surroundings of Washington and Toronto (no map of surfaces): 30 random cuts by the network's length (sample.json usout, caout),
// the images of ../../universal/BRIEF.md without any profile: the orthophoto (USGS National Map; Ontario's 16 cm imagery 2023–2027, only
// looked at) and Mapillary's photos where there are any.   TOKEN=<file> node outside.mjs      data/review-out-<k>/
import fs from "node:fs/promises";
import path from "node:path";
import { orthoImage } from "../../usa-dc/prepare.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname), DATA = path.join(HERE, "..", "data"), TOKEN = (await fs.readFile(process.env.TOKEN, "utf8")).trim();
const SERVICE = { usout: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/export", caout: "https://ws.geoservices.lrc.gov.on.ca/arcgis5/rest/services/AerialImagery/GEO_Imagery_Data_Service_2023to2027/ImageServer/exportImage?bandIds=0,1,2&" };
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const sample = JSON.parse(await fs.readFile(path.join(HERE, "sample.json"), "utf8")).filter((s) => /out$/.test(s.group)), rows = JSON.parse(await fs.readFile(path.join(HERE, "../../universal/data/na-review.json"), "utf8"));
const list = sample.map((s) => ({ ...s, ...rows.find((r) => r.id === s.id && r.variant === "def"), group: s.group }));
const report = [];
for (let k = 0; k * 10 < list.length; k++) {
  const dir = path.join(DATA, `review-out-${k + 1}`), L = [];
  await fs.mkdir(dir, { recursive: true });
  for (const r of list.slice(k * 10, (k + 1) * 10)) {
    await orthoImage({ lat: r.lat, lon: r.lon, bearing: r.bearing, half: 30 }, path.join(dir, `${r.id}-ortho.jpg`), { service: SERVICE[r.group] });
    await fs.writeFile(path.join(dir, `${r.id}.txt`), "60");
    const imgs = ((await (await fetch(`https://graph.mapillary.com/images?${new URLSearchParams({ access_token: TOKEN, lat: r.lat, lng: r.lon, radius: 30, limit: 100, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_1024_url" })}`)).json()).data || [])
      .map((d) => ({ at: d.captured_at, pano: !!d.is_pano, url: d.thumb_1024_url, c: d.computed_compass_angle ?? d.compass_angle }));
    const ph = [];
    for (const [q, deg] of [["f", r.bearing], ["b", r.bearing + 180]]) {
      const im = imgs.filter((i) => i.pano || angle(i.c, deg) <= 35).sort((a, b) => a.pano - b.pano || b.at - a.at)[0];
      if (im) { await fs.writeFile(path.join(dir, `${r.id}-${q}.jpg`), Buffer.from(await (await fetch(im.url)).arrayBuffer())); ph.push(q); }
    }
    report.push({ id: r.id, kind: r.kind, photo: ph.length });
    L.push(`- ${r.id}: šířka obrázku 60 m; fotky: ${ph.join(", ") || "žádné"}`);
    await new Promise((q) => setTimeout(q, 600));
  }
  await fs.writeFile(path.join(dir, "SEZNAM.md"), L.join("\n"));
}
await fs.writeFile(path.join(HERE, "results", "outside.json"), JSON.stringify(report));
console.log(JSON.stringify(report));
