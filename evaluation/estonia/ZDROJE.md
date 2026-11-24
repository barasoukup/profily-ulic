# Data pro Estonsko: ověřené otevřené služby (pro profil ulic)

Ověřeno 23. 11. 2026, asi 95 požadavků, User-Agent `profily-ulic`, pauza 1 s, Origin `https://streetspace.eu`. Overpass
ani Nominatim nebyly použity, žádné osobní údaje se neposílaly, Referer se nepodvrhoval, žádný klíč.

Značení: **ověřeno** = odpověď přišla a byla přečtena (u obrázků i prohlédnuta); **neověřeno** = jen z dokumentace,
katalogu nebo vyhledávání. CORS „`*`“ = `Access-Control-Allow-Origin: *`; „echo“ = server vrací náš Origin (z prohlížeče
funguje stejně); „bez CORS“ = hlavička chybí.

Zkušební body: Tallinn Viru väljak (24,7530, 59,4370), Tallinn Kristiine (24,7020, 59,4180), Tartu centrum (26,7230,
58,3780 a 26,7290, 58,3790), Pärnu Rüütli (24,4980, 58,3850); mimo Estonsko Helsinky (24,94, 60,17), Riga (24,11, 56,95),
Vilnius (25,2797, 54,6872).

Úřad: **Maa- ja Ruumiamet** (Estonian Land and Spatial Development Board, dříve Maa-amet). Geoportál se přestěhoval:
`geoportaal.maaamet.ee` → 302 na `geoportaal.maaruum.ee`; služby na `kaart.maaamet.ee` a `tiles.maaamet.ee` zůstaly.

---

## 1. Ortofoto (Maa- ja Ruumiamet)

| Zdroj | Ověřený stav | Rozlišení, datum | Poznámka |
|---|---|---|---|
| **Dlaždice TMS** `https://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC/{z}/{x}/{y}.jpg` (y od jihu, TMS) | **ověřeno**: CORS `*`, `image/jpeg`, Tallinn a Tartu 15–18 KB na dlaždici; z18 je poslední (capabilities `foto@GMC` končí `order="18"`, 0,597 m/px na rovníku), z19 = 404 | z18 = **asi 0,30 m** na 59° s. š. | Čistý obraz bez vodoznaku, ale hrubý: na pruhy z ortofota málo. Mimo Estonsko (Helsinky, Riga) 200 a **PNG 116 B** (prázdné). Stejné dlaždice přes WMTS `https://tiles.maaamet.ee/tm/wmts/1.0.0/foto/default/GMC/{z}/{y}/{x}.jpg` (capabilities ověřeny, matice GMC do 18). |
| Dlaždice v L-EST97 `foto@LEST` | **ověřeno** (capabilities): do úrovně 14 = **0,244 m/px** | 0,24 m | Jen EPSG:3301; aplikace dlaždice v jiném systému než Web Mercator nebere. |
| WMS `https://kaart.maaamet.ee/wms/fotokaart`, vrstva `EESTIFOTO` | **ověřeno**: CORS `*`; capabilities jen `EPSG:3301`, GetMap v 3857 i 4326 vrací `InvalidSRS` | plné rozlišení (GetMap 3301 ověřen) | Jen v L-EST97. |
| **WMS `https://kaart.maaamet.ee/wms/alus-geo`, vrstva `EESTIFOTO`** | **ověřeno**: capabilities nabízí na kořeni `EPSG:3857` a `EPSG:4326` (dědí i `EESTIFOTO`); GetMap 1.3.0 `CRS=EPSG:3857` 200, `image/jpeg`, CORS `*`, 0,4–0,5 s; Tallinn i Tartu ostré snímky | **plné rozlišení** (stejný obraz jako `fotokaart` v 3301, prohlédnuto vedle sebe) | **Jediná služba v plném rozlišení ve Web Mercatoru.** Háček: **vodoznak „Maa- ja Ruumiamet“** (šedý text asi 100 × 12 px) v pevné mřížce po **400 px** obrazu (nápis začíná na x = 47 + 400k, y = 94 + 400k, ne v každém poli, šikmo
střídavě), nezávisle na měřítku, a k tomu popisek v levém dolním rohu obrázku (13 px nad spodním okrajem); vodoznak má
i `fotokaart` (+ „Tallinna Strateegiakeskus“ v Tallinnu). Při čtení pixelů (pruhy, obruby) je to šum: maskovat pásy
y = 94–106 + 400k a spodních 20 px, nebo poskládat obraz ze dvou posunutých dotazů (prohlédnuto na 4 snímcích 256–1000 px). Mimo území (Helsinky, Riga) 200 a **tmavě modrá plocha** (barva moře) i s vodoznakem, PNG 3,4 KB: ortofoto omezit hranicí státu. |
| `kaart.maaamet.ee/wms/ajalooline` (starší ortofota po letech) | **ověřeno** (capabilities): jen `EPSG:3301` | 1993–… | Pro nás ne. `fotokaart-geo` neexistuje (403). |

