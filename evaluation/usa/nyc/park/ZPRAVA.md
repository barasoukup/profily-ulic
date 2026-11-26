# New York: stání v jednotné vozovce mapy (26. 11. 2026)

Mapa New Yorku (NYC Planimetrics) má vozovku od obruby k obrubě jako jednu plochu; v měření chybělo stání 12× z 28 řezů
(`../ZPRAVA.md`). **Výsledek: stání ze značek NYC DOT vyhrálo slepé A/B 17 : 8, ale neprůkazně (p 0,11), univerzální
měření se nezlepšilo (75 → 72 %); zůstává vypnuté, zapne ho `?nycsigns=1`.**

## 1. Rozdělení vozovky podle OSM

- Sdílený kód to už dělá: `derive.js splitRoadway` bere `parking:left/right/both`, `parking:lane:*` a `:orientation`
  i do vozovky mapy (`osmParkGive`, pruhy smějí ustoupit 0,3 m). Ověřeno v aplikaci na čtyřech ulicích New Yorku, které
  OSM stání má (Bedford Avenue, Hudson Street, East 79th Street, Avenue M): stání se do vozovky mapy kreslí.
- Jenže OSM v New Yorku stání skoro nemá: **0 z 75 cest měření** (`../park-tags.mjs`), v celém balíku `us_nyc` 6 % cest
  (4 656 ze 77 015, i s okolím; `parking:both=no` často na hlavních tepnách). Proto OSM chybějící stání nespraví a nové
  pravidlo pro OSM není potřeba.

## 2. Značky NYC DOT (Parking Regulation Locations and Signs)

- NYC Open Data `nfid-uabd` (441 055 značek, denně aktualizované; SODA, **CORS \***; bez omezení užití podle Admin. Code
  § 23-502, zdroj se uvádí). Značka má souřadnice EPSG:2263 (stopy) **na ose ulice** ve vzdálenosti od rohu, stranu
  `side_of_street` (N/S/E/W), ulici `on_street` a text.
- **Jeden dotaz na kliknutí** (značky v obdélníku řezu, desítky až stovky řádků, asi 0,6–1 s). Rozumné, zapojeno:
  `towns/newyork.js signTags` přes `extra`/`adjust` sdíleného adaptéru planimetrií, výsledek jako tagy cesty
  (`parking:<strana>=lane|no`, `:orientation`), tedy dál stejnou cestou jako stání z OSM. Jen strana, kde OSM nic nemá.
- Pravidlo (vyladěné na 28 řezech univerzálního měření New Yorku, ne na vzorku A/B): **nejbližší značka strany do 40 m**
  podél řezu, na ulici stejného jména (`streetKey`: „EAST 7 STREET“ = „East 7th Street“), rozhoduje. „Smí se stát“:
  čištění ulic (koště), parkovací hodiny (HMP, HOUR PARKING), šikmé stání, zákaz jen v některé hodiny; „nesmí“: zákaz
  stání/zastavení kdykoli (ANYTIME), zastávka autobusu, požární zóna; ostatní (panely linek, lokátory) nic. Na vývojovém
  vzorku stání u obruby: nalezeno 12 → 17 stran, navíc 1 → 6.
- Kredit „stání (Parking Regulation Locations and Signs) © NYC DOT, NYC Open Data“ ve 24 jazycích, CSP
  `data.cityofnewyork.us`.

## Vzorek a sběr

- `sample.mjs` (semínko 20261205): **90 nových náhodných řezů** pěti obvodů podle délky sítě, každý s fotkou Mapillary do
  30 m, dál než 150 m od 75 řezů měření (`../sample-all.json`, tam i vývojové), od míst zkoušení a od sebe (místní 38, tepny
  25, dálnice 15, sběrné 9, obslužné 3). Kód zmrazený před sběrem (927fbcb).
- Sběr v aplikaci (`../../collect.js`, `def` a `nycsigns`, jen OSM zvlášť), řádky `results/rows.json`, `rows-osm.json`.
  Značky rozhodly aspoň jednu stranu u 39 řezů, **profil změnily u 31** (místní 17, tepny 10, sběrné 3, dálnice 1).

## Slepé A/B (31 změněných řezů)

Dva posuzovatelé (Sonnet) na balík, pokyn `../../fresh/POKYN-AB.md`, ortofoto NYS 2024, X/Y náhodně; klíč `results/key.json`,
verdikty `results/p*-a|b.jsonl`, `measure.sh packages | score` → `results/score.md` (tam „mapa“ = bez značek).

| výběr | se značkami : bez | nerozhodně | p |
|---|---|---|---|
| **všechny** | **17 : 8** | 6 | 0,11 |
| místní | 9 : 2 | 6 | 0,07 |
| tepny | 7 : 3 | 0 | 0,34 |
| sběrné | 1 : 2 | 0 | |
| dálnice | 0 : 1 | 0 | |

Shoda posuzovatelů 25/31, kde oba vybrali stranu 19/19. Kde značky prohrály: np-8 (dálnice, stání ze značek u parkway),
np-5, np-2, np-53 (stání přidané k dělicímu pásu nebo místo pruhu), np-12, np-13, np-31, np-63 (značka „nesmí“ vzala stání,
které tam je, nebo naopak).

## Univerzální měření (skill `mereni-presnosti`, `../../../universal/POKYN.md`)

29 řezů s fotkou z celého vzorku (podle typů), jeden posuzovatel Sonnet na balík, bez profilů; 27 použitelných (np-4 a np-46
nejsou ulice). `results/q*.jsonl`, `results/score.md`.

| profil | shoda složení (95 %) | pruhy stejně | šířka do 1 / 2 m |
|---|---|---|---|
| mapa bez značek (výchozí) | **75 %** (67–82) | 44 % | 33 / 56 % |
| mapa se značkami | 72 % (64–80) | 44 % | 33 / 56 % |
| jen OSM | 56 % (48–64) | 44 % | 15 / 37 % |

Bez značek proti se značkami +2 body (0 až +5), lépe 4, hůř 0, stejně 23. **Stání zvlášť** (`parking.mjs`, strany vozovky):

| profil | stání nalezeno | chybí | navíc | bez stání shodně |
|---|---|---|---|---|
| bez značek | 19 | 13 | 0 | 22 |
| se značkami | 18 | 14 | 2 | 20 |

Většina chybějícího stání zůstala: u 6 ze 14 chybějících stran značky v řezu nerozhodly nic (žádná značka té ulice do
40 m nebo jiný zápis jména), jinde nejbližší značka „nesmí“ (zastávka, zákaz u rohu) stání nepřidala nebo vzala (np-31 A),
ačkoli podél zbytku bloku auta stojí.

## Rozhodnutí

**Vypnuté** (`?nycsigns=1`): A/B naznačuje zlepšení (17 : 8, místní ulice 9 : 2), ale znaménkový test neprošel a
univerzální měření je o chlup horší. Možné úpravy na příště (na novém vzorku): značky jen mimo dálnice a parkway, „smí se
stát“ vyhrává, je-li taková značka strany do 40 m (zastávka a zákaz u rohu jsou krátké úseky), a délka zón podle šipek.

## Kontroly

- Bez vypínače beze změny: profily 50 řezů měření New Yorku, 60 San Francisca a 60 Bostonu (sběr v aplikaci) stejné jako
  kód bez obou změn (`results/control.txt`); Washington `evaluation/canada/dc-same.mjs` 100 a New York `../same.mjs` 50
  odpovědí bajt po bajtu stejných.
- `npm test` prošel (test v `tests/usa.test.js`), `node evaluation/ortofoto-osm/regrese.mjs` beze změny.
