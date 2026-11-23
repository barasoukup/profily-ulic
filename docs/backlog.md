# Seznam ke kontrole a vylepšení

Bára 21. 11. 2026: „vést seznam věcí na kontrolu nebo vylepšení v jednotlivých oblastech, ke kterým se pak můžeme
vrátit“. Každá položka krátce: co, kde se to ukázalo, odkaz na zprávu. Hotové škrtnout s datem, nemazat hned.
Co rozhodne Bára, je označeno **(Bára)**.

## Odhad profilu (ortofoto a OSM, společný kód)

- Most v odhadu jako voda: bez mapy povrchů řeže řez most podle vody pod ním (Most Kotlarski v Krakově,
  `evaluation/poland/ab/`). Most z OSM (`bridge`) má mít přednost před vodou.
- Úzké ulice: jeden široký pruh a chybějící stání (Brusel Rue aux Choux 10,4 m, Rue du Vautour 6,6 m, Antverpy
  Koninginnestraat 5,4 m; stejně dřív Rakousko a Německo). Proč se u jednosměrky s jedním pruhem zákonné stání nepřidá,
  když místo je (`evaluation/universal/ZPRAVA.md`, Belgie).
- Strop šířky pruhu 4 m (4,5 místní) neplatí u map povrchů: Kraków kr24 pruh 4,9 m, kr31 4,62 + 4,48 m.
- Chodník s cyklostezkou (`segregated=yes`) se dělí přesně napůl (`derive.js sidewalkUse`). Někde to odpovídá (Most
  Kotlarski), jinde ne: šířka z OSM `width` nebo z norem státu, případně hranice podle červené barvy na ortofotu.
  Napřed ověřit na ortofotu, jak to opravdu vypadá (Bára 21. 11. 2026).
- Ortofoto: rozeznat vodorovné značení od nevyježděných světlých pásů (Bára 12. 11. 2026, řez 324 v Hradci).

- Francie (měření 22. 11., 25 řezů): v odhadu často chybí chodník (10×) a přebývá stání (8×); prověřit na řezech
  `evaluation/universal` (fr-*), zda jde o úzké chodníky u fasády nebo o zákonný odhad stání.
- Chodník mezi obrubou a domem (hlášení 23. 11., regrese s domy z RÚIAN): stín domu přes chodník a stání (Spojovací)
  nebo přes vozovku (U libušské sokolovny) se bere jako chodník či obruba, suchý hnědý trávník jako chodník (Kukelská),
  podélná spára uprostřed vozovky jako obruba (Dářská). Pokusy `walkSatOn`, `walkYellow`, `walkMode`, `split6` znovu
  změřené s RÚIAN: nic nevyhrálo všude. Spíš model (`ai-kerbs`, `ai-segmentation`) než další pravidla.
- Silnice 230 u Mariánských Lázní (`#rez=50.037075,12.789854,37`): vozovka 6,5 m, ortofoto našlo jen jeden pruh 4,74 m
  a krajnici 1,76 m (chybí středová čára?).
- Poznámka pod nadpisem říká „domy z OSM“, i když jsou od 23. 11. v Česku z RÚIAN: nový text ve všech jazycích.

## Mapy povrchů a data měst

- Nizozemsko: BGT kreslí červené cyklopruhy na vozovce jako „fietspad“ (měření: 13× cyklostezka navíc). Pokus
  `?fietsstrook=1` nepomohl; zkusit jinak (barva na ortofotu, OSM `cycleway=lane` a šířka).
- Nizozemsko: Nassauplein v Haagu (střední pás přes 16 m) dostane odhad místo BGT, vozovky jsou dál než 10 m.
- Nizozemsko: parkovací místa Amsterdamu (`?amspark=1`): spojit jednotlivá místa do souvislých úseků (mezery do 1 m),
  způsob stání brát pro plochy BGT. Licence města neuvedena.
- Krakov: A/B mapy povrchů slabé (lépe 7, hůř 6): zapnuto, **(Bára)** nechat? Přepustit A/B po vrácení „Ścieżky“
  na chodník.
