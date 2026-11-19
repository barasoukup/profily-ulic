# Kde odhad z ortofota a OSM systematicky chybuje (2026-11-19)

Odhad tak, jak ho dělá aplikace (`?mapa=0`), proti MTVU podél řezu; ortofoto cuzk12. Skript `evaluation/ortofoto-osm/chyby.mjs`.
Odkazy: **odhad** = jen ortofoto a OSM (`?mapa=0`), **mapa** = jak aplikace řez kreslí z technické mapy (server na 5293).

## praha (87 řezů)

Metry podél řezů: řádek = MTVU, sloupec = odhad (budovy vynechané).

| MTVU \ odhad | vozovka | stání | chodník | zeleň | tram. těleso | jiné | neurčeno | správně |
|---|---|---|---|---|---|---|---|---|
| **vozovka** | **698** | 7 | 66 | 27 | 46 | 89 | 60 | 70 % |
| **stání** | 7 | **19** | 19 | 9 | 0 | 1 | 0 | 34 % |
| **chodník** | 11 | 0 | **193** | 34 | 0 | 27 | 11 | 70 % |
| **zeleň** | 20 | 1 | 40 | **119** | 0 | 41 | 18 | 50 % |
| **tram. těleso** | 1 | 0 | 0 | 0 | **27** | 2 | 0 | 89 % |
| **jiné** | 14 | 0 | 20 | 13 | 0 | **20** | 1 | 29 % |

| Chyba | řezů | |
|---|---|---|
| krajnice v odhadu (m celkem) | 16 z 87 | MTVU profil má krajnici v 20 řezech |
| krajnice 1,5 m a víc | 12 z 87 |  |
| víc pruhů než profil z MTVU | 10 z 87 |  |
| méně pruhů | 23 z 87 |  |
| jiný počet vozovek | 33 z 87 |  |
| vozovka u osy o 1,5 m a víc širší (m) | 8 z 87 |  |
| vozovka u osy o 1,5 m a víc užší (m) | 41 z 87 |  |
| vnější obruba ulice o 1 m a víc dovnitř (stran, m) | 66 z 87 |  |
| vnější obruba ulice o 1 m a víc ven (stran, m) | 16 z 87 |  |
| Neurčeno 1 m a víc (m) | 31 z 87 |  |
| chodník o 1,5 m a víc širší (m) | 12 z 87 |  |
| chodník o 1,5 m a víc užší (m) | 7 z 87 |  |
| stání navíc | 0 z 87 |  |
| stání chybí | 6 z 87 |  |

### krajnice v odhadu (m celkem) (16)

- Chlumecká (12): 5.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.106656,14.556826,-99,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.106656,14.556826,-99,22.0,22.0)
- Československého exilu (45): 4.8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.012978,14.417188,0,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.012978,14.417188,0,22.0,22.0)
- Patočkova (26): 2.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.092999,14.387909,-125,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.092999,14.387909,-125,22.0,22.0)
- Prokopské údolí (51): 2.4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.041064,14.370851,34,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.041064,14.370851,34,22.0,22.0)
- Strakonická (9): 2.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.023852,14.394473,8,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.023852,14.394473,8,22.0,22.0)
- U Okrouhlíku (64): 2.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.073962,14.382035,-89,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.073962,14.382035,-89,22.0,22.0)
- Ústecká (34): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.139381,14.451696,173,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.139381,14.451696,173,22.0,22.0)
- Bělohorská (49): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.083968,14.372208,78,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.083968,14.372208,78,22.0,22.0)
- Kukulova (7): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.069582,14.334884,6,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.069582,14.334884,6,22.0,22.0)
- ? (41): 1.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.155998,14.562418,-116,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.155998,14.562418,-116,22.0,22.0)
- Jeremenkova (50): 1.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.045612,14.419429,110,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.045612,14.419429,110,22.0,22.0)
- U Trezorky (83): 1.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.055721,14.373103,-100,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.055721,14.373103,-100,22.0,22.0)

### krajnice 1,5 m a víc (12)

