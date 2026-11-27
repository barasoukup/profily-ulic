# Monako (MC): pravidla pro profily ulic

Rešerše 23. 11. 2026 pro přidání státu MC. Srovnání s Francií (`app/public/countries/FR.js`, `evaluation/france/NORMS.md`).
Pouze zdroje, které jsem opravdu otevřel; čísla nevymýšlím. **Závazné** = zákon/ordonnance, **doporučení** = příručka.
Dotazy: asi 10 na legimonaco.mc a 1 na IGN, s pauzami.

## 1. Code de la route (Ordonnance souveraine n° 1.691 du 17 décembre 1957, konsolidované znění)
Zdroj: https://legimonaco.mc/code/code-route/ (Legimonaco, „Dernière modification 4 juillet 2026“), text ordonnance
https://legimonaco.mc/tnc/ordonnance/1957/12-17-1.691/ (články jsou v kodexu, ordonnance odkazuje na „articles 1er à 209“).

- **Stání jen na vyznačených místech (závazné, čl. 31, znění ord. 10.196/1991 a 1.540/2008):** „Le stationnement des
  véhicules est interdit en dehors des surfaces de chaussée ou de ses dépendances délimitées par la signalisation
  horizontale réglementaire.“ To je zásadní rozdíl proti Francii: v Monaku se nesmí stát nikde, kde stání není
  vyznačené vodorovným značením. **Odhad stání podle zákona (parkGuess) tedy pro MC nedává smysl**; stání jen z dat (OSM).
- **Stání na chodníku (závazné, čl. 32 1°):** zastavení i stání na chodnících a plochách pro chodce či vyhrazené kategorie
  vozidel (cyklopruhy, buspruhy) je zakázané a „gênant“. Stejně jako ve Francii (R417-11), tvrdší kvalifikace ve FR
  („très gênant“) v Monaku není.
- **Volná šířka vedle stojícího auta (závazné, čl. 32-1 1°):** nebezpečné je stání mezi okrajem vozovky a plnou čarou, když
  zbylá šířka nedovolí jinému vozidlu projet bez přejetí čáry. **Číslo neuvádí** (stejně jako FR R417-10/11). Jiná obecná
  minimální volná šířka: nenalezeno.
- **Rychlost (závazné, čl. 11, nahrazen ord. 1.334/2007):** obecně 50 km/h všude; na některých úsecích značením 30 km/h,
  nebo 70 km/h. Jiné hodnoty kodex nezná (mimo zvláštní vozidla).
- **Zóny:** kodex definuje jen „aire piétonne“ (čl. 1er). „Zone 30“ ani „zone de rencontre“ v kodexu nenalezeno (hledáno
  v celém textu). Cyklisté: definice „bande cyclable“ a „piste cyclable“ (čl. 1er), jízda po chodníku jen vedení kola
  a děti do 12 let krokem.
- Buspruh: v kodexu jen obecně „voies réservées … catégories particulières de véhicules“ (čl. 32); šířka nenalezeno.

