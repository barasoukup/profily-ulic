# Auta u obruby z ortofota (19. 11. 2026)

Bára: „když tam stojí dost aut, musí to vychýlit histogram toho pásu oproti jízdnímu pruhu“.

## Pravda
MTVU podélné stání ve vozovce většinou nemá (Brno skoro vůbec), městská data o parkování jen v zónách, takže proti nim
detektor vypadá horší, než je (Mařákova v Brně: auta na snímku, v MTVU nic). Proto ruční značení: pásy ±3,5 m kolem
obruby odhadu (ČÚZK 12,5 cm), 125 stran místních ulic Prahy a Brna, kde volné pravidlo něco hlásí
(`cars/strips.mjs`, `cars/features.mjs`). Řada aut u obruby (aspoň dvě zaparkovaná, i kolmo za obrubou): 44 stran.
Štítky v `cars/stitky.json`.

## Co funguje
- Kolísání jasu podél ulice (dosavadní `carsSeen`): na označených pásech skoro stejné u aut i bez nich (stíny, stromy).
- Kolísání **sytosti barev** po metrech podél ulice (auta jsou barevná, mezery mezi nimi šedé) a pás není tmavý (stín)
  ani zelený (koruny): `satSd ≥ 10, tmavé ≤ 15 %, zelené ≤ 5 %`: 13 nalezených, 0 falešných (Praha 6/15, Brno 7/29).
  Najde tedy asi třetinu řad aut, ale skoro bez omylů. Prahy z 125 pásů, tedy hrozí přeučení.

## Regrese (`AUTA=1 node evaluation/ortho-osm/regression.mjs`, jen místní ulice)
| | bez | s auty |
|---|---|---|
| Praha ČÚZK obruby medián, do 0,5 / 1 m | 1,00 · 34 / 51 % | 0,90 · 35 / 52 % |
| Praha ČÚZK stání nalezeno / navíc (proti MTVU) | 6 / 3 | 7 / 8 |
| Praha IPR stání navíc | 6 | 16 |
| Brno ČÚZK chodník medián, do 1 m | 1,05 · 49 % | 1,15 · 47 % |
| Brno 2025 chodník medián | 2,60 | 2,39 |

Smíšené (a „navíc“ proti MTVU, které stání nemá), proto vypnuté; zapne `?auta=1`. Dál: prahy pro jemná ortofota
(IPR 10 cm) zvlášť, pravda o stání z fotek z ulice (skill measure-accuracy).

## Krajnice, stání a detektor na nových stranách (20. 11. 2026)
Ručně označeno dalších 105 stran místních ulic a tertiary Prahy a Brna (`cars/stitky2.json`, na nich se nic neladilo;
s prvními 125 celkem 230 stran, řada aut u 61). `cars/shoulder.mjs`: odhad jako v aplikaci (pruhy z čar, pravidla pruhů).
- **Krajnice nejsou schovaná auta:** krajnice u obruby jen na 14 stranách, auta u 2 z nich (≥ 1,5 m: 9 a 2).
- **Stání v odhadu:** na 24 stranách, z toho 20 s auty (přesnost 83 %), ale z 61 stran s auty jen 20 (33 %). Zbylá
  auta: u obruby je v odhadu jízdní pruh (37 ze 41), OSM stání nemá; obruba leží na hraně řady aut a auta spadnou
  za ni (chodník 25, plocha 8). S AI (Brno) stejně: 12 z 37, navíc 6.
- **Detektor podle barev neplatí mimo vzorek, na kterém se ladil:** sada 1 (laděná) 9 ze 44 bez falešných, nová sada 2
  0 ze 17 a 2 falešně. Přeučený, jak varovala oponentura; zůstává vypnutý.
