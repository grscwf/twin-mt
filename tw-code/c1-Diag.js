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
 * @prop {MacroContext} [context]
 * @prop {boolean} [showDebug]
 */

MT.diagHasProblem = false;
MT.diagMessages = /** @type {DiagMessage[]} */ ([]);

let diagCapture = false;
let diagDebugStop = false;
let diagSuppress = false;
let diagWasSeen = false;

const diagProblemTypes = ["fail", "warn"];

/**
 * Show a diagnostic.
 * @arg {unknown[]} args
 */
MT.diag = (...args) => {
  diagEmit({ type: "diag", values: args });
};

/** @type {(diag: DiagMessage) => void} */
const diagEmit = (diag) => {
  if (diagSuppress) return;

  console.log(diag);

  const type = diag.type || "diag";
  if (diagProblemTypes.includes(type)) {
    MT.diagHasProblem = true;
  }

  if (diagDebugStop) {
    debugger;
    diagDebugStop = false;
  }

  if (diagCapture) {
    MT.diagMessages.push(diag);
    return;
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
      diagCapture = false;
      diagDebugStop = false;
      diagSuppress = false;
      diagWasSeen = false;
    }
  });
  $(document).on(":passageend", () => {
    diagWasSeen = true;
  });
};

diagInit();
