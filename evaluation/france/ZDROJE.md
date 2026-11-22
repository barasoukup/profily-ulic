# Data pro Francii: ověřené otevřené služby (pro profil ulic)

Ověřeno 22. 11. 2026, asi 60 požadavků, User-Agent `profily-ulic`, pauza 1 s, Origin `https://streetspace.eu`. Overpass ani Nominatim nebyly použity. Všechny hlavičky CORS níže jsou `Access-Control-Allow-Origin: *`, pokud není uvedeno jinak.

Značení: **ověřeno** = odpověď přišla a byla přečtena; **neověřeno** = jen z dokumentace nebo katalogu, bez dotazu.


**Oprava po ověření (22. 11. 2026):** prostorový filtr funguje u všech vrstev Plan de voirie s `where=in_bbox(geo_shape,lat1,lon1,lat2,lon2)`
(chaussées 11, trottoirs-emprises 20, pistes 15 záznamů v malém výřezu u Bastily); `within_distance` u některých vrstev ne.
Aplikace se ptá přes `in_bbox` po 100 záznamech (`towns/france.js`). Třída „Piste“ (9 429 ploch) jsou podle ortofota IGN
zálivy stání a zásobování u obruby (auta v nich): stání (704).
---

## 1. Paříž: Plan de voirie (opendata.paris.fr, Opendatasoft Explore API v2.1)

Všechny datasety Plan de voirie mají licenci **ODbL** (ověřeno v katalogu). Dotazy na prostorový filtr: `where=within_distance(geo_shape,geom'POINT(lon lat)',80m)` (funguje u chaussées a parkovacích stání; u ostatních viz poznámka).

| Dataset (id) | Geometrie | Ověřený stav | Třídy (`lib_classe` / `lib_level`) | Počet záznamů | Poznámka |
|---|---|---|---|---|---|
| `plan-de-voirie-chaussees` | Polygon | **ověřeno**, 200, CORS | `Chaussée` / `RAMPES, CHAUSSEE` (jediná hodnota) | 20 972 (facet bez filtru, celý dataset ve výřezu; neověřeno, jestli jde o celou Paříž) | Filtr `within_distance` funguje (9 výsledků v okolí 60 m, `geo_shape`). Polygon ověřen (Feature s `Polygon` souřadnicemi). |
| `plan-de-voirie-trottoirs` | **LineString** (filaire, osa) | **ověřeno**, 200, CORS | `TROTTOIR` (771 404), `ARBRE` (1), `SIGNALISATION` (91), `lib_classe` je prázdné | 771 496 | **Prostorový filtr nefunguje**: `within_distance` i `geofilter.distance` vrací celý dataset (771 496), výsledky jsou z celé Paříže. Pro bbox použít jiný zdroj nebo export s filtrem na serveru, neověřeno. |
| `plan-de-voirie-trottoirs-emprises` | Polygon (ověřeno) | **ověřeno**, 200 bez `objectid` v `select`; s `objectid` 400 | `Trottoir` / `TROTTOIR EMPRISE` (33 v okolí) | 50 251 (celý dataset, filtr nefunguje stejně jako u trottoirs) | Polygony trottoárů. Pole `objectid` v tomto datasetu chybí. |
| `plan-de-voirie-terre-pleins` | Polygon (neověřeno, předpoklad) | **ověřeno** metadata a facety, 200, CORS | `Terre-plein` / `TERRE-PLEIN` (1 v okolí) | neověřeno | Řídké, spíš pro ostrůvky. |
| `plan-de-voirie-pistes-cyclables-et-couloirs-de-bus` | Polygon | **ověřeno**, 200, CORS | `Piste cyclable` (21), `Piste` (4), `Couloir mixte bus-vélo` (3), `Couloir bus` (2); `lib_level` `PISTE - AIRE DE STATIONNEMENT` (30) | 23 068 (records total, pochybné, viz poznámka) | Facety v okolí 80 m vrátily 30 záznamů, ale `records` total 23 068 ukazuje celý dataset. Filtr se zřejmě u `records` nepropisuje, ověřit. Cyklopruhy a bus pruhy v jednom datasetu. |
| `plan-de-voirie-passages-pietons` | neověřeno (předpoklad Polygon) | **ověřeno** facety, 200, CORS | `Passage piéton` (14), `lib_level` `AIRE MIXTE - CHAUSSEE TROTTOIRS PASSAGES PIETONS` | neověřeno | Přechody v okolí 80 m. |
| `plan-de-voirie-aires-mixtes-vehicules-et-pietons` | neověřeno | **ověřeno** facety, 200, CORS | `Aire mixte véhicule-piéton` (1) | neověřeno | Zóny sdílené vozidly a chodci. |
| `plan-de-voirie-separateurs-franchisssement-stationnement` (pozor, překlep v id: `franchisssement`) | neověřeno | **ověřeno** facety, 200, CORS | `Séparateur infranchissable de circulation` (8), `Séparateur de stationnement` (1); `lib_level` `SEPARATEUR INFRANCHISSABLE - CHASSE ROUES` (9) | neověřeno | Ostrůvky a separátory. |
| `stationnement-voie-publique-emplacements` (správné id, bez „sur“; `stationnement-sur-voie-publique-emplacements` vrací 404) | Polygon, neověřeno (v odpovědi je `geo_shape`) | **ověřeno**, 200, CORS, filtr funguje (75 záznamů v 150 m) | `typsta`: `Longitudinal` (39), `Bataille` (34), `Epi` (2) v okolí 150 m; `parite` Pair/Impair; `regpar` (režim): GIG/GIC Standard (8), SP-Police (6), Mixte (3), Motos (2), Taxi (4) a další | celkem neověřeno | Viz sekce 5. |
| `plan-de-voirie-bordures` | - | **neověřeno**: v katalogu (31 datasetů „voirie“) není | - | - | Bordury v Paříži v katalogu nejsou. |
| `plan-de-voirie-voies` (Plan de voirie – Voies) | - | **neověřeno**: v katalogu není | - | - | Název z zadání v katalogu nenalezen. |

