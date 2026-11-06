# Profily ulic – pilot (Praha)

Kliknete na ulici v mapě a aplikace z technické mapy IPR (vrstva MTVU) a z OSM sestaví
příčný profil. Ten pak upravujete: šířky tažením, typy, pořadí, přidávání a mazání,
stav / návrh / porovnání, export SVG a PNG, uložení a načtení návrhu (JSON).

## Spuštění

```bash
node pilot/server.mjs
```

Pak otevřete http://localhost:5173. Potřebujete Node.js 22 nebo novější a připojení
k internetu (podkladové mapy a technická mapa IPR). Rozpracovaný profil si prohlížeč
pamatuje i po zavření.

## Odkud jsou data

- **Šířky:** IPR Praha, *Mapa technického využití území* (MTVU), služba
  `gs-pub.praha.eu/.../dtmp/dtmp/MapServer/15`. Odpovědi se ukládají do `pilot/cache/mtvu`,
  stejné místo se tedy podruhé načte hned. První načtení trvá podle serveru IPR 1–10 s.
- **Tramvajové koleje:** osy kolejí z liniové vrstvy technické mapy IPR (`dtmp/MapServer/10`, kód 55010
  „MHD – osa kolejí“), cache v `pilot/cache/koleje`. Pruh s tramvají sahá 1,75 m od osy koleje ven
  a mezi kolejemi do poloviny osové vzdálenosti. Odpovídá to Manuálu tvorby veřejných prostranství
  IPR (kap. C.2): dvoukolejný tramvajový pás 6,5 m při osové vzdálenosti 3 m, 7 m při 3,5 m. Zbytek vozovky široký aspoň 2,5 m se stane samostatným jízdním pruhem. Kde osy
  kolejí chybí, použije se tramvajová trať z OSM.
- **Parkování v zónách placeného stání:** úseky parkovacích stání TSK (`gs-pub.praha.eu/.../dop/zony_placeneho_stani/MapServer/3`,
  polygony, cache v `pilot/cache/parkovani`). Stejná data používá i Golemio (zdroj `tsk_v2`), ale bez API klíče.
  Mají přednost před plochami parkování z OSM.
- **Parkovací zálivy:** plochy parkování z OSM (`amenity=parking` s `parking=street_side`, `lane`, `on_kerb`…).
  Technická mapa je samostatně nerozlišuje, proto mají přednost před MTVU; úzké zbytky vozovky
  nebo chodníku vedle nich se k parkování přičtou.
- **Stromy:** stromořadí (`natural=tree_row`) a jednotlivé stromy (`natural=tree`) z OSM do 8 m od řezu.
  V chodníku se kolem nich vyčlení stromořadí široké 1,5 m; zelený pás se stromy se označí jako stromořadí,
  bez stromů jako zeleň.
- **Nástupiště MHD:** nástupiště z OSM (`public_transport=platform`, `railway=platform`, `highway=platform`;
  čáry i plochy). Ostrůvek s nástupištěm se celý označí jako nástupiště, na širokém chodníku jen pás 3 m
  u obruby.
- **Zásobování, ZTP, speciální stání:** vrstvy 5–8 stejné služby TSK; parkovací pruh dostane účel.
- **Pruhy pro autobusy:** OSM `busway:*=lane`, `bus:lanes`, `psv:lanes`, `lanes:bus`, `lanes:psv`;
  **pruh BUS + cyklisté** z `cycleway:*=share_busway` nebo `bicycle:lanes=…|designated`. Na jednosměrce
  platí tagy bez strany (`busway=lane`, `cycleway=*`) jen pro pravou stranu.
- **Prvky v profilu** (kreslí se uvnitř části, v editoru jdou přidat a smazat):
  mobiliář z OSM do 6 m od řezu (lampy, lavičky, stojany a sdílená kola, přístřešky, rozcestníky, taxi,
  sloupky, květináče, předzahrádky); bariéry a svahy z linií technické mapy (svodidla 71522/71540,
  zábradlí 61530, ploty a zdi 61209/61210/71210/81210/91210, opěrné zdi 61422/71422/81422, živé ploty 81214,
  hrany svahů 42105/42107) a z OSM `barrier=*`.
- **Předzahrádky restaurací:** plochy OSM `leisure=outdoor_seating`. **Vodní plochy:** MTVU 500–504.
  **Barevné cyklopruhy:** `cycleway:*:surface:colour`.
- **Co v ulici je** (počet pruhů, jednosměrka, tramvaj, parkování, cyklopruhy): lokální výřez
  OSM pro Prahu (BBBike, `data/osm/Prag.osm.pbf`), rozdělený na dlaždice do `pilot/data/osm-tiles`.
  Overpass se nepoužívá.
