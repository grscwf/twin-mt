// Passages are grouped into sections by a prefix code in their title.
// - Prefix should start with a lowercase letter, followed by a number,
//   followed by more lowercase numbers.
// - Prefix should be separated from the rest of the passage title with
//   a space or `-`.
// - Use prefixes that are not words used elsewhere. This makes it easy to
//   search for all occurrences of a passage title.

/** Passages that don't have a section code prefix */
const sectSpecial = new Set([
  // Twee special passages
  "Story JavaScript",
  "Story Stylesheet",

  // Twine special passages
  "StoryAuthor",
  "StoryBanner",
  "StoryData",
  "StoryDisplayTitle",
  "StoryInit",
  "StoryMenu",
  "StoryTitle",
]);

// For each section:
// - `expect` is state vars that are expected to be specific values.
//   - The value `false` means it can be `false`, `undefined`, or `null`.
//   - Any other value must match exactly.
//   - There usually doesn't need to be a declaration for false in
//     sections before a state var is ever set.
//   - There probably should be a declaration for false if a state var
//     can become false, to verify all paths do set it to false.
// - `notable` is state vars that should affect the passage text.
//   - The value can be `true` or a regex.
//   - A regex means, passage should use the state var only if its text
//     matches that regex.

/**
 * @typedef {object} SectDef
 * @prop {Record<string, unknown>} [expect]
 * @prop {Record<string, boolean | RegExp>} [notable]
 */

/** @type {Record<string, SectDef>} */
const sectDefs = {
  // Passages loaded after g0boot, during StoryInit
  g0init: {},

  // Story opening passages
  g1a: {},

  // Story meta passages
  g1m: {},

  // Drekkar meta passages
  d0a: {},

  // Drekkar 1F until Ivex leaves
  d1a: {},

  // Drekkar 1F after Ivex leaves
  d2a: {},

  // Drekkar 2F
  d3a: {},

  // Drekkar outside
  d4a: {},

  // Drekkar bad endings
  d9a: {},

  // Drekkar interrogation ending
  d9b: {},

  // Drekkar good endings
  d9x: {},

  // Drekkar punishment ending
  d9y: {},

  // Nero meta passages
  n0a: {},

  // Nero 1F intro
  n1a: {
    notable: {
      n_mageSight: true,
    },
  },

  // Nero convo, neutral mood
  n1cn: {
    notable: {
      n_abused: true,
      n_mageSight: true,
      n_naked: true,
    },
  },

  // Nero convo, Ivex receptive
  n1cr: {
    expect: {
      n_ivexReceptive: true,
    },
    notable: {
      n_abused: true,
      n_mageSight: true,
      n_naked: true,
    },
  },

  // Nero convo, subby mood
  n1cs: {
    expect: {
      n_naked: true,
      n_subby: true,
      n_ivexReceptive: true,
    },
    notable: {
      // n_abused: subby usually dominates
      n_mageSight: true,
    },
  },

  // Nero convo, transition to candle
  n1cx: {
    expect: {
      n_ivexReceptive: false,
    },
    notable: {
      n_abused: true,
      n_mageSight: true,
      n_naked: true,
      n_subby: true,
      n_tough: true,
    },
  },

  // Nero candle lit
  n1d: {
    expect: {
      n_candleLit: true,
      n_ivexReceptive: false,
    },
    notable: {
      n_abused: true,
      n_mageSight: true,
      n_naked: true,
      n_subby: true,
      n_tough: true,
    },
  },

  // Nero candle horny
  n1e: {
    expect: {
      n_candleHorny: true,
      n_candleLit: true,
      n_naked: true,
      n_ivexReceptive: false,
    },
    notable: {
      n_abused: true,
      n_mageSight: true,
      n_subby: true,
      n_tough: true,
    },
  },

  // Nero being clever
  n1f: {
    expect: {
      n_naked: true,
    },
  },

  // Nero barbs choice
  n1p: {
    expect: {
      n_candleHorny: false,
      n_mageSight: false,
    },
  },

  // Nero magic/sprite
  n1s: {
    expect: {
      n_free: false,
    },
    notable: {
      // make sure Ivex is wearing mask when candle lit
      n_candleLit: /ivex/im,
      n_ivexGone: true,
    },
  },

  // Nero looking
  n1x: {
    expect: {
      n_candleHorny: false,
    },
    notable: {
      // make sure Ivex is wearing mask when candle lit
      n_candleLit: /ivex/im,
      n_mageSight: true,
      n_free: true,
      n_ivexGone: true,
    },
  },

  // Nero horny looking
  n1y: {
    expect: {
      n_candleHorny: true,
      n_candleLit: true,
      n_naked: true,
    },
    notable: {
      n_mageSight: true,
      n_ivexGone: true,
    },
  },

  // Nero 1F alone intro
  n2a: {
    expect: {
      n_candleHorny: false,
      n_candleLit: false,
      n_naked: true,
      n_ivexGone: true,
      n_ivexReceptive: false,
    },
    notable: {
      n_mageSight: true,
    },
  },

  // Nero alone with candle
  n2b: {
    expect: {
      n_candleLit: true,
      n_naked: true,
      n_ivexGone: true,
      n_ivexReceptive: false,
    },
    notable: {
      n_mageSight: true,
    },
  },

  // Nero escaping cross
  n2c: {
    expect: {
      n_naked: true,
      n_ivexGone: true,
      n_ivexReceptive: false,
    },
    notable: {
      n_mageSight: true,
    },
  },

  // Nero free on 1F
  n2f: {
    expect: {
      n_naked: true,
      n_ivexGone: true,
      n_ivexReceptive: false,
    },
    notable: {
      n_mageSight: true,
      n_extraHorny: true,
      n_tooClever: true,
    },
  },

  // Nero looking while free
  n2x: {
    expect: {
      n_naked: true,
      n_ivexGone: true,
      n_ivexReceptive: false,
    },
    notable: {
      n_mageSight: true,
      n_extraHorny: true,
      n_tooClever: true,
    },
  },

  // Nero using wand
  n2y: {
    expect: {
      n_naked: true,
      n_ivexGone: true,
      n_ivexReceptive: false,
    },
    notable: {
      n_mageSight: true,
      n_extraHorny: true,
      n_tooClever: true,
    },
  },

  // Nero 2F sketch
  n3a: {
    expect: {
      n_naked: true,
      n_ivexGone: true,
      n_ivexReceptive: false,
    },
    notable: {
      n_mageSight: true,
      n_extraHorny: true,
    },
  },

  // Nero 1F endings
  n9a: {
    expect: {
      n_naked: true,
    },
  },

  // Nero 2F endings
  n9e: {},

  // Nero escaped endings
  n9x: {},

  // Passages without a section tag
  other: {},
};

