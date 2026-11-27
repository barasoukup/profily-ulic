# Nepřátelská recenze státu Kypr (CY), 23. 11. 2026

Rozsah: `countries/CY.js`, `towns/cyprus.js`, `signs-CY/`, `evaluation/cyprus/`, jízda vlevo v `derive.js`
(`leftHand`, `mirrorLeftHand`), `lanes-ortho.js` („cy“), `search-photon.js`, `credits.js`, `city.js`, `index.html`,
`LICENSES-AND-SOURCES.md`, `app/README.md`, `tests/cyprus.test.js`, `tests/derive.test.js`, `states.json` a
`tools/cyprus-border.json`. HEAD `84140de` (větev `estonia`). Žádný existující soubor jsem neměnil, nic necommitoval.

Co jsem ověřil:
- `npm test`: 353 testů, 0 chyb.
- `deriveProfile` a `splitTwoWayLane` na umělých ulicích s `country.leftHand = true` (odbočovací pruhy, `bus:lanes`,
  dvě jednosměrné osy v jedné vozovce, dělená silnice, odhad stání). Výstupy jsou u nálezů.
- Bod v polygonu `states.json` „cyprus“ (původní i zjednodušený) pro 20 míst; souřadnice Pyly, Mammari, Deneie a
  letiště Nikósie z Photonu (4 dotazy).
- Licence 16 souborů na Wikimedia Commons (jeden dotaz API `extmetadata`): souhlasí se `signs-licence.json`.
- Vykreslení 12 SVG ze `signs-CY/` a porovnání s mapováním v `CY.js`.
- Jeden dotaz na budovy DLS (`BU_Buildings/MapServer/6/query` s `distance`): odpovídá, pole sedí.
- Neověřeno: řecké texty KDP 66/1984 a Kodexu a skenovaná příručka odboru veřejných prací (hodnoty norem jsem
  proti zdroji znovu nečetl, jen proti `NORMS.md`).

## Závažné

### 1. Jízda vlevo: šipky řadicích pruhů a pruhy z `bus:lanes` končí ve špatném pruhu (ověřeno)

`applyLaneTags` (`app/public/derive.js:863–883`) čte `turn:lanes`, `bus:lanes`, `bicycle:lanes` „od řidičovy levé
ruky“ v rozložení pro jízdu vpravo (levý pruh = u středu). `mirrorLeftHand` (`derive.js:849–859`) pak jen obrátí
pořadí směrů a šipek po pozicích. Při jízdě vlevo je ale řidičův levý pruh u obruby, takže se pořadí uvnitř směru
převrátí.

Umělá ulice 13 m, `lanes:forward=2`, `lanes:backward=2`, `turn:lanes:forward=left|through` (zleva doprava z pohledu
diváka, ↑ = forward):

- jízda vpravo: `↓through | ↓left | ↑left | ↑through` (správně),
- `leftHand`: `↑through | ↑left | ↓left | ↓through`. Správně má být `↑left | ↑through | …`: odbočení vlevo je při
  jízdě vlevo u levé obruby, aplikace ho kreslí u středu a rovně u obruby.

Totéž `bus:lanes:forward=designated|yes` (pruh BUS u levé obruby po směru): výsledek
`↑pruh | ↑pruh | ↓bus | ↓pruh`, tedy pruh BUS jako vnitřní pruh **protisměru**. Pravidlo „nic nepřesouvat, jen otáčet
směr“ tu chrání díl, který na své místo položilo čtení pro jízdu vpravo, ne data.

Oprava: při `leftHand` v `applyLaneTags` brát seznamy po pruzích od obruby (pro forward nízké `t` až po zrcadlení,
tj. číst po `mirrorLeftHand`, nebo obrátit pořadí seznamu) a `mirrorLeftHand` nechat otáčet jen `dir`, ne `turn`.
Test: `turn:lanes` a `bus:lanes` s `leftHand` v `tests/derive.test.js`.

### 2. Jízda vlevo: dvě jednosměrné osy v jedné vozovce se otočí proti datům (ověřeno)

`mirrorLeftHand` pozná „obousměrnou vozovku“ jen podle toho, že pruhy mají dva různé směry (`derive.js:851`).
Vozovka se dvěma jednosměrnými osami OSM (třída bez plochy středového pásu, nebo odhad, který pás nenajde) má směry
z geometrie os (`dirAt`, `derive.js:2010–2012`), tedy už správně vlevo. Zrcadlení je otočí.

Umělá silnice 20 m, osa na sever na západě (jízda vlevo), osa na jih na východě, obě `oneway=yes`, `lanes=2`:
`leftHand` dá `krajnice | ↓ | ↓ | ↑ | ↑ | krajnice`, tedy jízdu vpravo. Bez `leftHand` by stejná data vyšla
správně. Komentář u funkce slibuje „One-way roadways stay“, kód to neplní.

