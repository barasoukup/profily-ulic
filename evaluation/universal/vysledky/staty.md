Výsledky univerzálního měření, přeměřené 24. 11. 2026 jednou metodou pro všechny státy (strana bez fasády jen po okraj
ulice, body na `service=driveway` / `parking_aisle` / `drive-through` vynechané všude; profily ze současného kódu,
`data/app-zprepocet.json`; CZ a PL znovu po opravě čtení DTM krajů a návratu ortofota Geoportalu,
`data/app-zzzprepocet-jvf.json`; CZ potřetí 25. 11. s doplněním kolem mapy povrchů i v Česku, `data/app-zzzzprepocet-mapfill.json`,
`../mapfill-cz/ZPRAVA.md`). `node evaluation/universal/score-states.mjs`. Výklad, čísla před a po a výhrady (FI a DK
posuzoval Opus) v `ZPRAVA.md`.

| stát | řezů | složení stejné | shoda složení | pruhy stejně | šířka uličního prostoru do 1 / 2 m | nejčastější rozdíly (aplikace proti posuzovateli) |
|---|---|---|---|---|---|---|
| CZ | 30 | 27 % | 58 % | 30 % | 30 % / 33 % | navíc chodnik 10×, navíc pruh 6×, chybí stani 6×, navíc zelen 5×, navíc delici 4×, chybí zelen 4× |
| SK | 12 | 67 % | 84 % | 75 % | 33 % / 50 % | chybí delici 2×, chybí pruh 2×, navíc chodnik 2×, chybí chodnik 1×, chybí zelen 1× |
| AT | 29 | 17 % | 61 % | 38 % | 28 % / 45 % | navíc stani 7×, chybí stani 5×, navíc cyklostezka 4×, navíc chodnik 4×, navíc cyklopruh 3×, stani→pruh 3× |
| DE | 32 | 13 % | 56 % | 53 % | 13 % / 34 % | navíc chodnik 10×, chybí stani 7×, chybí chodnik 7×, navíc pruh 6×, navíc stani 5×, chybí pruh 4× |
| CH | 17 | 24 % | 63 % | 47 % | 35 % / 41 % | navíc chodnik 5×, chybí stani 4×, chybí pruh 3×, navíc stani 2×, chybí zelen 2×, pruh→tramvaj 1× |
| LI | 6 | 33 % | 69 % | 50 % | 50 % / 67 % | chybí zelen 2×, navíc delici 2×, pruh→chodnik 1×, chybí delici 1×, cyklopruh→pruh 1×, navíc pruh 1× |
| NL | 32 | 25 % | 58 % | 50 % | 38 % / 53 % | navíc chodnik 16×, navíc cyklostezka 12×, navíc zelen 9×, navíc stani 7×, chybí stani 5×, chodnik→pruh 4× |
| BE | 33 | 9 % | 48 % | 36 % | 18 % / 33 % | chybí stani 10×, navíc chodnik 9×, chybí chodnik 8×, chybí pruh 5×, chodnik→pruh 5×, pruh→chodnik 4× |
| LU | 12 | 25 % | 53 % | 42 % | 17 % / 33 % | chodnik→cyklostezka 4×, cyklostezka→pruh 3×, chybí delici 2×, tramvaj→stani 1×, zelen→delici 1×, chybí pruh 1× |
| PL | 22 | 18 % | 63 % | 32 % | 23 % / 36 % | chybí chodnik 7×, chybí pruh 6×, chybí stani 4×, chybí delici 4×, navíc delici 2×, navíc tramvaj 2× |
| FR | 25 | 4 % | 60 % | 60 % | 28 % / 48 % | chybí chodnik 9×, navíc stani 8×, navíc chodnik 5×, chybí stani 4×, navíc zelen 3×, pruh→chodnik 2× |
| ES | 23 | 13 % | 55 % | 48 % | 17 % / 26 % | chybí chodnik 9×, chybí stani 6×, chodnik→pruh 4×, stani→zelen 3×, navíc bus 3×, navíc stani 3× |
| PT | 28 | 25 % | 64 % | 64 % | 21 % / 46 % | chybí chodnik 14×, chybí stani 11×, navíc zelen 3×, navíc pruh 3×, stani→pruh 2×, chybí zelen 2× |
| CY | 11 | 18 % | 55 % | 82 % | 0 % / 18 % | chybí chodnik 8×, chybí stani 5×, chybí zelen 3×, chybí cyklostezka 2×, navíc chodnik 1×, navíc zelen 1× |
| MT | 8 | 13 % | 55 % | 38 % | 50 % / 63 % | chybí chodnik 4×, chybí stani 3×, navíc chodnik 2×, pruh→zelen 1×, navíc zelen 1×, chodnik→pruh 1× |
| IT | 6 | 17 % | 56 % | 67 % | 0 % / 17 % | chybí stani 3×, chybí delici 2×, chybí pruh 2×, chybí chodnik 2×, chybí bus 1×, chybí cyklostezka 1× |
| EE | 12 | 8 % | 45 % | 33 % | 17 % / 33 % | navíc zelen 4×, navíc pruh 4×, chybí chodnik 3×, navíc delici 3×, navíc chodnik 2×, pruh→chodnik 2× |
| SI | 8 | 13 % | 56 % | 63 % | 13 % / 38 % | navíc chodnik 2×, navíc stani 2×, navíc cyklostezka 2×, chybí chodnik 2×, navíc cyklopruh 1×, chybí pruh 1× |
| LT | 10 | 30 % | 75 % | 60 % | 30 % / 60 % | navíc chodnik 4×, chybí stani 3×, stani→zelen 1×, navíc zelen 1×, stani→chodnik 1× |
| FI | 22 | 14 % | 52 % | 45 % | 14 % / 23 % | navíc cyklostezka 5×, navíc chodnik 5×, zelen→chodnik 4×, chybí stani 3×, pruh→chodnik 3×, chybí pruh 2× |
| DK | 24 | 17 % | 58 % | 50 % | 33 % / 50 % | chybí chodnik 7×, chybí stani 6×, navíc cyklostezka 5×, chybí delici 4×, chybí pruh 4×, cyklopruh→cyklostezka 4× |
| FI s ortofotem | 13 | 15 % | 51 % | 46 % | 23 % / 31 % | navíc chodnik 4×, navíc cyklostezka 2×, chybí zelen 2×, zelen→chodnik 2×, pruh→chodnik 2×, stani→cyklostezka 2× |
| FI bez ortofota | 9 | 11 % | 54 % | 44 % | 0 % / 11 % | navíc cyklostezka 3×, chybí stani 2×, zelen→chodnik 2×, bus→delici 1×, tramvaj→pruh 1×, pruh→chodnik 1× |
| DK Kodaň | 15 | 20 % | 60 % | 60 % | 40 % / 60 % | chybí stani 5×, chybí pruh 3×, chybí chodnik 3×, chybí cyklostezka 2×, chybí cyklopruh 2×, chybí delici 2× |
| DK zbytek | 9 | 11 % | 57 % | 33 % | 22 % / 33 % | chybí chodnik 4×, cyklopruh→cyklostezka 3×, navíc cyklostezka 3×, chybí delici 2×, chybí stani 1×, chybí pruh 1× |

