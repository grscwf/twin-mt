/** @type {string[]} */
const diagMessages = [];

/**
 * Queue a diag message.
 * @type {(...args: unknown[]) => void}
 */
MT.diag = (...args) => {
  console.log(args);
  diagMessages.push(
    args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")
  );
};

/** Show pending diag messages. */
MT.diagReport = () => {
  $("#mt-diag").remove();
  if (diagMessages.length) {
    const div = $("<div id=mt-diag>").prependTo("#story");
    for (const msg of diagMessages) {
      $("<div>").text(msg).appendTo(div);
    }
  }
};

/** Clear diag messages that were shown */
const diagClear = () => {
  const div = $("#mt-diag");
  if (div.length) {
    div.remove();
    diagMessages.length = 0;
  }
};

const diagInit = () => {
  $(document).on(":passageinit", diagClear);
  $(document).on(":passageend", MT.diagReport);
};

diagInit();
