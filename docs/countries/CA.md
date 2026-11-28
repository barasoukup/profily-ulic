# Kanada (CA): Toronto

Stav nasazení: větev `canada`, 25. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Kanada (Toronto) (větev canada, Bára 25. 11. 2026, nenasazené)

- Stát `canada` (CA): Toronto a obce kolem (StatCan), zbytek `closed_ca`; mapa povrchů Toronta (OGL – Toronto) a ortofoto 2025, `?toronto=0`.
- Jeden adaptér ArcGIS planimetrií pro Washington a Toronto: `towns/planimetrics.js` (popis města; 100 řezů DC bajt po bajtu stejné). Kredity
  a výpadek mapy podle klíče města (`cityMap`, `mapFailed`).
- Čerstvé měření 60 řezů: slepé A/B mapa : odhad 44 : 6 (7 nerozhodně); univerzální měření 74 % s mapou, 68 % bez (rozdíl +7, −3 až +18,
  **složení neprůkazně, šířka ano**), jen OSM 70 %. **Výhrada:** vzorek podmínila fotka, 83 ze 143 bodů vypadlo (hlavně místní a obslužné
  ulice), čtvrtina dvojic jsou dálnice a obslužné; není to obraz celé sítě.
  **Druhá nepřátelská recenze (25. 11. 2026, `evaluation/canada/review/`, vzorky po zmrazení, dva slepí posuzovatelé):** mezery mezi vozovkami
  15 : 7 (p 0,13, `?off=mapgaps`), cyklostezky z OSM 13 : 6 (p 0,17, `?off=roadtracks`), zálivy 5 : 1 (jen 9 změněných ze 34, `?off=kerbbays`): nic
  neprohrálo, nic průkazně nevyhrálo, zůstávají zapnuté (rozhodne Bára). Podlaží z výšky proti fotce blíž 10 : 7 z 23 (průměrná chyba 1,35 → 0,65):
  remíza, zapnuté. **Okolí Toronta a Washingtonu bez mapy: složení 51 % (42–64), 19 použitelných řezů z 30, šířka do 1 m 11 %**
  (Washington 47 %, Toronto 55 %): slabé, rozhodne Bára. Opravené: koleje v tunelu (`?off=tunneltracks`, i Evropa), The Queensway, podlaží, veranda. Zpráva `evaluation/canada/REPORT.md`, normy `NORMS.md` (jen oranžově).
- viz seznam v `docs/deployment.md`; služba `gis.toronto.ca` podmínky neuvádí,
  Bára 25. 11. 2026: používat s kreditem (záloha: plochy z katalogu hostovat). Překlady strojové.

## Popis zdrojů a pravidel (dříve app/README.md)

### Kanada: Toronto (Bára 25. 11. 2026)

Stát `canada` (CA), `countries/CA.js`, `towns/canada.js`; Toronto a obce kolem (StatCan), zbytek Kanady `closed_ca`. Mapa povrchů města
(`cot_geospatial3`: vozovky, chodníky, parkoviště, budovy) jde společným adaptérem **`towns/planimetrics.js`** (popis města: vrstvy a jejich
kódy, křižovatky, `prepare`, `adjust`), který sdílí s Washingtonem (`towns/usa.js` je popis, inventář DDOT a CAMA). Mezera mezi vozovkami = dělicí
pás (`?off=mapgaps`), s kolejí OSM = tramvajové těleso (koleje v tunelu ne); pruh stání z parkoviště u obruby (`?off=kerbbays`); cyklostezky novější
než mapa z OSM, samostatné i jen jako tag silnice (`?off=roadtracks`). Stát, zdroje a domy Severní Ameriky se načtou, až když tam je řez nebo mapa
(`late.js` `ensurePlace`, `america.js`, `states-america.json`, `towns-us.json`, `towns-ca.json`).
`?toronto=0` vypne. Ortofoto `cot_ortho`, OSM balík `ca_on_toronto`. Měření `evaluation/canada/REPORT.md`. Obdobné město = popis v
`towns/…`, kredity (`cityMap`), texty.

Tři společné změny z pilotu (všechny státy, každá s vypínačem): ústí uličky (OSM `service=alley` a plochy uliček) je
křižovatka (`?off=ulicky`); obousměrka s jedním pruhem se dělí na dva
už od 4,0 m, kde je počet pruhů známý (OSM `lanes` ≥ 2 nebo inventář; `?off=pocetpruhu`).
