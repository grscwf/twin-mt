(() => {
  /**
   * <<n1-patience $looks $actions>>
   *     $firstText
   * <<n1-remind>>
   *     $remindText
   * <<n1-repeat>>
   *     $repeatText
   * <<n1-warn>>
   *     $warnText
   * <<n1-insist>>
   *     $insistText
   * <</n1-patience>>
   *
   * Basically, player can do $looks-1 or $actions-1 before getting $warnText.
   * Once you see $warnText, the next look or action will get $insistText.
   *
   * Max looks/actions before warn is
   *    1 + ($looks - 2 + $actions - 2) === $looks + $actions - 3
   * Plus warn and insist, max times player is at node is
   *    $looks + $actions - 1
   *
   * If visiting this node for the first time
   *   - set look count and action count
   *   - emit $firstText
   * If returning from look or action, and either count is 0
   *   - emit $insistText
   *   - suppress looks and actions
   * If returning from look or action, and either count is now 1,
   *   - set both counts to 1
   *   - emit $warnText
   * If returning from look
   *   - emit $remindText
   * If returning from action
   *   - emit $repeatText
   */
  Macro.add("n1-patience", {
    tags: ["n1-remind", "n1-repeat", "n1-warn", "n1-insist"],
    handler: function () {
      let [looks, actions] = this.args;

      let firstText = "",
        remindText,
        repeatText,
        warnText,
        insistText;
      for (const payload of this.payload) {
        switch (payload.name) {
          case "n1-patience":
            firstText = payload.contents;
            break;
          case "n1-remind":
            remindText = payload.contents;
            break;
          case "n1-repeat":
            repeatText = payload.contents;
            break;
          case "n1-warn":
            warnText = payload.contents;
            break;
          case "n1-insist":
            insistText = payload.contents;
            break;
          default:
            MT.fail(`BUG: n1-patience ${payload.name}`, this);
        }
      }
      if (actions === 1) {
        MT.assert(firstText.trim() === "", "should have empty initial text");
        MT.assert(looks === 1, "actions === 1 should have looks === 1");
      }
      if (actions > 2) {
        MT.nonNull(repeatText, "n1-repeat");
      } else {
        MT.assert(repeatText == null, "should NOT have n1-repeat");
      }

      if (looks === 1) {
        MT.assert(actions === 1, "looks === 1 should have actions === 1");
      }
      if (looks > 2) {
        MT.nonNull(remindText, "n1-remind");
      } else {
        MT.assert(remindText == null, "should NOT have n1-remind");
      }

      MT.nonNull(warnText, "n1-warn");
      MT.nonNull(insistText, "n1-insist");

      const V = State.variables;
      const T = State.temporary;
      const here = T.tranPassage || State.passage;

      if (V.n_patiencePassage !== here) {
        // This is our first visit here
        V.n_patienceLooks = looks;
        V.n_patienceActions = actions;
        V.n_patiencePassage = here;
        V.n_patienceReturn = 0;
      }

      MT.nonNull(V.n_patienceLooks, "n_patienceLooks");
      MT.nonNull(V.n_patienceActions, "n_patienceActions");
      MT.nonNull(V.n_patienceReturn, "n_patienceReturn");

      if (V.n_patienceReturn === 1) {
        // Return from look
        V.n_patienceLooks--;
      } else if (V.n_patienceReturn === 2) {
        // Return from action
        V.n_patienceActions--;
        V.n_didSomeAction = true;
      }
      T.patienceAdvanced = V.n_patienceReturn > 0;

      // lose patience immediately
      if (V.n_patienceAccel && T.patienceAdvanced) {
        V.n_patienceLooks = 0;
        V.n_patienceActions = 0;
      }
      delete V.n_patienceAccel;

      T.patience = Math.min(V.n_patienceLooks, V.n_patienceActions);

      // At warn state, only allow 1 more look or action.
      if (T.patience === 1) {
        V.n_patienceLooks = 1;
        V.n_patienceActions = 1;
      }

      // set return links
      V.n_afterLook = `[\[Do something else.|${here}][$n_patienceReturn = 1]]`;
      V.n_afterLookContinue = `[\[Continue|${here}][$n_patienceReturn = 1]]`;
      // V.n_afterActionAbort = `[\[Do something else.|${here}][$n_patienceReturn = 2]]`;
      V.n_afterAction = `[\[Continue|${here}][$n_patienceReturn = 2]]`;
      V.n_afterItch = V.n_afterAction;

      // Patience text
      if (T.patience <= 0) {
        $(this.output).wiki(insistText);
      } else if (T.patience === 1) {
        $(this.output).wiki(warnText);
      } else {
        switch (V.n_patienceReturn) {
          case 0:
            $(this.output).wiki(firstText);
            break;
          case 1:
            MT.nonNull(remindText, "remindText");
            $(this.output).wiki(remindText);
            break;
          case 2:
            MT.nonNull(repeatText, "repeatText");
            $(this.output).wiki(repeatText);
            break;
          default:
            MT.fail(`BUG: patienceReturn ${V.n_patienceReturn}`, this);
        }
      }
      V.n_patienceReturn = 0;

      if (setup.debug) {
        let debug = !!session.get("patience-debug");
        const outer = $("<span class=patience-debug>")
          .appendTo(this.output)
          .toggleClass("patience-debug-show", debug);
        $("<span class=patience-label>")
          .wiki(" ?debugIcon")
          .appendTo(outer)
          .on("click", () => {
            debug = !debug;
            session.set("patience-debug", debug);
            outer.toggleClass("patience-debug-show", debug);
          });
        $("<a>")
          .text("(reset)")
          .appendTo(outer)
          .on("click", () =>
            MT.revisitHere(() => {
              const V = State.variables;
              V.g_mutated = true;
              delete V.n_patiencePassage;
              delete V.n_lustTextPos;
            })
          );
        if (looks > 2) {
          $("<a>")
            .text(" (remind)")
            .appendTo(outer)
            .on("click", () =>
              MT.revisitHere((v0) => {
                const V = State.variables;
                V.g_mutated = true;
                V.n_patiencePassage = here;
                V.n_patienceActions = Math.max(2, v0.n_patienceActions || 0);
                V.n_patienceLooks = Math.max(2, v0.n_patienceLooks || 0);
                V.n_patienceReturn = 1;
                V.n_lustTextPos = Math.min(v0.n_lustTextPos || 0, 4);
              })
            );
        }
        if (actions > 2) {
          $("<a>")
            .text(" (repeat)")
            .appendTo(outer)
            .on("click", () =>
              MT.revisitHere((v0) => {
                const V = State.variables;
                V.g_mutated = true;
                V.n_patiencePassage = here;
                V.n_patienceActions = Math.max(2, v0.n_patienceActions || 0);
                V.n_patienceLooks = Math.max(2, v0.n_patienceLooks || 0);
                V.n_patienceReturn = 2;
                V.n_lustTextPos = Math.min(v0.n_lustTextPos || 0, 4);
              })
            );
        }
        if (looks > 1 && actions > 1) {
          $("<a>")
            .text(" (warn)")
            .appendTo(outer)
            .on("click", () =>
              MT.revisitHere(() => {
                const V = State.variables;
                V.g_mutated = true;
                V.n_patiencePassage = here;
                V.n_patienceActions = 1;
                V.n_patienceLooks = 1;
                V.n_patienceReturn = -1;
              })
            );
        }
        $("<a>")
          .text(" (insist)")
          .appendTo(outer)
          .on("click", () =>
            MT.revisitHere(() => {
              const V = State.variables;
              V.g_mutated = true;
              V.n_patiencePassage = here;
              V.n_patienceActions = 0;
              V.n_patienceLooks = 0;
              V.n_patienceReturn = -1;
            })
          );
      }
    },
  });
})();
