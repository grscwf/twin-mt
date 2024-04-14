/**
 * @typedef {object} Constraint
 * @prop {Record<string, unknown>} implies
 */

// - Flags are booleans where null or undefined is equivalent to false.
// - "implies" are constraints on other vars when the flag is true.
//   - The constraints can be any type of value, not just flags.

/** @type {Record<string, Constraint>} */
const flags = {
  n_abused: {
    implies: {
      // no constraints
    },
  },

  n_bookcasesLanced: {
    implies: {
      n_bookcasesViewed: true,
      n_free: true,
      n_mageSight: true,
      n_tooClever: true,
    },
  },

  n_booksLanced: {
    implies: {
      n_booksViewed: true,
      n_free: true,
      n_mageSight: true,
      n_tooClever: true,
    },
  },
  n_booksPileBurned: {
    implies: {
      n_bookcasesLanced: true,
      n_wandExploded: true,
    },
  },
  n_booksShredsBurned: {
    implies: {
      n_booksLanced: true,
      n_wandExploded: true,
    },
  },

  n_cabinetsLanced: {
    implies: {
      n_free: true,
      n_tooClever: true,
    },
  },
  n_cabinetsUnderViewed: {
    implies: {
      n_free: true,
      n_penguinCoinDropped: true,
    },
  },

  n_candleHorny: {
    implies: {
      n_candleLit: true,
      n_extraHorny: false,
      n_free: false,
      n_ivexReceptive: false,
      n_naked: true,
      n_tooClever: false,
    },
  },

  n_candleLit: {
    implies: {
      n_extraHorny: false,
      n_free: false,
      n_ivexReceptive: false,
      n_paintingLanced: false,
      n_tooClever: false,
      n_wandExploded: false,
      n_windowBroken: false,
    },
  },

  n_castItch: {
    implies: {
      n_ivexReceptive: false,
    },
  },

  n_coinsInBook: {
    implies: {
      n_coinsInPorn: false,
      n_coinsLanced: true,
      n_mageSight: true,
    },
  },
  n_coinsInPorn: {
    implies: {
      n_coinsInBook: false,
      n_coinsLanced: true,
      n_mageSight: true,
    },
  },
  n_coinsLanced: {
    implies: {
      n_free: true,
      n_mageSight: true,
    },
  },

  n_deskBurned: {
    implies: {
      n_mageSight: false,
    },
  },
  n_deskSearchedAgain: {
    implies: {
      n_deskSearched: true,
    },
  },

  n_extraHorny: {
    implies: {
      n_candleHorny: false,
      n_candleLit: false,
      n_free: true,
      n_ivexGone: true,
      n_ivexReceptive: false,
      n_naked: true,
    },
  },

  n_free: {
    implies: {
      n_candleHorny: false,
      n_candleLit: false,
      n_ivexGone: true,
      n_ivexReceptive: false,
      n_naked: true,
    },
  },

  n_gravAsked: {
    implies: {
      n_gravViewed: true,
    },
  },
  n_gravViewed: {
    implies: {
      n_gravNoticed: true,
    },
  },

  n_ivexGone: {
    implies: {
      n_ivexReceptive: false,
      n_naked: true,
    },
  },
  n_ivexReceptive: {
    implies: {
      n_candleLit: false,
      n_candleHorny: false,
      n_castItch: false,
      n_extraHorny: false,
      n_free: false,
      n_ivexGone: false,
      n_tooClever: false,
    },
  },
  n_knifeOnFloor: {
    implies: {
      // n_free is briefly false
      n_knifeTaken: false,
    },
  },
  n_knifeTaken: {
    implies: {
      n_free: true,
      n_naked: true,
      n_knifeOnFloor: false,
    },
  },

  n_mageSight: {
    implies: {
      n_deskBurned: false,
      n_mirrorBroken: false,
      n_naked: true,
    },
  },

  n_mapDefaced: {
    implies: {
      n_free: true,
      n_naked: true,
      n_tooClever: true,
      n_windowBroken: true,
    },
  },

  n_mirrorBroken: {
    implies: {
      n_mageSight: false,
      n_mirrorMagicKnown: true,
      n_mirrorTaken: false,
      n_mirrorTapped: false,
      n_mirrorWasTapped: true,
    },
  },
  n_mirrorMagicKnown: {
    implies: {
      n_mirrorViewed: true,
    },
  },
  n_mirrorTaken: {
    implies: {
      n_mageSight: true,
      n_mirrorBroken: false,
      n_mirrorMagicKnown: true,
      n_mirrorTapped: true,
      n_mirrorWasTapped: true,
    },
  },
  n_mirrorTapped: {
    implies: {
      n_mageSight: true,
      n_mirrorBroken: false,
      n_mirrorMagicKnown: true,
      n_mirrorViewed: true,
      n_mirrorWasTapped: true,
    },
  },
  n_mirrorWasTapped: {
    implies: {
      n_mirrorMagicKnown: true,
    },
  },

  n_naked: {
    implies: {
      // no constraints
    },
  },

  n_paintingBlasted: {
    implies: {
      n_mageSight: true,
      n_wandExploded: true,
      n_windowBroken: true,
    },
  },
  n_paintingHasBill: {
    implies: {
      n_paintingLanced: true,
    },
  },
  n_paintingLanced: {
    implies: {
      n_candleLit: false,
      n_mageSight: true,
      n_windowBroken: true,
    },
  },

  n_pawed: {
    implies: {
      n_extraHorny: true,
    },
  },

  n_penguinFlown: {
    implies: {
      n_free: true,
      n_mageSight: true,
      n_tooClever: true,
    },
  },
  n_penguinTorn: {
    implies: {
      n_free: true,
      n_mageSight: true,
      n_tooClever: true,
    },
  },

  n_pornLanced: {
    implies: {
      n_booksViewed: true,
      n_booksSearched: true,
      n_free: true,
      n_tooClever: true,
    },
  },
  n_roomFlipped: {
    implies: {
      n_naked: true,
    },
  },

  n_subby: {
    implies: {
      n_naked: true,
    },
  },

  n_tooClever: {
    implies: {
      n_bottleViewed: true,
      n_candleHorny: false,
      n_candleLit: false,
      n_free: true,
      n_ivexGone: true,
      n_ivexReceptive: false,
      n_mageSight: true,
      n_magicPhase: MP_contact,
      n_naked: true,
    },
  },

  n_tough: {
    implies: {
      n_abused: true,
    },
  },

  n_wandAsked: {
    implies: {
      n_wandRanAway: false,
    },
  },
  n_wandExploded: {
    implies: {
      n_candleLit: false,
      n_mageSight: true,
      n_tooClever: true,
      n_wandTubeShot: true,
      n_windowBroken: true,
    },
  },
  n_wandRanAway: {
    implies: {
      n_wandAsked: false,
      n_wandTubeShot: false,
      n_wandUsed: false,
    },
  },
  n_wandRefused: {
    implies: {
      n_wandAsked: true,
    },
  },
  n_wandTouched: {
    implies: {
      n_wandAsked: true,
    },
  },
  n_wandTubeShot: {
    implies: {
      n_tooClever: true,
      n_wandRanAway: false,
    },
  },
  n_wandUsed: {
    implies: {
      n_extraHorny: true,
      n_wandAsked: true,
      n_wandRanAway: false,
    },
  },

  n_windowBroken: {
    implies: {
      n_candleLit: false,
      n_mageSight: true,
    },
  },
};

