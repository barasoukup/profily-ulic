# Odkazy na vyzkoušení prototypu (pruhy a krajnice z ortofota)

Spustit server z pracovní kopie s pokusem (z hlavní složky projektu):

```bash
PORT=5174 node .claude/worktrees/ortofoto/pilot/server.mjs
```

Části z ortofota mají ve zdroji „podle čar na ortofotu“ (oranžový proužek pod částí). Odkaz „bez“ (`?orto=0`) ukáže profil podle pravidel. Krajnici dělá i čára u obruby, tedy i úzkou (od 10 cm; Bára 12. 11. 2026).

| město | ulice | co se mění | | |
|---|---|---|---|---|
| Praha | Poděbradská | beze změny (pruhy už sedí s čarami) | [s ortofotem](http://localhost:5174/#rez=50.103357,14.517910,-99,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.103357,14.517910,-99,22.0,22.0) |
| Praha | Rozvadovská spojka | krajnice za vodicí čárou 2,72 a 2,93, úzké krajnice u středu 0,43 a 0,37, pruhy 3,80–4,00 | [s ortofotem](http://localhost:5174/#rez=50.053983,14.318132,-98,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.053983,14.318132,-98,22.0,22.0) |
| Praha | Brněnská | 8 pruhů po 3,60–3,90, krajnice 1,78 a 3,07 | [s ortofotem](http://localhost:5174/#rez=50.010233,14.540715,113,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.010233,14.540715,113,22.0,22.0) |
| Praha | Wilsonova | pruhy 3,20–4,50, nová krajnice 1,33 | [s ortofotem](http://localhost:5174/#rez=50.089292,14.437761,-180,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.089292,14.437761,-180,22.0,22.0) |
| Praha | Hlávkův most | pruhy vedle tramvaje 3,97/3,20 a 3,00/4,27 | [s ortofotem](http://localhost:5174/#rez=50.095965,14.437029,-178,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.095965,14.437029,-178,22.0,22.0) |
| Brno | Olomoucká | šrafy 2,18 u zeleného pásu, krajnice 0,97 u kraje, pruhy 3,40–3,50 | [s ortofotem](http://localhost:5174/#rez=49.189407,16.637379,98,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.189407,16.637379,98,22.0,22.0) |
| Brno | Jedovnická | 3 × 3,30 → krajnice 0,37 + 3,80 + 3,30 + šrafy 2,43 | [s ortofotem](http://localhost:5174/#rez=49.199509,16.665877,-172,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.199509,16.665877,-172,22.0,22.0) |
| Brno | bez názvu | pruhy přeměřené, krajnice 1,37, 0,72, 0,93 a 0,18 | [s ortofotem](http://localhost:5174/#rez=49.263168,16.575021,-7,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.263168,16.575021,-7,22.0,22.0) |
| Plzeň | Konopná | jen drobné přeměření (6,00 → 5,93) | [s ortofotem](http://localhost:5174/#rez=49.755318,13.299881,19,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.755318,13.299881,19,22.0,22.0) |
| Plzeň | bez názvu | krajnice 1,62 a 1,88, úzké krajnice u středu 0,38 a 0,27 | [s ortofotem](http://localhost:5174/#rez=49.746305,13.455635,91,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.746305,13.455635,91,22.0,22.0) |
| Plzeň | Jateční | 2 × 3,50 → krajnice 0,27 + 3,10 + 3,63 (ojetý asfalt už není čára) | [s ortofotem](http://localhost:5174/#rez=49.763974,13.402121,-7,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.763974,13.402121,-7,22.0,22.0) |
| Hradec | Pouchovská | cyklopruh 1,81, pruhy 3,13 a 3,46 | [s ortofotem](http://localhost:5174/#rez=50.219471,15.842291,-15,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.219471,15.842291,-15,22.0,22.0) |
| Hradec | Kutnohorská | úzké krajnice 0,40 a 0,19, pruhy 3,50 a 3,25 | [s ortofotem](http://localhost:5174/#rez=50.194307,15.776800,-170,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.194307,15.776800,-170,22.0,22.0) |
| Hradec | Polákova | beze změny, ulice nemá vodorovné značení | [s ortofotem](http://localhost:5174/#rez=50.210413,15.816519,123,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.210413,15.816519,123,22.0,22.0) |
| Ostrava | Bohumínská | krajnice potvrzené čarou 1,29 a 1,99, pruhy 3,63 | [s ortofotem](http://localhost:5174/#rez=49.875167,18.301404,-126,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.875167,18.301404,-126,22.0,22.0) |
| Ostrava | Místecká | úzká krajnice 0,20, pruhy 3,63–4,31, krajnice 3,51 | [s ortofotem](http://localhost:5174/#rez=49.798147,18.271812,-179,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.798147,18.271812,-179,22.0,22.0) |
| Ostrava | Mitrovická | pruhy 3,52 a 3,13, úzká krajnice 0,19 | [s ortofotem](http://localhost:5174/#rez=49.761238,18.236024,125,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.761238,18.236024,125,22.0,22.0) |
