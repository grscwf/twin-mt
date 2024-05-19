
Template.add("blank",
  "<span class=nero-blank>" +
    "<span class=nero-blank-c>" +
      "_____".split("").join("</span><span class=nero-blank-c>") +
    "</span>" +
  "</span>");

/** @type {(p1: string, p2: string) => string} */
const neroMaster = (p1, p2) => {
  const V = State.variables;
  const name = V.n_opportunist ? "An Opportunist" : "Master";
  if (V.n_spriteQuiet) {
    return `<span class=master-quiet>${name}${p2}</span>`;
  } else {
    return `${name}${p1}`;
  }
}
Template.add("master", () => neroMaster(".", "!"));
Template.add("masterN", () => neroMaster("", ""));
Template.add("masterQ", () => neroMaster("?", "!?"));
Template.add("masterX", () => neroMaster("!", "!"));

Template.add("spell", () => {
  const V = State.variables;
  if (V.n_castEndgame) {
    return "his Endgame spell";
  } else if (V.n_castItch) {
    return "his Superb Itch";
  } else if (V.n_castOil) {
    return "his Oil of Dragons spell";
  } else if (V.n_castYounger) {
    return "Younger's Escape";
  } else {
    MT.fail("Cast an unknown spell?");
  }
});

Template.add("crystals", () => {
  const V = State.variables;
  const U = MT.untracedVars();
  if (V.n_gravKnown) {
    return "Gravity Crystals";
  } else if (V.n_gravViewed) {
    if (V.n_struggleKnown || U.n_free) {
      return "mysterious crystals";
    } else {
      return "Dream Crystals";
    }
  } else {
    return "glowing crystals";
  }
});

Template.add("globe", () => {
  const V = State.variables;
  return V.n_globeViewed || V.n_globeAskedHorny
    ? "snow globe" : "arcane globe";
});

Template.add("mirror", () => {
  const V = State.variables;
  if (V.n_mirrorBroken) {
    return "broken mirror";
  } else if (V.n_mirrorMagicKnown) {
    return "magic mirror";
  } else {
    return "hand mirror";
  }
});

Template.add("sprSays", () => {
  const V = State.variables;
  return V.n_spriteQuiet ? "whispers" : "says";
});
Template.add("sprSpeaks", () => {
  const V = State.variables;
  return V.n_spriteQuiet ? "whispers" : "speaks";
});
Template.add("sprReplies", () => {
  const V = State.variables;
  return V.n_spriteQuiet ? "whispers" : "replies";
});

Template.add("sprHoldStop", () => {
  const V = State.variables;
  let mkp = `?master`;
  if (MP_onHold === V.n_magicPhase) {
    mkp += ` Also, ?sprBadPass`;
    // cspell: disable-next-line
    mkp += ` <span class=nobr>remai&mdash;</span>`;
    mkp += ` <<random-once n_spriteInterrupt>>`;
    mkp += ` <<ro-choice>>`;
    mkp += ` Something is beeping, please hold, ?master`;
    mkp += `<<ro-choice>>`;
    mkp += ` Wait a minute, I dropped something, ?master`;
    mkp += `<<ro-choice>>`;
    mkp += ` Ow! Fuck! Give me a moment, ?master`;
    mkp += `<</random-once>>`;
    V.n_magicPhase = MP_exitingHold;
  }
  return mkp;
});