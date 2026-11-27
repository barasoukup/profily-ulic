# Kontrolní sada: hold-map proti hold-est, hold-est-aiwalk (2026-11-19)

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

## hold-est-aiwalk

| Město | řezů | složení | za obrubami | obruby do 0,5 m | do 1 m | dovnitř > 1 m | ven > 1 m | chodník do 1 m (stran) |
|---|---|---|---|---|---|---|---|---|
| praha (model se tu učil) | 107 | 77 % | 68 % | 52 % | 74 % | 14 % | 12 % | 58 % (74) |
| brno | 110 | 74 % | 67 % | 51 % | 73 % | 21 % | 6 % | 51 % (55) |
| plzen | 70 | 77 % | 67 % | 43 % | 72 % | 14 % | 14 % | 53 % (30) |
| berlin (model se tu učil) | 49 | 77 % | 69 % | 63 % | 82 % | 15 % | 3 % | 47 % (51) |
| hamburg (model se tu učil) | 43 | 75 % | 64 % | 52 % | 67 % | 16 % | 16 % | 42 % (45) |
| aachen | 50 | 69 % | 47 % | 38 % | 63 % | 26 % | 11 % | 35 % (43) |
| bratislava | 22 | 68 % | 55 % | 11 % | 30 % | 36 % | 34 % | 50 % (18) |
| presov | 32 | 77 % | 62 % | 41 % | 64 % | 25 % | 11 % | 36 % (22) |
| zilina | 29 | 76 % | 55 % | 45 % | 76 % | 10 % | 14 % | 58 % (12) |
| vše | 512 | 75 % | 64 % | 47 % | 70 % | 19 % | 11 % | 48 % (350) |

## hold-est-aiwalk proti hold-est (párově, 95% interval z bootstrapu přes řezy)

| Skupina | řezů | složení | obruby do 1 m | chodník do 1 m | chodník po metrech (F1) | řezů lépe / hůř (obruby) |
|---|---|---|---|---|---|---|
| vše | 512 | +0 [0, 2] p. b. | 0 [0, 0] p. b. | +7 [4, 13] p. b. | +5 [3, 7] p. b. | 2 / 2 |
| mimo města, kde se model učil | 313 | +1 [1, 3] p. b. | 0 [-1, 0] p. b. | +11 [4, 18] p. b. | +7 [6, 10] p. b. | 0 / 2 |
| praha | 107 | +3 [1, 5] p. b. | +0 [0, 0] p. b. | +11 [3, 21] p. b. | +8 [4, 13] p. b. | 1 / 0 |
| brno | 110 | +2 [-1, 5] p. b. | 0 [-1, 0] p. b. | +7 [0, 17] p. b. | +7 [2, 12] p. b. | 0 / 0 |
| plzen | 70 | +3 [2, 5] p. b. | +0 [0, 0] p. b. | +3 [-9, 13] p. b. | +9 [5, 13] p. b. | 0 / 1 |
| berlin | 49 | -5 [-9, -2] p. b. | +0 [0, 0] p. b. | -2 [-11, 7] p. b. | -4 [-9, 1] p. b. | 0 / 0 |
| hamburg | 43 | -4 [-8, 0] p. b. | +0 [0, 0] p. b. | -4 [-21, 11] p. b. | -2 [-8, 4] p. b. | 1 / 0 |
| aachen | 50 | -3 [-6, -1] p. b. | +0 [0, 0] p. b. | +5 [-12, 20] p. b. | +3 [-1, 9] p. b. | 0 / 0 |
| bratislava | 22 | +1 [-4, 5] p. b. | +0 [0, 0] p. b. | +22 [-8, 59] p. b. | +9 [2, 17] p. b. | 0 / 0 |
| presov | 32 | +4 [-1, 9] p. b. | +0 [0, 0] p. b. | +32 [14, 53] p. b. | +7 [-2, 16] p. b. | 0 / 0 |
| zilina | 29 | +1 [-4, 6] p. b. | +0 [0, 0] p. b. | +17 [-25, 55] p. b. | +7 [-3, 18] p. b. | 0 / 1 |