**Rozlišení a datum** (**ověřeno** GetFeatureInfo vrstvy `metainfo` ve `fotokaart`, EPSG:3301): Tallinn Viru väljak
`OF_GSD` **3,2 cm**, nálet **2.–5. 5. 2024**; Tartu `OF_GSD` 10 cm, 27. 4. 2024; Pärnu 10 cm, 3. 5. 2024. Geoportál
(neověřeno dotazem, stránka Orthophotos): celá země 20–40 cm, hustě osídlené oblasti 10–16 cm, ročně asi polovina státu,
větší sídla každý rok. **Nesoulad**: snímek v Tartu (v `alus-geo` i v dlaždicích z18) je letní s listím, kdežto metainfo
uvádí duben; mozaika v Tartu je tedy asi z jiného náletu, než ukazuje `metainfo` (neověřeno). V Tallinnu jarní bez listí
odpovídá. Skutečná ostrost snímku z `alus-geo` v Tallinnu odhadem kolem 8–10 cm (na 5 cm/px je mírně měkký).

**Licence** (**ověřeno**, PDF `https://geoportaal.maaruum.ee/opendata-licence`, „Republic of Estonia Land and Spatial
Development Board opendata licence 01.01.2025“; v textu se mluví o datech ETAK, geoportál ji uvádí i u ortofot):
zdarma, na neurčito, smí se dělat odvozená díla, kombinovat s jinými daty, **užít komerčně i nekomerčně a dál šířit**.
Povinnost: uvést původ s názvem poskytovatele, názvem dat a stářím, vzor „Orthophoto 21.05.2024, Republic of Estonia
Land and Spatial Development Board“; při předání dat třetím přiložit odkaz na licenci; na písemnou žádost poskytovatele
odkaz odstranit. Bez záruk. Capabilities WMS: Fees „tasuta / none“, AccessConstraints „none“. Není to CC BY, ale
obsahem je jí blízko. Kredit pro aplikaci: „Ortofoto 2024, Maa- ja Ruumiamet“ (u dat ETAK „ETAK, Maa- ja Ruumiamet“).

---

## 2. Mapy povrchů ulic

### 2a. Celostátní ETAK (Eesti topograafia andmekogu)

WFS 2.0 `https://gsavalik.envir.ee/geoserver/etak/ows` (GeoServer, **ověřeno**: CORS `*`, 39 vrstev, výchozí EPSG:3301,
ale `srsName=EPSG:4326` s `outputFormat=application/json` funguje; Fees a AccessConstraints „puudub“; limit 5 000 objektů
na dotaz podle geoportálu). Licence jako výše (ETAK je výslovně předmětem licence).

| Vrstva | Ověřený obsah | Použitelnost |
|---|---|---|
| `etak:e_501_tee_a` (plochy cest) | **ověřeno** (Tallinn, Tartu, Pärnu): `tyyp_tekst` jen **Liiklusala** (dopravní plocha), **Jalakäijate ala** (pěší plocha), **Parkla**. Liiklusala je **jeden obří slitý polygon celé uliční sítě** (Tallinn 2,2 km², 120 děr, 5 474 bodů; odpověď 187 KB na 300 × 300 m) a sahá **od fasády k fasádě** včetně chodníků; díry jsou trávníky a ostrůvky (překryv s ortofotem v Tallinnu prohlédnut) | **Nerozlišuje vozovku a chodník.** Jako Boloňa (vypnutá): dá jen šířku uličního prostoru a zelené ostrůvky. Velké odpovědi. |
| `etak:e_501_tee_j` (osy cest) | **ověřeno**: `tyyp_tekst` (Tänav, Põhimaantee, Rada…), **`laius`** (šířka v m), `teekate` (Püsikate, Kivikate…), `liiklus` (obousměrná/jednosměrná), `a_tasand`/`l_tasand` (úroveň) | Šířka vozovky na ose: užitečná nápověda k odhadu. |
| `etak:e_401_hoone_ka` (budovy) | **ověřeno**: 12 budov v bloku, **`korgus_m` (výška) u všech**, `ehr_gid` (kód EHR), `tyyp_tekst` (obytná či veřejná / vedlejší či výrobní), adresa ADS | Fasády a výška domu (viz kap. 3). |
| `e_405_piire_j` (ploty, zdi), `e_505_liikluskorralduslik_rajatis_*` | piire ověřeno (zdi, ploty); dopravní zařízení v centru Tallinnu prázdná | Ploty mohou dát hranici pozemku. |

