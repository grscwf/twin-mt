MT.selectedText = "";

// State.metadata.get always deflates and deserializes from localStorage, but:
// - we almost always want the localStorage value that might be modified
//   by another tab.
// - the cacheable calls to getAll don't happen often enough to make it
//   worth caching.

MT.notesGetAll = () => State.metadata.get("mi_notes") || "";

/** @type {(val: string) => void} */
const notesSetAll = (val) => State.metadata.set("mi_notes", val);

/** @type {(pageName: string) => { count: number, hasNoteHere: boolean }} */
const notesGetStats = (pageName) => {
  let count = 0;
  let hasNoteHere = false;
  const nFull = "\n" + MT.notesGetAll();
  for (const m of nFull.matchAll(/\n\[page ([^\n\]]+)\]\n/g)) {
    count += 1;
    if (m[1] === pageName) hasNoteHere = true;
  }
  return { count, hasNoteHere };
};

/** @type {(old: string, val: string) => string} */
MT.notesTryReplaceAll = (old, val) => {
  const cur = MT.notesGetAll().trimEnd();
  if (old.trimEnd() !== cur) return cur;
  val = val.trimEnd();
  notesSetAll(val);
  notesUpdateStatus();
  return val;
};

/** @type {(text: string) => string} */
MT.notesCleanup = (text) => {
  text = "\n" + text + "\n";
  const parts = text.split(/\n\[page\s+(.*?)\]\s*?\n/);
  const before = parts.shift()?.trimEnd().slice(1) || "";
  /** @type {Array<[string, string]>} */
  const keep = [];
  for (let i = 0; i < parts.length; i += 2) {
    const pageName = parts[i]?.trim() || "";
    const body = parts[i + 1]?.trimEnd() || "";
    if (body === "") continue;
    keep.push([pageName, body]);
  }
  keep.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? +1 : 0));
  let result = "";
  if (before !== "") result += before + "\n";
  for (const [pageName, body] of keep) {
    result += `[page ${pageName}]\n${body}\n\n`;
  }
  return result;
};

/**
 * @typedef {object} SplitResult
 * @prop {string} before
 * @prop {string} header
 * @prop {string} body
 * @prop {string} after
 */

/**
 * @type {(pageName: string, text: string) => SplitResult}
 */
const notesSplitAt = (pageName, text) => {
  let nText = "\n" + text;
  if (nText.slice(-1) !== "\n") nText += "\n";
  const nHeader = `\n[page ${pageName}]\n`;
  let pos = 0;
  while ((pos = nText.indexOf(nHeader, pos)) >= 0) {
    let end = nText.indexOf("\n[page ", pos + 1);
    if (end < 0) end = nText.length;
    return {
      before: nText.slice(1, pos + 1),
      header: nText.slice(pos + 1, pos + nHeader.length),
      body: nText.slice(pos + nHeader.length, end + 1).trimEnd(),
      after: nText.slice(end + 1).trimEnd(),
    };
  }
  return {
    before: nText.slice(1),
    header: nHeader.slice(1),
    body: "",
    after: "",
  };
};

/** @type {(pageName: string) => string} */
MT.notesGet = (pageName) => {
  const full = MT.notesGetAll();
  const split = notesSplitAt(pageName, full);
  return split.body;
};

/** @type {(text: string) => string} */
MT.notesUnwrap = (text) => {
  text = notesRemoveSection("version", text);
  text = notesRemoveSection("player trail", text);
  text = text.trim();
  if (text.startsWith("[preamble]")) {
    text = text.slice("[preamble]".length).trim();
  }
  return text;
};

/** @type {(name: string, text: string) => string} */
const notesRemoveSection = (name, text) => {
  const re = new RegExp(`^\\[${name}\\]`, "m");
  const m = re.exec(text);
  if (m == null) return text;

  let result = text.slice(0, m.index).trim() + "\n";

  const m2 = /^\[/m.exec(text.slice(m.index + 1));
  if (m2 != null) {
    result += text.slice(m.index + 1 + m2.index);
  }
  return result;
};

/**
 * If page note is old, overwrite it with val,
 * then returns the note (either val or conflict)
 *
 * @type {(pageName: string, old: string, val: string) => string}
 */
MT.notesTryReplace = (pageName, old, val) => {
  const full = MT.notesGetAll();
  const sp = notesSplitAt(pageName, full);
  if (sp.body !== old.trimEnd()) return sp.body;
  const replace = /\S/.test(val) ? sp.header + val.trimEnd() + "\n\n" : "";
  const next = sp.before + replace + sp.after;
  notesSetAll(next);
  notesUpdateStatus();
  return val.trimEnd();
};

// capture selection before click deselects it
const notesPointerDown = () => {
  MT.selectedText = getSelection()?.toString().trim() || "";
};

const notesOpenPopup = () => {
  const T = State.temporary;
  T.notesOrigin = State.passage;
  if (T.notesVariant != null) {
    T.notesOrigin += " - " + T.notesVariant;
  }
  const popupText = Story.get("g1m Notes Popup").text;
  Dialog.setup("");
  Dialog.wiki(popupText);
  Dialog.open();
};

const notesRenderButton = () => {
  $("#notes-button").remove();
  const outer = $("<div>")
    .attr("id", "notes-button")
    .on("pointerdown", notesPointerDown)
    .on("click", notesOpenPopup)
    .appendTo("#story");
  $("<div>").attr("id", "notes-line-1").text("notes").appendTo(outer);
  const line2 = $("<div>").attr("id", "notes-line-2").appendTo(outer);
  $("<span>").attr("id", "notes-count").appendTo(line2);
  notesUpdateStatus();
};

const notesUpdateStatus = () => {
  const st = notesGetStats(State.passage);
  $("#notes-button").toggleClass("notes-has-note", st.hasNoteHere);
  $("#notes-button").toggleClass("notes-non-zero", st.count > 0);
  $("#notes-count").text(`${st.count}`);
};

MT.mdDefIgnored("mi_notes");
MT.mdDefIgnored("mi_notesNoTrail");

if (setup.playtest) {
  $(document).on(":passagedisplay", notesRenderButton);
}
