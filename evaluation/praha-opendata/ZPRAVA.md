# Otevřená data Prahy a body technické mapy (10. 11. 2026)

Každý zdroj prošel testem A/B nad ortofotem (`evaluation/ab.mjs`, pravidlo z `pilot/README.md`): základ je
`praha-zaklad` (Praha bez nových zdrojů), varianty jsou v `evaluation/variants/praha-*.mjs`. Na vzorku 100 řezů
(`evaluation/data/samples.json`) se odpovědi IPR (MTVU, linie, parkování) braly z cache `pilot/cache`. Chybějící
odpovědi pro 43 řezů a body vrstvy 9 pro všechny řezy doplnil `fill_cache.mjs` přes `polite.mjs` (285 dotazů,
jeden po druhém, 300 ms od sebe). Dva doplňkové vzorky jsou cílené na místa, kde se zdroj může projevit:
`data/samples-zakaz.json` (30 řezů, 240 dotazů) a `data/samples-useky.json` (30 řezů). Do `review.md` párů
`evaluation/praha/data/ab-*` jsem doplnila verdikty. `ITEMS=1` počítá jako rozdíl i předměty, stromořadí a stání.

Statická data stahuje `tools/build_praha_opendata.mjs` jednou při nasazení z Hub API opendata.geoportalpraha.cz.
Odkazy bere z DCAT feedu, když feed neodpoví, ze známých id. Výstup jsou dlaždice 0,01° v `pilot/data/praha/opendata`
(na webu `data/praha/opendata`): 863 souborů, 5,3 MiB, největší 65 kB. Jedna dlaždice nese všechny čtyři sady,
takže řez načte jeden až čtyři soubory, souběžně s ostatními dotazy.

## 1. Body technické mapy IPR (dtmp/MapServer/9) – připojeno

Jeden dotaz na řez, kódy v jednom WHERE: 26015 sloup trakčního vedení, 75240/75241 zastávka (stojan),
74110 sloupek, 83130 strom mimo park, 76010 sloupy bez vedení. Lokálně jde dotaz přes `/api/body` a cache.
- 76010 „sloupy bez vedení“ jsou v ulicích lampy: jsou rozestavěné jako lampy (medián 24 m) a stojí ve středních
  pásech i u chodníků (Patočkova). Kreslí se jako lampa.
- Lampa OSM do 3 m od sloupu trakce se kreslí jako lampa na sloupu (nábřeží E. Beneše).
- 75245 (automat jízdenek) v profilu nemá předmět, proto se nepřipojil.
- Nové předměty jsou „Sloup trakčního vedení“ (sloup s výložníkem, případně s lampou) a „Označník zastávky“.
  Kresba je zatím jednoduchá. Tramvajový pás se sloupy v Návrhu oranžově hlásí, když je užší než 8 m (Manuál C.2).
- A/B (100 řezů, dosah tehdy 6 m): liší se 8. Lepší B 4 (sloupy se stíny u obrub a mezi kolejemi, lampy ve
  středním pásu), obě 4 (na ortofotu nejde poznat), lepší A 0.
- Stromy 83130 (`praha-stromy-dtm`): liší se 8, lepší B 6, lepší A 2 (keř, tráva).
- **Rozhodnutí: připojeno, i se stromy.**

## 2. Stromy – Sdílená data o zeleni (body, kód 71 „Strom“) a Stromořadí – připojeno

171 292 stromů a 8 056 stromořadí doplňují stromy z OSM. Pražský výřez OSM jich má málo: stromy u řezu jsou
jen ve 2 ze 100 řezů. Stromy stejné řady do 1,5 m napříč ulicí jsou jeden pás. Zdroj pásu je „otevřená data
města“ (technická mapa > otevřená data > OSM).
- A/B (`praha-stromy`, 100 řezů): liší se 16. Lepší B 14, lepší A 1 (č. 41, u řezu strom není), obě 1.
- **Rozhodnutí: připojeno, spolu se stromy technické mapy.** OSM stromy nenahrazují, jen doplňují.

## 3. Zákaz stání (TSK) – připojeno, s výhradou

Ve 100 řezech se neprojevil ani jednou. Plochy zákazu jsou malé (kolem 9 m²) a leží uvnitř úseků parkovacích
stání: mají stejné ZPS_ID jako úsek (Belgická 3045). Jde o mezery v řadě stání, třeba vjezdy, přechody a
klikaté čáry V12. Profil proto v místě zákazu vyjme úsek TSK i parkoviště OSM. U té obruby navíc neplatí stání
z tagů OSM ani odhad a místo se kreslí jako vozovka nebo krajnice.
- Cílený vzorek: 30 řezů přímo v plochách zákazu, kde OSM udává stání. Liší se 25. Lepší B 9 (vjezdy, klikaté
  čáry u řezu), lepší A 5 (u řezu stojí auto), obě 11 (stín, stromy).
- Ve stažené verzi Hubu je zákaz stání podle hlavičky z 9/2025, živá vrstva 9 služby `dop/zony_placeneho_stani`
  je novější. Při nasazení se proto může hodit brát ho z ní (je to 13 tisíc ploch, jednou za nasazení).
