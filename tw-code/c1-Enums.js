/**
 * enumType:string -> enumValueNames:string[]
 * @type {Record<string, string[]>}
 */
MT.enums = {};

/**
 * varName:string -> enumType:string
 * @type {Record<string, string>}
 */
MT.enumVars = {};

/**
 * Returns the symbolic name of `value` for an enum.
 * `name` is either a var name or an enum name.
 * @type {(name: string, value: unknown) => string}
 */
MT.enumSymbol = (name, value) => {
  const en = MT.enums[MT.enumVars[name] || name];
  return (
    (en != null && typeof value === "number" && en[value]) || `${name}=${value}`
  );
};

/**
 * Initialize enums that are generally expected to be non-null.
 * @type {() => void}
 */
MT.enumInit = () => {
  MT.untraced(() => {
    const V = State.variables;
    if (!V.n_magicPhase) V.n_magicPhase = MP_beforeCast;
    if (!V.n_magicPhaseReached) V.n_magicPhaseReached = MP_beforeCast;
    if (!V.n_ivexContext) V.n_ivexContext = IC_distant;
  });
};

/**
 * Define an enum. Value names are added as window globals,
 * so that typo-ing an enum value will throw an error.
 * @type {(enumType: string, enumValueNames: string[]) => void}
 */
const enumDefine = (enumType, enumValueNames) => {
  MT.enums[enumType] = enumValueNames;
  const global = /** @type {Record<string, unknown>} */ (
    /** @type {unknown} */ (window)
  );
  enumValueNames.forEach((n, i) => (global[n] = i));
};

/**
 * Declare `valName` to be an enum of `enumType`
 * @type {(valName: string, enumType: string) => void}
 */
const enumDeclareVar = (valName, enumType) => {
  if (!MT.enums[enumType]) {
    MT.fail(`No enum named ${enumType}`);
  }
  MT.enumVars[valName] = enumType;
};

/* Nero magic phase. */
enumDefine("MagicPhase", [
  "MP_beforeCast",
  "MP_triedMagic",
  "MP_wantDevice",
  "MP_wantName",
  "MP_wantTouch",
  "MP_wantPass",
  "MP_onHold",
  "MP_exitingHold",
  "MP_contact",
  "MP_lockedOut",
  "MP_drained", // had mageSight, but didn't connect to Sprite
  "MP_tapLost", // did connect to Sprite
]);

enumDeclareVar("n_magicPhase", "MagicPhase");
enumDeclareVar("n_magicPhaseReached", "MagicPhase");

/*
 * Places where Ivex has asked a question, and may be near enough to hear
 * Nero trying to talk to the Sprite.
 */
enumDefine("IvexContext", [
  "IC_distant",
  "IC_gone",
  "IC_guildName", // recruit > Skeptical
  "IC_mindControl", // recruit > Fascinated
  "IC_explainTheft", // recruit > Ivex Trap
  "IC_obeyMe", // collab > Ivex Demanding
  "IC_lickPaw", // collab > Ivex Dominant
  "IC_begForMe", // collab > Ivex Cruel
  "IC_comfortable", // candle lit > Comfort Check
  "IC_whoSentYou", // candle horny > Light Squeeze, Heavy Squeeze
]);

enumDeclareVar("n_ivexContext", "IvexContext");

// This should get run before most other :passagestart handlers
$(document).on(":passagestart", MT.enumInit);
