(() => {
  const choiceCode =
    "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  /**
   * On click, remember choice that was clicked.
   * @type { (ev: MouseEvent) => void }
   */
  function onClick(ev) {
    const vars = State.active.variables;
    delete vars.g_choiceTaken;

    /* find the containing A element */
    let target = /** @type {HTMLElement | null} */ (ev.target);
    while (target != null && target.tagName !== "A") {
      target = target.parentElement;
    }

    /* ignore if not a link to a passage */
    if (target == null || target.dataset.passage == null) {
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
      vars.g_choiceTaken = pos;
    }
  }

  /** @type { (ev: KeyboardEvent) => void } */
  function onKey(ev) {
    if (ev.ctrlKey && ev.key === "'") {
      const url = getUrl();
      navigator.clipboard.writeText(url);
      MT.note(url, "URL copied to clipboard");
    }
  }

  /**
   * Returns the choices path for the current session
   * @type { () => string }
   */
  function getPath() {
    /* Find last non-menu step */
    let last = State.length - 1;
    for (; last > 0; last--) {
      const step = State.index(last);
      const passage = Story.get(step.title);
      if (!passage.tags.includes("is-menu")) break;
    }

    let choices = "";
    /** @type { string | undefined } */
    let version;
    /** @type { number | undefined } */
    let rand0;
    /** @type { number | undefined } */
    let rand1;

    for (let i = 0; i < last; i++) {
      const step = State.index(i);
      if (i === 0 && step.title === "g1a Title Screen") continue;

      if (choices === "" && step.title !== "g1a Bound") {
        console.error(`start of history is weird: ${step.title}`);
        return "";
      }

      const passage = Story.get(step.title);
      if (passage.tags.includes("is-menu")) {
        console.error(`path includes menu at turn ${i} ${step.title}`);
        return "";
      }

      const next = State.index(i + 1);
      const choice = next.variables.g_choiceTaken;
      if (choice == null) {
        console.error(`path broken at turn ${i} ${step.title}`);
        return "";
      }
      if (choice >= choiceCode.length) {
        console.error(`large choice ${choice} at turn ${i} ${step.title}`);
        return "";
      }

      choices += choiceCode.charAt(choice);

      const vars = step.variables;

      if (vars.g_mutated) {
        console.error(`mutated state at turn ${i} ${step.title}`);
        return "";
      }

      if (rand0 == null && vars.g_rand0 != null) {
        rand0 = vars.g_rand0;
        rand1 = vars.g_rand1;
      }
      if (version == null && vars.g_versionAtStart != null) {
        version = vars.g_versionAtStart;
      }
    }

    let title = State.index(last).title;
    title = title.replace(/\W+/g, "-");

    return `${version},${rand0},${rand1},${choices},${title}`;
  }

  /**
   * Returns a URL that will replay the current session
   * @type { () => string }
   */
  function getUrl() {
    const url = new URL(location.href);
    const path = getPath();
    url.hash = `#p=${path}`;
    return url.toString();
  }

  $(document).on(":storyready", () => {
    const passages = $("#passages")[0];
    if (passages == null) {
      throw new Error("failed to find #passages?");
    }
    passages.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey);
  });

  MT.choices = {
    getPath,
    getUrl,
  };
})();
