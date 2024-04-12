/** @typedef {import("twine-sugarcube").MacroContext} MacroContext */

MT.hasFails = false;
MT.hasWarnings = false;

/** @type {string[]} */
MT.messages = [];

let emDebugStop = false;
let emSuppress = false;

$(document).on(":passagestart", () => {
  $("#EM-outer").remove();
  MT.hasFails = false;
  MT.hasWarnings = false;
  MT.messages = [];
});

/** @type {(block: () => void) => void} */
MT.suppressErrors = (block) => {
  const save = emSuppress;
  try {
    emSuppress = true;
    block();
  } finally {
    emSuppress = save;
  }
};

/** @type {(block: () => void) => boolean} */
MT.runsWithoutFail = (block) => {
  const save = { hf: MT.hasFails, sup: emSuppress };
  try {
    MT.hasFails = false;
    emSuppress = true;
    block();
    return !MT.hasFails;
  } catch (e) {
    return false;
  } finally {
    MT.hasFails = save.hf;
    emSuppress = save.sup;
  }
};

/**
 * Add str as a new error-message note.
 * @type {(message?: string, header?: string) => JQuery<HTMLElement> | undefined}
 */
MT.note = (message, header) => {
  if (emSuppress) return;
  if (message != null) {
    console.log(`note: ${header} ${message}`);
    MT.messages.push(header == null ? message : `${header}: ${message}`);
  }
  const note = $(`
      <div class="EM-note">
        <a class="EM-close EM-button">[close]</a>
      </div>
    `).appendTo(emGetInner());
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

/**
 * Add str as a warning.
 * @type {(str: string) => void} */
MT.warn = (str) => {
  MT.hasWarnings = true;
  MT.note(str, "Warning");
};

/**
 * Add str as a new error-message assertion failure.
 * @type {(str: string, context?: MacroContext) => void}
 */
MT.fail = (str, context) => {
  MT.hasFails = true;
  emMessage("fail", str, context);
};

/**
 * @arg {string} type
 * @arg {string} str
 * @arg {MacroContext} [context]
 */
const emMessage = (type, str, context) => {
  if (emSuppress) return;
  if (emDebugStop) {
    debugger;
    emDebugStop = false;
  }
  MT.messages.push(`${type}: ${str}`);
  const trace = emBacktrace(context);
  if (trace != null && trace !== "") {
    MT.messages.push(trace);
  }

  const fails = emGetFails();
  if (fails != null) {
    const div = $(`<div class="EM-${type}">`).text(str).appendTo(fails);
    if (trace != null && trace !== "") {
      $("<div class=EM-trace>").text(trace).appendTo(div);
    }
  }
};

/**
 * @arg {boolean | null | undefined} val
 * @arg {string} str
 * @arg {MacroContext} [context]
 * @returns {asserts val}
 */

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
const emBacktrace = (ctx) => {
  let trace = "";
  for (; ctx != null; ctx = /** @type {MacroContext | null} */ (ctx.parent)) {
    if (ctx.displayName === "include") {
      trace += ctx.source + "\n";
    }
  }
  return trace;
};

const emGetInner = () => {
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
};

const emGetFails = () => {
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
    emDebugStop = true;
    Engine.play(State.passage, true);
  });
  return note;
};
