# Litva (LT): co je zapojené (24. 11. 2026)

Bára 24. 11. 2026: mapy povrchů jsou lepší než ortofota, vzít nejslibnější a jít. Podklady `ZDROJE.md`, `NORMY.md`.

## Zapojené
- **Stát** `lithuania` (LT): `pilot/public/countries/LT.js`, `towns/lithuania.js`, hranice GISCO v `staty.json`
  (`tools/build_staty.mjs`, za polskou PRG), pobřeží 400 m (`city.js` COAST), OSM balík `lt` (`tools/countries.mjs`, jen R2;
  lokálně výřez Vilniusu, Kaunasu, Klaipėdy, Šiauliů, Panevėžysu a Alytusu, 10 MB).
- **Bez ortofota:** NŽT jen k prohlížení na geoportálu (nepoužito; úřadům jsme nepsaly). `laneOrtho: "none"`, mimo
  Vilnius „jen odhad z OSM“.
- **Vilnius:** topografické plochy 1 : 500 jako plochy řezu (`?vilnius=0`), licence neuvedená, kredit
  „Vilniaus miesto savivaldybė / Vilniaus planas“. A/B 40 řezů: použita v 26, lépe 17, hůř 2, stejně 4, nejasné 3
  (`ab/ZPRAVA.md`).
- **Budovy:** jen OSM. GRPK (CC BY 4.0) má jen obrys a nedokumentovaný kód užití `PASK` (110, 240, 266…), bez podlaží a roku;
  NTR (podlaží, rok) nemá geometrii ani CORS. Nezapojeno (otázka pro Báru).
- **Hledání:** Photon (`photon-lt`, jen LT, místní jazyk). Lokátor Vilniusu nezapojen (licence neuvedená, Photon stačí).
- **Normy:** jen příručky Vilniusu 2021 a Kaunasu 2024 (doporučení, oranžově): chodník 2,5, cyklopruh 1,5, cyklostezka 2,5,
  pruh BUS 3,05, pruh 2,75 (jako Estonsko: 3 m při 50, 2,75 při 30 km/h), podélné stání 2,3, kolmé 4,35. Bez tramvají.
- **Stání:** 3 m na směr (KET bod 150.7, z druhé ruky), na chodníku jen se značkou (150.5); volná šířka pro chodce nenalezena.
- **Značky** `signs-LT/` (README tam): Commons, Augustasci CC BY 4.0 a public domain, tabulky 846, 853 Gigillo83 CC BY-SA 4.0
  (autoři v patičce); 329 jako šablona aplikace. Bez pěší a sdílené zóny.
- **Domy:** socialistické vzhledy ano. Stejná úvaha jako u Estonska (Bára 23. 11.: jen kde se stavěly): sovětská panelová
  sídliště Žirmūnai, Lazdynai, Karoliniškės, Šilainiai jsou jako Lasnamäe a Mustamäe. Vlastní regionální vzhled (dřevěné domy
  Užupisu, Žvėrynasu) zatím ne.
- **Texty** ve všech 24 jazycích (strojové), patička, CSP `gis.vplanas.lt`.

## Univerzální měření přesnosti (jen LT)
Ortofoto, které smí posuzovatel vidět, má jen Vilnius (městské 2024, licence neuvedená, jen pro posouzení), proto „města“
vzorku jsou čtvrti Vilniusu (Senamiestis, Žirmūnai, Antakalnis, Naujamiestis, Žvėrynas, Karoliniškės; 48 bodů na konci
`evaluation/universal/sample.json`). Nové pravidlo: body na `service=driveway/parking_aisle/drive-through` vynechány (12),
stejně pěšiny (23). Zbylo 13 ulic, s fotkou Mapillary 10 (posuzovatel Sonnet, `vysledky/u-lt-1.jsonl`). Skóre
`node evaluation/lithuania/score.mjs` (`vysledky/presnost.md`):

| varianta | řezů | shoda složení | pruhy stejně | šířka do 1 / 2 m |
|---|---|---|---|---|
| aplikace (mapa povrchů Vilniusu, kde ji má: 7 z 10) | 10 | 52 % | 60 % | 0 / 10 % |
| jen odhad z OSM (`?vilnius=0`, jako zbytek Litvy) | 10 | 64 % | 60 % | 20 / 50 % |

Rozpor s A/B: okem nad ortofotem mapa vyhrává (vozovka a obruby podle skutečného asfaltu), měření ji tresty za „navíc
chodník, navíc zeleň“: mapa dělí chodník na kousky (dlažba, zeleň, stromy) a sahá dál za fasádu, kde posuzovatel končí;
u zirmunai-7 kreslí 5 pruhů místo 6 a šířku 46 m proti 24 m. Vzorek je malý (10 řezů). Mapa zůstává zapnutá, rozhodnutí
pro Báru.
