# Kde odhad z ortofota a OSM systematicky chybuje (2026-11-18)

Odhad tak, jak ho dělá aplikace (`?mapa=0`), proti MTVU podél řezu; ortofoto cuzk12. Skript `evaluation/ortofoto-osm/chyby.mjs`.
Odkazy: **odhad** = jen ortofoto a OSM (`?mapa=0`), **mapa** = jak aplikace řez kreslí z technické mapy (server na 5293).

## praha (87 řezů)

Metry podél řezů: řádek = MTVU, sloupec = odhad (budovy vynechané).

| MTVU \ odhad | vozovka | stání | chodník | zeleň | tram. těleso | jiné | neurčeno | správně |
|---|---|---|---|---|---|---|---|---|
| **vozovka** | **669** | 7 | 64 | 6 | 46 | 38 | 162 | 67 % |
| **stání** | 7 | **19** | 19 | 7 | 0 | 1 | 2 | 34 % |
| **chodník** | 11 | 0 | **190** | 18 | 0 | 14 | 43 | 69 % |
| **zeleň** | 19 | 1 | 40 | **34** | 0 | 31 | 113 | 14 % |
| **tram. těleso** | 1 | 0 | 0 | 0 | **27** | 2 | 0 | 89 % |
| **jiné** | 14 | 0 | 20 | 6 | 0 | **9** | 19 | 13 % |

| Chyba | řezů | |
|---|---|---|
| krajnice v odhadu (m celkem) | 14 z 87 | MTVU profil má krajnici v 20 řezech |
| krajnice 1,5 m a víc | 9 z 87 |  |
| víc pruhů než profil z MTVU | 10 z 87 |  |
| méně pruhů | 26 z 87 |  |
| jiný počet vozovek | 31 z 87 |  |
| vozovka o 1,5 m a víc širší (m) | 8 z 87 |  |
| vozovka o 1,5 m a víc užší (m) | 41 z 87 |  |
| Neurčeno 1 m a víc (m) | 67 z 87 |  |
| chodník o 1,5 m a víc širší (m) | 12 z 87 |  |
| chodník o 1,5 m a víc užší (m) | 7 z 87 |  |
| stání navíc | 0 z 87 |  |
| stání chybí | 6 z 87 |  |

### krajnice v odhadu (m celkem) (14)

- Československého exilu (45): 4.8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.012978,14.417188,0,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.012978,14.417188,0,22.0,22.0)
- Chlumecká (12): 3.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.106656,14.556826,-99,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.106656,14.556826,-99,22.0,22.0)
- Patočkova (26): 2.5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.092999,14.387909,-125,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.092999,14.387909,-125,22.0,22.0)
- Prokopské údolí (51): 2.4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.041064,14.370851,34,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.041064,14.370851,34,22.0,22.0)
- U Okrouhlíku (64): 2.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.073962,14.382035,-89,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.073962,14.382035,-89,22.0,22.0)
- Ústecká (34): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.139381,14.451696,173,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.139381,14.451696,173,22.0,22.0)
- Bělohorská (49): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.083968,14.372208,78,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.083968,14.372208,78,22.0,22.0)
- ? (41): 1.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.155998,14.562418,-116,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.155998,14.562418,-116,22.0,22.0)
- Jeremenkova (50): 1.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.045612,14.419429,110,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.045612,14.419429,110,22.0,22.0)
- Kyjská (73): 1.4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.101390,14.538290,-34,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.101390,14.538290,-34,22.0,22.0)
- Josefa Houdka (55): 1.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.964044,14.365369,-119,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.964044,14.365369,-119,22.0,22.0)
- Dobříšská (4): 1.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.053919,14.407661,-7,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.053919,14.407661,-7,22.0,22.0)

### krajnice 1,5 m a víc (9)

- Československého exilu (45): 4.8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.012978,14.417188,0,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.012978,14.417188,0,22.0,22.0)
- Chlumecká (12): 3.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.106656,14.556826,-99,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.106656,14.556826,-99,22.0,22.0)
- Patočkova (26): 2.5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.092999,14.387909,-125,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.092999,14.387909,-125,22.0,22.0)
- Prokopské údolí (51): 2.4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.041064,14.370851,34,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.041064,14.370851,34,22.0,22.0)
- U Okrouhlíku (64): 2.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.073962,14.382035,-89,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.073962,14.382035,-89,22.0,22.0)
- Ústecká (34): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.139381,14.451696,173,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.139381,14.451696,173,22.0,22.0)
- Bělohorská (49): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.083968,14.372208,78,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.083968,14.372208,78,22.0,22.0)
- ? (41): 1.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.155998,14.562418,-116,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.155998,14.562418,-116,22.0,22.0)
- Jeremenkova (50): 1.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.045612,14.419429,110,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.045612,14.419429,110,22.0,22.0)

