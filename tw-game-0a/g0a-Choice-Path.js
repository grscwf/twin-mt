(() => {
  /** During navigation, set g_choiceTaken */
  $(document).on(":storyready", () => {
    const passages = $("#passages")[0];
    if (passages == null) {
      throw new Error("failed to find #passages?");
    }

    passages.addEventListener(
      "click",
      (ev) => {
        const newState = State.active.variables;
        delete newState.g_choiceTaken;

        const target = /** @type {HTMLElement} */ (ev.target);
        if (target.dataset.passage == null) {
          return;
        }

        const links = $("#passages a[data-passage]");
        let pos = 0;
        for (; pos < links.length; pos++) {
          if (links[pos] === target) {
            break;
          }
        }
        if (pos === links.length) {
          MT.diag(`warning: missed g_choiceTaken [${target.innerText}]`);
        } else {
          newState.g_choiceTaken = pos;
        }
      },
      true
    );
  });

  /** @type { () => string } */
  MT.pathTaken = () => {
    const newState = State.active.variables;
    if (State.turns < 2) {
      return "";
    }

    let path = "";

    return path;
  }
})();
