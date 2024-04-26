MT.notesSingleSetup = () => {
  const T = State.temporary;
  const V = State.variables;
  const noteStore = window.sessionStorage;

  T.savedVal = "";
  T.editVal = "";
  T.hasConflict = false;

  $(document).one(":passagedisplay", () => {
    $("#notes-input").on("input", onInput);
    $("#notes-delete").on("click", confirmDelete);
    $("#notes-lose").on("click", confirmLose);
    $("#notes-force").on("click", confirmOverwrite);
    restoreSession();
    uiUpdate();
  });

  function restoreSession() {
    MT.nonNull(V.g_notesOrigin, "notesOrigin");
    T.savedVal = MT.notesGet(V.g_notesOrigin);
    T.editVal =
      noteStore.getItem("notes-single:" + V.g_notesOrigin) || T.savedVal;
    $("#notes-input").val(T.editVal);
    T.hasConflict = T.savedVal.trimEnd() !== T.editVal.trimEnd();
  }

  function uiUpdate() {
    $("#notes-conflict").toggleClass("notes-has-conflict", T.hasConflict);
    if (T.hasConflict) $("#notes-conflict textarea").val(T.savedVal);
    const hasData = T.savedVal.trimEnd() !== "" || T.editVal.trimEnd() !== "";
    $("#notes-delete").prop("disabled", !hasData || T.hasConflict);
  }

  function onInput() {
    const val = $("#notes-input").val();
    MT.assert(typeof val === "string", "notes-input is not a string?");
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
      MT.nonNull(V.g_notesOrigin, "notesOrigin");
      T.savedVal = MT.notesTryReplace(V.g_notesOrigin, T.savedVal, T.editVal);
    }
    T.hasConflict = T.savedVal.trimEnd() !== T.editVal.trimEnd();
    const key = "notes-single:" + V.g_notesOrigin;
    if (T.hasConflict) {
      noteStore.setItem(key, val);
    } else {
      noteStore.removeItem(key);
    }
    uiUpdate();
  }

  T.doDelete = () => overwriteValue("");
  function confirmDelete() {
    Dialog.setup("Confirm Delete");
    Dialog.wiki(`<<nobr>>
      Are you sure you want to delete this note?
      ?P
      <<button Delete>><<run Dialog.close(); _doDelete()>><</button>>
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
};
