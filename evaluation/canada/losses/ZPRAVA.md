# Prohrané případy pěti pravidel Severní Ameriky (26. 11. 2026)

Bára 26. 11. 2026: „stálo by za podrobnější analýzu těch případů, kdy to zhoršují“. Pravidla zůstávají zapnutá, **kód aplikace
se neměnil**. Rozebrané jsou všechny prohrané dvojice druhé nepřátelské recenze (`../review/results/score.md`) a nerozhodné
dvojice, kde jeden posuzovatel hlasoval proti pravidlu (1 : 1), u domů všechny, kde je výška dál od fotky.

## Jak

- `cases.mjs`: hlasy, oba profily a zdůvodnění posuzovatelů z `../review/results/*.jsonl` a `key.json`.
- **Přepočet obou variant** v aplikaci (lokální server, `?osm=balik`, stejný sběr jako `evaluation/usa/collect.js`, 40 řezů × 2
  varianty, `evaluation/universal/data/na-losses-recut.json`): **74 z 80 profilů je beze změny** proti posuzovaným. Šest se liší
  jen tím, že dnešní kód profil na konci protáhne k další vozovce (ddot-29, ddot-40, ddot-56) a u ddot-40 s pravidlem kreslí
  místo dvou pruhů po 2,2 m jeden pruh 4,4 m (pozdější úprava úzkých pruhů). Rozbor tedy platí pro dnešní kód.
- `runs.mjs`: díly mapy podél řezu (Planimetrics / mapa Toronta) s pravidlem a bez něj, u Washingtonu i čáry inventáře DDOT
  (SubBlock), které řez kříží, s polohou `t` (m od středu, A záporně), počtem pruhů, stáním a cyklopruhy; u Toronta polohy
  cyklostezek z OSM proti okrajům vozovky. Dotazy na služby měst jednou, s pauzou, v `data/cache` (git je ignoruje).
- `ddot-table.mjs`: všech 45 posuzovaných dvojic DDOT s odstupem od nejbližší křižovatky nebo přechodu (polygony Planimetrics),
  počtem pruhů stání v inventáři a kolik se jich do vozovky vešlo – aby šlo poznat, jestli navržená podmínka nerozbije výhry.
- `osmtags.mjs`: značky cesty řezu a cest, které řez kříží (z balíků OSM).
- `houses.mjs`: výšky budov Toronta (DERIVED_HEIGHT) u 31 změněných domů a posudky fotek.
- Ortofoto a fotky: prohlédnuté ty z balíků posuzovatelů (`../data/review-*`), u každé prohry aspoň jedno.

Příčina: **pravidlo** (chyba v kódu pravidla, s případem, kdy nastává), **data** (inventář, mapa nebo OSM neodpovídá místu),
**posuzovatel** (podklady starší než stav, nebo hlas proti vlastnímu zdůvodnění), **nejde** (nedá se rozhodnout).

## Případy

### Inventář DDOT (Washington, `?ddot=0`): 11 proher, 5 nerozhodných