## 2. Přístupnost a šířky
- Loi n° 1.441 du 5 décembre 2016 relative à l'accessibilité du cadre bâti
  (https://legimonaco.mc/tnc/loi/2016/12-05-1.441/): platí pro **budovy** (ERP, kanceláře, bytové domy, parkoviště a jejich
  venkovní plochy, čl. 1er). Voirie a veřejná prostranství jsou jen zmíněné jako součást „chaîne du déplacement“ (čl. 3),
  **bez rozměrů**. Prováděcí arrêté ministériel n° 2017-893 (podle https://monentreprise.gouv.mc/… accessibility-of-the-built-environment)
  jsem neotevřel (URL na Legimonaco nenalezena), dle stránky se týká cadre bâti.
- Minimální volná šířka chodníku pro Monako: **nenalezeno**. Francouzské arrêté z 15. 1. 2007 (1,4 m) v Monaku neplatí.
- Šířky jízdních pruhů, cyklopruhů, buspruhů, stání: **nenalezeno** (žádná monacká příručka ani norma).

## 3. Značky
- Kodex čl. 39: značení se řídí ordonnance n° 793 du 25 août 1953, která zavádí **Ženevský protokol o silniční signalizaci
  z 19. 9. 1949** (Monako přistoupilo 25. 9. 1951; https://legimonaco.mc/tnc/ordonnance/1953/08-25-793/).
- **Vídeňská úmluva o silničních značkách (1968): Monako v seznamu účastníků OSN není**
  (https://treaties.un.org/Pages/ViewDetailsIII.aspx?src=TREATY&mtdsg_no=XI-B-20&chapter=11&Temp=mtdsg3&clang=_en).
- Monacký katalog značek s vlastním číslováním: **nenalezeno**. Commons (Category:Road signs in Monaco) má jen fotky, bez
  katalogu. Že značky vypadají jako francouzské, je pozorování, **ne doložené zdrojem**. Autorské právo k značkám: nenalezeno.
  Návrh: použít `signs-FR/` (vzhled), ale **bez francouzských čísel** (arrêté 1967 v Monaku neplatí) nebo s poznámkou.

## 4. Otevřená data
- geoportail.mc / www.geoportail.mc: nepřipojí se (23. 11. 2026). data.gouv.mc: HTTP 503 „Site internet en maintenance“.
- ArcGIS Online `services9.arcgis.com/DkYiS0lDHb5soLgl` (vlastník neuveden): 26 vrstev, statistika IMSEE, turistika,
  obchod, `poc_survey_dpum`; povrchy ulic, budovy s podlažími ani ortofoto nenalezeny.
- Ortofoto IGN (`data.geopf.fr/wms-r/wms`, `HR.ORTHOIMAGERY.ORTHOPHOTOS`, EPSG:3857, bbox 826020,5424530,826120,5424630):
  200, JPEG 512×512 se zástavbou a ulicí, `access-control-allow-origin: *` s Origin https://streetspace.eu. **Funguje.**
- Mapa povrchů ulic Monaka: nenalezeno → profil = odhad z OSM a ortofota (jako „cizina“), budovy z OSM.

## Doporučení (MC proti FR.js)
- Ponechat: `laneOrtho: "fr"` (IGN pokrývá Monako), budovy a odhad z OSM a ortofota, vzhled značek `signs-FR/`, bez
  paneláků, neutrální vozidla, český mobiliář.
- Změnit: `parkGuess: false` (čl. 31: stání jen na vyznačených místech); `halfKerbNote` s čl. 32 1° místo R417-11;
  rychlosti jen 30/50/70 (čl. 11); kódy značek bez francouzských čísel (nebo jen název); `limits` jen s poznámkou, že
  monacké šířky nenalezeny (FR čísla 1,4 m atd. jsou cizí předpis; buď bez varování, nebo „podle Francie, orientačně“);
  zóna 30 a obytná zóna v kodexu nejsou, jen aire piétonne; `besidePassport`/pasport Paříže a BD TOPO nepoužívat
  (BD TOPO Monako pravděpodobně nepokrývá, neověřeno).

## Po recenzi 23. 11. 2026 (`REVIEW.md`)
- Značky (Bára 23. 11. 2026: nekreslit francouzské značky, které monacký kodex nezná): kreslí se jen zákazy vjezdu
  (B0, B7b, B9b, B9a), zákaz zastavení a stání (B6d, B6a1), parkoviště (C1a), jednosměrka (C12 / B1), vyhrazený pruh
  (B27a, čl. 32), stezka pro cyklisty (B22a, „piste cyclable“ čl. 1), aire piétonne (B54, čl. 1) a rychlosti 30, 50 a 70
  (čl. 11). Nekreslí se zóna 30 (B30), zone de rencontre (B52), voie verte (C115), dálnice a silnice pro motorová
  vozidla (C207, C107), stezka pro chodce (B22b) ani tabulka „sauf cyclistes“ u jednosměrky („double sens cyclable“
  kodex nezná). Rychlost ulice, kterou by jinak schovala zónová značka, se kreslí (`countries/MC.js` `zoneSpeed`).
- `halfKerbNote`: „pravidla silničního provozu (Code de la route)“ místo „zákona“ (ordonnance souveraine 1.691/1957).
- `bounds` do 7,445° v. d. (východní cíp podle OSM 7,43987).
- Vědomě převzaté z Francie (nerozhodnuté pro Monako): `lawNeed` (bez užitku, odhad stání vypnutý), `wideStreets` a
  `besideMax` (pařížské bulváry), vzhled domů bez paneláků.
- Nezkontrolované řezy (recenze, nález 3) zůstávají: ruční prohlídka 15–20 řezů proti ortofotu je samostatný úkol.
