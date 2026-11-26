# Ortofoto pro okolí Washingtonu a Toronta (rešerše 26. 11. 2026)

Podklad k Bářinu rozhodnutí o okolí bez mapy povrchů (shoda složení 51 %). Jen rešerše, nic není zapojené.
„Ověřeno“ = načteno z oficiální stránky nebo služby; „sekundární“ = jen z výsledku vyhledávání.
CORS ověřen dotazem s `Origin: https://streetspace.eu`.

| Zdroj | Rok, rozlišení | Licence | Služba | 3857 / CORS |
|---|---|---|---|---|
| USGS NAIP (The National Map) | 2025, 60 cm (část 30 cm) | public domain (ověřeno) | `imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer` | ano / ano (*) |
| USGS NAIP Plus | 30 cm–1 m | public domain | `imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer` | ano / ano |
| MD iMAP Six Inch 2023–2025 (Montgomery, Prince George's…) | 15 cm | „MD iMAP, DoIT“; podmínky jen sekundárně (volné šíření, uvést Maryland), imap.maryland.gov neodpovídal | `mdgeodata.md.gov/imagery/rest/services/SixInch/SixInchImagery2023_2024_2025/MapServer` | ano / ano |
| Fairfax County 2024 | 3 in | neověřena (obecný disclaimer a Terms & Conditions okresu) | `fairfaxcounty.gov/gisimagery/rest/services/AerialPhotography/2024AerialPhotography3inch/ImageServer` | ano / ano |
| VBMP 2024 (VGIN, Virginie: Arlington, Alexandria, Loudoun…) | 2024 | neověřena (sekundárně: šíření jen přes VGIN či obec) | `vginmaps.vdem.virginia.gov/…/VBMP2024_WGS/MapServer` (z této sítě nedostupné) | ? / ? |
| Montgomery County MD JPG2023 | 6 in | Terms of Use okresu: povinný disclaimer, okres smí užití kdykoli ukončit | server vracel 522 | ? / ? |
| Ontario SWOOP 2020 (jih Ontaria) | 16–50 cm | OGL-Ontario (ověřeno, data.ontario.ca/en/dataset/open-ontario-imagery) | služba s exportem nenalezena (LIO vrací HTML) | ? / LIO ano |
| Peel 2020 (Mississauga, Brampton, Caledon) | 15 cm | Open Data Licence Peel v1.0 (položka ArcGIS 1be6a99c…; plný text neověřen) | jen ke stažení (MrSID), ImageServer nenalezen | – |
| York Region 2024 | 10 cm | © First Base Solutions (třetí strana), licence neověřena | `ww2.yorkmaps.ca/arcgis/rest/services/CacheMaps/YR_Imagery2024/MapServer` | ? / ano |
| Halton, Durham, Mississauga a Brampton (města) | – | prodej nebo smlouva (sekundárně) | – | – |

## Doporučení rešerše

- **USA:** USGS NAIP jde použít hned (public domain, CORS, Web Mercator), ale 60 cm je hrubé (dnes používáme 8–15 cm).
  Maryland Six Inch je technicky připravený (15 cm, CORS); licenci ověřit na imap.maryland.gov. Fairfax až po přečtení podmínek okresu,
  Virginie (VGIN) ověřit z jiné sítě.
- **Kanada:** licenčně čisté je SWOOP 2020 (OGL-Ontario) a Peel 2020, ale ani jedno nemá službu, kterou by šlo číst
  z prohlížeče; šlo by jen přes vlastní dlaždice (stažení a rozřezání, velký objem). York 2024 bez licence od First Base ne.
- Před zapojením čehokoli: A/B okolí s ortofotem proti dnešnímu odhadu z OSM (pravidla projektu).
