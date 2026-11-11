# Audit nesouladů: kresba, editor Návrhu, kontrola při načtení a normy

Prohlídka aplikace Profily ulic (11. 11. 2026) po hlášení uživatele z Orlické (commity 7678cec a 139c577):
značka IP 4c se kreslila, ale editor ji popisoval jako „IP 4b / B 2“, stav z dat nešel v Návrhu vyrobit ručně
a chyběla kontrola šířky. Hledaly se chyby stejného druhu:

- (a) nesoulad mezi tím, co se kreslí nebo exportuje (`profile.js`, `streetmix.js`), a popisky v editoru (`app.js`, `types.js`, `signs.js`);
- (b) stavy, které odvození vytvoří (`derive.js`, `signs.js`), ale v Návrhu je nejde vytvořit, změnit nebo odebrat;
- (c) co projde editorem, ale `validate.js` to při načtení souboru nebo odkazu zahodí, nebo naopak pustí, co kresba neumí;
- (d) typy částí a značky bez kontroly proti normám z `CLAUDE.md`, `pilot/README.md` a Manuálu C.2.

Ověřeno čtením kódu a testy (`npm test`, 109 testů prochází). Žádné dotazy na služby. Opravy jsou v samostatných
lokálních commitech na větvi `worktree-agent-a091f4afa5c63a0f1`, nic není pushnuté. Editor v `app.js` nemá testy
(běží jen v prohlížeči), jeho změny jsou ověřené `node --check` a testy čisté logiky, kterou volá
(`validate.js retype`, `types.js TURN_CHOICES`, `signs.js SIGN_CHOICES`); před nasazením je třeba kliknout v Návrhu.

Řádky platí pro stav po opravách (HEAD větve).

## Závažné (kresba nebo export říká něco jiného než editor, nebo se ztrácejí data)

### 1. Značky s dodatkovou tabulkou z dat nešly v Návrhu vybrat a IP 11 se popisovala jinak, než se kreslí — opraveno
- `pilot/public/signs.js:43` (`SIGN_CHOICES`), `pilot/public/app.js:1222` (nabídka „+ přidat značku“), `pilot/public/validate.js:79`.
- Stejný případ jako IP 4c. `deriveSigns` a `streetSigns` tvoří `b1`+`obsluha` (B 1 + E 13 „Mimo dopravní obsluhy“),
  `b11`+`obsluha`, `ip27a`+`kola` (pěší zóna s cyklisty, soubor IZ6a-kola), `ip11a`+`podelne|kolme|sikme`
  (kreslí se IP 11c, resp. IP 11b) a `ip20a`+`kolo` (symbol kola pod BUS). Nabídka měla jen klíče bez tabulek, takže
  tyto značky šly jen smazat, ne přidat. Popisek `ip11a` zněl „IP 11a–c Parkoviště (kolmé)“, kreslila se IP 11b.
- Oprava: všechny dvojice v `SIGN_CHOICES` s popiskem podle toho, co se kreslí („IP 11b Parkoviště (kolmé stání)“,
  „B 1 + E 13 …“); `ip11a` samotná je „IP 11a Parkoviště“. `validate.js` nechá tabulku jen u známé dvojice (dřív u
  kterékoli značky, např. `b1`+`kolme`). Test: každá tabulková značka, kterou data vyrobí, je v nabídce a její SVG
  v `znacky/` existují pro oba směry pohledu.

### 2. Změna typu části v Návrhu nechávala nastavení starého typu a kresba se jimi dál řídila — opraveno
- `pilot/public/validate.js:66` (`retype`), `pilot/public/app.js:1073`; kresba `pilot/public/profile.js:1223`
  (`s.position === "on_kerb"` bez ohledu na typ), `:1329` (`s.turn`), `:1332` (`s.bikeDir`), `:1363` (`s.wires`).
