# Odkazy na vyzkoušení prototypu (pruhy a krajnice z ortofota)

Spustit server z pracovní kopie s pokusem (z hlavní složky projektu):

```bash
PORT=5174 node .claude/worktrees/ortofoto/pilot/server.mjs
```

Části z ortofota mají ve zdroji „podle čar na ortofotu“ (oranžový proužek pod částí). Odkaz „bez“ (`?orto=0`) ukáže profil podle pravidel.

| město | ulice | co se mění | | |
|---|---|---|---|---|
| Praha | Poděbradská | krajnice 2,40 + 2 × 3,75 → krajnice 1,95 + 2 × 3,98 | [s ortofotem](http://localhost:5174/#rez=50.103357,14.517910,-99,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.103357,14.517910,-99,22.0,22.0) |
| Praha | Rozvadovská spojka | krajnice za vodicí čárou 2,93 a 2,67 m, pruhy 3,80–4,23 | [s ortofotem](http://localhost:5174/#rez=50.053983,14.318132,-98,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.053983,14.318132,-98,22.0,22.0) |
| Praha | Brněnská | 8 pruhů po 3,60–3,90, krajnice 1,78 a 3,07 | [s ortofotem](http://localhost:5174/#rez=50.010233,14.540715,113,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.010233,14.540715,113,22.0,22.0) |
| Praha | Wilsonova | pruhy 3,20–4,50, nová krajnice 1,30 | [s ortofotem](http://localhost:5174/#rez=50.089292,14.437761,-180,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.089292,14.437761,-180,22.0,22.0) |
| Praha | Hlávkův most | pruhy vedle tramvaje 3,97/3,20 a 3,00/4,27 | [s ortofotem](http://localhost:5174/#rez=50.095965,14.437029,-178,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.095965,14.437029,-178,22.0,22.0) |
| Brno | Olomoucká | krajnice 3,33 + pruhy 3,10–3,72 (městské ortofoto s opravou posunu) | [s ortofotem](http://localhost:5174/#rez=49.189407,16.637379,98,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.189407,16.637379,98,22.0,22.0) |
| Brno | Jedovnická | pruhy 4,00 → krajnice 1,48 + 3,30 + 3,22 | [s ortofotem](http://localhost:5174/#rez=49.199509,16.665877,-172,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.199509,16.665877,-172,22.0,22.0) |
| Brno | bez názvu | šest pruhů přeměřených, krajnice 2,17 | [s ortofotem](http://localhost:5174/#rez=49.263168,16.575021,-7,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.263168,16.575021,-7,22.0,22.0) |
| Plzeň | Konopná | pruh 6,00 → pruh 3,53 + krajnice 2,47 | [s ortofotem](http://localhost:5174/#rez=49.755318,13.299881,19,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.755318,13.299881,19,22.0,22.0) |
| Plzeň | bez názvu | krajnice a pruhy na obou vozovkách | [s ortofotem](http://localhost:5174/#rez=49.746305,13.455635,91,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.746305,13.455635,91,22.0,22.0) |
| Plzeň | Jateční | 2 × 3,50 → krajnice 1,93 + pruh 3,30 + krajnice 1,77 | [s ortofotem](http://localhost:5174/#rez=49.763974,13.402121,-7,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.763974,13.402121,-7,22.0,22.0) |
| Hradec | Pouchovská | cyklopruh 1,81, pruhy 3,13 a 3,46 | [s ortofotem](http://localhost:5174/#rez=50.219471,15.842291,-15,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.219471,15.842291,-15,22.0,22.0) |
| Hradec | Kutnohorská | pruhy 3,44 a 3,90 | [s ortofotem](http://localhost:5174/#rez=50.194307,15.776800,-170,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.194307,15.776800,-170,22.0,22.0) |
| Hradec | Polákova | 2 × 2,67 → pruh 3,90 + krajnice 1,44 | [s ortofotem](http://localhost:5174/#rez=50.210413,15.816519,123,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=50.210413,15.816519,123,22.0,22.0) |
| Ostrava | Bohumínská | krajnice potvrzené čarou 1,29 a 1,99, pruhy 3,63 | [s ortofotem](http://localhost:5174/#rez=49.875167,18.301404,-126,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.875167,18.301404,-126,22.0,22.0) |
| Ostrava | Místecká | krajnice 3,41, pruhy 3,63–4,31, na druhé vozovce 3 pruhy | [s ortofotem](http://localhost:5174/#rez=49.798147,18.271812,-179,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.798147,18.271812,-179,22.0,22.0) |
| Ostrava | Mitrovická | pruhy 3,31 a 3,53 | [s ortofotem](http://localhost:5174/#rez=49.761238,18.236024,125,22.0,22.0) | [bez](http://localhost:5174/?orto=0#rez=49.761238,18.236024,125,22.0,22.0) |
