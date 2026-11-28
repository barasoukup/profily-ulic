# Železnice

Železnice v odhadu a v profilu.

## Železnice (Bára 27. 11. 2026)

Díl `railway` („Železnice“): trať vedle ulice na povrchu, štěrkové lože se dvojicí kolejnic na kolej (bez vozidla a trolejí).
OSM `railway=rail|light_rail|subway` (lože 4,5 m, osy kolejí po 4 m) a `narrow_gauge` (3,5 m, po 3 m) v úrovni ulice (ne tunel,
ne most), souběžně s ní (do 35° od směru ulice), za vozovkou, kterou říká OSM, a nejvýš `RAIL_GAP` 10 m za posledním prvkem ulice
(obrubou, chodníkem), nejvýš 4 koleje na straně. Zrušené a opuštěné tratě se nekreslí. Zapojení: `ortho-osm.js` (`heavyRail`,
lože před vozovkou, na straně bez domu v řetězu věcí konce strany, v středním pásu), `derive.js` (typ `railway`), kresba
`profile.js drawRailway`, povrch částečně propustný (`shares.js`), do Streetmixu jako štěrkový dělicí pás. Vypnutí `?off=railway`.
Dlaždice OSM: `tools/build_osm_data.sh` a `tools/build_osm_tiles.mjs` nově drží koleje `rail`, `narrow_gauge` a `subway` na povrchu
do jedné buňky (asi 30–45 m) od silnice; **balíky na R2 je potřeba přestavět** (týdenní workflow), do té doby se železnice kreslí
jen v místních vzorcích. Měření a postup: `evaluation/archive/railway/REPORT.md`.

Samostatně `?dosah=0` vypne (výchozí zapnuto, Bára 27. 11. 2026: jen ručně natažená strana, cílená akce, neměří se): strana, kterou uživatel natáhl za obvyklý dosah (22 m), nekončí na poslední stezce či
chodníku, ale pokračuje zelení a dalšími plochami do dosahu, k plotu nebo budově (`orthoOsmPolys` parametr `stretch`).