- **Podklady mapy:** výchozí je základní mapa IPR; dál černobílá a tmavá (černobílá invertovaná v prohlížeči),
  zástavba (plochy budov technické mapy), letecká a mimovegetační ortofoto IPR (`imgs/.../ort/*_letecke_snimkovani`),
  ortofoto ČÚZK a OpenStreetMap. Vrstvu „Technická mapa IPR“ jde zapnout navrch. Vybraný podklad si prohlížeč pamatuje.

### Aktualizace OSM výřezu

Skript stáhne výřez BBBike (když ještě není v `data/osm/Prag.osm.pbf`), vybere z něj ogr2ogr potřebné prvky
do `data/osm/praha_*.geojsonl` a rozdělí je na dlaždice do `pilot/data/osm-tiles`:

```bash
OGR=/Applications/QGIS-final-4_2_3.app/Contents/MacOS/ogr2ogr PROJ_DATA=/Applications/QGIS-final-4_2_3.app/Contents/Resources/qgis/proj GDAL_DATA=/Applications/QGIS-final-4_2_3.app/Contents/Resources/qgis/gdal tools/build_osm_data.sh
```

Pro čerstvá data nejdřív smažte `data/osm/Prag.osm.pbf`. Přesné výběry (ulice, parkování, stromy, nástupiště,
mobiliář, bariéry, předzahrádky, budovy s počtem podlaží) jsou ve skriptu `tools/build_osm_data.sh`.

### Orientace stání

Podélné, šikmé a kolmé stání se bere z OSM (`orientation` u ploch parkování, `parking:*:orientation` u ulic).
U úseků TSK se dopočítá z průměrné hloubky úseku (plocha / délka) a počtu stání (`PS_ZPS`): hloubka
od 4,9 m = kolmé, pod 3 m = podélné, jinak podle délky na stání (pod 3,4 m kolmé, 3,4–4,8 m šikmé, víc podélné). Kde nic z toho není, odhadne se z hloubky pásu: do 3,2 m podélné,
do 4,6 m šikmé, jinak kolmé.
`parking:*=on_kerb` vyčlení stání z chodníku u obruby (2 / 4,5 / 5 m podle orientace), `half_on_kerb` 1 m.
V editoru jde orientace změnit ručně. Kolmé stání má podle ČSN 73 6056 hloubku 5,0 m, s přesahem vozidel
přes obrubník 4,5 m; užší změřený pás kolmého stání se doplní na 4,5 m z chodníku nebo zeleně za obrubníkem.

### Výška budov

Počet podlaží budov na okrajích profilu se bere z vrstvy IPR *Podlažnosti*
(`mp.iprpraha.cz/.../URK_CUR_URK_SS_PODLAZNOST_P/FeatureServer/0`: podlaží po římsu, střešní/ustupující
podlaží, celkem; cache v `pilot/cache/podlaznost`), jinak z OSM `building:levels` (+ `roof:levels`).
Výška se kreslí 3,5 m na podlaží (přesná výška jen z OSM `height`), střešní podlaží užší a tmavší.

## Jak se profil skládá

1. Najde se nejbližší ulice z OSM a řez se vede kolmo na její osu (±40 m).
2. Řez se rozdělí podle ploch MTVU (silnice, chodník, cyklostezka, parkoviště, tramvajové těleso,
   zeleň, zahrady…). Profil končí u první budovy, u zahrady (ta se kreslí jako okraj mimo ulici),
   nebo 22 m od osy. Tažením konce řezu jde dosah na každé straně zvlášť zkrátit nebo prodloužit (3–40 m);
   zkrácená strana pak končí volným okrajem.
3. Vozovka se podle tagů OSM rozdělí na parkovací pruhy, cyklopruhy a jízdní pruhy:
   `cycleway:*=lane` → cyklopruh 1,5 m, `soft_lane` → ochranný pruh 1,25 m, `shared_lane` → piktokoridor
   v krajním pruhu; cyklisté v protisměru (`oneway:bicycle=no` u jednosměrky, `opposite_lane`, `opposite`,
   `cycleway:*:oneway=-1`) dostanou opačný směr než auta a popisek „kola v protisměru“; `parking:*=lane|street_side` → parkovací pruh (pokud tam už není parkoviště z MTVU
   nebo plocha z OSM); `lanes:forward`/`lanes:backward` určí počty pruhů v každém směru a
   `turn:lanes(:forward|:backward)` řazení (vlevo, rovně, vpravo). Směr pruhů se bere z nejbližší osy OSM,
   takže sedí i na směrově rozdělených silnicích. Kde vozovkou vedou
   koleje, vznikne kolem každé osy koleje pruh s tramvají a vedle něj jízdní pruhy pro auta.

