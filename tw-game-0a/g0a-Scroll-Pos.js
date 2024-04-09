/**
 * Restore scroll pos when reloading page.
 */

(() => {
  const KEY = "scroll.pos";

  const repr = JSON._real_stringify || JSON.stringify;
  const parse = JSON._real_parse || JSON.parse;

  MT.stillRendering = false;

  function rememberPos() {
    const obj = {
      turn: State.turns,
      top: document.documentElement.scrollTop,
    };
    sessionStorage.setItem(KEY, repr(obj));
  }

  function restorePos() {
    const json = sessionStorage.getItem(KEY);
    if (json == null) return;
    const obj = parse(json);
    if (obj.turn !== State.turns) return;

    const el = document.documentElement;
    const doScroll = () => {
      if (MT.stillRendering) {
        setTimeout(doScroll, 100);
      } else {
        el.scrollTo({ top: obj.top, behavior: "smooth" });
      }
    };
    if (obj.top < el.scrollHeight) {
      doScroll();
    } else {
      setTimeout(doScroll, 500);
    }
  }

  function scrollPosInit() {
    // This is only useful when doing reload after an edit
    if (!setup.debug) return;
    document.addEventListener("scrollend", rememberPos);
    $(document).on(":passageend", restorePos);
  }

  scrollPosInit();
})();
