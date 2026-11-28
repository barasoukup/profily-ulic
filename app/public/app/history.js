// Undo and redo of every change of the profile, and edited(), which every change calls.
import { t as tr } from "../i18n.js";
import { state, $, status, render } from "./state.js";
import { save } from "./storage.js";

// Every change of the profile (dragging, the editor, the palette, edges) can be taken back: the
// state before it goes on a stack. A new cut or a loaded file starts a fresh history.
const UNDO_MAX = 50;
export const undoStack = [], redoStack = [];
let baseline = null; // the profile as it was after the last change
const snapshot = () => JSON.stringify({ stav: state.stav, navrh: state.navrh, navrhEdited: state.navrhEdited });
export function resetHistory() {
  undoStack.length = redoStack.length = 0;
  baseline = state.stav ? snapshot() : null;
  showUndo();
}
function showUndo() {
  $("#btn-undo").disabled = !undoStack.length;
  $("#btn-redo").disabled = !redoStack.length;
  $("#undo-bar").hidden = !undoStack.length && !redoStack.length;
}
function applySnapshot(json) {
  Object.assign(state, JSON.parse(json), { selected: null });
  baseline = json;
  save();
  render();
  showUndo();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  applySnapshot(undoStack.pop());
  status(tr("app.changeUndone"), "ok");
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  applySnapshot(redoStack.pop());
  status("");
}
$("#btn-undo").onclick = undo;
$("#btn-redo").onclick = redo;
addEventListener("keydown", (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z" || e.target.closest?.("input, select, textarea")) return;
  e.preventDefault();
  if (e.shiftKey) redo(); else undo();
});
export function edited() {
  if (state.mode === "navrh") state.navrhEdited = true;
  else if (state.fixing) state.stavEdited = true;
  // Once the design is changed here, the address no longer holds it: a reload keeps the saved work.
  if (location.hash.includes("&")) history.replaceState(null, "", location.hash.split("&")[0]);
  const now = snapshot();
  if (baseline && baseline !== now) {
    undoStack.push(baseline);
    if (undoStack.length > UNDO_MAX) undoStack.shift();
    redoStack.length = 0;
  }
  baseline = now;
  save();
  showUndo();
}
