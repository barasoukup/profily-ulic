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