- **Rozhodnutí: připojeno** (vyhrálo 9 : 5). Profil v mezeře mezi stáními ukazuje, že tam se nestojí. Je to
  pravda, ale pro typický profil ulice je to méně reprezentativní. Bára může chtít opak.

## 4. Uliční úseky TSK se zatříděním – připojeno jen pro odhad stání

Mimo ZPS se odhaduje podélné stání v místních ulicích OSM (residential, unclassified, living_street). Zatřídění
TSK ho teď vypne na sběrných a hlavních ulicích (MK I, MK II), na silnicích a dálnicích, i když je OSM má za
místní. Jinde rozhoduje dál OSM.
- 100 řezů: liší se 1 (č. 83 U Trezorky, MK II, v řezu přechod). Lepší B.
- Cílený vzorek (30 řezů mimo ZPS, kde se OSM a TSK rozcházejí, `data/samples-useky.json`):
  - Místní ulice OSM se třídou MK I/II (bez odhadu): lepší B 7, lepší A 2, obě 1.
  - Opačný směr jsem zkoušela taky (odhad i v MK III, kterou OSM má za tertiary): lepší A 5, lepší B 1, protože
    tam auta nestojí (lesní silnice, kruhový objezd, cyklopruhy). Verdikty jsou v
    `data/review-useky-mk3-odhad.md`. Tenhle směr se nepřipojil.
- **Rozhodnutí: připojeno jen jako „v MK I a II se stání neodhaduje“.**

Šířky pruhů podle třídy (Manuál C.2) jsem nezaváděla, protože jsou už dané typem ulice z OSM a strop 4 / 4,5 m.

## 5. Vyhrazená stání (zásobování, speciální, ZTP sdružená, ZTP s RZ) – už v aplikaci

Jsou to tytéž vrstvy TSK, které aplikace bere živě z `dop/zony_placeneho_stani` (5 ZTP s RZ, 6 ZTP sdružená,
7 zásobování, 8 speciální; `queries.js` PARKING_LAYERS). Hosted kopie Hubu (`DOP_CUR_DOP_ZPS_ZAS_P` …) mají stejná
pole (zps_id). **Nic nového se nepřipojilo.**

## Dosah bodů podle druhu (`derive.js` REACH)

Vzdálenosti sousedních bodů stejné řady podél ulice na 100 řezech: lampy medián 30 m (kvartily 27–32), sloupy
bez vedení 24 m, sloupy trakce 26 m (22–38), stromy 8,6 m (technická mapa), sloupky 2,5 m, zastávky 66 m.
Z každé řady (stejný druh, do 1,5 m napříč ulicí) se kreslí jen bod nejbližší řezu. Větší dosah proto nikdy
nepřidá dva body jedné řady a předmět drží místo napříč ulicí.

| druh | dosah | proč |
|---|---|---|
| lampa | 20 m | polovina rozestupu 30 m by byla 15 m. Ve 20 m je lampa vidět u 86 % řad, které přes řez vedou (při 15 m u 71 %, při 6 m u 14 %). Z vedlejší ulice přibude 1 z 33 řad (3 → 4). Bára navrhla 20. |
| sloup trakce | 20 m | rozestup 22–38 m. A/B 6 m × 20 m: sloupy u obou obrub (Bělohorská, Kolbenova, G. Šišky) jsou lépe vidět na stínech. |
| zastávka (označník, přístřešek) | 15 m | zastávka je jedna, ne řada. Ve 20 m přibyly i nejisté označníky. |
| strom | 8 m | polovina rozestupu stromořadí (medián mezery přes řez 15,7 m). Pokrytí 89 %, ve 15 m 95 %, ale víc stromů z vedlejších ulic. |
| sloupek, květináč | 3 m | rozestup 2,5 m. Řada končící pár metrů před řezem do něj nepatří. |
| lavička, ostatní | 6 m | jednotlivé předměty, beze změny |

A/B dosahů (stav s body a stromy, 6 m × 20 m pro lampy, sloupy a zastávky): liší se 16 řezů. Lepší 20 m 8
(lampy ve středních pásech, sloupy trakce, přístřešek na druhém nástupišti), obě 8, lepší 6 m 0.
Při 6 m × 15 m se liší 7 řezů.

Celkem proti `praha-zaklad` (vše nové, konečné dosahy) se ze 100 řezů liší 28 (předměty nebo stromy). Šířky
vozovky se nemění, chodník se liší u 4 řezů o víc než 0,5 m (stromořadí vyříznuté z chodníku). Tento souhrn jsem
nehodnotila zvlášť: skládá se z výše posouzených změn.

## Rychlost

Nové dotazy běží souběžně s dosavadními (`sources.js` prahaLines a parkovani). Body jsou jeden dotaz bez
opakování s limitem 10 s, statické dlaždice se čtou po dlaždicích. V prohlížeči (lokální server, první klik bez
cache): Bělohorská 360 ms, Patočkova 5,3 s, Podle Kačerova 9,2 s. Dlouho trvá dosavadní liniová vrstva IPR
(4,7 s a 8,6 s), body přišly za 1,0 a 1,4 s a dlaždice za 3–12 ms, takže profil nezdržely. Podruhé (cache)
280–570 ms.
