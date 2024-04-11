/*
 * Restores scroll pos when reloading page.
 */

/** True if scrolling should wait (until an async renderer finishes). */
MT.scrollWait = false;

const SCROLL_KEY = "scroll.pos";

const scrollRememberPos = () => {
  const pos = {
    turn: State.turns,
    top: document.documentElement.scrollTop,
  };
  sessionStorage.setItem(SCROLL_KEY, MT.repr(pos));
};

const scrollRestorePos = () => {
  const json = sessionStorage.getItem(SCROLL_KEY);
  if (json == null) return;

  const pos = MT.jsonParse(json);
  if (pos.turn !== State.turns) return;

  const el = document.documentElement;

  const doScroll = () => {
    if (MT.scrollWait) {
      setTimeout(doScroll, 200);
    } else {
      el.scrollTo({ top: pos.top, behavior: "smooth" });
    }
  };

  setTimeout(doScroll, 500);
};

const scrollInit = () => {
  // This is only useful when doing reload after an edit
  if (!setup.debug) return;

  document.addEventListener("scrollend", scrollRememberPos);
  $(document).on(":passageend", scrollRestorePos);
};

scrollInit();
