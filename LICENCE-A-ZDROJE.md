# Profily ulic – licence a podmínky zdrojů

Stav k 10. 11. 2026. Nejde o právní posouzení. Jde o přehled licencí, které jsem ověřila v katalozích a dokumentaci zdrojů.

## Shrnutí

Projekt jde zveřejnit, pokud se splní tři věci:

1. **Uvést zdroje** v aplikaci i v exportovaných obrázcích (doplněno, viz níže).
2. **Šířit jen to, co šířit smíme.** Nasazení na GitHub Pages zveřejňuje kromě kódu i data připravená při nasazení:
   dlaždice OSM celé ČR (odvozená databáze, nabízená pod ODbL), dlaždice otevřených dat Prahy (CC BY 4.0), hranice
   ZPS (TSK, CC BY 4.0), dlaždice vývoje zástavby (IPR, CC BY 4.0), úseky stání v Brně (parkovanivbrne.cz) a zóny
   placeného stání Plzně (CC0). Technické mapy bez licence (IS DMVS, DTM krajů, služby měst) se **nešíří**: prohlížeč
   se jich ptá při kliknutí. Do repozitáře stažená data nepatří (`.gitignore`).
3. MTVU a technická mapa IPR jsou podle Báry **povinně zveřejňovaná data** (veřejná část DTM), takže je lze použít.
   Stačí uvést „© IPR Praha“.

Obrázky profilů, které aplikace vytváří, obsahují ilustrace Streetmixu. Proto musí být šířeny pod **CC BY-SA 4.0**.

U technických map a služeb bez uvedené licence používám jednotnou formulaci: **veřejně přístupná data (zák. 200/1994 Sb.),
licence neuvedena; čteno při kliknutí, nešíří se.** Nejsou to otevřená data ani licencovaná data.

## Zdroje a licence

