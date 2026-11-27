# Litva (LT): co je zapojené (24. 11. 2026)

Bára 24. 11. 2026: mapy povrchů jsou lepší než ortofota, vzít nejslibnější a jít. Podklady `SOURCES.md`, `NORMS.md`.

## Zapojené
- **Stát** `lithuania` (LT): `app/public/countries/LT.js`, `towns/lithuania.js`, hranice GISCO v `states.json`
  (`tools/build_states.mjs`, za polskou PRG), pobřeží 400 m jen u moře (`city.js` COAST; od 24. 11. ne podél hranic na souši,
  `states.json` `land_lithuania`), OSM balík `lt` (`tools/countries.mjs`, jen R2;
  lokálně výřez Vilniusu, Kaunasu, Klaipėdy, Šiauliů, Panevėžysu a Alytusu, 10 MB).
- **Bez ortofota:** NŽT jen k prohlížení na geoportálu (nepoužito; úřadům jsme nepsaly). `laneOrtho: "none"`, mimo
  Vilnius „jen odhad z OSM“.
- **Vilnius:** topografické plochy 1 : 500 jako plochy řezu, **vypnuté** (Bára 24. 11. 2026 po nepřátelské recenzi: co je horší, zůstane vypnuté; `?vilnius=1` zapne), licence neuvedená, kredit
  „Vilniaus miesto savivaldybė / Vilniaus planas“. A/B 40 řezů: použita v 26, lépe 17, hůř 2, stejně 4, nejasné 3
  (`ab/REPORT.md`); z výher B jsou ale 4 pěšiny a 7 obslužných cest, na ulicích 6 : 0.
- **Budovy:** vzhled domů z OSM. GRPK (CC BY 4.0) má jen obrys a nedokumentovaný kód užití `PASK`, bez podlaží a roku; NTR
  (podlaží, rok) nemá geometrii ani CORS. **Obrysy GRPK** (Bára 24. 11. 2026) ukončují řez u fasády: viz níže, `?grpk=0` vypne.
- **Hledání:** Photon (`photon-lt`, jen LT, místní jazyk). Lokátor Vilniusu nezapojen (licence neuvedená, Photon stačí).
- **Normy:** jen příručky Vilniusu 2021 a Kaunasu 2024 (doporučení, oranžově): chodník 2,5, cyklopruh 1,5, cyklostezka 2,5,
  pruh BUS 3,05, pruh 2,75 (jako Estonsko: 3 m při 50, 2,75 při 30 km/h), podélné stání 2,3, kolmé 4,35. Bez tramvají.
- **Stání:** 3 m na směr (KET bod 150.7, z druhé ruky), na chodníku jen se značkou (150.5); volná šířka pro chodce nenalezena.
- **Značky** `signs-LT/` (README tam): Commons, Augustasci CC BY 4.0 a public domain, tabulky 846, 853 Gigillo83 CC BY-SA 4.0
  (autoři v patičce); 329 jako šablona aplikace. Bez pěší a sdílené zóny.
- **Domy:** socialistické vzhledy ano. Stejná úvaha jako u Estonska (Bára 23. 11.: jen kde se stavěly): sovětská panelová
  sídliště Žirmūnai, Lazdynai, Karoliniškės, Šilainiai jsou jako Lasnamäe a Mustamäe. Vlastní regionální vzhled (dřevěné domy
  Užupisu, Žvėrynasu) zatím ne.
- **Texty** ve všech 24 jazycích (strojové), patička, CSP `gis.vplanas.lt`, `www.geoportal.lt`.

## Univerzální měření přesnosti (jen LT)
Ortofoto, které smí posuzovatel vidět, má jen Vilnius (městské 2024, licence neuvedená, jen pro posouzení), proto „města“
vzorku jsou čtvrti Vilniusu (Senamiestis, Žirmūnai, Antakalnis, Naujamiestis, Žvėrynas, Karoliniškės; 48 bodů na konci
`evaluation/universal/sample.json`). Nové pravidlo: body na `service=driveway/parking_aisle/drive-through` vynechány (12),
stejně pěšiny (23). Zbylo 13 ulic, s fotkou Mapillary 10 (posuzovatel Sonnet, `results/u-lt-1.jsonl`). Skóre
`node evaluation/lithuania/score.mjs` (`results/presnost.md`):

| varianta | řezů | shoda složení | pruhy stejně | šířka do 1 / 2 m |
|---|---|---|---|---|
| aplikace (mapa povrchů Vilniusu, kde ji má: 8 z 10) | 10 | 53 % | 60 % | 0 / 10 % |
| jen odhad z OSM (`?vilnius=0`, jako zbytek Litvy) | 10 | 64 % | 60 % | 20 / 50 % |

