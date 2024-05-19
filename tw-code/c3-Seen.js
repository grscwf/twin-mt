/**
 * <<mt-seen $boolean>>
 *   ...
 * <</mt-seen>>
 *
 * Wrap contents with a <span class="mt-seen-X">
 * where X is either "true" or "false"
 * depending on $boolean.
 *
 * $boolean can also be "todo".
 */
Macro.add("mt-seen", {
  tags: [],
  skipArgs: true,
  handler: function () {
    const expr = this.args.raw;
    const cond = /^todo$/i.test(expr)
      ? "todo"
      : !!MT.untraced(() => Scripting.evalTwineScript(expr));
    const outer = $("<span>").appendTo(this.output);
    outer.addClass(`mt-seen-${cond}`);
    outer.wiki(this.payload[0]?.contents || "");
  },
});

MT.mdDefUnsaved("sn_barbsSkip");
MT.mdDefUnsaved("sn_castDesperate");
MT.mdDefUnsaved("sn_struggleFail");
MT.mdDefUnsaved("sn_trapChoices");

MT.neroResetObjectDim = () => {
  const V = State.variables;
  delete V.n_dimBookcases;
  delete V.n_dimBooks;
  delete V.n_dimBottle;
  delete V.n_dimCabinets;
  delete V.n_dimCoins;
  delete V.n_dimCross;
  delete V.n_dimDesk;
  delete V.n_dimGlobe;
  delete V.n_dimGrav;
  delete V.n_dimKnife;
  delete V.n_dimMap;
  delete V.n_dimMirror;
  delete V.n_dimPainting;
  delete V.n_dimPenguin;
  delete V.n_dimStudy;
  delete V.n_dimWall;
  delete V.n_dimWand;
  delete V.n_dimWindow;
};