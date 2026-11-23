# Nepřátelská recenze státu Monako (MC), 23. 11. 2026

Rozsah: `countries/MC.js` (nad `FR.js`), `towns/monaco.js`, `evaluation/monaco/PRAVIDLA.md`, `tools/monaco-border.json`,
`tools/build_staty.mjs`, `staty.json`, části `app.js`, `signs.js`, `search-photon.js`, `index.html`, `city.js`,
`tests/monaco.test.js`, `LICENCE-A-ZDROJE.md`, `pilot/README.md`. Větev `estonia`, HEAD `84140de`. Žádný soubor kromě
této zprávy jsem neměnil.

Co jsem ověřil:
- `npm test` prošel (353 testů, 0 chyb).
- Code de la route na legimonaco.mc (staženo 23. 11., „Dernière modification 4 juillet 2026“): čl. 31 (stání jen na
  plochách vymezených vodorovným značením), čl. 32 1° (chodník: „gênant“), čl. 32-1 1°, čl. 39 (ordonnance 793/1953),
  definice „aire piétonne“ v čl. 1. Citace v `MC.js` a `PRAVIDLA.md` sedí. Slova „zone de rencontre“, „zone 30“ a
  „double sens cyclable“ v kodexu nejsou (hledáno v celém textu).
- `cityAt` v mřížce po 8 × 11 m přes celé Monako proti původní hranici z OSM (`tools/monaco-border.json`) a na všech
  909 úsecích ulic lokálního balíku `mc-novy.posm`.
- `deriveProfile` pro `monaco`: bez odhadu stání (čl. 31), `limits` vrací `null`.
- `MC.signs.file` a `label` pro zóny, rychlosti a jednosměrku.
- Geofabrik `europe/monaco/monaco-latest.osm.pbf` existuje; `cleanCut` řez v Monaku s `orthoCity: "fr"` pustí.

Co jsem neověřil: ortofoto IGN nad Monakem živým dotazem (jen podle `PRAVIDLA.md`), skutečné značení v ulicích,
chování v prohlížeči, stavbu balíku `mc`.

Bez nálezu:
- `parkGuess: false` odpovídá čl. 31, `halfKerbNote` cituje správné články a nepoužívá francouzský R417-11.
- `limits: () => null` je poctivé: monacký předpis šířek rešerše nenašla, francouzská čísla se nepřebírají.
- Popisky značek jsou bez francouzských čísel (`label` odstraní i český kód).
- `contraflow` a `tramBelt` z Francie jsou prázdné (`() => null`, `() => []`), nic francouzského nevnášejí.
- CSP: `data.geopf.fr` a `photon.komoot.io` už v seznamu jsou.

## Ověřené nálezy

### 1. Hranice: 2 % monackých ulic nejsou Monako a pás Beausoleil není nikde (závažné)

Hranice z OSM má 602 bodů, `build_staty.mjs:87` ji zjednoduší na 30 m jako velké státy. V `staty.json` zbylo 55 bodů a
druhý prstenec se zhroutil na úsečku (`[[7.434,43.7456],[7.4347,43.7459],[7.434,43.7456]]`, nulová plocha). Stát měří
kolem 2 km² a místy je široký 300 m.

Mřížka proti původní hranici (plocha podle OSM 238,6 ha): 2,1 ha Monaka je `cizina`, 1,6 ha `france`, 3,2 ha mimo
Monako je `monaco`. Po ulicích (úseky silnic balíku, střední bod):

| podle OSM | `cityAt` | úseků | příklady |
|---|---|---|---|
| Monako | `monaco` | 783 | |
| Monako | `france` | 8 | Boulevard du Jardin Exotique, Avenue Hector Otto, Boulevard du Tenao, Lacets Saint-Léon, Avenue de France |
| Monako | `cizina` | 8 | Avenue Camille Blanc, Boulevard du Général Leclerc, Esplanade et promenade Prince Jacques (Mareterra) |
| mimo | `monaco` | 4 | Boulevard du Général Leclerc, Avenue Princesse Grace |
| mimo | `cizina` | 17 | Boulevard de la République, Rue du Marché, Avenue Delphine, Avenue du Port, Rue du Gabian |

Důsledky: monacká ulice vedená jako Francie dostane odhad stání podle francouzského zákona (v Monaku čl. 31 zakázaný),
francouzská čísla značek a varování podle francouzských šířek. Druhá půlka chyby je starší: prstenec Francie z GISCO
1 : 1 M má kolem Monaka hrubou díru, takže mezi Francií a Monakem zůstal pás francouzského území až 150 m široký
(např. 43,7430; 7,4262 v Beausoleil), který je `cizina`: bez ortofota IGN, bez BD TOPO, bez francouzských pravidel.
`tests/monaco.test.js` zkouší čtyři body hluboko uvnitř, žádný u hranice.

Náprava: Monako nezjednodušovat (602 bodů je 10 kB) a zkontrolovat druhý prstenec; díru Francie zalepit hranicemi obcí
Cap-d'Ail, La Turbie, Beausoleil a Roquebrune-Cap-Martin (IGN ADMIN EXPRESS nebo OSM) jako dalšími prstenci Francie.
Test s Boulevard du Général Leclerc (hraniční ulice), Avenue Princesse Grace a Mareterrou.

### 2. Kreslí se značky, které monacký kodex nezná (střední)

