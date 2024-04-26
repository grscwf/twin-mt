/*
 * Restores scroll pos when reloading page.
 */

/** True if scrolling should wait (until an async renderer finishes). */
MT.scrollWait = false;

const SCROLL_KEY = "scroll.pos";

/** @type {number | null} */
let scrollTimeout = null;

MT.scrollSavePos = () => {
  if (!setup.debug) return;
  if (State.current == null) return;

  const pos = {
    turn: State.turns,
    top: document.documentElement.scrollTop,
    cagedBlock: State.current.variables.n_cagedBlock,
  };
  sessionStorage.setItem(SCROLL_KEY, MT.json(pos));
};

/** @arg {boolean} scroll */
MT.scrollLoadPos = (scroll) => {
  if (!setup.debug) return;

  const json = sessionStorage.getItem(SCROLL_KEY);
  if (json == null) return;

  const pos = MT.jsonParse(json);

  if (pos.turn === State.turns && pos.cagedBlock != null) {
    State.current.variables.n_cagedBlock = pos.cagedBlock;
    State.current.variables.n_cagedBlockTurn = pos.turn;
  }

  if (pos.turn === State.turns && scroll) {
    if (scrollTimeout != null) {
      clearTimeout(scrollTimeout);
    }
    const el = document.documentElement;
    const doScroll = () => {
      if (MT.scrollWait) {
        scrollTimeout = setTimeout(doScroll, 200);
      } else {
        el.scrollTo({ top: pos.top, behavior: "smooth" });
        scrollTimeout = null;
      }
    };
    scrollTimeout = setTimeout(doScroll, 500);
  }
};

// This is only useful when doing reload after an edit
if (setup.debug) {
  document.addEventListener("scrollend", MT.scrollSavePos);
  $(document).on(":passagestart", () => MT.scrollLoadPos(false));
  $(document).on(":passageend", () => MT.scrollLoadPos(true));
  $(document).on(":passageend", MT.scrollSavePos);
}
