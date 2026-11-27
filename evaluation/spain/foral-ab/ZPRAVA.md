# A/B: budovy z foralních katastrů Navarry a Baskicka (23. 11. 2026)

Co se zkoušelo: v Navaře a ve třech baskických provinciích (Álava, Bizkaia, Gipuzkoa) se aplikace dosud na budovy
neptala nikoho (Catastro tam nic nemá), dům se kreslil jen z OSM. Nově se ptá foralního katastru provincie
(`app/public/towns/spain-foral.js`, INSPIRE WFS, jeden dotaz na fasádu, bod 4 m uvnitř domu jako v aplikaci).
A = `?foral=0` (stav dřív: jen OSM), B = `?foral=1`. Vzhled domu je `profile.js buildingStyle` se stejným slučováním
údajů jako v `app.js`.

Skripty: `sample.mjs` (vzorek, semínko 20261127), `run.mjs` (dotazy, výsledky `vysledky/rezy.json` a
`vysledky/osm-levels.json`), `photo-sample.mjs` a `photos.mjs` (fotky Mapillary, `vysledky/foto.json`). OSM baskických
měst je výřez z lokálního `data/osm/es/pais-vasco.osm.pbf` (osmium, `data/extract.sh`; data se necommitují, ODbL).
**Navarra není v žádném lokálním výřezu OSM ani v balíku na R2** (na R2 je jen `es_pv` a `es_ic`), proto se v Pamploně
body brají jako náhodná místa v ulici a dům jako nejbližší budova z katastru Navarry; srovnání s OSM tam chybí.
Dotazy ohleduplně: pauza 1,5 s, odpovědi uložené v `data/answers.json`, celkem asi 120 malých dotazů na čtyři služby.

## Vzorek

10 náhodných bodů na ulicích (residential, primary, secondary) do 1,8 km od středu v každém městě, domy po obou
stranách do 40 m: Bilbao 15 domů, Donostia 16, Vitoria-Gasteiz 16, Pamplona 10 (jen nejbližší dům), celkem 57.

## Pokrytí (kolik domů má podlaží a rok)

| Město (katastr) | domů | podlaží A | podlaží B | rok A | rok B | jiný vzhled |
|---|---|---|---|---|---|---|
| Bilbao (Bizkaia) | 15 | 0 | 15 | 0 | 15 | 14 |
| Donostia (Gipuzkoa) | 16 | 3 | 15 | 0 | 15 | 11 |
| Vitoria-Gasteiz (Álava) | 16 | 1 | 15 | 0 | 15 | 15 |
| Pamplona (Navarra) | 10 | – (bez OSM) | 10 | – | 10 | – |

Bez katastru aplikace v Baskicku skoro nic neví: OSM má `building:levels` jen u 4 ze 47 domů a rok u žádného, takže
A kreslí skoro všude výchozí činžák se šikmou střechou (`sikma`, 43 ze 47). B dá domům podlaží, rok i užití: nejčastěji
funkcionalistický dům (25×), moderní bytový dům (8×), kanceláře, nízký dům, halu. Katastr neodpověděl domem jen ve 2
případech (do4-right, vi2-left: bod mimo budovu katastru). Žádná služba neselhala ani nepřekročila limit 25 s.

## Shoda s OSM `building:levels`

Kde OSM podlaží má, je vzorek malý (4 domy), proto zvlášť 15 náhodných budov OSM s `building:levels` v každém
baskickém městě (`osm-levels.json`). Rozdíl katastr − OSM:

| Město | budov | s odpovědí katastru | stejně | ±1 | medián rozdílu |
|---|---|---|---|---|---|
| Bilbao | 15 | 13 | 5 | 10 | +1 |
| Donostia | 15 | 12 | 5 | 11 | +1 |
| Vitoria-Gasteiz | 14 | 12 | 1 | 3 | +2 |

Katastr má obvykle o podlaží víc než OSM. V Bilbau a Donostii je to nejspíš počítání přízemí (španělské „planta baja“
mapovatelé často nepočítají; u domů s fotkou sedí katastr, viz níže). Ve Vitorii je rozdíl soustavně +2: katastr Álavy
kreslí obrys jako „aboveGroundEnvelope“ celé budovy na parcele a jeho výška sedí na jeho podlaží (18 m na 6 podlaží,
24 m na 8), OSM tam ale mívá nízké díly bloku (3 a 4 podlaží). Kdo má pravdu, rozhodne až fotka (neověřeno).

## Fotky z ulice (Mapillary)

