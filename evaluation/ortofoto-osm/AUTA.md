# Auta u obruby z ortofota (19. 11. 2026)

Bára: „když tam stojí dost aut, musí to vychýlit histogram toho pásu oproti jízdnímu pruhu“.

## Pravda
MTVU podélné stání ve vozovce většinou nemá (Brno skoro vůbec), městská data o parkování jen v zónách, takže proti nim
detektor vypadá horší, než je (Mařákova v Brně: auta na snímku, v MTVU nic). Proto ruční značení: pásy ±3,5 m kolem
obruby odhadu (ČÚZK 12,5 cm), 125 stran místních ulic Prahy a Brna, kde volné pravidlo něco hlásí
(`auta/pasy.mjs`, `auta/priznaky.mjs`). Řada aut u obruby (aspoň dvě zaparkovaná, i kolmo za obrubou): 44 stran.
Štítky v `auta/stitky.json`.

## Co funguje
- Kolísání jasu podél ulice (dosavadní `carsSeen`): na označených pásech skoro stejné u aut i bez nich (stíny, stromy).
- Kolísání **sytosti barev** po metrech podél ulice (auta jsou barevná, mezery mezi nimi šedé) a pás není tmavý (stín)
  ani zelený (koruny): `satSd ≥ 10, tmavé ≤ 15 %, zelené ≤ 5 %`: 13 nalezených, 0 falešných (Praha 6/15, Brno 7/29).
  Najde tedy asi třetinu řad aut, ale skoro bez omylů. Prahy z 125 pásů, tedy hrozí přeučení.

## Regrese (`AUTA=1 node evaluation/ortofoto-osm/regrese.mjs`, jen místní ulice)
| | bez | s auty |
|---|---|---|
| Praha ČÚZK obruby medián, do 0,5 / 1 m | 1,00 · 34 / 51 % | 0,90 · 35 / 52 % |
| Praha ČÚZK stání nalezeno / navíc (proti MTVU) | 6 / 3 | 7 / 8 |
| Praha IPR stání navíc | 6 | 16 |
| Brno ČÚZK chodník medián, do 1 m | 1,05 · 49 % | 1,15 · 47 % |
| Brno 2025 chodník medián | 2,60 | 2,39 |

Smíšené (a „navíc“ proti MTVU, které stání nemá), proto vypnuté; zapne `?auta=1`. Dál: prahy pro jemná ortofota
(IPR 10 cm) zvlášť, pravda o stání z fotek z ulice (skill mereni-presnosti).
