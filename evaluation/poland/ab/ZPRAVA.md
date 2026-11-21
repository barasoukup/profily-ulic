# A/B: mapa povrchů Krakova (MJO) (21. 11. 2026)

Vzorek `sample.json` (`sample.mjs`, semínko 20261122): 36 náhodných bodů do 2,5 km od centra Krakova. A = bez mapy
(`?krakow=0`, odhad z ortofota GUGiK a OSM), B = s mapou. Výsledky `vysledky/rezy.json`, obrázky `images/` (nahoře A
modře, dole B červeně, nad ortofotem GUGiK; `ORTHO=pl` v `evaluation/slovensko/ab/obrazky.mjs`).

Mapa se použila u 24 řezů a u všech změnila profil. Prohlédnuto 16 obrázků, zbytek podle výpisu profilů.

- **Lépe B (8):** kr12 Most Kotlarski (A řezal most jako vodu, B vozovky, tramvaj a stezky), kr17 Grzegórzecka (čtyři
  pruhy a tramvaj v pruhu místo krajnice 5 m), kr3 Walerego Goetla a kr18 Królowej Jadwigi (stání po obou stranách),
  kr11 Aleja Mickiewicza (buspruh, zeleň, stezka), kr32 Podgórska, kr33 Siemiradzkiego, kr7 (chodníky místo „ploch“).
- **Hůř B (3):** kr31 Wrocławska (stání zmizelo, pruhy 4,6 m), kr36 Wójtowska (cyklopruh zmizel, za ulicí plochy),
  kr13 (pěšina, B 17 m chodníku).
- **Stejně nebo nerozhodně (13):** kr1, kr2, kr9, kr10, kr14, kr15, kr16, kr19, kr24, kr26, kr27, kr28, kr34.

## Po nepřátelské recenzi (21. 11. 2026, `vysledky/rezy-po-recenzi.json`)

Recenze přehodnotila: kr2 (B vložil „Neurčeno“), kr19 (kousky 0,3–0,5 m) a kr28 (obslužná 4,1 → 8,4) jsou hůř, ne stejně;
kr10, kr11, kr12 a kr24 dělí chodník na nereálné poloviny „chodník X + stezka X“. „Ścieżka“ (KTCR04) je podle barvy
a ortofota cyklostezka: mapuje se na 703 (dřív chodník). Stejný vzorek znovu: mapa použita u 26, změna jen u 4 řezů
(kr5, kr12, kr24, kr35); dělení chodníku napůl zůstává tam, kde OSM vede cyklostezku po chodníku.

**Souhrn po recenzi: lépe 7 (kr3, kr7, kr12, kr17, kr18, kr32, kr33), hůř 6 (kr2, kr13, kr19, kr28, kr31, kr36),
sporně 4 (dělení napůl), stejně 9.** Výsledek je slabý.

Výsledek: mapa zůstává zapnutá (`?krakow=0` vypne) hlavně kvůli mostům a víceproudým ulicím (kr12, kr17), kde odhad
selhává; je to ale těsné a stojí za rozhodnutí Báry. Slabina: chodníky Krakova jsou jedna vrstva i s cyklostezkami
(OSM je pak dělí napůl, kr10 a kr24: „chodník 4,5 + stezka 4,5“).
