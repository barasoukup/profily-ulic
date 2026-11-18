# Kde odhad z ortofota a OSM systematicky chybuje (2026-11-18)

Odhad tak, jak ho dělá aplikace (`?mapa=0`), proti MTVU podél řezu; ortofoto cuzk12. Skript `evaluation/ortofoto-osm/chyby.mjs`.
Odkazy: **odhad** = jen ortofoto a OSM (`?mapa=0`), **mapa** = jak aplikace řez kreslí z technické mapy (server na 5293).

## brno (94 řezů)

Metry podél řezů: řádek = MTVU, sloupec = odhad (budovy vynechané).

| MTVU \ odhad | vozovka | stání | chodník | zeleň | tram. těleso | jiné | neurčeno | správně |
|---|---|---|---|---|---|---|---|---|
| **vozovka** | **749** | 12 | 56 | 45 | 0 | 20 | 79 | 78 % |
| **stání** | 30 | **33** | 29 | 8 | 0 | 7 | 20 | 26 % |
| **chodník** | 23 | 2 | **195** | 48 | 0 | 20 | 33 | 61 % |
| **zeleň** | 15 | 0 | 60 | **162** | 0 | 9 | 90 | 48 % |
| **tram. těleso** | 23 | 0 | 1 | 0 | **0** | 0 | 7 | 0 % |
| **jiné** | 2 | 0 | 36 | 16 | 0 | **13** | 10 | 17 % |

| Chyba | řezů | |
|---|---|---|
| krajnice v odhadu (m celkem) | 12 z 94 | MTVU profil má krajnici v 19 řezech |
| krajnice 1,5 m a víc | 10 z 94 |  |
| víc pruhů než profil z MTVU | 11 z 94 |  |
| méně pruhů | 19 z 94 |  |
| jiný počet vozovek | 37 z 94 |  |
| vozovka o 1,5 m a víc širší (m) | 12 z 94 |  |
| vozovka o 1,5 m a víc užší (m) | 35 z 94 |  |
| Neurčeno 1 m a víc (m) | 55 z 94 |  |
| chodník o 1,5 m a víc širší (m) | 16 z 94 |  |
| chodník o 1,5 m a víc užší (m) | 6 z 94 |  |
| stání navíc | 4 z 94 |  |
| stání chybí | 11 z 94 |  |

### krajnice v odhadu (m celkem) (12)

- Stará dálnice (31): 4.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.214880,16.521748,178,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.214880,16.521748,178,22.0,22.0)
- Makovského náměstí (40): 3.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.216846,16.579001,135,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.216846,16.579001,135,22.0,22.0)
- Otakara Ševčíka (11): 3.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.194130,16.646793,165,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.194130,16.646793,165,22.0,22.0)
- Svatopetrská (14): 3.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.175511,16.621972,168,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.175511,16.621972,168,22.0,22.0)
- Gajdošova (10): 3.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.198386,16.645822,-13,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.198386,16.645822,-13,22.0,22.0)
- VMO Dobrovského (1): 2.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.220002,16.609398,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.220002,16.609398,84,22.0,22.0)
- Stará dálnice (25): 2.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.205619,16.519792,-162,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.205619,16.519792,-162,22.0,22.0)
- Holzova (51): 2.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.194731,16.696983,-3,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.194731,16.696983,-3,22.0,22.0)
- ? (23): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.226994,16.519007,-124,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.226994,16.519007,-124,22.0,22.0)
- Měšťanská (72): 1.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.151222,16.662219,-98,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.151222,16.662219,-98,22.0,22.0)
- Vzhledná (78): 1.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.176501,16.526067,116,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.176501,16.526067,116,22.0,22.0)
- Bubeníčkova (39): 0.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.201616,16.642178,-118,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.201616,16.642178,-118,22.0,22.0)

### krajnice 1,5 m a víc (10)