### 2b. Tallinn: mapa povrchů z městské základní mapy (`tar_maakate`)

`https://gis.tallinn.ee/arcgis/rest/services/tar_maakate/MapServer` (ArcGIS 11.5, **ověřeno**: CORS echo, `query` s
obálkou ve WGS 84 a `f=geojson` funguje, maxRecordCount 5 000, data v EPSG:3301). Vrstvy pokryvu země Tallinnu,
mimo jiné **36 Suured teed** (velké cesty = vozovky), **35 Väiksed teed** (malé cesty = chodníky, stezky), **47 Sõidetav
plats** (pojízdná plocha: dvory, parkoviště), **46 Teepeenar** (krajnice), **45 Muu plats** (jiná plocha, např.
tramvajové těleso), **39 Muru** (trávník), **34 Lillepeenar**, **27 Ehitise alune maa** (zastavěno), voda, stromy…
Pole `liik`, **`kate`** (povrch: `A` asfalt, `B` asi betonová dlažba, `Mk` asi kočičí hlavy, `Kr` štěrk, `pinn` zemina;
zkratky jsou můj výklad, neověřeno), `nimi`. Popis vrstvy (ověřeno): ulice a plochy se ohraničují podle os silničního
registru Tallinnu, nemapují se plochy pod 4 m².

**Překryv s ortofotem u Viru väljak (ověřeno, prohlédnuto):** chodníky (35) leží přesně na chodnících, vozovka (36) mezi
nimi, trávníky (39) a tramvajové těleso (45) uprostřed náměstí sedí, dvory a parkoviště (47) zvlášť. **Je to skutečná
mapa povrchů od obruby k obrubě**, tedy kandidát jako Vídeň FMZK nebo Zaragoza. Pokrytí: Kristiine, Mustamäe a Lasnamäe
také vracejí plochy (ověřeno). Rychlost: první dotaz na velké vrstvy 12–14 s, další kolem 4 s (velké polygony vozovek,
206 KB na 300 × 300 m); `maxAllowableOffset` velikost zmenší. Kreditní text služba nemá.

**Licence: neověřeno.** Tallinn vydává digitální základní mapu přes svůj geoportál; větší výřezy podle stránky města po
smlouvě s Linnaplaneerimise Amet (výpis z vyhledávání, neověřeno dotazem). Služba je veřejná bez přihlášení, ale
podmínky použití v cizí aplikaci jsem nenašla: **zeptat se města** (Tallinna Linnaplaneerimise Amet).

Další vrstvy Tallinnu na tomtéž serveru (**ověřeno**, CORS echo):
- `parkimine/FeatureServer/2` **parkovací místa jako úseky** (242 v centru), pole `paiknemine` (celé na chodníku, napůl na
  chodníku, ve zvýšeném zálivu, v zálivu u vozovky, u okraje vozovky, na vozovce bez obruby, na samostatném parkovišti),
  **`nurk`** (podél, šikmo, kolmo, na parkovišti), `parkimiskohad` (počet míst), `tahistus` (značka/vodorovné značení),
  `tasustamine`. Vrstva 3 plochy parkovišť, 5–6 zóny placeného stání. Data z roku 2013 (`lisamise_kp`), pole `lisaja`
  a `muutja` obsahují uživatelská jména úředníků: ptát se jen na potřebná pole (`outFields`).
- `Rattateed_Tallinnas/FeatureServer/0` cyklotrasy (`rattatee_liik`, rok výstavby), `TAR_trammiteed/MapServer/0` osy
  tramvajových kolejí, `aluskaart/kaardiuuendus`, `etak/MapServer`, `ADS` (adresy).

### 2c. Tartu: plochy úklidu (`Puhastusala`)

