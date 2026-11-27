# Lombardie: mapa povrchů DBT místo ortofota (24. 11. 2026)

Bára 24. 11. 2026: „mapa povrchů je pro nás lepší než ortofoto, vezmi nejnadějnější zdroj a jdi do toho.“ Zdroj z průzkumu
`evaluation/povrchy-evropa/B-mezery.md`: **Database Topografico Regionale (DBT)** Regione Lombardia.

## Zdroj a licence

- Služba ArcGIS `https://www.cartografia.servizirl.it/arcgis2/rest/services/BaseMap/dbtr/MapServer` (WGS 84 / UTM 32N,
  CORS vrací náš Origin). Vrstvy: 106 Area di circolazione veicolare (ZONA: tronco carreggiata, incrocio, rotatoria,
  **fascia di sosta laterale**, isole di traffico, in area di pertinenza…), 105 Area di circolazione pedonale (su
  marciapiede, su salvagente, area a porticato, vialetto, vicolo…), 103 ciclabile, 114 Sede di trasporto su ferro, 101
  Area verde (aiuola, prato, giardino), 113 Area attrezzata del suolo (cortile, corte), 97 Corpo edificato (s užitím
  budovy), 94 Unità volumetrica (s výškou `un_vol_av`), 109/110 voda. Přesnost 1 : 1 000 ve městech.
- **Geometrii vrací jen `identify`** (dotaz `query` ji vynechá, vrstvy mají Z; `f=kmz` ji má taky). Aplikace se ptá
  jedním `identify` na všechny vrstvy obdélníku řezu (asi 0,3–1,1 s, ~100 kB). Mřížka 50 × 50 bodů kolem 10 řezů:
  plochy pokrývají 98–100 % (souvislá mozaika), překryv jen podloubí s budovou.
- **Pokrytí**: všech 1 502 obcí regionu (dati.lombardia.it `82bu-bgvn` „Elenco stato di Avanzamento… DbT“, CC0):
  Milano 2020, Varese 2022, Lecco 2021, Monza 2015, Como 2014, Mantova 2013, Pavia 2012, Cremona 2011, Bergamo a Lodi
  2008, Brescia 2007 (rok zaměření/aktualizace; starší města mohou mít zastaralé uspořádání ulic).
- **Licence: CC BY 4.0.** Záznam Geoportale Lombardia `r_lombar:1CE0E71B-6451-4B5D-8E4D-BC0FF6E0A46F` „Database
  Topografico (DBT) regionale“ (CSW `https://www.geoportale.regione.lombardia.it/geoportal/csw`, GetRecordById, datum
  záznamu 2022-12-28): `useLimitation` „CC-BY 4.0“ s odkazem https://creativecommons.org/licenses/by/4.0/deed.it,
  `otherConstraints` „Dati di proprietà di Regione Lombardia“. Stejně „Carta Base da DBT“ a výřezy DBT na
  dati.lombardia.it (Edifici da DBT, Creative Commons Attribution 4.0). Kredit v aplikaci: „mapa povrchů (Database
  Topografico) © Regione Lombardia (CC BY 4.0)“.
- Hranice Lombardie pro `staty.json`: „Limiti amministrativi Regione Lombardia 2020 con aggiornamenti DbT/PGT“
  (dati.lombardia.it `b7fb-r6ie`, CC0 1.0), `tools/lombardy-border.json` (zjednodušeno na 5 m; s Campione d'Italia,
  exklávami u Piemontu a dírami v Oltrepò).

## Jak to aplikace dělá (`app/public/towns/lombardy.js`)

- V Lombardii (`inLombardy`: obdélník regionu bez Jižního Tyrolska u Stelvia a severních exkláv Modeny) se ptá
  DBT. Plochy jako MTVU: budovy 601/602, vozovka 701, stání (fascia di sosta, parcheggio) 704, ostrůvky a dvory nemovitostí
  1003, chodníky 702 (podloubí před budovou, jako arkády ve Vídni), cyklo 703, kolejové těleso 1100 (705, jen když jím vede
  tramvaj z OSM), zeleň 401/402, dvory 603, voda 501. Pod zemí (SEDE sotterraneo, in galleria) se vynechá.