Další Plan de voirie datasety v katalogu (mimo zadání, zatím neověřené): `plan-de-voirie-murs`, `plan-de-voirie-emprises-espaces-verts`, `plan-de-voirie-emprises-ilots-privés`, `plan-de-voirie-mobiliers-urbains-*` (kiosky, jardinières, bornes, abris), `plan-de-voirie-voies-en-escalier`, `plan-de-voirie-rampes-de-viaducs`, `plan-de-voirie-passages-pietons`, `plan-de-voirie-acces-pietons-metro-et-parkings`, `plan-de-voirie-ilots-directionnels`, `plan-de-voirie-emplacements-plaques-adresses`, `plan-de-voirie-points-de-nivellement-*`.

**Formát dotazu (ověřeno):**
- Seznam: `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/<id>`
- Záznamy: `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/<id>/records?limit=N&where=within_distance(geo_shape,geom'POINT(2.3485 48.858)',80m)`
- Facety: `.../datasets/<id>/facets?facet=lib_classe&where=...`
- Export GeoJSON: neověřeno (nezkoušeno, nejspíš `.../exports/geojson?where=...`).

**Poznámka k `records` total_count:** u chaussées s `where` vrací 9 (funguje). U trottoirs, emprises a pistes vrací celý počet datasetu, i když `where` je zadané. Pro vykreslení v bbox 100 m se u těchto datasetů nepočítá s filtrem na serveru. Buď stahovat dlaždicově, nebo ověřit, jestli `geofilter.bbox` (s `south,west,north,east`) u nich funguje (nezkoušeno).

---

## 2. Ostatní města

