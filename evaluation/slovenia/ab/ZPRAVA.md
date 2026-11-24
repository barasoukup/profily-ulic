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

## Podkroví podle výšky (23. 11. 2026, Bára: „podkroví opravit podle výšky“)

Co znamenají výšky katastru (Pravilnik o vodenju podatkov katastra nepremičnin, Ur. l. RS 41/2022, a Katalog stavb
GURS): `VISINA_H1` je podlaha nejnižšího podlaží (u domu se sklepem podlaha sklepa; v Mariboru u mnoha domů prázdná),
`VISINA_H2` nejvyšší bod střechy nebo zdiva, `VISINA_H3` terén u hlavního vchodu, vše v m n. m. **Výšku okapu katastr
nemá.** Výška domu je proto nově H2 − H3 (výška nad vchodem; dřív H2 − H1 i se sklepem a v Mariboru často žádná, teď ji
má 38 ze 40 domů místo 26). Vrstva `ETAZE` má sice výšku podlahy každého podlaží, ale vyplněnou jen u 14 z 54
zkoušených domů a podkroví od plného podlaží neodliší; nepoužívá se.

Pravidlo (`towns/slovenia.js gursBuilding`, `ATTIC`): dům o 2–4 podlažích, jehož nejvyšší bod je níž než
**3 m × podlaží + 2 m** nad vchodem, nemá na tolik plných podlaží pod střechou místo; horní podlaží se kreslí ve
střeše (`cornice` o jedno menší, `roof` 1, šikmá střecha). Vyšší domy se nemění (panelové a moderní bloky mívají patra
2,8–3 m s plochou střechou).

Ověření (`attic-osm.mjs`, `attic-fit.mjs`; dotazy na GURS po jednom s pauzou 1,5 s, odpovědi v `data/raw*.json`):
budovy OSM s `building:levels` i `roof:levels` v Lublani, Mariboru, Celji, Kranji a Koperu (náhodně, semínko 20261123:
podkroví v šikmé střeše, šikmá střecha bez něj, plochá střecha). Kde katastr dá podlaží = building:levels + roof:levels
(roof:levels ≥ 1), počítá podkroví; kde = building:levels, nepočítá; jiné počty se vynechaly. K tomu 9 domů z fotek výše.
Prahy 3,0–4,5 m na podlaží a přídavky 0–3 m se zkoušely; tenhle vyšel nejlépe na obou souborech zároveň.

| soubor | domů | s podkrovím | bez | správně dosud (= bez) | správně s pravidlem | podkroví nalezeno | falešně |
|---|---|---|---|---|---|---|---|
| fotky | 9 | 4 | 5 | 5 | 7 | 3 | 1 |
| OSM | 45 | 19 | 26 | 26 | 30 | 9 | 5 |
| celkem | 54 | 23 | 31 | 31 | 37 | 12 | 6 |

Pravidlo je slabé: výšky domů s podkrovím a bez něj se hodně překrývají (např. 2 podlaží: s podkrovím 5,0–11,2 m, bez
5,9–11,1 m), takže najde jen polovinu podkroví a u 6 z 31 domů (hlavně nízké ploché střechy: lj5-left, novostavba 2009)
podkroví vymyslí. Čistě je to +6 domů z 54. Štítky z OSM nejsou jisté (podlaží v OSM mohla být převzata z katastru,
`roof:levels` mapovatelé dávají i nevyužitým půdám). Z dalších 13 fotek vzorku dům ve snímku poznat nejde, další fotky
se proto neposuzovaly.

Ve vzorku 40 domů ulic po změně (odpovědi znovu staženy, 6 dotazů napoprvé vypršelo, podruhé prošly): podlaží B 39,
rok B 39, výška 38; podkroví dostalo 14 domů (Lublaň 9, Maribor 5), vzhledy domů beze změny (jiný vzhled než A 24×).
Z posouzených fotek: lj12-left a ma11-right a ma14-right teď kreslí 2 + 1, 1 + 1 a 2 + 1 jako na fotce, ma3-right dál 2
plná podlaží, lj5-left nově 1 + 1 místo 2 (chyba).

## Verdikt

**B má víc údajů**: podlaží u 39 ze 40 domů proti 17, rok u 39 proti 0. To je pokrytí, ne správnost (opraveno po
recenzi 24. 11. 2026): správnost šla posoudit jen na 9 fotkách (5 správně, 4 o patro víc), posuzovala je autorka, která
čísla katastru znala (ne naslepo), a shoda s OSM `building:levels` (19 z 29) nic nedokazuje, OSM mohlo údaj převzít
z katastru. Katastr zůstává zapnutý (`?gurs=0` ho vypne). Podkroví počítané jako podlaží pravidlo z výšky opraví zhruba
u poloviny domů (správně 31 → 37 z 54); **práh i přídavek se ladily na stejných 54 domech, na kterých se hodnotí**, bez
odloženého vzorku je +6 z 54 v pásmu šumu a lj5-left zůstává chybou. Pravidlo má vlastní přepínač `?off=podkrovi`
(katastr bez pravidla), aby šlo A/B zopakovat; ověřit ho na nových 30–40 domech z jiných měst (Kranj, Celje, Novo mesto)
s fotkami posouzenými naslepo. Přesněji by to šlo jen s výškou okapu, kterou katastr nevede (snad z DMR nebo z lidarových
dat GURS).
