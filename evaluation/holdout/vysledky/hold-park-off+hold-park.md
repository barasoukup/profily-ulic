# Kontrolní sada: hold-map proti hold-park-off, hold-park (2026-11-20)

Složení po metrech (stání počítané jako vozovka), za obrubami; vnější obruby ulice (+ = odhad uvnitř); chodník u stran s domem.

## hold-park-off

| Město | řezů | složení | za obrubami | obruby do 0,5 m | do 1 m | dovnitř > 1 m | ven > 1 m | chodník do 1 m (stran) |
|---|---|---|---|---|---|---|---|---|
| praha (model se tu učil) | 107 | 79 % | 66 % | 52 % | 74 % | 14 % | 12 % | 55 % (74) |
| brno | 110 | 77 % | 65 % | 51 % | 73 % | 21 % | 6 % | 51 % (55) |
| plzen | 70 | 76 % | 63 % | 43 % | 72 % | 14 % | 14 % | 50 % (30) |
| berlin (model se tu učil) | 49 | 81 % | 78 % | 63 % | 82 % | 15 % | 3 % | 53 % (51) |
| hamburg (model se tu učil) | 43 | 76 % | 64 % | 50 % | 67 % | 16 % | 16 % | 47 % (45) |
| aachen | 50 | 70 % | 51 % | 38 % | 63 % | 26 % | 11 % | 42 % (43) |
| bratislava | 22 | 67 % | 53 % | 9 % | 30 % | 36 % | 34 % | 44 % (18) |
| presov | 32 | 76 % | 61 % | 41 % | 64 % | 25 % | 11 % | 36 % (22) |
| zilina | 29 | 76 % | 55 % | 45 % | 76 % | 10 % | 14 % | 58 % (12) |
| vše | 512 | 76 % | 64 % | 47 % | 70 % | 19 % | 11 % | 49 % (350) |

## hold-park

| Město | řezů | složení | za obrubami | obruby do 0,5 m | do 1 m | dovnitř > 1 m | ven > 1 m | chodník do 1 m (stran) |
|---|---|---|---|---|---|---|---|---|
| praha (model se tu učil) | 107 | 79 % | 66 % | 52 % | 74 % | 14 % | 12 % | 55 % (74) |
| brno | 110 | 77 % | 65 % | 51 % | 73 % | 21 % | 6 % | 51 % (55) |
| plzen | 70 | 76 % | 62 % | 43 % | 71 % | 14 % | 15 % | 47 % (30) |
| berlin (model se tu učil) | 49 | 81 % | 78 % | 63 % | 82 % | 15 % | 3 % | 53 % (51) |
| hamburg (model se tu učil) | 43 | 76 % | 64 % | 50 % | 67 % | 16 % | 16 % | 47 % (45) |
| aachen | 50 | 70 % | 51 % | 38 % | 63 % | 26 % | 11 % | 42 % (43) |
| bratislava | 22 | 68 % | 53 % | 11 % | 32 % | 34 % | 34 % | 44 % (18) |
| presov | 32 | 76 % | 61 % | 41 % | 63 % | 25 % | 13 % | 36 % (22) |
| zilina | 29 | 76 % | 55 % | 45 % | 76 % | 10 % | 14 % | 58 % (12) |
| vše | 512 | 76 % | 64 % | 47 % | 70 % | 18 % | 12 % | 49 % (350) |

## hold-park proti hold-park-off (párově, 95% interval z bootstrapu přes řezy)

| Skupina | řezů | složení | obruby do 1 m | chodník do 1 m | chodník po metrech (F1) | řezů lépe / hůř (obruby) |
|---|---|---|---|---|---|---|
| vše | 512 | +0 [0, 0] p. b. | 0 [0, 0] p. b. | 0 [-1, 0] p. b. | 0 [0, 0] p. b. | 2 / 3 |
| mimo města, kde se model učil | 313 | +0 [0, 0] p. b. | 0 [-1, 0] p. b. | -1 [-2, 0] p. b. | 0 [0, 0] p. b. | 2 / 3 |
| praha | 107 | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | 0 / 0 |
| brno | 110 | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | 1 / 0 |
| plzen | 70 | 0 [0, 0] p. b. | -1 [-4, 0] p. b. | -3 [-12, 0] p. b. | -1 [-1, 0] p. b. | 0 / 2 |
| berlin | 49 | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | 0 / 0 |
| hamburg | 43 | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | 0 / 0 |
| aachen | 50 | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | 0 / 0 |
| bratislava | 22 | +0 [0, 2] p. b. | +2 [0, 7] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | 1 / 0 |
| presov | 32 | +0 [0, 0] p. b. | -2 [-5, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | 0 / 1 |
| zilina | 29 | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | 0 / 0 |