| dvojice | řez | ulice | hlasy | příčina | důkaz |
|---|---|---|---|---|---|
| ddot-1/3 | ddot-37 | 22nd St NW (tepna) | off, off | **pravidlo**: blok jedné ulice přes dělicí pás na druhou | Řez kříží dvě čáry inventáře: 22nd St (t = 4,7; 2 pruhy, 2 pruhy stání) a Florida Ave (t = −5,3; 3 pruhy, bez stání). `carriageway()` bere obě vozovky i se středním pásem jako jednu, `carveParking` dá stání 22nd St na oba vnější okraje, tedy i na Florida Ave; `blockTags` navíc přepíše OSM `lanes=3` na 2. Posuzovatelé: tři pruhy, bez stání. Řez je navíc v rozvětvení u křižovatky. |
| ddot-2/3 | ddot-40 | Northampton St NW (místní) | off, off | **data**: inventář má stání po obou stranách, na místě je jen na B | Fotka: žlutá středová čára, auta jen u B v celé délce bloku. Vozovka 9,3 m, inventář 2 pruhy + 2 stání. Stejná šířka a čísla jako výhra ddot-62 (31st St NW, auta po obou stranách, bez středové čáry): z inventáře se to rozlišit nedá. |
| ddot-2/10 | ddot-56 | East Capitol St SE, obslužná (místní) | off, off | **data / zrnitost bloku**: stání na správné straně, ale ne u křižovatky | Inventář: obslužná ulice (ROADTYPE 2), 1 pruh stání; dáno na B. Fotka: auto stojí u B dál od řezu, u řezu (8 m od křižovatky) volno. |
| ddot-3/4 | ddot-29 | Woodridge St NE (místní) | off, stejne | **pravidlo**: inventář se do vozovky nevejde, strana zvolena naslepo | Jednosměrka 6,9 m, inventář 2 pruhy stání; vejde se jen první pás (`kerbStrip` potřebuje 2,45 + 2,5 m), a ten jde vždy na „lo“ = A. Posuzovatelé: bez stání / stání nahodilé. |
| ddot-4/2 | ddot-53 | I St NW (tepna) | nejde, off | **pravidlo**: jediný pruh stání na straně buspruhu | OSM `bus:lanes=‖designated`, `cycleway:right=share_busway`: buspruh vpravo (B). Bez strany v OSM jde stání na pravou stranu čáry inventáře, tedy taky na B. Posuzovatel b: buspruh u chodníku na B, stání má být na A. |
| ddot-4/5 | ddot-13 | Fort Lincoln Dr NE (sběrná) | off, stejne | **posuzovatel / šum** | Složení stejné, liší se jen cyklopruh 1,83 proti 1,38 m a pruh 3,3 proti 3,75 m; oba s nízkou jistotou. |
| ddot-4/7 | ddot-32 | 49th St SE (místní) | off, off | **nejde** (data nebo prázdná ulice) | Inventář 2 stání, vozovka 10,3 m. Ortofoto i fotka u řezu bez aut, 13 m od přechodu u STOP. Nelze říct, jestli je stání zakázané, nebo jen prázdné. |
| ddot-5/2 | ddot-3 | Kennedy Pl NW (místní) | off, off | **pravidlo**: jako ddot-29 | Vozovka 6,4 m, inventář 2 stání, vešlo se jedno, dané na A. Fotka i ortofoto: auta na B (strana s chodníkem a domy), A je travnatý okraj se sloupky bez obruby. |
| ddot-5/3 | ddot-76 | Saratoga Ave NE (tepna) | off, off | **data / zrnitost bloku**: řez na stop čáře | Ortofoto: řez 4,5 m od přechodu, tři pruhy příjezdu ke křižovatce; fotka: značka „No standing anytime“. Inventář má 1 stání pro celý blok. |
| ddot-5/4 | ddot-43 | Virginia Ave NW, odbočka (tepna) | off, off | **pravidlo**: blok vybraný podle středu řezu, ne podle cesty | Řez cesty `primary_link` (t ≈ −8) je veden středem mezi vozovkami. `blockOf` vybere nejbližší čáru ke středu: hlavní Virginia Ave (t = 2,8; chráněný cyklopruh IB), ne obslužnou část (t = −8,3; 1 pruh, 1 stání). `blockTags` pak dá cyklopruh na odbočku, kde není. |
| ddot-5/5 | ddot-88 | South Carolina Ave SE (sběrná) | off, off | **pravidlo**: stání z inventáře (2 × 2,44 m) vytlačí cyklopruh z OSM | OSM `parking:both`, `cycleway=lane` (obě strany), inventář E St SE: 2 stání po 8 ft a cyklopruhy BD. Z 13,4 m zbude 8,5 m na 2 pruhy a 2 cyklopruhy, `splitRoadway` jeden zahodí. Bez pravidla stání 2 m a oba cyklopruhy, jak to posuzovatelé vidí. |
| ddot-1/5 | ddot-61 | G St SE | def, off | nejde | Vodicí čára ~2 m od obruby (pás pro stání), u řezu nikdo nestojí; posuzovatel b „bez stání“ s vysokou jistotou. |
| ddot-1/7 | ddot-52 | 19th St NW | off, def | nejde | Ortofoto ve stínu domů, fotka z boku; inventář 2 stání, posuzovatel a tipuje 3 pruhy a stání na jedné straně. |
| ddot-1/10 | ddot-7 | I St SE | def, off | nejde | Jedno stání na B, oba posuzovatelé s nízkou jistotou, rozdíl B: stání proti krajnici. |
| ddot-3/8 | ddot-50 | Erie St SE | off, def | nejde (spíš pro pravidlo) | Stání 1 na A (pravá strana čáry); posuzovatel b vidí na A auto u obruby. |
| ddot-4/1 | ddot-79 | 31st St SE | off, def | nejde | Vozovka 8,9 m, stání po obou stranách; jeden vidí auta u obrub, druhý ne. |

