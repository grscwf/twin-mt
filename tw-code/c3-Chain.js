/*
 * A "chain" is a compact encoding of the choices the player made,
 * along with some initial state, which should make it possible
 * to reconstruct the player's state by replaying the choices.
 *
 * Chains are intended to be sharable as URLs.
 *
 * Replay will fail if any of the steps are nondeterministic,
 * or if replay is done in the wrong version.
 */

{
  const chainCode =
    "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  /** @type { (title: string) => string } */
  function encodeTitle(title) {
    return title.replace(/\W+/g, "-");
  }

  /**
   * On click, remember choice that was clicked.
   * @type {(ev: MouseEvent) => void}
   */
  function rememberChoice(ev) {
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
      MT.warn(`Missed g_choiceTaken [${target.innerText}]`);
    } else {
      vars.g_choiceTaken = pos;
    }
  }

  /** @type {(ev: KeyboardEvent) => void} */
  function kbCopyChain(ev) {
    if (ev.ctrlKey && ev.key === "'") {
      const code = "#" + getCode();
      navigator.clipboard.writeText(code);
      MT.note(`Chain copied to clipboard: ${code}`);
    }
  }

  /**
   * @returns {string} The chain code for the current session.
   */
  function getCode() {
    /* Find last non-menu step */
    let last = State.length - 1;
    for (; last > 0; last--) {
      const step = State.index(last);
      const passage = Story.get(step.title);
      if (!passage.tags.includes("is-menu")) break;
    }

    let choices = "";
    /** @type {string | undefined} */
    let version;
    /** @type {number | undefined} */
    let rand0;
    /** @type {number | undefined} */
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
      if (choice >= chainCode.length) {
        console.error(`large choice ${choice} at turn ${i} ${step.title}`);
        return "";
      }

      choices += chainCode.charAt(choice);

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

    const title = encodeTitle(State.index(last).title);

    return `${version},${rand0},${rand1},${choices},${title}`;
  }

  /**
   * @returns {string} A URL that will replay the current session.
   */
  function getUrl() {
    let url = new URL(location.href);
    const chain = getCode();
    url.hash = `#chain=${chain}`;
    return url.toString();
  }

  /** @returns {void} */
  function replayUrl() {
    const hash = location.hash;
    const m = /[#;]chain=([^;]+)/.exec(hash);
    if (m == null) return;

    const chain = /** @type { string } */ (m[1]);
    history.replaceState(null, "", location.pathname + location.search);

    const parts = chain.split(/,/);
    if (parts.length !== 5) {
      MT.warn("Ignoring #chain=, because it has the wrong number of parts.");
      return;
    }
    const version = parts[0] || "";
    const rand0 = parseInt(parts[1] || "0", 10);
    const rand1 = parseInt(parts[2] || "0", 10);
    const choices = parts[3] || "";
    const title = parts[4] || "";

    if (version !== setup.version) {
      MT.warn("Ignoring #chain=, because it has the wrong version.");
      return;
    }

    const path = [];
    for (const ch of choices) {
      const i = chainCode.indexOf(ch);
      path.push({ i });
    }

    console.log(`replaying ${chain}`);
    MT.forgetWalkHistory();
    State.reset();
    State.variables.g_versionAtStart = setup.version;
    Engine.play("g1a Bound");
    State.variables.g_rand0 = rand0;
    State.variables.g_rand1 = rand1;

    const done = () => {
      const here = encodeTitle(State.passage);
      if (here !== title) {
        MT.warn(
          `#chain= seems broken. Expected to end at [${title}],` +
            ` but ended at [${here}]`
        );
      }
    };
    MT.roamStart(path, done, true);
  }

  const chainInit = () => {
    const passages = MT.jqUnwrap($("#passages"));
    passages.addEventListener("click", rememberChoice, true);
    document.addEventListener("keydown", kbCopyChain);
    addEventListener("hashchange", replayUrl);
    replayUrl();
  };

  $(document).on(":storyready", chainInit);
}
