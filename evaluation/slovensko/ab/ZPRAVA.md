# A/B: pasporty slovenských měst a technická mapa Bratislavy (16. 11. 2026)

Bára: „přidej do aplikace všechny nalezené slovenské zdroje včetně bratislavské MTVU, u každé A/B jak je zvykem“;
pak „zapoj i ty linie technické mapy“. Větev `slovensko`, nic na `main`.

## Krátce

- **Pasporty měst pomáhají a jsou zapnuté:**
  - Kde pasport u řezu ulici má, je profil s ním lépe u 28 řezů, hůř u 7 a zhruba stejně u 8. Proti nim je dnešní
    odhad z ortofota ZBGIS a OSM.
  - Šířky chodníků jsou skutečné místo odhadu „do 6 m“.
  - Přibyly parkovací pruhy.
  - Pěší ulice a cesty v parku už nejsou dvoupruhová silnice.
  - Dvoupásové silnice (R1, Československej armády v Bystrici) mají obě vozovky.
- **Pasport se použije jen tam, kde má plochu přímo pod středem řezu.** V prvním kole se bral všude ve městě, a
  vnitrobloky a příjezdy k parkovištím, které město nespravuje, pak vyšly jako „Neurčeno“ nebo zeleň přes celý řez.
- **Technická mapa Bratislavy je zapojená, ale vypnutá** (zapne ji `?tm=1`):
  - Má čáry hranic druhů pozemků a značky ploch, ale značek je málo a čáry jsou místy otevřené. Plochy se pak
    slévají a ulici z nich poskládat nejde.
  - Na 40 bratislavských řezech se uplatnila u 8 nepojmenovaných cest, kde vyšla jedna plocha přes celý řez. Medená
    vyšla hůř.
  - Její ploty zkrátily 4 profily, z toho Brižitskou chybně hned za chodníkem.
  - Licence je jen „© Hlavné mesto SR Bratislava“, bez otevřené licence.
- **Pasport bratislavského magistrátu pokrývá v centru málo ulic:** u 21 z 25 řezů se neuplatnil. Dúbravka vlastní
  pasport má a pomáhá (6 lépe, 2 hůř).
- **Opravená chyba:** v Banské Bystrici spadlo čtení pruhů z ortofota (`lanes-ortho.js`, když se všechny kousky
  slily). Platí i pro Česko.

## Zdroje (towns/slovensko.js)

| Město | Zdroj | Co dává | CORS | Licence |
|---|---|---|---|---|
| Bratislava | pasport komunikácií pre peších 2022, vozovky (technický stav), parkoviská (ArcGIS Online magistrátu) | plochy chodníků, cyklochodníků, náměstí, vozovek, parkovišť | `*` | © magistrát, neuvedena |
| Bratislava-Dúbravka | pasport komunikácií MČ (ArcGIS Online) | cesta, chodník, parkovisko, zastávka, vjazd… | `*` | © MČ, neuvedena |
| Prešov | pasport dopravy (vw_dp_cesty, chodniky, parkoviska, spev_plochy), Plochy zelene, dreviny | plochy + stromy (body) | `*` | **CC BY 4.0** |
| Žilina | T-MAPY PaKom `ms:pk-pov` | vozovka, chodník, parkovisko, ostatné | pro naši stránku | neuvedena |
| Banská Bystrica | T-MAPY PaKom `ms:pk-pov` | vozovka, chodník, parkovisko, cyklotrasa | pro naši stránku | neuvedena |
| Bratislava, `?tm=1` | technická mapa (geoportal.bratislava.sk, Línie 7, Stavby 8, Prvky 9) | čáry → plochy podle značek; ploty, zábradlí, svodidla, koleje | pro naši stránku | © magistrát |

Kolem pasportu se doplní budovy, zeleň a voda z OSM. Kód typů technické mapy Bratislavy je přečtený z jejího seznamu
objektů („Štruktúra objektov polohopisného a výškopisného plánu“, podle pořadí sloupců): hranice druhu pozemku
2180–2220, ploty 2090–2171, budovy 4020/4030, schody 4080; značky 110 cestná, 120 pešia komunikácia, 5370 parkovisko,
3141 trávnik.

## Postup

- **Vzorek:** 115 náhodných bodů (pevné semínko, `vzorek.mjs`):
  - po 25 do 1,5 km od středu Bratislavy, Prešova, Žiliny a Banské Bystrice;
  - 15 v Dúbravce.
- **Sběr:** v aplikaci na localhostu (`sber.js`), každý bod dvakrát na stejném místě:
  - A = `?pasport=0` (dnešní odhad);
  - B = s pasportem.
- **Obrázky:** rozdílné řezy nad ortofotem ZBGIS (`obrazky.mjs`, `obrazky/index.html`), nahoře A modře, dole B
  červeně.
- **Posudky:** okem (`vysledky/posudky.json`): b = lépe s pasportem, a = lépe bez, obe = zhruba stejně, zadna = obojí
  špatně, ? = nejde posoudit (vozovka pod stromy, ve stínu, chybí A).
- **Technická mapa:** stejně jako C = `?pasport=0&tm=1` na 40 bratislavských bodech. Obrázky jsou v `obrazky-tm/`.

