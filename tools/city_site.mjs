// A city site (/brno/, /jihlava/, …) is the Prague app with another config and page text. These two
// functions turn the Prague files into the city's; the local server (pilot/server.mjs, /<city>/) and the
// deploy workflow (tools/build_city_site.mjs → _site/<city>/) both use them, so the two never differ.
// The texts of each city are in tools/cities.mjs.
import { SITES, NAMES } from "./cities.mjs";

const BASE = "https://barasoukup.github.io/profily-ulic/";

// config.js with CITY = "<city>" (and STATIC as given).
export function cityConfig(id, js) {
  const out = js.replace('export const CITY = "praha";', `export const CITY = "${id}";`);
  if (out === js) throw new Error("config.js: řádek CITY nenalezen");
  return out;
}

// The city switch as on a page of the city `here` (Prague: the root, the others one level down).
export function cityNav(here) {
  const href = (id) => (id === here ? "./" : here === "praha" ? `${id}/` : id === "praha" ? "../" : `../${id}/`);
  return `<nav class="city-toggle" aria-label="Město">\n${Object.entries(NAMES)
    .map(([id, name]) => `      <a href="${href(id)}"${id === here ? ' aria-current="page"' : ""}>${name}</a>`).join("\n")}\n    </nav>`;
}

// Links to the other cities' sites, for the footer.
export const otherSites = (here) => Object.entries(NAMES).filter(([id]) => id !== here)
  .map(([id, name]) => `<a href="${here === "praha" ? `${id}/` : id === "praha" ? "../" : `../${id}/`}">Profily ulic ${name}</a>`).join(" · ");

// index.html with the city's title, description, map servers in the CSP, legend and credits.
export function cityIndex(id, html) {
  const c = SITES[id];
  if (!c) throw new Error(`neznámé město ${id}`);
  const name = NAMES[id], site = `${BASE}${id}/`;
  const Adj = c.adj[0].toUpperCase() + c.adj.slice(1);
  const swaps = [
    [/<title>Profily ulic<\/title>/, `<title>Profily ulic · ${name}</title>`],
    [/(<meta name="description" content=")[^"]*"/, `$1${c.description}"`],
    [/(img-src [^;]*)/, `$1 ${c.img.join(" ")}`],
    [/(connect-src [^;]*)/, `$1 ${c.connect.join(" ")}`],
    [/(<meta property="og:title" content=")[^"]*"/, `$1Profily ulic · ${name}"`],
    [/(<meta property="og:description" content=")[^"]*"/, `$1${c.ogDescription}"`],
    [/(<meta property="og:url" content=")[^"]*"/, `$1${site}"`],
    [/(<meta property="og:image" content=")[^"]*"/, `$1${site}${id}/og.png"`],
    [/(<meta property="og:image:alt" content=")[^"]*"/, `$1${c.ogAlt}"`],
    [/<nav class="city-toggle" aria-label="Město">[\s\S]*?<\/nav>/, cityNav(id)],
    [/title="Ulice, jak je dnes \(z dat IPR a OSM\)"/, `title="Ulice, jak je dnes (${c.stav})"`],
    [/title="Kreslit pražskými ilustracemi \(vypnuto: ilustrace Streetmixu\)">Pražské ilustrace/, `title="Kreslit ${c.adjInstr} ilustracemi (vypnuto: ilustrace Streetmixu)">${Adj} ilustrace`],
    [/aria-label="Mapa Prahy:/, `aria-label="Mapa ${c.gen}:`],
    [/<span class="src src-tsk">úseky parkování TSK<\/span>/, `<span class="src src-tsk">${c.parking}</span>`],
    [/<footer class="muted">[\s\S]*?<\/footer>/, `<footer class="muted">
    ${c.credits} ·
    ilustrace © <a href="https://github.com/streetmix/streetmix/tree/main/packages/illustrations">Streetmix</a>, licence
    <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.cs">CC BY-SA 4.0</a> ·
    ${c.adj} ilustrace a kód © Bára Soukupová (<a href="https://github.com/barasoukup/profily-ulic/blob/main/LICENSE">MIT</a>) ·
    ${otherSites(id)}
  </footer>`],
  ];
  let out = html;
  for (const [re, to] of swaps) {
    if (!re.test(out)) throw new Error(`index.html: nenalezeno ${re}`);
    out = out.replace(re, to);
  }
  return out;
}

// The earlier names, kept for the tests.
export const brnoConfig = (js) => cityConfig("brno", js);
export const brnoIndex = (html) => cityIndex("brno", html);