| Zdroj | Co z něj bereme | Licence / podmínky | Stav |
|---|---|---|---|
| IPR – Mapa technického využití území (MTVU), `gs-pub.praha.eu/.../dtmp/dtmp/MapServer/15` | šířky ploch v řezu | Povinně zveřejňovaná data technické mapy (veřejná část DTM); uvést „© IPR Praha“. Čteno při kliknutí, nešíří se. | ✓ |
| IPR – liniové prvky technické mapy (osy kolejí, svodidla, zábradlí, ploty, svahy), tamtéž `/10` | koleje, bariéry, svahy | Stejné jako MTVU: povinně zveřejňovaná data, uvést „© IPR Praha“ | ✓ |
| IPR – bodové prvky technické mapy (sloupy trakčního vedení, zastávky, sloupky, stromy, sloupy bez vedení), tamtéž `/9` | předměty v profilu, stromořadí | Stejné jako MTVU: povinně zveřejňovaná data, uvést „© IPR Praha“. Jeden dotaz na řez (Bára povolila 10. 11. 2026). | ✓ |
| Geoportál Praha – Sdílená data o zeleni (vegetační prvky – body), Stromořadí, Zákaz stání (TSK), Uliční úseky TSK včetně zatřídění komunikací (opendata.geoportalpraha.cz) | stromy, stromořadí, mezery v úsecích stání, odhad stání podle třídy ulice | **CC BY 4.0**, uvést „© IPR Praha, TSK hl. m. Prahy, MHMP“ a že jsou data upravená. Stahuje se jednou při nasazení do statických dlaždic (`tools/build_praha_opendata.mjs`), které se **zveřejňují** na Pages (`data/praha/opendata`); aplikace se při kliknutí neptá. | ✓ |
| IPR – mapa a polohopis technické mapy jako podkladová mapa (ArcGIS Online, `gs-pub.praha.eu`) | jen zobrazení | Uvést „© IPR Praha“ | ✓ |
| IPR – Podlažnosti (`URK_CUR_URK_SS_PODLAZNOST_P`) | počet podlaží budov | **CC BY 4.0** (otevřená data IPR), uvést „© IPR Praha“ | ✓ |
| IPR – Vývoj zástavby v Praze 1840–2010 (`URK_CUR_URK_VYVOJZASTAVBY_P`) | stáří zastavěného území jako výchozí odhad vzhledu domu | **CC BY 4.0**, uvést „© IPR Praha“. Stahuje se jednou při nasazení do statických dlaždic (`tools/build_vyvoj.mjs`), které se zveřejňují na Pages. | ✓ |
| TSK přes IPR – úseky parkování, ZTP, zásobování, speciální stání (`dop/zony_placeneho_stani`), hranice ZPS (`tools/build_zps.mjs`) | parkování | **CC BY 4.0** (otevřená data IPR, poskytovatel HMP-TSK). Hranice ZPS jako statický soubor na Pages. | ✓ |
| OpenStreetMap (výřez ČR z Geofabriku, `tools/build_osm_data.sh`, každé pondělí znovu) | osy ulic a tagy, stromy, mobiliář, budovy… | **ODbL 1.0**: uvést „© přispěvatelé OpenStreetMap“. Dlaždice celé ČR jsou odvozená databáze a **zveřejňují se** na Pages (`data/osm-tiles`), proto jsou nabízené pod ODbL 1.0. Obrázky z dat jsou „produced work“ a stačí u nich uvedení zdroje. | ✓ |
| Podkladové dlaždice `tile.openstreetmap.org` | mapa v aplikaci | Zdarma podle [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) OSMF: jen mírný provoz, s atribucí „© přispěvatelé OpenStreetMap“ s odkazem na openstreetmap.org/copyright, bez hromadného stahování. | ✓ / pozor na provoz |
| ČÚZK – ortofoto (WMS) | podkladová mapa; u tramvají jeden malý výřez na řez pro povrch tělesa (`ortho.js`) | Ortofoto ČR jsou od 1. 7. 2023 otevřená data pod **CC BY 4.0** ([technická zpráva ČÚZK](https://geoportal.cuzk.gov.cz/Dokumenty/TZ_Ortofoto_CR.pdf), [podmínky ČÚZK](https://cuzk.gov.cz/Predpisy/Podminky-poskytovani-prostor-dat-a-sitovych-sluzeb/Podminky-poskytovani-prostorovych-dat-CUZK.aspx)). Uvést „ortofoto © ČÚZK, 2025“. | ✓ |
| ČÚZK – RÚIAN: budovy (`ags.cuzk.gov.cz/.../RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN`), parcely | podlaží, využití, rok dokončení, druh konstrukce domu; plochy, kde technická mapa nic nemá | Otevřená data, **CC BY 4.0**, uvést „RÚIAN © ČÚZK, 2026“ | ✓ |
| ČÚZK – hranice obcí a krajů z RÚIAN (`pilot/public/mesta.json`, `tools/build_mesta.mjs`; `pilot/public/kraje.json`, `tools/build_kraje.mjs`) | město a kraj podle místa řezu | **CC BY 4.0**, zjednodušené (upraveno). Malé soubory v repozitáři. | ✓ |
| ČÚZK – vyhledávání adres RÚIAN (`ags.cuzk.gov.cz/.../RUIAN/Vyhledavaci_sluzba_nad_daty_RUIAN/MapServer`, GeocodeSOE `suggest` a vrstvy adresních míst a ulic; `pilot/public/search.js`) | návrhy adres, ulic a obcí při psaní do pole na mapě, poloha vybraného místa a osa ulice pro řez | Bez klíče, CORS povolený; data RÚIAN otevřená, **CC BY 4.0** ([Podmínky poskytování prostorových dat ČÚZK](https://cuzk.gov.cz/Predpisy/Podminky-poskytovani-prostor-dat-a-sitovych-sluzeb/Podminky-poskytovani-prostorovych-dat-CUZK.aspx)), uvést „RÚIAN © ČÚZK“ (v patičce). Samostatné podmínky služby ČÚZK nezveřejňuje; ohleduplně: od 3 znaků, prodleva 300 ms, zastaralý dotaz se ruší, odpovědi v paměti. | ✓ |
| Celostátní technická mapa ČÚZK, IS DMVS, WMS `dmvs.cuzk.gov.cz/api/wms/dtm_zps_plochy_bar` a `dtm_zps_linie_body` (obrázky a typ plochy v bodě, `pilot/public/dmvs.js`) | plochy v řezu mimo naše města a tam, kde mapa města nic nemá; podkladová mapa | Veřejně přístupná data (zák. 200/1994 Sb.), licence neuvedena; čteno při kliknutí, nešíří se. Data vede kraj. Uvádět „technická mapa © <kraj>, IS DMVS ČÚZK“. | ✓ |
| **DTM krajů** (Jihočeský, Pardubický, Vysočina, Moravskoslezský, Královéhradecký, Jihomoravský, Liberecký, Karlovarský, Zlínský): WFS 2.0 jejich mapové služby `…/mapservice/v1/wms/dtm_zps_plochy_bar` (`jck.krajdtm.cz`, `pak.`, `vys.`, `msk.`, `khk.krajdtm.cz`, `dtm.jmk.cz`, `dtm.kraj-lbc.cz`, `dtm.kr-karlovarsky.cz`, `dtm.zlinskykraj.cz`; `pilot/public/dtmwfs.js`, kraj podle `kraje.json`) | plochy v řezu (polygony místo obrázků DMVS) | Veřejně přístupná data (zák. 200/1994 Sb.), licence neuvedena; čteno při kliknutí, nešíří se. Stejná data jako v IS DMVS. Uvádět „technická mapa © <kraj>“; export uvádí konkrétní kraj řezu. | ✓ |
| Streetmix – ilustrace (`pilot/public/streetmix/`) | kreslení profilu | **CC BY-SA 4.0** ([FAQ Streetmixu](https://docs.streetmix.net/user-guide/support/faq)): uvést Streetmix, licenci a odkaz na streetmix.net. Odvozené obrázky musí zůstat pod CC BY-SA. | ✓ s podmínkou |
| Pražské ilustrace (`pilot/public/praha/`) | kreslení profilu (tramvaj T3, autobus, lampa, lavička, stojan, přístřešek, sloupek) | Vlastní ruční SVG, kreslené podle veřejných fotek (Wikimedia Commons, brožura IPR k soutěži na mobiliář); fotky ani cizí kresby nejsou převzaté. Licence jako kód (MIT). Bez log a ochranných známek. | ✓ |
| Dopravní značky (`pilot/public/znacky/`) | řádek značek pod profilem | Vzory z přílohy vyhlášky 294/2015 Sb. jsou úřední dílo (§ 3 písm. a) zák. 121/2000 Sb.), volné. Piktogramy kola, chodce, auta a motocyklu z Wikimedia Commons (CZ road sign B-8, B-30, B-11; volné dílo); ostatní kresby vlastní, MIT. Soubory Commons s CC BY(-SA) nepoužité. Podrobnosti v `pilot/public/znacky/README.md`. | ✓ |
| Sloupy trakčního vedení a označníky zastávek (`sloup-trakce*`, `oznacnik*` v `praha/`, `brno/`, `plzen/`, `most/`, `cesko/`) | kreslení profilu | Vlastní kresby podle fotek z Wikimedia Commons (jen předloha), MIT. | ✓ |
| Streetmix – kód | **nepoužíváme**. Převod do Streetmixu (`streetmix.js`) je vlastní kód, ze Streetmixu bere jen názvy segmentů a variant. Tlačítko „Do Streetmixu“ v aplikaci není, API Streetmixu se nevolá. | AGPL-3.0 by se týkala jen převzatého kódu | ✓ |
| **Brno:** Mapa technického využití území (MTVU) a kresba technické mapy (UMPS), `gis.brno.cz/ags3/rest/services/PUBLIC/opendata_mtvu` a `opendata_umps` | plochy v řezu; koleje, svodidla, ploty, zdi, svahy, lampy, stromy, lavičky | Veřejně přístupná data (zák. 200/1994 Sb.), licence neuvedena; čteno při kliknutí, nešíří se. Uvádět „© Statutární město Brno“. | ✓ / ověřit licenci |
| **Brno:** cykloopatření (data.brno.cz, `services6.arcgis.com`) | cyklopruhy a piktokoridory v řezu | Otevřená data města, **CC BY 4.0**, uvést „© Statutární město Brno“. Čteno při kliknutí. | ✓ |
| **Brno:** DTM Jihomoravského kraje jako podkladová mapa (WMS DMVS `dtm_zps_plochy_bar`, `dtm_zps_linie_body`) | jen zobrazení | Veřejně přístupná data (zák. 200/1994 Sb.), licence neuvedena; jen zobrazení, nešíří se. | ✓ |
| **Brno:** úseky placeného stání, zásobování a obrátková stání z mapy parkovanivbrne.cz (`tools/build_parkovani_brno.mjs`) | parkování v řezu | Stejná data města (Brněnské komunikace) jako jeho otevřená data na data.brno.cz (CC BY-SA); otevřená data jsou z 2/2024 a od té doby se neaktualizují, mapa je aktuální. U mapy je „Copyright © Parkovanivbrne.cz“. Stahuje se jednou při nasazení, na Pages se zveřejňují odvozené dlaždice. Rozhodla Bára (9. 11. 2026). | ✓ |
| **Brno:** Průzkum budov v Brně (KAM, gis.brno.cz) | počet podlaží, podlaží ve střeše, typ střechy, využití přízemí | **CC BY 4.0**, © Statutární město Brno (KAM) | ✓ |
| **Brno:** Ortofoto 2025 (gis.brno.cz, dlaždice) | podkladová mapa | © Statutární město Brno; v katalogu data.brno.cz je ortofoto pod CC BY | ✓ |
| Brněnské ilustrace (`pilot/public/brno/`) | tramvaj Tatra T3 v nátěru DPMB (a Škoda 45T a 13T), autobus DPMB; lampa, lavička, stojan, sloupek a přístřešek podle zásad KAM Brno (Principy tvorby veřejných prostranství, kap. 9) | Vlastní ruční SVG podle veřejných fotek (Wikimedia Commons); licence jako kód (MIT). Bez log a ochranných známek. | ✓ |
| **Jihlava:** pasport komunikací (úseky vozovek a chodníků), parkovací místa, trávníky, stromy, stožáry osvětlení, lavičky, technická mapa města a ortofoto, `gis.jihlava-city.cz` (`server1/ost/Pasporty`, `server1/verejnost/doprava_verejnost`, `server1/opendata`, `server1/DTM`, `server/basemaps`) | plochy v řezu, parkování s orientací, ploty a zábradlí, stromy, lampy, zastávky s přístřešky, stojany na kola; podkladová mapa | Veřejně přístupná data (zák. 200/1994 Sb.), licence neuvedena; čteno při kliknutí, nešíří se. Uvádět „© Statutární město Jihlava“. | ✓ / ověřit licenci |
| **Jihlava:** katastr nemovitostí (parcely s druhem pozemku) přes službu města `server/ost/Ji_parcely` | plochy v řezu mimo komunikace a budovy (zahrady, dvory, zeleň, krajnice) | Data ČÚZK (katastrální mapa a SPI), otevřená, CC BY 4.0 | ✓ |
| **Jihlava:** budovy RÚIAN přes službu města `server/ost/ORP_RUIAN` | budovy v řezu | RÚIAN je otevřený (ČÚZK, CC BY 4.0) | ✓ |
| **Most:** objektová mapa povrchové situace a stožáry osvětlení (otevřená data), technická mapa a ortofoto, `mapy.mesto-most.cz` (`Opendata`, `DTM`, `Ortofoto`) | plochy v řezu, ploty, zdi, koleje, stromy, lavičky, lampy; podkladová mapa | Otevřená data města „k veřejnému využití“ bez uvedené licence; technická mapa: veřejně přístupná data (zák. 200/1994 Sb.), licence neuvedena; čteno při kliknutí, nešíří se. Uvádět „© Statutární město Most“. | ✓ / ověřit licenci |
| **Opava:** účelová mapa povrchové situace, parkovací stání, stromy, lavičky, zastávky, stojany, `mapy.opava-city.cz` (`external`, `basemaps`) | plochy v řezu, parkování, body; podkladová mapa | Veřejně přístupná data (zák. 200/1994 Sb.), licence neuvedena; čteno při kliknutí, nešíří se. Uvádět „© Statutární město Opava“. | ✓ / ověřit licenci |
| **Plzeň:** technická mapa (DTM), 3D budovy, pasport zeleně a mobiliáře, ortofoto 2024, `ags.plzen.eu` | plochy a linie v řezu, výšky budov, stromy, lavičky, stojany, sloupky; podkladová mapa | Veřejně přístupná data (zák. 200/1994 Sb.), licence neuvedena; čteno při kliknutí, nešíří se. Uvádět „© Statutární město Plzeň“. | ✓ / ověřit licenci |
| **Plzeň:** zóny placeného stání, opendata.plzen.eu (sada 125 „Parkovací zóny“) | stání v ulicích zón (odhad) | CC0; statický soubor při nasazení (`tools/build_zony_plzen.mjs`), zveřejněný na Pages | ✓ |
| **Ostrava:** technická mapa (Polohopis DTM – generalizace), osy tramvajových kolejí, úseky placeného stání, `mapy.ostrava.cz` | plochy v řezu, koleje, parkování | Veřejně přístupná data (zák. 200/1994 Sb.), licence neuvedena; čteno při kliknutí, nešíří se. Uvádět „© Statutární město Ostrava“. | ✓ / ověřit licenci |
| **Frýdek-Místek:** pasport komunikací a zeleně, mobiliář, osvětlení (služba města na T-MAPY, `gis.frydekmistek.cz`, WFS) | plochy komunikací a zeleně přes DTM kraje, stromy, lavičky, stojany, lampy | Veřejně přístupná data, licence neuvedena; čteno při kliknutí, nešíří se. Uvádět „© Statutární město Frýdek-Místek“. | ✓ / ověřit licenci |
| **Karviná:** pasport komunikací a zeleně, linie technické mapy, mobiliář, osvětlení (služba města na T-MAPY, `gis.karvina.cz`, WFS) | plochy komunikací a zeleně, ploty, zdi, stromy, lavičky, lampy | Veřejně přístupná data (zák. 200/1994 Sb.), licence neuvedena; čteno při kliknutí, nešíří se. Uvádět „© Statutární město Karviná“. | ✓ / ověřit licenci |
| **Třebíč:** pasport komunikací (PaKom 2020), veřejné osvětlení, lavičky, `gis.trebic.cz` | plochy komunikací přes DTM kraje, lampy, lavičky | Veřejně přístupná data, licence neuvedena; čteno při kliknutí, nešíří se. Uvádět „© Město Třebíč“. | ✓ / ověřit licenci |
| **Přerov:** technická mapa (DTM polohopis 2024, vektorové dlaždice), `gis.prerov.eu` | plochy v řezu, ploty, zdi, protihlukové stěny | Veřejně přístupná data (zák. 200/1994 Sb.), licence neuvedena; čteno při kliknutí, nešíří se. Uvádět „© Statutární město Přerov“. | ✓ / ověřit licenci |
| **Ústí nad Labem:** parkovací místa (`mapy.usti.cz`, Doprava/Parkovaci_zony_UL) | parkování s orientací | Veřejně přístupná data, licence neuvedena; čteno při kliknutí, nešíří se. Uvádět „© Statutární město Ústí nad Labem“. Plochy z DMVS (Ústecký kraj). | ✓ / ověřit licenci |
| Ilustrace Jihlavy, Mostu, Opavy, Plzně, Pardubic, Ústí, Ostravy a dalších měst (`pilot/public/<město>/`) | tramvaje, trolejbusy a autobusy místních dopravců (podle fotek z Wikimedia Commons jen jako předlohy), mobiliář zatím jako v Praze | Vlastní ruční SVG; licence jako kód (MIT) | ✓ |
| Mapy.com Panorama API (Seznam.cz) | panorama z ulice v dialogu | Podle podmínek API Mapy.com; uvádí se „Panorama © Seznam.cz, a.s. / Mapy.com“. Klíč je jen v tajné proměnné repozitáře `MAPY_KEY` (a v lokálním `config.local.js`, mimo git), nikdy v kódu. Skript se načítá z `api.mapy.cz` až po otevření panoramy. | ✓ |
| Cloudflare (Worker a D1, `logging/`) | záznam řezů a použitých funkcí | Bezplatný účet Báry. Ukládají se jen řezy (místo, směr, ulice, čas) a akce, ne IP adresy ani cookies (`logging/README.md`, oddíl Soukromí). Bez `LOG_URL` se nic neposílá. | ✓ |
| Leaflet 1.9.4 (`pilot/public/leaflet/`, i obrázky) | mapová knihovna | **BSD-2-Clause** (`pilot/public/leaflet/LICENSE.txt`). Na vlastním webu, ne z unpkg. | ✓ |
| Písmo Inter 4 (`pilot/public/fonts/`, z @fontsource/inter 5.3.0; váhy 400–700, Latin a Latin Extended, woff2) | písmo aplikace a exportu | **SIL Open Font License 1.1** (`pilot/public/fonts/OFL.txt`). Na vlastním webu, ne z Google Fonts. | ✓ |
| ČSN 73 6056, Manuál veřejných prostranství IPR | rozměry (5,0 / 4,5 m stání, 6,5 / 7 m tramvajový pás) | Používáme jen čísla, a ta jsou fakta. Texty ani PDF se nešíří. | ✓ |

## Rizika a otevřené otázky

1. **MTVU a technická mapa IPR** jsou v pořádku: jde o povinně zveřejňovaná data (potvrdila Bára). Nejsou sice v katalogu otevřených dat IPR, ale použít je lze s uvedením „© IPR Praha“.
2. **Dlaždice OSM.** Pro veřejnou aplikaci s větším provozem je vhodné přejít na jiného poskytovatele nebo vlastní dlaždice. U pilotu a mírného provozu to v pořádku je.
3. **Cache odpovědí IPR** (`pilot/cache`) nešířit. Každá instance si je stáhne sama.
4. **Technické mapy a služby měst a krajů bez licence** (Brno, Jihlava, Most, Opava, Plzeň, Ostrava, Frýdek-Místek, Karviná, Třebíč, Přerov, Ústí, DTM krajů, IS DMVS): čteme je jen při kliknutí a nešíříme. Před širším zveřejněním by stál za to krátký dotaz na město či kraj. Záložní postup z DTM kraje (`tools/build_dtm_brno.py`) by šířil odvozené dlaždice; tam by bylo potřeba se zeptat ČÚZK a kraje.

## Co se zveřejňuje a co ne

**Zveřejňuje se na GitHub Pages** (připraví se při nasazení, v repozitáři nejsou):
- `data/osm-tiles`: dlaždice OSM celé ČR, odvozená databáze pod **ODbL 1.0** (© přispěvatelé OpenStreetMap),
- `data/praha/opendata`: dlaždice otevřených dat Geoportálu Praha (CC BY 4.0, upraveno),
- `data/zps.json` (TSK, CC BY 4.0), `data/vyvoj` (IPR, CC BY 4.0), `data/brno` (parkovanivbrne.cz), `data/plzen` (CC0),
- tento soubor jako `data/LICENCE-A-ZDROJE.md`.

**Nepublikovat** (zachyceno v `.gitignore`):
- `data/`: stažené OSM, výřez DTM z ČÚZK, PDF manuálu IPR a podkladů DPMB (chráněné texty), specifikace Golemio
- `pilot/data/`: lokálně sestavené dlaždice (na Pages se sestavují znovu při nasazení)
- `pilot/cache/`: uložené odpovědi IPR a TSK
- `vendor/`: kopie repozitáře Streetmixu (AGPL / CC BY-SA). Pilot používá jen ilustrace v `pilot/public/streetmix/` i s jejich `LICENSE`.
- `pilot/public/config.local.js`: lokální klíč Mapy.com

**Už upraveno:**
- Patička aplikace uvádí zdroje (IPR, města a kraje přes IS DMVS, ČÚZK, TSK, Geoportál Praha, parkovanivbrne.cz, OSM,
  Streetmix, vlastní ilustrace a kód) a krátkou poznámku o záznamu řezů.
- Mapa uvádí „© přispěvatelé OpenStreetMap“ s odkazem na openstreetmap.org/copyright.
- Exportované SVG a PNG nesou řádky se zdroji dat podle města řezu (u celostátní technické mapy konkrétní kraj,
  RÚIAN © ČÚZK, 2026, u ortofota ČÚZK, 2025), s licencemi a odkazy na creativecommons.org a streetmix.net.
  Uložený JSON má stejný text v poli `zdroje` a poznámku v poli `licence`.
- Písmo a Leaflet jsou na vlastním webu, IP adresy návštěvníků nejdou ke Googlu ani na unpkg.
- Převod do Streetmixu (až se vrátí) dává do názvu ulice „data © IPR Praha, © přispěvatelé OpenStreetMap“.
- Vlastní kód je pod licencí MIT (soubor `LICENSE`, © 2026 Bára Soukupová); ilustrace a data mají své licence.

## Doporučený text uvedení zdrojů

> Data: © IPR Praha (technická mapa a MTVU; podlažnosti a vývoj zástavby, CC BY 4.0), © TSK hl. m. Prahy a MHMP,
> Geoportál Praha (CC BY 4.0, upraveno), technické mapy měst a krajů (IS DMVS ČÚZK), RÚIAN a ortofoto © ČÚZK (CC BY 4.0),
> © přispěvatelé OpenStreetMap (ODbL 1.0).
> Ilustrace © Streetmix, CC BY-SA 4.0 (https://streetmix.net). Obrázky profilů jsou šířeny pod CC BY-SA 4.0.