- Chlumecká (12): 5.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.106656,14.556826,-99,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.106656,14.556826,-99,22.0,22.0)
- Československého exilu (45): 4.8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.012978,14.417188,0,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.012978,14.417188,0,22.0,22.0)
- Patočkova (26): 2.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.092999,14.387909,-125,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.092999,14.387909,-125,22.0,22.0)
- Prokopské údolí (51): 2.4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.041064,14.370851,34,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.041064,14.370851,34,22.0,22.0)
- Strakonická (9): 2.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.023852,14.394473,8,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.023852,14.394473,8,22.0,22.0)
- U Okrouhlíku (64): 2.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.073962,14.382035,-89,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.073962,14.382035,-89,22.0,22.0)
- Ústecká (34): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.139381,14.451696,173,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.139381,14.451696,173,22.0,22.0)
- Bělohorská (49): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.083968,14.372208,78,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.083968,14.372208,78,22.0,22.0)
- Kukulova (7): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.069582,14.334884,6,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.069582,14.334884,6,22.0,22.0)
- ? (41): 1.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.155998,14.562418,-116,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.155998,14.562418,-116,22.0,22.0)
- Jeremenkova (50): 1.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.045612,14.419429,110,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.045612,14.419429,110,22.0,22.0)
- U Trezorky (83): 1.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.055721,14.373103,-100,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.055721,14.373103,-100,22.0,22.0)

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

### méně pruhů (23)

- Jižní spojka (2): 2 místo 4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.065037,14.519964,66,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.065037,14.519964,66,22.0,22.0)
- Dobříšská (4): 5 místo 6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.053919,14.407661,-7,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.053919,14.407661,-7,22.0,22.0)
- Brněnská (6): 6 místo 8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.010233,14.540715,113,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.010233,14.540715,113,22.0,22.0)
- Chlumecká (12): 4 místo 5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.106656,14.556826,-99,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.106656,14.556826,-99,22.0,22.0)
- Hlávkův most (14): 4 místo 8 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.095965,14.437029,-178,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.095965,14.437029,-178,22.0,22.0)
- Bělohorská (15): 4 místo 5 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.076786,14.335680,-112,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.076786,14.335680,-112,22.0,22.0)
- Wilsonova (18): 5 místo 6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.089292,14.437761,-180,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.089292,14.437761,-180,22.0,22.0)
- Na Hlavní (21): 2 místo 4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.167504,14.483964,-1,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.167504,14.483964,-1,22.0,22.0)
- nábřeží Edvarda Beneše (22): 2 místo 4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.092763,14.412349,61,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.092763,14.412349,61,22.0,22.0)
- V Olšinách (23): 2 místo 4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.070934,14.479678,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.070934,14.479678,84,22.0,22.0)
- Sokolovská (28): 2 místo 4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.109559,14.496791,62,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.109559,14.496791,62,22.0,22.0)
- nábřeží Kapitána Jaroše (30): 4 místo 6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.096335,14.431503,68,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.096335,14.431503,68,22.0,22.0)

### jiný počet vozovek (33)

- Rozvadovská spojka (1): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.053983,14.318132,-98,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.053983,14.318132,-98,22.0,22.0)
- Dobříšská (4): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.053919,14.407661,-7,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.053919,14.407661,-7,22.0,22.0)
- Kukulova (7): 4 místo 2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.069582,14.334884,6,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.069582,14.334884,6,22.0,22.0)
- Strakonická (9): 3 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.023852,14.394473,8,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.023852,14.394473,8,22.0,22.0)
- Chlumecká (12): 3 místo 2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.106656,14.556826,-99,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.106656,14.556826,-99,22.0,22.0)
- Hlávkův most (14): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.095965,14.437029,-178,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.095965,14.437029,-178,22.0,22.0)
- Bělohorská (15): 2 místo 4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.076786,14.335680,-112,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.076786,14.335680,-112,22.0,22.0)
- Čuprova (16): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.108869,14.480525,138,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.108869,14.480525,138,22.0,22.0)
- Wilsonova (18): 2 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.089292,14.437761,-180,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.089292,14.437761,-180,22.0,22.0)
- Na Hlavní (21): 1 místo 3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.167504,14.483964,-1,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.167504,14.483964,-1,22.0,22.0)
- V Olšinách (23): 2 místo 1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.070934,14.479678,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.070934,14.479678,84,22.0,22.0)
- Kunratická spojka (24): 1 místo 2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.018256,14.500905,171,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.018256,14.500905,171,22.0,22.0)

### vozovka u osy o 1,5 m a víc širší (m) (8)