- „Parkování na chodníku“ přepnuté na „Jízdní pruh“ zůstalo vydlážděné jako chodník (`position`), pruh přepnutý na
  chodník si nechal šipky řazení, cyklistu a troleje, tramvajové těleso přepnuté na pruh si neslo `bed`
  a `withBus` (do Streetmixu i do odkazu). Při načtení souboru `validate.js` `position` u jiného typu maže, editor ne.
- Oprava: `retype(s, type)` odloží, co k novému typu nepatří (tabulka `FIELD_TYPES`: dir, bikeDir, turn, orient,
  use, position, color, bed, bedGuess, withBus, trolley, wires, roadClass), směrovému typu dá směr. Test v
  `tests/validate.test.js`.

### 3. Barva cyklopruhu z OSM se kreslí a exportuje, ale odkaz ji nepřenášel a kontrola ji nehlídala — opraveno
- `pilot/public/share.js:4` (`SEG_KEYS`), `pilot/public/validate.js:28`.
- `derive.js` nastaví `color` z `cycleway:*:surface:colour` (`COLOURS`, tři hex barvy), `profile.js:1223` ji dá rovnou
  do `fill`, `streetmix.js:44` z ní dělá červený pruh. Sdílený odkaz ji vynechal (návrh z odkazu měl cyklopruh hnědý),
  načtený JSON mohl do SVG atributu vložit libovolný text.
- Oprava: `color` v `SEG_KEYS`; `validate.js` pustí jen `#rrggbb`. Test v `tests/share.test.js`.

### 4. Šipky řazení z OSM se kreslily, ale editor je ukazoval jako „bez šipky“; soubor pustil text, který kresba vypsala doslova — opraveno
- `pilot/public/types.js:61` (`TURNS`, `TURN_CHOICES`, `isTurn`), `pilot/public/app.js:1168`, `pilot/public/validate.js:26`.
- `turn:lanes` dává i `slight_left`, `sharp_right`, `reverse`, `merge_to_*`, `left;through;right`; `turnLabel` je
  pojmenuje, ale výběr v editoru měl jen 6 kombinací, takže vybraná možnost byla „bez šipky“ a první kliknutí šipku
  smazalo. `validate.js` bral jakýkoli řetězec (test dokonce chtěl `left|through`), pod pruhem se pak psalo „left|through“.
- Oprava: `TURNS` přesunuté do `types.js`, nabídka ze `TURN_CHOICES` (+ `left;through;right`) a navíc aktuální
  hodnota pruhu pojmenovaná jako v kresbě; `validate.js` nechá jen slova z `TURNS` spojená „;“ (jako OSM). Test, že
  každá nabízená kombinace má jméno a převod do Streetmixu (`turn-lane`).

### 5. Obousměrný pruh bez směru: kresba „↑↓“, editor „↑ od diváka“ a zpět se nedal vrátit — opraveno
- `pilot/public/app.js:1100–1108`; odvození `derive.js:715` (`dir: twoWaySingle ? undefined …`), kresba `profile.js:1317`.
- Dvousměrná ulice s jednou osou má pruh bez `dir`, popisek „Jízdní pruh ↑↓“. Tlačítko v editoru ukazovalo „↑ od
  diváka“ a přepínalo jen forward/backward, stav bez směru nešel obnovit ani vyrobit. Cyklostezka z technické mapy
  bez směru (`derive.js:939`, `:947`) se v editoru taky tvářila jako „od diváka“.
- Oprava: výběr se třemi stavy; u pruhu „↑↓ obousměrný“, u jiné části bez směru „bez směru“ (jen dokud směr nemá).

### 6. Cyklisté v pruhu (`bikeDir`) a troleje (`trolley`, `wires`) nešly v Návrhu nastavit ani zrušit — opraveno
- `pilot/public/app.js:1109–1125`; odvození `derive.js:729`, `:753` (bikeDir), `:1699–1711` (troleje); kresba
  `profile.js:1308` (popisek „cyklisté ↓“), `:1332` (cyklista), `:1266`, `:1275` (trolejbus), `:1363` (dráty).
