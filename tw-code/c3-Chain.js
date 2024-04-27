/*
 * A "chain" is a compact encoding of the choices the player made,
 * along with some initial state, which should make it possible
 * to reconstruct the player's state by replaying the choices.
 *
 * Chains are intended to be sharable as URLs.
 *
 * Replay may fail if any of these are true:
 * - the story version is different.
 * - a step is nondeterministic.
 * - a passage dynamically adds or removes links
 *   (instead of using css to hide/show them).
 */

const chainCode =
  "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** @type { (title: string) => string } */
const chainNormalizeTitle = (title) => {
  return title.replace(/\W+/g, "-");
};

/**
 * On click, remember choice that was clicked.
 * @type {(ev: MouseEvent) => void}
 */
const chainRememberChoice = (ev) => {
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
};

/** @type {(ev: KeyboardEvent) => void} */
const chainKbCopy = (ev) => {
  if (ev.ctrlKey && ev.key === "'") {
    const isFile = location.protocol === "file:";
    const label = isFile ? "Chain" : "URL";
    const value = isFile ? "#" + chainGetCode() : chainGetUrl();
    navigator.clipboard.writeText(value);
    MT.note(`${label} copied to clipboard: ${value}`);
  }
};

/**
 * @returns {string} The chain code for the current session.
 */
const chainGetCode = () => {
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
      MT.fail(`Can't chain: start of history is weird: ${step.title}`);
    }

    const passage = Story.get(step.title);
    if (passage.tags.includes("is-menu")) {
      MT.fail(`Can't chain: unexpected menu at turn ${i} ${step.title}`);
    }

    const next = State.index(i + 1);
    const choice = next.variables.g_choiceTaken;
    if (choice == null) {
      MT.fail(`Can't chain: no choiceTaken at turn ${i} ${step.title}`);
    }
    if (choice >= chainCode.length) {
      MT.fail(
        `Can't chain: choice ${choice} too large at turn ${i} ${step.title}`
      );
    }

    choices += chainCode.charAt(choice);

    const vars = step.variables;

    if (vars.g_mutated) {
      MT.fail(`Can't chain: state mutated at turn ${i} ${step.title}`);
    }

    if (rand0 == null && vars.g_rand0 != null) {
      rand0 = vars.g_rand0;
      rand1 = vars.g_rand1;
    }
    if (version == null && vars.g_versionAtStart != null) {
      version = vars.g_versionAtStart;
    }
  }

  const title = chainNormalizeTitle(State.index(last).title);

  return `${version},${rand0},${rand1},${choices},${title}`;
};

/**
 * @returns {string} A URL that will replay the current session.
 */
const chainGetUrl = () => {
  let url = new URL(location.href);
  const chain = chainGetCode();
  url.hash = `#chain=${chain}`;
  return url.toString();
};

/** @returns {void} */
const chainReplayUrl = () => {
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
    const here = chainNormalizeTitle(State.passage);
    if (here !== title) {
      MT.warn(
        `#chain= seems broken. Expected to end at [${title}], not [${here}]`
      );
    }
  };
  MT.roamStart(path, done, true);
};

/** Check for dynamic passage rendering that might break chai-url. */
const chainObserverInit = () => {
  if (!setup.playtest) return;

  /** @type {(node: Node) => boolean} */
  const isPassageLink = (node) => {
    if (node instanceof HTMLAnchorElement) {
      const passage = node.getAttribute("data-passage");
      return passage != null && passage !== "";
    }
    return false;
  };

  /** @type {(nodes: NodeList) => boolean} */
  const hasPassageLink = (nodes) => {
    for (let i = 0; i < nodes.length; i++) {
      const node = /** @type {Node} */ (nodes[i]);
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (isPassageLink(node)) {
          return true;
        }
        if (node.hasChildNodes() && hasPassageLink(node.childNodes)) {
          return true;
        }
      }
    }
    return false;
  };

  const observer = new MutationObserver((changes) => {
    changes.forEach((change) => {
      if (hasPassageLink(change.addedNodes)) {
        MT.warn("Passage dynamically added a link (chain-url may fail).");
      }
      if (hasPassageLink(change.removedNodes)) {
        MT.warn("Passage dynamically removed a link (chain-url may fail).");
      }
      if (change.attributeName === "data-passage") {
        MT.warn("Passage dynamically changes link (chain-url may fail).");
      }
    });
  });

  $(document).on(":passageend", () => {
    if (tags().includes("is-menu")) return;

    observer.observe(MT.jqUnwrap($("#passages .passage")), {
      attributeFilter: ["data-passage"],
      attributes: true,
      childList: true,
      subtree: true,
    });
  });
  $(document).on(":passageinit", () => {
    observer.disconnect();
  });
};

const chainInit = () => {
  const passages = MT.jqUnwrap($("#passages"));
  passages.addEventListener("click", chainRememberChoice, true);
  document.addEventListener("keydown", chainKbCopy);
  addEventListener("hashchange", chainReplayUrl);
  chainReplayUrl();
};

$(document).on(":storyready", chainInit);

chainObserverInit();
