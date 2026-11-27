# Dopravní značky Slovenska (SK) pro řadu pod profilem

Sada patří **státu Slovensko (SK)**, ne jazyku: je to ikonografie dopravních značek státu SK podle vyhlášky
č. 30/2020 Z. z. (vykonávacia vyhláška k zákonu o cestnej premávke, ve znění k 1. 3. 2024), přílohy
„Regulačné značky“ (2xx), „Informačné značky“ (3xx), „Dodatkové tabuľky“ (5xx) a „Symboly“. Značky se vybírají
podle státu místa řezu (SK), texty a názvy v aplikaci podle jazyka (cs, sk, en); tyto dvě věci se nemíchají.

Konvence jako u české sady `../signs-CZ/`: ikony zjednodušené pro velikost asi 40 px, každá značka jeden SVG soubor do
4 kB (4096 bajtů) bez metadat. Kulaté značky `viewBox 0 0 100 100`, čtvercové značky také 100 × 100, parkovací značka
273 má 100 × 150 (poměr 2 : 3 jako vzor), obytná zóna 150 × 100, dodatkové tabulky 150 × 110, 150 × 85 a 150 × 75
podle vzoru. Soubor se jmenuje podle slovenského čísla značky (`253-50.svg`); číslo za pomlčkou je varianta
(rychlost, způsob stání), jak ji používá i slovenská sbírka na Wikimedia Commons.

Barvy: modrá `#005a8c`, zelená `#1e8f2d`, červená `#c80014`, jedna krémově bílá `#f2f0e8` pro všechno bílé (okraj
kulatých i čtvercových značek, bílá pole, piktogramy na modré, tabulky), podle vyobrazení v příloze. Všechny značky
mají krémový okraj s šedým vlasovým obrysem `#8a8d8f` zvenku (kulaté, čtvercové modré a zelené stejně); značky
s černým rámem (zóny, tabulky) mají rám uvnitř krémového pole. Slovenská modrá je světlejší než česká `#004182`.

## Licence

- **Vzory značek** jsou přílohou vyhlášky 30/2020 Z. z., tedy součástí textu právního předpisu. Podle § 5 písm. b)
  autorského zákona 185/2015 Z. z. („Za predmet autorského práva sa nepovažuje … text právneho predpisu, úradné
  rozhodnutie alebo súdne rozhodnutie, technická norma, ako aj spolu s nimi vytvorená prípravná dokumentácia a ich
  preklad“) nejsou předmětem autorského práva. Použití je volné. Znění ověřeno na slov-lex.sk
  (https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/185/, časová verze účinná od 1. 1. 2025 do
  31. 8. 2026). Pozor: v původním zadání stálo „§ 5 písm. a)“; to je ale výjimka pro myšlenku, metodu či informaci.
  Pro značky platí písm. b) (text právního předpisu); písm. a) lze uvést jen jako doplňující argument.
- **Piktogramy** (jízdní kolo, chodec, žena s dítětem, autobus, osobní auto zepředu, motocykl, osoba na vozíku a čtyři
  symboly stání na chodníku) jsou překreslené podle přílohy „Symboly“ vyhlášky 30/2020 Z. z. (symboly 1, 4, 7, 9, 10,
  27 a symboly parkování na chodníku): úřední dílo, součást textu právního předpisu, podle § 5 písm. b) zákona
  185/2015 Z. z. není předmětem autorského práva. Obrysy jsem převedl z vyobrazení v příloze (vektorová stopa
  rastrů 188 × 188 px, vyhlazená a zjednodušená), ne z české sady. Totéž platí pro obytnou zónu 315 (stopa
  vyobrazení z přílohy „Informačné značky“); dálnice 309 je nakreslená ručně podle změřených vrcholů vyobrazení,
  311 používá symbol osobního auta.
- **Soubory Wikimedia Commons** `273-55`, `273-65`, `273-75` a `273-85 Parkovanie na chodníku (…).svg`
  (https://commons.wikimedia.org/wiki/Category:SVG_parking_road_signs_of_Slovakia) jsem stáhl (jednou, s
  `User-Agent: ProfilyUlic/1.0 (research)`) a použil **jen jako vizuální předlohu** (poloha a sklon auta na
  obrubě). Licence všech čtyř: Public domain, autor Ministerstvo dopravy a výstavby SR. Žádná geometrie z nich
  se nekopíruje; auta a podklad jsou z vyobrazení symbolů v příloze (viz výše). Ostatní značky jsem z Commons nestahoval, jako předloha
  sloužily obrázky přímo z příloh vyhlášky (PDF ze slov-lex.sk).
