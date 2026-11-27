// A page of examples (Bára 15. 11. 2026: "ukaž mi obrázky řezů + ortofota, kdy je co problém"): chosen cuts by kind
// of trouble, each with the cut's truth from MTVU drawn as a profile (the surfaces across the street), the kerbs of
// M0 / M1 / M2 and the facades of OSM above it, and the orthophoto of the place: plain, with the same lines drawn in,
// and ČÚZK 25 cm for the coarse resolution. Self-contained HTML (images inline) in data/ukazky.html (git ignores it).
//   node evaluation/ortho-osm/examples.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ROOT, cuts, stripOf, SOURCES } from "./lib.mjs";
import { encodePng } from "../orthophoto/run.mjs";

const run = promisify(execFile);
const EXAMPLES = [
  ["Funguje", [["praha", 15], ["brno", 7], ["praha", 27]], "Rovná ulice na slunci, obruba je zřetelná hrana a OSM odhadne šířku zhruba dobře: všechny tři metody do pár decimetrů."],
  ["Vodicí čára místo obruby", [["praha", 1]], "Za plnou čárou u kraje je krajnice ze stejného asfaltu. M2 se chytí čáry (je blízko šířky podle OSM: 2 pruhy × 3,5 m), skutečná obruba je až za krajnicí. M1 ji najde, protože krajnice vypadá jako vozovka."],
  ["Stání u obruby", [["brno", 43], ["praha", 64], ["brno", 79]], "Vozovka MTVU zahrnuje i stání. Řada zaparkovaných aut vypadá jako konec asfaltu (Charbulova, Úpatní) a kolmé stání vedle vozovky je jiná plocha (U Okrouhlíku), takže metody skončí na vnitřní hraně aut. OSM stání u těchto ulic nezná, takže ho nečeká. U Úpatní jsou navíc nad vozovkou holé stromy (brněnský snímek je z jara)."],
  ["Koleje, šrafy, osa OSM mimo střed", [["praha", 30], ["praha", 35], ["praha", 22]], "MTVU počítá do vozovky i koleje ve vozovce a vyšrafované plochy. OSM čeká jen pruhy pro auta a M2 vybere čáru uvnitř. Osa OSM navíc leží v jedné polovině ulice."],
  ["Stromy a stín nad vozovkou", [["praha", 80]], "Koruny a jejich stín zakryjí obrubu. Hrana na snímku je mezi stínem a světlem, ne mezi vozovkou a chodníkem."],
  ["Tramvaj uprostřed ulice", [["brno", 49]], "MTVU dělí ulici na tramvajové těleso (705) a dvě úzké vozovky. OSM má jednu cestu se 4 pruhy a osou na kolejích. Na snímku je to jedna asfaltová plocha a hranice mezi vozovkou a tělesem vidět není. Za pravdu beru vozovku nejblíž ose (vpravo), metody ale hledají obrubu celé ulice."],
  ["Dům, který OSM nemá", [["praha", 8]], "MTVU má vlevo budovu (tyrkysová čára), OSM na řezu žádnou. Fasádu ani chodník vlevo pak určit nejde. M2 navíc skončí na okraji šraf, ne na obrubě."],
  ["Dvě vozovky v jedné ploše MTVU", [["praha", 4]], "Dvoupásová silnice, kde MTVU kreslí obě vozovky jako jednu plochu. Klikneme na jeden směr OSM, takže se nedá srovnat s pravdou. Tyhle řezy jsou ve zprávě zvlášť."],
];
// Colours of the MTVU surfaces (by code), as the app roughly draws them.
const COLOR = (c) => c === 700 || c === 701 ? "#6b6b6b" : c >= 9700 && c < 9800 ? "#8e8e8e" : c === 704 ? "#8e8e8e" : c === 702 || c === 703 ? "#d8cfc0" : c === 705 ? "#a08a6a" : c >= 400 && c < 500 ? "#7fb069" : c === 300 || c === 100 || c === 200 ? "#a9c98a" : c === 600 || c === 601 || c === 604 ? "#b06a4a" : c === 1100 ? "#5a4a3a" : c === null ? "#ffffff" : "#c9c2b0";
const NAME = (c) => ({ 700: "komunikace", 701: "vozovka", 702: "chodník", 703: "cyklostezka", 704: "parkoviště", 705: "tram. těleso", 401: "zeleň", 402: "zeleň", 300: "zahrada", 601: "budova", 600: "budova", 9705: "stání", 9704: "stání OSM", 1003: "zpevněná plocha" })[c] || String(c);