`MC.js:20` přebírá celé `FR.signs.file`. `PRAVIDLA.md` (odst. 1 a Doporučení) přitom říká: „Zone 30 ani zone de
rencontre v kodexu nenalezeno“, „zóna 30 a obytná zóna v kodexu nejsou, jen aire piétonne“, a ověřil jsem to v textu
kodexu. Přesto `MC.signs.file({k:"zona30"})` vrací `B30-30`, `{k:"ip26a"}` → `B52` (zone de rencontre), `{k:"c9a"}` →
`C115` (voie verte, pojem francouzského práva), `{k:"ip14a"}` → `C207`. `living_street` nebo `zone:maxspeed` v OSM tedy
v Monaku nakreslí francouzskou zónovou značku. `ZONE_SPEED` (`signs.js:96`) k tomu schová rychlost 20 nebo 30, kterou
čl. 11 kodexu zná jen jako značku rychlosti.

Že monacké značky vypadají jako francouzské, je podle `PRAVIDLA.md` (odst. 3) „pozorování, ne doložené zdrojem“, a
„autorské právo k značkám: nenalezeno“. Patička (`index.html:135`) přesto píše „dopravní značky Wikimedia Commons
(úřední díla)“ a README „Značky kresbou francouzské (Ženevský protokol 1949)“ jako fakt.

Náprava: v Monaku jen značky s oporou (B1/C12, B14, B6, B0/B7b, B54 aire piétonne, C1a); `zona30` a `ip26a` nekreslit
a rychlost neschovávat, dokud se nenajde monacký předpis nebo fotka značky. V patičce „kresby francouzských značek“.

### 3. Stát přidaný bez jediného zkontrolovaného řezu (střední)

Commit `d93de71`: „no measurement (8 points: steps, paths, the sea)“. `evaluation/monaco/` má jen `PRAVIDLA.md`, žádné
řezy, žádný vzorek. Pravidlo projektu je univerzální měření u každého nového státu; kde nejde (málo fotek), aspoň
ruční prohlídka. Monako je přitom těžký případ: ulice v patrech nad sebou, tunely, schodiště, nábřeží na pilotech,
`wideStreets` a `besideMax` zděděné z pařížských bulvárů (`MC.js:9` rozbalí celé `FR`).

Náprava: 15–20 řezů vybraných ručně na ulicích s domy (Boulevard des Moulins, Rue Grimaldi, Avenue de la Costa,
Boulevard d'Italie, Rue Princesse Caroline), posoudit proti ortofotu; zapsat do `evaluation/monaco/`.

### 4. Balík OSM na R2 není, texty stát už slibují; větev je za `main` (střední)

`data.streetspace.eu/osm/index.json` 23. 11. balík `mc` nemá. `app.js:475`, `app.js:1007` a `index.html:7,12` Monako
jmenují. `origin/main` má commit `a941dbd` (texty států bez dlaždic na R2 zatím ne), tato větev ho neobsahuje.

Náprava: při slučování podle `a941dbd`; workflow „OSM tiles“ ručně se `states: mc`, ověřit `index.json`.

### 5. Záznam řezů zahodí polohu (střední)

`logging/worker.js:48`: `num(e.lat, 45.5, 55.5)`. Monako leží na 43,7° s. š., poloha řezu se nezapíše. Náprava: meze
podle `countries/<ISO>.js bounds`; nasadit musí Bára.

### 6. Drobnosti (drobné)

- `halfKerbNote` (`MC.js:15`) píše „zákona o silničním provozu“; Code de la route je ordonnance souveraine
  (č. 1.691/1957), ne zákon. Stačí „pravidel silničního provozu (Code de la route)“.
- `MC.js:9` dědí z Francie i `lawNeed`, `wideStreets`, `besidePassport`, `besideMax`, `houseLook`; žádné z nich není
  pro Monako rozhodnuté ani zkoušené. Aspoň komentář, co se dědí vědomě.
- `FR_SPEEDS` dovolí v Monaku značky 80, 90, 110 a 130; kodex zná 30, 50, 70 (`PRAVIDLA.md` odst. 1). Neškodné, dokud
  to OSM netvrdí.
- `bounds` (`MC.js:11`) končí na 7,44° v. d., východní cíp Monaka je podle OSM na 7,43987: rezerva 10 m.
- `LICENCE-A-ZDROJE.md:93`: „značky jako Francie“ bez zmínky, že pro Monako právní základ chybí (viz nález 2).

## Podezření (neověřeno)

- Ve skutečnosti Monako zóny 30 a „zone de rencontre“ nejspíš značí (obecní vyhlášky), jen ne v kodexu. Pak by nález 2
  byl menší, ale chtělo by to doklad (arrêté municipal nebo fotka), ne převzetí z Francie mlčky.
- Mareterra (otevřená 2024) v ortofotu IGN nemusí být; řez na Esplanade Prince Jacques by četl moře jako vozovku.
- IGN ortofoto nad Monakem: Licence Ouverte 2.0 platí pro data IGN bez ohledu na území, ale zda IGN Monako snímkuje
  pravidelně, nevím.

## Verdikt

Právní část je malá a poctivá: čl. 31 a 32 sedí, žádná vymyšlená čísla, šířky se nevarují. Slabé místo je zeměpis:
stát o 2 km² má hranici zjednodušenou jako Španělsko a kolem sebe díru ve Francii, takže hraniční bulváry a Larvotto
vycházejí jako Francie nebo cizina (nález 1). K tomu značky zón, které rešerše sama označila za nedoložené (2), a žádný
zkontrolovaný řez (3). Počet: závažné 1, střední 4, drobné 1 (pět drobností v jednom bodě).
