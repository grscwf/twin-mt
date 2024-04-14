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
 * If val is falsy, show an assertion failure and throw an error.
 * @arg {boolean} val
 * @arg {string} should
 * @arg {MacroContext} [context]
 * @return {asserts val}
 */
MT.assert = (val, should, context) => {
  if (!val) {
    const text = `Assertion failed: ${should}`;
    MT.error(text, context);
    throw new Error(text);
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
}

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
 * Runs block, capturing messages without displaying them.
 * @type {(block: () => void) => void}
 */
MT.diagQuietly = (block) => {
  const saveQuiet = diagQuiet;
  try {
    diagQuiet = true;
    block();
  } finally {
    diagQuiet = saveQuiet;
  }
};

/**
 * Runs block, suppressing messages.
 * Returns true if there were no fail messages.
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
  let box = $(outer).last();
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

const diagInit = () => {
  $(document).on(":passageinit", () => {
    if (diagWasSeen) {
      $("#diag-outer").remove();
      MT.diagHasError = false;
      MT.diagHasWarning = false;
      MT.diagMessages = [];
      diagQuiet = false;
      diagDebugStop = false;
      diagVeryQuiet = false;
      diagWasSeen = false;
    }
  });
  $(document).on(":passageend", () => {
    diagWasSeen = true;
  });
};

diagInit();
