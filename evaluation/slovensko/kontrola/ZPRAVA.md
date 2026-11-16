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
