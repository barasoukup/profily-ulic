# A/B 2: mapa povrchů Helsinek YLRE na ulicích pro auta (24. 11. 2026)

Opakování po nepřátelské recenzi (`../RECENZE` ve scratchpadu, body 1, 3, 6, 7): první A/B (`../ab/`) nebylo slepé, výhry
byly hlavně pěšiny a velké třídy a vzorek byl jen z vnitřního města.

## Co se změnilo v kódu (`pilot/public/towns/finland.js`)

- **Kdy se mapa použije** (bod 1): jen když pod středem řezu (do 3 m) leží díl registru správného druhu, jako `hasStreet`
  ve Vilniusu: pod ulicí pro auta vozovka, pod pěšinou či cyklostezkou vozovka, chodník nebo cyklostezka. Dřív stačila
  vozovka nebo chodník do 15 m.
- **Obrysy budov města** (bod 6): před budovy z OSM se kladou obrysy z `Rakennukset_alue_rekisteritiedot` (stejná služba
  a licence); chodníky registru končí přesně na nich. `?hkihouses=0` vypne.
- **Hranice Helsinek** (bod 7): místo obdélníku hranice města i s vodami (`finland-helsinki.js` z vrstvy
  `Kaupunginosajako`, `../border/helsinki.mjs`); Espoo a Vantaa se na registr ani na budovy města neptají.
- **Převod druhů** (bod 9): náměstí (Aukiot) zpevněná plocha, vjezd přes chodník (Tonttiliittymä) chodník, cyklopruh
  v ulici (Pyöräilyalue/kaista s `alueen_kayttotarkoitus` …katu) vozovka (cyklopruh doplní OSM).

## Vzorek a sběr

`sample.mjs` (semínko 20261124): 92 bodů. 18 v šesti vnitřních čtvrtích (3 na čtvrť), 60 v 15 předměstích (Vuosaari,
Malmi, Kontula, Herttoniemi, Munkkiniemi, Kannelmäki, Pasila, Oulunkylä, Itäkeskus, Pihlajamäki, Lauttasaari, Käpylä,
Haaga, Pukinmäki, Mellunmäki; 4 na čtvrť), 10 kontrol v Espoo a Vantaa uvnitř starého obdélníku (Tapiola, Otaniemi,
Leppävaara, Tikkurila, Myyrmäki) a 4 řezy, které recenze jmenovala (hk6, hk31, hk33, hk36). Sběr `sber.js` v aplikaci
(localhost, `?osm=balik`, kód HEAD + změny Finska, bez rozpracovaných změn ostatních států): A = `?helsinki=0`
(odhad z ortofota Helsinek a OSM), B = s registrem (dnešní kód), C = s registrem, ale s obrysy domů jen z OSM
(`?hkihouses=0`). Výsledky `vysledky/rezy.json` (i druh cesty z OSM).

- Mapa použita ve 44 řezech z 92: 31 ulic pro auta, 12 pěšin a cyklostezek, 1 obslužná cesta (hk33). Nepoužita u
  obslužných cest bez vozovky registru pod středem, u pěšin mimo registr, u 4 bodů bez ulice.
- **Kontroly**: ve všech 10 kontrolách v Espoo a Vantaa je B = A, bez dotazu na registr a bez hlášky o Helsinkách.
- **Řezy z recenze**: hk6 a hk31 (pěšiny, dřív „použito“ bez jediného dílu z mapy) a hk36 (dřív profil 29–38 m vedle
  kliknutí) mapu už nepoužijí; hk33 (obslužná cesta, vozovka registru pod středem) ji používá dál.
- **Proužky u fasád** (bod 6): úzké díly „plocha“ nebo „neurčeno“ z odhadu (do 2,5 m) na koncích profilu ve 31 ulicích
  s mapou: A 12, C (obrysy z OSM) 9, **B (obrysy města) 7**. Zbylé jsou hlavně předzahrádky a dvory za koncem registru.

## Slepý posudek (31 ulic pro auta, kde se A a B liší)

`fotky.mjs` (Mapillary, nejnovější snímek do 30 m každým směrem; 30 z 31 řezů má aspoň jednu fotku), `baliky.mjs`:
ortofoto Helsinek bez čar aplikace (`../../universal/ortho.mjs`), oba profily jako X a Y v náhodném pořadí, bez zdrojů
dílů, řezy v náhodném pořadí; klíč `vysledky/klic.json` až po posudku. Posuzovala jsem já (samostatného posuzovatele
v tomto běhu spustit nešlo); dva řezy (Hämeentie, Fleminginkatu) jsem viděla při zkoušce sběru dřív. Posudky
`vysledky/posudky-slepe.json` (X/Y), po odslepení `vysledky/posudky.json`.

**Lépe B (s mapou) 16, lépe A 9, stejně 5, nejde posoudit 1.**

| druh | lépe B | lépe A | stejně | nejde |
|---|---|---|---|---|
| vnitřní město (9) | 5 | 2 | 2 | 0 |
| předměstí (22) | 11 | 7 | 3 | 1 |
| obytné ulice `residential` (16) | 7 | **9** | 0 | 0 |
| ostatní ulice (sběrné, hlavní, dálnice; 15) | **9** | 0 | 5 | 1 |

- Lépe B: celá ulice od domu k domu u velkých ulic (Pasilankatu, Hämeentie, Kontulantie, Kehä I), cyklostezky a
  cyklopruhy (Firdonkatu, Kantelettarentie, Hämeentie), stání na obou stranách (Vironkatu), zeleň místo plochy
  (Tammitie, Teinintie), náměstí se stromy (Simonkatu).
- Lépe A: chybějící nebo přebývající stání (Agricolankatu, Runeberginkatu, Pasuunakuja, Aleksanterinkatu), registr
  končí dřív a zbytek je odhad (Malmin asematie, Lahnaruohontie).

## Závěr

Na ulicích pro auta mapa vyhrává (16 : 9), proto **zůstává zapnutá** (`?helsinki=0` vypne). Na běžných obytných ulicích
ale prohrává těsně (7 : 9) a vyhrává jen na sběrných a hlavních ulicích (9 : 0). Rozhodne Bára: nechat všude, nebo mapu
brát jen mimo `residential` (to by bylo vyladěné na tomtéž vzorku, chtělo by to další A/B).

Obrázky a fotky (`data/`) jen lokálně (git je ignoruje).