async function jpeg(rgba, w, h, file) {
  await fs.writeFile(file + ".png", encodePng(rgba, w, h));
  await run("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "72", file + ".png", "--out", file]);
  const b = await fs.readFile(file);
  await fs.rm(file + ".png", { force: true }); await fs.rm(file, { force: true });
  return "data:image/jpeg;base64," + b.toString("base64");
}
// The strip at 10 px/m, optionally with the lines drawn in.
function raster(st, lines) {
  const sc = 0.1 / st.res, w = Math.floor(st.nt / sc), h = Math.floor(st.nu / sc), rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = Math.min(st.nt - 1, Math.floor(x * sc)), j = Math.min(st.nu - 1, Math.floor(y * sc)), q = (j * st.nt + i) * 3, o = (y * w + x) * 4;
    rgba[o] = st.rgb[q]; rgba[o + 1] = st.rgb[q + 1]; rgba[o + 2] = st.rgb[q + 2]; rgba[o + 3] = 255;
  }
  for (const { t, c, y0 = 0, y1 = 1, dash = 0, thick = 2 } of lines || []) {
    if (t === null || t === undefined) continue;
    for (let y = Math.floor(y0 * h); y < Math.floor(y1 * h); y++) {
      if (dash && (y / dash | 0) % 2) continue;
      for (let k = 0; k < thick; k++) { const x = Math.round((t - st.t0) * 10) + k - (thick >> 1); if (x < 0 || x >= w) continue; const o = (y * w + x) * 4; rgba[o] = c[0]; rgba[o + 1] = c[1]; rgba[o + 2] = c[2]; }
    }
  }
  return { rgba, w, h };
}
const FINEST = { praha: "ipr10", brno: "brno10" };
const sections = [];
const tmp = path.join(ROOT, "data", "tmp-ukazky.jpg");
for (const [title, list, about] of EXAMPLES) {
  const items = [];
  for (const [city, n] of list) {
    const res = JSON.parse(await fs.readFile(path.join(ROOT, "data", city, "results.json"), "utf8")).find((r) => r.n === n);
    const c = (await cuts(city)).find((x) => x.n === n);
    const fine = await stripOf(city, FINEST[city], c), coarse = await stripOf(city, "cuzk25", c);
    const b = res.by[FINEST[city]], t0 = fine.t0, t1 = fine.t0 + fine.nt * fine.res, W = Math.round((t1 - t0) * 10);
    const lines = [
      { t: res.axis, c: [255, 255, 255], dash: 6, thick: 1 },
      ...(res.truth.way ? [{ t: res.truth.way.s, c: [40, 230, 60] }, { t: res.truth.way.e, c: [40, 230, 60] }] : []),
      ...["A", "B"].flatMap((s) => [{ t: res.truth.facade[s], c: [0, 230, 230] }, { t: res.osmFacade[s], c: [40, 80, 255], y1: 0.5, dash: 4 }]),
      ...["A", "B"].flatMap((s) => [{ t: res.m0[s], c: [255, 220, 0], y1: 0.25, thick: 3 }, { t: b?.m1?.[s], c: [255, 140, 0], y0: 0.25, y1: 0.5, thick: 3 }, { t: b?.m2?.[s], c: [255, 30, 30], y0: 0.5, y1: 0.75, thick: 3 }]),
    ];
    const plain = raster(fine), drawn = raster(fine, lines), cz = coarse ? raster(coarse) : null;
    const img = { plain: await jpeg(plain.rgba, plain.w, plain.h, tmp), drawn: await jpeg(drawn.rgba, drawn.w, drawn.h, tmp), cz: cz ? await jpeg(cz.rgba, cz.w, cz.h, tmp) : null };
    // The profile: the MTVU runs across the strip, and the markers above.
    const x = (t) => ((t - t0) * 10).toFixed(1);
    const runs = c.a.runs.filter((r) => r.e > t0 && r.s < t1).map((r) => {
      const s = Math.max(r.s, t0), e = Math.min(r.e, t1), wpx = (e - s) * 10;
      return `<rect x="${x(s)}" y="34" width="${wpx.toFixed(1)}" height="30" fill="${COLOR(r.code)}" stroke="#fff" stroke-width="0.5"><title>${NAME(r.code)} ${(r.e - r.s).toFixed(2)} m</title></rect>` + (wpx > 34 ? `<text x="${x((s + e) / 2)}" y="53" font-size="10" text-anchor="middle" fill="${[701, 700, 601, 600, 705, 1100].includes(r.code) ? "#fff" : "#222"}">${NAME(r.code)}</text>` : "");
    }).join("");
    const mark = (t, y, col, label) => (t === null || t === undefined ? "" : `<line x1="${x(t)}" x2="${x(t)}" y1="${y}" y2="${y + 8}" stroke="${col}" stroke-width="3"/><text x="${x(t)}" y="${y - 2}" font-size="9" text-anchor="middle" fill="${col}">${label}</text>`);
    const marks = ["A", "B"].map((s) => mark(res.m0[s], 10, "#c9a400", "M0") + mark(b?.m1?.[s], 10, "#e07000", "M1") + mark(b?.m2?.[s], 22, "#e01e1e", "M2") + mark(res.osmFacade[s], 66, "#2850ff", "dům OSM")).join("");
    const err = (k) => (res.truth.way && k ? `${(k.A - res.truth.way.s).toFixed(1).replace(".", ",")} / ${(k.B - res.truth.way.e).toFixed(1).replace(".", ",")} m` : "–");
    const head = `${n}. ${res.name || "bez názvu"} <small>${city === "praha" ? "Praha" : "Brno"} · ${res.highway}${res.road.lanes ? ` · OSM lanes=${res.road.lanes}` : ""}${res.road.from === "width" ? " · OSM width" : ""} · <a href="https://barasoukup.github.io/profily-ulic/#rez=${c.cut.lat.toFixed(6)},${c.cut.lon.toFixed(6)},${Math.round(c.cut.bearing)}">otevřít řez</a></small>`;
    const table = `chyba obrub A / B: M0 ${err(res.m0)}, M1 ${err(b?.m1)}, M2 ${err(b?.m2)}${res.truth.way ? ` · vozovka MTVU ${(res.truth.way.e - res.truth.way.s).toFixed(1).replace(".", ",")} m, OSM čeká ${res.road.w.toFixed(1).replace(".", ",")} m` : ""}`;
    items.push(`<div class="cut"><h3>${head}</h3><p class="err">${table}</p>
<svg width="${W}" height="80" viewBox="0 0 ${W} 80">${runs}${marks}</svg>
<div class="row"><figure><img src="${img.plain}" width="${plain.w}"><figcaption>${SOURCES[city][FINEST[city]].label}</figcaption></figure>
<figure><img src="${img.drawn}" width="${drawn.w}"><figcaption>totéž se zákresem</figcaption></figure>
${img.cz ? `<figure><img src="${img.cz}" width="${cz.w}"><figcaption>ČÚZK 25 cm</figcaption></figure>` : ""}</div></div>`);
    console.log(title, city, n);
  }
  sections.push(`<section><h2>${title}</h2><p>${about}</p>${items.join("")}</section>`);
}
const html = `<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ortofoto a OSM – ukázky</title><style>
body{font:14px/1.45 system-ui,sans-serif;margin:16px;background:#f4f2ec;color:#222;max-width:1700px}h1{font-size:20px}h2{font-size:17px;margin:28px 0 4px;border-top:1px solid #ccc;padding-top:14px}h3{font-size:14px;margin:14px 0 2px}small{font-weight:400;color:#666}
.row{display:flex;gap:12px;overflow-x:auto}figure{margin:0;flex:none}figcaption{font-size:12px;color:#555}.err{margin:2px 0 4px;color:#444;font-size:13px}svg{display:block;max-width:100%;height:auto}
.legend span{display:inline-block;width:14px;height:10px;margin:0 4px 0 10px;vertical-align:middle}.cut{margin-bottom:18px}</style></head><body>
<h1>Profil jen z ortofota a OSM: ukázky řezů</h1>
<p>Každý řez: nahoře <b>profil podle MTVU</b> (pravda: barevné plochy napříč ulicí) se značkami, kam položily obruby metody M0 (jen OSM), M1 (jen ortofoto) a M2 (OSM + ortofoto), a kde je dům podle OSM. Pod tím <b>ortofoto</b> stejného místa ve stejném měřítku (10 px = 1 m, ulice vede shora dolů, řez zleva A doprava B, ±20 m podél ulice): čisté, se zákresem a v hrubém ČÚZK 25 cm.
Chyba obrub: kladná = obruba vyšla víc doprava než ve skutečnosti.</p>
<p class="legend">Zákres: <span style="background:#28e63c"></span>obruby MTVU <span style="background:#00e6e6"></span>fasády MTVU <span style="background:#2850ff"></span>dům OSM (čárkovaně, horní polovina) <span style="background:#fff;border:1px solid #999"></span>osa OSM (čárkovaně) <span style="background:#ffdc00"></span>M0 (horní čtvrtina) <span style="background:#ff8c00"></span>M1 (druhá) <span style="background:#ff1e1e"></span>M2 (třetí)</p>
${sections.join("\n")}</body></html>`;
await fs.writeFile(path.join(ROOT, "data", "ukazky.html"), html);
console.log("data/ukazky.html", (html.length / 1e6).toFixed(1), "MB");
