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
- Francie: šířky vozovek BD TOPO (`?sirka=1`) bez A/B; další města s mapou povrchů (Lyon `pvochausseetrottoir`,
  Bordeaux, Nantes, Toulouse) neprověřená.
- Jihlava: pasport komunikací byl 16. 11. prázdný, ověřit (CLAUDE.md, Na 19. 11.).
- Pasporty devíti českých měst: A/B po odstávce DMVS (`evaluation/PASPORTY-AB.md`).

## Státy a pravidla

- Lucembursko: malý vzorek měření (12 řezů, polovina cesty a parky), u Remiche bílé ortofoto.
- Belgie: AR 1975 platí do 31. 5. 2027, pak nové kódy (federální a regionální): přečíslovat články a značky.
- Polsko: třída ulice (GP–D) se odhaduje ze skupin OSM, hlavní ulice jako Z (opatrně).
- Jednosměrka s cyklisty v protisměru po směru bez dodatkové tabulky (NL, BE).
- Francie: normy kromě přístupnosti jen z druhé ruky (CEREMA přes přílohu ministerstva, příručky Paříže a Lyonu);
  **(Bára)** smí doporučení měst varovat v celé Francii? Tramvajová plošina bez zdroje. Arrêté 2007 ověřit na Légifrance
  (mohl být změněn). Paneláky (grands ensembles) zatím ne, **(Bára)**.

- Maďarsko odloženo (Bára 22. 11. 2026): bez otevřeného ortofota a mapy povrchů jen odhad z OSM a nejde změřit.
  Rozpracováno ve větvi `hungary` (`evaluation/hungary/README.md`). Vrátit se, až bude otevřené ortofoto nebo mapa
  povrchů Budapešti.
- Další státy vybírat podle otevřeného ortofota s CORS a mapy povrchů aspoň hlavního města. Průzkum 22. 11. 2026:
  `docs/states-survey/` (nejlépe Francie s Paříží, pak Španělsko, Švédsko, Kypr; Finsko a Dánsko jen s klíčem
  **(Bára)**; Slovinsko, pobaltské státy a Norsko zkusit znovu).

## Hledání

- Belgie a Lucembursko jen přes Photon; národní služby (Flandry geolocation, geoportail.lu) nezapojené.
- Francie: Géoplateforme hledá i bez města; přednost blízko středu mapy je slabá (lat/lon jen naznačí).

## Překlady

- Všechny jazyky kromě češtiny strojově: projít rodilým mluvčím, nejdřív irština, maltština, lotyština (tvary měst,
  Krakov, Valonsko, Flandry).

## Nasazení a provoz

- Balík OSM `be` (0,7 GB PBF) po prvním běhu workflow změřit, případně rozdělit pod 512 MB.
- Balíky `pl_sl` a `pl_ds` zasahují obdélníkem do Česka (jen dotazy navíc).
- Před nasazením NL, BE, LU, PL, FR: sloučit větve do `main` a ručně spustit workflow OSM tiles se `states: nl,be,lu,pl,fr`.
- Logování: D1 potřebuje sloupec `country` a nový Worker (`logging/README.md`), nasadit musí Bára.

## Licence ke kontrole

- Ortofoto PDOK (Nizozemsko), Flandry, Valonsko, ACT Lucembursko (ortho_latest), sítě Amsterdamu, mapa Krakova,
  služby českých a slovenských měst (MTVU, UMPS, pasporty).

## Nápady (Bára zatím nevybrala)

- Srovnávat a přepínat normy různých států, aby byly vidět rozdíly přístupů (Bára 20. 11. 2026).
- Výšky povrchu v profilu (DMR 5G, výškové body), jedna strana ulice výš než druhá (Bára 12. 11. 2026).
- Zóny a rychlosti po pruzích z OSM, povrch, názvy zastávek MHD, přechody.
