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

Výsledek: mapa zůstává zapnutá (`?krakow=0` vypne). Slabina: chodníky Krakova jsou jedna vrstva i s cyklostezkami
(OSM je pak dělí napůl, kr10 a kr24: „chodník 4,5 + stezka 4,5“).