| Město / dataset | Služba | Ověřený stav | Geometrie a pole | Licence | Poznámka |
|---|---|---|---|---|---|
| **Lyon** `pvo_patrimoine_voirie.pvochausseetrottoir` (chaussée a trottoir) | WFS `https://download.data.grandlyon.com/wfs/grandlyon` | **ověřeno** GetCapabilities (200, CORS `*`) a GetFeature v bbox 100 m (43 prvků, 200, CORS) | **LineString** (osa), s atributy šířek: `largeurchaussee` (6,3), `largeurcirculeechaussee`, `nombrevoies` (2), `senscirculation` (Double), `largeurcouloirbus`, `nbvoiescouloirbus`, `largeurtrottoirdroit` (3) a `largeurtrottoirgauche` (2), `revetementchaussee`, `revetementtrottoirdroit/gauche`, `limitationvitesse` (30), `reglementationzca`, `lignebus`, `hierarchiefonctionnelle`, `zfe`, `ztl` | neověřeno (předpoklad Licence Ouverte / Etalab, ověřit na data.grandlyon.com) | **Nejlepší zdroj mimo Paříž**: šířky už jsou v atributech. Parametry: `SERVICE=WFS&VERSION=2.0.0&request=GetFeature&typename=metropole-de-lyon:pvo_patrimoine_voirie.pvochausseetrottoir&outputFormat=application/json&srsName=EPSG:4326&bbox=45.762,4.833,45.764,4.836,urn:ogc:def:crs:EPSG::4326`. Další vrstvy: `fpc_fond_plan_communaut.fpcbordchaussee` (bordura, neověřeno), `pvo_patrimoine_voirie.couloirdebus` (neověřeno), `pvo_patrimoine_voirie.pvoamenagementcyclable` (neověřeno), `pvo_patrimoine_voirie.pvozoneapaisee` (neověřeno), `pvo_patrimoine_voirie.pvoparking` (neověřeno), `pvo_patrimoine_voirie.ztl` (neověřeno). |
| **Nantes** `244400404_troncon-chaussee-nantes-metropole` | Opendatasoft `https://data.nantesmetropole.fr/api/explore/v2.1/` | **ověřeno** metadata, záznamy v okolí 80 m (13), 200, CORS | **LineString** (osa), pole `largeur` (double, m, 7,3 u ulice Fanny Peccot), `longueur`, `nature` (např. „Route à 1 chaussée“), `code_revetement`, `hierarchisation`, `classement_circulation`, `classement_pdu`, `borne_*`, `statut`, `proprietaire`, `notation` | Licence Ouverte-LO (z katalogu) | Šířka vozovky na úseku, ne šířka chodníků ani pruhů. Dataset `..._secteur-stationnement-voirie-nantes-metropole` je v katalogu také (neověřeno). |
| **Bordeaux** `to_bord_l` (Bordure de chaussée) | Opendatasoft `https://opendata.bordeaux-metropole.fr/api/explore/v2.1/` | **ověřeno** záznamy v okolí 80 m (47), 200, CORS | **LineString**, pole `bordure` (`OUI`), `source`, `origine` (`DP_BORD_L`), `commune`, `code_commune` | Licence Ouverte (z katalogu) | Jen bordury (osa), ne plochy. Vhodné pro kontrolu obruby. Další: `bor_voiriedroitouvrage`, `st_park_p` (parkoviště mimo voirie, neověřeno). |
| **Toulouse** `filaire-de-voirie` (Filaire de voirie) | Opendatasoft `https://data.toulouse-metropole.fr/api/explore/v2.1/` | **ověřeno** záznamy v okolí 80 m (13), 200, CORS | **MultiLineString** (osa), pole `type` (PRINCIPAL…), `street`, `longueur`, `fromleft/toleft/fromright/toright` (čísla domů), `id_ban_voie`, `codsti`. **Bez šířek** a bez povrchů. | Licence Ouverte v2.0 (Etalab) | Jen osa ulice, pro názvy a typ, ne pro profil. |
| **Strasbourg** (`data.strasbourg.eu`) | Opendatasoft | **ověřeno** katalog, 200, CORS; dataset chaussées/trottoirů **nenalezen** (hledání podle „voirie/chauss/trottoir“ vrátilo 0) | Našel se `stationnement-payant` (Zones de stationnement payant), `stationnement_residant` (Zones de stationnement résident), `stationnement-velo`, `bus_tram_stations`, `stations_tram` | Licence Ouverte v2.0 (Etalab) | Plochy ulic ve Strasburku nejspíš nejsou v katalogu, ověřit pod jinými názvy (neověřeno). Parkování zóny ano. |
| **Toulouse, Lille, Rennes** | - | **neověřeno** (Toulouse má jen Filaire) | - | - | Lille a Rennes nezkoumány (vyčerpaný rozpočet dotazů). |

---

## 3. Národní: IGN Géoplateforme

### 3a. BD TOPO (WFS `https://data.geopf.fr/wfs/ows`)

Funguje **EPSG:4326 se jménem CRS `urn:ogc:def:crs:EPSG::4326`** a BBOX v pořadí lat, lon (`BBOX=48.857,2.347,48.859,2.350,urn:ogc:def:crs:EPSG::4326`). Krátká forma `SRSNAME=EPSG:4326` vrátila 0 prvků (nepoužívat).

