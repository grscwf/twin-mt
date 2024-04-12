/**
 * @typedef {object} Checkpoint
 * @prop {string} desc
 * @prop {number} turn
 */

/**
 * <<checkpoint-save varName description>>
 * Store current turn and description in varName, and announce the checkpoint.
 */
Macro.add("checkpoint-save", {
  handler: function () {
    const [varName, desc] = this.args;
    let mkp = `<meta-text>Checkpoint: ${desc}</meta-text>`;
    mkp += `?P`;
    $(this.output).wiki(mkp);
    const vars = /** @type {Record<string, unknown>} */ (State.variables);
    vars[varName] = { desc, turn: State.turns };
  },
});

/**
 * <<checkpoint-action varName>>
 * Emits an action link that returns to state stored in varName.
 */
Macro.add("checkpoint-action", {
  handler: function () {
    const [varName] = this.args;
    const vars = /** @type {Record<string, unknown>} */ (State.variables);
    const cp = /** @type {Checkpoint} */ (vars[varName]);
    if (cp == null) return;
    const lost = State.turns - State.length;
    if (cp.turn < lost) {
      let mkp = `<<mtl-denied "Try again from Checkpoint: ${cp.desc}"`;
      mkp += ` "forgotten somehow?">>`;
      $(this.output).wiki(mkp);
    } else {
      let mkp = "<li>";
      mkp += `<<link "Try again from Checkpoint: ${cp.desc}.">>`;
      mkp += `<<checkpoint-load ${varName}>>`;
      mkp += `<</link>>`;
      mkp += `</li>`;
      $(this.output).wiki(mkp);
    }
  },
});

/**
 * <<checkpoint-load varName>>
 * Goes to turn stored in varName.
 */
Macro.add("checkpoint-load", {
  handler: function () {
    const [varName] = this.args;
    const vars = /** @type {Record<string, unknown>} */ (State.variables);
    const cp = /** @type {Checkpoint} */ (vars[varName]);
    const lost = State.turns - State.length;
    if (cp.turn < lost) {
      MT.diag(
        `Sorry! Checkpoint: ${cp.desc} (turn ${cp.turn})` +
          ` is no longer in the history`
      );
      MT.diagReport();
    } else {
      Engine.goTo(cp.turn - lost - 1);
    }
  },
});