const checkFlags = () => {
  if (!setup.playtest) return;
  Object.keys(flags).forEach((x) => {
    // check contrapositive
    const imp = flags[x]?.implies || {};
    Object.keys(imp).forEach((y) => {
      if (imp[y] === false) {
        const yf = flags[y];
        if (yf == null || yf.implies == null || yf.implies[x] !== false) {
          MT.warn(`Missing contrapositive: ${x} implies !${y}`);
        }
      }
    });
  });
}

checkFlags();

/** @type {Record<string, Record<number, Record<string, unknown>>>} */
const enumImplies = {
  n_magicPhase: {
    [MP_beforeCast]: {
      n_booksAsked: false,
      n_magicPhaseReached: MP_beforeCast,
      n_mirrorTapped: false,
      n_mirrorWasTapped: false,
      n_wandAsked: false,
      n_free: false,
      n_mirrorBroken: false,
      n_wandRanAway: false,
      n_wandRefused: false,
      n_wandUsed: false,
    },
    [MP_triedMagic]: {
      n_booksAsked: false,
      n_magicPhaseReached: MP_triedMagic,
      n_mirrorTapped: false,
      n_mirrorWasTapped: false,
      n_wandAsked: false,
      n_free: false,
      n_mirrorBroken: false,
      n_wandRanAway: false,
      n_wandRefused: false,
      n_wandUsed: false,
    },
    [MP_wantDevice]: {
      n_booksAsked: false,
      n_mageSight: true,
      n_magicPhaseReached: MP_wantDevice,
      n_mirrorTapped: true,
      n_mirrorWasTapped: true,
      n_naked: true,
      n_wandAsked: false,
      n_free: false,
      n_mirrorBroken: false,
      n_wandRanAway: false,
      n_wandRefused: false,
      n_wandUsed: false,
    },
    [MP_wantName]: {
      n_booksAsked: false,
      n_bottleViewed: true,
      n_mageSight: true,
      n_magicPhaseReached: MP_wantName,
      n_mirrorTapped: true,
      n_mirrorWasTapped: true,
      n_naked: true,
      n_wandAsked: false,
      n_mirrorBroken: false,
      n_wandRanAway: false,
      n_wandRefused: false,
      n_wandUsed: false,
    },
    [MP_wantTouch]: {
      n_booksAsked: false,
      n_bottleNameKnown: true,
      n_bottleViewed: true,
      n_mageSight: true,
      n_magicPhaseReached: MP_wantTouch,
      n_mirrorTapped: true,
      n_mirrorWasTapped: true,
      n_naked: true,
      n_free: false,
      n_mirrorBroken: false,
      n_wandRanAway: false,
      n_wandRefused: false,
      n_wandUsed: false,
    },
    [MP_wantPass]: {
      n_bottleNameKnown: true,
      n_bottleViewed: true,
      n_mageSight: true,
      n_magicPhaseReached: MP_wantPass,
      n_mirrorTapped: true,
      n_mirrorWasTapped: true,
      n_naked: true,
      // can't pass wantTouch without asking about penguin
      n_penguinAsked: true,
      n_free: false,
      n_mirrorBroken: false,
      n_wandRanAway: false,
      n_wandRefused: false,
      n_wandUsed: false,
    },
    [MP_onHold]: {
      n_bottleNameKnown: true,
      n_bottleViewed: true,
      n_mageSight: true,
      n_magicPhaseReached: MP_wantPass,
      n_mirrorTapped: true,
      n_mirrorWasTapped: true,
      n_naked: true,
      n_penguinAsked: true,
      n_free: false,
      n_mirrorBroken: false,
      n_wandRanAway: false,
      n_wandRefused: false,
      n_wandUsed: false,
    },
    [MP_exitingHold]: {
      n_bottleNameKnown: true,
      n_bottleViewed: true,
      n_mageSight: true,
      n_magicPhaseReached: MP_wantPass,
      n_mirrorTapped: true,
      n_mirrorWasTapped: true,
      n_naked: true,
      n_penguinAsked: true,
      n_free: false,
      n_mirrorBroken: false,
      n_wandRanAway: false,
      n_wandRefused: false,
      n_wandUsed: false,
    },
    [MP_contact]: {
      n_bottleNameKnown: true,
      n_bottleViewed: true,
      n_mageSight: true,
      n_magicPhaseReached: MP_contact,
      n_mirrorTapped: true,
      n_mirrorWasTapped: true,
      n_naked: true,
      n_passIsKnown: true,
      n_penguinAsked: true,
      n_free: true,
      n_ivexGone: true,
      n_mirrorBroken: false,
      n_tooClever: true,
    },
    [MP_lockedOut]: {
      n_bottleViewed: true,
      n_mageSight: true,
      n_magicPhaseReached: MP_wantPass,
      n_mirrorTapped: true,
      n_mirrorWasTapped: true,
      n_naked: true,
      n_free: false,
      n_mirrorBroken: false,
      n_tooClever: false,
      n_wandRanAway: false,
      n_wandRefused: false,
      n_wandUsed: false,
    },
    [MP_drained]: {
      n_mageSight: false,
      n_magicPhaseReached: MP_triedMagic,
      n_mirrorTapped: false,
      n_mirrorWasTapped: false,
      n_naked: true,
      n_extraHorny: true,
      n_free: true,
      n_ivexGone: true,
      n_mirrorBroken: false,
      n_tooClever: false,
    },
    [MP_tapLost]: {
      // n_mageSight is usually true, but can be false when tap-before-cast
      n_mirrorTapped: false,
      n_mirrorWasTapped: true,
      n_naked: true,
      n_extraHorny: true,
      n_free: true,
      n_ivexGone: true,
      n_tooClever: false,
    },
  },

  n_magicPhaseReached: {
    [MP_beforeCast]: {
      n_mirrorTapped: false,
      n_mirrorWasTapped: false,
      n_tooClever: false,
    },
    [MP_triedMagic]: {
      n_mirrorWasTapped: false,
      n_naked: true,
      n_tooClever: false,
    },
    [MP_wantDevice]: {
      n_mirrorWasTapped: true,
      n_naked: true,
      n_tooClever: false,
    },
    [MP_wantName]: {
      n_bottleViewed: true,
      n_mirrorWasTapped: true,
      n_naked: true,
      n_tooClever: false,
    },
    [MP_wantTouch]: {
      n_bottleNameKnown: true,
      n_bottleViewed: true,
      n_mirrorWasTapped: true,
      n_naked: true,
      n_tooClever: false,
    },
    [MP_wantPass]: {
      n_bottleNameKnown: true,
      n_bottleViewed: true,
      n_mirrorWasTapped: true,
      n_naked: true,
      n_passIsKnown: false,
      // escaped at wantPass, but pawed off, didn't try to rescue mirror,
      // didn't get contact, mirror not broken.
      n_mirrorBroken: false,
      n_tooClever: false,
    },
    [MP_onHold]: {
      impossible: true,
    },
    [MP_exitingHold]: {
      impossible: true,
    },
    [MP_contact]: {
      // can lose at contact: escaped at wantPass, didn't paw off,
      // tried to rescue mirror, said password, got brief contact,
      // mirror broken.
      n_bottleNameKnown: true,
      n_bottleViewed: true,
      n_mirrorWasTapped: true,
      n_naked: true,
      n_passIsKnown: true,
      n_free: true,
      n_ivexGone: true,
    },
    [MP_lockedOut]: {
      impossible: true,
    },
    [MP_drained]: {
      impossible: true,
    },
    [MP_tapLost]: {
      impossible: true,
    },
  },
};