- **Vše ostatní** (rámy, číslice, šipky, písmeno P, zónové tabulky, texty tabulek) je nakresleno nově podle vzorů
  vyhlášky nebo odvozeno z české sady a patří k projektu pod licencí MIT (© Bára Soukupová), stejně jako kód.

Vzor: vyhláška 30/2020 Z. z., přílohy; https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2020/30/

## Šablony (pro kód)

- `253.svg`: šablona, číslo v `<text id="v">` (jako `../signs-CZ/B20a.svg`; kód aplikace ve `profile.js`,
  `loadSignFile`, přepíše obsah prvku `<text id="v">`, ten zůstal). Číslice je jediný text, který není křivkami,
  protože se dosazuje za běhu; písmo `DIN 1451 Mittelschrift`, náhradou `Avenir Next Condensed`, `Arial Narrow`.
  `253-10` … `253-130` mají číslice jako křivky (obrysy písma Avenir Next Condensed Medium, vodorovně stažené u tří číslic).
- `except-access.svg`: text v `<text id="t">` (výchozí „dopravnej obsluhy“, zůstává textem, protože se mění), nad ním
  „okrem“ jako křivky. Pro jiný text výjimky (např. „zásobovanie“, „vozidiel stavby“) se přepíše jen `t`.
- Všechny ostatní nápisy (ZÓNA, pešia zóna, bicyklová cesta, voľno, okrem, vyhradené parkovanie) a číslice jsou
  obrysy písmen (`<path>`), nezávisí na písmech uživatele. Zdroj obrysů: Avenir Next Condensed Medium (macOS),
  užší a lehčí než předloha DIN; „ľ“ je l s apostrofem vpravo nahoře složené ručně. Soubory s křivkami jsou
  do 4 kB, s tou výjimkou, že nic nepřekračuje 4096 bajtů.

## Soubory

Sloupec „naše značka“ je klíč české podoby v aplikaci (typ značky podle `signs.js`).

| Naše značka (klíč) | Číslo a název SK | Soubor |
|---|---|---|
| b1 zákaz vjezdu všech vozidel v obou směrech | 231 Zákaz vjazdu pre všetky vozidlá | `231.svg` |
| b2 zákaz vjezdu všech vozidel (jednosměrka viděná od výjezdu) | 230 Zákaz vjazdu | `230.svg` |
| b11 zákaz vjezdu motorových vozidel | 232 Zákaz vjazdu pre všetky motorové vozidlá | `232.svg` |
| b8 zákaz vjezdu jízdních kol | 233-58 Zákaz vjazdu pre bicykle | `233-58.svg` |
| b30 zákaz vstupu chodců | 233-60 Zákaz vstupu pre chodcov | `233-60.svg` |
| b20a omezení rychlosti (10 až 130 po desítkách) | 253 Najvyššia dovolená rýchlosť | `253-10.svg` … `253-130.svg`, šablona `253.svg` |
| b28 zákaz zastavení | 270 Zákaz zastavenia | `270.svg` |
| b29 zákaz stání | 271 Zákaz státia | `271.svg` |
| ip4b jednosměrka (viděná podél) | 321-30 Jednosmerná cesta (priamo) | `321-30.svg` |
| c8a stezka pro cyklisty | 221 Cyklistická komunikácia | `221.svg` |
| c7a stezka pro chodce | 220 Cestička pre chodcov | `220.svg` |
| c9a stezka pro chodce a cyklisty společná | 222 Spoločná cestička pre chodcov a cyklistov | `222.svg` |
| c10a stezka pro chodce a cyklisty dělená (cyklisté vpravo) | 223-51 Oddelená cestička pre chodcov a cyklistov (cyklisti vpravo) | `223-51.svg` |
| ip11a parkoviště | 272 Parkovanie | `272.svg` |
| ip11g stání částečně na chodníku, podélné | 273-55 Parkovanie na chodníku čiastočne (pozdĺžne) | `273-55.svg` |
| ip11e stání na chodníku, podélné | 273-65 Parkovanie na chodníku úplne (pozdĺžne) | `273-65.svg` |
| ip11f stání částečně na chodníku, kolmé/šikmé | 273-75 Parkovanie na chodníku priečne čiastočne | `273-75.svg` |
| ip11d stání na chodníku, kolmé/šikmé | 273-85 Parkovanie na chodníku priečne úplne | `273-85.svg` |
| iz1a dálnice | 309 Diaľnica | `309.svg` |
| iz2a silnice pro motorová vozidla | 311 Cesta pre motorové vozidlá | `311.svg` |
| ip20a vyhrazený pruh (bus) | 224 Vyhradený pruh pre verejnú dopravu | `224.svg` |
| iz8a-30 zóna 30 | 268 Zóna najvyššej dovolenej rýchlosti (30) | `268-30.svg` |
| iz5a obytná zóna | 315 Obytná zóna | `315.svg` |
| iz6a pěší zóna | 317 Pešia zóna | `317.svg` |
| iz9a zóna pro cyklisty (nejbližší) | 323 Bicyklová cesta | `323.svg` |
| iz8a-zakaz-stani zóna zákazu stání | 275 Zóna zákazu státia | `275.svg` |
| iz8a-placene-stani / zóna stání (nejbližší) | 277 Parkovacia zóna | `277.svg` |
| e12a jízda cyklistů v protisměru (pod ip4) | 514 Obojsmerná jazda cyklistov (pod 321) | `514.svg` |
| e12b vjezd cyklistů v protisměru povolen (pod b2) | 507 Neplatí pre: bicykle (pod 230) | `507-bicycle.svg` |
| e12 jízdní kola povolena (pod iz6a a ip20a) | 515 Voľno: bicykle (pod 317 a pod 224) | `515-bicycle.svg` |
| ip12 vyhrazené parkoviště (text) | 531 Vyhradené parkovanie (pod 270) | `531.svg` |
| ip12-ztp / o1 osoba na vozíku | symbol 27 (osoby so zdravotným postihnutím) na tabulce pod 272 | `disabled.svg` |
| výjimka „dopravní obsluha“ (iz6a text) | 507 Neplatí pre + nápis „okrem dopravnej obsluhy“ | `except-access.svg` |

