# A/B: mapa povrchů Paříže (Plan de voirie) (22. 11. 2026)

Vzorek `sample.json` (`sample.mjs`, semínko 20261123): 40 náhodných bodů do 4 km od středu Paříže. Sběr v aplikaci
(localhost, `?osm=balik` s lokálním balíkem OSM deseti francouzských měst), každý bod A = bez mapy (`?paris=0`, odhad
z ortofota IGN a OSM) a B = s mapou. Výsledky `vysledky/a.json`, `b.json`, spojené `rezy.json`; obrázky `images/`
(nahoře A modře, dole B červeně, nad ortofotem IGN; `ORTHO=fr` v `evaluation/slovensko/ab/obrazky.mjs`).

- Mapa použita ve 28 řezech ze 40 (jinde pod středem nebyla vozovka, cyklostezka ani stání: park, nábřeží, náměstí,
  nebo aplikace ulici nenašla). Profil se liší ve všech 28.
- Posudky (`vysledky/posudky.json`, posuzovatel Sonnet nad obrázky 10 px = 1 m): **lépe B 5, lépe A 2, stejně 17,
  nejde posoudit 4.**
  - Lépe B: pa3 (široká pěší plocha u bulváru), pa16 (odhad kreslil zeleň přes dům), pa18 Boulevard de Magenta (odhad
    vrátil jen 1 m cyklostezky, mapa celý bulvár 30 m), pa29 Place des Alpes, pa30 (úzká vozovka mezi obrubami).
  - Lépe A: pa12 Rue des Tournelles a pa32 Rue Alain Chartier. Kontrola nad ortofotem s obrysy mapy: pařížské chodníky
    bývají z tmavého asfaltu jako vozovka a mapa (zaměřená) kreslí obrubu tam, kde je na snímku jen slabě vidět. Oba
    posudky považuji za sporné, ne za chybu mapy.
  - „Stejně“ jsou většinou ulice, kde mapa mění šířky o 0,1–0,5 m a složení zůstává.
- Mapa zůstává zapnutá (`?paris=0` vypne): je to zaměřená mapa města a v řezech, kde odhad selže (bulváry, náměstí),
  dá celé složení.

Otevřené: u fasády často pruh „plocha“ 0,65 m (mezera mezi budovou z OSM a chodníkem mapy, `docs/backlog.md`).

## Po nepřátelské recenzi (`../RECENZE.md`)

- Recenzent upozornil, že dvě z pěti výher (pa18, pa29) jsou spíš selhání odhadu než přesnost mapy a že pa3 má s mapou
  jen půl bulváru (druhá vozovka za středovou promenádou chybí). Prohry pa12 a pa32 jsem prověřila nad ortofotem, výhry
  stejně ne. Posuzovatel neměl fotky z ulice. Výsledek je tedy spíš „mapa pomáhá tam, kde odhad selže“ než „mapa je
  přesnější všude“.
- Oprava dvojité cyklostezky (mapa + cyklopruh z OSM) změnila jen pa39 a pa40 (`vysledky/b-po-recenzi.json`).
- Vzorek je do 4 km od středu: mosty přes Périphérique, nábřeží v nižší úrovni a bulváry s promenádou zatím cíleně
  neprověřené.