- Generála Šišky (42): 8.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.007375,14.403336,-163,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.007375,14.403336,-163,22.0,22.0)
- Patočkova (26): 5.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.092999,14.387909,-125,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.092999,14.387909,-125,22.0,22.0)
- U nás (77): 4.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.021815,14.425566,-143,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.021815,14.425566,-143,22.0,22.0)
- Černošická (53): 3.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.960936,14.339959,-82,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.960936,14.339959,-82,22.0,22.0)
- Bažantní (78): 3.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.142377,14.373539,33,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.142377,14.373539,33,22.0,22.0)
- Závist (81): 3.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.974450,14.399499,12,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.974450,14.399499,12,22.0,22.0)
- Nad Petruskou (71): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.069727,14.439694,-141,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.069727,14.439694,-141,22.0,22.0)
- U dubu (60): 1.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.039988,14.425711,-78,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.039988,14.425711,-78,22.0,22.0)

### vozovka u osy o 1,5 m a víc užší (m) (41)

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

### vnější obruba ulice o 1 m a víc dovnitř (stran, m) (66)

- Hlávkův most (14, strana A): 27.6 (odhad chodnik_kola 3.9; MTVU 704 23.1, 702 3.9, 701 0.6; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.095965,14.437029,-178,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.095965,14.437029,-178,22.0,22.0)
- Nad Vršovskou horou (69, strana B): 20.2 (odhad nezname 13.9, chodnik 6.0; MTVU 704 13.5, 701 3.5, 702 3.2; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.061575,14.472651,92,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.061575,14.472651,92,22.0,22.0)
- ? (3, strana B): 19.3 (odhad pruh 11.2, delici 5.1, nezname 1.9; MTVU 701 16.3, 401 3.0; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.019472,14.516217,121,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.019472,14.516217,121,22.0,22.0)
- Strakonická (9, strana B): 17.3 (odhad ; MTVU 701 17.3; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.023852,14.394473,8,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.023852,14.394473,8,22.0,22.0)
- U Technoplynu (52, strana B): 13.2 (odhad plocha 7.2, chodnik 6.0; MTVU 701 12.0, 1000 1.2; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.082823,14.539250,92,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.082823,14.539250,92,22.0,22.0)
- Generála Šišky (42, strana A): 13.0 (odhad nezname 2.0; MTVU 705 10.5, 401 2.3, 701 0.2; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.007375,14.403336,-163,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.007375,14.403336,-163,22.0,22.0)
- U Technoplynu (52, strana A): 12.8 (odhad nezname 12.8; MTVU 701 12.8; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.082823,14.539250,92,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.082823,14.539250,92,22.0,22.0)
- Jižní spojka (2, strana A): 8.9 (odhad nezname 8.4; MTVU 701 8.9; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.065037,14.519964,66,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.065037,14.519964,66,22.0,22.0)
- Brněnská (6, strana A): 5.6 (odhad nezname 2.0; MTVU 701 5.6; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.010233,14.540715,113,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.010233,14.540715,113,22.0,22.0)
- Havlíčkova (95, strana B): 5.5 (odhad chodnik_kola 3.5, nastupiste 2.0; MTVU 701 3.0, 9800 1.9, 702 0.6; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.088036,14.432533,-3,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.088036,14.432533,-3,22.0,22.0)
- Spojařů (76, strana B): 5.0 (odhad chodnik 5.0; MTVU 704 4.8, 701 0.2; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.965385,14.395785,-170,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.965385,14.395785,-170,22.0,22.0)
- Chvatěrubská (59, strana A): 4.4 (odhad zelen 4.0, chodnik 0.4; MTVU 701 4.4; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.135534,14.433625,-92,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.135534,14.433625,-92,22.0,22.0)

### vnější obruba ulice o 1 m a víc ven (stran, m) (16)

