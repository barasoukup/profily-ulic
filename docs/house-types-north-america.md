# House looks of North America (specification, 25. 11. 2026)

> Drawn and wired: `app/public/houses-america.js` (measures and drawing), `house-looks.js` `northAmericaLook` and
> `northAmericaDetails` (which house gets which look), `countries/US.js`; Canada's module is to use the same two functions.
> The overview `evaluation/north-america-art/houses/prehled.png`, the check of the choice `evaluation/north-america-art/houses/REPORT.md`.

Houses are drawn in code in the same side view as the European ones (`docs/house-types-europe.md`): a strip 4 m deep seen
along the street, what stands before the facade (bay, porch, stoop, fire escape, balcony) in profile over the sidewalk,
the facade's door and windows by licence on the side wall. Heights are real: the floors or the height of the data decide,
the typical storey only where they say nothing. Measures (cm) of each look are in `AMERICA`, colours in `AMERICA_PALETTES`.
Proportions and details come from general knowledge of the types and the street photos named below; the rows of
Washington were checked on Mapillary (80 houses). No measured drawings were used.

## New looks (14)

| look | where, years | floors, storey | front | walls, roof | what the data tell |
|---|---|---|---|---|---|
| `bayrow` row house | Washington (L'Enfant's city, Georgetown, Columbia Heights), Boston (Back Bay, South End), 1870–1915 | 2–4 × 3.2 m over an English basement 1.05 m | square bay 1.15 m over the full height (Boston's bow looks the same from the side), iron steps; flat front in Georgetown, Alexandria, for new townhouses and where the kind is unknown | red brick, flat roof, corbelled cornice; a pointed roof on a third of the bays | OSM row of 3+ joined houses in the old town districts (circles) |
| `porchrow` row house with a porch | Washington outside the old city, Baltimore, Philadelphia; 1905–40 | 2 × 2.9 m, floor 0.95 m up | porch 1.85 m over the whole front | brick, a short tiled slope before a flat roof | OSM house in a row or a semi-detached one, outside the old districts |
| `framehouse` detached house | everywhere, 1890–1960 | 1–2 × 2.7 m | porch 1.6 m on posts, or a stoop (from 1945, and a third) | clapboards, or brick (Washington: half); gable roof 34° | OSM detached, bungalow; a small house alone; nothing known outside the cities |
| `brickblock` brick apartment house | everywhere, 1900–60 | 2–12 × 2.9 m | pre-1946 from 5 floors a stone base, cornice, canvas canopy to the curb (6+); else plain (garden apartments) | brick, flat roof | OSM apartments, 5+ floors, or a big footprint; the year decides the ornament, without it plain |
| `slab` apartment slab | everywhere, 1950–85 | 6+ × 2.75 m | balconies 1.4 m (only with a year), lobby under a canopy | brick or pale, floor bands | apartments 1946–89 with 6+ floors, 13+ floors of no year |
| `podium` flats over shops | everywhere, 1995– | 4–7 × 3 m, ground 4.5 m | shallow bay, small balconies | panels in two colours over a brick or glazed ground floor | apartments from 1990, 4–7 floors |
| `glasstower` | everywhere, 1990– | 8+ × 3.1 m | glass balconies (offices none) | curtain wall | from 1990: apartments 8+, offices 10+ floors |
| `mainstreet` shop with flats | everywhere, 1870–1930 (Toronto's main streets too) | 2–4 × 3.4 m | shop front, awning, blade sign | brick, sheet-metal cornice | OSM retail, commercial of 2–4 floors |
| `stripmall` one-storey shops | everywhere, 1920– | 1 × 4 m | covered walk with a sign fascia | stucco or brick box | OSM retail of 1 floor; a big footprint of 1 floor |
| `brownstone` | New York (Manhattan, Harlem, Brooklyn), 1850–1900 | 3–4 × 3.3 m, stoop 1.65 m | stone stoop with a balustrade | brown sandstone, deep bracketed cornice | house in those districts up to 4 floors |
| `tenement` | New York, 1870–1915 | 5–6 × 3.1 m | fire escape 1.1 m | brick over a shop, big cornice | 5–6 floors in those districts, not after 1920 |
| `tripledecker` | Boston and New England, 1880–1930 | 3 × 2.85 m | three stacked porches 1.75 m | clapboards, flat roof, wide eave | 3 floors in Boston outside the old core, not after 1940 |
| `baygable` bay-and-gable | Toronto, 1875–1900 | 2–3 × 3.1 m | bay 0.85 m, gable with bargeboards (turned towards us, the licence of the North Sea gables) | red brick, buff bands, slate | house in the Victorian districts |
| `victorian` | San Francisco, 1870–1910; plain stucco 1920–45 | 2–3 × 3.15 m over a garage | angled bay from the 1st floor, steps | painted wood, cornice on a false front | house in the city; the districts of the Victorians decorated, the rest plain |

## Reused

`kancelar` (the office block and tower up to 1990, and of no year), `hala` (works and warehouses), `skola`, `kostel`,
`garaz`, `moderni` (new flats of up to 3 floors). Dropped as looks of their own: Boston's bow-front (`bayrow`), the garden
apartments and the pre-war apartment block (one drawing, `brickblock`, the year decides), the strip mall and the
low commercial box (`stripmall`), the office tower (`kancelar`, `glasstower`), Toronto's main-street shop (`mainstreet`).
The postwar block of the west (`povalecny`) is not used: roller shutters and coloured balcony fronts are European.

## The rules (`northAmericaLook`)

1. Churches, schools, garages keep their look; works and warehouses the hall; offices `kancelar`.
2. Shops by floors; apartments by year and floors; houses by kind, the block (joined row, pair, alone) and the district.
3. No kind: a joined row of small footprints is a row house (plain front), a small one alone a detached house, a big
   footprint an apartment house (an office in the office districts).
4. Nothing known: the plain row house in the cities, the detached house elsewhere.

The look reads every OSM building, not only those with floors
or a height. In DC proper 159 780 OSM buildings: floors 37 %, a height 0.2 %, year 0.1 %, roof shape 0.2 %, material
0.05 %; the kind (not `yes`) 69 %. The built-up test is not touched
(since 25. 11. 2026 in every state, `evaluation/archive/all-buildings/REPORT.md`).

Used in Washington: DC's CAMA tables (`towns/usa.js podlaznost`, `evaluation/north-america-art/cama/REPORT.md`). Not used yet,
would decide the year and floors: NYC PLUTO (`yearbuilt`, `numfloors`, `bldgclass`), Boston's property assessment (`YR_BUILT`, `RES_FLOOR`, `LU`), Toronto has 3D Massing
(height). Field names from memory, to be checked when wired.

## References

Wikimedia Commons (looked at, not kept): “Capitol Hill, DC - rowhouses 2–5”, “Kingman Park DC row houses 01–11”, “Home Building
Association Company Building, Newark, OH”, “Queen Street West in Toronto, July 7 2025”, “Strip mall storefronts in
Falls Church”, “Buckingham Apartment Complex, Arlington” (HABS), “97 Orchard Street back exterior”, and searches for
brownstones, triple-deckers, bay-and-gable, San Francisco's Victorians. No usable photo was found for `framehouse` and
`podium` (Commons limited the requests), few for `slab`, `glasstower`, `tenement`: those are from general knowledge. Mapillary: the ids in `evaluation/north-america-art/houses/rules/sample*.json`.
