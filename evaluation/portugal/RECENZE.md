# Nepřátelská recenze státu Portugalsko (PT), 23. 11. 2026

Rozsah: `countries/PT.js`, `towns/portugal.js`, `signs-PT/`, `evaluation/portugal/`, části `lanes-ortho.js`, `app.js`,
`signs.js`, `credits.js`, `search-photon.js`, `index.html`, `city.js`, `tools/countries.mjs`, `tools/build_staty.mjs`,
`tests/portugal.test.js`, `LICENCE-A-ZDROJE.md`, `pilot/README.md`. Větev `estonia`, HEAD `84140de`. Žádný soubor kromě
této zprávy jsem neměnil.

Co jsem ověřil:
- `npm test` prošel (353 testů, 0 chyb).
- `deriveProfile` na umělých ulicích (odhad stání: obousměrka od 8 m, jednosměrka od 5 a 7 m, pruhy po 3 m, jako v Česku).
- `cityAt` na 38 místech na pobřeží a u hranic a na všech 37 496 úsecích ulic lokálního balíku `pt-novy.posm`.
- `cleanCut` pro Lisabon, Porto, Funchal, Flores s klíči `orthoCity: "pt-25" | "pt-21" | "pt-18" | "pt-sat"` (projdou,
  kredit „ortofoto © DGT“ mají všechny čtyři, `credits.js:33,41–43`).
- Vykreslení všech 35 SVG ze `signs-PT/` a porovnání s mapováním v `PT.js`.
- CSP: `cartografia.dgterritorio.gov.pt`, `ortos.dgterritorio.gov.pt` a `photon.komoot.io` jsou v `connect-src`, první
  dva i v `img-src`.
- Geofabrik: `europe/portugal/portugal-latest.osm.pbf` existuje (hlavička).

Co jsem neověřil: texty Código da Estrada, DL 163/2006, RST a sešitů IMT/LNEC v primárních zdrojích (jen proti
`NORMY.md`; čl. 49 a 50 CE odpovídají tomu, co znám), služby DGT živým dotazem, obrázky značek proti přílohám RST,
chování v prohlížeči, stavbu balíku `pt`.

Bez nálezu:
- Hranice na pevnině (Valença/Tui, Elvas/Badajoz, Vila Real de Santo António/Ayamonte, Chaves/Verín, Caminha) a ostrovy
  (Funchal, Porto Santo, Ponta Delgada, Vila do Porto, Horta, Flores, Corvo) vyšly správně.
- `PT.bounds` pokrývá pevninu, Madeiru a Azory; neobydlené Selvagens (30° s. š.) ne, bez významu.
- Čísla značek C1, C2, C3g, C3l, C4a, C13, C15, C16, D6, D7a/b/e/f, H1a, H3, H24, H25 odpovídají významům RST, jak je
  znám; H46 pro obytnou i sdílenou zónu a G5a pro pěší zónu jsou Bářina rozhodnutí.
- Zákon o stání: čtení čl. 50/1 a) jako „3 m na směr“ je zapsané jako výklad a Bárou potvrzené.

## Ověřené nálezy

### 1. Lisabonské nábřeží a další pobřežní ulice padají do „ciziny“ (závažné)

Hranice GISCO 1 : 1 M zjednodušená na 30 m (`tools/build_staty.mjs:93`) řeže břeh Teja a přístavy. Z 37 496 úseků ulic
lokálního balíku jich `cityAt` dá 69 do `cizina`: Cais do Sodré, Avenida da Ribeira das Naus, Campo das Cebolas, Rua
da Alfândega, Rua Cais de Santarém, Rua do Terreiro do Trigo, Avenida Infante Dom Henrique (Lisabon), Avenida Sá
Carneiro a Rotunda Harvey Foster (Funchal), Parque Urbano de Albarquel (Setúbal). Řez tam nemá portugalské normy,
značky ani ortofoto DGT. `tests/portugal.test.js` zkouší jen pět středů měst a žádné nábřeží.

Náprava: hranice z CAOP (DGT, OGC API `municipios`, CC BY; `ZDROJE.md` odst. 4 ji má ověřenou), nebo ring rozšířit do
moře o 200–300 m. Test s Cais do Sodré.

### 2. Tři vrstvy ortofota přes sebe a dotazy na ostrovy, kde DGT nic nemá (střední)