Rozpor s A/B: okem nad ortofotem mapa vyhrává (vozovka a obruby podle skutečného asfaltu), měření ji tresty za „navíc
chodník, navíc zeleň“: mapa dělí chodník na kousky (dlažba, zeleň, stromy) a sahá dál za fasádu, kde posuzovatel končí;
u zirmunai-7 kreslí 5 pruhů místo 6 a šířku 46 m proti 24 m. Vzorek je malý (10 řezů). Bára 24. 11. 2026 nejdřív
nechala mapu zapnutou a fasádu měly dát budovy GRPK (níže); GRPK složení nezlepšilo, a po nepřátelské recenzi téhož dne
(z 8 řezů s mapou je mapa horší v 6, stejná ve 2, lepší v žádném) **je mapa vypnutá** (`?vilnius=1` zapne), dokud ji
nepotvrdí větší vzorek naslepo (aspoň 30 ulic s fotkou). Pravidlo o vjezdech a uličkách parkovišť platí zatím jen
v `evaluation/lithuania/score.mjs`, takže číslo LT není přímo srovnatelné s ostatními státy (ty jsou měřené bez něj).
Profily 10 posuzovaných řezů sebrané znovu po opravě z recenze (model obrub už v Litvě neběží; 52 → 53 %).

## Budovy GRPK (24. 11. 2026)
Služba `https://www.geoportal.lt/arcgis/rest/services/NZT/GRPK/MapServer/22` (Pastatai, celá Litva): CORS pro tázající
origin, `query` jen `f=json` (GeoJSON ne) a bez stránkování (`orderByFields`, `resultOffset` vrací 400), na řez jeden dotaz
za 0,1–0,2 s. `GKODAS` podle legendy: pa0 budova, pa23 garáž, pa6 věž, pa58 skleník (bereme), pa651/652 větrníky (ne).
Licence: GRPK je na geoportal.lt otevřené pod CC BY 4.0 (soubor), služba uvádí „GRPK © Lietuvos Respublikos aplinkos
ministerija“; kredit „budovy GRPK © Lietuvos Respublikos aplinkos ministerija (CC BY 4.0)“.

Zapojení (`towns/lithuania.js`): pod mapou Vilniusu jsou obrysy GRPK před budovami OSM (bližší fasáda ukončí stranu); pro
odhad z OSM se přidají jako budovy OSM jen domy, které OSM nemá (`grpkAsOsm`; dům, jehož střed leží v budově OSM nebo
střed budovy OSM v něm, je už v OSM). První verze dávala obrysy do odhadu jako plochy mapy: 26 odhadů ze 40 se rozpadlo
na jediný kus „neznámé“, proto ta cesta.

**A/B** (stejné body: 40 řezů `ab/sample.json` a 48 bodů měření Vilniusu, A `?grpk=0`, B s GRPK; `ab/results/rezy-grpk.json`,
obrázky nad ortofotem Vilniusu `ab/images-grpk/` jen lokálně): změnilo se 14 řezů z 88, všechny jen konec řezu.
Posouzeno nad ortofotem (okraj střechy) a u čtyř řezů měření i proti posudku z fotky Mapillary:
- **lépe B 5**: vl27 (A končil 5 m uvnitř domu, B na fasádě), vl26, vl30, lt-karoliniskes-4, lt-zverynas-1 (0,5–1,5 m blíž
  okraji střechy);
- **hůř B 2**: lt-naujamiestis-8 Kauno g. (obrys GRPK 0,6 a 1,8 m před skutečnou fasádou, chodníky 3,0 a 2,05 m proti
  posudku 4 a 3 m), lt-senamiestis-1 Dainavos g. (odhad dotáhl chodník 6 m k domu GRPK za zelení, posudek: 2 m chodník,
  pak zeleň, bez fasády);
- **stejně 7** (posun do 0,5 m): vl5, vl6, vl16, vl37, lt-senamiestis-5, lt-zverynas-6, lt-karoliniskes-3.

GRPK je mapa 1 : 10 000, obrysy bývají o desítky centimetrů až 2 m vedle; zisk je malý, ale ve prospěch B. **Zapnuto.**

**Univerzální měření** (10 řezů s fotkou, `node evaluation/lithuania/score.mjs`, `results/presnost.md`; počítáno už s
dnešním pravidlem, že strana bez fasády se za okrajem ulice nehodnotí, proto odhad 75 % místo dřívějších 64 %):

| varianta | shoda složení | pruhy stejně | šířka do 1 / 2 m |
|---|---|---|---|
| aplikace bez GRPK (`?grpk=0`, dosavadní) | 53 % | 60 % | 0 / 10 % |
| aplikace s budovami GRPK | 53 % | 60 % | 20 / 20 % |
| jen odhad z OSM (`?vilnius=0&grpk=0`) | 75 % | 60 % | 20 / 50 % |

Složení se nezměnilo: rozdíl mapy Vilniusu proti odhadu (navíc chodník 9×, navíc zeleň 5×) nedělá fasáda, ale to, že
mapa dělí chodník a okolí na víc kusů (dlažba, zeleň, stromy), které posuzovatel z fotky slučuje. GRPK zlepšilo jen šířku.

## Vypnutí mapy Vilniusu (24. 11. 2026)
Podle pravidla „co zhorší, zůstane vypnuté“ je mapa Vilniusu od 24. 11. 2026 ve výchozím stavu vypnutá: ve Vilniusu
platí odhad z OSM s obrysy budov GRPK (`?vilnius=1` vrátí mapu). Mapa pokrytí v okně „O aplikaci“ ukazuje Vilnius jako
zbytek Litvy (jen OSM). Možná oprava do budoucna: brát z mapy jen vozovku a obruby, sloučit sousední kusy chodníku a
končit na fasádě, pak změřit znovu.

## Recenze
`REVIEW.md` (nepřátelská recenze 24. 11. 2026, co se opravilo).