- Belgie: A/B čar GRB a PICC slabé (lépe 4, hůř 2): zapnuto.
- Polsko: ortofoto GUGiK bez vlastního A/B (je v obou ramenech).
- Paříž: u fasády často pruh „plocha“ 0,65 m (mezera mezi budovou z OSM a chodníkem Plan de voirie); A/B
  `evaluation/france/ab/ZPRAVA.md`. Zkusit budovy z BD TOPO nebo `emprises-ilots-prives` místo OSM.
- ~~Paříž: široká vozovka „pruh 4 m + krajnice“, ztracený buspruh, bulvár s promenádou~~ (23. 11. částečně:
  `evaluation/france/ab/bulvary/ZPRAVA.md`). Zbývá: krajnice u 10 z 26 bulvárů (široké vozovky bez čar na ortofotu IGN;
  zkusit pařížský PCRS 5 cm, jen soubory), řez v ústí boční ulice (Sébastopol) a na cyklostezce za koncem bulváru
  (Magenta), Quai aux Fleurs bere i nižší ulici za zdí, chybějící vrstvy mapy (ostrůvky, oddělovače, rampy). Cílené řezy:
  mosty přes Périphérique, nábřeží. Evidence stání: Rue Fromentin, Chaufourniers, Place des Alpes ztratily odhad stání
  (evidence tam nic nemá); ověřit na fotkách.
- Francie: šířky vozovek BD TOPO (`?sirka=1`) bez A/B; další města s mapou povrchů (Lyon `pvochausseetrottoir`,
  Bordeaux, Nantes, Toulouse) neprověřená.
- Španělsko: Zaragoza, vozovka jako pás kolem os OSM přesahuje přes trávu, kterou mapa nemá (zg12); A Coruña (vozovky,
  chodníky, stání 1 : 500, licence nejasná): Bára 23. 11. nechce se ptát, zatím nepoužívat; Valencie (obruby s typem okolí, vodorovné značení) zkusit znovu;
  Madrid jen obrázek (čtení barev jako `dmvs.js`?); ortofoto ICGC 25 cm 2025 v Katalánsku ostřejší než PNOA (hranice
  Katalánska); měření: chybí chodník 10×, stání 8× (`evaluation/universal`, es-*).
- Jihlava: pasport komunikací byl 16. 11. prázdný, ověřit (CLAUDE.md, Na 19. 11.).
- Pasporty devíti českých měst: A/B po odstávce DMVS (`evaluation/PASPORTY-AB.md`).
- Hlášení, která data IPR/ČÚZK potvrzují, bez fotky z ulice nerozhodnu (do seznamu připomínek pro IPR?):
  Strossmayerovo náměstí, jižní strana „nemá pruh pro auta“ (MTVU 701 3,5 m a úsek parkování TSK;
  `#rez=50.098778,14.433932,-83`); Libocká, „chodník V je užší, asi i jízdní pás“ (MTVU vozovka 4 m, zeleň, chodník 2 m;
  `#rez=50.090199,14.324922,-14`). Dřív: V Zeleni, Poncarova.
- Klánovická: stání z OSM (`parking=lane`) je teď podélné, ale široké 3,9 m podle hrubého polygonu OSM.
- Hospodářská půda (MTVU 100) pod nepojmenovanou služební cestou se kreslí jako „Zpevněná plocha“ 44 m
  (`types.js typeFromMtvu`: 100 → „plocha“); pojmenovaná cesta už jde na odhad (Devětsilová).
- DTM po přechodu na JVF 1.5 (19. 11.): typy se čtou z kódu JVF (číselník z vyhl. 393/2020, `dmvs.js JVF`); kód, který
  číselník nemá, se zahodí s varováním „neznámý typ“ v konzoli. Uložené řezy (`evaluation/replay`, srovnání DMVS) mají
  ještě staré názvy typů: nahrát znovu, aby regrese pokryla i DTM.

## Státy a pravidla

- Lucembursko: malý vzorek měření (12 řezů, polovina cesty a parky), u Remiche bílé ortofoto.
- Belgie: AR 1975 platí do 31. 5. 2027, pak nové kódy (federální a regionální): přečíslovat články a značky.
- Polsko: třída ulice (GP–D) se odhaduje ze skupin OSM, hlavní ulice jako Z (opatrně).
- Jednosměrka s cyklisty v protisměru po směru bez dodatkové tabulky (NL, BE).
- Španělsko (Bára 23. 11.: souhlas): volná šířka 3 m k protějšímu okraji doslova; sdílená stezka bez varování; zóna 30
  jako tabule S-30. Otevřené: Melilla má snímek Airbus pod jinou licencí. Šířka pruhu BUS, BUS + kola a tramvajového pásu bez zdroje (bez varování).
