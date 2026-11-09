# Profily ulic Brno: kontrola 100 náhodných řezů

9. 11. 2026 · verze z commitu acb3a90 (brněnská verze, zatím nenasazená)

## Shrnutí

Ze 100 náhodných řezů po celém Brně:

- **16 sedí**: skladba i šířky odpovídají ortofotu, nanejvýš drobnosti.
- **65 sedí částečně**: pořadí částí je správně, ale šířky nebo detail ne.
- **19 je špatně**: profil zásadně neodpovídá skutečnosti.

Pro srovnání Praha (6. 11. 2026, před opravami): 51 sedí, 32 částečně, 17 špatně.

| Typ ulice | sedí | částečně | špatně |
|---|---|---|---|
| trunk (6) | 1 | 5 | 0 |
| primary (14) | 0 | 11 | 3 |
| secondary (14) | 3 | 10 | 1 |
| tertiary (16) | 2 | 11 | 3 |
| unclassified (6) | 1 | 3 | 2 |
| residential (28) | 7 | 15 | 6 |
| living_street (8) | 2 | 5 | 1 |
| pedestrian (4) | 0 | 3 | 1 |
| service a ostatní (4) | 0 | 2 | 2 |

Hlavní rozdíl proti Praze: technická mapa Jihomoravského kraje je úplná v kresbě (hranice ploch), ale u velké
části ulic **chybí definiční bod**, který říká, co je plocha zač. Úplně tak chybí plochy velkých silnic
(silnice I.–III. třídy, typicky Heršpická, Olomoucká, Hněvkovského, Svatopetrská) a místy i vozovky místních
ulic. Profil je pak jen odhad z OSM (2–5 pruhů po 3 m bez okrajů), nebo vozovku pokryje vedlejší plocha
(chodník, parkoviště). Kde definiční body jsou, profily sedí podobně jako v Praze (např. č. 26, 40, 45, 61, 64, 69, 73, 74).

## Jak se testovalo

- **Vzorek** (`evaluation/sample.mjs`, `CITY=brno`, seed 20261106): stejné kvóty podle typu ulice jako v Praze,
  úseky ulic z OSM výřezu BBBike Brno uvnitř hranice Brna (OSM, admin_level 8), vážené délkou, aspoň 300 m od sebe.
- **Profil** (`evaluation/run_brno.mjs`): kód aplikace (`derive.js`, `sources.js`) nad brněnskými soubory
  z `pilot/data/brno`, stejný postup jako klik.
- **Kontrola**: ortofoto Brna 2025 (dlaždice gis.brno.cz, asi 20 cm/px) natočené ve směru profilu s hranicemi
  částí (`evaluation/render_brno.mjs` → `brno/data/png/<n>.svg.png`). Řezy prošli čtyři agenti po 25 se stejnými
  kritérii jako v Praze; poznámky v `brno/data/review-*.md`, verdikty v `brno/data/verdikty-*.json`.
- **Pozor na „posun“** (15 poznámek): ortofoto není pravé ortofoto, střechy domů jsou vychýlené o 2–3 m od
  půdorysu. Kontrola na dvou řezech ukázala, že plochy DTM na ortofoto sedí (obruby a chodníky lícují) a s
  budovami z průzkumu KAM se shodují do 0,4 m. Většina „posunů“ je tedy vychýlení střech, ne chyba profilu.

## Mezery podle dopadu

### 1. Plochy bez definičního bodu, hlavně velké silnice (~30 řezů)

Velké silnice nemají v DTM typ plochy vůbec (č. 1, 2, 5, 7–18, 20, 27, 33, 35, 39, 42, 51): profil je odhad z OSM
bez chodníků a okrajů, často posunutý na dělicí pás. U místních ulic bez typu vozovky ji přebije sousední plocha:
vozovka jako chodník (č. 32, 36, 58, 63, 68, 98; zde přispívá i pravidlo „úzká plocha bez typu u vozovky =
chodník“) nebo jako kolmé parkování 15–44 m přes dvory (č. 54, 56, 75, 76, 91, 100).
Sada „dopravní infrastruktura“ (DI) plochy neobsahuje, jen osy komunikací, osy kolejí a obvod pozemku silnice.
Návrh: při stavbě dlaždic pojmenovat plochu bez definičního bodu podle OSM: kudy vede osa silnice → vozovka,
kudy chodník (footway=sidewalk) → chodník, kudy koleje → tramvajová dráha; teprve pak pravidlo pro chodníky.

### 2. Pruhy přes 4 m tam, kde parkují auta (~20 řezů)

Stejné jako v Praze: mimo úseky placeného stání auta stojí u obrub, profil dává široké pruhy (č. 29, 41, 46,
59, 65, 70, 80) nebo stání na špatné straně (č. 55, 72). Odhad podélného stání se uplatní jen v místních ulicích.

### 3. Odvodňovací žlaby jako „Voda“ (4 řezy) a střední pás jako „Chodník“ (4 řezy)

„Meliorační příkop, žlab“ podél silnic se kreslí jako voda 0,4–0,6 m (č. 3, 6, 24, 31). Střední pás se svodidlem
bez definičního bodu dostane typ chodník (č. 3, 6). Návrh: žlab převést na zeleň/okraj a odhad chodníku
nepoužít na plochu sevřenou mezi dvěma vozovkami.

### 4. Tramvaje (5 řezů)

Pás přes vozovku s auty (č. 19 Poříčí), chybějící pás (č. 48 Jana Babáka), dvoukolejka 16 m (č. 95 náměstí
Svobody), úzký pás 5–5,7 m (č. 49, 60), železnice jako tramvaj (č. 94). Osy kolejí jsou z OSM. Návrh: brát osy
kolejí ze sady DI technické mapy (obsahuje „osa koleje tramvajové dráhy“), jako v Praze z DTM IPR.

### 5. „Neurčeno“ a drobné zbytky (25 poznámek)

Úzké plochy bez typu (0,4–2 m) na okrajích a u vjezdů, rozdrobené parky (č. 79, 83). Část zmizí s opravou 1.

### 6. Křižovatky, sousední ulice (8 řezů)

Řez v křižovatce nebo zabírá sousední ulici (č. 36, 37, 42, 75, 86, 92, 98) — stejné jako v Praze.

## Co sedí

Ulice, kde DTM má typy ploch: obytné ulice s úseky placeného stání (č. 61, 64, 66, 69, 73, 74 — stání TSK/Brno
včetně kolmého), čtyřpruhové silnice s dělicím pásem (č. 4, 25, 26), ulice s cyklopruhem (č. 45), budovy a
počty podlaží z průzkumu KAM.
