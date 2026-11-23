# A/B: budovy z katastru GURS ve Slovinsku (23. 11. 2026)

Co se zkoušelo: bez katastru by aplikace kreslila dům ve Slovinsku jen z OSM. Nově se ptá katastru nemovitostí GURS
(`pilot/public/towns/slovenia.js`, WFS `wfs-si-gurs-kn`, vrstva STAVBE, jeden malý dotaz na fasádu: obrys `OBRIS_GEOM`
v bodě 4 m uvnitř domu, jinak nejbližší obrys do 6 m druhým dotazem). A = `?gurs=0` (jen OSM), B = s katastrem. Vzhled
domu je `profile.js buildingStyle` se stejným slučováním údajů jako v `app.js`.

Skripty: `sample.mjs` (vzorek, semínko 20261130), `run.mjs` (dotazy, `vysledky/rezy.json`, `vysledky/osm-levels.json`),
`photos.mjs` (fotky Mapillary do `data/foto/`, necommitují se). OSM je lokální výřez Geofabriku (`data/osm/si`). Dotazy
ohleduplně: pauza 1,5 s, odpovědi v `data/answers.json`, celkem asi 140 malých dotazů na GURS a 40 na Mapillary.

Zjištění při ladění: v Mariboru má katastr u mnoha domů prázdný půdorys `TLORIS_GEOM` (16 z 20 domů vzorku bez odpovědi);
obrys `OBRIS_GEOM` mají všechny, proto se filtruje podle něj. Výchozí geometrie vrstvy je těžiště, `BBOX` v URL proto
hledá těžiště, ne dům; filtr CQL server odmítá (403), filtr FES funguje.

## Vzorek a pokrytí

14 náhodných bodů na ulicích (residential, tertiary, secondary, primary) do 1,8 km od středu Lublaně a Mariboru, domy
po obou stranách do 40 m: 40 domů (Lublaň 20, Maribor 20).

| | domů | podlaží A (OSM) | podlaží B (katastr) | rok A | rok B | jiný vzhled |
|---|---|---|---|---|---|---|
| Lublaň | 20 | 7 | 19 | 0 | 19 | |
| Maribor | 20 | 10 | 20 | 0 | 20 | |
| celkem | 40 | 17 | 39 | 0 | 39 | 24 |

Žádný dotaz neselhal. A kreslí bez údajů skoro všude výchozí činžák se šikmou střechou (`sikma` 33× ze 40); B dá domům
podlaží, rok a druh: činžák zůstává 10×, dále poválečný bytový dům 5×, nízký dům 5×, vila 5×, funkcionalismus 4×,
moderní 3×, kanceláře 3×, „kostka“ 2×, nový rodinný dům 1×.

## Shoda s OSM `building:levels`

Kde OSM podlaží má: 15 náhodných budov OSM s `building:levels` v centru každého města (`osm-levels.json`), rozdíl
katastr − OSM:

| Město | budov | s odpovědí katastru | stejně | ±1 | medián |
|---|---|---|---|---|---|
| Lublaň | 15 | 15 | 10 | 14 | 0 |
| Maribor | 14 | 14 | 9 | 11 | 0 |

Ve vzorku domů ulic mají údaj oba zdroje u 17 domů: stejně 6, ±1 12, rozdíly −4 až +3. Výklad počtu podlaží
(`STEVILO_ETAZ − STEVILKA_PRITL_ETAZE + 1`, podzemní podlaží se odečtou) tedy s OSM souhlasí.

## Fotky z ulice (Mapillary)

Fotku směrem k domu (do 40 m, odchylka do 30°) má 22 ze 40 domů, většinou z kamery v autě podél ulice, takže dům často
není jednoznačný. Posoudit šlo asi 9 domů:

| dům | katastr | OSM | na fotce | poznámka |
|---|---|---|---|---|
| lj5-left | 2 | 2 | 2 | ✓ |
| lj13-right | 3 | – | 3 (moderní dům) | ✓ |
| lj4-right | 6 | – | asi 6 | ✓ |
| ma2-left | 5 | 5 | 5 | ✓ |
| ma4-right | 1 | – | hala 1 | ✓ |
| lj12-left | 3 | – | 2 + podkroví s vikýři | katastr počítá podkroví |
| ma11-right | 2 | – | 1 + podkroví | katastr počítá podkroví |
| ma3-right | 2 | – | 1 + podkroví | katastr počítá podkroví |
| ma14-right | 3 | – | 2 + podkroví | katastr počítá podkroví |

Katastr tedy počítá obytné podkroví jako podlaží; aplikace ho kreslí jako plné patro (o patro vyšší dům se šikmou
střechou). OSM tyto domy podlaží nemá vůbec (A kreslí výchozí činžák). Vzorek fotek je malý.

## Verdikt

**B je lepší**: podlaží u 39 ze 40 domů proti 17, rok u 39 proti 0, shoda s OSM tam, kde OSM údaj má. Katastr zůstává
zapnutý (`?gurs=0` ho vypne). Otevřené: podkroví počítané jako podlaží (rozlišit by šlo snad podle výšky H2 − H1 nebo
vrstvy `ETAZE`, neověřeno).