- Francie: normy kromě přístupnosti jen z druhé ruky (CEREMA přes přílohu ministerstva, příručky Paříže a Lyonu;
  Bára 23. 11.: smí varovat v celé Francii). Tramvajová plošina bez zdroje. Arrêté 2007 ověřit na Légifrance (mohl být
  změněn). ~~Paneláky, licence značek~~ (Bára 23. 11.: paneláky ne, značky volně).

- Maďarsko odloženo (Bára 22. 11. 2026): bez otevřeného ortofota a mapy povrchů jen odhad z OSM a nejde změřit.
  Rozpracováno ve větvi `hungary` (`evaluation/hungary/README.md`). Vrátit se, až bude otevřené ortofoto nebo mapa
  povrchů Budapešti.
- Další státy vybírat podle otevřeného ortofota s CORS a mapy povrchů aspoň hlavního města. Průzkum 22. 11. 2026:
  `docs/states-survey/` (nejlépe Francie s Paříží, pak Španělsko, Švédsko, Kypr; Finsko a Dánsko jen s klíčem
  **(Bára)**; Slovinsko, pobaltské státy a Norsko zkusit znovu).
- Domy: chata nebo jiná stavba bez počtu podlaží v RÚIAN dostane výchozí 2 NP (hlášení u silnice 506338718
  v Královéhradeckém kraji: 1 NP a podkroví). Výchozí hodnota pro rekreační stavby (RÚIAN 8)? **(Bára)**
- Podkroví z RÚIAN (23. 11.): rodinný dům a chata se 2+ podlažími mají poslední podlaží ve střeše (silnice 230). Ověřit
  na víc domech.

## Hledání

- Belgie a Lucembursko jen přes Photon; národní služby (Flandry geolocation, geoportail.lu) nezapojené.
- Francie: Géoplateforme hledá i bez města; přednost blízko středu mapy je slabá (lat/lon jen naznačí).
- Photon nabízí i místa v Nizozemsku, Belgii, Lucembursku, Polsku, Francii a Španělsku, kde zatím nejsou dlaždice OSM
  (aplikace tam ulici nenajde). Omezit hledání na nasazené státy, než dlaždice budou?

## Překlady

- Všechny jazyky kromě češtiny strojově: projít rodilým mluvčím, nejdřív irština, maltština, lotyština (tvary měst,
  Krakov, Valonsko, Flandry).

## Nasazení a provoz

- Balík OSM `be` (0,7 GB PBF) po prvním běhu workflow změřit, případně rozdělit pod 512 MB.
- Balíky `pl_sl` a `pl_ds` zasahují obdélníkem do Česka (jen dotazy navíc).
- Před nasazením NL, BE, LU, PL, FR, ES: větve už jsou v `main` (23. 11.); ručně spustit workflow OSM tiles se
  `states: nl,be,lu,pl,fr,es` a ověřit balíky na R2.
- Logování: D1 potřebuje sloupec `country` a nový Worker (`logging/README.md`), nasadit musí Bára.
- ~~**Až budou dlaždice NL, BE, LU, PL, FR a ES na R2**: vrátit texty o nových státech.~~ Hotovo 23. 11. 2026: dlaždice všech 92 balíků jsou na R2 a v `index.json`, texty vrácené v `d6c8c6c`; oprava indexu (kódy o 3–4 písmenech) v `d412dda`.

## Licence ke kontrole

- Ortofoto PDOK (Nizozemsko), Flandry, Valonsko, ACT Lucembursko (ortho_latest), sítě Amsterdamu, mapa Krakova,
  služby českých a slovenských měst (MTVU, UMPS, pasporty).

## Nápady (Bára zatím nevybrala)

- Srovnávat a přepínat normy různých států, aby byly vidět rozdíly přístupů (Bára 20. 11. 2026).
- Výšky povrchu v profilu (DMR 5G, výškové body), jedna strana ulice výš než druhá (Bára 12. 11. 2026).
- Zóny a rychlosti po pruzích z OSM, povrch, názvy zastávek MHD, přechody.
