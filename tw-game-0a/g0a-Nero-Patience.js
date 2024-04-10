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
      for (const p of this.payload) {
        switch (p.name) {
          case "n1-patience":
            firstText = p.contents;
            break;
          case "n1-remind":
            remindText = p.contents;
            break;
          case "n1-repeat":
            repeatText = p.contents;
            break;
          case "n1-warn":
            warnText = p.contents;
            break;
          case "n1-insist":
            insistText = p.contents;
            break;
          default:
            throw new Error(`bug n1-patience ${p.name}`);
        }
      }
      if (actions === 1) {
        MT.assert(firstText.trim() === "", "should have empty initial text");
        MT.assert(looks === 1, "actions === 1 should have looks === 1");
      }
      if (actions > 2) {
        MT.assert(repeatText != null, "should have n1-repeat");
      } else {
        MT.assert(repeatText == null, "should NOT have n1-repeat");
      }

      if (looks === 1) {
        MT.assert(actions === 1, "looks === 1 should have actions === 1");
      }
      if (looks > 2) {
        MT.assert(remindText != null, "should have n1-remind");
      } else {
        MT.assert(remindText == null, "should NOT have n1-remind");
      }

      MT.assert(warnText != null, "should have n1-warn");
      MT.assert(insistText != null, "should have n1-insist");

      const V = State.variables;
      const T = State.temporary;
      const here = T.tranPassage || State.passage;

      if (V.n_patiencePassage !== here) {
        // This is our first visit here
        V.n_patienceLooks = looks;
        V.n_patienceActions = actions;
        V.n_patiencePassage = here;
        V.n_patienceReturn = 0;
      } else if (V.n_patienceReturn === 1) {
        // Return from look
        MT.assert(V.n_patienceLooks != null, "patienceLooks should be set");
        V.n_patienceLooks--;
      } else if (V.n_patienceReturn === 2) {
        // Return from action
        MT.assert(V.n_patienceActions != null, "patienceActions should be set");
        V.n_patienceActions--;
        V.n_didSomeAction = true;
      }
      MT.assert(V.n_patienceReturn != null, "patienceReturn should be set");
      T.patienceAdvanced = V.n_patienceReturn > 0;

      // lose patience immediately
      if (V.n_patienceAccel && T.patienceAdvanced) {
        V.n_patienceLooks = 0;
        V.n_patienceActions = 0;
      }
      delete V.n_patienceAccel;

      MT.assert(V.n_patienceLooks != null, "patienceLooks should be set");
      MT.assert(V.n_patienceActions != null, "patienceActions should be set");
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
            MT.assert(remindText != null, "remindText is missing");
            $(this.output).wiki(remindText);
            break;
          case 2:
            MT.assert(repeatText != null, "repeatText is missing");
            $(this.output).wiki(repeatText);
            break;
          default:
            throw new Error(`bug: patienceReturn ${V.n_patienceReturn}`);
        }
      }
      V.n_patienceReturn = 0;

      if (setup.debug) {
        let debug = !!SugarCube.session.get("patience-debug");
        const outer = $("<span class=patience-debug>")
          .appendTo(this.output)
          .toggleClass("patience-debug-show", debug);
        $("<span class=patience-label>")
          .wiki(" ?debugIcon")
          .appendTo(outer)
          .on("click", () => {
            debug = !debug;
            SugarCube.session.set("patience-debug", debug);
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
            .click(() =>
              MT.revisitHere((v0) => {
                const V = State.variables;
                V.g_mutated = true;
                V.n_patiencePassage = here;
                V.n_patienceActions = Math.max(2, v0.n_patienceActions);
                V.n_patienceLooks = Math.max(2, v0.n_patienceLooks);
                V.n_patienceReturn = 1;
                V.n_lustTextPos = Math.min(v0.n_lustTextPos || 0, 4);
              })
            );
        }
        if (actions > 2) {
          $("<a>")
            .text(" (repeat)")
            .appendTo(outer)
            .click(() =>
              MT.revisitHere((v0) => {
                const V = State.variables;
                V.g_mutated = true;
                V.n_patiencePassage = here;
                V.n_patienceActions = Math.max(2, v0.n_patienceActions);
                V.n_patienceLooks = Math.max(2, v0.n_patienceLooks);
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
