# Stav, Návrh a úpravy

Úpravy profilu, okraje ulice a prvky.

## Stav a otevřené věci (dříve CLAUDE.md)

- Stav je jen k prohlížení; data se opravují po tlačítku „Opravit data“ (Bára 8. 11. 2026). Návrh je
  editovatelný vždy. 

## Stav, Návrh a úpravy

Stav je jen k prohlížení; kliknutí na část řekne, co to je a odkud pochází. Data se opravují po tlačítku
**Opravit data**. Návrh je editovatelný vždy. Úpravy drží šířku ulice: **Sloučit s levou / s pravou** dá šířku
části sousedovi, po smazání se vybere soused. Hlídá se šířka ulice: v Návrhu proti stavu, při opravě dat proti
šířce změřené před opravou. Když ji profil překročí nebo nevyplní, objeví se upozornění a tlačítko Dorovnat (rozdíl
dostane vybraná, jinak nejširší část); když sedí, nic se neukazuje.

Rozhraní po kritice Fable (12. 11. 2026), aby nepřibývalo do jednoho sloupce: karta vybrané části má v hlavičce
←, →, Rozdělit, Smazat; pod ní typ, šířku a jednu volbu podle typu (směr, způsob stání, povrch tělesa), řádek prvků
a značek (název značky před číslem) a sbalené **Další volby** (cyklisté, troleje, účel a poloha stání, povrch, co je
pod povrchem, autobusy na kolejích, šipky, sloučení; na sbalené liště je vidět, co je v nich nastavené). U částí
s odborným názvem (průleh, piktokoridor…) je věta, co to je. Paleta dílů je za tlačítkem **+ Přidat díl**. Bez výběru
je místo panelu okrajů jen řádek nápovědy. Legenda zdrojů jen ve Stavu, štítek režimu vedle názvu ulice není,
nápověda k tažení řezu zmizí po prvním tažení. V hlavičce **Sdílet** a jedno menu **Soubor** (PNG, SVG, JSON,
kopírovat a vložit polohu řezu, nahlásit chybu, místní ilustrace). Patička se zdroji je jeden řádek, celá po
rozbalení. Podíl prostoru ukazuje v Porovnání předchozí podíl („bylo 28 %“) místo procentních bodů. Přepnutí jazyka
zachová režim.

Šířky částí se porovnávají s Manuálem tvorby veřejných prostranství IPR, kap. C.2 (`public/rules.js`): červeně pod
minimem (chodník 1,5 m, pruh 2,5 m, cyklopruh 1,5 / 1,75 / 2 m podle stání vedle, ochranný cyklopruh 1,25 m,
podélné stání 2 m, kolmé 4,5 m, dvoukolejný tramvajový pás 6,5 m…), oranžově pod základní šířkou (chodník 2 m,
pruh 3 m, ochranný cyklopruh 1,5 m, kolmé stání 5 m, tramvajový pás bez sloupů 7 m, se sloupy 8 m…). Kliknutím na
upozornění se část vybere. Tramvajový pás je vyhrazený tramvajový pruh i samostatné těleso, ne tramvaj v pruhu
s auty.

Šikmé stání se posuzuje jako kolmé (Manuál C.2: hloubka podle úhlu; stání 2,5 × 5 m pod 45° je hluboké asi 5,3 m,
pod 30° 4,7 m), v Návrhu začíná na 5 m; tramvajová kolej v Návrhu na 3,5 m (pás 7 m). Jen oranžově (Bára 11. 11. 2026):
cyklostezka pod 2,5 m, nástupiště pod 2 m (světlá šířka zastávky), řadicí pruh (se šipkami) pod 2,5 m místo
běžného pruhu.

Jednosměrka s cyklisty v protisměru (značka IP 4c pod pruhem) bez vlastního cyklopruhu: vozovka, tedy pruhy
s krajnicí a šrafami bez stání, červeně pod 3 m, oranžově pod 4 m (Manuál C.2: základ 4 m, při velmi nízké
intenzitě 3 m, při vyšší až 4,5 m; Bára 11. 11. 2026). Nahrazuje varování jednotlivých pruhů.

