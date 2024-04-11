(() => {
  /** @typedef {import("twine-sugarcube").MacroContext} MacroContext */

  MT.hasFails = false;
  MT.hasWarnings = false;
  MT.messages = [];

  let debugStop = false;
  let suppress = false;

  $(document).on(":passagestart", () => {
    $("#EM-outer").remove();
    MT.hasFails = false;
    MT.hasWarnings = false;
    MT.messages = [];
  });

  MT.suppressErrors = (fn) => {
    const save = suppress;
    try {
      suppress = true;
      fn();
    } finally {
      suppress = save;
    }
  };

  MT.runsWithoutFail = (fn) => {
    const save = { hf: MT.hasFails, sup: suppress };
    try {
      MT.hasFails = false;
      suppress = true;
      fn();
      return !MT.hasFails;
    } catch (e) {
      return false;
    } finally {
      MT.hasFails = save.hf;
      suppress = save.sup;
    }
  };

  /**
   * Add str as a new error-message note.
   * @type {(message?: string, header?: string) => JQuery<HTMLElement> | undefined}
   */
  MT.note = (message, header) => {
    if (suppress) return;
    if (message != null) {
      console.log(`note: ${header} ${message}`);
      MT.messages.push(header == null ? message : `${header}: ${message}`);
    }
    const note = $(`
      <div class="EM-note">
        <a class="EM-close EM-button">[close]</a>
      </div>
    `).appendTo(getInner());
    if (header != null && header !== "") {
      note.append(document.createTextNode(header));
      note.append(document.createElement("br"));
    }
    if (message != null) {
      note.append(document.createTextNode(message));
    }
    note.find(".EM-close").on("click", () => note.remove());
    return note;
  };

  /** Add str as a warning. */
  MT.warn = (str) => {
    MT.hasWarnings = true;
    MT.note(str, "Warning");
  };

  /** Add str as a new error-message assertion failure. */
  MT.fail = (str, context) => {
    MT.hasFails = true;
    message("fail", str, context);
  };

  /**
   * @arg {string} type
   * @arg {string} str
   * @arg {MacroContext} [context]
   */
  function message(type, str, context) {
    if (suppress) return;
    if (debugStop) {
      debugger;
      debugStop = false;
    }
    MT.messages.push(`${type}: ${str}`);
    const trace = backtrace(context);
    if (trace != null && trace !== "") {
      MT.messages.push(trace);
    }

    const fails = getFails();
    if (fails != null) {
      const div = $(`<div class="EM-${type}">`).text(str).appendTo(fails);
      if (trace != null && trace !== "") {
        $("<div class=EM-trace>").text(trace).appendTo(div);
      }
    }
  }

  MT.assert = (val, str, context) => {
    if (val) return;
    MT.fail(str, context);
  };

  Macro.add("em-assert", {
    skipArgs: true,
    handler: function () {
      if (State.temporary.isTranscript) return;
      const val = MT.untraced(() => eval(this.args.full));
      MT.assert(val, `expected: ${this.args.raw}`, this);
    },
  });

  /**
   * @arg {MacroContext | null | undefined} ctx
   */
  function backtrace(ctx) {
    let trace = "";
    for (; ctx != null; ctx = /** @type {MacroContext | null} */ (ctx.parent)) {
      if (ctx.displayName === "include") {
        trace += ctx.source + "\n";
      }
    }
    return trace;
  }

  function getInner() {
    let inner = $("#EM-inner");
    if (inner.length === 1) return inner;
    inner.remove();
    $("#EM-outer").remove();
    const outer = $(`
      <div id="EM-outer">
        <div id="EM-inner"></div>
      </div>
    `).appendTo("#story");
    inner = outer.find("#EM-inner");
    return inner;
  }

  function getFails() {
    const fails = $("#EM-fails");
    if (fails.length === 1) return fails;
    fails.remove();

    const note = MT.note();
    if (note == null) return;
    note.attr("id", "EM-fails");
    note.append(`
      <a id=EM-debug class=EM-button>[debug]</a>
      <div class=EM-fail-intro>
        Assertions failed.
        Passage may be nonsensical.
      </div>
    `);
    note.find("#EM-debug").on("click", () => {
      debugStop = true;
      Engine.play(State.passage, true);
    });
    return note;
  }
})();