### Mezery mezi vozovkami (Toronto, `?off=mapgaps`): 7 proher, 3 nerozhodné

| dvojice | řez | ulice | hlasy | příčina | důkaz |
|---|---|---|---|---|---|
| gaps-1/3 | dual-3 | Markham Rd | off, off | **pravidlo**: travnatý pás jako `delici` | Mezera 2,4 m, ortofoto: suchá tráva jako na zelených pásech u chodníků. |
| gaps-1/8 | dual-28 | Overlea Blvd | off, off | **pravidlo**: jako dual-3 | Mezera 7,8 m, tráva se stromem (oba). |
| gaps-2/1 | dual-7 | Evans Ave | off, off | **pravidlo**: jako dual-3 | Mezera 3,2 m, tráva se stromem. |
| gaps-2/6 | dual-12 | Neilson Rd | off, off | **pravidlo**: jako dual-3 | Mezera 4,5 m, tráva. |
| gaps-2/5 | dual-30 | The Queensway | off, off | **pravidlo**: pásy kolem tramvaje jako `delici` | Bez pravidla mapa ulici nemá (mezera pod středem) a kreslí se odhad z ortofota a OSM se stromořadím. S pravidlem těleso 6,5 m a kolem něj `delici` 1,6 a 3,9 m; na místě tráva se stromy kolem trati. |
| gaps-3/2 | dual-21 | Highway 27 | off, off | **pravidlo**: mezera 19,8 m a 10,2 m za dělicí pás | `GAP_MEDIAN = 30 m`: široká tráva k sousední vozovce (jiná komunikace, rampa) se stane dělicím pásem a profil pokračuje přes ni, s „vymyšlenými pruhy na pustých plochách“. |
| gaps-3/3 | dual-2 | Lake Shore Blvd W | off, stejne | **pravidlo**: jako dual-21 | Mezera přes 21 m k vozovce Gardiner Expressway (rampa) jako `delici` 8,07 m na začátku profilu. |
| gaps-2/2 | dual-4 | Sheppard Ave E | off, def | **posuzovatel** | Posuzovatel a píše „betonový ostrůvek“ a hlasuje pro variantu se zelení: hlas proti vlastnímu zdůvodnění. |
| gaps-2/7 | dual-14 | Leslie St | off, def | **posuzovatel** | Totéž: „úzký betonový střed“, hlas pro zeleň. |
| gaps-2/10 | dual-1 | Finch Ave W | off, def | nejde | Pás 1,4 m, jeden vidí trávu, druhý bílý beton. |

Výhry pravidla (15) jsou skoro všechny betonové ostrůvky 0,9–2,2 m (`delici` proti `zelen`), dual-26 je široký betonový
4,6 m, dual-29 zpevněný 1,2 a 4,4 m.

### Cyklostezky z OSM ve vozovce mapy (Toronto, `?off=roadtracks`): 6 proher, 4 nerozhodné