- Jen když je pod středem řezu (nebo do 1,5 m) plocha ulice (vozovka, chodník, cyklo, stání, ostrůvek, tramvaj), jinak
  odhad z OSM. Lombardie nemá ortofoto s otevřenou licencí (AGEA), pruhy dělí jen OSM a pravidla.
- `?lombardia=0` vypne. Výpadek služby: odhad z OSM s poznámkou („mapa povrchů Lombardie neodpověděla“).
- Hláška mimo pokrytí Itálie: „…kde má otevřenou licenci ortofoto nebo mapa povrchů: v Jižním Tyrolsku, Lombardii,
  Turíně, Bologni a Modeně.“ (24 jazyků).

## A/B (vzorek `sample.json`, `sample.mjs`, sběr `sber.js`, výsledky `vysledky/rezy.json`)

41 náhodných bodů: Milán 16, Monza, Bergamo, Brescia po 3, Como, Varese, Pavia, Cremona, Mantova, Lecco, Lodi, Busto
Arsizio po 2. A = `?lombardia=0` (odhad z OSM, bez ortofota), B = s DBT. Lokální balík OSM (`?osm=balik`).

- DBT použita ve **32 řezech ze 41** (9 bez plochy ulice pod středem: galerie, dvory, pěšiny, 1 bez ulice).
- Změnilo se všech 32. **Stání**: A ho má ve 4 řezech, B v 18 (DBT kreslí „fascia di sosta laterale“; v odhadu bez
  ortofota stání chybí, nejčastější chyba měření přesnosti v AT a DE).
- **Fotky z ulice** (Mapillary, 21 řezů s fotkou, posuzovatel Sonnet naslepo, X/Y náhodně, `vysledky/posudky.json`):
  **lépe B 7, lépe A 3, nejde posoudit 11** (noční snímky, panorama z křižovatky, snímek jinde).
  - Lépe B: mil5, mil6, mil9 (stání podél obrub, úzké chodníky), mil10, mil11 (úzké dlážděné uličky s chodníky; A měl
    jen pruh 3 m), com1 (čtyři pruhy a zelený pás), bus2.
  - Lépe A: **mil7** Via Rossetti (B ztratil střední dělicí pás: v DBT je vozovka přes něj, zbylo „Neurčeno“),
    **var2** Via Carlo Croce (pěší dlážděná ulička, DBT ji má jako vozovku), **pav1** Via Morazzone (B bez chodníků,
    zeleň 20 m: řez šel přes zahradu).
- Snímky nad Esri World Imagery (`obrazky.mjs`, kopie slovenského skriptu, dlaždice z19) jsou na posouzení obrub příliš
  hrubé; zůstávají jen lokálně (`obrazky/`, `data/`, necommitované: snímky Esri nezveřejňovat).
- Opraveno během A/B: kolejové těleso jen s tramvají z OSM (dřív nádraží v Brescii jako tramvaj s nástupišti), krytá
  galerie (Galleria del Toro) už nepřebíjí budovy (zůstalo 55 m „chodníku“ v řezu podél galerie, mil14).

**Rozhodnutí: zapnuto** (B lépe 7 : 3 podle fotek, stání a skutečné šířky ploch). Lombardie je v `staty.json`
otevřená; zbytek Itálie dál `closed_it`.

## Otevřené

- Dělicí pás uprostřed vozovky (mil7) a pěší uličky vedené jako vozovka (var2): DBT je v 106 nerozlišuje; zkusit ZONA
  „isole di traffico“ a OSM `highway=pedestrian`.
- Výšky budov z vrstvy 94 (`un_vol_av`) by daly podlaží (jako Bologna); nezapojeno, potřebuje vlastní A/B.
- Starší zaměření (Bergamo, Brescia, Lodi 2007–2008): může chybět novější úprava ulic.
- Text „Profil od fasády k fasádě…“ (nápověda, 24 jazyků) a `dataShort` Itálie Lombardii nezmiňují.
- Poznámka u odhadu mimo DBT říká „odhad z ortofota a OSM“, i když v Lombardii ortofoto není (`countries/IT.js
  orthoEstimate`).