- `app.js:337–339`: mapa vrství `pt-sat`, `pt-18` a `pt-25`, každou jako WMS PNG pro každou dlaždici. Podle `ZDROJE.md`
  (1a) pokrývá let 2025 celou pevninu, takže dvě spodní vrstvy jsou trojnásobná zátěž serverů DGT bez užitku. Pravidlo
  projektu je služby šetřit.
- Stejné tři vrstvy mají `bounds` celého státu, tedy i Madeiru a Azory, kde DGT podle `ZDROJE.md` (1b) nemá nic: každá
  dlaždice tam znamená tři prázdné dotazy.
- `lanes-ortho.js:229–238`: řez na Madeiře nebo Azorech zkusí postupně čtyři služby (`pt-25`, `pt-21`, `pt-18`,
  `pt-sat`), všechny vrátí bílý obrázek. Čtyři zbytečné dotazy na řez a čekání až do společného limitu.
- Text města (`city.js:481`: „ortofota DGT a OSM“) na ostrovech neplatí, profil je tam jen z OSM. Ve vzorku měření
  jsou čtyři řezy z Funchalu, tedy bez ortofota, a výsledek (63 %) to neodlišuje.

Náprava: v mapě jen `pt-25` (starší až při chybě), `laneOrtho` a vrstvy omezit obdélníkem pevniny (−9,6 až −6,1;
36,9 až 42,2), na ostrovech říct „jen OSM“.

### 3. Značky pod CC BY-SA bez uvedení autora (střední)

Podle `signs-licence.json` je 11 z 35 souborů pod CC BY-SA: C2 (CC BY-SA 3.0, Fry1989), C3g, C4a, C15, C16, D6, D7a, H24,
H25, M12a, M12b (CC BY-SA 4.0, Gigillo83), a složená `C1-plus-10e.svg` z C3g vychází. Patička (`index.html:134`) píše
jen „dopravní značky Wikimedia Commons (úřední díla)“. U Estonska se autor překreslení pod CC BY-SA v patičce uvádí
(`index.html:139`). Právní opora je navíc slabší, než `signs-PT/README.md` tvrdí: čl. 8 odst. 1 CDADC mluví o
„textos compilados ou anotados“, o obrázcích ne, a `NORMY.md` (C1) to sama označuje za vlastní výklad a upozorňuje na
čl. 8 odst. 2. README to podává jako hotovou věc.

Náprava: autory uvést v patičce jako u Estonska, nebo dotčených 11 značek překreslit z veřejných (PD) souborů téže
série. V README napsat „podle našeho výkladu“.

### 4. Buspruh: červené minimum 3 m je francouzský údaj z druhé ruky a text to neříká (střední)

`PT.js:21`: `min: 3`, text „nejméně 3 m (IMT, příručka Lisabonu)“. Podle `NORMY.md` A3 je 3,0 m z [F2] kap. 5, obr. 5.1,
kde IMT cituje CEREMA 2016 („a largura frequente em França“), povaha „DOP stát, 2. ruka (francouzský zdroj)“. Lisabon
dává 3,25 m. Pravidlo projektu: údaje z druhé ruky označit. Totéž `bus_cyklo` (`PT.js:23`): `min: 3.25` s textem
„nejméně“, ale [F3] říká „doporučeno 3,25 m“ a zároveň že společný pruh „não é recomendável“; „nejméně 3,25“ je jen
z příručky města.

Náprava: u buspruhu bez červené hranice (`min: 0`) nebo text „podle IMT, který cituje francouzskou CEREMA“; u
`bus_cyklo` uvést jako zdroj minima Lisabon.

### 5. Balík OSM na R2 není, texty stát už slibují; větev je za `main` (střední)

`data.streetspace.eu/osm/index.json` 23. 11. balík `pt` nemá. `app.js:475`, `app.js:1007` a `index.html:7,12` Portugalsko
jmenují mezi pokrytými státy. `origin/main` má navíc commit `a941dbd` („No word yet of the states whose OSM tiles are
not on R2“), který takové texty vrátil; tato větev ho neobsahuje (6 commitů za `main`).

Náprava: při slučování texty podle `a941dbd`; workflow „OSM tiles“ ručně se `states: pt` a ověřit `index.json`.

### 6. Záznam řezů zahodí polohu všech portugalských řezů (střední)

