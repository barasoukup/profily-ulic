# Kontrolní sada: hold-map proti hold-est, hold-est-cap (2026-11-19)

Složení po metrech (stání počítané jako vozovka), za obrubami; vnější obruby ulice (+ = odhad uvnitř); chodník u stran s domem.

## hold-est

| Město | řezů | složení | za obrubami | obruby do 0,5 m | do 1 m | dovnitř > 1 m | ven > 1 m | chodník do 1 m (stran) |
|---|---|---|---|---|---|---|---|---|
| praha (model se tu učil) | 107 | 75 % | 62 % | 52 % | 74 % | 14 % | 12 % | 47 % (74) |
| brno | 110 | 72 % | 59 % | 51 % | 73 % | 21 % | 6 % | 44 % (55) |
| plzen | 70 | 74 % | 60 % | 43 % | 72 % | 14 % | 14 % | 50 % (30) |
| berlin (model se tu učil) | 49 | 82 % | 80 % | 63 % | 82 % | 15 % | 3 % | 49 % (51) |
| hamburg (model se tu učil) | 43 | 79 % | 70 % | 51 % | 67 % | 16 % | 16 % | 47 % (45) |
| aachen | 50 | 72 % | 53 % | 38 % | 63 % | 26 % | 11 % | 30 % (43) |
| bratislava | 22 | 67 % | 53 % | 11 % | 30 % | 36 % | 34 % | 28 % (18) |
| presov | 32 | 73 % | 55 % | 41 % | 64 % | 25 % | 11 % | 5 % (22) |
| zilina | 29 | 75 % | 50 % | 47 % | 76 % | 10 % | 14 % | 42 % (12) |
| vše | 512 | 75 % | 62 % | 47 % | 70 % | 18 % | 11 % | 41 % (350) |

## hold-est-cap

| Město | řezů | složení | za obrubami | obruby do 0,5 m | do 1 m | dovnitř > 1 m | ven > 1 m | chodník do 1 m (stran) |
|---|---|---|---|---|---|---|---|---|
| praha (model se tu učil) | 107 | 75 % | 63 % | 52 % | 74 % | 14 % | 12 % | 50 % (74) |
| brno | 110 | 72 % | 58 % | 51 % | 73 % | 21 % | 6 % | 56 % (55) |
| plzen | 70 | 73 % | 57 % | 43 % | 72 % | 14 % | 14 % | 43 % (30) |
| berlin (model se tu učil) | 49 | 82 % | 79 % | 63 % | 82 % | 15 % | 3 % | 45 % (51) |
| hamburg (model se tu učil) | 43 | 80 % | 73 % | 51 % | 67 % | 16 % | 16 % | 58 % (45) |
| aachen | 50 | 72 % | 53 % | 38 % | 63 % | 26 % | 11 % | 53 % (43) |
| bratislava | 22 | 68 % | 55 % | 11 % | 30 % | 36 % | 34 % | 28 % (18) |
| presov | 32 | 75 % | 59 % | 41 % | 64 % | 25 % | 11 % | 27 % (22) |
| zilina | 29 | 75 % | 51 % | 47 % | 76 % | 10 % | 14 % | 33 % (12) |
| vše | 512 | 75 % | 62 % | 47 % | 70 % | 18 % | 11 % | 48 % (350) |

## hold-est-cap proti hold-est (párově, 95% interval z bootstrapu přes řezy)

| Skupina | řezů | složení | obruby do 1 m | chodník do 1 m | řezů lépe / hůř (obruby) |
|---|---|---|---|---|---|
| vše | 512 | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +7 [1, 12] p. b. | 0 / 0 |
| mimo města, kde se model učil | 313 | 0 [-1, 0] p. b. | +0 [0, 0] p. b. | +11 [5, 18] p. b. | 0 / 0 |
| praha | 107 | +0 [-1, 1] p. b. | +0 [0, 0] p. b. | +3 [-2, 10] p. b. | 0 / 0 |
| brno | 110 | -1 [-2, 1] p. b. | +0 [0, 0] p. b. | +13 [2, 25] p. b. | 0 / 0 |
| plzen | 70 | -1 [-2, 0] p. b. | +0 [0, 0] p. b. | -7 [-21, 6] p. b. | 0 / 0 |
| berlin | 49 | 0 [-1, 1] p. b. | +0 [0, 0] p. b. | -4 [-17, 12] p. b. | 0 / 0 |
| hamburg | 43 | +1 [0, 3] p. b. | +0 [0, 0] p. b. | +11 [-3, 27] p. b. | 0 / 0 |
| aachen | 50 | +0 [-1, 1] p. b. | +0 [0, 0] p. b. | +23 [9, 39] p. b. | 0 / 0 |
| bratislava | 22 | +1 [-1, 2] p. b. | +0 [0, 0] p. b. | +0 [-14, 18] p. b. | 0 / 0 |
| presov | 32 | +2 [0, 4] p. b. | +0 [0, 0] p. b. | +23 [7, 46] p. b. | 0 / 0 |
| zilina | 29 | +0 [-1, 2] p. b. | +0 [0, 0] p. b. | -8 [-33, 18] p. b. | 0 / 0 |