Oprava: zrcadlit jen pruhy, jejichž směr vznikl pravidlem (`halves`, dvousměrná osa v `dirAt`), ne směr převzatý
z jednosměrné osy; nejjednodušeji příznak na pruhu.

### 3. Jízda vlevo: `splitTwoWayLane` dělí vždy `↓ | ↑` (ověřeno)

`derive.js:2316`: `{ dir: "backward" }, { dir: "forward" }` bez ohledu na `country.leftHand`. Volá se v `app.js:590`
po měření pruhů z ortofota, tedy právě v cestě, kterou jde každý kyperský řez (odhad z ortofota, střední čára
nenalezena, jeden pruh od 5 m). S `leftHand = true` vrací `chodnik | ↓pruh | ↑pruh | chodnik`. Sousední
`lanesFromShoulders` (`derive.js:2445`) a `estimateFromOsm` (`derive.js:2511`) stát čtou, tahle ne.

Oprava: stejná podmínka jako na řádku 2445; test se `leftHand`.

### 4. Ortofoto DLS 2019 bez licence jako podklad mapy i zdroj měření

`lanes-ortho.js:62–65`, `app.js:304–307`, `LICENSES-AND-SOURCES.md:94` („licence neuvedená (Bára 23. 11.: použít)“).
`SOURCES.md` kap. 1 sám píše: v katalogu data.gov.cy služba není, DLS ortofota prodává (25 € / km²), katalog API DLS
žádá o přístup správce a JOSM v roce 2020 ortofoto DLS vyřadil pro nejasnou licenci. Aplikace z něj přitom tahá
dlaždice do úrovně 21 jako podkladovou mapu (každý posun mapy) a až 30 dlaždic na kliknutí. Vedle leží ortofoto 2014
(10 cm) se zapsanou CC BY 4.0.

Rozhodnutí je Bářino a je zapsané poctivě; riziko zůstává. Návrh: napsat DLS o svolení, do odpovědi brát 2014
(aspoň jako podklad mapy), a v patičce (`index.html:136`) neuvádět ortofoto a budovy jednou závorkou, ze které
čtenář pozná licenci jen u budov.

## Střední

### 5. Krajnice dělené silnice u středového pásu místo u vnějšího okraje (ověřeno)

`derive.js:765–770`: „the outer edge, the driver's right“; `outerL = oneway && dirAt(…) === "backward"`. Při jízdě
vlevo je vnější okraj po řidičově levici. Umělá dělená silnice (pás 2 m, vozovky 11 m, dva pruhy), `leftHand`:
`↑ | ↑ | krajnice | pás | krajnice | ↓ | ↓`. Krajnice má být u obrub. Oprava: `outerL` otočit při `leftHand`.

### 6. Nárazníková zóna není „mimo“: Pyla, Mammari, Deneia a letiště Nikósie jsou stát „cyprus“ (ověřeno)

`app/README.md:291` a commit tvrdí, že nárazníková zóna OSN (Pyla) je mimo. `tests/cyprus.test.js:44` to má
dokazovat bodem 35,045 N, 33,712 E s komentářem „Pyla“. Ten bod leží 3,5 km severně od Pyly u Pergamosu (sever).
Skutečná Pyla (35,0142 N, 33,6925 E; i těžiště katastru 35,0031 N, 33,6994 E podle Photonu), Mammari (35,1756 N,
33,2051 E), Deneia (35,1664 N, 33,1464 E) i mezinárodní letiště Nikósie v chráněné oblasti OSN (35,1528 N,
33,2773 E) leží **uvnitř** polygonu `states.json` „cyprus“ (původní `tools/cyprus-border.json` i zjednodušený).
Hranice OSM tedy nárazníkovou zónu aspoň zčásti zahrnuje. Podle `SOURCES.md` tam dlaždice ortofota 2019 vracejí 404
(Pyla), takže řez je odhad z OSM s kyperskými normami a hlavičkou „na Kypru“.

Oprava: buď zónu opravdu vyříznout (linie „NORTH/SOUTH BUFFER ZONE“ ve službě DLS Topography, vrstva 2), nebo
přepsat README a test na to, co platí; test opravit na skutečnou Pylu.

### 7. Sever ostrova je „cizina“ s jízdou vpravo, přestože se tam jezdí vlevo a aplikace tam řezy dělá (ověřeno čtením)