- Jednosměrka s `oneway:bicycle=no` bez značení dá krajnímu pruhu `bikeDir` proti směru; `trolley_wire=yes` dá pruhům
  BUS trolejbus a dráty. V Návrhu šlo obojí jen zdědit ze Stavu, ne přidat k novému pruhu ani odebrat.
- Oprava: výběr „Cyklisté v pruhu“ (ne / ↑ / ↓; u piktokoridoru „po směru pruhu“) a zaškrtávátko „Troleje“
  (dráty nad pruhem; u pruhu BUS i trolejbus, jako v `derive.js`).

### 7. Tramvajové těleso v trávě šlo do Streetmixu jako barevný pás — opraveno
- `pilot/public/streetmix.js:61`.
- Streetmix má u `streetcar` varianty `regular | colored | grass`; těleso s `bed: "trava"` šlo jako `colored`.
  Oprava: `grass`. Test v `tests/streetmix.test.js`. (Export do Streetmixu zatím není v aplikaci nabízený.)

## Střední (nesoulad hlášení nebo výchozích hodnot s normou; k rozhodnutí Báry, neopraveno)

### 8. Šikmé stání: editor dovolí 3,5 m, odvození ho dělá 4,5 m, kontrola chce 4,5 m minimum a 5 m základ
- `pilot/public/app.js:1094`, `:1140`, `pilot/public/profile.js:1427` (minimum tažení jen u kolmého),
  `pilot/public/rules.js:48–51`, `pilot/README.md:112–121` (čára šikmého stání je pás hloubky 4,5 m).
- Šikmé stání z dat (4,5 m) dostane v Návrhu hned oranžové „kolmé a šikmé stání: 5 m“; ručně nastavená šikmá 3,5–4,5 m
  je červená, ale editor ji nebrání (u kolmého brání pod 4,5 m). Návrh: buď šikmému dát v `rules.js` vlastní řádek
  (min. 4,5 m = základ 4,5 m, ČSN 73 6056 45°), nebo v editoru hlídat 4,5 m i u šikmého; výběr normy je na Báře.

### 9. Výchozí šířka tramvajových částí 3,25 m dá dvoukolejnému pásu 6,5 m, tedy hned oranžové varování
- `pilot/public/types.js:73` (`tramvaj_pruh: 3.25, tramvaj: 3.25`), `pilot/public/rules.js:93–106` (standard 7 m).
- Dvě části přidané z palety = 6,5 m = minimum, ne standard. Návrh: výchozí 3,5 m (osová vzdálenost 3,5 m podle
  Manuálu C.2 u zatížených ulic) pro `tramvaj_pruh` a `tramvaj`; `tramvaj_v_pruhu` nechat.

### 10. Stav ukazuje po kliknutí jen název typu, kresba pod částí víc
- `pilot/public/app.js:1027` (`renderInfo`), `pilot/public/profile.js:1309–1320`.
- Popisek v kresbě říká „Parkování kolmé“, „Parkování ZTP“, „Napůl na chodníku“, „Tramvajové těleso + BUS ↑“,
  „Jízdní pruh ↑, piktokoridor ↓“; panel ve Stavu jen „Parkování, 4,50 m“. Návrh: vytáhnout tvorbu popisku
  z `buildSvg` do exportované funkce (`partLabel(s, segs, i)`) a použít ji v `renderInfo` i v `<title>` části.

## Nízké (drobnosti, neopraveno)

### 11. Nabídka značek je stejná pro každou část
- `pilot/public/app.js:1222`. Pod chodník jde přidat IP 20a nebo B 20a, pod parkování zónu. Odvození značky váže
  na typ (`signs.js:97–125`). Návrh: nabídku zúžit podle typu části (vozovka / stezka / parkování / ostatní) s
  možností „další…“.

### 12. `validate.js` nechá u značky `dir`, který nic netvoří
- `pilot/public/validate.js:80`; `signFile` ho čte (`signs.js:147`), ale ani odvození, ani editor ho nenastaví.
  Buď smazat z kontroly, nebo nechat jako rezervu (bez dopadu).

