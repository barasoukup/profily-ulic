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
- **Šum mezi běhy:** 59 řezů vyšlo v B s jinými druhy dílů a 20 s jinými šířkami, i když se jich oprava netýká. Příčina:
  v B na chvíli neodpovídalo ZBGIS nebo ortofoto (souvislý blok košických řezů), aplikace pak potichu spočítala hrubší
  odhad jen z OSM; znovu spočítané vyšly jako v A. A/B se proto čte jen na řezech se stejnými zdroji v obou bězích
  (`kontrola.js` `compare`).
- Na 917 řezech se stejnými zdroji (83 vynecháno) se změnilo přesně 13: všechno jednopruhové obousměrky o 5,0–6,6 m, teď
  dva pruhy. Nic jiného. Široký pruh (> 4,6 m) 62 → 49, počet pruhů proti OSM 24 → 21.

## Oprava 3: strop šířky pruhu i po ortofotu (A/B, 16. 11. 2026)
Pruh širší než strop své ulice o metr a víc (místní 4,5 m, jinak 4 m, dálnice 3,75 m) dá zbytek krajnici, odhad, i když
pruh přeměřilo ortofoto: `derive.js` `capWideLanes` po `splitTwoWayLane`. Krajnice ke straně pruhu u obruby, k
existující krajnici, je-li u pruhu (žádné dvě vedle sebe), na obě strany, když obě jsou u obruby a zbytek stačí na dvě.
Ne mezi pruhy, ne v obytné a pěší zóně. Vypnutí `?off=strop`.

- A = běh po opravě 2, B = se stropem, porovnáno 922 řezů se stejnými zdroji: změnilo se přesně 11, všechno ty široké
  pruhy (Ďumbierska 6,1 → 4,5 + 1,6, Športová 5,8 → 4,5 + 1,3, Montua 6,6 → 1,05 + 4,5 + 1,05). Široký pruh 49 → 38.
- Po prvním běhu přibylo sloučení s krajnicí, která už u pruhu byla (Viedenská cesta), a znovu přepočítáno těch 11.
- **Zbývá:** u ulic, kde OSM počítá víc pruhů (Viedenská cesta 2 + 2), je místo druhého pruhu široká krajnice; patří k
  bodu „méně pruhů, než má OSM“.

## Vzorek 995 skutečných ulic (Bára 16. 11. 2026: „více zaměřit na cesty, které jsou fakt ulice“)
`vzorek-ulice.mjs`: náhodné body stejných měst přichycené k nejbližší pojmenované ulici (primary až residential,
obytná zóna) do 250 m, nejvýš dva body na ulici; 733 residential, 99 tertiary, 64 primary, 37 unclassified, 33 secondary,
22 obytných zón, 7 trunk a nájezdů. Běh `U-1` (stav po opravách 1–3): profil u všech 995, vždy na zamýšlené ulici.

| podezření | řezů |
|---|---|
| počet pruhů jiný než OSM lanes | 70 |
| cyklostezka z OSM chybí | 35 |
| chodník z OSM leží ve vozovce profilu | 24 |
| široký chodník (> 9 m) | 16 |
| obousměrka jako jeden pruh a široká krajnice | 13 |
| ulice bez jízdního pruhu | 5 |
| koleje tramvaje bez tramvaje | 4 |
| cyklopruh na silnici (OSM) chybí | 4 |

- Kontrola širokých pruhů je teď podle pravidla (pruh nad strop o 1 m a víc, mimo zóny): žádný. Dřívějších 115 „pruhů
  nad 4,6 m“ jsou pruhy do metru nad stropem (krajnice by byla užší než 1 m), obousměrky pod 5 m a obytné zóny.
- Počet pruhů proti OSM: nejvíc (18) obousměrka s OSM lanes=2 jako jeden pruh 3,5–4,4 m a „krajnice“ 1,7–2,4 m z
  ortofota. Ve Street View (Hroboňova) bez parkujících aut, s trolejemi: krajnice je druhý pruh, ortofoto vzalo
  středovou čáru za vodicí. Dále ulice ze dvou vozovek s méně (16) i více (11) pruhy než OSM.