- Stará dálnice (31): 4.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.214880,16.521748,178,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.214880,16.521748,178,22.0,22.0)
- Makovského náměstí (40): 3.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.216846,16.579001,135,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.216846,16.579001,135,22.0,22.0)
- Otakara Ševčíka (11): 3.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.194130,16.646793,165,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.194130,16.646793,165,22.0,22.0)
- Svatopetrská (14): 3.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.175511,16.621972,168,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.175511,16.621972,168,22.0,22.0)
- Gajdošova (10): 3.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.198386,16.645822,-13,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.198386,16.645822,-13,22.0,22.0)
- VMO Dobrovského (1): 2.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.220002,16.609398,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.220002,16.609398,84,22.0,22.0)
- Stará dálnice (25): 2.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.205619,16.519792,-162,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.205619,16.519792,-162,22.0,22.0)
- Holzova (51): 2.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.194731,16.696983,-3,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.194731,16.696983,-3,22.0,22.0)
- ? (23): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.226994,16.519007,-124,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.226994,16.519007,-124,22.0,22.0)
- Měšťanská (72): 1.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.151222,16.662219,-98,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.151222,16.662219,-98,22.0,22.0)

### víc pruhů než profil z MTVU (11)

- Jana Babáka (48): 4 místo 2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.214170,16.590304,157,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.214170,16.590304,157,22.0,22.0)
- Hybešova (49): 3 místo 2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.189020,16.599117,-134,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.189020,16.599117,-134,22.0,22.0)
- Skalní (52): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.181085,16.531771,178,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.181085,16.531771,178,22.0,22.0)
- U vodárny (55): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.223043,16.577796,95,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.223043,16.577796,95,22.0,22.0)
- Přehradní (58): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.232705,16.522186,81,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.232705,16.522186,81,22.0,22.0)
- Dukelská třída (60): 3 místo 2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.213195,16.635562,33,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.213195,16.635562,33,22.0,22.0)
- Bohuslava Martinů (63): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.200560,16.572235,-28,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.200560,16.572235,-28,22.0,22.0)
- Ulrychova (70): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.224102,16.551758,-67,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.224102,16.551758,-67,22.0,22.0)
- Fügnerova (74): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.218595,16.625583,-69,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.218595,16.625583,-69,22.0,22.0)
- Mlaty (84): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.176684,16.530777,128,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.176684,16.530777,128,22.0,22.0)
- Jasanová (100): 1 místo 0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.205202,16.555225,-62,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.205202,16.555225,-62,22.0,22.0)

### méně pruhů (19)

- VMO Dobrovského (1): 1 místo 5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.220002,16.609398,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.220002,16.609398,84,22.0,22.0)
- ? (2): 3 místo 6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.225520,16.600055,-21,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.225520,16.600055,-21,22.0,22.0)
- ? (3): 5 místo 6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.263168,16.575021,-7,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.263168,16.575021,-7,22.0,22.0)
- ? (4): 4 místo 6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.187131,16.648338,9,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.187131,16.648338,9,22.0,22.0)
- Heršpická (7): 5 místo 6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.182754,16.604223,-167,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.182754,16.604223,-167,22.0,22.0)
- Gajdošova (10): 3 místo 6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.198386,16.645822,-13,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.198386,16.645822,-13,22.0,22.0)
- Otakara Ševčíka (11): 3 místo 5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.194130,16.646793,165,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.194130,16.646793,165,22.0,22.0)
- Svatopetrská (12): 4 místo 5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.179035,16.621669,-2,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.179035,16.621669,-2,22.0,22.0)
- Heršpická (13): 7 místo 8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.178358,16.603798,4,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.178358,16.603798,4,22.0,22.0)
- Svatopetrská (14): 3 místo 5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.175511,16.621972,168,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.175511,16.621972,168,22.0,22.0)
- Heršpická (16): 5 místo 6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.174962,16.602559,-166,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.174962,16.602559,-166,22.0,22.0)
- Zvonařka (20): 4 místo 5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.188173,16.623220,76,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.188173,16.623220,76,22.0,22.0)

### jiný počet vozovek (37)

