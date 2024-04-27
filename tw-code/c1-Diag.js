/*
 * Show diag messages in boxes that can be dismissed.
 *
 * Structure is
 *   <div id="diag-outer">
 *     <div class="diag-box diag-box-${type}>
 *       <div class="diag-item"> ... </div>
 *       <div class="diag-item"> ... </div>
 *     </div>
 *     ...
 *   </div>
 *
 * Consecutive messages of the same type will be in the same box.
 */

/**
 * @typedef {object} DiagMessage
 * @prop {string} [type]
 * @prop {string} [text]
 * @prop {unknown[]} [values]
 * @prop {MacroContext | null | undefined} [context]
 * @prop {boolean} [showDebug]
 */

MT.diagHasError = false;
MT.diagHasWarning = false;
MT.diagMessages = /** @type {DiagMessage[]} */ ([]);

let diagDebugStop = false;
let diagQuiet = false;
let diagVeryQuiet = false;
let diagWasSeen = false;

/** @type {Record<string, string>} */
const diagTitles = {
  error: "Error",
  note: "Note",
  warn: "Warning",
};

/**
 * Show a note.
 * @type {(text: string) => void}
 */
MT.note = (text) => {
  diagEmit({ type: "note", text });
};

/**
 * Show a warning message.
 * @type {(text: string) => void}
 */
MT.warn = (text) => {
  MT.diagHasWarning = true;
  diagEmit({ type: "warn", text });
};

/**
 * Show an error message.
 * @type {(text: string, context?: MacroContext) => void}
 */
MT.error = (text, context) => {
  MT.diagHasError = true;
  diagEmit({ type: "error", text, context, showDebug: true });
};

/**
 * Show an error message and throw an error.
 * This is better than using throw directly,
 * because it sets `MT.diagHasError`.
 * (SugarCube sometimes captures and renders errors,
 * so we can't reliably tell "does running this throw an error")
 * @type {(text: string, context?: MacroContext) => never}
 */
MT.fail = (text, context) => {
  MT.error(text, context);
  throw new Error(text);
};

/**
 * If val is falsy, show an assertion failure and throw an error.
 * @arg {boolean} val
 * @arg {string} should
 * @arg {MacroContext} [context]
 * @return {asserts val}
 */
MT.assert = (val, should, context) => {
  if (!val) {
    MT.fail(`Assertion failed: ${should}`, context);
  }
};

/**
 * Asserts val is non-null
 * @template T
 * @arg {T} val
 * @arg {string} name
 * @arg {MacroContext} [context]
 * @return {asserts val is NonNullable<T>}
 */
MT.nonNull = (val, name, context) => {
  MT.assert(val != null, `${name} should not be null`, context);
};

/**
 * <<mt-assert (some js expression)>>
 */
Macro.add("mt-assert", {
  skipArgs: true,
  handler: function () {
    const expr = this.args.full;
    const rawExpr = this.args.raw;

    if (State.temporary.isTranscript) return;

    const val = MT.untraced(() => eval(expr));
    MT.assert(val, `(${rawExpr}) should be true`, this);
  },
});

/**
 * <<mt-fail some message>>
 */
Macro.add("mt-fail", {
  handler: function () {
    const text = this.args.join(" ");
    MT.fail(text, this);
  },
});

/**
 * Runs block without displaying diag messages,
 * and returns the messages captured.
 * @type {(block: () => void) => string[] | null}
 */
MT.diagQuietly = (block) => {
  const saveQuiet = diagQuiet;
  const saveMessages = MT.diagMessages;
  try {
    diagQuiet = true;
    MT.diagMessages = [];
    block();
    return MT.diagGetMessages();
  } finally {
    diagQuiet = saveQuiet;
    MT.diagMessages = saveMessages;
  }
};

/**
 * Runs block, suppressing messages.
 * Returns true if there were no error messages.
 * @type {(block: () => void) => boolean}
 */
MT.diagSucceeds = (block) => {
  const saveHasError = MT.diagHasError;
  const saveHasWarning = MT.diagHasWarning;
  const saveVeryQuiet = diagVeryQuiet;
  try {
    MT.diagHasError = false;
    diagVeryQuiet = true;
    block();
    return !MT.diagHasError;
  } catch (e) {
    return false;
  } finally {
    MT.diagHasError = saveHasError;
    MT.diagHasWarning = saveHasWarning;
    diagVeryQuiet = saveVeryQuiet;
  }
};

/** @type {() => string[] | null} */
MT.diagGetMessages = () => {
  if (MT.diagMessages.length === 0) return null;

  /** @type {string[]} */
  const messages = [];
  for (const diag of MT.diagMessages) {
    let msg = diag.type || "note";
    msg += ": ";
    msg += diag.text || "";
    if (diag.values) {
      for (const val of diag.values) {
        msg += val == null ? String(val) : MT.json(val);
      }
    }
    messages.push(msg);
  }
  return messages;
};

/** @type {(diag: DiagMessage) => void} */
const diagEmit = (diag) => {
  if (diagVeryQuiet) return;

  console.log(diag);
  MT.diagMessages.push(diag);

  if (diagQuiet) return;

  if (diagDebugStop) {
    debugger;
    diagDebugStop = false;
  }

  let outer = $("#diag-outer");
  if (!outer.length) {
    outer = $(`<div id="diag-outer">`).appendTo("#story");
  }

  const type = diag.type || "note";
  let box = $(outer).find(".diag-box").last();
  if (!box.length || !box.hasClass(`diag-box-${type}`)) {
    box = $(`<div class="diag-box diag-box-${type}">`).appendTo(outer);
    const title = diagTitles[type] || "Note";
    $(`<span class="diag-title">`).text(title).appendTo(box);
    $(`<a class="diag-close">[close]</a>`)
      .on("click", () => {
        box.remove();
      })
      .appendTo(box);
    if (diag.showDebug && setup.playtest) {
      $(`<a class="diag-debug">[debug]</a>`)
        .on("click", () => {
          diagDebugStop = true;
          Engine.play(State.passage, true);
        })
        .appendTo(box);
    }
  }

  let item = $(`<div class="diag-item">`).appendTo(box);

  if (diag.text) {
    $(`<span class="diag-text">`).text(diag.text).appendTo(item);
  }

  if (diag.values) {
    for (const val of diag.values) {
      const str = val == null ? String(val) : MT.json(val);
      $(`<span class="diag-value">`).text(str).appendTo(item);
    }
  }

  if (diag.context) {
    $(`<span class="diag-context">`)
      .text(diagBacktrace(diag.context))
      .appendTo(item);
  }
};

/** @type {(context: MacroContext | null | undefined) => string} */
const diagBacktrace = (context) => {
  let trace = "";
  while (context != null) {
    if (context.displayName === "include") {
      trace += context.source + "\n";
    }
    context = /** @type {MacroContext | null | undefined} */ (context.parent);
  }
  return trace;
};

const diagClear = () => {
  $("#diag-outer").remove();
  MT.diagHasError = false;
  MT.diagHasWarning = false;
  MT.diagMessages = [];
  diagQuiet = false;
  diagDebugStop = false;
  diagVeryQuiet = false;
  diagWasSeen = false;
};

$(document).on(":passageinit", () => {
  if (diagWasSeen) {
    diagClear();
  }
});

$(document).on(":passageend", () => {
  diagWasSeen = true;
});

// Clear diag when player clicks on a passage link
document.getElementById("story")?.addEventListener(
  "click",
  (ev) => {
    const el = /** @type {Node} */ (ev.target);
    const a = $(el).closest("a");
    if (a.length && a.attr("data-passage") != null) {
      diagClear();
    }
  },
  true
);
