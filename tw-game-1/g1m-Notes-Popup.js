MT.notesPopupInit = () => {
  const T = State.temporary;
  const V = State.variables;
  const noteStore = window.sessionStorage;

  T.savedVal = "";
  T.editVal = "";
  T.hasConflict = false;

  $(document).one(":dialogopening", () => {
    $("#NP-input").on("input", onInput);
    restoreSession();
    appendSelected();
    appendMessages();
    uiUpdate();
  });

  $(document).one(":dialogopened", () => {
    $("#NP-input").trigger("focus");
  });

  /** @type {(text: string) => void} */
  function appendQuoted(text) {
    text = text.trim();
    if (text === "") return;
    const q = text.replace(/^/gm, "-> ") + "\n";
    let val = T.editVal.trim();
    if (val !== "" && val.slice(-1) !== "\n") {
      val += "\n";
    }
    val += q;
    $("#NP-input").val(val);
    saveValue(val);
  }

  function appendSelected() {
    if (MT.selectedText == null || MT.selectedText === "") return;
    appendQuoted(MT.selectedText);
  }
  function appendMessages() {
    const msgs = MT.diagGetMessages();
    if (msgs != null) {
      appendQuoted(msgs.join("\n") + "\n");
    }
  }

  function restoreSession() {
    const origin = T.notesOrigin;
    MT.nonNull(origin, "notesOrigin");
    T.savedVal = MT.notesGet(origin);
    T.editVal = noteStore.getItem("notes-single:" + origin) || T.savedVal;
    $("#NP-input").val(T.editVal);
    T.hasConflict = T.savedVal.trimEnd() !== T.editVal.trimEnd();
  }

  function uiUpdate() {
    $("#NP-conflict").toggleClass("NP-conflict-hidden", !T.hasConflict);
  }

  function onInput() {
    const input = /** @type {HTMLTextAreaElement} */ (
      document.getElementById("NP-input")
    );
    saveValue(input.value, false);
  }

  /** @type {(val: string, overwrite?: boolean) => void} */
  function saveValue(val, overwrite) {
    const origin = T.notesOrigin;
    MT.nonNull(origin, "notesOrigin");
    T.editVal = val;
    if (overwrite || !T.hasConflict) {
      T.savedVal = MT.notesTryReplace(origin, T.savedVal, T.editVal);
    }
    T.hasConflict = T.savedVal.trimEnd() !== T.editVal.trimEnd();
    const key = "notes-single:" + origin;
    if (T.hasConflict) {
      noteStore.setItem(key, val);
    } else {
      noteStore.removeItem(key);
    }
    uiUpdate();
  }

  T.addCurrentState = () => {
    const wasRead = [...MT.trace.wasRead].sort();
    const vars = /** @type {Record<string, unknown>} */ (
      State.current.variables
    );
    /** @type {Record<string, unknown>} */
    const obj = {};
    for (const vn of wasRead) {
      const val = vars[vn];
      if (val != null) obj[vn] = val;
    }
    const json = JSON.stringify(obj);
    const text = `enterState = ${json}`;
    const newVal = T.editVal + "\n" + text;
    $("#NP-input").val(newVal);
    saveValue(newVal, false);
  };
};