- Patočkova (26, strana A): 12.1 (odhad pruh 6.6, delici 3.6, cyklopruh 1.9; MTVU 701 7.1, 401 3.7, 1003 0.7; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.092999,14.387909,-125,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.092999,14.387909,-125,22.0,22.0)
- Černošická (53, strana A): 5.9 (odhad pruh 5.9; MTVU 401 3.6, 100 2.3; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.960936,14.339959,-82,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.960936,14.339959,-82,22.0,22.0)
- U nás (77, strana B): 3.1 (odhad pruh 3.1; MTVU 401 3.1; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.021815,14.425566,-143,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.021815,14.425566,-143,22.0,22.0)
- Ke Střelnici (67, strana A): 2.9 (odhad pruh 2.9; MTVU 902 2.9; obruba z: osm) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.125951,14.393890,-162,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.125951,14.393890,-162,22.0,22.0)
- Závist (81, strana A): 2.5 (odhad pruh 2.5; MTVU 1100 2.5; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.974450,14.399499,12,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.974450,14.399499,12,22.0,22.0)
- Mašatova (80, strana A): 2.2 (odhad pruh 2.2; MTVU 401 2.2; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.016198,14.475761,95,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.016198,14.475761,95,22.0,22.0)
- Chvatěrubská (59, strana B): 2.0 (odhad pruh 2.0; MTVU 702 2.0; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.135534,14.433625,-92,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.135534,14.433625,-92,22.0,22.0)
- Bažantní (78, strana A): 1.8 (odhad pruh 1.8; MTVU 401 1.7, 300 0.1; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.142377,14.373539,33,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.142377,14.373539,33,22.0,22.0)
- ? (41, strana A): 1.7 (odhad krajnice 1.7; MTVU 401 1.7; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.155998,14.562418,-116,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.155998,14.562418,-116,22.0,22.0)
- Nad Petruskou (71, strana B): 1.6 (odhad pruh 1.6; MTVU 702 1.3, 1003 0.3; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.069727,14.439694,-141,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.069727,14.439694,-141,22.0,22.0)
- U dubu (60, strana A): 1.4 (odhad pruh 1.4; MTVU 401 1.4; obruba z: čára) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.039988,14.425711,-78,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.039988,14.425711,-78,22.0,22.0)
- Budčická (66, strana A): 1.3 (odhad pruh 1.3; MTVU 702 1.2, 300 0.1; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.081088,14.639169,-66,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.081088,14.639169,-66,22.0,22.0)

### Neurčeno 1 m a víc (m) (31)

- Rozvadovská spojka (1): 44.7 (uvnitř 0.0, vně 44.7; MTVU: zeleň 32.1, vozovka 12.6) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.053983,14.318132,-98,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.053983,14.318132,-98,22.0,22.0)
- K Verneráku (39): 30.0 (uvnitř 0.0, vně 30.0; MTVU: jiné 24.1, budova 5.9) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.015456,14.487218,-144,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.015456,14.487218,-144,22.0,22.0)
- U Technoplynu (52): 26.6 (uvnitř 0.0, vně 26.6; MTVU: zeleň 12.7, vozovka 12.7, chodník 1.1) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.082823,14.539250,92,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.082823,14.539250,92,22.0,22.0)
- Ke Kálku (90): 25.6 (uvnitř 0.0, vně 25.6; MTVU: jiné 25.6) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.986648,14.452820,-97,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.986648,14.452820,-97,22.0,22.0)
- Závist (81): 24.6 (uvnitř 0.0, vně 24.6; MTVU: zeleň 24.3, chodník 0.2) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.974450,14.399499,12,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.974450,14.399499,12,22.0,22.0)
- Na Hlavní (21): 22.9 (uvnitř 0.0, vně 22.9; MTVU: vozovka 22.1, chodník 0.7) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.167504,14.483964,-1,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.167504,14.483964,-1,22.0,22.0)
- Hekrova (79): 17.7 (uvnitř 0.0, vně 17.7; MTVU: zeleň 13.3, vozovka 4.4) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.038886,14.512776,-125,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.038886,14.512776,-125,22.0,22.0)
- Kunratická spojka (24): 17.1 (uvnitř 0.0, vně 17.1; MTVU: zeleň 17.1) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.018256,14.500905,171,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.018256,14.500905,171,22.0,22.0)
- Krausova (91): 14.4 (uvnitř 0.0, vně 14.4; MTVU: zeleň 12.6, chodník 1.8) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.140572,14.507896,-9,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.140572,14.507896,-9,22.0,22.0)
- Nad Vršovskou horou (69): 13.9 (uvnitř 0.0, vně 13.9; MTVU: stání 13.2, chodník 0.7) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.061575,14.472651,92,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.061575,14.472651,92,22.0,22.0)
- U Trezorky (83): 12.4 (uvnitř 0.0, vně 12.4; MTVU: zeleň 5.7, chodník 4.0, jiné 2.6, budova 0.1) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.055721,14.373103,-100,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.055721,14.373103,-100,22.0,22.0)
- Jižní spojka (2): 10.4 (uvnitř 0.0, vně 10.4; MTVU: vozovka 10.4) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.065037,14.519964,66,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.065037,14.519964,66,22.0,22.0)

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

