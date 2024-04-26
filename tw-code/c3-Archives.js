/**
 * @typedef {(vars: Record<string, unknown>) => string} ConditionalPage
 * @typedef {string | ConditionalPage} ArchivePage
 *
 * @typedef {object} ArchiveEntry
 * @prop {string} [title]
 * @prop {ArchivePage[]} [passages]
 *
 * @typedef {Record<string, ArchiveEntry>} ArchiveMap
 */

/**
 * <<arc-only>>...<</arc-only>>
 * Emit body only when rendering archive text.
 */
Macro.add("arc-only", {
  tags: [],
  handler: function () {
    if (State.temporary.isArchive) {
      $(this.output).wiki(this.payload[0]?.contents || "");
    }
  },
});

/**
 * <<arc-skip>>...<</arc-skip>>
 * Emit body only when *not* rendering archive text.
 */
Macro.add("arc-skip", {
  tags: [],
  handler: function () {
    if (!State.temporary.isArchive) {
      $(this.output).wiki(this.payload[0]?.contents || "");
    }
  },
});

/**
 * <<arc-select choiceVar "Variant name:">>
 * <<arc-option radioValue "Option text" enabled>>
 *    hint text
 * <</arc-select>>
 *
 * Emit a radio selector for a variant, showing all the arc-options.
 * - choiceVar remembers the player's last selection.
 * - radioValue is the value assigned to choiceVarName.
 * - enabled is a boolean.
 *   - true means the variant is selectable.
 *   - false means the variant is disabled, and the hint is shown.
 */
Macro.add("arc-select", {
  tags: ["arc-option"],
  handler: function () {
    const varname = /** @type {string} */ (this.args[0]);
    const label = /** @type {string} */ (this.args[1]);

    const V = /** @type {Record<string, unknown>} */ (State.variables);
    const T = State.temporary;

    const outer = $("<div class=arc-select>").appendTo(this.output);
    outer.append(label);

    const choices = this.payload.slice(1);

    // If value doesn't match an enabled choice, unset it.
    // (should only happen when debugging)
    let matched = false;
    for (const ch of choices) {
      if (V[varname] === String(ch.args[0]) && ch.args[2]) {
        matched = true;
        break;
      }
    }
    if (!matched && !T.lockpick) {
      MT.mdSet(varname, null);
    }

    // If value is not set, set it to the first enabled choice.
    if (V[varname] == null || V[varname] === "") {
      for (const ch of choices) {
        if (ch.args[2] || T.lockpick) {
          MT.mdSet(varname, String(ch.args[0]));
          break;
        }
      }
    }

    let hint = null;
    for (const ch of choices) {
      const value = String(ch.args[0]);
      const text = ch.args[1];
      const enabled = ch.args[2];
      const unlocked = enabled || T.lockpick;
      const label = $("<label>").appendTo(outer);
      label.toggleClass("arc-picklocked", unlocked && !enabled);
      label.wiki(`<<radiobutton "$${varname}" "${value}" autocheck>>`);
      const input = label.find("input");
      input.on("change", function () {
        if (this.checked) {
          MT.mdSet(varname, value);
        }
      });
      label.append(text);
      if (!unlocked) {
        if (hint == null) hint = `(${text}) ${ch.contents}`;
        label.addClass("arc-disabled");
        input.attr("disabled", "disabled");
      }
    }
    if (hint != null) {
      const div = $("<div class=arc-hint>").wiki(hint).appendTo(outer);
    }
  },
});

/**
 * <<arc-ending unlocked twineLink [disabledText [setter]]>>
 *   hint text
 * <<arc-variants>>
 *   variant selectors
 * <</arc-ending>>
 *
 * Emits a link to an archive passage.
 * - text comes from the twineLink.
 * - unlocked is a boolean
 *   - false means link is disabled, and hint text is shown
 *   - true means link is enabled, and variant selectors are shown
 */