Před → po (oficiální → nová pravidla se starými profily → nové profily):

| stát | řezů před → po | shoda složení: oficiální → nová pravidla → nové profily | pruhy stejně | šířka do 1 / 2 m | nejčastější rozdíly po (aplikace proti posuzovateli) |
|---|---|---|---|---|---|
| CZ | 32 → 30 | 56 % → 60 % → **58 %** | 28 % → 30 % | 25 % / 31 % → 30 % / 33 % | navíc chodnik 10×, navíc pruh 6×, chybí stani 6×, navíc zelen 5× |
| SK | 15 → 12 | 60 % → 71 % → **84 %** | 60 % → 75 % | 27 % / 53 % → 33 % / 50 % | chybí delici 2×, chybí pruh 2×, navíc chodnik 2×, chybí chodnik 1× |
| AT | 33 → 29 | 58 % → 60 % → **61 %** | 30 % → 38 % | 18 % / 30 % → 28 % / 45 % | navíc stani 7×, chybí stani 5×, navíc cyklostezka 4×, navíc chodnik 4× |
| DE | 34 → 32 | 61 % → 62 % → **56 %** | 56 % → 53 % | 15 % / 35 % → 13 % / 34 % | navíc chodnik 10×, chybí stani 7×, chybí chodnik 7×, navíc pruh 6× |
| CH | 18 → 17 | 59 % → 62 % → **63 %** | 44 % → 47 % | 28 % / 28 % → 35 % / 41 % | navíc chodnik 5×, chybí stani 4×, chybí pruh 3×, navíc stani 2× |
| LI | 6 → 6 | 69 % → 69 % → **69 %** | 50 % → 50 % | 17 % / 33 % → 50 % / 67 % | chybí zelen 2×, navíc delici 2×, pruh→chodnik 1×, chybí delici 1× |
| NL | 32 → 32 | 52 % → 58 % → **58 %** | 53 % → 50 % | 31 % / 41 % → 38 % / 53 % | navíc chodnik 16×, navíc cyklostezka 12×, navíc zelen 9×, navíc stani 7× |
| BE | 34 → 33 | 52 % → 51 % → **48 %** | 38 % → 36 % | 15 % / 26 % → 18 % / 33 % | chybí stani 10×, navíc chodnik 9×, chybí chodnik 8×, chybí pruh 5× |
| LU | 12 → 12 | 53 % → 55 % → **53 %** | 50 % → 42 % | 25 % / 33 % → 17 % / 33 % | chodnik→cyklostezka 4×, cyklostezka→pruh 3×, chybí delici 2×, tramvaj→stani 1× |
| PL | 22 → 22 | 67 % → 69 % → **63 %** | 45 % → 32 % | 18 % / 32 % → 23 % / 36 % | chybí chodnik 7×, chybí pruh 6×, chybí stani 4×, chybí delici 4× |
| FR | 25 → 25 | 57 % → 57 % → **60 %** | 60 % → 60 % | 28 % / 48 % → 28 % / 48 % | chybí chodnik 9×, navíc stani 8×, navíc chodnik 5×, chybí stani 4× |
| ES | 23 → 23 | 57 % → 55 % → **55 %** | 52 % → 48 % | 9 % / 26 % → 17 % / 26 % | chybí chodnik 9×, chybí stani 6×, chodnik→pruh 4×, stani→zelen 3× |
| PT | 29 → 28 | 63 % → 67 % → **64 %** | 62 % → 64 % | 34 % / 55 % → 21 % / 46 % | chybí chodnik 14×, chybí stani 11×, navíc zelen 3×, navíc pruh 3× |
| CY | 11 → 11 | 56 % → 53 % → **55 %** | 91 % → 82 % | 9 % / 27 % → 0 % / 18 % | chybí chodnik 8×, chybí stani 5×, chybí zelen 3×, chybí cyklostezka 2× |
| MT | 8 → 8 | 55 % → 55 % → **55 %** | 38 % → 38 % | 38 % / 63 % → 50 % / 63 % | chybí chodnik 4×, chybí stani 3×, navíc chodnik 2×, pruh→zelen 1× |
| IT | 6 → 6 | 56 % → 56 % → **56 %** | 50 % → 67 % | 17 % / 33 % → 0 % / 17 % | chybí stani 3×, chybí delici 2×, chybí pruh 2×, chybí chodnik 2× |
| EE | 12 → 12 | 51 % → 43 % → **45 %** | 33 % → 33 % | 8 % / 25 % → 17 % / 33 % | navíc zelen 4×, navíc pruh 4×, chybí chodnik 3×, navíc delici 3× |
| SI | 9 → 8 | 48 % → 58 % → **56 %** | 78 % → 63 % | 11 % / 33 % → 13 % / 38 % | navíc chodnik 2×, navíc stani 2×, navíc cyklostezka 2×, chybí chodnik 2× |
| LT | 10 → 10 | 56 % → 50 % → **75 %** | 60 % → 60 % | 20 % / 30 % → 30 % / 60 % | navíc chodnik 4×, chybí stani 3×, stani→zelen 1×, navíc zelen 1× |
| FI | 22 → 22 | — → 54 % → **52 %** | — → 45 % | — → 14 % / 23 % | navíc cyklostezka 5×, navíc chodnik 5×, zelen→chodnik 4×, chybí stani 3× |
| DK | 24 → 24 | — → 57 % → **58 %** | — → 50 % | — → 33 % / 50 % | chybí chodnik 7×, chybí stani 6×, navíc cyklostezka 5×, chybí delici 4× |
| FI s ortofotem | 13 → 13 | — → 54 % → **51 %** | — → 46 % | — → 23 % / 31 % | navíc chodnik 4×, navíc cyklostezka 2×, chybí zelen 2×, zelen→chodnik 2× |
| FI bez ortofota | 9 → 9 | — → 54 % → **54 %** | — → 44 % | — → 0 % / 11 % | navíc cyklostezka 3×, chybí stani 2×, zelen→chodnik 2×, bus→delici 1× |
| DK Kodaň | 15 → 15 | — → 58 % → **60 %** | — → 60 % | — → 40 % / 60 % | chybí stani 5×, chybí pruh 3×, chybí chodnik 3×, chybí cyklostezka 2× |
| DK zbytek | 9 → 9 | — → 57 % → **57 %** | — → 33 % | — → 22 % / 33 % | chybí chodnik 4×, cyklopruh→cyklostezka 3×, navíc cyklostezka 3×, chybí delici 2× |