### víc pruhů než profil z MTVU (10)

- Nuselská (38): 3 místo 2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.063672,14.442211,-53,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.063672,14.442211,-53,22.0,22.0)
- Černošická (53): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.960936,14.339959,-82,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.960936,14.339959,-82,22.0,22.0)
- U dubu (60): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.039988,14.425711,-78,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.039988,14.425711,-78,22.0,22.0)
- Zachova (61): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.039787,14.445542,37,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.039787,14.445542,37,22.0,22.0)
- Ke Střelnici (67): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.125951,14.393890,-162,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.125951,14.393890,-162,22.0,22.0)
- Kovanecká (68): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.107948,14.487040,90,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.107948,14.487040,90,22.0,22.0)
- Hřebenová (75): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.125542,14.378737,76,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.125542,14.378737,76,22.0,22.0)
- U nás (77): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.021815,14.425566,-143,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.021815,14.425566,-143,22.0,22.0)
- Bažantní (78): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.142377,14.373539,33,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.142377,14.373539,33,22.0,22.0)
- Závist (81): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.974450,14.399499,12,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.974450,14.399499,12,22.0,22.0)

### méně pruhů (26)

- Jižní spojka (2): 2 místo 4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.065037,14.519964,66,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.065037,14.519964,66,22.0,22.0)
- Dobříšská (4): 5 místo 6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.053919,14.407661,-7,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.053919,14.407661,-7,22.0,22.0)
- Brněnská (6): 6 místo 8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.010233,14.540715,113,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.010233,14.540715,113,22.0,22.0)
- Kukulova (7): 3 místo 6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.069582,14.334884,6,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.069582,14.334884,6,22.0,22.0)
- Strakonická (9): 3 místo 6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.023852,14.394473,8,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.023852,14.394473,8,22.0,22.0)
- Chlumecká (12): 3 místo 5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.106656,14.556826,-99,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.106656,14.556826,-99,22.0,22.0)
- Hlávkův most (14): 4 místo 8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.095965,14.437029,-178,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.095965,14.437029,-178,22.0,22.0)
- Bělohorská (15): 4 místo 5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.076786,14.335680,-112,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.076786,14.335680,-112,22.0,22.0)
- Wilsonova (18): 5 místo 6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.089292,14.437761,-180,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.089292,14.437761,-180,22.0,22.0)
- Na Hlavní (21): 2 místo 4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.167504,14.483964,-1,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.167504,14.483964,-1,22.0,22.0)
- nábřeží Edvarda Beneše (22): 2 místo 4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.092763,14.412349,61,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.092763,14.412349,61,22.0,22.0)
- V Olšinách (23): 2 místo 4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.070934,14.479678,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.070934,14.479678,84,22.0,22.0)

### jiný počet vozovek (31)

- Rozvadovská spojka (1): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.053983,14.318132,-98,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.053983,14.318132,-98,22.0,22.0)
- Dobříšská (4): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.053919,14.407661,-7,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.053919,14.407661,-7,22.0,22.0)
- Hlávkův most (14): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.095965,14.437029,-178,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.095965,14.437029,-178,22.0,22.0)
- Bělohorská (15): 2 místo 4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.076786,14.335680,-112,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.076786,14.335680,-112,22.0,22.0)
- Čuprova (16): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.108869,14.480525,138,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.108869,14.480525,138,22.0,22.0)
- Wilsonova (18): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.089292,14.437761,-180,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.089292,14.437761,-180,22.0,22.0)
- Na Hlavní (21): 1 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.167504,14.483964,-1,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.167504,14.483964,-1,22.0,22.0)
- V Olšinách (23): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.070934,14.479678,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.070934,14.479678,84,22.0,22.0)
- Kunratická spojka (24): 1 místo 2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.018256,14.500905,171,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.018256,14.500905,171,22.0,22.0)
- Kolbenova (25): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.110484,14.520543,94,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.110484,14.520543,94,22.0,22.0)
- Patočkova (26): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.092999,14.387909,-125,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.092999,14.387909,-125,22.0,22.0)
- Sokolovská (28): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.109559,14.496791,62,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.109559,14.496791,62,22.0,22.0)

