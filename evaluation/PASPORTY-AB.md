# A/B pasportů měst (připraveno 15. 11. 2026, spustit po odstávce DMVS)

Zdroje našlo vlákno „Slovensko“ (13.–15. 11. 2026). Od 16. 11. 2026 jsou v aplikaci (`pilot/public/towns/pasporty.js`,
Bára: do konce odstávky je to lepší než odhad), test je dodatečný: „city“ je aplikace s pasportem města (jinde
technická mapa ČÚZK, jako moduly Karviné a Třebíče), varianta `variants/bez-pasportu-mest.mjs` aplikace bez něj
(jen technická mapa ČÚZK, RÚIAN, OSM). Kde pasport nevyhraje, z `pasporty.js` vyřadit. Technická mapa ČÚZK (IS DMVS i DTM krajů) má od 12. do 18. 11. 2026
odstávku kvůli přechodu na JVF DTM 1.5.0.2, plný provoz má být 19. 11. Bez ní by „city“ byl jen odhad z OSM.

| Město | Zdroj | Vzorek |
|---|---|---|
| chomutov | T-MAPY PaKom (typy i třídy komunikací) | 100 |
| sumperk | T-MAPY PaKom | 73 |
| roznov | T-MAPY PaKom | 63 |
| litomerice | ArcGIS, chodníky a úseky komunikací (2018) | 64 |
| chotebor | ArcGIS, komunikace (2016) | 49 |
| slapanice | ArcGIS, komunikace podle třídy a parkoviště | 31 |
| kurim | ArcGIS, osy zimní údržby se šířkou → plochy | 48 |
| prachatice | ArcGIS, pasport zeleně 02/2026 (zeleň, cesty, hřiště) | 55 |
| roudnice | ArcGIS, polygony zeleně | 54 |

Vynechané: Mohelnice a Velké Meziříčí (pasport 15. 11. prázdný), T-MAPY Litoměřic (chce přihlášení).

Vzorky: `node evaluation/town_prep.mjs <město> <název obce nebo kód RÚIAN>` a `CITY=<město> node evaluation/sample.mjs`
(data v `evaluation/<město>/data/` a `data/osm/`, mimo git).

## 19. 11.
1. Ověřit, že DMVS běží a nezměnil se po přechodu na JVF DTM 1.5.0.2 (aplikace: řez mimo naše města, např.
   Komenského ve Vysokém Mýtě; `node tools/check_sources.mjs`).
2. Pro každé město:
   ```bash
   CITY=chomutov VARIANTS=bez-pasportu-mest,city CACHE=disk node evaluation/ab.mjs
   CITY=chomutov VARIANTS=bez-pasportu-mest,city node evaluation/ab.mjs --summary
   ```
   Obrázky rozdílných řezů nad ortofotem jsou v `evaluation/<město>/data/ab-bez-pasportu-mest-city/png/`, posudky do
   `review.md`.

## Výsledky (26. 11. 2026)

**DMVS po přechodu na JVF DTM 1.5 běží.** WMS `dtm_zps_plochy_bar` i `dtm_zps_linie_body` vracejí mapu (ne „Plánovaná
odstávka“). Komenského ve Vysokém Mýtě (Pardubický kraj, WFS kraje) má 83 ploch: budova, zeleň, chodník, vozovka,
chodník, budova. Typy v bodě se čtou z kódu JVF (oprava 63b9726). `node tools/check_sources.mjs` pro česká města a
„cesko“: vše ok.

**A/B:** varianta A `bez-pasportu-mest` (jen DTM ČÚZK, RÚIAN, OSM) proti B `city` (s pasportem). Vzorky z
`evaluation/<město>/data/samples.json`, všechny řezy. Řezy, kde se profily liší, posouzené nad ortofotem: nejdřív složení,
pak šířka. Verdikty s poznámkami jsou v `evaluation/<město>/data/ab-bez-pasportu-mest-city/review.md` (mimo git).
`evaluation/ab.mjs` teď nechává dotazy na web bez časového limitu aplikace. Dřív limit 8 s vypršel, zatímco dotaz čekal
ve frontě `polite.mjs` (16 GetFeatureInfo DMVS na řez), a řez se pak lišil podle fronty, ne podle dat.

