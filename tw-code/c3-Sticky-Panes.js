
Macro.add("sticky-head", {
  tags: [],
  handler: function() {
    let inner = $("#sticky-head .sticky-inner");
    if (inner.length === 0) {
      inner = $("<div class=sticky-inner>").appendTo("#sticky-head");
    }
    inner.wiki(this.payload[0]?.contents || "");
  }
});

/** @type {(and?: string) => void} */
const stickyReturn = (and) => {
  let inner = $("#sticky-tail .sticky-inner");
  if (inner.length === 0) {
    inner = $("<div class=sticky-inner>").appendTo("#sticky-tail");
  }
  inner.wiki(`<<link "Return to the game">><<run MT.popToStory()>><</link>>`)
  if (and != null && and !== "") {
    inner.wiki(and);
  }
}

Macro.add("sticky-return", {
  handler: function() {
    stickyReturn();
  }
});

Macro.add("sticky-return-and", {
  tags: [],
  handler: function() {
    stickyReturn(this.payload[0]?.contents || "");
  }
});

const stickyInit = () => {
  $(document).on(":passageinit", () => {
    MT.autoStow();
    $("#sticky-head").remove();
    $("#sticky-head-obs").remove();
    const headDiv =
      $("<div id=sticky-head>")
      .prependTo("#story");
    const headObsDiv =
      $("<div id=sticky-head-obs>")
      .prependTo("#story");
    const headObs = new IntersectionObserver(([e]) => {
      headDiv.toggleClass("shadow", !e?.isIntersecting);
    });
    headObs.observe(MT.jqUnwrap(headObsDiv));

    $("#sticky-tail").remove();
    $("#sticky-tail-obs").remove();
    const tailDiv = 
      $("<div id=sticky-tail>")
      .appendTo("#story");
    const tailObsDiv =
      $("<div id=sticky-tail-obs>")
      .appendTo("#story");
    const tailObs = new IntersectionObserver(([e]) => {
      tailDiv.toggleClass("shadow", !e?.isIntersecting);
    });
    tailObs.observe(MT.jqUnwrap(tailObsDiv));
  });
}

stickyInit();