Mapillary je v těchto městech řídký: u 57 domů vzorku byla fotka směrem k domu jen u 12, v samostatném fotografickém
vzorku (náhodné fotky, první budova ve směru pohledu, 40 pokusů na město) jen 14 domů a většinou dům na fotce není celý
(ve středu snímku strom, interiér, ulice do dálky). Posoudit podlaží šlo jen u 5 domů:

| dům | katastr (B) | OSM (A) | na fotce | B | A |
|---|---|---|---|---|---|
| bif4 Bilbao (nároží u Guggenheimu) | 7 | 7 | 7 nad zemí + podkroví | ✓ | ✓ |
| dof1 Donostia (nádražní budova) | 2 | – | 2 | ✓ | – |
| dof2 Donostia (vila) | 4 | – | 3 + podkroví | ✓ | – |
| vif1 Vitoria (krytá herna) | 1, hala | – | 1, hala | ✓ | – |
| vif3 Vitoria (cihlový blok) | 8 | – | aspoň 7, horní okraj uříznutý | asi ✓ | – |

S katastrem správně 4–5 z 5, bez něj 1 z 5. Cíl 10–15 domů na město fotkami splnit nešlo (Pamplona žádný posouditelný).

## Verdikt

| Katastr | pokrytí | shoda | verdikt |
|---|---|---|---|
| Navarra (Pamplona) | 10 z 10 | bez OSM nelze; dotazy i čtení v pořádku | **zapnout** |
| Gipuzkoa (Donostia) | 15 z 16 | ±1 u 11 z 12, fotky sedí | **zapnout** |
| Bizkaia (Bilbao) | 15 z 15 | ±1 u 10 z 13, fotka sedí | **zapnout** |
| Álava (Vitoria-Gasteiz) | 15 z 16 | soustavně +2 proti OSM, fotky 2 z 2 sedí | **zapnuto** (po ověření na fotkách, viz níže) |

Všechny čtyři zdroje pokrytí zlepšují zásadně (z téměř nuly na skoro všechny domy) a kde je co srovnat, sedí, proto
jsou v kódu zapnuté (`FORAL_ON` v `spain-foral.js`; `?foral=0` vše vypne, `?foral=nc,gi,bi` jen vybrané). Výhrada
u Álavy: rozdíl +2 proti OSM nevysvětlený, ověřit na fotkách z ulice (Street View) nebo u Báry; kdyby se potvrdilo
nadhodnocení, Álavu vypnout (`FORAL_ON` bez `ar`).

Vedlejší nález (platí i pro Catastro v ostatním Španělsku): rok z katastru jde v `buildingStyle` přes `yearLook`, takže
španělský dům z let 1948–57 dostane vzhled „sorela“ a z let 1958–69 „typový dům“ z českého katalogu (ve vzorku 5×).
`countries/ES.js houseLook` je nepřemapuje. Zapsáno do `docs/backlog.md`.


## Proč katastr hlásí víc podlaží než OSM (23. 11. 2026)

Medián rozdílu katastr − OSM `building:levels`: Bilbao +1, Donostia +1, Vitoria +2, Pamplona +2 (`vysledky/osm-levels.json`).
`roof:levels` rozdíl nevysvětluje (přičtený k OSM mění skoro nic). Fotky Mapillary domů s největším rozdílem:

| dům | katastr | OSM | na fotce |
|---|---|---|---|
| Pamplona, staré město (42,8166; −1,6440; 1900) | 7 | 4 | obchodní přízemí + 5–6 pater s balkony |
| Pamplona, staré město (42,8160; −1,6475; 1900) | 6 | 4 | přízemí + 4–5 pater s balkony + podkroví |
| Vitoria (42,8512; −2,6848; 1977) | 8 | 6 | přízemí s obchody + asi 7 pater |

Fotky dávají za pravdu katastru. Systematická příčina je na straně OSM: ve Španělsku se výška domu udává jako „B+4“
(planta baja + 4 patra) a mapovači zapisují jen patra nad přízemím, podkroví (bajocubierta) vynechají nebo dají do
`roof:levels`; katastr počítá všechna nadzemní podlaží. Navarra uvádí i výšku, ta je ale dopočtená (6 podlaží → 18,0 m).
Álava je proto znovu zapnutá (Bára 23. 11. 2026: vypnout jen do ověření na fotkách). Důsledek pro zbytek Španělska:
kde dům nemá katastr, OSM `building:levels` nejspíš o 1–2 podlaží podhodnocuje (neopravuje se, chybí měření).
