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

MT.diagHasProblem = false;
MT.diagMessages = /** @type {DiagMessage[]} */ ([]);

let diagDebugStop = false;
let diagQuiet = false;
let diagVeryQuiet = false;
let diagWasSeen = false;

const diagProblemTypes = ["fail"];

/**
 * Show a generic diag message.
 * @arg {unknown[]} args
 */
MT.diag = (...args) => {
  if (typeof args[0] === "string") {
    diagEmit({ type: "diag", text: args[0], values: args.slice(1) });
  } else {
    diagEmit({ type: "diag", values: args });
  }
};

/**
 * Show a fail message.
 * @type {(text: string, context?: MacroContext) => void}
 */
MT.fail = (text, context) => {
  diagEmit({ type: "fail", text, context, showDebug: true });
};

/**
 * Show a warning message.
 * @type {(text: string) => void}
 */
MT.warn = (text) => {
  diagEmit({ type: "warn", text });
};

/**
 * @arg {boolean | null | undefined} val
 * @arg {string} should
 * @arg {MacroContext} [context]
 * @returns {asserts val}
 */
MT.assert = (val, should, context) => {
  if (val) return;
  MT.fail(should, context);
  throw new Error(`Assertion failed: ${should}`);
};

Macro.add("em-assert", {
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
  const save = diagQuiet;
  try {
    diagQuiet = true;
    block();
  } finally {
    diagQuiet = save;
  }
};

/**
 * Runs block, suppressing messages.
 * Returns true if there were no fail messages.
 * @type {(block: () => void) => boolean}
 */
MT.diagSucceeds = (block) => {
  const saveHasProblem = MT.diagHasProblem;
  const saveVeryQuiet = diagVeryQuiet;
  try {
    MT.diagHasProblem = false;
    diagVeryQuiet = true;
    block();
    return !MT.diagHasProblem;
  } catch (e) {
    return false;
  } finally {
    MT.diagHasProblem = saveHasProblem;
    diagVeryQuiet = saveVeryQuiet;
  }
};

/** @type {(diag: DiagMessage) => void} */
const diagEmit = (diag) => {
  const type = diag.type || "diag";
  if (diagProblemTypes.includes(type)) {
    MT.diagHasProblem = true;
  }

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

  let box = $(outer).last();
  let addButtons = false;
  if (!box.length || !box.hasClass(`diag-box-${type}`)) {
    box = $(`<div class="diag-box diag-box-${type}">`).appendTo(outer);
    addButtons = true;
  }

  let item = $(`<div class="diag-item">`).appendTo(box);

  if (addButtons) {
    $(`<a class="diag-close">[close]</a>`)
      .on("click", () => {
        box.remove();
      })
      .appendTo(item);
    if (diag.showDebug && setup.playtest) {
      $(`<a class="diag-debug">[debug]</a>`)
        .on("click", () => {
          diagDebugStop = true;
          Engine.play(State.passage, true);
        })
        .appendTo(item);
    }
  }

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
      MT.diagHasProblem = false;
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
