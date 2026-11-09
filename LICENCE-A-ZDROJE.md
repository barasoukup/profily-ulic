# Profily ulic – licence a podmínky zdrojů

Stav k 6. 11. 2026. Nejde o právní posouzení. Jde o přehled licencí, které jsem ověřila v katalozích a dokumentaci zdrojů.

## Shrnutí

Projekt jde zveřejnit, pokud se splní tři věci:

1. **Uvést zdroje** v aplikaci i v exportovaných obrázcích (už je doplněno, viz níže).
2. **Nezveřejňovat stažená data**, jen kód a postup, jak si je stáhnout (soubor `.gitignore` je připravený).
3. MTVU a liniové prvky technické mapy jsou podle Báry **povinně zveřejňovaná data** (veřejná část DTM), takže je lze použít. Stačí uvést „© IPR Praha“.

Obrázky profilů, které aplikace vytváří, obsahují ilustrace Streetmixu. Proto musí být šířeny pod **CC BY-SA 4.0**.

## Zdroje a licence

| Zdroj | Co z něj bereme | Licence / podmínky | Stav |
|---|---|---|---|
| IPR – Mapa technického využití území (MTVU), `gs-pub.praha.eu/.../dtmp/dtmp/MapServer/15` | šířky ploch v řezu | Povinně zveřejňovaná data technické mapy (veřejná část DTM); uvést „© IPR Praha“ | ✓ |
| IPR – liniové prvky technické mapy (osy kolejí, svodidla, zábradlí, ploty, svahy), tamtéž `/10` | koleje, bariéry, svahy | Stejné jako MTVU: povinně zveřejňovaná data, uvést „© IPR Praha“ | ✓ |
| IPR – polohopis technické mapy jako podkladová mapa | jen zobrazení | Povinně zveřejňovaná data, uvést „© IPR Praha“ | ✓ |
| IPR – Podlažnosti (`URK_CUR_URK_SS_PODLAZNOST_P`) | počet podlaží budov | **CC BY** (otevřená data IPR), uvést „© IPR Praha“ | ✓ |
| IPR – Vývoj zástavby v Praze 1840–2010 (`URK_CUR_URK_VYVOJZASTAVBY_P`) | stáří zastavěného území jako výchozí odhad vzhledu domu | **CC BY**, uvést „© IPR Praha“. Stahuje se jednou při nasazení do statických dlaždic (`tools/build_vyvoj.mjs`), aplikace se IPR při kliknutí neptá. | ✓ |
| TSK přes IPR – úseky parkování, ZTP, zásobování, speciální stání (`dop/zony_placeneho_stani`) | parkování | **CC BY** (otevřená data IPR, poskytovatel HMP-TSK) | ✓ |
| OpenStreetMap (výřez BBBike) | osy ulic a tagy, stromy, mobiliář, budovy… | **ODbL 1.0**: uvést „© přispěvatelé OpenStreetMap“. Odvozená databáze (naše dlaždice) se smí šířit jen pod ODbL. Obrázky z dat jsou „produced work“ a stačí u nich uvedení zdroje. | ✓ s uvedením zdroje |
| Podkladové dlaždice `tile.openstreetmap.org` | mapa v aplikaci | Zdarma podle [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) OSMF: jen mírný provoz, s atribucí, bez hromadného stahování. U veřejné aplikace s větším provozem je lepší jiný poskytovatel. | ✓ / pozor na provoz |
| ČÚZK – ortofoto (WMS) | podkladová mapa | Ortofoto ČR jsou od 1. 7. 2023 otevřená data pod **CC BY 4.0** ([technická zpráva ČÚZK](https://geoportal.cuzk.gov.cz/Dokumenty/TZ_Ortofoto_CR.pdf), [podmínky ČÚZK](https://cuzk.gov.cz/Predpisy/Podminky-poskytovani-prostor-dat-a-sitovych-sluzeb/Podminky-poskytovani-prostorovych-dat-CUZK.aspx)). Uvést „© ČÚZK“. | ✓ |
| Streetmix – ilustrace (`pilot/public/streetmix/`) | kreslení profilu | **CC BY-SA 4.0** ([FAQ Streetmixu](https://docs.streetmix.net/user-guide/support/faq)): uvést Streetmix, licenci a odkaz na streetmix.net. Odvozené obrázky musí zůstat pod CC BY-SA. | ✓ s podmínkou |
| Pražské ilustrace (`pilot/public/praha/`) | kreslení profilu (tramvaj T3, autobus, lampa, lavička, stojan, přístřešek, sloupek) | Vlastní ruční SVG, kreslené podle veřejných fotek (Wikimedia Commons, brožura IPR k soutěži na mobiliář); fotky ani cizí kresby nejsou převzaté. Mobiliář podle vítězných návrhů soutěží IPR (Olgoj Chorchoj). Licence jako kód (MIT). Bez log a ochranných známek. | ✓ |
| Streetmix – kód | **nepoužíváme**. Převod do Streetmixu (`streetmix.js`) je vlastní kód, ze Streetmixu bere jen názvy segmentů a variant. | AGPL-3.0 by se týkala jen převzatého kódu | ✓ |
| Streetmix – API | zatím nepoužíváme: tlačítko „Do Streetmixu“ je z aplikace vyndané (API nepovoluje dotazy z jiných webů). Převod `streetmix.js` zůstává pro pozdější použití. | Ulice by vznikala jako veřejná anonymní ulice. Obsah Streetmixu je pod CC BY-SA. Podmínky použití API jsem nenašla. | – |
| **Brno:** Mapa technického využití území (MTVU) a kresba technické mapy (UMPS), `gis.brno.cz/ags3/rest/services/PUBLIC/opendata_mtvu` a `opendata_umps` | plochy v řezu; koleje, svodidla, ploty, zdi, svahy, lampy, stromy, lavičky | Služby města ve složce PUBLIC s názvem „opendata“, licence u nich ani v katalogu data.brno.cz uvedená není (obdoba MTVU IPR). Uvádět „© Statutární město Brno“. Ptá se jich prohlížeč při kliknutí, nic se nešíří. | ✓ / ověřit licenci |
| **Brno:** DTM Jihomoravského kraje jako podkladová mapa (WMS `dtm_zps_plochy_bar`, `dtm_zps_linie_body`) | jen zobrazení | veřejné služby ČÚZK | ✓ |
| **Brno:** úseky placeného stání, zásobování a obrátková stání z mapy parkovanivbrne.cz (soubor `mapa/js/data/…/mapdata.o.js`, `tools/build_parkovani_brno.mjs`) | parkování v řezu | Aktuální data Brněnských komunikací; export na data.brno.cz (CC BY-SA) je z 2/2024 a chybí v něm celé nové oblasti. Licence u mapy uvedená není („Copyright © Parkovanivbrne.cz“). Stahuje se jednou při nasazení a na webu se vystavují odvozené dlaždice. Rozhodla Bára (9. 11. 2026). | ✓ / ověřit u BKOM |
| **Brno:** Průzkum budov v Brně (KAM, gis.brno.cz) | počet podlaží, podlaží ve střeše, typ střechy, využití přízemí | **CC BY**, © Statutární město Brno (KAM) | ✓ |
| **Brno:** Ortofoto 2025 (gis.brno.cz, dlaždice) | podkladová mapa | © Statutární město Brno; v katalogu data.brno.cz je ortofoto pod CC BY | ✓ |
| Brněnské ilustrace (`pilot/public/brno/`) | tramvaje Škoda 45T a 13T, autobus DPMB; lampa, lavička, stojan, sloupek a přístřešek podle zásad KAM Brno (Principy tvorby veřejných prostranství, kap. 9) | Vlastní ruční SVG podle veřejných fotek (Wikimedia Commons); licence jako kód (MIT). Bez log a ochranných známek. | ✓ |
| Leaflet (unpkg) | mapová knihovna | BSD-2-Clause | ✓ |
| ČSN 73 6056, Manuál veřejných prostranství IPR | rozměry (5,0 / 4,5 m stání, 6,5 / 7 m tramvajový pás) | Používáme jen čísla, a ta jsou fakta. Texty ani PDF se nešíří. | ✓ |

## Rizika a otevřené otázky

1. **MTVU a liniové prvky technické mapy (IPR)** jsou v pořádku: jde o povinně zveřejňovaná data (potvrdila Bára). Nejsou sice v katalogu otevřených dat IPR, ale použít je lze s uvedením „© IPR Praha“.
2. **Dlaždice OSM.** Pro veřejnou aplikaci s větším provozem je vhodné přejít na jiného poskytovatele nebo vlastní dlaždice. U pilotu a mírného provozu to v pořádku je.
3. **API Streetmixu.** Ulice vytvářené přes API jsou veřejné. Při veřejném nasazení by bylo slušné dát o tom vědět týmu Streetmixu (hello@streetmix.net) a nepouštět automatické hromadné vytváření.
4. **Cache odpovědí IPR** (`pilot/cache`) nešířit. Každá instance si je stáhne sama.
5. **Služby města Brna (MTVU, UMPS)** nemají uvedenou licenci, i když jsou ve složce „opendata“. Před veřejným spuštěním brněnské verze doporučuji krátký dotaz na město (gis.brno.cz / data.brno.cz). Záložní postup z DTM kraje (`tools/build_dtm_brno.py`) by šířil odvozené dlaždice; tam by bylo potřeba se zeptat ČÚZK.

## Co nepublikovat a co už je upravené

**Nepublikovat** (zachyceno v `.gitignore`):
- `data/`: stažené OSM, výřez DTM z ČÚZK, PDF manuálu IPR a podkladů DPMB (chráněné texty), specifikace Golemio
- `pilot/data/`: dlaždice odvozené z OSM (jen pod ODbL, lepší je je nešířit a nechat si je vygenerovat)
- `pilot/cache/`: uložené odpovědi IPR a TSK
- `vendor/`: kopie repozitáře Streetmixu (AGPL / CC BY-SA). Pilot používá jen ilustrace v `pilot/public/streetmix/` i s jejich `LICENSE`.

**Už upraveno:**
- Patička aplikace uvádí zdroje IPR pohromadě (technická mapa a MTVU; podlažnosti a vývoj zástavby,
  CC BY 4.0), úseky parkování © TSK (CC BY 4.0), OSM (ODbL), ortofoto © ČÚZK (CC BY 4.0), Streetmix (CC BY-SA 4.0)
  a pražské ilustrace (MIT).
- Převod do Streetmixu (až se vrátí) dává do názvu ulice „data © IPR Praha, © přispěvatelé OpenStreetMap“.
- Exportované SVG a PNG nově nesou řádek se zdroji a licencí obrázku (CC BY-SA 4.0).
- Vlastní kód je pod licencí MIT (soubor `LICENSE`, © 2026 Bára Soukupová); ilustrace a data mají své licence.

**Doporučuji doplnit při zveřejnění:**
- do README odstavec se zdroji (je níže)

## Doporučený text uvedení zdrojů

> Data: © IPR Praha (technická mapa a MTVU; podlažnosti a vývoj zástavby, CC BY 4.0), © TSK hl. m. Prahy (úseky parkování; CC BY 4.0),
> © přispěvatelé OpenStreetMap (ODbL 1.0), ortofoto © ČÚZK (CC BY 4.0).
> Ilustrace © Streetmix, CC BY-SA 4.0 (https://streetmix.net). Obrázky profilů jsou šířeny pod CC BY-SA 4.0.
