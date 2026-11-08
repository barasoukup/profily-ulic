# Budovy v profilu: kontrola na 100 náhodných řezech

8. 11. 2026 · stejný vzorek 100 řezů jako `ZPRAVA.md` (seed 20261106), ortofota z předchozího běhu (nic se znovu nestahovalo)

**Nová pravidla volí obecný typ budovy správně nebo přijatelně u 37 ze 40 budov**, které ve vzorku stojí na okraji profilu. První verze pravidel takto obstála u 31 ze 40.

| Typ | Kolik | Co kreslí |
|---|---|---|
| dům se šikmou střechou | 12 | štít, římsa, sedlová střecha nebo mansarda |
| dům s plochou střechou | 9 | atika, balkony (byty) nebo pásová okna (kanceláře), ustupující podlaží |
| nízký dům | 15 | do 2 podlaží, štít s hřebenem, nebo plochá střecha podle IPR |
| hala | 4 | obchod s markýzou a výstrčí, sklad s vraty, továrna s cihlou, sheddy a komínem |

## Jak se hodnotilo

- `run.mjs` (DERIVE=pilot, OUT=results4) spočítal profily současnou verzí, data o budovách jako po kliknutí v aplikaci.
- Ke každé budově ortofoto se značkou místa, kde aplikace budovu zjišťuje (`data/budovy3/<n>.svg.png`).
- Dva nezávislí posuzovatelé porovnali zvolený typ s ortofotem (tvar střechy, půdorys, okolí): `data/budovy3-hodnoceni-a.md`, `-b.md`.
- Měřítko: ne realismus, ale zda obecný typ názorně odpovídá tomu, co tam stojí.

## Co se podle hodnocení změnilo v pravidlech (`profile.js`, `buildingStyle`)

1. **Bez jakýchkoli dat o budově** se mimo vnitřní město kreslí nízký dům, ne vícepodlažní blok (5 chyb: 19 B, 74 A, 81 B, 82 B, 86 A, 87 A).
2. **IPR posílá i typ objektu a plochu půdorysu** (stejný dotaz, dvě pole navíc: `typ`, `SHAPE__Area`). Hala = obchodní/průmyslový druh v OSM, nebo půdorys od 1 200 m², nebo IPR „nestandardní výška podlaží“ od 300 m², vždy nejvýš 2 podlaží po římsu a ne se šikmou střechou z IPR. Opraví 32 A a 98 A.
3. **Šikmá střecha z IPR má přednost** před halou a druh `transportation` už halu nedělá (95 B, historická nádražní budova).
4. **IPR „garáže“** jsou nízký dům.
5. **Počet podlaží** = po římsu + střešní/ustupující (pole „celkem“ občas nadsazuje: 71 A, 94 A).
6. **Sheddy a tovární komín** jen u výroby se šikmou střechou podle IPR (98 B má plochou střechu s fotovoltaikou).

## Co zůstává

- **4 B Dobříšská:** bod trefil malou část skladu (174 m² v IPR), takže vyjde nízký dům místo haly.
- **74 A, 81 B:** okraj „budova“ tam, kde žádná budova není (trávník, křoví). Teď je to aspoň nenápadný nízký dům; skutečná oprava je v rozpoznání okraje, ne v kresbě.
- Bod 4 m za uliční čarou občas padne na přístavek nebo zadní trakt (27 B, 39 A, 49 B); typ to v tomto vzorku nezměnilo.
