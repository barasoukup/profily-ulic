# Auta u obruby: předtrénované detektory vozidel (pokus 11. 11. 2026)

Otázka: najde hotový model pro detekci vozidel z leteckých snímků zaparkovaná auta u obruby lépe než ruční
detektor v `run.mjs` (hrany a rozptyl jasu v pásu 2 m u obruby, ±20 m podél ulice)? A šel by spustit v prohlížeči?

```bash
# Python ve vlastním venv mimo repozitář (scratchpad), váhy z oficiálních zdrojů
WEIGHTS=…/weights venv/bin/python dl/detect.py praha yolo11m-obb [0.1]   # → data/praha/dl/yolo11m-obb.json
HF_HOME=…/hf venv/bin/python dl/detect.py brno owlv2
WEIGHTS=…/weights venv/bin/python dl/review.py praha yolo11m-obb 35 84 … # → data/praha/dl/png/<n>.jpg
python3 dl/eval.py yolo11n-obb yolo11m-obb yolo11x-obb owlv2              # tabulka proti dl/truth.json
```

`dl/strip.py` převzorkuje uložený snímek (EPSG:3857, `data/<město>/img/<zdroj>/<n>.png`) do mřížky řezu stejně
jako `strip()` v `run.mjs`, jen v libovolném rozlišení (výchozí 10 cm/px, modely DOTA jsou zvyklé na 10–30 cm).
Pro každý řez, zdroj a pás u obruby (stejné pásy jako `run.mjs`: `[s+0,25; s+2,2]` a `[e−2,2; e−0,25]`)
se ukládá počet aut se **středem** v pásu, počet aut, která do pásu **zasahují** aspoň 0,5 m (`count_ovl`),
a podíl 40 m pokrytý jejich obdélníky (`cover`, `cover_ovl`). Žádné dotazy na mapové servery, jen uložené snímky.

## Modely

| model | co to je | velikost vah | čas na řez (M4, CPU, PyTorch) |
|---|---|---|---|
| YOLO11n-OBB | Ultralytics, natočené obdélníky, trénováno na DOTA v1 (třídy small/large vehicle) | 5,8 MB | 13 ms |
| YOLO11m-OBB | totéž, střední | 42 MB | 47 ms |
| YOLO11x-OBB | totéž, největší | 118 MB | 93 ms |
| OWLv2 base | Google, otevřený slovník („a car seen from above“), osové obdélníky, filtr na velikost auta | 593 MB | 1 730 ms |

Výsledky pro všechny řezy (Praha 96 × 4 snímky, Brno 99 × 3) jsou v `data/<město>/dl/<model>.json`;
YOLO navíc v rozlišení 12,5 a 15 cm (`-125mm`, `-150mm`).

## Kontrola okem

Prohlédl jsem 22 řezů na všech snímcích (78 výřezů, `data/praha/dl/png/`, `data/brno/dl/png/`; v obrázcích
azurově auta z YOLO11m, fialové čáry pásy, fialový pruh = ruční detektor hlásí řadu aut) a u každého pásu
zapsal, jestli u něj opravdu stojí auta (`dl/truth.json`; projíždějící auta a kolona = ne, „?“ = nejde poznat).
Celkem **223 pásů, z toho 95 s auty**.

- Praha (12): Olšanská 35, Zborovská 84 (šikmé stání), Krausova 91 (kolmé), Bělohorská 49 a 15, Kukelská 74,
  U Trezorky 83, Nad Petruskou 71, Jílovská 65, U libušské sokolovny 86, Hekrova 79, Benátská 47.
- Brno (10): Fügnerova 74, Fišova 71, Helfertova 68, Pellicova 61, Mazourova 80, Charbulova 43, Pivoňkova 92,
  Lelekovická 86, Svatopetrská 14, Otakara Ševčíka 11.

Vzorek je vybraný (ulice se stáním a místa, kde se metody neshodly), ne náhodný; čísla jsou orientační.

### Výsledky (přesnost = správně z nalezených, záchyt = nalezeno ze skutečných)

Pravidlo „model“: pás má auta, když do něj aspoň 0,5 m zasahuje aspoň jedno auto (≥ 1), nebo aspoň dvě (≥ 2, řada).

