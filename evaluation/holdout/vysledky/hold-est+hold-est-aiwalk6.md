# Kontrolní sada: hold-map proti hold-est, hold-est-aiwalk6 (2026-11-19)

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

## hold-est-aiwalk6

| Město | řezů | složení | za obrubami | obruby do 0,5 m | do 1 m | dovnitř > 1 m | ven > 1 m | chodník do 1 m (stran) |
|---|---|---|---|---|---|---|---|---|
| praha (model se tu učil) | 107 | 77 % | 66 % | 52 % | 74 % | 14 % | 12 % | 55 % (74) |
| brno | 110 | 74 % | 65 % | 51 % | 73 % | 21 % | 6 % | 51 % (55) |
| plzen | 70 | 75 % | 63 % | 43 % | 72 % | 14 % | 14 % | 50 % (30) |
| berlin (model se tu učil) | 49 | 81 % | 78 % | 63 % | 82 % | 15 % | 3 % | 53 % (51) |
| hamburg (model se tu učil) | 43 | 76 % | 64 % | 50 % | 67 % | 16 % | 16 % | 47 % (45) |
| aachen | 50 | 70 % | 51 % | 38 % | 63 % | 26 % | 11 % | 42 % (43) |
| bratislava | 22 | 67 % | 53 % | 9 % | 30 % | 36 % | 34 % | 44 % (18) |
| presov | 32 | 76 % | 61 % | 41 % | 64 % | 25 % | 11 % | 36 % (22) |
| zilina | 29 | 76 % | 55 % | 45 % | 76 % | 10 % | 14 % | 58 % (12) |
| vše | 512 | 75 % | 64 % | 47 % | 70 % | 19 % | 11 % | 49 % (350) |

## hold-est-aiwalk6 proti hold-est (párově, 95% interval z bootstrapu přes řezy)

| Skupina | řezů | složení | obruby do 1 m | chodník do 1 m | chodník po metrech (F1) | řezů lépe / hůř (obruby) |
|---|---|---|---|---|---|---|
| vše | 512 | +1 [0, 2] p. b. | 0 [0, 0] p. b. | +8 [4, 14] p. b. | +5 [3, 7] p. b. | 2 / 2 |
| mimo města, kde se model učil | 313 | +1 [0, 2] p. b. | 0 [-1, 0] p. b. | +12 [4, 18] p. b. | +6 [4, 8] p. b. | 0 / 2 |
| praha | 107 | +2 [0, 4] p. b. | +0 [0, 0] p. b. | +8 [0, 18] p. b. | +6 [2, 9] p. b. | 1 / 0 |
| brno | 110 | +2 [-1, 4] p. b. | 0 [-1, 0] p. b. | +7 [0, 17] p. b. | +7 [1, 11] p. b. | 0 / 0 |
| plzen | 70 | +1 [0, 3] p. b. | +0 [0, 0] p. b. | +0 [-12, 9] p. b. | +4 [1, 8] p. b. | 0 / 1 |
| berlin | 49 | -1 [-2, 0] p. b. | +0 [0, 0] p. b. | +4 [0, 9] p. b. | +1 [-1, 3] p. b. | 0 / 0 |
| hamburg | 43 | -3 [-6, 0] p. b. | +0 [0, 0] p. b. | +0 [-16, 16] p. b. | +0 [-3, 3] p. b. | 1 / 0 |
| aachen | 50 | -2 [-3, 0] p. b. | +0 [0, 0] p. b. | +12 [0, 25] p. b. | +5 [1, 9] p. b. | 0 / 0 |
| bratislava | 22 | +0 [-4, 4] p. b. | +0 [0, 0] p. b. | +17 [-12, 53] p. b. | +8 [3, 15] p. b. | 0 / 0 |
| presov | 32 | +3 [-1, 8] p. b. | +0 [0, 0] p. b. | +32 [16, 50] p. b. | +5 [-3, 14] p. b. | 0 / 0 |
| zilina | 29 | +1 [-4, 6] p. b. | +0 [0, 0] p. b. | +17 [-25, 55] p. b. | +7 [-3, 18] p. b. | 0 / 1 |