- U Okrouhlíku (64, strana A): 4.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.073962,14.382035,-89,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.073962,14.382035,-89,22.0,22.0)
- Nad Vršovskou horou (69, strana A): 3.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=50.061575,14.472651,92,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=50.061575,14.472651,92,22.0,22.0)
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

Neurčeno celkem: uvnitř ulice (mezi vozovkami) 0 m, vně 318 m; MTVU pod ním: zeleň 130 m, vozovka 91 m, jiné 55 m, chodník 17 m, stání 13 m, budova 11 m

Vnější obruby ulice (strany, + = odhad uvnitř, − = venku, m): -99..-2: 7 · -2..-1: 9 · -1..-0.5: 9 · -0.5..0.5: 59 · 0.5..1: 22 · 1..2: 25 · 2..5: 31 · 5..99: 10

## brno (94 řezů)

Metry podél řezů: řádek = MTVU, sloupec = odhad (budovy vynechané).

| MTVU \ odhad | vozovka | stání | chodník | zeleň | tram. těleso | jiné | neurčeno | správně |
|---|---|---|---|---|---|---|---|---|
| **vozovka** | **761** | 12 | 57 | 68 | 0 | 33 | 31 | 79 % |
| **stání** | 31 | **33** | 29 | 15 | 0 | 7 | 13 | 26 % |
| **chodník** | 23 | 2 | **201** | 63 | 0 | 28 | 4 | 63 % |
| **zeleň** | 16 | 0 | 63 | **244** | 0 | 16 | 2 | 72 % |
| **tram. těleso** | 23 | 0 | 1 | 0 | **0** | 0 | 7 | 0 % |
| **jiné** | 2 | 0 | 36 | 19 | 0 | **17** | 3 | 22 % |

| Chyba | řezů | |
|---|---|---|
| krajnice v odhadu (m celkem) | 12 z 94 | MTVU profil má krajnici v 19 řezech |
| krajnice 1,5 m a víc | 10 z 94 |  |
| víc pruhů než profil z MTVU | 11 z 94 |  |
| méně pruhů | 18 z 94 |  |
| jiný počet vozovek | 36 z 94 |  |
| vozovka u osy o 1,5 m a víc širší (m) | 12 z 94 |  |
| vozovka u osy o 1,5 m a víc užší (m) | 34 z 94 |  |
| vnější obruba ulice o 1 m a víc dovnitř (stran, m) | 61 z 94 |  |
| vnější obruba ulice o 1 m a víc ven (stran, m) | 11 z 94 |  |
| Neurčeno 1 m a víc (m) | 17 z 94 |  |
| chodník o 1,5 m a víc širší (m) | 16 z 94 |  |
| chodník o 1,5 m a víc užší (m) | 6 z 94 |  |
| stání navíc | 4 z 94 |  |
| stání chybí | 11 z 94 |  |

### krajnice v odhadu (m celkem) (12)

- VMO Dobrovského (1): 7.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.220002,16.609398,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.220002,16.609398,84,22.0,22.0)
- Stará dálnice (31): 4.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.214880,16.521748,178,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.214880,16.521748,178,22.0,22.0)
- Makovského náměstí (40): 3.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.216846,16.579001,135,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.216846,16.579001,135,22.0,22.0)
- Otakara Ševčíka (11): 3.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.194130,16.646793,165,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.194130,16.646793,165,22.0,22.0)
- Svatopetrská (14): 3.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.175511,16.621972,168,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.175511,16.621972,168,22.0,22.0)
- Gajdošova (10): 3.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.198386,16.645822,-13,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.198386,16.645822,-13,22.0,22.0)
- Stará dálnice (25): 2.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.205619,16.519792,-162,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.205619,16.519792,-162,22.0,22.0)
- Holzova (51): 2.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.194731,16.696983,-3,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.194731,16.696983,-3,22.0,22.0)
- ? (23): 2.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.226994,16.519007,-124,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.226994,16.519007,-124,22.0,22.0)
- Měšťanská (72): 1.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.151222,16.662219,-98,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.151222,16.662219,-98,22.0,22.0)
- Vzhledná (78): 1.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.176501,16.526067,116,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.176501,16.526067,116,22.0,22.0)
- Bubeníčkova (39): 0.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.201616,16.642178,-118,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.201616,16.642178,-118,22.0,22.0)