### 13. `validate.js` při načtení nechává `orient`, `use`, `turn`, `bed`, `withBus` u částí, kterým nepatří
- `pilot/public/validate.js:23–30`; totéž, co řeší `retype` (bod 2) u změny typu. Uložený soubor po staré změně
  typu si nesoulad nese dál. Návrh: v `cleanProfile` použít `FIELD_TYPES` (tak jako už u `position`). Neudělal jsem
  to, aby se neměnilo načítání profilů z odvození bez prověření na 100 řezech.

### 14. Přepnutí směru pruhu nechá `bikeDir`, takže se cyklisté z „po směru“ stanou „v protisměru“
- `pilot/public/app.js:1107`. Po bodu 6 jde cyklisty přenastavit ručně; „⇄ Otočit“ (`app.js:1398`) obrací obojí.
  Návrh: při změně `dir` otočit i `bikeDir`, je-li nastavený.

### 15. Export do Streetmixu zjednodušuje víc, než musí
- `pilot/public/streetmix.js:33` chodník s cyklisty = běžný chodník (Streetmix nic bližšího nemá), `:45` ochranný
  cyklopruh ignoruje barvu, `:52` pruh se šipkou ztratí cyklisty (`car-with-bike`), `:55` přístupová cesta vždy
  `inbound`. Tlačítko je vypnuté, dopad nulový.

## (d) Chybějící kontroly proti normám (jen návrhy, nic se nemění)

### 16. Stezka pro cyklisty bez kontroly šířky
- `pilot/public/rules.js:52` (`default: return null`). `CLAUDE.md` „Normy a limity“: cyklostezka 2,50 m;
  `DEFAULT_WIDTH.cyklostezka` je 2,5. Návrh: `cyklostezka` min. i základ 2,5 m (obousměrná; jednosměrná část
  s `dir` by potřebovala vlastní hodnotu, Manuál C.2 ji neuvádí).

### 17. Nástupiště bez kontroly šířky
- `pilot/public/rules.js:52`; Manuál C.2 (`data/zdroje/ipr_manual_C2.txt:1183`): „Minimální světlá šířka zastávky pro
  cestující nesmí klesnout pod 2 m“. Návrh: `nastupiste` min. 2 m (červeně), základ 2,5–3 m (oranžově; README:66
  bere pás 3 m), odečíst nic (přístřešek je prvek).

### 18. Stezka pro chodce a cyklisty a chodník s cyklisty se kontrolují jako chodník
- `pilot/public/rules.js:26` (1,5 / 2 m), `DEFAULT_WIDTH.stezka_sdilena` 3 m. Manuál C.2 pro společnou stezku
  šířku neuvádí; ČSN 73 6110 (není ve zdrojích) má 3 m. Bez schválené normy nechat, jen hlásím.

### 19. Strop šířky pruhu (4 m, dálnice 3,75 m, místní 4,5 m) kontrola nehlídá
- `pilot/README.md:353`, `derive.js` `LANE_CAP`; `rules.js` hlídá jen minima. Pruh roztažený v Návrhu na 6 m
  neprojde varováním, přestože odvození by zbytek označilo za krajnici. Návrh: oranžově nad stropem třídy.

### 20. Řadicí pruh
- Manuál C.2 (`ipr_manual_C2.txt:644`): „cca 2,5 m — řadicí pruh“. `rules.js:31` posuzuje pruh se šipkou (`turn`)
  jako běžný pruh (skupina B min. 3 m), takže řadicí pruh 2,75 m z OSM je červený. Návrh: pruh s `turn` min. 2,5 m.

### 21. Pravidlo IP 4c jen pro pruhy, krajnici a piktokoridor
- `pilot/public/rules.js:62` (`CONTRA_RUN`), značka se dává i pod `bus`, `bus_cyklo`, `tramvaj_v_pruhu`
  (`signs.js:101`). Jednosměrka, jejíž jediný pruh je BUS s cyklisty v protisměru, kontrolu nedostane. Okrajové,
  jen hlásím.