| Město | řezů | stejně (pasport u osy nic) | lépe s pasportem | lépe bez | zhruba stejně | obojí špatně | nejde posoudit |
|---|---|---|---|---|---|---|---|
| Bratislava (magistrát) | 25 | 21 | 1 | 1 | 0 | 1 | 1 |
| Dúbravka | 15 | 4 | 6 | 2 | 0 | 0 | 3 |
| Prešov | 25 | 9 | 9 | 1 | 4 | 1 | 1 |
| Žilina | 25 | 15 | 3 | 2 | 2 | 0 | 3 |
| Banská Bystrica | 25 | 12 | 9 | 1 | 2 | 0 | 0 (+1 chyba, opravena) |
| **celkem** | 115 | 61 | **28** | **7** | 8 | 2 | 8 |

**Kde je pasport horší:**
- obslužné cesty u parkovišť (pasport tam má jen kus plochy, Dúbravka č. 26, 33);
- Medená (magistrát má jen chodník, vozovka pak spadne na odhad 3 m);
- Potočná, Cestárska a Pod Urpínom: pasport má vozovku, ale chybí mu chodník nebo je posunutý asi o 1 m.

## Zbývá

- **Odhad podle celostátních vrstev ZBGIS:** šířka vozovky („Celková využiteľná šírka cesty“ u čar Cesta),
  parkoviště a tráva. Služba je ověřená, ale do aplikace zatím není zapojená ani otestovaná.
- **Licence:** Žilina, Banská Bystrica, magistrát a Dúbravka žádnou neuvádějí. Před nasazením je potřeba se jich
  zeptat.

# Čáry map dalších měst a pasport Zvolena (16. 11. 2026, druhé kolo)

Bára: „zapoj je všechny, vše přes průzkum a pak A/B testování“. Zdroje našel agent (`scratchpad`, souhrn níže).

## Průzkum

Čáry každé služby jsem nakreslila nad ortofotem ZBGIS a podle barvy typů určila, co sedí na obrubnících a hranách
chodníků:

| Město | Služba (ArcGIS Online, CORS `*`) | Co se bere | Licence |
|---|---|---|---|
| Nitra | `stavby` (kresba „hrany obrubníkov, chodníky“) | `typ_ciary` 1 | neuvedena |
| Piešťany | `vnu_kre_par` L11 (kresba) | `TYP_CIARY` 1 | neuvedena |
| Zvolen | `Kataster_12_v3` L1 (hranice druhů pozemků) | `TYP_CIARY` 1 a 60 | neuvedena |
| Hlohovec | `polohopis_24` L18 (polohopis z DXF) | `Layer` „Kresba polohopisu“ | neuvedena |
| Prešov | `Vrstva_hraníc_druhov_pozemkov` L52 | `TYP_CIARY` 1 | CC BY 4.0 |
| Bratislava | technická mapa, Línie | hranice druhu pozemku 2180–2220 | © magistrát |
| Zvolen (pasport) | `komunikacie_all_Online` (osy se šířkou), `spevnene_plochy_online` | chodník, cesta, parkovisko… jako plochy dané šířky | neuvedena |

**Jak se čáry používají:**
- Kde je řez protne, jsou čáry v odhadu z ortofota a OSM (`ortho-osm.js`) přednostními kandidáty na obrubník: mají
  bonus proti hranám snímku a bez snímku se berou, když leží do 2 m od místa, kde OSM obrubník čeká.
- Čára přes chodník ukončí chodník; zbytek k domu je zeleň nebo zpevněná plocha podle snímku.
- Uzavřené být nemusí.
- `?hrany=0` čáry vypne.

## A/B

- **Vzorek:** po 20 náhodných bodech v Nitře, Zvolenu, Piešťanech a Hlohovci (`vzorek-hrany.mjs`) a k tomu body Prešova
  a Bratislavy z prvního kola, celkem 145.
- **Varianty:** A = `?hrany=0`, B = s čarami; ve Zvolenu navíc A0 = bez pasportu. Obrázky jsou v `obrazky-hrany/`.

**Čáry map (A proti B):** profil se změnil u 30 řezů ze 145. Posouzeno 26, čtyři drobné posuny pod 0,7 m jsem
nehodnotila.

| Výsledek | řezů | kde |
|---|---|---|
| lépe s čarami | 9 | Nitra 3, Piešťany 2, Hlohovec 2, Bratislava 2 |
| hůř | 3 | Hlohovec (krajnice přes zelený pás, zeleň místo dláždění na náměstí), Fándlyho (dva pruhy na úzké ulici) |
| zhruba stejně nebo nejde posoudit | 10 | |
| neposouzeno (drobné posuny) | 4 | |

- **Co se zlepšuje nejvíc:** chodník končí u své hrany a za ním je zeleň se stromy, místo chodníku „do 6 m“ až k domu.
  Obruby se posouvají jen o desítky centimetrů.
- **Prešov:** čáry se neuplatnily ani jednou, protože tam rozhoduje pasport.
- **Čáry jsou zapnuté.**

**Pasport Zvolena (A0 proti A):** profil se změnil u 11 řezů. Zhruba 6 hůř, 1 lépe (Strážska cesta), zbytek nejasně:
- spevnené plochy leží přes trávníky a parkoviště (J. Kráľa: „plocha“ 41 m);
- šířky os jsou rozpětí („1,4–1,7 m“);
- na obslužných cestách z toho vychází „plocha“ a „Neurčeno“.

**Je vypnutý** (`?zvolen=1`).
