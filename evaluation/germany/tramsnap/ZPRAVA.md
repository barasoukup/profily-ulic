# A/B: koleje z OSM do tramvajového tělesa z mapy města (18. 11. 2026)

Podnět: Neue Schönhauser Straße v Berlíně (`#rez=52.524699,13.405405,69,22.0,22.0`), OSM má `parking:both=lane`, aplikace
kreslila stání jen na straně A. Koleje z OSM (cesty 153424801, 153424828) leží asi 1 m jižněji než Gleiskörper z
berlínské Straßenbefahrung, na straně B pak zbylo 0,8 m. Pravidlo v `derive.js` `snapTracksToBeds` (popis v `app/README.md`,
Tramvajové koleje), `?off=tramsnap` ho vypne.

Sběr v aplikaci (localhost, `?osm=balik`), každý řez hned po sobě A = `off=tramsnap`, B = s pravidlem. Body na tramvajových
kolejích z OSM (semínko 20261118, jeden bod na buňku mřížky).

| Město | řezů | profil se liší |
|---|---|---|
| Berlín (+ řez z podnětu) | 33 | 3 |
| Praha (kontrola, změřené osy kolejí) | 8 | 0 |
| Brno (kontrola, MTVU 705) | 8 | 0 |
| Vídeň (kontrola, FMZK) | 8 | 0 |

| řez | ulice | A → B | posudek |
|---|---|---|---|
| 52.524699,13.405405,69 | Neue Schönhauser Straße | stání jen A → stání na obou stranách | lépe B (OSM i mapa) |
| 52.531975,13.399341,-25 | Brunnenstraße | pruh 4,84 m vedle kolejí → dva pruhy 3,14 + 2,79 | B odpovídá tělesu z mapy (4,5 m, OSM má koleje 4,1 m od sebe); ortofoto zimní, nerozhodne |
| 52.526951,13.403386,-11 | Rosenthaler Straße | dva tramvajové pruhy po 4,9 m → 3,92 + 2,80 + pruh 3,08 | B odpovídá tělesu z mapy (4,2 m); ortofoto nerozhodne |

Při ladění vyšly dva případy, které pravidlo teď vynechává: Oranienburger Tor (samostatné těleso 4,6 m užší než dvojice
kolejí z OSM: těleso kreslí svou tramvaj samo, kolej vzatá z vozovky by se ztratila) a Rotundenbrücke ve Vídni (proužek
tělesa 1,6 m přitáhl kolej 1,6 m daleko, tramvaj z pruhu zmizela): těleso aspoň 2,5 m, posun nejvýš 1,25 m.

Regrese odhadu z ortofota a OSM (`node evaluation/ortofoto-osm/regrese.mjs`) beze změny proti `vysledky/regrese.txt`.
