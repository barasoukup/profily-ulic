// The profile with no surfaces at all: the estimate from OSM, as the app draws it where the national DTM of ČÚZK
// has nothing (local streets of Moravskoslezský kraj, Vysočina…). Stands for the current state on such cuts
// without asking ČÚZK (Bára: not too many requests).
export const about = "bez ploch (odhad z OSM, jako DMVS bez ulice)";
export const surfaces = async () => ({ features: [] });
