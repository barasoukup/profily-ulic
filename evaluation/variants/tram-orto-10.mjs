// (c) with a finer image (0.1 m/px), for the sleepers of gravel beds (evaluation/pravidla-11-2026/ZPRAVA.md, section 4).
import { ortho as at } from "./tram-orto.mjs";
export const about = "pravidlo + ortofoto 0,1 m/px";
export const ortho = (ctx) => at(ctx, 0.1);
