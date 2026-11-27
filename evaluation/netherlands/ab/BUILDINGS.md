# A/B budov: BAG a 3D BAG v Nizozemsku (20. 11. 2026)

Stejný vzorek 37 řezů jako A/B mapy povrchů (`sample.json`), každý bod hned po sobě A = bez BAG (`?bag=0`, jen OSM)
a B = s BAG a 3D BAG; uložené fasády `results/budovy.json`.

| | A (jen OSM) | B (BAG a 3D BAG) |
|---|---|---|
| fasád s budovou | 40 | 40 |
| s počtem podlaží | 6 | 31 |
| s rokem stavby | 0 | 39 |
| s využitím (byty, kanceláře, dům…) | 9 | 39 |

- Kde OSM podlaží znalo (am6, am8, ro4, de5: 3, 3, 8, 15 podlaží), B ho nechává (OSM `building:levels` má přednost
  před podlažími odhadnutými z výšky 3D BAG) a shoduje se.
- Rok stavby rozhoduje o vzhledu (do 1919 šikmá střecha, staré jádro, po 1990 moderní): bez BAG ho nizozemské domy
  neměly vůbec, vzhled se jen hádal. Střecha z 3D BAG (šikmá, plochá) u 25 fasád.
- Dům s jedním bytem (BAG `aantal_verblijfsobjecten` 1) je rodinný dům, do 3 podlaží vypadá jako rodinný (řadové domy),
  výš jako činžák (kanálové domy Amsterdamu mají 4–5 podlaží).
- Vzhled jsem okem neposuzovala (fotky fasád), jen pokrytí a shodu s OSM. BAG zůstává zapnutý (`?bag=0` vypne).
