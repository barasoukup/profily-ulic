# Ruční označení obrázků (nezávislá kontrola ortofota)

Obrázky vytváří `oznac.mjs make` do `evaluation/ortofoto/data/<město>/oznac/<n>-<w>.png`, jejich seznam
s metadaty je v `index.json`. Na každém je jedna vozovka z ortofota, 20 px = 1 m v obou směrech. Ulice vede
shora dolů (výřez ±15 m podél ulice), napříč ulicí je osa x. Nahoře a dole je bílé měřítko: krátká čárka
každý metr (20 px), dlouhá každých 5 m. Nic dalšího na obrázku není: kdo značí, nemá vidět, co našel program.

## Co označit (v pixelech osy x, odečteno uprostřed výšky, y ≈ 300, u přerušovaných čar podle celé délky)

- **edges**: okraje pojízdné vozovky, tedy kde končí asfalt nebo dlažba pro auta (líc obrubníku, okraj
  asfaltu proti trávě, chodníku nebo tramvajovému tělesu). Má-li vozovka uprostřed ostrůvek nebo tramvajové
  těleso, uvést všechny okraje zleva doprava.
- **lines**: každá podélná čára vodorovného značení (střed čáry), s druhem `solid` (plná), `dashed`
  (přerušovaná), `double` (dvojitá, uvést střed), `edge` (vodicí čára u okraje). Nepočítat přechody, stopčáry,
  šipky, nápisy, kolejnice, spáry ani stíny.
- **hatch**: úseky `[x0, x1]` se šrafováním (šikmé rovnoběžné čáry).
- **parking**: úseky `[x0, x1]`, kde stojí auta podél obruby nebo jsou vyznačená stání (nepovinné).
- **quality**: `ok`, `junction` (křižovatka, rozplétání pruhů), `occluded` (stromy, stín, auta zakrývají),
  `nonroad` (obrázek neukazuje vozovku); a `note` krátce česky.

Pro přesnost je zvětšovátko: `node evaluation/ortofoto/oznac.mjs zoom <png> <x0> <x1> <y0> <y1> <výstup.png>`
dá výřez šestkrát zvětšený, nahoře stupnice pixelů původního obrázku (čárka po 5 px, delší po 10 px, červená
na každém násobku 50 px). Výstup ukládat do vlastní dočasné složky.

## Výstup

`evaluation/ortofoto/labels/oznac-<město>-<značkovatel>.json`:

```json
{ "34-0": { "edges": [52, 401], "lines": [[127, "dashed"], [203, "solid"]], "hatch": [], "parking": [[60, 100]],
            "quality": "ok", "note": "" } }
```