## Poznámky

- **Přečíslování oproti české sadě**: Slovensko značí zákaz zastavení X jako 270 a zákaz státia jedním pruhem jako 271,
  zákaz vjezdu všech vozidel v obou směrech je 231, jednosměrná silnice (zákaz vjezdu z druhé strany) 230.
  Jednosměrka 321 je ve vzoru vodorovná šipka a svislý čtverec (321-30 „priamo“; 321-10 vlevo, 321-20 vpravo se nedělaly).
- **Stání na chodníku**: v příloze (bod 48) je 273 „Parkovanie na chodníku“; číslo za pomlčkou určuje, zda auto stojí
  částečně (-5x) či úplně (-6x) na chodníku a zda podélně (auto zezadu, -55, -65) či příčně (auto z boku, -75, -85).
  Kreslí se varianty bez šipek začátku a konce platnosti; auto stojí s podkladem a obrubou přesně podle symbolů v příloze (zrcadlově pro stání vlevo).
  Pod 272 a 273 patří dodatková tabulka se symbolem osoby se zdravotním postižením (`disabled.svg`), kterou se z místa dělá
  vyhrazené parkování pro držitele parkovacího preukazu (příloha, bod 47).
- **Dodatkové tabuľky**: 514 patří výslovně pod 321 (Jednosmerná cesta), 515 „Voľno“ pod značku označující
  speciální cestičku nebo pruh (221 až 224) a pod 317 Pešia zóna (příloha, bod 6 tabulek). Tabulka 507 „Neplatí pre“
  vyjímá z platnosti značky zde vyznačené účastníky provozu.
- **Dopravní obsluha**: příloha výslovně říká (společně k dodatkovým tabuľkám, bod 2 a 4), že účastníci provozu se na
  tabulce vyznačují symbolem, vhodným nápisem („okrem vozidiel stavby“ …) nebo jejich kombinací a že „dopravná obsluha“
  je definovaný pojem (zásobování, vozidla s parkovacím preukazem, autobusy s dětmi, vozidla s bydlištěm/sídlem/garáží
  za značkou, servis). Vyobrazení 507 je „okrem“ nad symbolem, proto `except-access.svg` používá stejnou stavbu „okrem“ +
  nápis. 509 Spresňujúce informácie se používá pro podrobnější charakteristiku a pro text v jiném než státním jazyce,
  ne pro výjimku z platnosti.
- **531 Vyhradené parkovanie** příloha řadí k Zákazu zastavenia (270): umožňuje stát jen na vyhrazeném místě.
- Rozměry tabulek jsou odhad z vyobrazení, v praxi se značky zobrazují ve výšce asi 40 px.