Macro.add("arc-ending", {
  tags: ["arc-variants"],
  handler: function () {
    const enabled = /** @type {boolean} */ (this.args[0]);
    const link = /** @type {SugarCubeLink | string} */ (this.args[1]);
    let offText = /** @type {string | null | undefined} */ (this.args[2]);
    let setter = /** @type {string | null | undefined} */ (this.args[3]);

    const T = State.temporary;
    const unlocked = enabled || T.lockpick;
    const isLink = typeof link !== "string";
    offText = offText || (isLink ? link.text || "" : link);
    setter = setter || "";

    const outer = $("<div class=arc-ending>").appendTo(this.output);
    if (!unlocked) {
      $('<div class="arc-title arc-disabled">').wiki(offText).appendTo(outer);
      $("<div class=arc-hint>")
        .wiki(this.payload[0]?.contents || "")
        .appendTo(outer);
      return;
    }

    const title = $("<div class=arc-title>").appendTo(outer);
    title.toggleClass("arc-picklocked", !enabled);
    if (isLink) {
      title.wiki(`[\[${link.text}|${link.link}][${setter}]]`);
    } else {
      title.wiki(`[\[${link}][${setter}]]`);
    }
    if (this.payload[1] != null) {
      outer.wiki(this.payload[1].contents);
    }
  },
});

/**
 * <<arc-set-barbs varName>>
 * At an ending, set the default for smooth/barbs choice.
 */
Macro.add("arc-set-barbs", {
  handler: function () {
    const vname = /** @type {string} */ (this.args[0]);

    const V = /** @type {Record<string, unknown>} */ (State.variables);
    if (V[vname] == null) {
      MT.mdSet(vname, V["n_barbs"] ? "y" : "n");
    }
  },
});

/**
 * <<ending-bad text [metaVar]>>
 * Announce a bad ending.
 * If metaVar is specified and value is false,
 * set it to true and announce the ending is unlocked.
 */
Macro.add("ending-bad", {
  handler: function () {
    const text = /** @type {string} */ (this.args[0]);
    const metaVar = /** @type {string} */ (this.args[1]);

    if (State.temporary.isArchive) return;
    arcAnnounce("bad", metaVar, `Bad Ending: ${text}`, this.output);
  },
});

/**
 * <<ending-challenge text [metaVar]>>
 * Announce a challenge ending.
 * If metaVar is specified and value is false,
 * set it to true and announce the ending is unlocked.
 */
Macro.add("ending-challenge", {
  handler: function () {
    const text = /** @type {string} */ (this.args[0]);
    const metaVar = /** @type {string} */ (this.args[1]);

    if (State.temporary.isArchive) return;
    arcAnnounce("challenge", metaVar, `Challenge Ending: ${text}`, this.output);
  },
});

/**
 * <<ending-good text [metaVar]>>
 * Announce a good ending.
 * If metaVar is specified and value is false,
 * set it to true and announce the ending is unlocked.
 */
Macro.add("ending-good", {
  handler: function () {
    /** @type {string} */
    const text = /** @type {string} */ (this.args[0]);
    const metaVar = /** @type {string} */ (this.args[1]);

    if (State.temporary.isArchive) return;
    arcAnnounce("good", metaVar, `Ending: ${text}`, this.output);
  },
});

/**
 * @arg {string} type
 * @arg {string} metaVar
 * @arg {string} text
 * @arg {DocumentFragment | HTMLElement} output
 */
const arcAnnounce = (type, metaVar, text, output) => {
  const V = /** @type {Record<string, unknown>} */ (State.variables);
  if (metaVar == null || V[metaVar]) {
    $(output).append(`<span class="ending-${type}">${text}</span>`);
  } else {
    $(output).append(
      `<span class="ending-${type}">` +
        text +
        ` <meta-text>is now unlocked in the Archives.</meta-text>` +
        `</span>`
    );
    MT.mdSet(metaVar, true);
  }
};