`https://gis.tartulv.ee/arcgis/rest/services/linnapuhastus/HP_avaandmed_linnapuhastus/FeatureServer/4` („avaandmed“ =
otevřená data v názvu služby; **ověřeno**: CORS echo, `query` `f=geojson` 2 s, maxRecordCount 2 000). Polygony ploch,
které město uklízí, pole **`Tyyp`** (hlavní ulice, vedlejší ulice, **chodník**, úzký chodník, **cyklostezka**, cyklopruh na
vozovce, rozšíření vozovky, **ostrůvek**, parkoviště, zastávka, schody, silnice…) a **`Katend`** (asfalt, štěrk, kočičí
hlavy, betonová/žulová dlažba…). 48 ploch na 470 × 330 m v centru. **Překryv s ortofotem (prohlédnuto, 2 místa):** na
nábřeží chodník a vozovka zvlášť a hranice sedí na obrubě; ve Vanemuise/Lossi vozovka a chodník částečně překryté.
Obsahuje **jen plochy v údržbě města** (parkoviště u obchodního domu chybí). Kandidát jako pasporty měst (A/B nutné).
Licence: služba ji neuvádí, ani copyright (**neověřeno**; Tartu má katalog otevřených dat, zeptat se města).

Další Tartu (ověřen jen seznam vrstev): `Aluskaardid/KT_2000_aluskaart` (základní mapa 1 : 2000 jako čáry z CAD: TEE,
LIIKLUS, HOONE, HALJASTUS… jako technická mapa Bratislavy), `Liikluskorraldus/LI_teekattemargistus_avaandmed`
(**vodorovné dopravní značení**: body, čáry, plochy), `LI_parkimisalad` (parkovací plochy s typem, poplatkem, počtem
míst), `LI_liiklusmark` (dopravní značky), `LI_TRAM_terviktee`.

---

## 3. Budovy

| Zdroj | Ověřený stav | Pole | Poznámka |
|---|---|---|---|
| **ETAK `e_401_hoone_ka`** (WFS výše) | **ověřeno**, CORS `*` | obrys, **`korgus_m`**, typ, `ehr_gid`, adresa | **Použít**: fasády a výška pro celé Estonsko, licence Maa- ja Ruumiamet. |
| **Ehitisregister (EHR)** `https://livekluster.ehr.ee/api/building/v2/buildingData?ehr_code={ehr_gid}` | **ověřeno**: 200, JSON 97 KB, CORS `*`, bez klíče | **`maxKorrusteArv`/`minKorrusteArv`** (podlaží), **`esmaneKasutus`** (rok prvního užívání, např. 1897), účel (`kaosIdTxt`, např. bytový dům se 3+ byty), druh obvodové zdi, **materiál fasády**, **krytina střechy**, nosná konstrukce, kulturní hodnota | Výborné pro vzhled domu (rok, podlaží, materiál). Ale: **nedokumentované API** webové aplikace ehr.ee (ne otevřená datová služba), jeden dotaz na dům, a kolem registru byl v Estonsku spor o zveřejňování (ERR: registr byl po reportáži o půdorysech bytů pro veřejnost z velké části uzavřen; neověřeno, co dnes platí). Osobní údaje v odpovědi nebyly (hledáno: vlastník, jméno, osobní kód). **Doporučení: nepoužívat při kliknutí** bez souhlasu správce (Ministerstvo hospodářství); spíš požádat o hromadný výpis. |

---

## 4. Hledání adres a ulic

| Služba | Ověřený stav | Odpověď | Poznámka |
|---|---|---|---|
| **In-ADS** `https://aks.geoportaal.ee/inaks/inaadress/gazetteer?address=…&results=5` | **ověřeno**, 200, CORS `*`, 0,6 s | „Narva mnt 10 Tallinn“ → dům (`liikVal` EHITISHOONE, `viitepunkt_l/_b` WGS 84, `g_boundingbox`); „Riia tänav Tartu“ → ulice (`TANAV`) i domy; „Rüütli Pärnu“ → ulice | **Použít** (úřední adresní systém). Stará adresa `inaadress.maaamet.ee/inaadress/gazetteer` vrací **301 bez CORS** → volat rovnou `aks.geoportaal.ee`. Filtr `features=TANAV` funguje, `LIIKLUSPIND` ne (400). Licence neuvedena (služba Maa- ja Ruumiamet, neověřeno). |
| Photon | neověřeno pro EE (funguje jinde, ověřeno u Portugalska) | ODbL | Záloha. |

---

## 5. OSM (Geofabrik) a hranice

