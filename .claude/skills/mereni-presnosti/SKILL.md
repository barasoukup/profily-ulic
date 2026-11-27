---
name: mereni-presnosti
description: Univerzální měření přesnosti profilů Profilů ulic (stejné ve všech státech): AI posuzovatel z ortofota a fotek z ulice sestaví vlastní profil a porovná se s profilem aplikace (složení uličního prostoru, pak šířka). Použij u každého nového státu a když Bára řekne, že chce přeměřit staré státy (po změnách odhadu, dat nebo ilustrací).
---

# Měření přesnosti profilů (univerzální metoda)

Postup z 17. 11. 2026 (Bára: „jednu univerzální metodu, kterou můžeme hodnotit přesnost všude“). Kód
v `evaluation/universal/`, zpráva s výsledky a kalibrací `evaluation/universal/ZPRAVA.md`.

**Co měříme:** nejdřív složení uličního prostoru (chodník, stání, pruhy, cyklo, tramvaj, zeleň, dělicí pás, pořadí
A→B), pak šířku uličního prostoru, pruhy. Obruby na centimetry ne (Bára: složení je důležitější než přesnost).

**Kdy:** u každého nového státu (po jeho zapojení, před nasazením) a na pokyn Báry u starých států (po větší změně).
Výsledek vždy srovnat s minulou tabulkou (`vysledky/staty.md`, ZPRAVA.md).

## Kalibrace (hotová, opakovat jen při změně posuzovatele nebo pokynu)

Praha proti MTVU (`score-calib.mjs`): posuzovatel s fotkou Mapillary 71 %, s panoramatem Mapy.com 82 % shody
složení; **bez fotky 28 %, tedy nepoužitelný**. Hodnotí se proto jen řezy s fotkou z ulice.

## Postup

1. **Vzorek** `sample.mjs`: 10 měst státu (velká i menší) v `TOWNS` pod kódem státu ISO, 8 náhodných bodů do
   1,5 km od centra, pevné semínko. `node evaluation/universal/sample.mjs > evaluation/universal/sample.json`.
2. **Ortofoto státu** v `ortho.mjs fetchOrtho` (CZ ČÚZK, SK ZBGIS, AT basemap.at z20→z19, DE WMS spolkové země).
   Nový stát: přidat jeho národní ortofoto. Výřez: řez vodorovně, ulice nahoru, A vlevo, 10 px = 1 m.
3. **Dlaždice OSM** pro lokální sběr (`?osm=balik`): u velkého státu jen města vzorku osmiem
   (`osmium extract -c …` z výřezu Geofabriku, pak `tools/build_osm_data.sh` a `pack_osm_tiles.mjs`).
4. **Profily aplikace:** server s `EVAL_SAVE=1` (`.claude/launch.json` „pilot-germany-eval“, port 5196), body do
   `app/public/zz-pts.json`, v prohlížeči skript z `collect.js` (CSP nedovolí eval: vložit funkci přímo přes
   javascript_tool), uloží `data/app*.json`. Pozdější sběr týchž řezů po opravě: jiný název (`app-at`), vyhrává.
5. **Výběr a fotky** `node evaluation/universal/select.mjs <ISO>`: nejvýš 4 řezy na město, které mají fotku.
   Mapillary všude (token `evaluation/streetview/token.local`), v Česku navíc panorama Mapy.com (vlastní klíč
   `evaluation/universal/mapy-key.local`; klíč aplikace je omezený na web, Referer nepodvrhovat). Obě git ignoruje.