### krajnice 1,5 m a víc (10)

- VMO Dobrovského (1): 7.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.220002,16.609398,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.220002,16.609398,84,22.0,22.0)
- Stará dálnice (31): 4.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.214880,16.521748,178,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.214880,16.521748,178,22.0,22.0)
- Makovského náměstí (40): 3.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.216846,16.579001,135,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.216846,16.579001,135,22.0,22.0)
- Otakara Ševčíka (11): 3.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.194130,16.646793,165,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.194130,16.646793,165,22.0,22.0)
- Svatopetrská (14): 3.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.175511,16.621972,168,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.175511,16.621972,168,22.0,22.0)
- Gajdošova (10): 3.2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.198386,16.645822,-13,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.198386,16.645822,-13,22.0,22.0)
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

### méně pruhů (18)

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
- ? (24): 2 místo 4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.207451,16.646623,-117,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.207451,16.646623,-117,22.0,22.0)

### jiný počet vozovek (36)

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
- Zvonařka (20): 1 místo 2 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.188173,16.623220,76,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.188173,16.623220,76,22.0,22.0)

### vozovka u osy o 1,5 m a víc širší (m) (12)

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

### vozovka u osy o 1,5 m a víc užší (m) (34)

- Jasanová (100): 12.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.205202,16.555225,-62,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.205202,16.555225,-62,22.0,22.0)
- Dunajská (76): 10.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.169072,16.561079,173,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.169072,16.561079,173,22.0,22.0)
- Poříčí (19): 8.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.185876,16.589535,64,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.185876,16.589535,64,22.0,22.0)
- Řečkovická (47): 7.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.260298,16.574640,-74,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.260298,16.574640,-74,22.0,22.0)
- Skácelova (42): 7.1 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.222183,16.587725,-112,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.222183,16.587725,-112,22.0,22.0)
- Stará dálnice (31): 6.4 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.214880,16.521748,178,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.214880,16.521748,178,22.0,22.0)
- Kohoutova (75): 6.3 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.216616,16.631475,105,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.216616,16.631475,105,22.0,22.0)
- Charbulova (43): 5.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.188409,16.632573,-34,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.188409,16.632573,-34,22.0,22.0)
- Bellova (64): 5.9 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.193806,16.528691,1,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.193806,16.528691,1,22.0,22.0)
- ? (6): 5.7 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.266264,16.575157,-172,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.266264,16.575157,-172,22.0,22.0)
- Uhelná (33): 5.0 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.187235,16.609414,20,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.187235,16.609414,20,22.0,22.0)
- Pražská (21): 4.6 · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.174198,16.538306,-83,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.174198,16.538306,-83,22.0,22.0)

### vnější obruba ulice o 1 m a víc dovnitř (stran, m) (61)