**Geofabrik** (**ověřeno** 23. 11. 2026, `index-v1-nogeom.json` a velikost souboru): `europe/estonia/estonia-latest.osm.pbf`
= `estonia-261122.osm.pbf` **124,8 MB**, bez podoblastí. Lotyšsko 141,9 MB, Litva 224,4 MB. Jeden balík `ee`, po zabalení
odhadem kolem 45 MB.

**Hranice GISCO** (**ověřeno**: `EE-region-01m-4326-2024.geojson`, 104 KB, CORS `*`): 52 polygonů, 2 527 vrcholů, obdélník
21,77–28,21° v. d., 57,51–59,68° s. š.: pevnina (40 774 km²), Saaremaa, Hiiumaa, Muhu, Vormsi, Naissaar, Kihnu…
i **Ruhnu** (23,21; 57,78); 25 ostrůvků pod 1 km². `tools/build_staty.mjs` už má `estonia: () => gisco("EE")`.
Rozlišení 1 : 1 M u Narvy a Peipsi stačí na „stát řezu“; ortofoto mimo hranici vrací prázdno nebo modrou.

---

## 6. Lotyšsko a Litva: jen ortofoto z prohlížeče

### Lotyšsko (LĢIA)
- `wms.lgia.gov.lv/open/wms` → 404; `geo.lgia.gov.lv`, `lvmgeo.lgia.gov.lv`, `geoserver.lgia.gov.lv` nejdou přeložit
  (**ověřeno**). Funguje `https://wms.lgia.gov.lv/open/rest/services/OPEN_DATA` (ArcGIS, CORS echo, **ověřeno**): jen
  `Ortofoto1_bw`, `Ortofoto2_rgb`, `Ortofoto3_rgb` (cykly 1994–2008), `LGIA_pamatkarte` a `Latvijas_pilsetu_ortofotokartes`
  (má jen vrstvu `fons`, export dává zelenou plochu). Export ve 3857 i 3059 u Rigy prázdný (bílý). **Nepoužitelné.**
- Novější cykly 4–8 (2010–2024, 25–40 cm) podle JOSM přes LVM GEO `geoserver.lvmgeo.lv/wms<klíč>`: adresa obsahuje
  **přístupový klíč** (není náš, nepoužívat), samotný `geoserver.lvmgeo.lv` neodpověděl do 30 s (**ověřeno**); stránka
  „Open access WMS“ LVM GEO je „coming soon“. LĢIA podle svého webu dává 7. cyklus jako WMTS **na žádost**
  (pakalpojumi@lgia.gov.lv) pod CC BY 4.0 (neověřeno). Rižský GIS (`gis.riga.lv`) nejde přeložit.
- **Závěr: Lotyšsko zatím bez ortofota z prohlížeče**; jen po registraci u LĢIA nebo LVM GEO.

### Litva (NŽT, geoportal.lt)
- **`https://www.geoportal.lt/arcgis/rest/services/NZT/ORT_recent/MapServer`** a `ORT10LT_Web_Mercator_102100` (**ověřeno**:
  CORS echo, `export` s `bboxSR=3857&imageSR=3857` 200, `image/jpeg`, 0,4 s; Vilnius ostrý jen zhruba na 0,3–0,5 m).
  Data náletu (vrstva dat, `identify`): Vilnius **15. 6. 2025**; vrstvy 2022–2026 a družicové 2025–2026. Cache
  `ORT10LT_Web_Mercator` jen do 0,597 m, `ORT_recent` v LKS94 (wkid 2600) do 0,132 m, ale skutečné rozlišení ORT10LT je
  hrubší (prohlédnuto). `ORT2LT` (1 : 2000) je jen z roku 2008. `mapproxy/gisc_ortofoto` vyžaduje přihlášení (401).
- **Licence**: popis služby „vieša el. paslauga“ (veřejná e-služba), autorská práva NŽT; **pro použití v jiných
  informačních systémech žádá kontakt pagalba@geoportal.lt** (ověřeno v popisu `ORT2LT`/`ORT_recent`). Bez souhlasu tedy ne.
- **Závěr: technicky použitelné jako podklad mapy (CORS, 3857), na pruhy hrubé; licenci vyjednat.**

---

## Shrnutí

