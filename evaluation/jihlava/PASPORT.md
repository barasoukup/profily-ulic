# Jihlava: pasport komunikací, test A/B (10. 11. 2026)

Otázka: zlepšuje pasport komunikací (`Pasporty/112`) profily, nebo je kazí? Srovnání s DTM ČÚZK
(`evaluation/srovnani-dmvs/ZPRAVA.md`) ukázalo vozovku o 1,5 až 2,5 m širší, než je asfalt (č. 9 a 10).

## Příčina
- Vrstva 112 je pasport **zimní údržby** (úseky podle pořadí údržby). Pole: `typ_useku` (vozovka, chodník), `povrch`,
  `spravce`, `nazev_kom`, `trida_kom`, `cislo`.
- **Místní komunikace** (správce Služby města Jihlavy, 51 z 89 řezů): úseky mají povrch a jsou zaměřené. Šířka
  sedí na asfalt a parkovací pruhy ani zeleň v sobě nemají.
- **Silnice ŘSD a KSÚS** (I., II. a III. třída, 34 řezů): povrch skoro nikde není vyplněný. Část je kreslená ručně
  a sedí. Silnici **I/38** ale město nakreslilo jako **pás konstantní šířky 13,0 m** podél osy, tedy obalovou zónu.
  Na 60 m úseku je široký 12,9 až 13,1 m a má 124 vrcholů. Pás obsahuje celou korunu silnice i s nezpevněnými
  krajnicemi, asfalt je ale široký jen asi 10,5 m. Proto má profil „krajnici 2,5 m v trávě“.
  Pás je navíc místy posunutý o 1 až 4 m vedle silnice. Týká se to řezů 9, 10, 12, 13 a 16, u 12 a 16 jde o mosty.
- Parkovací pruhy, obruby ani žlaby v pasportu nejsou. Stání se kreslí zvlášť z vrstvy parkovacích míst.

## Varianty (všech 89 řezů, `evaluation/ab.mjs`)
| varianta | co dělá | liší se | lepší pasport / varianta / obě / žádná |
|---|---|---|---|
| a `jihlava-bez-pasportu` | budovy, trávníky, katastr + DTM ČÚZK, jinak odhad z OSM | 82 | 61 / 8 / 13 / 0 |
| b `jihlava-pasport-za-dmvs` | DTM ČÚZK, pasport jen tam, kde DTM nic nemá | 38 | 17 / 8 / 13 / 0 |
| c `jihlava-silnice-z-dmvs` | pasport, silnice ŘSD/KSÚS bez povrchu z DTM | 29 | 9 / 6 / 13 / 1 |
| d `jihlava-pasport-uzsi-pas` | pasport, pás 13 m silnice ŘSD/KSÚS zúžený o 1,25 m na každé straně | 5 | 0 / 3 / 1 / 1 |

- **a:** odhad z OSM ve 48 řezech místo 3. Všechny místní ulice tak přijdou o chodníky, stání a okraje u domů,
  protože DTM Vysočiny místní ulice nemá. Posouzeno nad ortofotem 41 řezů. U dalších 41 má B stejnou chybu,
  odhad 6 m z OSM bez chodníků, a jejich obrázky jsem neotvírala (v `review.md` je to poznamenané).
- **b, c:** na hlavních silnicích vychází DTM a pasport zhruba nastejno. DTM je lepší na pásu I/38, kruhovém
  objezdu a u č. 8, 28 a 36. Pasport je lepší u mostů, kde DTM desku mostu nepřečte (č. 12: 4,9 m, č. 16: 0 m),
  dál u č. 19 a 38, kde DTM přidá druhou „vozovku“ nebo zpevněnou plochu v zeleni, a u č. 3, 6 a 27, kde jsou
  krajnice DTM v trávě.
  Ve variantě b se navíc zhorší místní ulice, kde DTM něco má: č. 62 a 82 skončí jako odhad z OSM, č. 89 přijde
  o přístupovou cestu a č. 73 zachytí souběžnou ulici. Varianta c k tomu přidá u č. 9 polní cestu do profilu.
- **d:** změní jen řezy na pásu 13 m. U č. 9, 10 a 13 sedí vozovka šířkou na asfalt (10,4–10,5 m místo 13 m).
  U č. 10 a 13 ale zůstane posun pasportu o 1,3 m a 2,5 m. Most č. 12 vyšel nastejno (deska mostu 11,6 m).
  U mostu č. 16 je špatně obojí, protože je posunutý pás. Jinde se nic nezmění.
- Čas ploch na kliknutí (medián): pasport 69 ms, s DTM 0,6 s.

## Rozhodnutí
- **Pasport ponechat.** Bez něj nebo za DTM jsou profily zřetelně horší (61:8 a 17:8).
- **Změna podle varianty d je zavedená v `pilot/public/towns/jihlava.js`.** Dotaz na pasport nově čte také `spravce`
  a `povrch`. Vozovka silnice ŘSD/KSÚS bez povrchu, která je napříč široká 12,7–13,2 m alespoň na 30 % svých hran,
  se na těchto hranách zúží o 1,25 m na každé straně. Okraj pak vyplní katastr jako zeleň (odhad).
  Kontrolní běh: nový stav `city` se s variantou d shoduje v 89 z 89 řezů a proti starému stavu se změnilo právě
  5 řezů (9, 10, 12, 13, 16). Počet dotazů se nezměnil.
- Neřešeno: posun pásu I/38 o 1 až 4 m. Opravit by ho šlo jen posunem na osu z OSM, a to je jiná změna, která
  potřebuje vlastní test.

## Soubory
- `evaluation/ab.mjs`, varianty `evaluation/variants/jihlava-*.mjs`, společné vrstvy `evaluation/variants/_jihlava.mjs`.
- Výsledky (git je ignoruje): `evaluation/jihlava/data/ab-city-<varianta>/` (`<n>.json`, `png/`, `review.md`
  s verdikty). Varianta d před změnou je v `ab-pred-zmenou-city-jihlava-pasport-uzsi-pas/`. Odpovědi služeb jsou
  v `data/ab-cache` (`CACHE=disk`), opakovaný běh se služeb neptá.
- Spuštění: `CITY=jihlava VARIANTS=city,jihlava-bez-pasportu,jihlava-pasport-za-dmvs,jihlava-silnice-z-dmvs CACHE=disk node evaluation/ab.mjs`,
  potom `… --summary`.