- ? (4, strana A): 37.3 (odhad chodnik 2.5, plocha 2.2; MTVU 701 33.6, 702 3.7; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.187131,16.648338,9,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.187131,16.648338,9,22.0,22.0)
- Dornych (17, strana A): 26.5 (odhad chodnik 2.5; MTVU 704 23.0, 702 3.5; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.184248,16.622229,158,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.184248,16.622229,158,22.0,22.0)
- Svatopetrská (12, strana B): 16.2 (odhad nezname 16.2; MTVU 705 7.4, 701 7.0, 401 1.1; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.179035,16.621669,-2,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.179035,16.621669,-2,22.0,22.0)
- ? (6, strana B): 15.9 (odhad pruh 7.4, zelen 4.4, nezname 2.0; MTVU 701 13.1, 401 2.8; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.266264,16.575157,-172,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.266264,16.575157,-172,22.0,22.0)
- ? (2, strana B): 15.7 (odhad zelen 15.7; MTVU 701 12.7, 401 3.0; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.225520,16.600055,-21,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.225520,16.600055,-21,22.0,22.0)
- Karlova (32, strana A): 15.7 (odhad plocha 9.7, chodnik 6.0; MTVU 704 11.4, 702 2.2, 401 1.6; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.213421,16.643729,13,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.213421,16.643729,13,22.0,22.0)
- ? (4, strana B): 13.7 (odhad pruh 8.2, delici 5.5; MTVU 701 10.2, 401 2.0, 602 1.5; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.187131,16.648338,9,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.187131,16.648338,9,22.0,22.0)
- Dunajská (76, strana A): 13.5 (odhad zelen 2.0; MTVU 701 9.0, 9705 4.5; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.169072,16.561079,173,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.169072,16.561079,173,22.0,22.0)
- Poříčí (19, strana B): 13.5 (odhad plocha 7.5, chodnik 6.0; MTVU 704 10.7, 702 2.3, 701 0.5; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.185876,16.589535,64,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.185876,16.589535,64,22.0,22.0)
- Pražská (21, strana A): 13.4 (odhad nezname 2.0; MTVU 704 10.9, 701 2.5; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.174198,16.538306,-83,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.174198,16.538306,-83,22.0,22.0)
- Jasanová (100, strana B): 12.2 (odhad nezname 12.2; MTVU 9705 6.6, 704 5.6; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.205202,16.555225,-62,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.205202,16.555225,-62,22.0,22.0)
- ? (2, strana A): 10.8 (odhad delici 5.3, pruh 3.8, nezname 1.2; MTVU 701 9.9, 602 0.9; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.225520,16.600055,-21,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.225520,16.600055,-21,22.0,22.0)

### vnější obruba ulice o 1 m a víc ven (stran, m) (11)

- Jedovnická (26, strana B): 4.0 (odhad pruh 4.1; MTVU 702 3.4, 401 0.7; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.199509,16.665877,-172,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.199509,16.665877,-172,22.0,22.0)
- Dunajská (76, strana B): 2.9 (odhad pruh 2.9; MTVU 702 2.9; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.169072,16.561079,173,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.169072,16.561079,173,22.0,22.0)
- Mlaty (84, strana A): 2.4 (odhad pruh 2.4; MTVU 401 2.4; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.176684,16.530777,128,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.176684,16.530777,128,22.0,22.0)
- Makovského náměstí (40, strana B): 2.4 (odhad pruh 2.4; MTVU 702 2.4; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.216846,16.579001,135,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.216846,16.579001,135,22.0,22.0)
- Heršpická (13, strana B): 2.3 (odhad pruh 2.3; MTVU 702 2.2, 401 0.1; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.178358,16.603798,4,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.178358,16.603798,4,22.0,22.0)
- Meziboří (89, strana A): 2.0 (odhad pruh 2.0; MTVU 300 1.1, 401 0.9; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.270953,16.601008,89,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.270953,16.601008,89,22.0,22.0)
- Bartolomějská (85, strana B): 2.0 (odhad pruh 2.0; MTVU 702 1.4, 1003 0.6; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.202995,16.490710,-38,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.202995,16.490710,-38,22.0,22.0)
- Lomená (82, strana B): 1.9 (odhad pruh 1.9; MTVU 702 1.8, 300 0.1; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.173088,16.625992,84,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.173088,16.625992,84,22.0,22.0)
- Libušino údolí (44, strana A): 1.5 (odhad cyklopruh 1.5; MTVU 702 1.5; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.196791,16.552078,-82,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.196791,16.552078,-82,22.0,22.0)
- Přehradní (58, strana B): 1.4 (odhad pruh 1.4; MTVU 401 1.4; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.232705,16.522186,81,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.232705,16.522186,81,22.0,22.0)
- Vzhledná (78, strana A): 1.1 (odhad krajnice 1.0, pruh 0.1; MTVU 702 1.0, 300 0.1; obruba z: hrana) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.176501,16.526067,116,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.176501,16.526067,116,22.0,22.0)

### Neurčeno 1 m a víc (m) (17)