/** @type {(output: DocumentFragment | HTMLElement) => void} */
MT.arcRender = (output) => {
  const T = State.temporary;
  const V = State.variables;

  const outer = $("<div id=arc-entry-outer>").appendTo(output);

  const arcEntry = V.g_arcChoice;
  MT.nonNull(arcEntry, "arcEntry");

  const { name, barbs, freeze } = arcEntry;

  T.notesVariant = name;

  const info =
    MT.drekkarEndings[name] || MT.neroEndings[name] || MT.neroKeywords[name];

  if (info == null || info.title == null) {
    MT.fail(`Unknown archive entry ${name}`);
  }

  let title = info.title;
  title = title.replace(/%barbs\b/, barbs ? "Barbed" : "Smooth");
  title = title.replace(/%freeze\b/, freeze ? "Freeze" : "Shock");

  $(output).wiki(
    `<<sticky-head>>` +
      `<div class=ui-title>${title}</div>` +
      `<</sticky-head>>`
  );

  /** @type {SugarCubeStoryVariables} */
  const vars = {
    g_arcName: name,
    g_rand0: 1636094642 /* arbitrary */,
    g_rand1: 173183867,
    n_barbs: barbs,
    n_castEndgame: V.n_castEndgame,
  };
  const temps = {
    isArchive: true,
  };

  const passages = info.passages;
  MT.nonNull(passages, `passages for ${name}`);

  /** @type {(step: number) => string} */
  const getTitle = (step) => {
    const passage = passages[step];
    MT.nonNull(passage, `passages[${step}]`);
    if (typeof passage === "function") {
      return passage(arcEntry);
    } else {
      return passage;
    }
  };

  let step = 0;

  const renderSome = () => {
    const batch = 10;
    const limit = Math.min(passages.length, step + batch);

    for (; step < limit; step++) {
      if (step !== 0) {
        $("<hr class=text-sep>").appendTo(outer);
      }
      const title = getTitle(step);
      const div = MT.tran.renderPage({
        title,
        vars,
        temps,
      });
      div.appendTo(outer);

      if (step + 1 < passages.length) {
        const next = getTitle(step + 1);
        const text = Story.get(title).text;
        if (!text.includes(next)) {
          MT.warn(`[\[${title}]] does not link to [\[${next}]]`);
        }
      }

      // caged render is slow
      if (div.find(".caged-box").length) {
        step++;
        return;
      }
    }
  };

  const renderLoop = () => {
    renderSome();
    if (step < passages.length) {
      setTimeout(renderLoop);
    } else {
      MT.scrollWait = false;
    }
  };

  renderLoop();
};

const lockpickSetup = () => {
  const T = State.temporary;
  if (!setup.debug) return;
  T.lockpick = setup.debug && session.get("arc-lockpick");
  $(document).one(":passagedisplay", () => {
    const el = $("#arc-lockpick");
    el.prop("checked", T.lockpick);
    el.on("input", lockpickUpdate);
  });
};

const lockpickUpdate = () => {
  const el = $("#arc-lockpick");
  const val = !!el.prop("checked");
  session.set("arc-lockpick", val);
  MT.revisitHere();
};

const arcCountUnlocks = () => {
  const T = State.temporary;
  const V = State.variables;

  const md = MT.mdRecord();
  /** @type {(keys: string[], reveal: boolean | undefined) => string} */
  const count = (keys, reveal) => {
    const n = keys.filter((k) => md[k]).length;
    const total = reveal || T.lockpick ? keys.length : "?";
    return `${n} of ${total}`;
  };

  T.drekkarEndingsUnlocked = count(
    Object.keys(MT.drekkarEndings),
    V.xd_IvexPunishment
  );
  T.neroEndingsUnlocked = count(
    Object.keys(MT.neroEndings),
    V.mn_playerLeftStudyWithMirror
  );
  T.neroKeywordsUnlocked = count(
    Object.keys(MT.neroKeywords),
    V.mn_playerLeftStudyWithMirror
  );
};

MT.arcPageSetup = () => {
  const sessionKey = "arc-open";

  const T = State.temporary;
  const V = State.variables;

  T.anyNero =
    V.xn_Broken ||
    V.xn_CagedHarsh ||
    V.xn_CagedMild ||
    V.xn_TamedHarsh ||
    V.xn_TamedMild;

  /** @type {(which: string) => void} */
  T.open = (which) => {
    $(".arc-closable").removeClass("arc-open");
    $(".arc-switch").text("(show)");
    $(`.arc-closable-${which}`).addClass("arc-open");
    $(`.arc-switch-${which}`).text("(hide)");
  };

  /** @type {(which: string) => void} */
  T.toggle = (which) => {
    const now = session.get(sessionKey);
    const next = now === which ? "none" : which;
    session.set(sessionKey, next);
    T.open(next);
  };

  /** @type {(which: string) => string} */
  T.switch = (which) => {
    let mkp =
      `<a class="arc-switch arc-switch-${which}"` +
      ` onclick="SugarCube.State.temporary.toggle('${which}')"` +
      `>(show)</a>`;
    return mkp;
  };

  $(document).one(":passagedisplay", () => {
    const state = session.get(sessionKey);
    T.open(state || "intro");
  });

  lockpickSetup();
  arcCountUnlocks();
};
