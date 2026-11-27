// A sheet of every house look (European ones in Prague and their own towns, North American ones in the USA), 1 and 2 floors, two tints.
//   [PUB=dir] node evaluation/north-america-art/houses/list.mjs out.png [eu|na]
import { renderCells } from "./render.mjs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const PUB = process.env.PUB ? path.resolve(process.env.PUB) : path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "app", "public");
try { await import(pathToFileURL(path.join(PUB, "america.js"))); } catch {}
const blk = { length: 40, width: 12, fill: 0.9, parts: 1 };
const c = (title, look, levels, tint, cityId, point, extra = {}) => ({ title, cityId, house: { look, info: { levels, point, block: blk, type: "house", tint, ...extra } } });
const EU = ["sikma", "plocha", "nizky", "funkce", "moderni", "sorela", "typovy", "povalecny", "mestan", "vila", "kostka", "novyrd", "statek", "stit", "cihlovy", "dansky", "stenstad", "drevak", "puukaupunki", "tallinnamaja", "hanza", "haussmann", "stredomori", "azulejo", "galeria", "malta", "kypr"];
const NA = ["bayrow", "porchrow", "framehouse", "brickblock", "mainstreet", "stripmall", "brownstone", "tenement", "tripledecker", "baygable", "victorian", "podium", "slab"];
const which = process.argv[3] || "eu";
const only = process.env.LOOKS ? process.env.LOOKS.split(",") : null; // LOOKS=a,b: just these looks
if (only) { for (const l of [EU, NA]) for (let i = l.length - 1; i >= 0; i--) if (!only.includes(l[i])) l.splice(i, 1); }
const cells = [];
if (which === "eu") for (const look of EU) for (const [lv, t] of [[1, 0], [1, 2], [2, 1], [2, 3]]) cells.push(c(`${look} ${lv}NP t${t}`, look, lv, t, "praha", [14.42, 50.087]));
else for (const look of NA) for (const [lv, t] of [[1, 0], [1, 2], [2, 1], [2, 3]]) cells.push(c(`${look} ${lv}NP t${t}`, look, lv, t, "usa", [-77.2, 38.85]));
console.log(await renderCells(cells, process.argv[2], { k: 0.2, cols: +(process.env.COLS || 8), CW: 320, cut: 120 }));