- Srnčí (62): 31.0 (uvnitř 0.0, vně 31.0; MTVU: jiné 27.5, budova 3.5) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.204997,16.480362,-116,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.204997,16.480362,-116,22.0,22.0)
- Jasanová (100): 29.2 (uvnitř 0.0, vně 29.2; MTVU: stání 12.2, zeleň 6.8, budova 6.7, chodník 2.1, jiné 1.3, nic 0.1) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.205202,16.555225,-62,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.205202,16.555225,-62,22.0,22.0)
- Zvonařka (20): 20.5 (uvnitř 0.0, vně 20.5; MTVU: vozovka 8.4, budova 7.8, chodník 4.3) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.188173,16.623220,76,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.188173,16.623220,76,22.0,22.0)
- Svatopetrská (12): 20.1 (uvnitř 0.0, vně 20.1; MTVU: tram. těleso 7.4, vozovka 7.0, chodník 3.6, zeleň 1.1, jiné 0.7, budova 0.2) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.179035,16.621669,-2,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.179035,16.621669,-2,22.0,22.0)
- Mojžíšova (87): 15.2 (uvnitř 0.0, vně 15.2; MTVU: jiné 14.0, budova 1.2) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.228779,16.601419,47,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.228779,16.601419,47,22.0,22.0)
- Stará dálnice (25): 11.3 (uvnitř 0.0, vně 11.3; MTVU: zeleň 5.7, jiné 5.5) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.205619,16.519792,-162,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.205619,16.519792,-162,22.0,22.0)
- Kohoutova (75): 8.4 (uvnitř 0.0, vně 8.4; MTVU: jiné 8.4) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.216616,16.631475,105,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.216616,16.631475,105,22.0,22.0)
- Pellicova (61): 4.7 (uvnitř 0.0, vně 4.7; MTVU: budova 3.0, jiné 1.2, zeleň 0.4) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.196464,16.595308,3,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.196464,16.595308,3,22.0,22.0)
- ? (24): 4.5 (uvnitř 0.0, vně 4.5; MTVU: vozovka 3.7, jiné 0.4, zeleň 0.4) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.207451,16.646623,-117,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.207451,16.646623,-117,22.0,22.0)
- Uhelná (33): 4.3 (uvnitř 0.0, vně 4.3; MTVU: zeleň 4.3) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.187235,16.609414,20,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.187235,16.609414,20,22.0,22.0)
- ? (3): 4.0 (uvnitř 0.0, vně 4.0; MTVU: vozovka 4.0) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.263168,16.575021,-7,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.263168,16.575021,-7,22.0,22.0)
- ? (6): 4.0 (uvnitř 0.0, vně 4.0; MTVU: vozovka 4.0) · [odhad](http://localhost:5293/?lang=cs&osm=balik&mapa=0#rez=49.266264,16.575157,-172,22.0,22.0) · [mapa](http://localhost:5293/?lang=cs&osm=balik#rez=49.266264,16.575157,-172,22.0,22.0)

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

Neurčeno celkem: uvnitř ulice (mezi vozovkami) 0 m, vně 167 m; MTVU pod ním: jiné 60 m, vozovka 35 m, budova 22 m, zeleň 19 m, stání 13 m, chodník 11 m, tram. těleso 7 m, nic 0 m

Vnější obruby ulice (strany, + = odhad uvnitř, − = venku, m): -99..-2: 6 · -2..-1: 5 · -1..-0.5: 14 · -0.5..0.5: 79 · 0.5..1: 23 · 1..2: 17 · 2..5: 24 · 5..99: 20


## S obrubami vozovky z modelu AI (`AI=ai-map5-3`, jen Brno: na Praze se model učil; 19. 11. 2026)

| Brno, ČÚZK | bez AI | s AI |
|---|---|---|
| vnější obruba o 1 m a víc dovnitř (stran) | 61 | 37 |
| vnější obruba o 1 m a víc ven (stran) | 11 | 13 |
| metry vozovky správně | 79 % | 83 % |
| metry chodníku správně | 63 % | 65 % |
| regrese: obruby medián, do 0,5 / 1 m | 0,69 · 41 / 62 % | 0,51 · 47 / 74 % |
| regrese: chodník medián, do 1 m | 1,05 · 49 % | 1,25 · 49 % |
| regrese Brno 2025 10 cm: obruby / chodník medián | 0,58 / 2,60 | 0,50 / 1,30 |

Koleje mezi dvěma vozovkami (vozovka v MTVU čtena jako těleso): v MTVU napůl vozovka (8 řezů), napůl těleso (8); OSM
(značky kolejí i ulice, třída, rychlost) ani snímek (podobnost s vozovkou, hrany na okrajích) je neodliší, zůstává.
