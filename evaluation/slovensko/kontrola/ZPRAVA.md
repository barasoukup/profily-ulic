# Kontrola 1000 slovenských řezů (16. 11. 2026)

Bára: „Zřídíš si agenta, který projde 1000 míst na Slovensku… Pak se je pokusíš opravit. Před každou opravou A/B.“

## Jak
- `vzorek.mjs`: 1000 bodů s pevným výběrem kolem center 26 měst (Bratislava 228, Košice 120, 8 krajských a okresních
  měst po 40–50, 16 menších po 17). Aplikace každý bod přichytí k nejbližší ulici.
- `sber.js` (modul, běží ve stránce aplikace `?osm=r2`): řez, díly profilu a všechny cesty OSM, které čára řezu
  protne, s polohou od A. Asi 9 minut. Výsledky zůstávají ve stránce (`localStorage` `kontrola-1000-A`).
- `kontrola.js`: podezření podle OSM na čáře řezu (ne verdikt): `report(rows)` dá seznam s odkazy, `findings(rows)`
  druhy pro A/B. Opravy se A/B porovnají na stejných 1000 bodech (sběr znovu, rozdíly podle druhů).
- Bářiny nálezy z procházení: `speky.md`.

## Výsledek stavu b3b9fea + a5325ec

| druh | řezů | poznámka |
|---|---|---|
| pěšina nebo cyklostezka nakreslená jako silnice | 252 | 238 z nich je „pruh 3 m \| pruh 3 m“: řez chytil pěšinu (footway 126, path 90, cycleway 25, schody 5), odhad z ortofota a OSM z ní udělá dvoupruhovou silnici |
| široký jízdní pruh (> 4,6 m) | 65 | Strieborná v Žilině 7,15 m, Južná v Nitře 6,5 m, Chorvátska v Bratislavě 6,3 m |
| cyklostezka z OSM chybí | 44 | většinou totéž jako první řádek (řez na cyklostezce); jinak cyklostezka vedle ulice v zeleni (Trenčianska, Kopčianska, Jantárová) |
| počet pruhů jiný než OSM lanes | 24 | Trnavská cesta OSM 4 / profil 7, Viedenská cesta 4 / 2, Landererova 6 / 4 |
| bez profilu | 16 | |
| široký chodník (> 9 m) | 14 | Lužná 34 m, Na Vtáčniku 22 m, Čremchová 21 m |
| chodník z OSM leží ve vozovce profilu | 6 | Devínska, Viedenská, Drotárska cesta: chodník v „krajnici“ |
| ulice bez jízdního pruhu | 2 | Satinského, Prokopova: chodník \| krajnice \| krajnice \| chodník |
| koleje tramvaje bez tramvaje | 1 | Jantárová cesta |
| cyklopruh na silnici (OSM) chybí | 1 | Kasárenská v Trenčíně (cycleway=lane) |

Pořadí oprav podle počtu: 1. pěšina jako silnice, 2. široké pruhy, 3. počet pruhů proti OSM, 4. řezy bez profilu.

## Oprava 1: pěšina, cyklostezka a schody jako jeden díl (A/B, 16. 11. 2026)
Řez, který chytí pěšinu (OSM footway, path, cycleway, steps, bridleway), dostal z odhadu z OSM dva jízdní pruhy po 3 m.
Teď jeden díl: chodník, stezka pro cyklisty, nebo společná stezka (cyklostezka s chodci bez oddělení, pěšina pro kola),
šířka z OSM `width`, jinak typická (chodník 2 m, cesta 1,5 m, cyklostezka 2,5 m). `derive.js` `estimatePath`,
vypnutí pro A/B `?off=cesty`.

- Změnilo se 244 z 1000 řezů. 238 je právě pěšin ze „pruh | pruh“: chodník 2 m 124×, 1,5 m 82×, společná stezka 24×,
  cyklostezka 6×. Zbylých 6 jsou silnice odhadnuté z ortofota, kde se šířky mezi dvěma běhy liší o desítky centimetrů
  (kolísání čtení obrázku, oprava se jich netýká).
- Podezření: pěšina jako silnice 252 → 14 (zbylé nejspíš falešné poplachy kontroly: ulice, kterou u osy kříží chodník; neprošla jsem je),
  cyklostezka z OSM chybí 44 → 14, chodník ve vozovce 6 → 4; ostatní beze změny.
- Regrese odhadu proti MTVU Prahy a Brna beze změny. Testy prošly.
- Pozor při sběru: běh ve skryté záložce se zpomalí; když se do `localStorage` uloží velké výsledky, aplikace pak
  neuloží profil a řez vyjde prázdný (proto výsledky jen v paměti stránky).

## Oprava 2: obousměrka s jedním pruhem od 5 m má dva pruhy (A/B, 16. 11. 2026)
Čtení čar z ortofota (`lanes-ortho.js`) nechá jeden pruh, když středovou čáru nenajde, i na obousměrné ulici široké 5–6,6 m
(Haanova 6 m, Devínska a Jantárová cesta přes OSM lanes=2). Pravidlo 2 × 2,5 m od 5,0 m (Manuál C.2) teď platí i po
něm: `derive.js` `splitTwoWayLane`, voláno v `app.js` po `applyLanes`. Ne v obytné a pěší zóně, na jednosměrce, kruhovém
objezdu, ulici s tramvají nebo více vozovkami a ne při OSM lanes=1. Vypnutí pro A/B `?off=dvapruhy`.

- A (vypnuto) a B (zapnuto) na stejných 1000 řezech, výsledky v IndexedDB stránky (`A-dvapruhy-off`, `B-dvapruhy`).
- Rozdělilo se 13 jednopruhových obousměrek o 5,0–6,6 m čistě, dalších asi 7 mezi řezy, které se zároveň změnily jinak.
- Široký pruh (> 4,6 m) 65 → 49, počet pruhů proti OSM 24 → 22.
- **Šum mezi běhy:** 59 řezů vyšlo v B s jinými druhy dílů a 20 s jinými šířkami, i když se jich oprava netýká (chodník
  navíc nebo chybí, tramvaj, krajnice). Odhad z ortofota a OSM tedy pro stejný řez nevychází pokaždé stejně. Je to chyba
  sama o sobě (další bod) a do té doby se A/B musí číst jen na řezech, kterých se oprava týká.