| metoda | zdroj | pásů | s auty | přesnost | záchyt | poznámka |
|---|---|---|---|---|---|---|
| ruční (`run.mjs`) | vše | 223 | 95 | 56 % | 64 % | stíny a stromy dělají „auta“, hrubá textura 25 cm taky |
| ruční | IPR 10 cm | 36 | 17 | 64 % | 53 % | |
| ruční | IPR 5 cm | 35 | 18 | 72 % | 72 % | |
| ruční | Brno 2025 | 26 | 10 | 40 % | 20 % | snímek posunutý o ~2 m proti pásům |
| ruční | ČÚZK 12,5 cm | 63 | 25 | 53 % | 64 % | |
| ruční | ČÚZK 25 cm | 63 | 25 | 51 % | 84 % | vysoký záchyt za cenu falešných |
| YOLO11n-OBB ≥ 1 | vše | 223 | 95 | 79 % | 84 % | |
| YOLO11n-OBB ≥ 2 | vše | 223 | 95 | 92 % | 69 % | |
| YOLO11m-OBB ≥ 1 | vše | 223 | 95 | 81 % | 87 % | |
| YOLO11m-OBB ≥ 2 | vše | 223 | 95 | 95 % | 75 % | nejlepší poměr |
| YOLO11m-OBB ≥ 2 | IPR 10 cm | 36 | 17 | 100 % | 82 % | |
| YOLO11m-OBB ≥ 2 | IPR 5 cm | 35 | 18 | 100 % | 83 % | |
| YOLO11m-OBB ≥ 2 | Brno 2025 | 26 | 10 | 100 % | 50 % | posun snímku, auta mimo pás |
| YOLO11m-OBB ≥ 2 | ČÚZK 12,5 cm | 63 | 25 | 91 % | 80 % | |
| YOLO11m-OBB ≥ 2 | ČÚZK 25 cm | 63 | 25 | 89 % | 68 % | i z 25 cm převzorkovaných na 10 cm |
| YOLO11x-OBB ≥ 2 | vše | 223 | 95 | 94 % | 76 % | větší model nepomáhá |
| OWLv2 ≥ 1 | vše | 223 | 95 | 84 % | 85 % | Brno 2025: 91 % / 100 % |
| OWLv2 ≥ 2 | vše | 223 | 95 | 96 % | 68 % | |
| YOLO, auto se středem v pásu | vše | 223 | 95 | 88–89 % | 67–69 % | pás leží často o metr vedle |

Rozlišení vstupu (10 / 12,5 / 15 cm) vychází u YOLO skoro stejně (YOLO11m ≥ 1: 87 / 86 / 89 % záchyt).

Na všech řezech (bez kontroly okem, jen jako vodítko): na hlavních silnicích (trunk, primary) hlásí YOLO11m
„≥ 2“ auta u 1–11 % pásů, ruční detektor u 4–43 % (Brno ČÚZK 25 cm 43 %).

### Co model umí a co ne

- **Stín:** model auta ve stínu domů najde (Helfertova Brno 2025, Mazourova ČÚZK, Krausova ČÚZK 12,5 cm); ruční
  detektor v hlubokém stínu hlásí auta i tam, kde nejsou (Lelekovická: pás ve stínu domu, 3× falešně).
- **Stromy:** pod řídkou korunou a na jarním snímku bez listí (IPR 5 cm, Brno 2025) ano; pod hustou letní korunou
  ne (červená auta pod stromem v Jílovské na ČÚZK, tmavé auto u Otakara Ševčíka na ČÚZK 25 cm). To je limit
  snímku, ne modelu.
- **Kolmé a šikmé stání** (Krausova, Zborovská, Benátská) model najde celé; auta jsou natočená a jejich střed
  leží mimo 2m pás, proto pravidlo „zasahuje 0,5 m“ místo „střed v pásu“.
- **Jedoucí auta:** model nerozlišuje, jestli auto stojí. Kolona na Svatopetrské (Brno) dává falešná auta u obruby
  na ČÚZK (9 z 19 falešných YOLO11m ≥ 1). Pravidlo „aspoň 2 auta“ jich většinu odstraní.
