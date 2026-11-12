# Odkazy na vyzkoušení prototypu (pruhy a krajnice z ortofota)

Spustit server z pracovní kopie s pokusem (z hlavní složky projektu):

```bash
PORT=5174 node .claude/worktrees/ortofoto/pilot/server.mjs
```

Části z ortofota mají ve zdroji „podle čar na ortofotu“ (oranžový proužek pod částí). Odkaz „bez“ (`?orto=0`) ukáže profil podle pravidel. Krajnici dělá i čára u obruby, tedy i úzkou (od 10 cm; Bára 12. 11. 2026).

| město | ulice | co se mění | | |
|---|---|---|---|---|
| Praha | Poděbradská | u A tři pruhy 2,62 + 3,30 + 3,98 (čára zakrytá autem) | [s ortofotem](http://localhost:5174/#rez=50.103357,14.517910,-99,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.103357,14.517910,-99,22.0,22.0) |
| Praha | Rozvadovská spojka | krajnice za vodicí čárou 2,72 a 2,93, úzké u středu 0,43 a 0,37, pruhy 3,80–4,00 | [s ortofotem](http://localhost:5174/#rez=50.053983,14.318132,-98,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.053983,14.318132,-98,22.0,22.0) |
| Praha | Brněnská | 8 pruhů 3,60–3,90, zpevněný střední pás 4,50 jako krajnice, krajnice 3,07 a 1,78 | [s ortofotem](http://localhost:5174/#rez=50.010233,14.540715,113,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.010233,14.540715,113,22.0,22.0) |
| Praha | Wilsonova | pruhy 3,30–4,63; lampa ve středu na obě strany | [s ortofotem](http://localhost:5174/#rez=50.089292,14.437761,-180,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.089292,14.437761,-180,22.0,22.0) |
| Praha | Hlávkův most | pruhy vedle tramvaje 4,27/3,00 a 3,20/3,97; profil končí za chodníkem mostu | [s ortofotem](http://localhost:5174/#rez=50.095965,14.437029,-178,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.095965,14.437029,-178,22.0,22.0) |
| Brno | Olomoucká | šrafy 2,18 u zeleného pásu, krajnice 0,97, pruhy 3,10–3,71; troleje jen nad krajními pruhy | [s ortofotem](http://localhost:5174/#rez=49.189407,16.637379,98,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.189407,16.637379,98,22.0,22.0) |
| Brno | Jedovnická | krajnice 0,37, pruh 3,80 a široký 5,73 (přidávání pruhu) | [s ortofotem](http://localhost:5174/#rez=49.199509,16.665877,-172,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.199509,16.665877,-172,22.0,22.0) |
| Brno | bez názvu | pruhy přeměřené, krajnice 1,37, 0,18 a 0,72, pruh 4,73 | [s ortofotem](http://localhost:5174/#rez=49.263168,16.575021,-7,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.263168,16.575021,-7,22.0,22.0) |
| Plzeň | Konopná | stání z dlažby 2,20 i na druhé straně, pruh 3,73 | [s ortofotem](http://localhost:5174/#rez=49.755318,13.299881,19,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.755318,13.299881,19,22.0,22.0) |
| Plzeň | bez názvu | krajnice 1,72 a 1,88, úzké u středu 0,38 a 0,27 | [s ortofotem](http://localhost:5174/#rez=49.746305,13.455635,91,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.746305,13.455635,91,22.0,22.0) |
| Plzeň | Jateční | krajnice 0,27, pruhy 3,10 a 3,63 (ojetý asfalt není čára); zpevněný pás místo zdi | [s ortofotem](http://localhost:5174/#rez=49.763974,13.402121,-7,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.763974,13.402121,-7,22.0,22.0) |
| Hradec | Pouchovská | pruhy 3,46 a 3,13 | [s ortofotem](http://localhost:5174/#rez=50.219471,15.842291,-15,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.219471,15.842291,-15,22.0,22.0) |
| Hradec | Kutnohorská | úzké krajnice 0,40 a 0,19, pruhy 3,50 a 3,25 | [s ortofotem](http://localhost:5174/#rez=50.194307,15.776800,-170,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.194307,15.776800,-170,22.0,22.0) |
| Hradec | Polákova | beze změny, bez vodorovného značení | [s ortofotem](http://localhost:5174/#rez=50.210413,15.816519,123,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.210413,15.816519,123,22.0,22.0) |
| Ostrava | Bohumínská | krajnice 1,99 a 1,29, pruhy 3,63 | [s ortofotem](http://localhost:5174/#rez=49.875167,18.301404,-126,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.875167,18.301404,-126,22.0,22.0) |
| Ostrava | Místecká | krajnice 3,84 za plnou čarou, pruhy 3,51–4,31 | [s ortofotem](http://localhost:5174/#rez=49.798147,18.271812,-179,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.798147,18.271812,-179,22.0,22.0) |
| Ostrava | Mitrovická | pruhy 3,53 a 3,31 (bez jednostranné krajnice) | [s ortofotem](http://localhost:5174/#rez=49.761238,18.236024,125,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.761238,18.236024,125,22.0,22.0) |
| Brno | bez názvu (u A) | krajnice 3,62 za plnou čarou, pruhy 4,00 a 3,90 | [s ortofotem](http://localhost:5174/#rez=49.266264,16.575157,-172,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.266264,16.575157,-172,22.0,22.0) |
| Brno | VMO Dobrovského | lampy svítí na vozovku; krajnice 1,98 a 0,47 | [s ortofotem](http://localhost:5174/#rez=49.220002,16.609398,84,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.220002,16.609398,84,22.0,22.0) |
| Hradec | 2997 | dva pruhy bez krajnice (ČÚZK: čára jen u jedné obruby) | [s ortofotem](http://localhost:5174/#rez=50.248881,15.854711,-22,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.248881,15.854711,-22,22.0,22.0) |
| Hradec | 324 | podle pravidel 2 × 4,10 (nevyježděné pásy, na příště) | [s ortofotem](http://localhost:5174/#rez=50.183229,15.773834,-170,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.183229,15.773834,-170,22.0,22.0) |
