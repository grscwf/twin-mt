(() => {
  if (!setup.debug) return;

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
})();