`logging/worker.js:48`: `num(e.lat, 45.5, 55.5), num(e.lon, 5.5, 23)`. Portugalsko je celé mimo. Náprava: meze podle
`countries/<ISO>.js bounds`; nasadit musí Bára.

### 7. Nadpis pravidel říká „podle portugalských předpisů“, většina čísel jsou doporučení (drobné)

`city.js:481`: „Šířky podle portugalských předpisů:“. Závazný je jen chodník (DL 163/2006); cyklo, pruhy, buspruh a
stání jsou z dokumentů IMT/LNEC (samy o sobě „DOP stát“, čísla převzatá z CROW, AASHTO, CEREMA) a z příručky Lisabonu
(`NORMY.md` „Otevřené zdroje“). Španělsko a Malta mají „předpisů a doporučení“.

### 8. Cyklopruh vedle stání: text s jiným číslem než zdroj, a nehlídá se (drobné)

`PT.js:17`: „vedle podélného stání 2,5 m (IMT, příručka Lisabonu)“. `NORMY.md` A2: IMT nejméně 2,2 m, doporučeno 2,5 m;
Lisabon neříká 2,5 m, ale odstup 0,70 m (nejméně 0,50). Kód sousední stání nezkoumá (česká pravidla ano), varování
vyjde z 1,2 / 1,5 m i vedle stání.

### 9. Nepoužité soubory a zastaralé komentáře (drobné)

- `signs-PT/M12a.svg`, `M12b.svg` a `G4-40.svg` aplikace nekreslí (`PT.js:82`: `plate: () => null`), README je přitom
  uvádí u `ip11a` jako dodatkové tabulky kolmého a šikmého stání. M12a a M12b jsou navíc dva z CC BY-SA souborů.
- `towns/portugal.js:2–3`: „the aerial of 2021, else 2018, else the satellite mosaic of 2023“, kód začíná letem 2025.
- `pilot/README.md:272`: pořadí „2025, 2021, 2018, satelit“ platí pro pruhy; mapa má jiné (sat, 2018, 2025, bez 2021).

### 10. Testy a měření (drobné)

- `tests/portugal.test.js` ověřuje jen existenci souborů značek, jeden limit (chodník) a pět středů měst. Netestuje
  řetěz ortofot (bílý obrázek → další), limity cyklo, bus a stání, ani žádné místo na břehu.
- Univerzální měření (29 řezů, 63 %) je jen v `vysledky/u-pt-*.jsonl` a ve zprávě commitu; `evaluation/universal/ZPRAVA.md`
  ani `evaluation/portugal/` zprávu nemají. Azory ve vzorku nejsou.
- Hledání: Portugalsko nemá obdobu `looksSpanish`; portugalský dotaz zadaný nad jiným státem nic nenajde, a slova
  „avenida“ nebo „camino“ pošlou dotaz španělskému CartoCiudad (`search-es.js:9`).

## Podezření (neověřeno)

- Código da Estrada je čtený v neúřední kompilaci k 8. 1. 2023 a Lei 24/2025; změny po roce 2025 `NORMY.md` neověřila.
  `halfKerbNote` cituje čl. 49/1 f) a čl. 50 jako platné dnes.
- Kresby G4a (odvozená z G4-40), `C1-plus-10e` (složená) a H46 (Commons, vlastní dílo 2022; pracovní název souboru
  v SVG je „H44a“) jsem s přílohami Decreto Regulamentar 6/2019 neporovnal. Číslice C13 jsou Arial, ne úřední písmo.
- Pruh 3,0 m jako oranžová hranice bude svítit skoro v každé místní ulici (IMT sám připouští 2,75 m, Lisabon 2,75 m při
  malém provozu). U Estonska se kvůli tomu základ snížil na 2,75 m.
- Kredit „© DGT“: přesné znění, které DGT žádá, `ZDROJE.md` neověřila.

## Verdikt

Portugalsko je z trojice nejčistší: zákon o stání je čtený opatrně, kredity ortofot jsou úplné, hranice na pevnině
sedí. Před nasazením je třeba opravit pobřeží (nález 1: centrum Lisabonu u řeky není Portugalsko), přestat posílat
DGT trojnásobek dotazů a dotazy na ostrovy (2) a vyřešit CC BY-SA u značek (3). Počet: závažné 1, střední 5, drobné 4.
