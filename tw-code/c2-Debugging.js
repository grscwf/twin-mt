const debugInit = () => {
  setup.debug = false;
  setup.playtest = false;

  // Enable debug mode if URL has ?debug
  if (/[?&]debug\b/.test(location.search)) {
    Config.debug = true;
    setup.debug = true;
    setup.playtest = true;
  }

  // Enable playtest mode if URL has ?playtest or ?tester
  if (/[?&](playtest|tester)\b/.test(location.search)) {
    setup.playtest = true;
  }

  // Enable history controls when playtest (or debug)
  Config.history.controls = setup.playtest;

  if (setup.debug) {
    // start with debug view off
    setTimeout(() => DebugView.disable());

    // add debugging class for css
    $("html").addClass("debugging");

    // SugarCube debug mode puts passage source in title hover text,
    // which is useless and distracting for long sources. Remove it.
    $(document).on(":passagedisplay", () => {
      $("span.debug").each((i, el) => {
        const title = el.title ?? "";
        if (title.includes("\n") || title.length > 30) {
          el.removeAttribute("title");
          el.removeAttribute("aria-label");
        }
      });
    });
  }
};

debugInit();
