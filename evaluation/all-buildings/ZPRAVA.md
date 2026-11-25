# Vzhled domu ze všech budov OSM (Bára 25. 11. 2026)

Dřív četl vzhled domu jen budovy OSM s podlažími nebo výškou, všechny jen v USA (`allBuildings`). Teď všude stejně
(`derive.js buildingAt`, `?off=vsedomy` staré chování), příznak je zrušený, **výjimka nezůstala žádná**. Test zastavěného
území čte dál jen budovy s podlažími nebo výškou.

Vzorek `sample.mjs`: náhodné domy ve městech univerzálního vzorku (pevné semínko), změněný = jiná kresba; registr budov
(ČR, SK, NL, FR, ES, EE…) má dál přednost, OSM je druhé. Fotka Mapillary, archy `sheets.mjs`, posuzovaly naslepo samostatní
agenti Sonnet (`POKYN.md`), `score.mjs`. Fotky v gitu nejsou.

## Kolik domů se mění
Domů se stejným nálezem OSM přibylo hodně (AT 88 → 172 ze 175), kresba se mění méně: AT 39/175, DE 15/111, BE 20/33, PL 24/149,
PT 34/117, CH 57/203, LT 15/60, IT 30/108, LU 60/126, SK 77/329, NL 26/97, FR 32/344, ES 15/213, **CZ 37/900**. Garáže a kůlny pod
řezem: 2–7 na stát, kreslí se jako garáž (jako dům jen DE 1, LU 1, PL 1).

## 1. kolo (153 domů, 13 států, bez nových pravidel)
| | nové lépe | staré lépe | stejně | nelze |
|---|---|---|---|---|
| AT | 3 | 3 | 4 | 2 |
| BE | 5 | 6 | 1 | 0 |
| CH | 8 | 2 | 0 | 1 |
| CZ | 3 | 0 | 6 | 1 |
| DE | 6 | 0 | 4 | 2 |
| FR | 1 | 3 | 7 | 1 |
| IT | 3 | 2 | 5 | 2 |
| LT | 3 | 5 | 2 | 2 |
| LU | 6 | 0 | 4 | 2 |
| NL | 5 | 1 | 2 | 4 |
| PL | 3 | 5 | 4 | 0 |
| PT | 6 | 3 | 1 | 2 |
| SK | 5 | 1 | 5 | 1 |
| **celkem** | **57** | **31** | 45 | 20 |

Správně 16 → 41, špatně 63 → 42. Prohry měly dvě společné příčiny:
- **Panelák jen z tvaru** (PL, LT): budova bez podlaží i druhu byla podle půdorysu panelák (nové 1 : 4). Pravidlo `abroadStyle`: kde
  se paneláky stavěly, tvar bloku sám panelák nedělá. Na západě (poválečný dům) tentýž odhad vyhrál (asi 9 : 1), zůstává.
- **Řadový dům bez podlaží ve Flandrech** (1 : 5) byl přízemní domek. Pravidlo `brickLook`: dům v řadě neznámých podlaží je
  cihlový městský dům.
Obě pravidla jsou společná, bez podmínky na stát.

## 2. kolo (72 nových domů, jiné semínko, s pravidly)
| | nové lépe | staré lépe | stejně | nelze |
|---|---|---|---|---|
| BE | 6 | 4 | 1 | 1 |
| DE | 7 | 3 | 1 | 1 |
| EE | 3 | 2 | 3 | 4 |
| FR | 3 | 1 | 7 | 1 |
| LT | 8 | 1 | 2 | 1 |
| PL | 5 | 2 | 4 | 1 |
| **celkem** | **32** | **13** | 18 | 9 |

Správně 5 → 16, špatně 34 → 21. Žádný stát neprohrává.

## Zbylé chyby
Řadové domy Valonska bez podlaží (`nizky` má výchozí jedno podlaží, skutečnost 2–3), obchody bez podlaží ve starém městě jako
hala (PT 0 : 2), historické úřady a hotely jako kancelář (nerozhodně). Rakousko je nerozhodné (3 : 3), druhé kolo tam nebylo.