/**
 * Returns section name of passageTitle.
 * @type {(title: string) => string}
 */
const sectOf = (title) => {
  const re = /^([a-z][a-z0-9]+)[- ]/;
  const m = re.exec(title);
  return (m && m[1]) || "other";
};

/** Returns section name of current passage. */
MT.sectHere = () => sectOf(State.passage);

/**
 * Returns expected state in sect
 * @type {(sect: string) => Record<string, unknown>}
 */
MT.sectExpect = (sect) => sectDefs[sect]?.expect || {};

/**
 * @type {(vname: string) => unknown}
 */
MT.varExpect = (vname) => {
  const sect = MT.sectHere();
  if (!sectDefs[sect]) return null;
  const expect = sectDefs[sect]?.expect || {};
  return expect[vname];
};

/**
 * @type {(sect: string, vname: string) => boolean}
 */
MT.isNotable = (sect, vname) => {
  if (!sectDefs[sect]) return false;
  const notable = sectDefs[sect]?.notable;
  if (!notable) return false;
  const exp = notable[vname];
  if (exp instanceof RegExp) {
    const text = Story.get(State.passage).text;
    return exp.test(text);
  }
  return exp || false;
};

MT.allNotable = () => {
  const sect = MT.sectHere();
  if (!sectDefs[sect]) return [];
  const notable = sectDefs[sect]?.notable;
  if (!notable) return [];
  const result = [];
  let text = null;
  for (const [vn, exp] of Object.entries(notable)) {
    if (exp instanceof RegExp) {
      if (text == null) text = Story.get(State.passage).text;
      if (exp.test(text)) result.push(vn);
    } else if (exp) {
      result.push(vn);
    }
  }
  return result;
};

/** Validates sectionDefs and passage titles. */
const sectCheckAll = () => {
  if (!setup.debug) return;

  // Verify every passage title has a valid section tag.
  const sectsUsed = new Set();
  for (const p of Story.lookupWith(() => true)) {
    const sect = sectOf(p.title);
    if (!sectDefs[sect] && !sectsUsed.has(sect)) {
      MT.diag(`Warning: [\[${p.title}]] section ${sect} not defined`);
    }
    sectsUsed.add(sect);

    if (sect === "other" && !sectSpecial.has(p.title)) {
      MT.diag(`Warning: [\[${p.title}]] should have a section code`);
    }
  }

  // Verify all section tags are used.
  for (const sect of Object.keys(sectDefs)) {
    if (!sectsUsed.has(sect)) {
      MT.diag(`Warning: section ${sect} is never used`);
    }
  }

  // Verify sectionDefs have a sensible structure
  const expectedKeys = ["expect", "notable"];
  for (const [sect, def] of Object.entries(sectDefs)) {
    const typos = Object.keys(def).filter((k) => expectedKeys.indexOf(k) < 0);
    if (typos.length) {
      MT.diag(`Warning: sectionDefs.${sect} has unknown keys [${typos}]`);
    }
  }
};

/**
 * Verifies stateObj is correct for sectName.
 * @arg {Record<string, unknown>} stateObj
 * @arg {string} sectName
 * @arg {boolean} quietly
 * @arg {Set<string>} [onlySet]
 */
MT.checkSectionState = (stateObj, sectName, quietly, onlySet) => {
  if (!sectDefs[sectName]) return;
  const expect = sectDefs[sectName]?.expect;
  if (!expect) return true;
  let allOk = true;
  for (const [vn, val] of Object.entries(expect)) {
    if (onlySet && !onlySet.has(vn)) continue;
    const ok = stateObj[vn] === val || (val === false && stateObj[vn] == null);
    if (!ok) {
      if (quietly) return false;
      allOk = false;
      MT.fail(`${vn} should be ${val} in ${sectName}, not ${stateObj[vn]}`);
    }
  }
  return allOk;
};

/** Verifies current state is correct at current location. */
const sectCheckHere = () => {
  // Note, incoming state, not modified state.
  const s0 = /** @type {Record<string, unknown>} */ (State.current.variables);
  const sect = MT.sectHere();
  MT.checkSectionState(s0, sect, false);
};

sectCheckAll();
$(document).on(":passageend", sectCheckHere);
