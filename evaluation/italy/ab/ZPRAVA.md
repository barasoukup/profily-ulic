# A/B: mapa povrchů Bologni (aree stradali, 23. 11. 2026)

Vzorek `sample.json` (`sample.mjs`): 40 bodů do 2 km od středu Bologni. A = bez mapy (odhad z otevřeného ortofota Bologni
2023 a OSM), B = s plochami silnic Carta tecnica comunale (`aree-stradali`) a zbytkem jako zpevněnou pěší plochou.
Výsledky `vysledky/a.json`, `b.json`.

- Mapa použita ve 28 řezech ze 40.
- **Horší:** `aree stradali` nejsou vozovka, ale celý uliční prostor i s chodníky (Via Innocenzo Malvasia: stání 2 m,
  krajnice 7,1 m, pruh 4,5 m, krajnice 7,1 m, stání 2 m a chodník 0,45 m; Via Camillo Casarini ztratila chodníky a
  stromořadí, které odhad měl). Výplň „zbytek je chodník“ přebila i zeleň dvorů (chodník 18–20 m).
- Proto **vypnuto** (`?bologna=1` zapne). Na příště: rozdělit plochu silnic čarami obrub
  (`carta-tecnica-comunale-marciapiedi`, `-cigli-stradali`) jako hrany v `ortho-osm.js`.
- Výšky budov Bologni (`c_a944ctc_edifici_pl`, `altezza_gr`) zůstávají zapnuté (`?bolognadomy=0` vypne).
