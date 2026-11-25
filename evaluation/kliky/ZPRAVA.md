# Kam padne kliknutí (25. 11. 2026)

**Oprava uličky (nález W1 recenze Severní Ameriky): commit `74fcb46`** (`derive.js alleyMouths`, `tests/placement.test.js`;
samostatný, pro sloučení do `canada`).

Plocha uličky (`area:highway=service`, uličky planimetrie Washingtonu) je ústím jen pro ulici, do které se otevírá. Úsek, na
kterém plocha leží do 12 m od osy, delší než 20 m, nebo cesta z většiny uvnitř plochy = její vlastní plocha. Naměřeno
kolem pěti míst Washingtonu: ústí do ulic 0–16 m dlouhá, vlastní plochy cest 24 m a víc. Plocha s více rameny má ústí
zvlášť (dřív jedno uprostřed mezi nimi). `?off=ulickysve` = jako předtím.

| místo | klik (cesta) | dřív | teď | `?off=ulicky` |
|---|---|---|---|---|
| Washington 38.913357, −77.032674 | 150699010 | 75 m | 0 | 0 |
| Washington f-13 | 293279529 | 83 m | 0 | 0 |
| Washington f-18 | 342133616 | 97 m | 0 | 0 |
| Washington f-1 | 273277385 | 137 m | 0 | 0 |
| Varšava, 10 cest v ploše | | 15–81 m u 4 cest (2 přes 25 m) | nejvýš 6 m | nejvýš 6 m |
| Gdaňsk, 5 cest | | 11–71 m u všech (4 přes 25 m) | nejvýš 11 m | stejně |
| Vratislav | 114538354 | 21 m | 0 | 0 |

## Měření kliknutí

`collect.mjs`: kliky s pevným semínkem, do 4 m od osy, 8 vzorků (ulice, křižovatka do 20 m, přechod do 8 m, dvouvozovková,
obslužná, ulička, parkoviště a vjezd, pěší), 40 na město v 11 městech (10 + Washington); běží bez prohlížeče (`osm.mjs` čte
balíky `pilot/data/osm-pack` čtečkou aplikace). Varianty: `none` (`?off=obsluzne,protejsi,ulicky`), `pre` (před 83734e7: bez
uliček a `protejsi`, v Praze i bez obslužných), `old` (bd2ef6c, před opravou uličky), `now`. Tabulky `report.mjs`.
Vzorek 439 kliků (`vysledky/kliky.json`): **posunuto > 1 m / 90. percentil / 99. / nejvíc (m) / přes 25 m**:

| | n | bez pravidel | před 83734e7 | dnes (bd2ef6c) | opravené |
|---|---|---|---|---|---|
| vše | 439 | 59 % / 13 / 22 / 31 / 4 | 63 % / 14 / 27 / 46 / 7 | 64 % / 14 / 30 / **154** / 9 | 64 % / 14 / 27 / 46 / 7 |
| ulice | 352 | 64 % / 13 / 22 / 31 / 4 | 68 % / 14 / 28 / 46 / 6 | 69 % / 14 / 28 / 46 / 6 | 69 % / 14 / 28 / 46 / 6 |
| obslužná | 32 | 38 % / 7 / 10 / 11 / 0 | 41 % / 10 / 16 / 27 / 1 | 41 % / 9 / 11 / 27 / 1 | 44 % / 10 / 20 / 27 / 1 |
| ulička | 18 | 28 % / 6 / 10 / 10 / 0 | 28 % / 6 / 10 / 10 / 0 | 39 % / 10 / 47 / **154** / 2 | 28 % / 6 / 10 / 10 / 0 |
| pěší | 20 | 50 % / 8 / 9 / 10 / 0 | 55 % / 9 / 10 / 15 / 0 | 55 % / 10 / 15 / 15 / 0 | 55 % / 10 / 15 / 15 / 0 |
| parkoviště, vjezd | 14 | 29 % / 4 / 7 / 7 / 0 | 43 % / 7 / 7 / 8 / 0 | 43 % / 7 / 7 / 8 / 0 | 43 % / 7 / 7 / 8 / 0 |

Nad 25 m (všech 7): Ječná 28, U Rajské zahrady 31, Nádražní 30, aleja Jana Pawła II 26 (křižovatka ulic, konec cesty; posun
je i bez pravidel obslužných), Podoskich (Varšava) 33, obslužná 689291450 v Paříži 27, Waterlooplein 46 (obslužné za sebou).
Velké sběry bez Washingtonu (15 892 kliků, semínka 777, 4242, 9191): přes 25 m 227 (1,4 %), přes 40 m 42, přes 60 m 2
(Hradec Bezručova 121 m, řada obslužných ústí po 25–30 m; Quai de la Corse 69 m).

**Příčiny** (semínko 4242, 3972 kliků): posun nad 25 m 49×: 22× křižovatka ulice nebo přechod (stejně bez pravidel
obslužných, většinou dvě křižovatky do 30 m), 24× obslužné ústí, místo se našlo za dalším ústím, 3× obslužné, volné místo na
cestě není. Nejčastější posun vůbec (asi polovina) je konec cesty OSM (12 m), i tam, kde ulice jen pokračuje další cestou.
- Konec cesty do 3 m po posunu: 138, všechny na cestách kratších než 24 m, na nichž je volné místo jen u konce.
- Přes další křižovatku ulice 67, přes obslužnou 133 (bez pravidel 62 a 79).
- Zůstane u křižovatky blíž než odstup 632 (bez pravidel 518): krátké cesty mezi křižovatkami.
- Jiná cesta než nejbližší 988: 495 chodník nebo přechod u ulice (záměr), 265 pěší či cyklo a 227 obslužná do 10 m od ulice
  (přirážka 10 m pro `MINOR` v `nearestStreet`; 58 obslužných kliknuto do 2 m od jejich osy a řez skončil na ulici přes
  5 m daleko), 1 podzemní. Neměněno, je to starší záměr; do backlogu.

