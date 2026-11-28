# Polsko (PL)

Stav nasazení: větev `poland`, 21. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Polsko (větev poland z belgium, Bára 21. 11. 2026, nenasazené)

- Stát `poland` (PL): `countries/PL.js`, `towns/poland.js`, `search-pl.js`, `signs-PL/`, `evaluation/poland/`. Hranice z PRG
  GUGiK (přesná, ve `states.json` před Rakouskem a Německem; GISCO dávalo Německu pás Zgorzelce a Słubic).
- Ortofoto GUGiK (celostátní, WMS HighResolution), hledání GUGiK UUG (PRG, „město, ulice číslo“), mapa povrchů Krakova
  (MJO). BDOT10k zamčený (401), Varšava, Vratislav, Gdaňsk, Poznaň bez otevřených služeb.
- Normy RMI 2022 (závazné), buspruh, stání a tramvaj z nezávazných WR-D. Stání odhadem jako LU (zákon šířku nemá).
  Paneláky ponechané (wielka płyta jako v Česku). viz seznam v `docs/deployment.md`
- A/B mapy Krakova po recenzi slabé (lépe 7, hůř 6; mosty a víceproudé ulice lépe, chodník napůl „chodník + stezka“
  tam, kde OSM vede cyklostezku po chodníku). Od 26. 11. 2026 **vypnutá**, zapne ji `?krakow=1` (Bára: pravidla města
  chtějí písemný souhlas správce MSIP, `evaluation/archive/licences/REPORT.md`; na přehledové mapě není). Měření 21. 11.: složení 67 %, šířka do 2 m 32 %
  (22 řezů). Recenze `evaluation/poland/REVIEW.md`.

## Popis zdrojů a pravidel (dříve app/README.md)

### Polsko (Bára 21. 11. 2026)

Stát `poland` (PL), `countries/PL.js`, `towns/poland.js`, `search-pl.js`; hranice GISCO (za Českem a Slovenskem). OSM po
16 vojvodstvích (`pl_*`, jen R2). Ortofoto GUGiK (WMS HighResolution v Web Mercatoru, `lanes-ortho.js` zdroj `pl`).
- **Mapa povrchů Krakova** (MJO: vozovky, náměstí, chodníky, cesty) tam, kde má u středu řezu vozovku; jen s `?krakow=1`
  (od 26. 11. 2026 vypnutá, chybí písemný souhlas správce MSIP).
  Celostátní BDOT10k a mapy okresů nejsou otevřeně s CORS; Varšava, Vratislav, Gdaňsk, Poznaň služby nemají.
- **Normy** podle závazného nařízení RMI 2022 (Dz.U. 2022 poz. 1518), buspruh, stání a tramvaj podle nezávazných
  doporučení ministerstva WR-D (označeno). **Stání:** zákon volnou šířku nemá, odhad jako v Lucembursku, průjezdné pruhy
  aspoň 3 m; na chodníku musí zůstat 1,5 m (čl. 47). **Značky** `signs-PL/`. **Hledání** GUGiK UUG. Paneláky jako
  v Česku, univerzální vozidla.