- VMO Dobrovského (1): 1 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.220002,16.609398,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.220002,16.609398,84,22.0,22.0)
- ? (2): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.225520,16.600055,-21,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.225520,16.600055,-21,22.0,22.0)
- ? (3): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.263168,16.575021,-7,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.263168,16.575021,-7,22.0,22.0)
- ? (4): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.187131,16.648338,9,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.187131,16.648338,9,22.0,22.0)
- ? (6): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.266264,16.575157,-172,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.266264,16.575157,-172,22.0,22.0)
- Gajdošova (10): 2 místo 4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.198386,16.645822,-13,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.198386,16.645822,-13,22.0,22.0)
- Otakara Ševčíka (11): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.194130,16.646793,165,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.194130,16.646793,165,22.0,22.0)
- Svatopetrská (12): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.179035,16.621669,-2,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.179035,16.621669,-2,22.0,22.0)
- Heršpická (13): 2 místo 4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.178358,16.603798,4,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.178358,16.603798,4,22.0,22.0)
- Olomoucká (15): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.189407,16.637379,98,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.189407,16.637379,98,22.0,22.0)
- Heršpická (16): 2 místo 6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.174962,16.602559,-166,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.174962,16.602559,-166,22.0,22.0)
- Dornych (17): 1 místo 2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.184248,16.622229,158,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.184248,16.622229,158,22.0,22.0)

### vozovka o 1,5 m a víc širší (m) (12)

- Jana Babáka (48): 9.4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.214170,16.590304,157,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.214170,16.590304,157,22.0,22.0)
- Dukelská třída (60): 8.8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.213195,16.635562,33,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.213195,16.635562,33,22.0,22.0)
- Hybešova (49): 8.4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.189020,16.599117,-134,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.189020,16.599117,-134,22.0,22.0)
- Jedovnická (26): 4.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.199509,16.665877,-172,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.199509,16.665877,-172,22.0,22.0)
- Holzova (51): 3.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.194731,16.696983,-3,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.194731,16.696983,-3,22.0,22.0)
- Šimáčkova (36): 3.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.211995,16.698756,23,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.211995,16.698756,23,22.0,22.0)
- Mlaty (84): 3.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.176684,16.530777,128,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.176684,16.530777,128,22.0,22.0)
- Heršpická (13): 2.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.178358,16.603798,4,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.178358,16.603798,4,22.0,22.0)
- Lomená (82): 2.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.173088,16.625992,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.173088,16.625992,84,22.0,22.0)
- Makovského náměstí (40): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.216846,16.579001,135,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.216846,16.579001,135,22.0,22.0)
- Bartolomějská (85): 1.8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.202995,16.490710,-38,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.202995,16.490710,-38,22.0,22.0)
- Přehradní (58): 1.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.232705,16.522186,81,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.232705,16.522186,81,22.0,22.0)

### vozovka o 1,5 m a víc užší (m) (35)

- Jasanová (100): 12.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.205202,16.555225,-62,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.205202,16.555225,-62,22.0,22.0)
- Dunajská (76): 10.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.169072,16.561079,173,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.169072,16.561079,173,22.0,22.0)
- Poříčí (19): 8.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.185876,16.589535,64,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.185876,16.589535,64,22.0,22.0)
- Řečkovická (47): 7.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.260298,16.574640,-74,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.260298,16.574640,-74,22.0,22.0)
- Skácelova (42): 7.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.222183,16.587725,-112,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.222183,16.587725,-112,22.0,22.0)
- Stará dálnice (31): 6.4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.214880,16.521748,178,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.214880,16.521748,178,22.0,22.0)
- Kohoutova (75): 6.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.216616,16.631475,105,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.216616,16.631475,105,22.0,22.0)
- VMO Dobrovského (1): 6.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.220002,16.609398,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.220002,16.609398,84,22.0,22.0)
- Charbulova (43): 5.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.188409,16.632573,-34,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.188409,16.632573,-34,22.0,22.0)
- Bellova (64): 5.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.193806,16.528691,1,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.193806,16.528691,1,22.0,22.0)
- ? (6): 5.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.266264,16.575157,-172,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.266264,16.575157,-172,22.0,22.0)
- Uhelná (33): 5.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.187235,16.609414,20,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.187235,16.609414,20,22.0,22.0)