| dvojice | řez | ulice | hlasy | příčina | důkaz |
|---|---|---|---|---|---|
| tracks-1/1 | track-86 | Eglinton Ave W | off, stejne | **šum** | Obě varianty mají stezky po obou stranách (bez pravidla je dá OSM jinak), liší se šířky 1,8 proti 1,25/1,73 m. |
| tracks-1/4 | track-2 | Alness St | off, off | **posuzovací podklady starší než OSM** | Ortofoto ještě bez stezek, fotka ukazuje stavbu zvýšené stezky (nové obruby, kužely). OSM `cycleway=track` je zřejmě novější stav; posuzovatelé to vědět nemohli. |
| tracks-1/6 | track-26 | Yonge St | off, off | **posuzovatel** (stará fotka) | Fotka před rokem 2021; ortofoto jasně ukazuje oddělený cyklopruh s květináči/sloupky na A a pruh na B. Posuzovatelé se drželi fotky, pokyn přitom říká, že platí ortofoto. |
| tracks-1/10 | track-70 | Finch Ave W | off, off | **pravidlo** (+ zastaralá mapa) | Mapa (2021) má jednu vozovku 20,7 m přes dnešní těleso Line 6 Finch West. Stezka vyříznutá u okraje A (−7,6 až −5,8) přikryje osu cesty řezu (OSM t = −7,3, `lanes=3`); `derive.js` pak vidí ve vozovce jen druhou osu bez `lanes` → `lanesTotal = 1` a kreslí „krajnice 6,6 \| pruh 4 \| krajnice 6,6“. Bez pravidla 4 pruhy. Na místě 2 + 2 pruhy kolem LRT a stezky po obou stranách. |
| tracks-2/7 | track-84 | Bloor St W | off, off | **posuzovatel** (stará fotka), částečně pravidlo | Fotka před přestavbou (2023), ortofoto: cyklopruh u obruby se šrafovaným odstupem a stáním za ním. S pravidlem je stezka na obou stranách (správně), ale na B leží zátoka stání z mapy (704) mezi stezkou a chodníkem: pořadí obráceně. |
| tracks-3/1 | track-64 | Bloor St W | off, off | **data (zrnitost OSM)** | OSM `cycleway:right=track` platí pro celou cestu, u řezu (5 m od přechodu) na B žádná stezka není, jen na A cyklopruh; ortofoto i fotka to potvrzují. |
| tracks-1/7 | track-41 | Scarborough Golf Club Rd | def, off | nejde | Cyklostezky OSM leží přesně na okraji vozovky mapy (−7,5 a 7,7 proti −7,3 a 7,7), nejde poznat, jestli jsou ve staré vozovce, nebo za obrubou. |
| tracks-1/9 | track-53 | Finch Ave W | off, def | **pravidlo + odhad z ortofota** | Mapa vozovku má, ale profil je „odhad z ortofota a OSM“ (obruby z ortofota přeměří vozovku) a stezka vyříznutá u okraje skončí mezi pruhy („pruh \| pruh \| cyklostezka \| pruh \| pruh“). Stejné místo jako track-70 (LRT). |
| tracks-2/8 | track-56 | Steeles Ave E | off, def | **posuzovatel a** (stará fotka) | Zimní fotka bez stezek, ortofoto má řadu sloupků oddělujících cyklopruh na A. |
| tracks-3/4 | track-77 | University Ave | def, off | **posuzovatel b** (spíš) | S pravidlem stezky na obou vnějších okrajích (obě vozovky mají `cycleway:right=track`); b je na B nevidí. |

### Zálivy stání (Toronto, `?off=kerbbays`): 1 prohra, 3 nerozhodné

| dvojice | řez | ulice | hlasy | příčina | důkaz |
|---|---|---|---|---|---|
| bays-1/3 | bay-22 | Dalhousie St | off, off | **nejde** (spíš posun mapy) | Mapa: chodník −6,9 až −5,0, plocha 2,5 m, vozovka. Na ortofotu je asfalt až k −6,9 a auta stojí v pásu −4,5 až −3: zátoka sedí na místo stání, ale posuzovatelé vidí „mezeru mezi obrubou a auty“ (obě nízká jistota). |
| bays-1/5 | bay-33 | Front St W | def, off | nejde | Stání v zálivech proti ploše; posudky protichůdné. |
| bays-1/8 | bay-31 | Lansdowne Ave | def, off | šum | Stejné složení, b jen „celková šířka sedí lépe“ (je stejná). |
| bays-1/9 | bay-11 | Avenue Rd | def, off | **souhra s počtem pruhů** | Záliv na B nahradí stání z OSM `parking:both`, vozovka zůstane o 2 m širší a pruhy z ortofota vyjdou 5 místo 4 (OSM `lanes=4`). |