### vozovka o 1,5 m a víc širší (m) (8)

- Generála Šišky (42): 8.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.007375,14.403336,-163,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.007375,14.403336,-163,22.0,22.0)
- Patočkova (26): 5.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.092999,14.387909,-125,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.092999,14.387909,-125,22.0,22.0)
- U nás (77): 4.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.021815,14.425566,-143,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.021815,14.425566,-143,22.0,22.0)
- Černošická (53): 3.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.960936,14.339959,-82,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.960936,14.339959,-82,22.0,22.0)
- Bažantní (78): 3.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.142377,14.373539,33,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.142377,14.373539,33,22.0,22.0)
- Závist (81): 3.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.974450,14.399499,12,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.974450,14.399499,12,22.0,22.0)
- Nad Petruskou (71): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.069727,14.439694,-141,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.069727,14.439694,-141,22.0,22.0)
- U dubu (60): 1.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.039988,14.425711,-78,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.039988,14.425711,-78,22.0,22.0)

### vozovka o 1,5 m a víc užší (m) (41)

- Strakonická (9): 36.8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.023852,14.394473,8,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.023852,14.394473,8,22.0,22.0)
- Brněnská (6): 24.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.010233,14.540715,113,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.010233,14.540715,113,22.0,22.0)
- Švehlova (32): 17.5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.057974,14.511374,130,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.057974,14.511374,130,22.0,22.0)
- V Olšinách (23): 15.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.070934,14.479678,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.070934,14.479678,84,22.0,22.0)
- Dobříšská (4): 15.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.053919,14.407661,-7,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.053919,14.407661,-7,22.0,22.0)
- Hlávkův most (14): 14.8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.095965,14.437029,-178,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.095965,14.437029,-178,22.0,22.0)
- Kukulova (7): 13.4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.069582,14.334884,6,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.069582,14.334884,6,22.0,22.0)
- U Technoplynu (52): 12.5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.082823,14.539250,92,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.082823,14.539250,92,22.0,22.0)
- Čuprova (16): 12.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.108869,14.480525,138,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.108869,14.480525,138,22.0,22.0)
- Jižní spojka (2): 11.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.065037,14.519964,66,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.065037,14.519964,66,22.0,22.0)
- Československého exilu (45): 8.8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.012978,14.417188,0,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.012978,14.417188,0,22.0,22.0)
- Bělohorská (49): 7.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.083968,14.372208,78,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.083968,14.372208,78,22.0,22.0)

### Neurčeno 1 m a víc (m) (67)

- Rozvadovská spojka (1): 50.5 (uvnitř 0.0, vně 50.5; MTVU: zeleň 35.0, vozovka 15.5) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.053983,14.318132,-98,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.053983,14.318132,-98,22.0,22.0)
- U Trezorky (83): 48.0 (uvnitř 0.0, vně 48.0; MTVU: zeleň 18.1, vozovka 14.3, chodník 9.7, jiné 5.7, budova 0.1) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.055721,14.373103,-100,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.055721,14.373103,-100,22.0,22.0)
- K Verneráku (39): 30.0 (uvnitř 0.0, vně 30.0; MTVU: jiné 24.1, budova 5.9) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.015456,14.487218,-144,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.015456,14.487218,-144,22.0,22.0)
- Závist (81): 28.9 (uvnitř 0.0, vně 28.9; MTVU: zeleň 26.6, jiné 2.0, chodník 0.2) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.974450,14.399499,12,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.974450,14.399499,12,22.0,22.0)
- Ke Kálku (90): 27.6 (uvnitř 0.0, vně 27.6; MTVU: jiné 27.2, vozovka 0.4) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.986648,14.452820,-97,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.986648,14.452820,-97,22.0,22.0)
- U Technoplynu (52): 26.6 (uvnitř 0.0, vně 26.6; MTVU: zeleň 12.7, vozovka 12.7, chodník 1.1) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.082823,14.539250,92,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.082823,14.539250,92,22.0,22.0)
- Kunratická spojka (24): 25.2 (uvnitř 0.0, vně 25.2; MTVU: zeleň 21.5, vozovka 3.7) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.018256,14.500905,171,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.018256,14.500905,171,22.0,22.0)
- Patočkova (26): 25.0 (uvnitř 0.0, vně 25.0; MTVU: zeleň 19.5, chodník 5.5) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.092999,14.387909,-125,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.092999,14.387909,-125,22.0,22.0)
- Kukulova (7): 23.7 (uvnitř 0.0, vně 23.7; MTVU: vozovka 15.9, zeleň 7.8) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.069582,14.334884,6,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.069582,14.334884,6,22.0,22.0)
- Na Hlavní (21): 22.9 (uvnitř 0.0, vně 22.9; MTVU: vozovka 22.1, chodník 0.7) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.167504,14.483964,-1,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.167504,14.483964,-1,22.0,22.0)
- Bělohorská (15): 22.1 (uvnitř 0.0, vně 22.1; MTVU: vozovka 15.6, zeleň 3.1, chodník 3.0, jiné 0.4) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.076786,14.335680,-112,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.076786,14.335680,-112,22.0,22.0)
- Hekrova (79): 21.8 (uvnitř 0.0, vně 21.8; MTVU: zeleň 16.4, vozovka 4.4, chodník 1.0) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.038886,14.512776,-125,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.038886,14.512776,-125,22.0,22.0)

