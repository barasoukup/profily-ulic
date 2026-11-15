# Slovensko: řezy, ortofoto ZBGIS, hledání a domy (15. 11. 2026)

Otázka (Bára): co aplikace dělá při kliknutí na Slovensku, co v ní opravit, a jestli pomůže slovenské ortofoto.
Větev `slovensko-rezy`, vyzkoušeno na localhostu (`?osm=balik`, dlaždice OSM ČR a SK z místního balíku).

## Krátce

- **Opraveno:** řez na Slovensku už neříká „Technická mapa ČÚZK teď neodpovídá“. Aplikace pozná stát (Česko,
  Slovensko, jinde „cizina“) a mimo Česko se neptá technické mapy ČÚZK, RÚIAN ani ortofota ČÚZK. Hláška říká, že
  je to odhad mimo Česko.
- **Ortofoto ZBGIS** (asi 10 cm, CORS, CC BY 4.0) je zapojené jako ČÚZK v Česku: pruhy, obruby, tramvajové těleso a
  podkladová mapa. Na 39 řezech v šesti městech sedí okraje vozovky s ortofotem **lépe u 10, hůř u 2, stejně u 16**,
  11 se posoudit nedá (dvoupásové silnice, náměstí, koleje uprostřed).
- **Bez vyvážení barev by ortofoto v Košicích a jinde nefungovalo:** slovenská mozaika je světlá a do žluta a asfalt
  vypadal jako tráva. **11 ze 40 řezů pak nemělo vůbec žádný profil** (jen dva pruhy po 3 m bez chodníků a domů).
  Teď se odstín bere vůči šedým pixelům snímku a profil vznikne u všech 39.
- **Hledání** najde slovenské ulice, obce a adresy (ZBGIS), **domy** mají druh a výšku ze ZBGIS.
- Pořád je to **hrubý odhad**: chodníky jsou do 6 m k domu z OSM, obruby se pletou se stíny, stromy a řadou
  aut, a u dvoupásových silnic se najde jen jedna polovina.

## Co se změnilo v aplikaci

| | dřív | teď |
|---|---|---|
| Stát řezu | mimo města vždy „cesko“ | `staty.json` (Česko z RÚIAN, Slovensko ze ZBGIS, asi 30 m, 236 kB, gzip asi 65 kB): `cesko`, `slovensko`, `cizina` |
| Dotazy při kliknutí na Slovensku | DMVS ČÚZK (bez CORS, „neodpovídá“), RÚIAN, ortofoto ČÚZK (prázdné) | jen dlaždice OSM, ortofoto ZBGIS (4–12 dlaždic, cache na den), 2× identify budovy ZBGIS |
| Hláška | „Technická mapa ČÚZK teď neodpovídá, profil je jen odhad z OSM“ (červeně) | „Mimo Česko technickou mapu nemáme, profil je jen odhad.“ + věta o ortofotu, u názvu „· mimo Česko, jen odhad z OSM“ |
| Záznam řezů | `city: "cesko"` | `city: "slovensko"` / `"cizina"` |
| Ortofoto | ČÚZK (prázdné za hranicí) | ZBGIS `Ortofoto_hres`, v mapě jen nad Slovenskem |
| Domy | RÚIAN (za hranicí nic) | ZBGIS Budova: druh stavby, výška; podlaží z výšky jen tam, kde OSM nemá `building:levels` |
| Hledání | RÚIAN (Slovensko nenajde) | navíc ZBGIS, když mapa ukazuje Slovensko, dotaz má slovenská písmena nebo RÚIAN nic nenašel |
| Uvedení zdrojů | ČÚZK, kraje | „Data: budovy © GKÚ Bratislava (ZBGIS, CC BY 4.0) · ortofoto © GKÚ Bratislava, NLC (ZBGIS, CC BY 4.0) · © OSM“ |

## Zdroje na Slovensku (ověřeno 15. 11. 2026)

| co | služba | CORS | licence | poznámka |
|---|---|---|---|---|
| ortofoto | `zbgis.skgeodesy.sk/zbgis/rest/services/Ortofoto_hres/MapServer` (dlaždice, export) | ano (vrací origin) | CC BY 4.0, GKÚ Bratislava | dlaždice 512 px v mřížce Web Mercator, úroveň 19 asi 10 cm; Bratislava 29. 5. 2023, Košice 5. 7. 2025; mimo SR průhledné |
| hranice státu | `Uzemnospravne_clenenie/MapServer`, vrstva 0, **identify** | ano | CC BY 4.0 | `/query` na ZBGIS vrací vždy 503, `identify`, `find`, `export` fungují |
| budovy | `ZBGIS/MapServer/41` Budova, identify | ano | CC BY 4.0 | druh stavby (asi 110 druhů), výška nad terénem, plocha; **bez podlaží a roku** |
| ulice | `Ulice_MVSR/MapServer/0`, find (osa ulice jako čára) | ano | data MV SR, licence nenalezena | 0,3 s; `find` hledá v celém poli nebo jeho části, ne „ulice + město“ |
| adresy | `RA_Adresne_body/MapServer/0`, find | ano | data MV SR (Register adries) | souřadnice v atributech; nejvýš 1000 výsledků (Hlavná) |
| obce | `Uzemnospravne_clenenie/MapServer/3`, find | ano | CC BY 4.0 | Bratislava a Košice jsou po městských částech |
| RegAdr API | `registeradries.sk` | – | – | potřebuje API klíč; Nominatim proxy bez CORS (ODbL) |

Technickou mapu ani pasporty komunikací s plochami vozovky a chodníků jsme pro Slovensko nehledali do hloubky
(Bratislava a Košice mají vlastní GIS). To je další krok, pokud bude Slovensko důležité.