`countries/default.js` nemá `leftHand`, `cityAt` dává severu „cizina“ (`tests/cyprus.test.js:42–43`). Balík OSM `cy`
je z výřezu Geofabriku pro celý ostrov a hledání Photon vrací ulice severu s `countrycode: CY`
(`search-photon.js:10`, rámeček celého ostrova; `SOURCES.md` kap. 4: „Ziya Rizki Caddesi Girne“). Uživatel tedy sever
najde, klikne a dostane profil s jízdou vpravo. Oprava do doby, než bude sever vlastním státem: `leftHand` podle
polohy (celý ostrov podle rámečku), nebo sever z výsledků hledání vyřadit a řezy tam nenabízet.

### 8. Odhad stání na jednosměrce stojí u pravé obruby

`derive.js:709`: strany se zkoušejí v pořadí R, L. Jednosměrka 5–6,9 m dostane jediný odhadnutý pás vpravo po směru
(ověřeno: `↑pruh 3 | parkovani?`). `NORMS.md` B3 cituje Kodex (kan. 58(9) ii): nestát „na opačné straně, než je směr
jízdy“, tedy při jízdě vlevo u levé obruby; otázka 3 pro Báru zůstala otevřená a kód ji mlčky rozhodl opačně.
Odhad není díl z dat, pravidlo „nepřesouvat“ se na něj nevztahuje. Oprava: při `leftHand` pořadí L, R, nebo na
jednosměrce neodhadovat, dokud Bára nerozhodne.

### 9. Export nemá kredit budov DLS ani britských značek

`city.js:461` (`credit: ""` z `abroad`), `credits.js:34` zná jen „ortofoto © DLS Kypr“. `creditLines` pro Kypr dá
„Data: © přispěvatelé OpenStreetMap (ODbL)“ a případně ortofoto. Vzhled domů přitom určují budovy DLS (CC BY 4.0,
uvedení zdroje je podmínka) a řádek značek nese kresby pod OGL v1.0 („Contains public sector information…“ je
podmínka licence, `NORMS.md` C1). Obojí je jen v patičce stránky (`index.html:136`), v PNG a SVG ne. Slovensko a
Nizozemsko budovy v `credit` mají, Salcburk má klíč pro značky. Oprava: `credit` nebo klíč zdroje „budovy © DLS
(CC BY 4.0)“ a klíč pro značky OGL, když řez nějakou nese.

### 10. Normy: červené minimum z doporučení, text slibuje víc, než kód hlídá

- `CY.js:14` chodník `min: 2` (červeně) z příručky, která se sama nazývá „guide to good practice only“, je nedatovaná
  a cituje britské podklady do roku 1989 (`NORMS.md`, Platnost). Tatáž příručka dává pěší cestě 1,2 m (10.2.6).
  Červená má být podle CLAUDE.md pro minima, oranžová pro základní šířky; tady je minimum doporučení pro nové ulice.
  Návrh: `min: 0` nebo 1,2, základ 2.
- `CY.js:16`: „v protisměru 2 m“ je v textu, ale `limitsCY` protisměrný cyklopruh nerozliší (vždy 1,5).
- `CY.js:18`: „obousměrná 3 m“ je v textu, hlídá se jen 2 m.
- `CY.js:24`: „3,5 m u sběrných“ je v textu, `roadClassFromOsm: true` je nastavené, ale třída se nepoužije.
- `city.js:462`: „Šířky podle kyperských předpisů:“; žádný předpis v tom není, jen příručka. Malta má poctivější
  „předpisů a doporučení“.
- `halfKerbNote` cituje čl. 58 předpisu 66/1984 jako platné znění; `NORMS.md` přiznává, že četl původní znění z roku
  1984 a odst. 9 zná jen z Kodexu (2. ruka). V textu pro uživatele to nezazní.

### 11. Měření přesnosti není zapsané a je malé

Commit `48db470`: 11 řezů v 5 městech, složení 56 %, **šířka do 2 m jen 27 %**. `evaluation/universal/REPORT.md`
o Kypru nemá ani řádek, `evaluation/cyprus/REPORT.md` neexistuje, jsou jen `results/u-cy-1.jsonl` a poznámka
v `docs/backlog.md:51` („chybí chodník 9×, stání 5×“). Směry pruhů měření nehodnotí vůbec, takže jízdu vlevo
neověřilo nic kromě jednoho testu pomocné funkce. Oprava: zpráva s tabulkou a s příčinou šířky 27 %.

### 12. Testy netestují to, co tvrdí

- `tests/derive.test.js:26–40` zkouší `mirrorLeftHand` na třech ručně složených pruzích. Žádný test neprojde
  `deriveProfile` s `leftHand`; nálezy 1, 2, 3 a 5 proto prošly.
- `tests/cyprus.test.js:44`: bod není Pyla (nález 6).
- `tests/cyprus.test.js:24–29` ověřuje jen, že soubor značky existuje, ne že klíč vede na správnou značku.