### Neurčeno 1 m a víc (m) (55)

- Svatopetrská (14): 44.8 (uvnitř 0.0, vně 44.8; MTVU: chodník 18.4, tram. těleso 11.3, zeleň 10.5, vozovka 4.0, jiné 0.6) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.175511,16.621972,168,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.175511,16.621972,168,22.0,22.0)
- Srnčí (62): 35.2 (uvnitř 0.0, vně 35.2; MTVU: jiné 27.7, budova 6.6, chodník 0.5, zeleň 0.4) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.204997,16.480362,-116,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.204997,16.480362,-116,22.0,22.0)
- VMO Dobrovského (1): 33.4 (uvnitř 0.0, vně 33.4; MTVU: vozovka 22.0, zeleň 11.4) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.220002,16.609398,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.220002,16.609398,84,22.0,22.0)
- Jasanová (100): 29.2 (uvnitř 0.0, vně 29.2; MTVU: stání 12.2, zeleň 6.8, budova 6.7, chodník 2.1, jiné 1.3, nic 0.1) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.205202,16.555225,-62,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.205202,16.555225,-62,22.0,22.0)
- Zvonařka (20): 24.3 (uvnitř 0.0, vně 24.3; MTVU: vozovka 9.2, budova 7.8, chodník 4.0, zeleň 3.2) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.188173,16.623220,76,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.188173,16.623220,76,22.0,22.0)
- Gajdošova (10): 21.0 (uvnitř 0.0, vně 21.0; MTVU: zeleň 9.5, chodník 5.2, jiné 5.0, vozovka 1.2) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.198386,16.645822,-13,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.198386,16.645822,-13,22.0,22.0)
- Svatopetrská (12): 20.7 (uvnitř 0.0, vně 20.7; MTVU: tram. těleso 7.4, vozovka 7.0, chodník 4.3, zeleň 1.1, jiné 0.7, budova 0.2) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.179035,16.621669,-2,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.179035,16.621669,-2,22.0,22.0)
- Mojžíšova (87): 18.9 (uvnitř 0.0, vně 18.9; MTVU: jiné 14.5, zeleň 2.8, budova 1.2, stání 0.5) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.228779,16.601419,47,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.228779,16.601419,47,22.0,22.0)
- Stará dálnice (25): 18.4 (uvnitř 0.0, vně 18.4; MTVU: zeleň 10.6, jiné 5.5, vozovka 2.3) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.205619,16.519792,-162,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.205619,16.519792,-162,22.0,22.0)
- Pellicova (61): 14.4 (uvnitř 0.0, vně 14.4; MTVU: zeleň 7.2, budova 6.1, jiné 1.2) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.196464,16.595308,3,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.196464,16.595308,3,22.0,22.0)
- ? (38): 13.3 (uvnitř 0.0, vně 13.3; MTVU: zeleň 7.8, jiné 5.2, vozovka 0.3) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.225634,16.703165,20,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.225634,16.703165,20,22.0,22.0)
- Uhelná (33): 12.9 (uvnitř 0.0, vně 12.9; MTVU: zeleň 7.3, stání 5.5, vozovka 0.1) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.187235,16.609414,20,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.187235,16.609414,20,22.0,22.0)

### chodník o 1,5 m a víc širší (m) (16)