6. **Posuzovatelé:** agenti Sonnet po ~20 řezech, podle `POKYN.md`, **fotky povinně** (bez toho je přeskočí),
   profil aplikace nesmí vidět, výstup `vysledky/u-<iso>-N.jsonl`. Zkontrolovat, že každý řez má ortofoto
   (`data/<id>-ortho.jpg`); agent bez ortofota vymýšlí.
   Pokyn od 25. 11. 2026 (oddíl „Co do profilu patří“): každá část od asi 0,5 m včetně pásů trávy a stromů mezi chodníkem a
   obrubou, stání podle pruhu u obruby (ne jen kde stojí auto), chodník až k fasádě a po kusech, pruhy neznačené obousměrky.
   Zadání agentovi neutrální: odkázat na `POKYN.md`, nic nepřidávat (nápověda „pásy jsou tu časté“ zvedla ve Washingtonu
   skóre s mapou o 4 body a bez ní ho o 4 snížila). Posudky se liší i při stejném pokynu (shoda asi 75 %, skóre ±5 bodů): při změně pokynu
   dát i kontrolu starým pokynem (`pokyn2-select.mjs`, `pokyn2-score.mjs`).
7. **Skóre** `node evaluation/universal/score-states.mjs` (jen řezy s vozovkou), uložit do `vysledky/staty.md`,
   doplnit ZPRAVA.md, commit.
8. **Úklid:** `node evaluation/universal/clean.mjs` (panoramata Mapy.com se podle podmínek nesmí uchovávat),
   smazat `app/public/zz-pts.json`.

## Na co dát pozor (z prvního měření)

- Ověřit, že odhad státu opravdu čte ortofoto (`sources.orthoCity` v nasbíraných profilech): basemap.at mělo z20
  jen ve třech městech a zbytek Rakouska ortofoto neměl.
- Náhodné body padají i na pěšiny v parku: počítají se jen řezy s vozovkou.
- Aplikace dělí chodník stromořadím na kusy, posuzovatel ne („navíc chodník“): rozdíl zápisu, ne nutně chyba.
- Šířka z ortofota je hrubá, brát orientačně.
- Cena: asi 0,4 mil. tokenů na stát (40 řezů); kalibrace 0,7 mil.

## Výsledky 17. 11. 2026 (shoda složení / šířka do 2 m)

CZ 56 % / 31 %, SK 60 % / 53 % (jen 15 řezů), AT 57 % / 27 %, DE 58 % / 35 %. V AT a DE nejčastěji chybí stání.

## Přeměření starých států (24. 11. 2026)

Stejná posouzení, nové profily: `zz-pts.json` z posouzených řezů (`judge.json`: poloha a azimut), v prohlížeči
`collect24` z `collect.js` (řez jako odkaz `#rez=`, uloží i `highway`/`service` cesty z balíku OSM), název souboru
`app-z…` bez číslic (jinak ho `score-states.mjs` nevezme). Před: `SKIP=<název> OLD=1 NOEX=1` s `DATA_DIRS` starých sběrů.
Zkontrolovat, že státní služby odpovídají (24. 11. vypadlo ortofoto Geoportalu PL), a srovnat zdroje (`sources`) se
starým sběrem. Výsledky 24. 11.: `vysledky/staty.md`.

## Kontrola umístění kliknutí (25. 11. 2026)

Uložené řezy se otevírají přesně, takže žádné měření s uloženou polohou neukáže, kam padne kliknutí. Po každé změně v
`derive.js` `nearestStreet`, `placeCut`, `awayFromJunctions`, `alleyMouths`, `partnerJunctions`, `centerOnStreet`:
1. `git archive <commit před> app/public | tar -x -C <složka>`; `OLD=<složka>/app/public node evaluation/kliky/collect.mjs`
   (440 kliků, bez prohlížeče) a `node evaluation/kliky/report.mjs vysledky/kliky.json now` (posuny, nad 25 m s příčinou, chyby).
   Velký sběr: `times=10 seed=… city=…`. Washington jen, když je jeho balík OSM.
2. `node --test tests/placement.test.js` (nahrané scény; nová scéna: `evaluation/kliky/scenes.json`, `record.mjs`).
3. Kde se místa liší: proti mapám měst `podil.js`, `podil-souhrn.mjs`, naslepo `vyber.mjs`, `profily.js`, `baliky.mjs`, `skore.mjs`
   (nové semínko, čerstvá místa, zmrazená kopie kódu). Zpráva `evaluation/kliky/ZPRAVA.md`.