## Drobné

13. `signs-CY` c10a: `CY.js:38–46` nečte `s.walk`; Kodex má podle `NORMS.md` C2 obě podoby (kolo vlevo i vpravo),
    aplikace má jednu (UK 957, chodci vpravo). Bářino pravidlo z 15. 11. (chodci na své straně) tu neplatí.
14. Jednosměrka s cyklisty v protisměru kreslí holý zákaz vjezdu (`CY.js:40`); značka pak říká opak toho, co profil
    (cyklisté ↓). Otázka 4 v `NORMS.md` je bez odpovědi. Čistší je značku v tom případě nekreslit.
15. Pěší zóna (ip27a) i stezka pro chodce (c7a) jsou táž modrá kruhová „povinná pěší cesta“ s popiskem „Pěší zóna“;
    plošnou značku Kypr nemá. Je to zapsané, ale popisek značky neodpovídá.
16. `towns/cyprus.js:28` žádá `ROOF_TYPE`, `dlsBuilding` ho nepoužije (`roof: 0` vždy); komentář v hlavičce slibuje
    „floors, roof and type“.
17. `lanes-ortho.js:306`: „cy“ není v seznamu zdrojů s kontrolou prázdného obrazu. Chybějící dlaždice (404 u Zelené
    linie) zůstanou průhledně černé, jas 0 místo NaN; `usable()` odmítne jen celý prázdný obraz, napůl prázdný ne.
18. `streetmix.js` neposílá `leftHandTraffic` (tlačítko je vyndané, převod s testy zůstává).
19. Britské základny Akrotiri a Dhekelia jsou „cyprus“ s `country` CY: hlášky citují kyperský předpis 66/1984 a
    hlavička říká „na Kypru“, základny mají vlastní právní řád a nejsou v EU. V logu řezů budou jako CY.
20. `CY.js:69–70` `besidePassport`, `besideMax`, `wideStreets` jsou převzaté z jiných států; Kypr žádný pasport nemá.

## Podezření (neověřeno)

- `lanes:bus` na jednosměrce se počítá „od pravé obruby“ (`derive.js:904–905`); při jízdě vlevo je pruh BUS vlevo
  (`NORMS.md` A3: „nearside“).
- Žluté čáry u obrub (zákaz stání, `NORMS.md` B3) může měření z ortofota číst jako vodicí čáry a kreslit úzké
  krajnice. Na vzorku jsem to nezkoušel.
- Hranice je zjednodušená na 0,0003° (asi 30 m, `tools/build_states.mjs:15`). V Nikósii se původní a zjednodušený
  polygon liší na ploše asi 6 ha; ulice těsně u linie mohou padnout na špatnou stranu. Čtyři body u Ledry vyšly
  shodně.
- Balík OSM `cy` je jen na R2 (`tools/countries.mjs:52`, `pages: false`); jestli ho workflow před nasazením postaví
  sám, jsem neověřoval (u Švýcarska se musel spustit ručně).

## Bez nálezu

- Licence souborů značek na Commons souhlasí se `signs-licence.json` (616, 652, 801, 957, 959.1, 960 OGL v1.0;
  619 a kyperské Gigillo83 public domain; vídeňské public domain).
- Kresby odpovídají klíčům: b28 = 642, b29 = 636, b11 = auto a motocykl, dálnice zelená, obytná zóna E 17a.
- CSP: `eservices.dls.moi.gov.cy` v `img-src` i `connect-src`, `photon.komoot.io` v `connect-src`.
- Dotaz na budovy DLS funguje (`distance` v metrech s `inSR=4326`), prázdná odpověď i `?dls=0` vrací `{}`.
- Překlady nových textů jsou ve všech jazycích (`tests/i18n.test.js` prošel).
- Enklávy v Dhekelii (Xylotymbou, Ormideia) vycházejí jako „cyprus“, Varosha a Kyrenia jako „cizina“.

## Verdikt

Nenasazovat. Balík zdrojů a značek je poctivě zdokumentovaný, ale hlavní věc, kterou Kypr přinesl, jízda vlevo, je
hotová jen pro nejjednodušší případ (jedna obousměrná osa bez značení po pruzích). Řadicí pruhy, pruhy BUS podle
pruhů, třídy se dvěma osami, dělené silnice a pruh rozdělený po měření z ortofota vycházejí jako při jízdě vpravo
nebo zrcadlově špatně (nálezy 1, 2, 3, 5) a žádný test ani měření to nehlídá. Před nasazením opravit 1–3 a 5
s testy přes `deriveProfile`, srovnat README a test s tím, kde hranice opravdu vede (6), a rozhodnout ortofoto (4).
