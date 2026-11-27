// Where the recordings and outputs of the replay live: data/replay/ of the main repository (git ignores it, third-party
// data), one folder for every working copy. REPLAY_DATA=<folder> elsewhere.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const HERE = path.dirname(new URL(import.meta.url).pathname);
function mainRepo() {
  // The main working copy: the first of `git worktree list`.
  const out = execFileSync("git", ["worktree", "list", "--porcelain"], { cwd: HERE, encoding: "utf8" });
  return out.split("\n").find((l) => l.startsWith("worktree "))?.slice(9) || path.join(HERE, "..", "..");
}
export const DATA = process.env.REPLAY_DATA || path.join(mainRepo(), "data", "replay");
export const OUT = path.join(DATA, "out");
