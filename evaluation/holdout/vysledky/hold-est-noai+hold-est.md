# Kontrolní sada: hold-map proti hold-est-noai, hold-est (2026-11-19)

Složení po metrech (stání počítané jako vozovka), za obrubami; vnější obruby ulice (+ = odhad uvnitř); chodník u stran s domem.

## hold-est-noai

| Město | řezů | složení | za obrubami | obruby do 0,5 m | do 1 m | dovnitř > 1 m | ven > 1 m | chodník do 1 m (stran) |
|---|---|---|---|---|---|---|---|---|
| praha (model se tu učil) | 107 | 68 % | 61 % | 43 % | 60 % | 32 % | 7 % | 31 % (74) |
| brno | 110 | 64 % | 56 % | 32 % | 47 % | 45 % | 8 % | 18 % (55) |
| plzen | 70 | 69 % | 63 % | 33 % | 53 % | 42 % | 5 % | 27 % (30) |
| berlin (model se tu učil) | 49 | 76 % | 77 % | 38 % | 48 % | 46 % | 6 % | 39 % (51) |
| hamburg (model se tu učil) | 43 | 73 % | 68 % | 27 % | 42 % | 44 % | 14 % | 36 % (45) |
| aachen | 50 | 67 % | 55 % | 37 % | 44 % | 51 % | 5 % | 33 % (43) |
| bratislava | 22 | 68 % | 62 % | 25 % | 50 % | 41 % | 9 % | 44 % (18) |
| presov | 32 | 65 % | 56 % | 22 % | 41 % | 50 % | 9 % | 14 % (22) |
| zilina | 29 | 70 % | 57 % | 33 % | 59 % | 38 % | 3 % | 33 % (12) |
| vše | 512 | 69 % | 62 % | 34 % | 50 % | 42 % | 7 % | 30 % (350) |

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

## hold-est proti hold-est-noai (párově, 95% interval z bootstrapu přes řezy)

| Skupina | řezů | složení | obruby do 1 m | řezů lépe / hůř (obruby) |
|---|---|---|---|---|
| vše | 512 | +6 [5, 7] p. b. | +20 [15, 22] p. b. | 298 / 111 |
| mimo města, kde se model učil | 313 | +6 [5, 7] p. b. | +19 [15, 25] p. b. | 177 / 72 |
| praha | 107 | +7 [4, 9] p. b. | +14 [7, 20] p. b. | 62 / 24 |
| brno | 110 | +8 [6, 10] p. b. | +27 [19, 34] p. b. | 71 / 18 |
| plzen | 70 | +5 [2, 8] p. b. | +19 [11, 29] p. b. | 35 / 17 |
| berlin | 49 | +6 [4, 8] p. b. | +34 [23, 44] p. b. | 33 / 5 |
| hamburg | 43 | +6 [4, 9] p. b. | +26 [12, 41] p. b. | 26 / 10 |
| aachen | 50 | +5 [2, 8] p. b. | +19 [6, 31] p. b. | 26 / 12 |
| bratislava | 22 | -1 [-5, 2] p. b. | -20 [-36, -2] p. b. | 7 / 12 |
| presov | 32 | +8 [4, 12] p. b. | +23 [11, 36] p. b. | 23 / 4 |
| zilina | 29 | +5 [0, 9] p. b. | +17 [3, 33] p. b. | 15 / 9 |