## Zkoušené limity (nezapnuto, `trial-limits.patch`)

`podil.js`: podíl čáry řezu s obvyklým povrchem ulice podle mapy města (Praha MTVU, Brno, Vídeň, Berlín, Amsterdam,
Helsinky; 558 míst, kde se varianty liší). Proti dnešním pravidlům, lépe : hůř (rozdíl přes 0,03), rozdíl v bodech (95 %):
| varianta | lépe : hůř | body |
|---|---|---|
| bez pravidel obslužných | 36 : 89 | −1,8 (−2,7; −1,0) |
| před 83734e7 | 6 : 16 | −0,4 (−0,9; −0,1) |
| limit 25 m (pak bez obslužných, pak nejvolnější do 25 m) | 17 : 28 | −0,4 (−1,1; 0,2) |
| vyvážení posunu a odstupu (žádný skok přes křižovatku) | 43 : 104 | −2,7 (−3,7; −1,6) |
| konec cesty, kde ulice pokračuje, není konec | 37 : 209 | −5,7 (−6,9; −4,6) |

Z posunů nad 25 m: bez limitu lépe 19 : 6 (limit prohrává hlavně tam, kde se dnes přeskočí křižovatka: 8 : 1). Míra měří
typický průřez, ne vzdálenost od kliknutí, proto i slepé posouzení. Praha: bez obslužných 5 : 15, limit 4 : 10;
Brno 7 : 27, 2 : 6; **Berlín 2 : 13** (dřív 10 : 12 na jiném vzorku), Vídeň 3 : 8, Amsterdam 10 : 15, Helsinky 9 : 11.

## A/B (naslepo, čerstvá místa, zmrazený kód; `vyber.mjs`, `profily.js`, `baliky.mjs`, `skore.mjs`)

Dva posuzovatelé (Sonnet), X/Y náhodně, bez zdrojů, neutrální pokyn (`POKYN-AB.md`), ortofoto kliknutí i obou řezů, fotky Mapillary.
Rozdíl = (lépe − hůř) / dvojic, v závorce 95 % (bootstrap).

| otázka | dvojic | lépe : hůř | oba shodně | rozdíl |
|---|---|---|---|---|
| oprava uličky × dnes | 22 | **17 : 2** | 13 : 2 | 68 % (41; 91) |
| obslužné zapnuté × vypnuté (rozdíl nad 15 m, Berlín nad 5) | 50 | 24 : 15 | 21 : 10 | 18 % (−6; 42) |
| dnes × limit 25 m | 38 | 14 : 13 | 11 : 10 | 3 % (−24; 29) |
| dnes × nesplnitelné obslužné vynechat | 48 | 19 : 17 | 14 : 12 | 4 % (−21; 27) |

Oprava uličky v městech: Krakov 3 : 0, Poznaň 3 : 0, Vratislav 2 : 0, Gdaňsk 2 : 0, Varšava 1 : 0, Washington 6 : 1 (profily z větve
`canada`, posouzené podruhé, protože první balíček měl prázdná ortofota), Štětín 0 : 1 (posun jen 0,2 m proti 6,2).
Berlín s obslužnými 6 : 8 (16 dvojic, oba shodně 6 : 4), hlasů 12 : 12.

**Nesplnitelné obslužné vynechat** (ze zkoušek: kde žádné místo na cestě není volné, zapomenout obslužná ústí a řídit se jen
ulicemi): proti mapám 64 míst **32 : 13, +6,8 bodu (2,7; 10,9)** (Brno 7 : 0, Berlín 5 : 0, Amsterdam 5 : 0, Helsinky 8 : 4,
Vídeň 4 : 6, Praha 3 : 3), naslepo 17 : 19. Na obslužných cestách obojí pro (mapa 9 : 2, naslepo 7 : 2), na ulicích mapa 23 : 10,
naslepo 10 : 16. Nezapnuto: posuzovatelé ho nepotvrdili. Rozdělení podle druhu cesty je až z těchto dat.

## Rozhodnutí
- Oprava uličky zapnutá. `obsluzne`, `protejsi`, `ulicky` zůstávají zapnuté všude, i v Berlíně (mapa 13 : 2, naslepo 6 : 8:
  proti sobě, bez výjimky města). Interval slepého posouzení obsahuje nulu.
- Limit ani jiná úprava se nezapíná. Otevřené pro Báru: „nesplnitelné obslužné vynechat“, zvlášť na obslužných cestách
  (čerstvé měření), a `nearestStreet` u obslužných do 10 m.

## Kontrola sběru
Servery 5301–5303 během 25. 11. zastavil cizí `pkill`; všechny sběry skončily předtím (poslední soubor 22:11:28). Všech 51
dvojic, jejichž ramena se liší zdroji dat, jsem po restartu sebral znovu (102 profilů): shodné do posledního dílu.
Dlaždice helsinki-576 bez ortofota („nejde“). Data Washingtonu mají jen 40 kliků (velký sběr jsem ukončil kvůli počtu dotazů).