Jízdní pruh v Praze podle zatřídění TSK (skupina ČSN 73 6110; MK I a II jsou podle zák. 13/1997 Sb. sběrné
nebo rychlostní, TSK to nerozlišuje, proto skupina B): dálnice červeně pod 3 m, oranžově pod 3,5 m; MK I, MK II
a silnice I. a II. třídy červeně pod 3 m; MK III a silnice III. třídy červeně pod 2,75 m, oranžově pod 3 m;
MK IV červeně pod 2,5 m, oranžově pod 2,75 m. Bez zatřídění (ostatní města) 2,5 / 3 m. Pruh přidaný v Návrhu
převezme třídu ostatních pruhů ulice.

Prvky v Návrhu (Magdalena a Bára, 13. 11. 2026):
- lampa jde nastavit na výšku 4, 5, 6, 8 nebo 10 m: do 5 m parková lampa se svítidlem na sloupku, od 6 m lampa města
  s kratším či delším stožárem (výložník, svítidlo a patka ve skutečné velikosti); bez nastavení obrázek města
  (svítidlo v Praze asi 8,75 m, v Brně 7,4 m);
- stojan na kola jde otočit podél ulice (kolo zepředu, trubka stojanu vedle); obojí u štítku prvku v kartě části,
  štítky v pořadí, v jakém prvky stojí;
- stojany, lavičky, květináče a sloupky téže části se po přidání, smazání, otočení či změně šířky části srovnají
  vedle sebe podle své šířky (stojan podél ulice 0,8 m, napříč 1,9 m, lavička 2,2 m…) kolem místa, kde byly; když se
  nevejdou, blíž k sobě (Bára: tři stojany přes sebe);
- nová lampa nebo trakční sloup stojí 0,6 m od obruby na straně nejbližší vozovky (i přes části mezi nimi; Bára:
  lampy stojí u silnice), druhá u protější hrany části, další uprostřed; bez vozovky vedle a mezi dvěma vozovkami
  první uprostřed.

Pod profilem je pruh **podílu šířky ulice** (chůze, kola, MHD, jedoucí auta, parkování, zeleň, ostatní; sdílené
části napůl), v Porovnání se změnou. Pod ním **povrch ulice** (`shares.js surfaces`, Magdalena): propustný (zeleň,
průleh, povrchová rýha, travnaté a štěrkové těleso, nezpevněný povrch), částečně propustný (propustná dlažba; v popisku
části „propustná dlažba“), nepropustný, vodní plocha (i retenční nádrž: zadržuje, nevsakuje) a ostatní (zeď, Neurčeno); co je pod povrchem se
nepočítá, skupina bez plochy se neukazuje, v Porovnání „bylo X %“. Nezpevněný může být i chodník, plocha, parkování,
cyklostezka, krajnice, přístupová cesta a dělicí pás. Návrh (i ručně opravený stav) jde **sdílet odkazem** (je zabalený v adrese za
řezem), uložit do souboru JSON a zase načíst. U řezu je **panorama z ulice** Mapy.com (s klíčem v dialogu, bez
něj odkaz na Mapy.com).

## Podnět Magdaleny k prvkům a povrchu (Bára 13. 11. 2026)

- Lampa ve výšce 4–10 m (do 5 m parková na sloupku, výš lampa města s delším/kratším stožárem; Bára: malá lampa není
  zmenšená velká), stojí 0,6 m od obruby u vozovky. Stojan na kola napříč/podél; stojany, lavičky, květináče a sloupky
  se v části řadí vedle sebe. Povrch tramvajového tělesa jen u samostatného tělesa (tráva stačí, rozchodníky ne).
- Pod zelení a travnatým/štěrkovým tělesem žádný beton (ornice, štěrkové lože).
- Graf „Povrch ulice“: propustný / částečně propustný / nepropustný / vodní plocha / ostatní (shoda s „povrch“;
  „voda a ostatní“ se pletlo s hospodařením s vodou), bez poznámky.
- Nedělat: pokryvnost korunami a parametry stromů (Bára: moc složité). IPR Praha oslovit s připomínkami (nápad
  Magdaleny), Slovensko jen při zájmu.

### Okraje ulice

Na dům, plot, zahradu či jiný okraj profilu jde kliknout jako na část (Bára 12. 11. 2026: „panelák“, který je dvoupatrový
městský dům, nebo zahrada). V Návrhu a po „Opravit data“ se dá změnit, co tam stojí (budova, drobná stavba, zahrada, park, voda,
parkoviště, plot, volný prostor), u budovy zvlášť vzhled domu (nebo odhad) a počet podlaží
(`edges.leftLevels`, nahradí podlaží i výšku z dat, jde i do sdíleného odkazu). Ve Stavu karta jen řekne, co tam je.