### Podlaží z výšky (Toronto, `?torontohouse=0`): 7 domů blíž bez výšky

| dům | ulice | fotka | bez / s výškou | výška | příčina |
|---|---|---|---|---|---|
| H08 | Anglesey Blvd | 2 | 2 / 1 | 6,36 m | **pravidlo**: patrový rodinný dům pod 7,15 m vyjde jako přízemní ((h − 2,2) / 3,3) |
| H36 | Dalegrove Cres | 2 | 2 / 1 | 6,79 m | totéž |
| H61 | Queen Victoria St | 2,25 | 2 / 1 | 6,71 m | totéž |
| H14 | Queen St E | 2 | 2 / 3 | 11,02 m | **pravidlo**: dům „bay-and-gable“ se strmým štítem, výška je ke hřebeni |
| H16 | Bloor St W | 2 | 2 / 3 | 10,88 m | totéž |
| H24 | Eglinton Ave W | 2,5 | 2 / 6 | 20,9 m | **pravidlo**: hala (OSM `building=train_station`, stanice Eglinton West) přepočtená na 6 podlaží |
| H12 | Glencairn Ave | 1 | 1 / 2 | 9,5 m | **nejde opravit**: přízemní obchod s vysokou atikou (OSM `retail`) |

Pro porovnání: přízemní domy mají 4,8–5,7 m (H30, H38, H62 výhry, H01 1,5 p.), „jeden a půl“ 6,7–7,0 m (H20, H59). Štítové
domy 10,5–10,9 m mají na fotce 2,5 (H15, H29 stejně), 3,25 (H21 výhra), 12,2 m 2,5 (H68 stejně).

## Vzory a návrhy oprav

Odhady jsou na posuzovaných dvojicích, ne nové měření; každou opravu je potřeba ověřit slepým A/B na čerstvém vzorku.