| Vrstva | Ověřený stav | Geometrie a pole | Licence | Poznámka |
|---|---|---|---|---|
| `BDTOPO_V3:troncon_de_route` | **ověřeno**, 200, CORS, 3 prvky v bbox 100 m (celkem 66) | **LineString**; `nombre_de_voies` (2), `largeur_de_chaussee` (4,0 m), `nature` (např. „Route à 1 chaussée“), `importance` (5), `sens_de_circulation`, `reserve_aux_bus`, `urbain`, `vitesse_moyenne_vl`, `acces_pieton`, `amenagement_cyclable_gauche/droit`, `sens_amenagement_cyclable_*`, `nom_collaboratif_gauche/droite`, `borne_debut_gauche`, `insee_commune_gauche` | neověřeno v odpovědi (dokumentace: Licence Ouverte 2.0 Etalab) | Šířka vozovky od IGN; pro profil důležitý `largeur_de_chaussee` a `nombre_de_voies`. Chybí šířky chodníků. |
| `BDTOPO_V3:batiment` | **ověřeno**, 200, CORS, 2 prvky v bbox 100 m | **MultiPolygon**; `hauteur` (2,1 m u garáže), `nature` (Indifférenciée), `usage_1` (Indifférencié), `nombre_d_etages` (null v ukázce), `date_d_apparition` (null v ukázce), `materiaux_des_murs`, `materiaux_de_la_toiture`, `origine_du_batiment` („Imagerie aérienne“), `altitude_minimale_sol` | neověřeno (dokumentace Etalab 2.0) | `nombre_d_etages` a `date_d_apparition` v ukázce prázdné; pro Paříž může být v RNB. |
| `BDTOPO_V3:voie_nommee`, `route_numerotee_ou_nommee`, `zone_d_habitation`, `troncon_de_voie_ferree` | v GetCapabilities ano | neověřeno | neověřeno | Názvy ulic a zóny, zatím nezkoušeno. |
| `BDTOPO_V3_DIFF:*` | v GetCapabilities | neověřeno | - | Diferenční verze, nepoužito. |

GetCapabilities je velký (5,4 MB), dá se jen jednou stáhnout při nasazení.

### 3b. Ortofoto (WMTS `https://data.geopf.fr/wmts`)

| Vrstva | Ověřený stav | TileMatrixSet | Formát | Poznámka |
|---|---|---|---|---|
| `HR.ORTHOIMAGERY.ORTHOPHOTOS` | **ověřeno**: `GetTile` (PM, z18, Paříž) vrátil 200, `image/jpeg`, 14,7 KB, CORS `*` | `PM_6_19` (v capabilities), v dotazu `TILEMATRIXSET=PM` (funguje), max z19 | `image/jpeg` | Vysoké rozlišení (asi 20 cm, neověřeno přesně). Šablona: `https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=HR.ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}` |
| `ORTHOIMAGERY.ORTHOPHOTOS` | v capabilities (PM_0_19) | `PM_0_19` | jpeg | Standardní vrstva, nezkoušena. |
| `IGNF_ORTHOIMAGERY.ORTHOPHOTOS-MIXTE.BDORTHO`, `…ORTHO-EXPRESS`, `IGNF_PLAN-IGN-HD` | v capabilities | neověřeno | - | Nezkoušeno. |
| `CADASTRALPARCELS.PARCELLAIRE_EXPRESS` | v capabilities | neověřeno | - | Parcely (možná pro plochy zahrad, ne ulic). |

---

## 4. Adresy a hledání

| Služba | Ověřený stav | Odpověď | Licence | Poznámka |
|---|---|---|---|---|
| Géoplateforme geocodage `https://data.geopf.fr/geocodage/search?q=…&limit=2&autocomplete=1` | **ověřeno**, 200, CORS `*` | GeoJSON FeatureCollection; `properties.label`, `properties.score` (0–1), `geometry.coordinates` [lon, lat] | neověřeno v odpovědi (dokumentace Etalab 2.0, BAN) | Vrátil „8 Boulevard du Port 80000 Amiens“ (dotaz byl „8 boulevard du Port Amiens“). |
| API Adresse `https://api-adresse.data.gouv.fr/search/?q=…&limit=1` | **ověřeno**, 200, CORS `*` | GeoJSON; `label`, `score`; `licence` a `attribution` v odpovědi nejsou | neověřeno (dokumentace BAN, Licence Ouverte 2.0) | Dotaz „8 bd du port“ vrátil „8 Boulevard du Port 95000 Cergy“. Výsledky mají různé kraje, dotaz musí obsahovat město. |