/**
 * @arg {Record<string, unknown>} state
 * @arg {Set<string>} used
 * @arg {boolean} interactive
 * @arg {Record<string, unknown>} [activeState]
 */
MT.checkState = (state, used, interactive, activeState) => {
  // Check flags
  for (const x of Object.keys(flags)) {
    // Ignore flag if it's been deleted
    if (activeState && !(x in activeState)) continue;

    // Check implications for true flags
    if (!state[x]) continue;
    if (used && !used.has(x)) continue;
    const imp = flags[x]?.implies || {};
    for (const y of Object.keys(imp)) {
      if (used && !used.has(y)) continue;
      const val = state[y] == null ? false : state[y];
      const exp = imp[y];
      if (val !== exp) {
        if (!interactive) return false;
        const expStr =
          typeof exp !== "boolean" ? `${y} === ${exp}` : exp ? y : `!${y}`;
        MT.error(
          `${x} === ${state[x]} should imply ${expStr}; currently, ${y} === ${state[y]}`
        );
      }
    }
  }

  // Check enum implications
  for (const x of Object.keys(enumImplies)) {
    const imp = enumImplies[x] || {};
    const xVal = state[x];
    if (typeof xVal !== "number") continue;
    const rules = imp[xVal];
    if (rules == null) continue;
    if (rules.impossible) {
      if (!interactive) return false;
      const sVal = MT.enumSymbol(x, state[x]);
      MT.error(`${x} === ${sVal} should be impossible`);
      continue;
    }
    if (used && !used.has(x)) continue;
    for (const y of Object.keys(rules)) {
      if (used && !used.has(y)) continue;
      const val = state[y] == null ? false : state[y];
      const exp = rules[y];
      if (val !== exp) {
        if (!interactive) return false;
        const expStr =
          typeof exp !== "boolean" ? `$[y} === ${exp}` : exp ? y : `!${y}`;
        const sVal = MT.enumSymbol(x, state[x]);
        MT.error(
          `${x} === ${sVal} should imply ${expStr}; currently, ${y} === ${state[y]}`
        );
      }
    }
  }
  return true;
};

const checkConstraints = () => {
  const here = State.passage;
  if (!/^n/.test(here)) return true;
  return MT.untraced(() => {
    /* note: current (incoming) state, not active state */
    return MT.checkState(
      /** @type {Record<string, unknown>} */ (State.current.variables),
      MT.trace.wasRead,
      true,
      /** @type {Record<string, unknown>} */ (State.active.variables)
    );
  });
};

$(document).on(":passageend", checkConstraints);
