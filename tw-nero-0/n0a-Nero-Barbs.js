/** @arg {DocumentFragment | HTMLElement} dest */
const barbsAnnounce = (dest) => {
  const V = State.variables;
  delete V.n_announceBarbsSoon;
  V.n_barbsChoiceMade = true;

  if (!V.n_glitched) {
    MT.mdSet("mg_barbsNo", !V.n_barbs);
    MT.mdSet("mg_barbsYes", V.n_barbs);
  }

  const text = V.n_glitched ? "Barbed?" : V.n_barbs ? "Barbed" : "Smooth";
  $(dest).wiki(`<meta-text>Story Variant: ${text}</meta-text>?P`);
};

Macro.add("barbs-announce", {
  handler: function () {
    /** @type {string} */
    const when = this.args[0];

    if (State.temporary.isArchive) return;
    if (this.args.length !== 1) throw new Error("expected 1 arg");
    const V = State.variables;
    switch (when) {
      case "now":
        barbsAnnounce(this.output);
        break;
      case "soon":
        V.n_announceBarbsSoon = true;
        return;
      case "maybe":
        if (V.n_announceBarbsSoon) barbsAnnounce(this.output);
        break;
      default:
        throw new Error(`Unexpected arg ${when}`);
    }
  },
});

/** True if Nero side has canine knots */
MT.impliedKnot = () => {
  const V = State.variables;
  const T = State.temporary;

  // make sure we're ambiguous before player makes a barb choice
  if (!T.isTranscript && !V.n_barbsChoiceMade) {
    throw new Error("knot indeterminate");
  }

  // if player has expressed a knot choice in Drekkar, use it.
  // otherwise match the barb choice
  if (V.mg_knotNo || V.mg_knotYes) {
    return V.mg_knotYes;
  } else if (V.n_barbsChoiceMade) {
    return V.n_barbs;
  } else {
    // isTranscript true
    return V.mg_barbsYes;
  }
};

/** True if Drekkar side has feline barbs */
MT.impliedBarbs = () => {
  const V = State.variables;
  const T = State.temporary;

  // make sure we're ambiguous before player makes a knot choice
  if (!T.isTranscript && !V.d_knotChoiceMade) {
    throw new Error("barbs indeterminate");
  }

  // if player has expressed a barbs choice in Nero, use it.
  // otherwise match the knot choice
  if (V.mg_barbsNo || V.mg_barbsYes) {
    return V.mg_barbsYes;
  } else if (V.d_knotChoiceMade) {
    return V.d_knot;
  } else {
    // isTranscript true
    return V.mg_knotYes;
  }
};

MT.mdDefUnsaved("mg_barbsNo");
MT.mdDefUnsaved("mg_barbsYes");
MT.mdDefUnsaved("mg_knotNo");
MT.mdDefUnsaved("mg_knotYes");