### chodník o 1,5 m a víc širší (m) (12)

- Dobříšská (4, strana A): 6.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.053919,14.407661,-7,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.053919,14.407661,-7,22.0,22.0)
- Nad Petruskou (71, strana B): 4.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.069727,14.439694,-141,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.069727,14.439694,-141,22.0,22.0)
- U libušské sokolovny (86, strana B): 4.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.004432,14.462787,80,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.004432,14.462787,80,22.0,22.0)
- Jeremenkova (50, strana B): 4.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.045612,14.419429,110,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.045612,14.419429,110,22.0,22.0)
- Havlíčkova (95, strana B): 4.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.088036,14.432533,-3,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.088036,14.432533,-3,22.0,22.0)
- V Olšinách (23, strana A): 3.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.070934,14.479678,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.070934,14.479678,84,22.0,22.0)
- Jinonická (36, strana A): 3.4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.063799,14.376706,-137,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.063799,14.376706,-137,22.0,22.0)
- U Okrouhlíku (64, strana B): 3.4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.073962,14.382035,-89,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.073962,14.382035,-89,22.0,22.0)
- U Technoplynu (52, strana B): 3.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.082823,14.539250,92,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.082823,14.539250,92,22.0,22.0)
- Spojařů (76, strana B): 2.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.965385,14.395785,-170,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.965385,14.395785,-170,22.0,22.0)
- U dubu (60, strana B): 2.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.039988,14.425711,-78,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.039988,14.425711,-78,22.0,22.0)
- Jeremenkova (50, strana A): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.045612,14.419429,110,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.045612,14.419429,110,22.0,22.0)

### chodník o 1,5 m a víc užší (m) (7)

- Nad Vršovskou horou (69, strana A): 5.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.061575,14.472651,92,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.061575,14.472651,92,22.0,22.0)
- U Okrouhlíku (64, strana A): 4.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.073962,14.382035,-89,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.073962,14.382035,-89,22.0,22.0)
- Krausova (91, strana A): 2.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.140572,14.507896,-9,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.140572,14.507896,-9,22.0,22.0)
- Kovanecká (68, strana B): 2.4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.107948,14.487040,90,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.107948,14.487040,90,22.0,22.0)
- V Roháčích (82, strana A): 2.4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.053176,14.361267,-63,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.053176,14.361267,-63,22.0,22.0)
- Chvatěrubská (59, strana B): 2.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.135534,14.433625,-92,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.135534,14.433625,-92,22.0,22.0)
- Sokolovská (28, strana A): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.109559,14.496791,62,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.109559,14.496791,62,22.0,22.0)

### stání chybí (6)

- Spojovací (8, strana A) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.100005,14.491981,-48,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.100005,14.491981,-48,22.0,22.0)
- V Olšinách (23, strana A) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.070934,14.479678,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.070934,14.479678,84,22.0,22.0)
- Olšanská (35, strana A) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.083340,14.464259,80,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.083340,14.464259,80,22.0,22.0)
- Olšanská (35, strana B) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.083340,14.464259,80,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.083340,14.464259,80,22.0,22.0)
- U Okrouhlíku (64, strana B) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.073962,14.382035,-89,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.073962,14.382035,-89,22.0,22.0)
- Spojařů (76, strana B) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.965385,14.395785,-170,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.965385,14.395785,-170,22.0,22.0)

Neurčeno celkem: uvnitř ulice (mezi vozovkami) 0 m, vně 654 m; MTVU pod ním: zeleň 265 m, vozovka 207 m, jiné 100 m, chodník 52 m, stání 15 m, budova 14 m

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

