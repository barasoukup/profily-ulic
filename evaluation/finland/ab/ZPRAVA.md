# A/B: mapa povrchů Helsinek YLRE (23. 11. 2026)

Vzorek `sample.json` (`sample.mjs`, semínko 20261127): 40 náhodných bodů do 3 km od bodu 1 km severně od středu Helsinek
(Töölönlahti, méně moře). Sběr v aplikaci (localhost, `?osm=balik`, jako `evaluation/slovensko/ab/sber.js`), každý bod
A = bez mapy (`?helsinki=0`, odhad z ortofota Helsinek 2026 a OSM) a B = s registrem veřejných ploch YLRE
(`YLRE_Katu_ja_viherosat_kaikki_alue`: vozovka, chodník, oddělená cyklostezka, společná stezka, ostrůvek, dělicí pás,
trávník, výsadba, parkoviště; před ním budovy z OSM, po něm zeleň a voda z OSM). Výsledky `vysledky/rezy.json`, obrázky
`images/` (nahoře A modře, dole B červeně, nad ortofotem Helsinek 2026, 5 cm; `ORTHO=fi` v
`evaluation/slovensko/ab/obrazky.mjs`).

- Mapa použita ve 27 řezech ze 40 (jinde vozovka ani chodník registru do 15 m od středu řezu nebyly: parky, dvory,
  železnice, moře; 1 bod bez ulice).
- Posudky (`vysledky/posudky.json`, posuzovatel nad obrázky 10 px = 1 m, bez fotek z ulice):
  **lépe B 10, lépe A 3, stejně 7, nejde posoudit 7.**
  - Lépe B: běžné ulice s jasnou obrubou (hk16 Kruunuvuorensilta, hk20 Koksikatu, hk21 Hämeentie, hk39 Savonkatu,
    hk40 Vilhonvuorenkuja), dále hk4, hk7, hk25, hk30, hk31.
  - Lépe A: hk2 Kalevankatu (YLRE má stání jen vlevo, auta vpravo B kreslí do jízdního pruhu), hk14 Sörnäistenkatu
    (levá obruba B o 3,5 m do vozovky, mezera doplněná „plocha*“), hk23 Susannanpenger (B přidá 11,9 m plochy přes zahradu).
  - Společné chyby B: polygony YLRE nebo doplněné mezery („plocha*“) přes dvory, zahrady a parkoviště (hk10, hk23, hk33).
- Mapa zůstává zapnutá (`?helsinki=0` vypne). Licence CC BY 4.0 (HRI, Helsingin kaupunki), kredit
  „mapa povrchů (Yleisten alueiden rekisteri) © Helsingin kaupunki“.

Otevřené: stání podle YLRE neúplné (hk2); hk36 má řez mimo snímek (rozpětí −29 m), prověřit; pole `materiaali` (povrch) je
využité jen u dělicího pásu (tráva / dlažba).
