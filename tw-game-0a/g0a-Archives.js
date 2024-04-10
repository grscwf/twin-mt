(() => {
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
      const mkp = State.temporary.isArchive ? "" : this.payload[0]?.contents;
      // This will add debug markers around the output
      $(this.output).wiki(mkp || "");
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
      if (this.args.length !== 2) {
        throw new Error("expected arc-select args: varname label");
      }
      const [varname, label] = this.args;

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
        if (ch.args.length !== 3) {
          throw new Error("expected choice args: value text boolean");
        }
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
      if (this.args.length < 2 || this.args.length > 4) {
        throw new Error(
          "expected arc-endings args: boolean link [disabledText [setter]]"
        );
      }
      let [enabled, link, offText, setter] = this.args;
      const T = State.temporary;
      const unlocked = enabled || T.lockpick;
      const isLink = typeof link === "object" && link.isLink;
      offText = offText || (isLink ? link.text : link);
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
      const [vname] = this.args;
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
      if (State.temporary.isArchive) return;
      const [text, metaVar] = this.args;
      emitEnding("bad", metaVar, `Bad Ending: ${text}`, this.output);
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
      if (State.temporary.isArchive) return;
      const [text, metaVar] = this.args;
      emitEnding(
        "challenge",
        metaVar,
        `Challenge Ending: ${text}`,
        this.output
      );
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
      if (State.temporary.isArchive) return;
      const [text, metaVar] = this.args;
      emitEnding("good", metaVar, `Ending: ${text}`, this.output);
    },
  });

  /**
   * @arg {string} type
   * @arg {string} metaVar
   * @arg {string} text
   * @arg {DocumentFragment | HTMLElement} output
   */
  function emitEnding(type, metaVar, text, output) {
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
  }
})();