| Město | Řezů | Liší se | Lepší A (bez) | Lepší B (s pasportem) | Obě | Žádná | Rozhodnutí |
|---|---|---|---|---|---|---|---|
| chomutov | 71 | 47 | 33 | 8 | 6 | 0 | vyřadit |
| sumperk | 73 | 10 | 4 | 4 | 2 | 0 | vyřadit (nevyhrál) |
| roznov | 63 | 43 | 12 | 21 | 9 | 1 | nechat |
| litomerice | 64 | 14 | 6 | 5 | 3 | 0 | vyřadit |
| chotebor | 49 | 6 | 1 | 4 | 0 | 1 | nechat |
| slapanice | 31 | 20 | 6 | 8 | 5 | 1 | nechat (těsně) |
| kurim | 48 | 21 | 6 | 10 | 2 | 3 | nechat |
| prachatice | 55 | 11 | 2 | 1 | 6 | 2 | vyřadit |
| roudnice | 54 | 11 | 9 | 0 | 2 | 0 | vyřadit |

V aplikaci zůstávají Rožnov, Chotěboř, Šlapanice a Kuřim. Vyřazené jsou z `towns/pasporty.js` i z `pasporty.json`, jejich
servery z CSP (`gis.chomutov.cz`, `gis.sumperk.cz`, `services1.arcgis.com`). Jména zůstala v `pasporty-names.js`, aby
uložený nebo exportovaný řez s jejich pasportem neztratil kredit.

Co se ukázalo:
- **Chomutov:** plocha vozovky z pasportu pohltí chodníky dobře viditelné na ortofotu. Chodník se pak změní na pruh,
  krajnici nebo stání. Úzký kousek vozovky za chodníkem (sjezd) z chodníku udělá „dělicí pás“ (č. 15, 24, 43, 62).
  Pomáhá jen mimo zástavbu, kde DTM nic nemá.
- **Šumperk:** cyklopruhy na vozovce bere jako stezku mimo vozovku. Plochy se tlučou s pruhy z OSM. Na okrajích pomůže
  (cesta za zelení, polní cesta).
- **Rožnov:** v Rožnově DTM kraje často chybí (odhad z OSM: bez pasportu 12 řezů, s pasportem 1), proto pasport hlavně
  dává skutečnou šířku úzkých cest. Typická chyba je vozovka pasportu přes dvory nebo sousední komunikaci (č. 39, 43,
  44, 54, 59, 63: vozovka 20–27 m). Ořez plochy pasportu na souvislý kus pod osou by pomohl.
- **Litoměřice:** pasport přidá úzké chodníky (Tyršův most, obytné ulice), ale vymýšlí vozovky (č. 30 druhá vozovka přes
  křoví, č. 59 stání uprostřed vozovky).
- **Chotěboř:** malý vzorek, rozdíly hlavně v šířce. Pasport složení nerozbil.
- **Šlapanice:** pasport vozovku přesněji umístí a doplní stání a zeleň, kde DTM nic nemá. Když se netrefí, vyrobí velké
  zpevněné plochy přes zahrady a domy (č. 21, 23, 26) nebo dělicí pás jako v Chomutově (č. 22).
- **Kuřim:** DTM Jihomoravského kraje v obytných ulicích Kuřimi nemá nic (WFS kraje i obrázek DMVS jsou prázdné), A je
  tam odhad z OSM. Obdélníky zimní údržby dávají úzké chodníky a skutečnou šířku, ale jinde vozovku rozfouknou (č. 38,
  41). Tři prohry B jsou parcely RÚIAN, které se s pasportem přidají (č. 28, 37, 40).
- **Prachatice, Roudnice (zeleň):** polygony zeleně přes osu ulice shodí řez na odhad z OSM (Roudnice č. 16, 36) nebo
  ukousnou chodník. Prachatice č. 35: zpevněná plocha 14 m přes zahrady.

Na později: pasport by šlo brát jen tam, kde DTM pod řezem nic nemá, nebo ořezat jeho vozovku na souvislý kus pod osou
(Rožnov, Šlapanice). Pozor na úzkou vozovku pasportu za chodníkem: dělá dělicí pás (Chomutov, Šlapanice), což je
chyba skládání (`derive.js`), ne jen pasportu.

**Jihlava:** pasport komunikací je zpátky. 26. 11. vrstva 112 („vše“) vrací 13 323 úseků, vrstvy 1, 2 a 34 po 13 084,
113 až 115 918, 2 891 a 2 722, vrstva 111 je skupina (dotaz vrací 400). Kolem Masarykova náměstí vrací vozovky i chodníky.
Náhradu není třeba dělat. Obecné pravidlo „pasport bez ploch nechá řez technické mapě“ (`withPassports`) má teď test
(`tests/city.test.js`). Jihlavský modul ho nepoužívá: když jeho pasport zase zmlkne, profil bude odhad z OSM. Případně
se zeptat města, proč byl pasport 16. 11. prázdný (nikoho jsme nekontaktovali).