---

## 5. Parkování

| Zdroj | Ověřený stav | Pole a hodnoty | Licence | Poznámka |
|---|---|---|---|---|
| Paris `stationnement-voie-publique-emplacements` | **ověřeno**: 200, CORS, filtr funguje, 75 záznamů v 150 m | `typsta` (Longitudinal, Bataille, Epi), `parite` (Pair/Impair), `lar` (šířka stání, m), `surface_calculee` (m²), `regpar` (režim: GIG/GIC, Mixte, Rotatif, SP-Police, Taxi, Livraison, ZL périodique), `regpri` (PAYANT, LIVRAISON…), `signhor` (Présente/Abimé/Absente), `confsign`, `locsta` (Chaussée, Lincoln…), `arrond`, `zoneres`, `plage_hor*` | ODbL (z katalogu) | **Orientace ano** (`typsta`). Pole `lon` obsahuje nesmysly (22,2; 16,6), použít `geo_point_2d`. Pole `stationnement_autorises_aux_velos_en_libre_service` ano. |
| Paris `stationnement-sur-voie-publique-zones-tarifaires`, `…-secteurs-residentiels`, `…-stationnement-interdit`, `…-emprises` | **ověřeno** v katalogu (názvy), data neověřena | neověřeno | ODbL | Zakázaná stání a emprise nejspíš v `…-emprises`. |
| Strasbourg `stationnement-payant` | v katalogu (Licence Ouverte v2.0) | neověřeno | Etalab 2.0 | Zóny placeného stání. |
| Lyon `parkings-des-operateurs-de-stationnements-de-la-metropole-de-lyon` (WFS) | v GetCapabilities | neověřeno | neověřeno | Parkoviště, ne uliční stání. |
| Lyon `pvo_patrimoine_voirie.pvoparking`, `pvostationnementvelo` | v GetCapabilities | neověřeno | neověřeno | Ne pro uliční stání. |

---

## 6. Podzemní sítě

**Nezkoumáno** (rozpočet dotazů). Zmíněno jen k poznámce: Paris Plan de voirie neobsahuje sítě (jen povrch). Pro sítě v Lyonu a jinde nebylo nic ověřeno (neověřeno). Doporučení: ověřit `data.grandlyon.com` pro sítě (vrstvy `reseau_*` nejspíš, neověřeno) a Paris „Plan de réseaux“ (neověřeno).

---

## Shrnutí pro rozhodnutí

- **Paříž (ODbL):** plochy chaussées (Polygon, jediná třída), trottoirs emprises (Polygon, `Trottoir`), pistes a bus pruhy (Polygon, 4 třídy). Trottoirs filaires (LineString) a emprises mají filtr, který na serveru nefunguje, takže bbox musí řešit klient nebo jiná dlaždicová cesta.
- **Lyon (WFS, CORS ano):** nejlepší zdroj mimo Paříž: LineString s šířkami chodníků, vozovky, pruhů a rychlostí. Licence ověřit.
- **Nantes (Licence Ouverte):** šířka vozovky jen u osy ulice. **Bordeaux:** bordury (osa). **Toulouse:** osa ulice bez šířek. **Strasbourg:** nenalezeny plochy, jen zóny parkování.
- **IGN:** BD TOPO `troncon_de_route` (šířka vozovky, počet pruhů) a `batiment` fungují v EPSG:4326 s `urn:…` CRS; WMTS ortofoto `HR.ORTHOIMAGERY.ORTHOPHOTOS` vrací dlaždice s CORS.
- **Geokódování:** Géoplateforme i API Adresse ověřeny, CORS ano.
- **Neověřeno:** licence Lyonu, Nantes a Bordeaux v odpovědi (jen z katalogu), geometrie u několika Paris datasetů, export GeoJSON v Paříži, sítě pod zemí, Lille a Rennes.
