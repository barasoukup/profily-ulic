# Doplnění kolem mapy povrchů (mapFill) i v Česku (25. 11. 2026)

Bára 24. 11. 2026: co nejvíc ve sdíleném kódu, výjimka státu jen s naměřeným důvodem. `mapFill` (commit 4130a06,
`../finland/ab3/ZPRAVA.md`) byl zapnutý ve všech státech kromě Česka (`CZ.js mapFill: false`), bez měření, jen z opatrnosti.

## Co mapFill v Česku dělá

V Česku se `besidePassport` nepoužívá (stát ho nemá), takže zbývá:

- `parkFromAi(..., { inside: true })` ve vozovce MTVU nebo technické mapy: stání tam, kde model na ortofotu vidí auta u
  obruby, a zákonný pruh stání zpět do jízdního pruhu, kde auta nestojí. Ne tam, kde rozhodují data o stání (ZPS, úseky
  TSK nebo parkovanivbrne u řezu, strana označená v OSM; `parkSkip`).
- `osmParkGive`: stání označené v OSM smí pruhům ve změřené vozovce ubrat 0,3 m.

## Vzorek a sběr

Nový náhodný vzorek (`sample.json`; náhodné body v kruhu kolem centra, semínka 20261124, 99112233, 777331 a 5550123,
přitažené na nejbližší ulici pro auta do 25 m z balíku OSM, žádný do 100 m od jiného; dva blízko bodů univerzálního
měření, 61 a 19 m, vyřazené): **90 řezů**

- DTM krajů 45: Ostrava, Olomouc, Liberec, Hradec, Kolín, Třebíč, Pardubice, Zlín (po 4–5), České Budějovice, Ústí (po 3);
- Praha 28 (16 do 3,5 km od centra, 12 na okraji 4,5–9,5 km, mimo ZPS);
- Brno 7, Plzeň 5, Jihlava 5.

Sběr na localhostu (`?osm=balik`, `sber.js collectMF`): O = Česko bez mapFill (stav do dneška), N = s mapFill
(`CZ.mapFill` přepnutý za běhu). Výsledky `vysledky/rezy-prvni.json` (první sběr) a `vysledky/rezy.json` (N z konečného
kódu). Výpis změn `node evaluation/mapfill-cz/diff.mjs`.

## Co se změnilo

Změnilo se **8 z 90**; jeden z nich (Úvoz v Brně, jediný pruh 4,15 ↔ 4,20 m) se mění i bez mapFill mezi dvěma
kliknutími (šum), takže skutečně **7 z 89**: DTM krajů 5 ze 45, Praha 1 z 28, Brno/Plzeň/Jihlava 1 ze 16.
27 z 28 pražských řezů se nezměnilo, protože v ZPS a u úseků TSK rozhodují data o stání, ne model.

První sběr ukázal chybu sdíleného kódu: zákonný pruh stání vrácený do jízdního pruhu dělal pruhy 5,5–6,7 m (Rosická
6,67 + 6,67, Šatrova 5,62 + 5,62, Vltavínská 6,14), protože `capWideLanes` běží před `parkFromAi`. Oprava v `app.js`:
po stání z modelu ve vozovce mapy se strop pruhu použije znovu (zbytek krajnice, jako všude jinde).

## Slepé posouzení

Jako `../finland/ab3`: ortofoto ČÚZK bez čar aplikace, fotky z ulice (Mapillary, kde nejsou, statická panoramata
Mapy.com: 6 řezů; po posouzení smazané podle podmínek), profily jako X a Y v náhodném pořadí bez zdrojů, dva balíčky
po 4 řezech, každý jiný posuzovatel (agent bez přístupu ke kódu a klíčům). Klíče `vysledky/klic-cz*.json`, posudky
`vysledky/posudky.json`.

