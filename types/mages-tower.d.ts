import type {
  SugarCubeStoryVariables,
  SugarCubeTemporaryVariables,
} from "twine-sugarcube";

/** Enums */
declare global {
  const MP_beforeCast: number;
  const MP_triedMagic: number;
  const MP_wantDevice: number;
  const MP_wantName: number;
  const MP_wantTouch: number;
  const MP_wantPass: number;
  const MP_onHold: number;
  const MP_exitingHold: number;
  const MP_contact: number;
  const MP_lockedOut: number;
  const MP_drained: number;
  const MP_tapLost: number;

  const IC_distant: number;
  const IC_gone: number;
  const IC_guildName: number;
  const IC_mindControl: number;
  const IC_explainTheft: number;
  const IC_obeyMe: number;
  const IC_lickPaw: number;
  const IC_begForMe: number;
  const IC_comfortable: number;
  const IC_whoSentYou: number;
}

/** Types */
declare global {
  type NextLink = {
    title?: string;
    code?: string;
  };

  /** Arguments for rendering a transcript page. */
  type TranscriptPage = {
    /** Page to render. */
    title: string;
    /** Variables to set before rendering. */
    vars?: SugarCubeStoryVariables;
    /** Temporaries to set before rendering. */
    temps?: SugarCubeTemporaryVariables;
    /** Next-page link to highlight. */
    next?: NextLink;
  };
}

/** The MT global */
declare global {
  const MT: {
    /**
     * Creates a scratch state with _isArchive and _isTranscript true,
     * evaluate script, then render passage to dest
     */
    arcRender: (
      dest: DocumentFragment | HTMLElement,
      passage: string,
      script: string
    ) => void;

    assert: (test: boolean, should: string) => asserts test;

    /** Returns number of words in text. */
    countWords: (text: string) => number;

    /** Queue a diag message. */
    diag: (...args: unknown[]) => void;

    /** Show pending diag messages. */
    diagReport: () => void;

    /** Sets some enum vars expected to have non-null values. */
    enumInit: () => void;

    /**
     * Returns the symbolic name of `value` for an enum.
     * `name` is either a var name or an enum name.
     */
    enumSymbol: (name: string, value: number) => string;

    /** varName:string -> enumType:string */
    enumVars: Record<string, string>;

    /** enumType:string -> enumValueNames:string[] */
    enums: Record<string, string[]>;

    /** Generic container for exposing functions for console experimentation */
    exp: Record<string, unknown>;

    forgetWalkHistory: () => void;

    /** Returns history without is-menu loops. */
    getHistory: () => StoryMoment[];

    /**
     * Returns the HTMLElement from a JQuery handle.
     * Throws if the handle is not exactly one element.
     */
    jqUnwrap: (jq: JQuery) => HTMLElement;

    /** Deletes all metadata, except for IGNORED keys. */
    mdClear: () => void;

    /**
     * Defines `key` to be UNSAVED metadata, which means:
     * - it ISN'T stored in saved games.
     * - it IS mirrored to State.variables.
     * - it IS deleted by "clear metadata".
     */
    mdDefUnsaved: (key: string) => void;

    /**
     * Defines `key` to be SAVED metadata, which means;
     * - it IS stored in saved games.
     * - it IS mirrored to State.variables.
     * - it IS deleted by "clear metadata".
     * - loading a saved game will set its value from the saved game,
     *   but only if it isn't already set.
     */
    mdDefSaved: (key: string) => void;

    /**
     * Defines `key` to be IGNORED metadata, which means:
     * - it ISN'T stored in saved games.
     * - it ISN'T mirrored to State.variables.
     * - it ISN'T deleted by "clear metadata".
     */
    mdDefIgnored: (key: string) => void;

    /** Returns an array of all [key, value] metadata entries. */
    mdEntries: () => Array<[key: string, value: unknown]>;

    /**
     * Returns the value of metadata `key`.
     *
     * Note, each call will always decompress and deserialize
     * all metadata from localStorage, so this is somewhat expensive.
     *
     * If you don't need the authoritative value, you can read the
     * copy in State.variables (which might be out-of-date if the
     * value was changed in another tab).
     *
     * If you want more than a few authoritative values at a time,
     * use `MT.mdEntries` or `MT.mdRecord`.
     */
    mdGetUncached: (key: string) => unknown;

    /**
     * True if `key` is a known metadata key.
     */
    mdKnown: (key: string) => boolean;

    /** Returns an object-map of all metadata. */
    mdRecord: () => Record<string, unknown>;

    /**
     * Sets metadata `key` to `value`. Any false-y value will delete the key.
     *
     * Note, each call will always decompress and deserialize
     * all metadata from localStorage, then reserialize and recompress
     * back to localStorage. So this is very expensive, and SugarCube
     * doesn't give us a way to batch multiple set operations
     * (other than bypassing SugarCube and doing it ourselves.)
     *
     * When _isTranscript, will set state but not metadata.
     */
    mdSet: (varName: string, value: unknown) => void;

    /** Emits a note. */
    note: (message: string, header?: string) => void;

    /** Initializes $g_rand to a new state. */
    randReset: () => void;

    revisitHere: (block: (state: SugarCubeStoryVariables) => void) => void;

    roamStart: (
      path: null | unknown[],
      doneFn?: null | (() => void),
      force?: null | boolean
    ) => void;

    /** True if an async renderer is still running. */
    stillRendering: boolean;

    suppressErrors: (block: () => void) => void;

    tran: {
      /** Renders a single page. */
      renderPage(page: TranscriptPage): JQuery<HTMLElement>;

      /** Renders current history to out, asynchronously. */
      renderHistory(out: DocumentFragment | HTMLElement): void;
    };

    /** Runs block with var tracing disabled. */
    untraced: (block: () => void) => void;

    untracedVars?: () => SugarCubeStoryVariables;

    /** Emits a warning message. */
    warn: (message: string) => void;
  };
}

declare module "twine-sugarcube" {
  interface SugarCubeSetupObject {
    /** True when ?debug mode. */
    debug?: boolean;

    /** True when ?tester mode. */
    tester?: boolean;

    version: string;
  }

  interface SugarCubeStoryVariables {
    /** Which choice was taken to go from previous turn to this turn. */
    g_choiceTaken?: number;

    /** When player clicks on a link with code, g_mtaCode is set to that code. */
    g_mtaCode?: string;

    /** Turn that g_mtaCode was set. */
    g_mtaCodeTurn?: number;

    /** True if state was manipulated with a debug tool. */
    g_mutated?: boolean;

    /** State for MT.rand */
    g_rand0?: number;

    /** State for MT.rand */
    g_rand1?: number;

    /** Story version at start of history */
    g_versionAtStart?: string;

    n_afterAction?: string;
    n_afterItch?: string;
    n_afterLook?: string;
    n_afterLookContinue?: string;

    /** True if player chose barbed instead of smooth */
    n_barbs?: true;

    /** Current block shown by nero-caged. */
    n_cagedBlock?: number;

    /** Turn that n_cagedBlock is for. */
    n_cagedBlockTurn?: number;

    n_didSomeAction?: boolean;

    n_ivexContext?: number;

    n_lustTextPos?: number;

    n_magicPhase?: number;
    n_magicPhaseReached?: number;

    n_patienceAccel?: boolean;
    n_patienceActions?: number;
    n_patienceLooks?: number;
    n_patiencePassage?: string;
    n_patienceReturn?: number;
  }

  interface SugarCubeTemporaryVariables {
    /** True if rendering passage as archives entry. */
    isArchive?: boolean;

    /** True if rendering passage as transcript or archives entry. */
    isTranscript?: boolean;
  }
}
