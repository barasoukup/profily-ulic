// The Brno site is the Prague app with another config and page text. These two functions turn the
// Prague files into the Brno ones; the local server (pilot/server.mjs, /brno/) and the deploy
// workflow (tools/build_brno_site.mjs → _site/brno/) both use them, so the two never differ.

// config.js with CITY = "brno" (and STATIC as given).
export function brnoConfig(js) {
  const out = js.replace('export const CITY = "praha";', 'export const CITY = "brno";');
  if (out === js) throw new Error("config.js: řádek CITY nenalezen");
  return out;
}

const SITE = "https://barasoukup.github.io/profily-ulic/brno/";

// index.html with Brno's title, description, map servers in the CSP, legend and credits.
export function brnoIndex(html) {
  const swaps = [
    [/<title>Profily ulic<\/title>/, "<title>Profily ulic · Brno</title>"],
    [/(<meta name="description" content=")[^"]*"/, '$1Příčné profily brněnských ulic od fasády k fasádě z technické mapy Jihomoravského kraje, otevřených dat Brna a OpenStreetMap. Profil upravíte, porovnáte se stavem a uložíte jako obrázek."'],
    // Map images from Brno's GIS and the DMVS (ČÚZK).
    [/(img-src [^;]*)/, "$1 https://gis.brno.cz https://dmvs.cuzk.gov.cz"],
    // The profile asks the city's GIS and open data (ArcGIS Online) on a click, as Prague asks IPR.
    [/(connect-src [^;]*)/, "$1 https://gis.brno.cz https://services6.arcgis.com"],
    [/(<meta property="og:title" content=")[^"]*"/, '$1Profily ulic · Brno"'],
    [/(<meta property="og:description" content=")[^"]*"/, '$1Příčné profily brněnských ulic z technické mapy a otevřených dat Brna: od fasády k fasádě, upravitelné, s brněnskými ilustracemi."'],
    [/(<meta property="og:url" content=")[^"]*"/, `$1${SITE}"`],
    [/(<meta property="og:image" content=")[^"]*"/, `$1${SITE}brno/og.png"`],
    [/(<meta property="og:image:alt" content=")[^"]*"/, '$1Příčný profil brněnské ulice s tramvajemi, chodníky a domy, vedle název Profily ulic"'],
    // The city switch: Brno is the current page, Prague one level up.
    [/<a href="\.\/" aria-current="page">Praha<\/a>\s*<a href="brno\/">Brno<\/a>/, '<a href="../">Praha</a>\n      <a href="./" aria-current="page">Brno</a>'],
    [/title="Ulice, jak je dnes \(z dat IPR a OSM\)"/, 'title="Ulice, jak je dnes (z technické mapy, dat Brna a OSM)"'],
    [/title="Kreslit pražskými ilustracemi \(vypnuto: ilustrace Streetmixu\)">Pražské ilustrace/, 'title="Kreslit brněnskými ilustracemi (vypnuto: ilustrace Streetmixu)">Brněnské ilustrace'],
    [/aria-label="Mapa Prahy:/, 'aria-label="Mapa Brna:'],
    [/<span class="src src-tsk">úseky parkování TSK<\/span>/, '<span class="src src-tsk">úseky placeného stání</span>'],
    [/<footer class="muted">[\s\S]*?<\/footer>/, `<footer class="muted">
    Data: © <a href="https://gis.brno.cz">Statutární město Brno</a> (technická mapa a MTVU; průzkum budov, cykloopatření a ortofoto, CC BY 4.0) ·
    úseky placeného stání © <a href="https://www.parkovanivbrne.cz">parkovanivbrne.cz</a> (Brněnské komunikace) ·
    podkladová technická mapa © DTM Jihomoravského kraje, IS DMVS ČÚZK ·
    © přispěvatelé <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (ODbL) ·
    ortofoto © ČÚZK (CC BY 4.0) ·
    ilustrace © <a href="https://github.com/streetmix/streetmix/tree/main/packages/illustrations">Streetmix</a>, licence
    <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.cs">CC BY-SA 4.0</a> ·
    brněnské ilustrace a kód © Bára Soukupová (<a href="https://github.com/barasoukup/profily-ulic/blob/main/LICENSE">MIT</a>) ·
    <a href="../">Profily ulic Praha</a>
  </footer>`],
  ];
  let out = html;
  for (const [re, to] of swaps) {
    if (!re.test(out)) throw new Error(`index.html: nenalezeno ${re}`);
    out = out.replace(re, to);
  }
  return out;
}