| řez | skupina | O → N | posudek |
|---|---|---|---|
| mf-ostrava-1 K Trojhalí | kraje | zákonné stání A pryč, krajnice 1,0 + pruh 4,5 | **N** (u A auta nestojí) |
| mf-trebic-1 Vltavínská | kraje | stání z B na A (auta), pruh 4,5 + krajnice | **N** (auta u A, B volná) |
| mf2-kolin-3 Roháčova | kraje | stání u A (auta), jeden pruh 4,14 | **N** (auta u A, vozovka 6 m) |
| mf2-pardubice-1 Jindřišská | kraje | stání u A (auta), jeden pruh 4,0 | **N** (podélné auto u A) |
| mf2-budejovice-1 Jeronýmova | kraje | stání i u A | O (u A zastávka „ZAS“, model vzal auto u ní za stání; zastávka v OSM není) |
| mf2-brno-3 Rosická | Brno | zákonné stání pryč, krajnice 2,17 | O, nízká jistota (auta stojí 7–11 m od středu v zálivu za keři, model na ortofotu nevidí nic; O je má jen náhodou blíž) |
| mf2-brno-2 Masná | Brno | zákonné stání pryč | N, slabě (řez v křižovatce, stání pod řezem není) |
| mf3-praha-5 Šatrova | Praha | zákonné stání u A pryč, B zůstává | **N** (auta jen u B) |

Šatrova poprvé prohrála (N tehdy vrátil stání na obou stranách). Důvod: obruba B z MTVU leží 2,3 m za obrubou na
ortofotu, auta model vidí 1,5–3,5 m od středu, v pásu 2,5 m u obruby mapy ale nic. Oprava v `ai-kerbs.js parkFromAi`:
ve vozovce mapy (`inside`) se zákonný pruh vrací jen tehdy, když model nevidí auta ani 2,5 m za ním (šířka pruhu + 2,5 m,
dřív 2,5 m od obruby). Ostatní řezy to nezměnilo; Šatrova znovu naslepo (balíček cz3): **N**.

**Celkem N 6 : O 2** (kraje 4 : 1, Praha 1 : 0, Brno 1 : 1). Žádná skupina není horší; obě prohry jsou chyby modelu na
jednom snímku (auto u zastávky, auta mimo vozovku mapy), ne české mapy.

## Praha proti MTVU

Změnil se jediný pražský řez (Šatrova). Šířka vozovky zůstala na centimetr podle MTVU (11,24 m), mění se jen dělení
uvnitř: stání u A pryč, u B zůstává. MTVU stání ve vozovce nekreslí a TSK tam úseky nemá (jinak by model nerozhodoval),
takže v datech IPR o stání nic není; profil se od MTVU nevzdaluje, posun je jen v tom, co MTVU neříká, a souhlasí
s fotkami. Ostatních 27 pražských řezů je stejných.

## Kontroly

- `node evaluation/ortofoto-osm/regrese.mjs`: totožná s `vysledky/regrese.txt` (odhadu bez mapy se změna netýká).
- `npm test`: 422 prošlo.
- Doba řezu: medián N − O +37 ms (model běží jednou na řez; N běželo po O, s teplejší cache, číslo je jen orientační).

## Rozhodnutí

Lepší, žádná skupina horší, a česká výjimka neměla měření: **výjimka zrušena**. Žádný stát už mapFill nevypíná, proto
zmizel i příznak státu `mapFill` (`countries/default.js`, `CZ.js`); doplnění kolem mapy je sdílená cesta pro všechny
státy, vypnout jde jen `?off=mapfill`.

## Univerzální měření Česka znovu

`collect24` na posouzených řezech (`data/app-zzzzprepocet-mapfill.json`, jen lokálně): změnily se 2 ze 40. Olomouc-4
Sokolská dostala stání u B (OSM, `osmParkGive`) a shoda řezu 40 → 50 %; olomouc-2 jen šířky o 3–5 cm. **CZ 58 %
(beze změny po zaokrouhlení)**, pruhy 30 %, šířka do 1 / 2 m 30 / 33 %.

Zbývá: model občas vezme za stání auto u zastávky (zastávka bez OSM), auta v zálivu mimo vozovku mapy nevidí.