| # | vzor (pravidlo) | proher | návrh (soubor, funkce, podmínka) | spraví | riziko pro výhry |
|---|---|---|---|---|---|
| 1 | Inventář se do vozovky nevejde (DDOT) | 2 (ddot-3, ddot-29) | `towns/usa.js` `carveParking`: když při `n ≥ 2` `kerbStrip` pro některou stranu vrátí `null`, nevyřezat žádné stání a v `inventory` nevracet `noParkGuess` (blok neodpovídá mapě; platí OSM a zákonný odhad). | 2 → shodné s variantou bez pravidla (dvojice zmizí) | 0 z 19 výher (ve všech se vešly oba pásy; ddot-34 a ddot-51 mají v inventáři 3 a 4 stání a vešly se dva, ty se nemění, když se podmínka váže na `null`, ne na počet) |
| 2 | Blok jedné ulice přes dělicí pás (DDOT) | 1 (ddot-37) | `carveParking` a `blockTags`: leží-li ve vozovce řezu za dělicím pásem čára jiného bloku (jiné `ROUTENAME` nebo opačný směr), platí blok jen pro svou část vozovky (běh 701 mezi mediány, který obsahuje jeho čáru): stání jen na její vnější obrubu, `lanes` jen tehdy, když cesta řezu leží v téže části. | 1 (pravděpodobně na nerozhodně: stání na 22nd St zůstane) | 0: ddot-26 (Bladensburg Rd, jedna čára v pásu) se nemění |
| 3 | Blok podle středu řezu (DDOT) | 1 (ddot-43) | `blockOf(json, c, tags, wayT)`: vzdálenost čáry měřit od místa, kde řez kříží vlastní cestu (`inventory` ji zná jako `way`, poloha přes `parallelsAt([way], c)`), ne od středu; u `*_link` a `service` přednost ROADTYPE 2. | 1 | malé: mění se jen řezy, jejichž střed neleží na vlastní cestě (dvě vozovky); ve vzorku ověřit na ddot-13, 26, 52, 54 |
| 4 | Stání na straně buspruhu (DDOT) | 1 (ddot-53) | `carveParking` (jen `n = 1` bez strany v OSM): vynechat obrubu, kde OSM má buspruh (`bus:lanes`/`lanes:bus` s `designated` na krajním pruhu, `busway:<strana>=lane`, `cycleway:<strana>=share_busway`), dát stání na druhou. | 1 | 0 (jediný řez s buspruhem v DDOT vzorku) |
| 5 | Stání z inventáře vytlačí cyklopruh (DDOT) | 1 (ddot-88) | `carveParking`: šířku pásu zmenšit až na 2,0 m, aby po něm zbylo na pruhy (OSM `lanes` × 3,0 m) a cyklopruhy z OSM nebo inventáře (× 1,5 m). | 1 | 0 (ddot-80 a ddot-90 cyklopruhy obou stran drží i tak) |
| – | Stání v celém bloku, ale ne u rohu (DDOT) | 2–3 (ddot-76, ddot-56, ddot-32) | **neopravovat**: odstup od křižovatky výhry a prohry nerozlišuje (do 5 m: prohry 3, výhry 4: ddot-22, 60, 12, 64). | – | – |
| – | Inventář „obě strany“, na místě jedna (DDOT) | 1 (ddot-40) | **neopravovat** z inventáře: stejná šířka a čísla mají výhry ddot-62, 36, 31, 48, 73 (auta po obou stranách). Šlo by jen podle středové čáry z ortofota (`lanes-ortho.js`), to je samostatný pokus. | – | – |
| 6 | Travnatý dělicí pás jako `delici` (mapgaps) | 5 (dual-3, 28, 7, 12, 30) + nerozhodné dual-1 | `towns/planimetrics.js` `gapsBetweenRoads`: mezeru označit jako dělicí pás s neznámým povrchem a nechat ji ortofotem rozhodnout jako vnější mezery (`ortho-osm.js outerGapsByImage`): zelená → `zelen`/travnatý pás, šedá → `delici`. Pozor na suchou trávu (dual-3 je béžová). Jednodušší, horší varianta: od 3 m šířky zeleň. | ortofotem 4–5; šířkou 3 (dual-28, 7, 12) | ortofotem ~0; šířkou 1–2 (dual-26 4,6 m beton, dual-29 4,4 m) |
| 7 | Široká mezera k jiné vozovce (mapgaps) | 2 (dual-21, dual-2) | `gapsBetweenRoads`: `GAP_MEDIAN` z 30 na 8–10 m, nebo dělicí pás jen mezi vozovkami téže ulice (cesty OSM po obou stranách mezery se stejným `name` nebo `ref`). | 2 | 0 (nejširší vyhraný pás 4,6 m; dual-28 7,8 m řeší bod 6) |
| 8 | Stezka překryje osu vozovky (roadtracks) | 1 (track-70), souvisí track-53 | `towns/planimetrics.js` `osmTracks` / `carveTrack`: nevyřezávat stezku přes osu vozovky ulice (cesta OSM téže ulice, ne `WALKED`, jejíž `t` leží v pásu ± 0,5 m), nebo v `derive.js` brát osy z celé vozovky včetně vyříznutých 703. Dlouhodobě: kolejiště LRT ve vozovce staré mapy vyříznout jako těleso (osy `light_rail` mezi dvěma jednosměrkami téže ulice). | 1 (track-70 na 4 pruhy) | 0 |
| 9 | Zátoka stání mezi stezkou a chodníkem (roadtracks × kerbbays) | 1 částečně (track-84) | `osmTracks`: leží-li u obruby na straně stezky běh 704, vyříznout stezku za ním (stezka u chodníku, stání mezi ní a pruhy). | 0–1 | neznámé, jen jeden případ |
| 10 | Stezka z tagu cesty i u křižovatky (roadtracks) | 1 (track-64) | zatím **neopravovat**: podmínka „ne blíž než X m od polygonu křižovatky mapy“ by se musela ověřit na výhrách s tagem (track-74, 49, 42, 57, 40, 46, 68). | ? | ? |
| 11 | Patrový dům pod 7 m jako přízemní (torontohouse) | 3 (H08, H36, H61) | `towns/canada.js` `floorsOf`: do 8 m hranice mezi 1 a 2 podlažími na 6,0 m (místo 7,15 m). | 3 → stejně (bez výšky také 2) | 0 (přízemní výhry H30, H38, H62 mají 4,8–5,3 m); H20 a H59 (1,5) zůstanou o půl podlaží vedle |
| 12 | Štítový dům 10,5–11 m jako 3 podlaží (torontohouse) | 2 (H14, H16) | `floorsOf` podle vzhledu: u `baygable`/`porchrow` odečíst střechu (asi 3,5 m), nebo kreslit 2 podlaží + obytný štít. | 2 | 1 (H21, 10,86 m, na fotce 3,25) |
| 13 | Hala přepočtená na podlaží (torontohouse) | 1 (H24) | `torontoHouse`: výšku nepoužít u OSM `building` = `train_station`, `transportation`, `warehouse`, `industrial`, `sports_hall`, `hangar` (kostel už má svůj vzhled). | 1 | 0 |
| – | Přízemní obchod s atikou (torontohouse) | 1 (H12) | neopravovat (9,5 m je i dvoupatrový obchod, H70). | – | – |

