/** @type {ArchiveMap} */
MT.neroKeywords = {
  kn_Dream: {
    title: "Dream Crystals",
    passages: ["n1x Dream Crystals 1", "n1x Dream Crystals 2"],
  },

  kn_Endgame: {
    title: "Nero's Endgame",
    passages: [
      "n1s Endgame Info 1",
      "n1s Endgame Info 2",
      "n1s Endgame Info 3",
    ],
  },

  kn_Gravity: {
    title: "Gravity Crystals",
    passages: [
      "n1x Gravity Crystals 1",
      "n1x Gravity Crystals 2",
      "n1x Gravity Crystals 3",
      "n1x Gravity Crystals 4",
    ],
  },

  kn_Itch: {
    title: "Superb Itch",
    passages: ["n1s Itch 1", "n1s Itch 2", "n1s Itch 3"],
  },

  kn_Ivex: {
    title: "Ivex (the Magnificent)",
    passages: ["n1cn Ivex Desc"],
  },

  kn_Kelvin: {
    title: "Kelvin the Elder",
    passages: [
      "n1x Kelvin 1",
      "n1x Kelvin 2",
      "n1x Kelvin 3",
      "n1x Kelvin 4",
      "n1x Kelvin 5",
      "n1x Kelvin 6",
      "n1x Kelvin 7",
    ],
  },

  kn_Kopic: {
    title: "Kopic Wands",
    passages: ["n2x Kopic 1", "n2x Kopic 2", "n2x Kopic 3"],
  },

  kn_Mica: {
    title: "Mica Teboren",
    passages: ["n1p Mica Extra 1", "n1p Mica Extra 2", "n1p Mica Extra 3"],
  },

  kn_MindControlBasics: {
    title: "Mind Control (Basics)",
    passages: ["n1cr Mind Control"],
  },

  kn_MindControlInhibition: {
    title: "Mind Control (Inhibition)",
    passages: ["n1cr Inhibition 1", "n1cr Inhibition 2"],
  },

  kn_MindControlRepression: {
    title: "Mind Control (Repression)",
    passages: ["n1cr Repression 1", "n1cr Repression 2"],
  },

  kn_MindControlSubstitution: {
    title: "Mind Control (Substitution)",
    passages: ["n1cr Substitution 1", "n1cr Substitution 2"],
  },

  kn_Nackle: {
    title: "Nackle's Poltergeist Device",
    passages: ["n1x Nackle Info 1", "n1x Nackle Info 2"],
  },

  kn_Oil: {
    title: "Oil of Dragons",
    passages: ["n1s Oil Info 1", "n1s Oil Info 2"],
  },

  kn_Pearson: {
    title: "Pearson's Hangover Cantrip",
    passages: ["n1a Hangover Info"],
  },

  kn_Pevhin: {
    title: "Lord Pevhin and Lady Temesca",
    passages: [
      "n1p Barbs Fast 3",
      "n1p Barbs Fast 4",
      "n1p Barbs Fast 5",
      "n1p Barbs Fast 6",
    ],
  },

  kn_Pyron: {
    title: "Pyron Nodes",
    passages: ["n1s Pyron Node 1", "n1s Pyron Node 2"],
  },

  kn_Sprite: {
    title: "Magic Sprites",
    passages: [
      "n1s Sprite Info 1",
      "n1s Sprite Info 2",
      "n1s Sprite Info 3",
      "n1s Sprite Info 4",
      "n1s Sprite Info 5",
    ],
  },

  kn_TigerKeratin: {
    title: "Strange Tiger (Keratin)",
    passages: [
      "n1p Barbs Slow 4",
      "n1p Barbs Slow 5",
      "n1p Barbs Slow 6y1",
      "n1p Barbs Slow 6y2",
    ],
  },

  kn_TigerMyth: {
    title: "Strange Tiger (Myth)",
    passages: [
      "n1p Barbs Slow 4",
      "n1p Barbs Slow 5",
      "n1p Barbs Slow 6n1",
      "n1p Barbs Slow 6n2",
    ],
  },

  kn_Younger: {
    title: "Younger's Escape",
    passages: [
      "n1s Younger Info 1",
      "n1s Younger Info 2",
      "n1s Younger Info 3",
      "n1s Younger Info 4",
      "n1s Younger Info 5",
    ],
  },
};

MT.neroKeywordList = () => {
  const V = State.variables;
  const T = State.temporary;

  const keys = Object.keys(MT.neroKeywords);
  keys.sort((a, b) => {
    const at = MT.neroKeywords[a]?.title || "";
    const bt = MT.neroKeywords[b]?.title || "";
    return at < bt ? -1 : at > bt ? +1 : 0;
  });

  const revealAll = V.mn_playerLeftStudyWithMirror || T.lockpick;
  const mr = MT.mdRecord();
  let anyShown = false;

  let mkp = "<<nobr>>";
  for (const key of keys) {
    if (!revealAll && !mr[key]) continue;
    anyShown = true;
    mkp += `<<arc-ending ${mr[key]}`;
    mkp += ` [\[${MT.neroKeywords[key]?.title}|g1m Archives Entry]]`;
    mkp += ` "" "$g_arcChoice = { name: '${key}' }">>`;
    mkp += `<</arc-ending>>\n`;
  }
  if (!anyShown) {
    mkp += `No keywords found yet.`;
  }
  mkp += "<</nobr>>";
  return mkp;
};

/**
 * <<kw-unlock-soon kn_Name>>
 * If kwName is locked, set it to unlock at the next kw-announce.
 */
Macro.add("kw-unlock-soon", {
  handler: function () {
    if (State.temporary.isArchive) return;

    const [key] = this.args;
    const kw = MT.neroKeywords[key];
    if (kw == null) {
      throw new Error(`kw-unlock-soon ${key} not found`);
    }
    const V = State.variables;
    const vars = /** @type {Record<string, unknown>} */ (V);
    if (!vars[key]) {
      if (V.n_kwAnnounce != null && V.n_kwAnnounce !== key) {
        throw new Error(`conflicting kwAnnounce ${key} ${V.n_kwAnnounce}`);
      }
      V.n_kwAnnounce = key;
      State.temporary.kwUnlocking = true;
    }
  },
});

/**
 * <<kw-announce>>
 * If a kw unlock is pending, do it, and announce it.
 */
Macro.add("kw-announce", {
  handler: function () {
    const V = State.variables;
    const key = V.n_kwAnnounce;
    if (key == null) return;

    delete V.n_kwAnnounce;
    const kw = MT.neroKeywords[key];
    if (kw == null) {
      throw new Error(`kw-announce ${key} not found`);
    }

    MT.mdSet(key, true);

    $(this.output).wiki(
      `<meta-text>\
        The Archives have unlocked Keyword: ${kw.title}.\
      </meta-text>\
      ?P`
    );
  },
});

const neroKeywordInit = () => {
  Object.keys(MT.neroKeywords).map(MT.mdDefSaved);

  $(document).on(":passageend", () => {
    const T = State.temporary;
    const isMenu = tags().includes("is-menu");
    const kwAnnounce = MT.untracedGet("n_kwAnnounce");
    if (!T.kwUnlocking && kwAnnounce != null && !isMenu) {
      MT.error(`missing kw-announce for ${kwAnnounce}`);
    }
  });
}

neroKeywordInit();
