# San Francisco: šikmé stání z OSM a osa ve vykrojeném stání (27. 11. 2026)

Dvě opravy z backlogu (`../ZPRAVA.md`: Indiana Street s-21, Lippard Avenue s-36). **Výsledek: ani jedna se neprokázala,
obě zůstávají vypnuté** (`?sfosmpark=1`, `?axisroad=1`).

## (a) Orientace stání z OSM (`towns/sanfrancisco.js curbParking`, `?sfosmpark=1`)

Příčina: digitální obruba SFMTA dá šikmé stání jen tehdy, má-li nejdelší zóna aut aspoň 3 místa po méně než 14 ft; Indiana
Street má jednu dlouhou zónu, takže podélné 2,45 m, OSM má `parking:lane:left=perpendicular`. Oprava: kde obruba stání
dovoluje a sama by dala podélné, rozhodne orientace z OSM té strany cesty (`ortho-osm.js parkingOrient`, nové i staré
schéma `parking:*`): šikmé nebo kolmé 4,88 m, orientace jde s plochou až do profilu (atribut `ORIENT`, `derive.js`).
Na Indiana Street dá kolmé 4,9 m.

A/B: `sample.mjs angled 45` (semínko 20261127): 45 nových náhodných bodů na cestách, které mají v OSM šikmé nebo kolmé stání,
dál než 150 m od řezů čerstvého měření i od sebe, s fotkou Mapillary. Změna u 30. Slepě dva posuzovatelé (Sonnet,
`../../fresh/POKYN-AB.md`, snímky Esri jako v `../measure.sh`), `results/score.md`:

| | dvojic | s opravou : bez | nerozhodně | nejde | p |
|---|---|---|---|---|---|
| všechny | 30 | **12 : 11** | 6 | 1 | 1,0 |
| místní | 19 | 7 : 7 | 4 | 1 | |
| tepny | 6 | 3 : 3 | 0 | 0 | |
| sběrné | 5 | 2 : 1 | 2 | 0 | |

Shoda posuzovatelů 19/30. Značky v OSM často neplatí pro místo řezu (šikmé stání na části bloku, jinde podélné), posuzovatelé
viděli podélná auta tam, kde OSM říká šikmé. **Vypnuto.**

## (b) Úzká vozovka bez pruhu (`derive.js`, `?axisroad=1`)

Příčina (Lippard Avenue): vozovka mezi obrubami 7,2 m, obruba vykrojí stání 2,4 m a osa OSM padne do stání. Oprava osy
v `derive.js` ji přesune na zbylou vozovku 4,8 m, tu ale přechází jen chodník (`highway=footway`) a ne vlastní cesta ulice,
takže ji pravidlo pro přístupové plochy udělá chodníkem. Oprava: vozovka, na kterou oprava osy osu přesunula, je ulice
(`ownRoad`). Na Lippard Avenue „pruh 4,8“.

Kontrola na 290 řezech pěti měst (Washington 60, Toronto 60, New York 50, San Francisco 60, Boston 60; `ctl-axisroad.json`,
s opravou a bez): mění se **1 z 290** (právě Lippard Avenue), v novém vzorku (a) žádný. Na A/B s 20 řezy takových není dost,
proto **vypnuto** podle pravidla „co neprokáže zlepšení, zůstane vypnuté“ **(Bára: zapnout bez měření? Je to oprava chyby
s jediným známým případem)**.

## Kontroly

- S výchozím nastavením jsou s-21 a s-36 stejné jako v čerstvém měření; ostatní řezy San Franciska, New Yorku (50/50)
  a Bostonu taky. Toronto má proti uloženému měření 3 rozdíly ze starších commitů (pravidla mapgaps, roadtracks), s opravou
  i bez stejné.
- Washington `evaluation/canada/dc-same.mjs` bajt po bajtu stejný, `node evaluation/ortofoto-osm/regrese.mjs` beze změny,
  `npm test` prošel (testy v `tests/sanfrancisco.test.js`, `tests/derive.test.js`).