## Shrnutí po pravidlech

- **DDOT** (11 proher + 5 nerozhodných): chyba pravidla 6 (ddot-3, 29, 37, 43, 53, 88), data nebo zrnitost bloku 3 (ddot-40, 56, 76),
  nejde 1 (ddot-32), šum 1 (ddot-13); nerozhodné všechny „nejde“. Tepny prohrávají kvůli řezům u křižovatek a rozvětvení
  (ddot-37, 43, 53, 76), ne kvůli počtu pruhů v inventáři. Opravy 1–5 by z 11 proher spravily asi **6** a žádnou výhru by neměly
  rozbít (místní 15 : 5 → asi 15 : 3, sběrné 3 : 2 → 3 : 1, tepny 3 : 4 → nejvýš 3 : 1; prohry se změní na shodu nebo výhru).
- **Mezery** (7 + 3): všech 7 proher je chyba pravidla v jedné ze dvou podob: povrch pásu (5) a příliš široká „mezera“ (2).
  Dvě nerozhodné jsou hlasy proti vlastnímu zdůvodnění posuzovatele. Opravy 6 a 7 by spravily **6–7** (s ortofotem), výhry jsou
  skoro všechny úzké betonové ostrůvky.
- **Cyklostezky** (6 + 4): chyba pravidla 1 (track-70, osa pod stezkou) a částečně 1 (track-84), podklady starší než OSM 1, posuzovatel
  se starou fotkou 2–3, zrnitost OSM 1, šum 1. Pravidlo samo je většinou v pořádku; prohry jsou hlavně tím, že Mapillary fotky
  jsou starší než nové stezky. Oprava 8 spraví 1.
- **Zálivy** (1 + 3): žádná jasná chyba pravidla; jediná prohra je nejistá (posun mapy), nerozhodné jsou šum.
- **Podlaží** (7): chyba přepočtu u nízkých patrových domů (3), štítových domů (2), hal (1), neopravitelné 1. Opravy 11 a 13 spraví
  4 bez rizika, 12 je +2 −1. Přepočet se ladil na 22 domech a 575 domech OSM, změnu je potřeba znovu změřit na nich i na čerstvém vzorku.

Pro příští A/B cyklostezek: posuzovatelům říct výslovněji, že stará fotka bez stezky neznamená, že stezka není (ortofoto má přednost),
nebo brát jen fotky mladší než ortofoto.
