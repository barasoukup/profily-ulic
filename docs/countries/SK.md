# Slovensko (SK)

Stav nasazení: větev `slovensko`, 15.–16. 11. 2026. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Slovensko (větev slovensko, 15.–16. 11. 2026)

- Stát řezu ze `states.json` (`tools/build_boundaries.mjs`: ČR z RÚIAN, SR ze ZBGIS): `cesko`, `slovensko`, jinde `cizina`;
  `city.country` je ISO 3166-1 („CZ“, „SK“, mimo ně null), jazyk rozhraní je nezávislý (Bára).
  Mimo Česko (`towns/slovakia.js`, `city.abroad`) žádné dotazy na DMVS, RÚIAN ani ortofoto ČÚZK; profil je odhad
  z OSM a ortofota.
- ZBGIS ÚGKK SR (CC BY 4.0, GKÚ Bratislava; `/query` vrací 503, funguje identify/find/export/dlaždice): ortofoto
  `Ortofoto_hres` (asi 10 cm, s vyvážením barev, jinak asfalt vypadá jako tráva), budovy (druh, výška), hledání
  ulic, obcí a adres (`search/zbgis.js`). Vyhodnocení `evaluation/slovakia/REPORT.md` (ortofoto lépe 10, hůř 2, stejně 16
  z 39). Slovenská vozidla a označníky nakreslené a zapojené (16. 11.).
- Značky státu SK (vyhl. 30/2020 Z. z.): `app/public/signs-SK/` (piktogramy podle přílohy „Symboly“, tabulka klíčů
  v README), řádek značek podle `city.country` (`signFile/plateFile/signLabel(…, country)`); název značky v jazyce
  stránky, číslo podle státu. SK nemá způsob stání (jen 272), IP 4c (321 + 514, z druhé strany 230 + 507),
  vyhrazené stání je 270 + 531, sdílenou zónu nemá. Obě sady (CZ i SK) zkontroloval Fable proti vyhláškám a opravené.
- Značky (Bára 15. 11. 2026): C 10a ukazuje chodce na jejich straně (dál od vozovky, při „Otočit“ se prohodí, bez dat
  jako vzor: chodci vpravo); IZ 10a Sdílená zóna jen podle `traffic_sign` v OSM; C 7a Stezka pro chodce na pěší cestě;
  E 13 „Mimo dopravní obsluhy“ (2. pád, gramaticky správně).
- Pasporty měst (Bára 16. 11. 2026, `towns/slovakia.js` SK_TOWNS, jen ve větvi `slovensko`): Bratislava (magistrát:
  chodníky, vozovky, parkoviště; MČ Dúbravka), Žilina a Banská Bystrica
  (T-MAPY PaKom); jen kde má pasport plochu pod středem řezu, kolem budovy, zeleň a voda z OSM; `?pasport=0` vypne.
  A/B 115 řezů: lépe 28, hůř 7 (`evaluation/slovakia/ab/REPORT.md`). Čáry technické mapy Bratislavy zůstávají. Licence neuvedené. Prešov vyřazený
  (Bára 25. 11. 2026: uzavřel vozovky a parkoviště, ArcGIS 499; zůstaly jeho stromy a čáry mapy, CC BY 4.0).
- Mimo Česko se vzhled domu neodvozuje od vzdálenosti od centra (žádné není), ale z OSM (rok, střecha, deska); panelák
  jen obytným domům (ZBGIS druh budovy). Ulice ze dvou jednosměrných vozovek má v odhadu obě. V nadpisu jen ulice,
  poznámka o datech pod ním. Panorama Mapy.com jen v CZ. Jazyky v rozbalovacím menu s vlajkami (vše Bára 16. 11. 2026; od 17. 11. v menu Soubor bez vlajek).
- Změna jazyka načte stránku znovu, ale profil se nepřepočítává (stav záložky v sessionStorage); záblesk je v pořádku
  (Bára 16. 11. 2026), přepnutí za běhu je připravené v `i18n.js` (onLangChange), napojené není.
