# Most nad vodou v odhadu (26. 11. 2026)

Položka backlogu: bez mapy povrchů řezal odhad z ortofota a OSM most podle vody pod ním (Most Kotlarski v Krakově:
„voda“ mezi vozovkami místo tramvaje a místo chodníků). Voda a zeleň OSM leží na zemi; ulice na mostě je nad nimi.

**Změna** (`pilot/public/ortho-osm.js`, před plochami zeleně a vody): je-li řezaná ulice na mostě (`bridge` a úroveň nad
zemí, `layer` nebo 1), voda ani zeleň OSM s nižší vrstvou se pod ní neberou. Konec ulice pak dává už existující pravidlo
z map povrchů (`derive.js`, Hlávkův most): ulice na mostě končí za krajním chodníkem. Plochy `man_made=bridge` dlaždice
OSM nemají (`tools/build_osm_tiles.mjs` je nedrží), proto rozhoduje značka mostu na řezané ulici. `?off=mostvoda` = dřív.

**Vzorek** (`points.json`, `find.mjs`: silnice s mostem nad vodou OSM a ulice s vodou 25 m vedle, z balíků OSM): 30 mostů
a 14 nábřeží v Krakově, Varšavě, Vratislavi, Gdaňsku, Poznani, Turíně, Turku, Tampere, Odense; Porto, Coimbra a Lisabon
jen nábřeží (mosty ve vzorku nebyly). A/B v aplikaci (`sber.js`, `?osm=balik&mapa=0&ai=0`: bez mapy Krakova a bez AI
obrub, které na vytíženém stroji končily časovým limitem a dělaly šum). Florencie a Řím nedaly profil ani v A, ani v B
(nezávislé na změně), body v Praze a Brně trefily pěšiny; Praha a Brno jsou v regresi.

**Výsledek z 27 mostů s profilem: lépe 18, hůř 0, sporně nebo stejně 9.**

- Lépe: kr12 Most Kotlarski (voda 11 m mezi vozovkami → dělicí pásy a tramvaj, voda u obrub → chodníky), Varšava
  Śląsko-Dąbrowski, Wybrzeże Szczecińskie, Świętokrzyski, Vratislav Dmowskiego, Mieszczański (tramvaj uprostřed),
  Uniwersyteckie, Gdaňsk Olszyńska, Toruńska, Chmielna (dřív jen vozovka a „voda“ na obou koncích), Poznaň sv. Rocha
  (tramvaj), Krakov Grunwaldzki (tramvaj), Konopnickiej, Turku Martinsilta, Tampere Paasikivenkatu, Hatanpään valtatie,
  Odense Klaregade, Albanigade (dělicí pásy kolem tramvaje).
- Sporně nebo stejně: Turín Via Livorno, Re Alberto, Principe Oddone (voda → zeleň ze snímku: řeka Dora je na ortofotu
  zelená; uprostřed Via Livorno vede po mostě busway, nekreslí ho ani A, ani B), Odense Brogade (chodníky 6 m, strop),
  Turku Myllysilta a Auransilta, Tampere Tampereen valtatie, Poznaň Królowej Jadwigi, Krakov Dębnicki (kousky do 1 m).
- Kontroly (nábřeží, ulice bez mostu): změna se jich netýká; 10 z 12 stejně, Książęca a Tyniecka se liší jen šumem
  běhu (stejný stav B dvakrát po sobě dal jednou jiný výsledek).

**Regrese** `node evaluation/ortofoto-osm/regrese.mjs`: všechny čtyři řádky (Praha ČÚZK a IPR, Brno ČÚZK a 10 cm)
shodné s `vysledky/regrese.txt`. **Zapnuto.**

Zbývá: zeleň ze snímku na mostě (Turín) a mosty se dvěma oddělenými konstrukcemi, kde mezi nimi voda opravdu je; na to
by byly potřeba plochy mostů (`man_made=bridge`) v dlaždicích OSM.