## Vyhodnocení ortofota

**Vzorek:** 40 náhodných bodů do 1,2 km od středu Bratislavy (12), Košic (10), Žiliny, Nitry (po 5), Banské Bystrice a
Prešova (po 4) (`vzorek.mjs`, pevné semínko), každý posunutý na nejbližší pojmenovanou ulici (silnice I.–III. třídy,
místní, obytná). Jeden se zdvojil, zbylo 39. Každý řez aplikace spočítala dvakrát na stejném místě a ve stejném
směru: s ortofotem (výchozí) a s `?orto=0` (jen OSM). Výsledky `vysledky/rezy.json`, sběr v prohlížeči `sber.js`.

**Pravda:** na Slovensku nemáme MTVU. Okraje vozovky obou variant jsou nakreslené na ortofotu ZBGIS
(`obrazky.mjs`, `obrazky/index.html`, nahoře jen OSM modře, dole s ortofotem červeně) a posoudila jsem je okem:
sedí okraj vozovky na snímku zhruba do půl metru? Hodnocení `vysledky/kontrola.md`. Je to hrubší než měření proti
MTVU v `evaluation/ortofoto-osm`, ale pro „pomáhá, nebo ne“ to stačí.

| | řezů |
|---|---|
| s ortofotem lépe | **10** (6, 9, 14, 19, 20, 25, 33, 34, 38, 40) |
| stejně (obě dobře, nebo obě stejně vedle) | **16** |
| s ortofotem hůř | **2** (5 Pribinova: dvoupásová, vybrala druhou vozovku; 11 Palisády: o 1,5 m vedle) |
| nedá se posoudit | **11** (dvoupásové silnice, náměstí, koleje uprostřed, ulice pod stromy) |

Kde ortofoto pomáhá: obruba je ostrá hrana asfaltu proti chodníku nebo trávě (Priemyselná, Bajzova, Martina Rázusa,
Záborského). OSM samo bere šířku z počtu pruhů × 2,75–3,25 m a u širších ulic se mýlí o 1–2 m.

Kde nepomáhá: řada zaparkovaných aut u obruby (Strelecká, Grešova: obruba skončí na autech), stíny domů a koruny
stromů (Hodžova, Lomnická), dvoupásové silnice a tramvaje uprostřed (Štúrova, Protifašistických bojovníkov,
Závodská). To jsou stejné potíže jako v Praze a Brně (`evaluation/ortofoto-osm/ZPRAVA.md`).

**Vyvážení barev:** mozaika ZBGIS má asfalt jasný (Košice kolem 200 z 255) a o 10–15 zelenější než červená a modrá.
Detektor zeleně (G ≥ 10) ho pak bral za trávu, nenašel vozovku u osy a vzdal to: 11 ze 40 řezů bez profilu. U
zdroje `sk` se teď medián odstínu šedých pixelů (sytost pod 40) bere jako neutrální. Trávu a koruny to nesmaže,
jsou mnohem sytější. Ostatních zdrojů (ČÚZK, IPR, Brno, Plzeň) se to netýká.

## Zbývá a návrhy (pro Báru)

1. **Dvoupásové silnice** (Pribinova, Estakáda, Vysokoškolákov, Trieda A. Hlinku, Závodská): záložní odhad staví jen
   jednu vozovku. Když aplikace řez posune doprostřed mezi dvě jednosměrky, osa leží mimo nalezenou vozovku a profil
   zůstane holým odhadem z OSM. Platí to i v Česku, kde chybí technická mapa.
2. **Slovenské dopravní značky** (jen návrh, nic není uděláno): Slovensko má vlastní vyhlášku o dopravním značení
   (30/2020 Z. z.) s jiným číslováním a v detailech jinou kresbou (písmo, některé dodatkové tabulky a zóny). Šlo by
   přidat převod českých čísel na slovenská a SVG ze stejného zdroje (Wikimedia Commons, úřední díla) a ukazovat je
   jen u řezů na Slovensku.
   Než se do toho pustím, potřebuji Bářin souhlas a seznam značek, o které jde.
3. **Ilustrace** (jen návrh): bratislavská tramvaj Škoda 30T ForCity Plus nebo T3 v červeno-bílém nátěru DPB,
   košická Vario LF2R.S v nátěru DPMK, autobus SOR NS 12 nebo Solaris v barvách DPB. Mobiliář nechat pražský. Až
   Bára vybere vozidla a fotky.
4. **Hledání:** ZBGIS `find` neumí hledat podle začátku slova jako RÚIAN („Suché m“ najde, „Suc“ najde i
   „Sucháčova“ a stovky dalších). Pokud by to vadilo, RegAdr API s klíčem umí lepší našeptávání.
5. **Mobiliář, stání a značky** z OSM a pravidla zůstávají česká (§ 25 zákona 361/2000 Sb.). Slovenský zákon
   8/2009 Z. z. má pro stání podobné pravidlo (3 m pro každý směr), ověřit.
6. **Technická mapa měst** (Bratislava, Košice): nehledaná. Pokud by Slovensko bylo důležité, je to největší krok
   k přesnosti, stejně jako u českých měst.

## Jak zopakovat

```bash
node evaluation/slovensko/vzorek.mjs     # body vzorku (vzorek.json)
# v prohlížeči: http://localhost:<port>/?osm=balik (a &orto=0), sber.js, výsledek do vysledky/rezy.json
node evaluation/slovensko/obrazky.mjs    # obrazky/<id>.jpg a obrazky/index.html (ortofoto ZBGIS jednou do data/)
```
