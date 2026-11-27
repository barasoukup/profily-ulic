# Estonsko (EE): zdroje, přesnost a recenze (stav 24. 11. 2026)

Stát `estonia` (`countries/EE.js`, `towns/estonia.js`, `search-ee.js`, `signs-EE/`). Zdroje a licence `SOURCES.md`, normy
`NORMS.md`, A/B mapy Tallinnu a budov ETAK `ab/REPORT.md`.

## Jak se profil skládá

- Všude: odhad z OSM a ortofota Maa- ja Ruumiamet (dlaždice TMS 30 cm, nálet 2024, `lanes-ortho.js` „ee“).
- Tallinn: mapa povrchů města (`tar_maakate`), jen když je pod středem řezu její vozovka (ulice pro auta) nebo chodník
  (pěší cesta); `?tallinn=0` vypne. Slepé A/B na 39 pojmenovaných ulicích: lépe s mapou 10, bez ní 4, stejně 15, nejde 10.
- Budovy ETAK (výška k hřebeni, druh): podlaží (výška − 3) / 3 jen tam, kde OSM podlaží nemá; `?etak=0` vypne.
  A/B 15 domů Kalamaje proti fotkám: odchylka 1,40 → 0,73 podlaží.
- Hledání In-ADS (domy, ulice, obce a kraje EHAK).

## Univerzální měření (skill `mereni-presnosti`)

Dnešní `node evaluation/universal/score-states.mjs` (pravidlo stran bez fasády z 24. 11. 2026, profily aplikace
z 23. 11., tedy ještě s volnějším pravidlem mapy Tallinnu a výškou ETAK / 3):

| stát | řezů | složení stejné | shoda složení | pruhy stejně | šířka do 1 / 2 m |
|---|---|---|---|---|---|
| EE | 12 | 8 % | 43 % | 33 % | 25 % / 25 % |

- Posudků je 13, řezů 12: jeden posudek skript nezapočítá (nejspíš `ee-tallinn-4`, bez fasád a bez vozovky, jen zeleň
  a chodník; neověřeno). 17 řezů vzorku (Viljandi, Rakvere, jeden v Pärnu) aplikace vrátila bez profilu, posudky nemají.
- Dřívější „51 %“ (v `CLAUDE.md`) se počítalo starším pravidlem (bez pravidla stran bez fasády) a „45 → 51 %“ díky mapě
  Tallinnu stojí na 4 tallinnských řezech (n = 4; dva ve Starém Městě, kde posuzovatel píše „ortofoto nečitelné“).
  Profily aplikace (`evaluation/universal/data/app-ee.json`) nejsou v gitu; po opravách z 24. 11. je potřeba měření
  zopakovat (krok měření).
- Nejčastější rozdíly: chybí chodník 3×, navíc zeleň 3×, navíc pruh 3×.

## Recenze 24. 11. 2026

Nepřátelská recenze (Fable, 15 nálezů; soubor recenze není v repozitáři, poznámky k bodům má u sebe). Hlavní opravy: hledání In-ADS (filtr `features` jen s hodnotami, které služba
přijímá, test nad nahranou odpovědí `tests/fixtures/estonia-inads.json`), výška ETAK, normy z druhé ruky jen oranžově,
pravidlo a slepé A/B mapy Tallinnu, kredity s názvem dat a stářím.

## Před nasazením

- Balík OSM `ee` na R2 není (`https://data.streetspace.eu/osm/index.json`, 24. 11. 2026): spustit workflow OSM tiles ručně
  se `states: ee` a ověřit index.
- Licence: In-ADS a mapa Tallinnu licenci neuvádějí; dotaz městu Tallinnu zatím neodeslán (rozhodne Bára).