- U luhu (90, strana B): 6.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.238813,16.529444,-105,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.238813,16.529444,-105,22.0,22.0)
- Skácelova (42, strana A): 5.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.222183,16.587725,-112,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.222183,16.587725,-112,22.0,22.0)
- Bohuslava Martinů (63, strana B): 4.8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.200560,16.572235,-28,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.200560,16.572235,-28,22.0,22.0)
- Bellova (64, strana B): 3.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.193806,16.528691,1,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.193806,16.528691,1,22.0,22.0)
- Helfertova (68, strana B): 3.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.206597,16.622960,88,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.206597,16.622960,88,22.0,22.0)
- Bellova (64, strana A): 3.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.193806,16.528691,1,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.193806,16.528691,1,22.0,22.0)
- Helfertova (68, strana A): 3.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.206597,16.622960,88,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.206597,16.622960,88,22.0,22.0)
- Charbulova (43, strana B): 3.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.188409,16.632573,-34,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.188409,16.632573,-34,22.0,22.0)
- Dunajská (76, strana B): 3.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.169072,16.561079,173,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.169072,16.561079,173,22.0,22.0)
- Karlova (32, strana B): 2.8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.213421,16.643729,13,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.213421,16.643729,13,22.0,22.0)
- Přístavní (59, strana B): 2.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.227363,16.524711,-43,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.227363,16.524711,-43,22.0,22.0)
- Lelekovická (86, strana A): 2.5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.273182,16.594142,10,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.273182,16.594142,10,22.0,22.0)

### chodník o 1,5 m a víc užší (m) (6)

- Elišky Krásnohorské (83, strana A): 7.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.185689,16.632670,149,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.185689,16.632670,149,22.0,22.0)
- Joštova (96, strana A): 4.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.197465,16.604738,77,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.197465,16.604738,77,22.0,22.0)
- Tuřanka (37, strana B): 4.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.173402,16.683129,-138,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.173402,16.683129,-138,22.0,22.0)
- Kamenice (35, strana A): 2.5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.177959,16.568618,-85,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.177959,16.568618,-85,22.0,22.0)
- Kamenice (35, strana B): 2.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.177959,16.568618,-85,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.177959,16.568618,-85,22.0,22.0)
- Heršpická (13, strana B): 1.8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.178358,16.603798,4,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.178358,16.603798,4,22.0,22.0)

### stání navíc (4)

- Pellicova (61, strana B) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.196464,16.595308,3,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.196464,16.595308,3,22.0,22.0)
- Rovná (66, strana B) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.180531,16.592347,-102,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.180531,16.592347,-102,22.0,22.0)
- Mařákova (69, strana A) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.201300,16.684982,-90,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.201300,16.684982,-90,22.0,22.0)
- Mařákova (69, strana B) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.201300,16.684982,-90,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.201300,16.684982,-90,22.0,22.0)

### stání chybí (11)

- Pionýrská (27, strana A) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.207879,16.605042,-112,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.207879,16.605042,-112,22.0,22.0)
- Charbulova (43, strana A) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.188409,16.632573,-34,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.188409,16.632573,-34,22.0,22.0)
- Charbulova (43, strana B) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.188409,16.632573,-34,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.188409,16.632573,-34,22.0,22.0)
- Pellicova (61, strana A) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.196464,16.595308,3,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.196464,16.595308,3,22.0,22.0)
- Bohuslava Martinů (63, strana A) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.200560,16.572235,-28,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.200560,16.572235,-28,22.0,22.0)
- Bohuslava Martinů (63, strana B) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.200560,16.572235,-28,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.200560,16.572235,-28,22.0,22.0)
- Helfertova (68, strana B) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.206597,16.622960,88,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.206597,16.622960,88,22.0,22.0)
- Kameníčkova (73, strana B) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.209408,16.581762,108,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.209408,16.581762,108,22.0,22.0)
- Dunajská (76, strana B) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.169072,16.561079,173,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.169072,16.561079,173,22.0,22.0)
- Joštova (96, strana B) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.197465,16.604738,77,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.197465,16.604738,77,22.0,22.0)
- Jasanová (100, strana B) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.205202,16.555225,-62,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.205202,16.555225,-62,22.0,22.0)

Neurčeno celkem: uvnitř ulice (mezi vozovkami) 0 m, vně 442 m; MTVU pod ním: zeleň 138 m, jiné 97 m, vozovka 89 m, chodník 51 m, budova 29 m, stání 20 m, tram. těleso 19 m, nic 0 m