- Ilustrace SK (Bára 16. 11. 2026): vozidla měst (`app/public/bratislava|kosice|zilina|bystrica|presov/`, kreslířka a
  kritik ve 3 kolech) podle města řezu (`countries/SK.js` art, artAt); mobiliář český (Bratislava převzala od Prahy lavičku,
  koš a stojan Olgoj Chorchoj), označníky a přístřešky se slovenskou značkou 331 Zastávka (`app/public/slovensko/`).
  Vlastní bratislavský přístřešek, lampa a označník DPB až po zásadách MIB pro zastávky a osvětlení (přístřešky jsou
  v řezech vzácné). Čáry map Bratislavy, Nitry, Piešťan, Zvolena, Hlohovce, Prešova: `?hrany=0` vypne.

## Popis zdrojů a pravidel (dříve app/README.md)

### Slovensko a cizina (Bára 15. 11. 2026)

Mimo města platí stát řezu (`states.json` z `node tools/build_boundaries.mjs states`: Česko z RÚIAN, Slovensko ze ZBGIS ÚGKK SR,
asi 30 m): „cesko“, „slovensko“, jinde „cizina“ (okraje výřezů OSM za hranicí). Bez `states.json` je všechno mimo
města „cesko“ jako dřív. Mimo Česko (`towns/slovakia.js`, `city.abroad`) se aplikace neptá technické mapy ČÚZK ani
RÚIAN (DMVS za hranicí odpovídá bez CORS a vypadalo to jako výpadek). Profil je odhad z OSM a ortofota
(`ortho-osm.js`) a pasportů měst, kde je mají; hláška „Technickou mapu tu zatím nemáme, profil je odhad.“ pod
názvem (nadpis je jen ulice).

- **Ortofoto Slovenska:** ZBGIS `Ortofoto_hres` (GKÚ Bratislava, NLC, CC BY 4.0), dlaždice Web Mercator do úrovně 19 po
  512 px (asi 10 cm; Bratislava 2023, Košice 2025), CORS, cache na den. Čte se pro pruhy a obruby
  (`lanes-ortho.js`, zdroj `sk`), pro tramvajové těleso (`ortho.js`, export PNG) a je i v podkladové mapě (jen na
  Slovensku, mimo něj vrací průhledné dlaždice). Mozaika je světlá a do žluta: asfalt v Košicích měl jas 200 a o 10
  zelenější než červená a modrá, takže vypadal jako tráva a profil nevznikl (11 ze 40 řezů). Odstín se proto
  bere vůči šedým pixelům snímku (`balance`, jen pro `sk`). Vyhodnocení `evaluation/slovakia/REPORT.md`.
- **Domy:** ZBGIS vrstva Budova (`identify`, `/query` ZBGIS vrací 503): druh stavby (hala, nízká stavba, rodinný dům)
  a výška nad terénem; podlaží = výška / 3,3 m, ale `building:levels` z OSM má přednost. Rok stavby ani podlaží
  ZBGIS nemá.
- **Hledání:** ZBGIS `find` (ulice MV SR s osou, obce, adresní body Registra adries), jen když mapa ukazuje
  Slovensko, dotaz má slovenská písmena (ä ô ľ ĺ ŕ) nebo RÚIAN nic nenašel (`search/zbgis.js`). „Hlavná 12 Košice“
  najde adresu, „Hlavná Košice“ ulici v Košicích.
- Ilustrace vozidel podle města řezu (Bratislava, Košice, Žilina, Banská Bystrica, Prešov; jinde neutrální tramvaj a autobus z `generic/`),
  slovenské označníky zastávek (značka 331), mobiliář pražský (Bratislava ho převzala), značky slovenské (`signs-SK/`).
- **Za pasportem města** (Bára 16. 11. 2026, Poštová, 17. novembra): pasport končí, kde končí plochy, o které se město
  stará. Od osy ven k nejbližšímu domu (z pasportu nebo OSM), plotu či zdi z OSM nebo k vnější hraně samostatně
  zakresleného chodníku OSM se nepokryté kusy doplní (`ortho-osm.js` `besidePassport`), jen když ten konec leží do 15 m
  za poslední plochou. Kus dělí čáry mapy města; druh dá značka mapy, trávník nebo parkoviště ZBGIS, jinak snímek
  (zelený od 0,22). Chodník jen na straně, kde pasport chodník nemá; za chodníkem pasportu je to „plocha před domem“.
  U dálnic a rychlostních silnic nic. Vše je odhad. A/B v `evaluation/slovakia/ab/REPORT.md`; `?off=beside` vypne.
