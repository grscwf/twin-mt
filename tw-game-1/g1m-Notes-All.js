MT.notesAllStart = () => {
  const T = State.temporary;
  const noteStore = window.sessionStorage;

  T.savedVal = "";
  T.editVal = "";
  T.hasConflict = false;

  T.canShare =
    navigator.canShare && navigator.canShare({ title: "1", text: "2" });

  $(document).one(":passagedisplay", () => {
    $("#notes-input").on("input", onInput);
    $("#notes-copy").on("click", copyToClipboard);
    $("#notes-clean").on("click", confirmClean);
    $("#notes-delete").on("click", confirmDelete);
    $("#notes-lose").on("click", confirmLose);
    $("#notes-overwrite").on("click", confirmOverwrite);
    $("#notes-save").on("click", saveToFile);
    $("#notes-load").on("click", loadFromFile);
    $("#notes-load-file").on("change", (ev) => loadFilePicked(ev.target));
    $("#notes-share").prop("disabled", T.canShare).on("click", doShare);
    $("input[name=notes-add-trail]").on("change", toggleTrail);
    restoreSession();
    uiUpdate();
  });

  function restoreSession() {
    T.savedVal = MT.notesGetAll();
    T.editVal = noteStore.getItem("notes-full") || T.savedVal;
    $("#notes-input").val(T.editVal);
    T.hasConflict = T.savedVal.trimEnd() !== T.editVal.trimEnd();

    const noTrail = MT.mdGetUncached("mi_notesNoTrail");
    $("input[name=notes-add-trail]").prop("checked", !noTrail);
    renderTrail();
  }

  function uiUpdate() {
    $("#notes-conflict").toggleClass("notes-has-conflict", T.hasConflict);
    if (T.hasConflict) $("#notes-conflict textarea").val(T.savedVal);
    const hasEdit = T.editVal.trimEnd() !== "";
    const hasData = T.savedVal.trimEnd() !== "" || hasEdit;
    const addTrail = $("input[name=notes-add-trail]").prop("checked");
    $("#notes-delete").prop("disabled", !hasData || T.hasConflict);
    $("#notes-clean").prop("disabled", !hasEdit);
    $("#notes-copy").prop("disabled", !hasEdit && !addTrail);
    $("#notes-save").prop("disabled", !hasEdit && !addTrail);
    $("#notes-load").prop("disabled", T.hasConflict);
    $("#notes-share").prop("disabled", !hasEdit && !addTrail);
  }

  function toggleTrail() {
    const addTrail = $("input[name=notes-add-trail]").prop("checked");
    MT.mdSet("mi_notesNoTrail", !addTrail);
    renderTrail();
    uiUpdate();
  }

  function renderTrail() {
    const addTrail = $("input[name=notes-add-trail]").prop("checked");
    const textarea = $("#notes-trail");
    if (!addTrail) {
      textarea.val("");
      return;
    }

    let render = "[\n";
    for (let i = 0, n = State.length; i < n; i++) {
      const step = State.history[i];
      MT.nonNull(step, `step ${i}`);
      render += `  { t: ${MT.json(step.title)}`;
      /** @type {string[]} */
      const read = JSON.parse(step.variables.g_varsRead || "[]");
      /** @type {Record<string, unknown>} */
      const obj = {};
      for (const v of read) {
        const vars = /** @type {Record<string, unknown>} */ (step.variables);
        obj[v] = vars[v];
      }
      const json = MT.json(obj);
      if (json !== "{}") {
        render += `, vars: ${MT.json(obj)}`;
      }
      render += " },\n";
    }
    render += "]\n";
    textarea.val(render);
  }

  function onInput() {
    const val = $("#notes-input").val();
    MT.assert(typeof val === "string", "notes-input not a string?");
    saveValue(val, false);
  }

  /** @type {(val: string) => void} */
  function overwriteValue(val) {
    $("#notes-input").val(val);
    saveValue(val, true);
  }

  /** @type {(val: string, overwrite: boolean) => void} */
  function saveValue(val, overwrite) {
    T.editVal = val;
    if (overwrite || !T.hasConflict) {
      T.savedVal = MT.notesTryReplaceAll(T.savedVal, T.editVal);
    }
    T.hasConflict = T.savedVal.trimEnd() !== T.editVal.trimEnd();
    if (T.hasConflict) {
      noteStore.setItem("notes-full", T.editVal);
    } else {
      noteStore.removeItem("notes-full");
    }
    uiUpdate();
  }

  T.doClean = () => {
    saveValue(MT.notesCleanup(T.editVal), false);
    $("#notes-input").val(T.editVal);
  };
  function confirmClean() {
    Dialog.setup("Confirm Clean Up");
    Dialog.wiki(`<<nobr>>
      Clean-up will remove empty notes and sort the remaining notes
      by page name.
      ?P
      <<button "Clean up">><<run Dialog.close(); _doClean()>><</button>>
      <</nobr>>
    `);
    Dialog.open();
  }

  T.doDelete = () => overwriteValue("");
  function confirmDelete() {
    Dialog.setup("Confirm Delete All");
    Dialog.wiki(`<<nobr>>
      Are you sure you want to delete ALL notes?
      ?P
      <<button "Delete all">><<run Dialog.close(); _doDelete()>><</button>>
      <</nobr>>
    `);
    Dialog.open();
  }

  T.doLose = () => overwriteValue(T.savedVal);
  function confirmLose() {
    Dialog.setup("Confirm Lose Edits");
    Dialog.wiki(`<<nobr>>
      Are you sure you want to lose your edits and revert to the conflicting value?
      ?P
      <<button "Lose edits">><<run Dialog.close(); _doLose()>><</button>>
      <</nobr>>
    `);
    Dialog.open();
  }

  T.doOverwrite = () => overwriteValue(T.editVal);
  function confirmOverwrite() {
    Dialog.setup("Confirm Overwrite Conflict");
    Dialog.wiki(`<<nobr>>
      Are you sure you want to overwrite the conflicting value with your edits?
      ?P
      <<button "Overwrite conflict">><<run Dialog.close(); _doOverwrite()>><</button>>
      <</nobr>>
    `);
    Dialog.open();
  }

  function getText() {
    let text = `[version]\n${setup.version}\n`;

    if (!T.editVal.trim().startsWith("[")) {
      text += "[preamble]\n";
    }

    text += T.editVal;
    if (text.slice(-1) !== "\n") text += "\n";

    const trail = $("#notes-trail").val();
    if (trail !== "") {
      text += `[player trail]\n` + trail;
    }
    return text;
  }

  function copyToClipboard() {
    const text = getText();
    navigator.clipboard.writeText(text);
    Dialog.setup();
    Dialog.wiki("All notes copied to clipboard");
    Dialog.open();
  }

  function makeTitle() {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const HH = String(now.getHours()).padStart(2, "0");
    const MM = String(now.getMinutes()).padStart(2, "0");
    const SS = String(now.getSeconds()).padStart(2, "0");
    const title = `MagesTowerNotes-${yyyy}-${mm}-${dd}-${HH}${MM}${SS}.txt`;
    return title;
  }

  function saveToFile() {
    const fname = makeTitle();
    const text = getText();
    const blob = new Blob([text], { type: "text/plain;charset=UTF-8" });
    /* saveAs is from filesaver.js, bundled with sugarcube-2 */
    saveAs(blob, fname);
  }

  function loadFromFile() {
    $("#notes-load-file").click();
  }

  /** @type {(target: HTMLElement) => void} */
  function loadFilePicked(target) {
    const reader = new FileReader();
    $(reader).one("loadend", () => {
      if (reader.error) throw reader.error;
      let text = reader.result;
      MT.assert(typeof text === "string", "non-string from file?");
      text = MT.notesUnwrap(text);
      overwriteValue(text);
    });
    MT.assert(target instanceof HTMLInputElement, "loadFilePicked bug?");
    MT.nonNull(target.files, "target.files");
    const file = target.files[0];
    MT.nonNull(file, "target.files[0]");
    reader.readAsText(file);
  }

  function doShare() {
    const title = makeTitle();
    const text = getText();
    navigator.share({ title, text });
  }
};
