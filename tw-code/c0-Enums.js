(() => {
  /** enumType:string -> enumValueNames:string[] */
  MT.enums = {};

  /** varName:string -> enumType:string */
  MT.enumVars = {};

  /**
   * Define an enum. Value names are added as window globals,
   * so that typo-ing an enum value will throw an error.
   * @type {(enumType: string, enumValueNames: string[]) => void}
   */
  function defineEnum(enumType, enumValueNames) {
    MT.enums[enumType] = enumValueNames;
    const global = /** @type {Record<string, unknown>} */ (
      /** @type {unknown} */ (window)
    );
    enumValueNames.forEach((n, i) => (global[n] = i));
  }

  /**
   * Declare `valName` to be an enum of `enumType`
   * @type {(valName: string, enumType: string) => void}
   */
  function declareVarEnum(valName, enumType) {
    if (!MT.enums[enumType]) throw new Error(`No enum named ${enumType}`);
    MT.enumVars[valName] = enumType;
  }

  /**
   * Returns the symbolic name of `value` for an enum.
   * `name` is either a var name or an enum name.
   * @type {(name: string, value: number) => string}
   */
  MT.enumSymbol = (name, value) => {
    const en = MT.enums[MT.enumVars[name] || name];
    return en == null ? String(value) : en[value] || String(value);
  };

  /* Nero magic phase. */
  defineEnum("MagicPhase", [
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

  declareVarEnum("n_magicPhase", "MagicPhase");
  declareVarEnum("n_magicPhaseReached", "MagicPhase");

  /*
   * Places where Ivex has asked a question, and may be near enough to hear
   * Nero trying to talk to the Sprite.
   */
  defineEnum("IvexContext", [
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

  declareVarEnum("n_ivexContext", "IvexContext");

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

  // This should get run before most other :passagestart handlers
  $(document).on(":passagestart", MT.enumInit);
})();
