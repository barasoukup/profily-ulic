# Struktura repozitáře

Složky a pojmenování v `evaluation/` a kde co leží.

- `evaluation/` (Bára 27. 11. 2026): nahoře živé nástroje a dokumentace (`universal`, `clicks`, `replay`, `holdout`, `ortho-osm`
  s `regression.mjs`, `orthophoto`, `centre-line`, `axisroad-check`, `streetview`, `variants`, `ab.mjs`, `sample.mjs`,
  `run_brno.mjs`, `polite.mjs`…), složky států (`slovakia`, `austria`…) a měst podle id (`praha`, `brno`, `jihlava`…);
  jednorázové pokusy a měření v `evaluation/archive/<název>/` (obsah beze změny, jen opravené odkazy). Zprávy anglickými
  jmény souborů, obsah česky: `REPORT.md`, `METHOD.md`, `LINKS.md`, `NORMS.md`, `SOURCES.md`, `REVIEW.md`, `BRIEF.md`
  (pokyn posuzovatelům), výsledky v `results/`, obrázky v `images/`. Id variant A/B (`variants/praha-zaklad.mjs`…) a
  názvy datových souborů (`.json`, `.jsonl`, malá `.md` ve `results/`) zůstávají.
- Popis pravidel: `docs/profile-derivation.md`, vyhodnocení 100 řezů: `evaluation/archive/prague-100/REPORT.md`,
  licence: `LICENSES-AND-SOURCES.md`.
