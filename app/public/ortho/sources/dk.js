// Denmark (Bára 23. 11. 2026): the spring orthophoto of GeoDanmark (Klimadatastyrelsen, "Ortofoto forår", 10–12.5 cm, a new national
// mosaic each spring) as WMTS tiles in Web Mercator to level 20 (DFD_GoogleMapsCompatible, about 8 cm a pixel in Copenhagen), CORS
// for the origin asking, free data with credit (evaluation/denmark/SOURCES.md 1). Only with the app's own token of Dataforsyningen
// (`key`, keys.js dkToken: config.js on the site from the repository variable DK_TOKEN, locally config.local.js); without it laneImage
// throws an error marked noKey (the estimate from OSM, said so), as it does when the service turns the token away (401/403 on every
// tile), and the map has no layer. Dataforsyningen is moving to a new platform (a service window 26.–30. 11. 2026): a server error is
// an outage, told as one. A tile is asked by key-value pairs (`tileUrl`), composed by hand, not through URLSearchParams: Leaflet's
// layer passes "{z}", "{x}", "{y}" and replaces them itself, so they must stay unencoded (the review of 24. 11. 2026: encoded to
// %7Bz%7D, every basemap tile was a 400).
import { dkToken } from "../../keys.js";

export const DK_ORTHO = (z, x, y, token = dkToken()) => "https://api.dataforsyningen.dk/orto_foraar_webm_DAF?service=WMTS&request=GetTile&version=1.0.0"
  + `&layer=orto_foraar_webm&style=default&format=image%2Fjpeg&tilematrixset=DFD_GoogleMapsCompatible&tilematrix=${z}&tilerow=${y}&tilecol=${x}&token=${encodeURIComponent(token ?? "")}`;
export const sources = [
  { id: "dk", res: 0.1, blank: true, key: dkToken, credit: "common.orthophotoIndeholderDataFra",
    service: { type: "xyz", base: "https://api.dataforsyningen.dk/orto_foraar_webm_DAF", z: 20, px: 256, tileUrl: DK_ORTHO },
    map: { kind: "tiles", state: "denmark", limit: "inside", maxNativeZoom: 20 } },
];
