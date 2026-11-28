// Sets of part types shared by the derivation.


export const TRAM_KINDS = new Set(["tramvaj_v_pruhu", "tramvaj_pruh", "tramvaj"]);

// Surfaces people walk on, where trees, platforms and kerb parking can be placed.
export const WALK = new Set(["chodnik", "chodnik_kola", "stezka_sdilena", "plocha"]);

// A narrow raised paved strip between two carriageways is a median / traffic island.
export const ROADWAY = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "tramvaj", "cyklopruh", "ochranny_pruh", "parkovani", "krajnice"]);

// Parts where a lamp, bench or other standing thing cannot be: vehicles drive or park there.
export const TRAFFIC = new Set(["pruh", "pruh_piktokoridor", "obsluzna", "krajnice", "bus", "bus_cyklo", "tramvaj_v_pruhu",
  "cyklopruh", "ochranny_pruh", "parkovani", "tramvaj", "tramvaj_pruh"]);
