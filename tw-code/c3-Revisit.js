/** @type {number | null} */
let revisitTop = null;

/**
 * Runs block and reloads current page.
 * @type {(block: (oldState: SugarCubeStoryVariables) => void) => void}
 */
MT.revisitHere = (block) => {
  MT.traceStop();
  revisitTop = $("html").prop("scrollTop");
  const oldActive = State.active.variables;
  State.active.variables = clone(State.current.variables);
  block && block(oldActive);
  Engine.play(State.passage);
  $("html").addClass("revisit-here");
};

Macro.add("revisit-here", {
  handler: () => {
    setTimeout(MT.revisitHere);
  },
});

$(document).on(":passageend", () => {
  $("html").removeClass("revisit-here");
  if (revisitTop != null) {
    document.documentElement.scroll(0, revisitTop);
    revisitTop = null;
  }
});
