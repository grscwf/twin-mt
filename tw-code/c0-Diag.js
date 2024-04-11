(() => {
  /** @type {string[]} */
  const messages = [];

  /**
   * Queue a diag message.
   * @type {(...args: unknown[]) => void}
   */
  MT.diag = (...args) => {
    console.log(args);
    messages.push(
      args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")
    );
  };

  /**
   * Show pending diag messages.
   * @type {() => void}
   */
  MT.diagReport = () => {
    $("#mt-diag").remove();
    if (messages.length) {
      const div = $("<div id=mt-diag>").prependTo("#story");
      for (const msg of messages) {
        $("<div>").text(msg).appendTo(div);
      }
    }
  };

  /** Clear diag messages that were shown */
  function diagClear() {
    const div = $("#mt-diag");
    if (div.length) {
      div.remove();
      messages.length = 0;
    }
  }

  function diagInit() {
    $(document).on(":passageinit", diagClear);
    $(document).on(":passageend", MT.diagReport);
  }

  diagInit();
})();