- **Auta mimo ulici:** auto ve vjezdu či dvoře, kam pás omylem sahá (Nad Petruskou, 6 falešných).
- **Hlavní chyba není v modelu, ale v poloze pásů.** U 5 z 22 řezů leží profil mimo ulici (Fügnerova, Pivoňkova,
  Nad Petruskou, U Trezorky, levá vozovka Bělohorské 49: pásy na střechách nebo v zeleni); ruční detektor tam
  hlásí auta, model správně ne. Brněnské ortofoto 2025 je proti pásům posunuté asi o 2 m, proto tam záchyt
  „≥ 2“ jen 40–50 %. Model by mohl polohu řad aut určit sám (řada natočených obdélníků podél ulice = hrana
  vozovky), a tím i pomoct se zarovnáním.

## Licence

| model | kód | váhy | data tréninku |
|---|---|---|---|
| Ultralytics YOLO11-OBB | AGPL-3.0 (komerčně Enterprise licence) | AGPL-3.0 (GitHub releases ultralytics/assets) | DOTA v1: jen pro akademické použití, snímky z Google Earth a čínských družic |
| OWLv2 (google/owlv2-base-patch16-ensemble) | Apache-2.0 (google-research/scenic, transformers) | Apache-2.0 (Hugging Face) | WebLI a další, pseudoznačky |

Váhy YOLO v MIT aplikaci by z ní dělaly AGPL dílo (nebo by se musely brát jako samostatná AGPL součást se
zdrojem) a podmínky DOTA na neakademické použití nesedí. OWLv2 licenčně v pořádku, ale velký a pomalý.

## V prohlížeči

Export do ONNX (vstup 512 × 512, opset 17), onnxruntime na CPU M4, nativně:

| model | ONNX FP32 | ONNX INT8 (dynamická kvantizace) | 1 vlákno | 4 vlákna |
|---|---|---|---|---|
| YOLO11n-OBB | 10,8 MB | 3,0 MB | 54 ms (INT8 75 ms) | 26 ms (INT8 35 ms) |
| YOLO11m-OBB | 83,7 MB | 21,3 MB | 475 ms (INT8 657 ms) | 196 ms (INT8 242 ms) |
| OWLv2 base | ~600 MB (nezkoušeno) | ~150 MB odhad | 1,7 s v PyTorch | |

Odhad pro onnxruntime-web: WASM bývá 2–4× pomalejší než nativní CPU, tedy YOLO11n asi 0,1–0,25 s na řez,
YOLO11m 1–2 s; s WebGPU rychleji. Operace YOLO11 onnxruntime-web podporuje (Ultralytics má i export do TF.js,
ten je ale větší a pomalejší). Prakticky jde jen YOLO11n (3 MB INT8; přesnost INT8 jsem neověřoval). OWLv2 do
prohlížeče ne. K tomu by prohlížeč musel stahovat pixely ortofota (u WMS ČÚZK a IPR ověřit CORS).

## Doporučení

- Hotový model je na autech u obruby **jasně lepší než ruční detektor**: YOLO11m „≥ 2 auta“ 95 % přesnost / 75 %
  záchyt proti 56 % / 64 %, a hlavně téměř nehlásí auta tam, kde nejsou (stíny, střechy, hrubá textura).
  Malý YOLO11n je jen o kousek horší (92 % / 69 %), velký YOLO11x nepřidá. ČÚZK 12,5 cm stačí (91 % / 80 %).
- **Do aplikace v prohlížeči zatím ne**: licence YOLO (AGPL, DOTA jen akademicky) a další megabajty pro každého
  návštěvníka. Pokud by se auta měla vracet, pak (a) spočítat je jednou při nasazení na serveru a ukládat jen
  výsledek po úsecích, (b) s licenčně čistým modelem: OWLv2 (Apache-2.0, podobné výsledky, ale 1,7 s na řez,
  pro předvýpočet únosné) nebo vlastní malý model doučený na vlastních značkách.
- Snímek je jedna chvíle: jedoucí auta se oddělí pravidlem „aspoň 2 auta“, lépe shodou dvou snímků z různých
  dat (Praha: ČÚZK, IPR 2024, IPR 2025). Před dalším měřením opravit polohu pásů (zarovnání podle řad aut).