| Oblast | Zdroj | Stav | CORS | Licence | Doporučení |
|---|---|---|---|---|---|
| Ortofoto (pruhy) | `kaart.maaamet.ee/wms/alus-geo` `EESTIFOTO`, EPSG:3857 | ověřeno, plné rozlišení (Tallinn 3,2 cm GSD, jinde 10 cm, 2024) | `*` | otevřená licence MaRu (užití i komerční, uvést zdroj a datum) | **Použít** (`res: 0.1`, WMS jako `ES_ORTHO`); **maskovat vodoznak** (mřížka 400 px a spodní okraj); mimo stát modrá plocha |
| Ortofoto (podklad) | `tiles.maaamet.ee` `foto@GMC` z18 | ověřeno, 0,30 m, bez vodoznaku | `*` | dtto | Podkladová mapa a záloha (`tiles`, TMS: y od jihu) |
| Mapa povrchů celostátní | ETAK `e_501_tee_a` | ověřeno, fasáda–fasáda bez dělení | `*` | MaRu | Jen šířka uličního prostoru a ostrůvky; vozovku z OSM a ortofota |
| Mapa povrchů Tallinn | `gis.tallinn.ee` `tar_maakate` (vozovka, chodník, dvůr, trávník, povrch) | ověřeno, sedí na ortofotu | echo | **neověřeno** | **Nejcennější**: zapojit jako Vídeň po dotazu na licenci; A/B |
| Mapa povrchů Tartu | `gis.tartulv.ee` `Puhastusala` (typ, povrch) | ověřeno, jen plochy v údržbě | echo | neověřeno | Kandidát jako pasporty; A/B po dotazu na licenci |
| Stání | Tallinn `parkimine/2` (úseky s orientací a polohou na chodníku), Tartu `LI_parkimisalad` | ověřeno (Tallinn), z roku 2013 | echo | neověřeno | Statický soubor nebo dotaz při kliknutí |
| Budovy | ETAK `e_401_hoone_ka` (`korgus_m`) | ověřeno | `*` | MaRu | **Použít** (fasády, výška) |
| Budovy (rok, podlaží, materiál) | EHR `livekluster.ehr.ee` | ověřeno, nedokumentované API | `*` | neuvedena | Nepoužívat bez souhlasu; ptát se o výpis |
| Hledání | In-ADS `aks.geoportaal.ee/inaks/inaadress/gazetteer` | ověřeno, ulice i domy | `*` | neuvedena | **Použít** (stará adresa přesměrovává bez CORS) |
| OSM | Geofabrik `estonia` 124,8 MB | ověřeno | - | ODbL | Jeden balík `ee` |
| Hranice | GISCO `EE` (52 polygonů i Ruhnu) | ověřeno | `*` | © EuroGeographics | Už v `build_staty.mjs` |
| Lotyšsko ortofoto | LĢIA open (do 2008, prázdné), LVM GEO (klíč) | ověřeno nedostupné | - | - | Zatím ne |
| Litva ortofoto | geoportal.lt `ORT_recent` (2025) | ověřeno, 3857, asi 0,3–0,5 m | echo | jen po souhlasu NŽT | Podklad mapy po domluvě; pruhy ne |

**Doporučení:** Estonsko má výborné ortofoto (centrum Tallinnu 3,2 cm, jinde 10 cm, nálet 2024) pod otevřenou licencí
s CORS; v plném rozlišení ve Web Mercatoru ho ale dává jen `alus-geo`, a to s vodoznakem v pevné mřížce 400 px, který
je potřeba při čtení pixelů vynechat (dlaždice z18 jsou čisté, ale 30 cm). Celostátní ETAK dá budovy s výškou a
uliční prostor od fasády k fasádě, ne vozovku zvlášť. Skutečnou mapu povrchů má **Tallinn** (`tar_maakate`: vozovka,
chodníky, dvory, trávník, povrch) a částečně **Tartu** (plochy úklidu s typem a povrchem); obojí s CORS, licence se musí
zjistit u měst. Tallinn má navíc parkovací úseky s orientací (2013). Hledání přes In-ADS (CORS, úřední). OSM jedním
malým balíkem. Lotyšsko zatím bez ortofota z prohlížeče, Litva jen hrubé ortofoto a po souhlasu NŽT.

Neověřeno: zda otevřená licence MaRu výslovně kryje ortofota (text mluví o datech ETAK, geoportál ji uvádí u ortofot);
datum mozaiky v Tartu (letní snímek proti dubnu v `metainfo`); licence Tallinnu, Tartu a In-ADS; význam zkratek `kate`;
co dnes platí pro zveřejňování EHR; LĢIA WMTS 7. cyklu na žádost; Photon pro Estonsko.