4. Cyklostezka (MTVU 703) dostane směr z cyklostezky v OSM, která jí vede: jednosměrná jede se svou osou,
   obousměrná se rozdělí na dvě poloviny. Úzký vyvýšený zpevněný pás (do 6 m) mezi dvěma vozovkami
   se označí jako dělicí pás / ostrůvek.

5. Pruh je široký nejvýš 4 m (dálnice a silnice pro motorová vozidla 3,75 m, místní ulice 4,5 m). Zbytek vozovky
   od 1 m se nakreslí jako **krajnice / šrafy** u okrajů a označí jako odhad: technická mapa neobsahuje
   vodorovné značení.
6. U obruby s chodníkem (i za úzkým zeleným pásem do 3 m) v ulicích residential, living_street a unclassified (na hlavních ulicích ne) se přidá **odhadnuté podélné
   stání** 2 m, pokud tam není stání z TSK ani z OSM, tag ho nezakazuje a pruhy zůstanou široké aspoň 3 m.
7. Obytné zóny (`living_street`) se dělí jako ostatní ulice (Streetmix sdílený prostor nezná). Odhad stání platí i
   v nich; místní ulice bez tagu `lanes` potřebuje mezi odhadnutým stáním jen jeden pruh 2,5 m. Vozovka v pěší
   zóně (`highway=pedestrian`) zůstává vozovkou, bez tagu `lanes` jako jeden obousměrný pruh.
8. Svodidlo z technické mapy s osou silnice na obou stranách rozdělí plochu vozovky a vznikne **dělicí pás** 0,6 m.
   U ulice ze dvou jednosměrných os se stejným jménem (protisměrných) se střed řezu posune doprostřed mezi ně
   (třeba na tramvajový pás), dosah se měří odtud a zeleň mezi vozovkami profil neukončí.
9. Klik do mapy posune řez po ulici aspoň 15 m od křižovatky a 6 m od přechodu (tažený řez zůstane, kam ho dáte).
10. Kde technická mapa pod osou ulice nemá zpevněnou plochu (pole, louka, zeleň, díra v MTVU), profil je odhad
    z OSM a aplikace to napíše. Parkoviště MTVU (704) široké aspoň 8 m profil ukončí jako okraj „parkoviště".
    Úsek useknutý dosahem se celý ponechá nebo vynechá, když by z něj zbylo méně než 1,5 m.
11. Server neukládá do cache chybové odpovědi IPR a dotazy na IPR vzdá po 20 s.

## Export do Streetmixu

Tlačítko **Streetmix ↗** převede aktuální profil (stav nebo návrh) na ulici Streetmixu (schéma 35, metrické
jednotky; převod je v `public/streetmix.js`), pošle ji přes lokální server na `streetmix.net/api/v1/streets`
a otevře ji v novém okně. Ulice vznikne jako **veřejná anonymní** ulice na streetmix.net.

Barevný proužek pod každou částí ukazuje původ: zelená = změřeno z technické mapy,
hnědá = rozdělení podle OSM, červená = odhad, fialová = upraveno ručně.

## Publikace na GitHub Pages

Aplikace umí běžet i bez serveru: v `public/config.js` je `STATIC = false` (data přes lokální server s cache)
a při nasazení se přepíše na `true`. Prohlížeč se pak ptá služeb IPR a Streetmixu přímo (obě povolují CORS)
a dlaždice OSM čte jako statické soubory `data/osm-tiles/<ix>_<iy>.json`. Bez serverové cache trvá každé
načtení řezu podle IPR 1–10 s.

Nasazení dělá `.github/workflows/pages.yml`: při každém pushi do `main`, ručně a jednou týdně vyrobí dlaždice
OSM skriptem `tools/build_osm_data.sh`, přidá je k `pilot/public` a vystaví na GitHub Pages. Dlaždice se
do repozitáře neukládají. Jsou to data odvozená z OpenStreetMap, takže na webu leží pod ODbL 1.0
(viz `data/README.txt` na webu a patičku aplikace).

## Licence a uvedení zdrojů

- Kód: MIT, © 2026 Bára Soukupová (`LICENSE` v kořeni repozitáře).
- Ilustrace: © Streetmix, CC BY-SA 4.0 (`public/streetmix/LICENSE`). Upravené ilustrace musí zůstat pod stejnou licencí.
- MTVU a technická mapa: © IPR Praha (otevřená data IPR jsou pod CC BY 4.0; podmínky samotné služby gs-pub nejsou ověřené).
- OSM: © přispěvatelé OpenStreetMap, ODbL. Ortofoto: © ČÚZK.