## Dlaždice OSM

Lokální balík `it` (`app/data/osm-pack/it-novy.posm`, 28,5 MB) postaven z výřezů měst vzorku z Geofabrik `nord-ovest`
(`data/osm/it/build.sh`, oddíl „Lombardy“), pak `tools/build_osm_data.sh` a `tools/pack_osm_tiles.mjs`. **Nasazení**:
workflow OSM tiles staví `it` po částech Geofabriku včetně `it_no` (`italy/nord-ovest`, `tools/countries.mjs`), takže
celou Lombardii; před nasazením ověřit, že balíky `it_*` na R2 jsou aktuální (`data.streetspace.eu/osm/index.json`).

## Tabulka řezů (A odhad z OSM, B s DBT; šířky v m)

| id | ulice | DBT | A | B |
|---|---|---|---|---|
| mil1 | Via Giulio Romano | ano | chodnik 3.9 · plocha 0.55 · stromorad 1.94 · chodnik 1.21 · cyklostezka 2 · chodnik 0.85 · parkovani 2 · pruh 2.8 · pruh 2.8 · parkovani 2 · cyklostezka 2 · chodnik 1.43 · stromorad 1.5 · chodnik 0.97 · plocha 0.65 · chodnik 3.2 | chodnik 3.6 · parkovani 2 · krajnice 0.85 · cyklostezka 2 · pruh 4.5 · pruh 4.5 · krajnice 2.85 · parkovani 2 · chodnik 0.93 · stromorad 1.5 · chodnik 5.57 |
| mil2 | Corso Monforte | ano | chodnik 3.45 · pruh 2.95 · chodnik 3.75 | chodnik 1.65 · cyklopruh 1.5 · pruh 4 · krajnice 1.25 · chodnik 1.4 |
| mil3 | Galleria privata Strasburgo | ne | chodnik 2 | = |
| mil4 | Viale dei Mille | ne | chodnik 4.3 · pruh 3.25 · pruh 3.25 · plocha 1.73 · stromorad 1.5 · plocha 10.62 · stromorad 1.5 · plocha 1.6 · pruh 3.25 · pruh 3.25 · chodnik 3.55 | = |
| mil5 | Via Cerano | ano | chodnik 2.8 · pruh 2.45 · chodnik 2.05 | chodnik 1.15 · pruh 3 · parkovani 2 · chodnik 0.95 |
| mil6 | Via Giuseppe Mercalli | ano | chodnik 2.8 · pruh 2.3 · chodnik 2.6 | chodnik 0.9 · pruh 3.4 · parkovani 2 · chodnik 1.1 |
| mil7 | Via Gabriele Rossetti | ano | chodnik 6.15 · parkovani 4.5 · pruh 2.75 · delici 4.9 · pruh 2.75 · chodnik 9.05 | chodnik 2.35 · parkovani 4.5 · krajnice 3.6 · pruh 4.5 · pruh 4.5 · krajnice 3.6 · nezname 3.55 · chodnik 3.3 |
| mil8 | Viale Umbria | ano | chodnik 1.45 · nastupiste 3 · bus 2.58 · pruh 2.58 · pruh 2.58 · plocha 2.84 · stromorad 1.5 · plocha 7.72 · stromorad 1.5 · plocha 1 · pruh 3.25 · pruh 3.25 · bus 3.25 · nastupiste 3.85 | nastupiste 3.45 · bus 3.03 · pruh 3.03 · pruh 3.03 · plocha 1.84 · stromorad 1.5 · plocha 7.72 · stromorad 1.5 · plocha 2.35 · pruh 3.03 · pruh 3.03 · bus 3.03 · nastupiste 3.65 |
| mil9 | Via Luca Signorelli | ano | chodnik 2.65 · parkovani 2 · pruh 3.55 · chodnik 3.65 | chodnik 2.7 · parkovani 2 · pruh 3.1 · parkovani 2 · chodnik 2.65 |
| mil10 | Via San Tomaso | ano | pruh 3 | chodnik 0.7 · pruh 4.55 · chodnik 0.9 |
| mil11 | Via Santo Spirito | ano | pruh 3 | chodnik 1.65 · pruh 4.75 · chodnik 0.9 |
| mil12 | Viale dei Mille | ne | chodnik 2.65 · nastupiste 3 · pruh 3.25 · pruh 3.25 · nastupiste 3 · plocha 10.38 · stromorad 1.5 · plocha 0.67 · pruh 3.25 · pruh 3.25 · chodnik 4.85 | = |
| mil13 | Viale Regina Margherita | ano | chodnik 3.65 · plocha 2.15 · chodnik 6 · pruh 3.25 · plocha 7.05 · pruh 3.25 · chodnik 6 · plocha 0.5 · chodnik 4.1 | chodnik 3.45 · zelen 4.8 · krajnice 2.18 · pruh 4 · krajnice 2.18 · nezname 1.9 · zelen 0.3 · nezname 0.95 · krajnice 2 · pruh 4 · krajnice 2 · chodnik 8.4 |
| mil14 | Galleria del Toro | ano | chodnik 2 | chodnik 54.93 |
| mil15 | – | ne | chodnik 1.4 · obsluzna 2.75 · nezname 1.7 | = |
| mil16 | Piazza Carlo Mirabello | ano | chodnik 1.9 · nastupiste 3 · pruh 2.75 · plocha 7.15 · zelen 1.61 · stromorad 3 · zelen 8.61 · stromorad 3 · zelen 3.33 · plocha 1.6 · pruh 3.3 · chodnik 3.45 | nastupiste 2.1 · parkovani 2 · krajnice 1.53 · pruh 4.5 · krajnice 1.53 · chodnik 2.95 · zelen 1.86 · stromorad 3 · zelen 1.59 · chodnik 4.4 · zelen 2.62 · stromorad 3.23 · chodnik 2.25 · pruh 4.35 · parkovani 2 · chodnik 3 |
| mon1 | Via Mentana | ano | plocha 1.2 · chodnik 6 · pruh 3 · pruh 3 · chodnik 3.48 | plocha 6.1 · zelen 2.45 · pruh 3.67 · pruh 3.67 · chodnik 2.2 · plocha 0.73 |
| mon2 | Via San Francesco d'Assisi | ano | chodnik 3.78 · pruh 2.75 · chodnik 4.7 | chodnik 1.48 · parkovani 2 · pruh 4.35 · parkovani 2 · chodnik 2.1 |
| mon3 | Via Arnaldo da Brescia | ano | chodnik 2.45 · pruh 2.75 · plocha 3.8 | parkovani 2 · pruh 4.5 · krajnice 1.6 · parkovani 2 |
| ber1 | Vicolo San Giovanni | ano | chodnik 1.25 · pruh 2.75 | pruh 4.8 · chodnik 6.5 · zed 1.1 · chodnik 6.7 |
| ber2 | Via Borgo Palazzo | ne | pruh 3 | = |
| ber3 | Via Fara | ano | chodnik 2.25 · zelen 1.1 · pruh 2.75 · pruh 2.75 | zelen 0.65 · chodnik 1.7 · zelen 1.7 · pruh 3.75 · pruh 3.75 · parkovani 2 · stromorad 1.5 · chodnik 3.15 |
| bre1 | Via Giulio Togni | ano | chodnik 1 · cyklostezka 2.5 · chodnik 2.5 · pruh 2.75 · pruh 2.75 · plocha 0.85 · chodnik 2.5 | plocha 2.15 · stezka_sdilena 1.65 · pruh 3.95 · pruh 3.95 · parkovani 2 · chodnik 2.05 · plocha 5.55 |
| bre2 | Via Alessandro Manzoni | ano | plocha 3.25 · chodnik 6 · pruh 2.75 · chodnik 6 | zelen 5.8 · chodnik 2.25 · parkovani 2 · pruh 4.05 · parkovani 2 · chodnik 2.05 · zelen 12.9 |
| bre3 | – | ne | chodnik 2 | = |
| com1 | Viale Franklin Delano Roosevelt | ano | chodnik 2.5 · pruh 3.25 · pruh 3.25 · pruh 3.25 · pruh 3.25 · chodnik 6 | chodnik 2.25 · pruh 3.34 · pruh 3.34 · pruh 3.34 · pruh 3.34 · chodnik 6.9 · zelen 14.35 |
| com2 | – | ne | chodnik 2 | = |
| var1 | Via Fratelli Comolli | ne | chodnik 5.55 · pruh 2.65 · pruh 2.65 · chodnik 0.5 | = |
| var2 | Via Carlo Croce | ano | chodnik 5.8 | pruh 4.45 |
| pav1 | Via Morazzone | ano | chodnik 0.9 · pruh 2.75 · chodnik 6 | pruh 3.15 · zelen 20.55 |
| pav2 | Viale Giacomo Matteotti | ano | plocha 1.6 · chodnik 6 · pruh 3 · plocha 5.95 · zelen 0.94 · stromorad 3 · zelen 6.62 · stromorad 3 · zelen 1.34 · plocha 3.7 · pruh 3 · chodnik 2.5 | chodnik 1.95 · krajnice 9.05 · pruh 4 · chodnik_kola 2.79 · stromorad 1.5 · chodnik_kola 8.12 · stromorad 1.5 · chodnik_kola 2.89 · pruh 4 · krajnice 5.75 · chodnik 4 |
| cre1 | Via Dante | ano | chodnik 3.85 · pruh 2.75 · delici 4 · pruh 3.25 · pruh 3.25 · chodnik 2.85 | chodnik 3.25 · parkovani 2 · pruh 4.3 · parkovani 2 · nezname 1 · pruh 3.28 · pruh 3.28 · chodnik 3 |
| cre2 | Via Ermelinda Tinti | ano | chodnik 0.5 · pruh 2.5 · chodnik 0.8 | pruh 3.55 · parkovani 2 |
| man1 | Via Lorenzo Gandolfo | ano | chodnik 3.15 · pruh 2.75 · chodnik 1.5 | chodnik 1.3 · parkovani 1.7 · pruh 3.8 · chodnik 1.3 |
| man2 | Via San Giorgio | ano | chodnik 2.5 · plocha 2.9 · pruh 2.75 · pruh 2.75 · chodnik_kola 4.8 | chodnik 9.4 · parkovani 2 · pruh 3.05 · pruh 3.05 · parkovani 2 · chodnik_kola 1.75 |
| lec1 | Lungolario Isonzo | ano | chodnik 2 · zelen 1.8 · chodnik 0.3 · pruh 3.25 · pruh 3.25 · delici 2.85 · pruh 3.25 · pruh 3.25 · chodnik 6 · plocha 8.07 | krajnice 1.32 · pruh 4 · pruh 4 · pruh 4 · pruh 4 · krajnice 1.32 · zelen 16.4 |
| lec2 | – | ano | obsluzna 2.75 · chodnik 6 · plocha 0.4 | plocha 9.17 · parkovani 19.2 · plocha 1.3 |
| lod1 | – | ne | chodnik 5.6 · obsluzna 2.75 · chodnik 5 | = |
| lod2 | Via Antonio Fogazzaro | ano | chodnik 3.42 · pruh 2.75 · chodnik 2.71 | plocha 1.62 · stromorad 1.5 · plocha 1.53 · parkovani 2 · pruh 4.7 · parkovani 2 · plocha 0.81 |
| bus1 | Via Marengo | ano | chodnik 2.35 · pruh 2.75 · pruh 2.75 · chodnik 6 · plocha 1.7 | chodnik 1.55 · pruh 3.37 · pruh 3.37 · chodnik 1.8 · zelen 4.9 |
| bus2 | Viale Vittorio Alfieri | ano | chodnik 2.5 · plocha 0.6 · stromorad 1.01 · chodnik 1.49 · pruh 3 · pruh 3 · parkovani 2 · chodnik 1.51 · stromorad 1.5 · chodnik 2.99 · plocha 2.65 | chodnik 2.91 · stromorad 1.99 · pruh 4.42 · pruh 4.42 · parkovani 2 · stromorad 1.16 · chodnik 2.19 |
