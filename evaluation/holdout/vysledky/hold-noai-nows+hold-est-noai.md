# Kontrolní sada: hold-map proti hold-noai-nows, hold-est-noai (2026-11-19)

Složení po metrech (stání počítané jako vozovka), za obrubami; vnější obruby ulice (+ = odhad uvnitř); chodník u stran s domem.

## hold-noai-nows

| Město | řezů | složení | za obrubami | obruby do 0,5 m | do 1 m | dovnitř > 1 m | ven > 1 m | chodník do 1 m (stran) |
|---|---|---|---|---|---|---|---|---|
| praha (model se tu učil) | 107 | 68 % | 62 % | 43 % | 60 % | 32 % | 7 % | 28 % (74) |
| brno | 110 | 64 % | 56 % | 32 % | 47 % | 45 % | 8 % | 20 % (55) |
| plzen | 70 | 69 % | 63 % | 33 % | 53 % | 42 % | 5 % | 27 % (30) |
| berlin (model se tu učil) | 49 | 76 % | 77 % | 38 % | 48 % | 46 % | 6 % | 37 % (51) |
| hamburg (model se tu učil) | 43 | 72 % | 67 % | 27 % | 42 % | 44 % | 14 % | 36 % (45) |
| aachen | 50 | 67 % | 55 % | 37 % | 44 % | 51 % | 5 % | 33 % (43) |
| bratislava | 22 | 68 % | 62 % | 25 % | 50 % | 41 % | 9 % | 44 % (18) |
| presov | 32 | 65 % | 55 % | 22 % | 41 % | 50 % | 9 % | 9 % (22) |
| zilina | 29 | 70 % | 57 % | 33 % | 59 % | 38 % | 3 % | 33 % (12) |
| vše | 512 | 68 % | 62 % | 34 % | 50 % | 42 % | 7 % | 29 % (350) |

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

## hold-est-noai proti hold-noai-nows (párově, 95% interval z bootstrapu přes řezy)

| Skupina | řezů | složení | obruby do 1 m | chodník do 1 m | řezů lépe / hůř (obruby) |
|---|---|---|---|---|---|
| vše | 512 | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +1 [-1, 2] p. b. | 0 / 0 |
| mimo města, kde se model učil | 313 | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [-1, 1] p. b. | 0 / 0 |
| praha | 107 | 0 [-1, 0] p. b. | +0 [0, 0] p. b. | +3 [0, 7] p. b. | 0 / 0 |
| brno | 110 | +0 [0, 0] p. b. | +0 [0, 0] p. b. | -2 [-6, 0] p. b. | 0 / 0 |
| plzen | 70 | 0 [-1, 1] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | 0 / 0 |
| berlin | 49 | 0 [-1, 0] p. b. | +0 [0, 0] p. b. | +2 [0, 7] p. b. | 0 / 0 |
| hamburg | 43 | +1 [0, 3] p. b. | +0 [0, 0] p. b. | +0 [-7, 7] p. b. | 0 / 0 |
| aachen | 50 | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | 0 / 0 |
| bratislava | 22 | +0 [0, 0] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | 0 / 0 |
| presov | 32 | +0 [0, 1] p. b. | +0 [0, 0] p. b. | +5 [0, 15] p. b. | 0 / 0 |
| zilina | 29 | +0 [-1, 1] p. b. | +0 [0, 0] p. b. | +0 [0, 0] p. b. | 0 / 0 |

