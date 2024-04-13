/**
 * <<arousal-bar $prev $cur $pulse>>
 *
 * Show an arousal bar that animates from $prev to $cur, out of 100.
 * $pulse can be "weak", "strong", or "max".
 */
Macro.add("arousal-bar", {
  handler: function () {
    const prev = /** @type {number} */ (this.args[0]);
    const cur = /** @type {number} */ (this.args[1]);
    const pulse = /** @type {string} */ (this.args[2]);

    const outer = $(`<div class=arousal-bg>`).appendTo(this.output);
    const bar = $(`<div class=arousal-bar>`).appendTo(outer);
    bar.addClass(`arousal-${pulse}`);
    if (State.temporary.isTranscript) {
      bar.css({ width: cur + "%" });
    } else {
      bar.css({ width: prev + "%" });
      setTimeout(() => bar.css({ width: cur + "%" }), 200);
    }
  },
});
