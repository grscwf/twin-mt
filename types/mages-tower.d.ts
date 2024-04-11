import type {
  MacroContext,
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

  const XMT: {
    /**
     * Creates a scratch state with _isArchive and _isTranscript true,
     * evaluate script, then render passage to dest
     */
    arcRender: (
      dest: DocumentFragment | HTMLElement,
      passage: string,
      script: string
    ) => void;

    assert: (
      test: boolean,
      should: string,
      context?: MacroContext
    ) => asserts test;

    /** Returns number of words in text. */
    countWords: (text: string) => number;

    fail: (str: string, context?: MacroContext) => void;

    forgetWalkHistory: () => void;

    /** Returns history without is-menu loops. */
    getHistory: () => StoryMoment[];

    hasFails: boolean;
    hasWarnings: boolean;

    message: (type: string, str: string, context?: MacroContext) => void;
    messages: string[];

    /** Emits a note. */
    note: (
      message?: string,
      header?: string
    ) => JQuery<HTMLElement> | undefined;

    /** Initializes $g_rand to a new state. */
    randReset: () => void;

    revisitHere: (block: (state: SugarCubeStoryVariables) => void) => void;

    roamStart: (
      path: null | unknown[],
      doneFn?: null | (() => void),
      force?: null | boolean
    ) => void;

    runsWithoutFail: (block: () => void) => boolean;

    suppressErrors: (block: () => void) => void;

    tran: {
      /** Renders a single page. */
      renderPage(page: TranscriptPage): JQuery<HTMLElement>;

      /** Renders current history to out, asynchronously. */
      renderHistory(out: DocumentFragment | HTMLElement): void;
    };

    /** Runs block with var tracing disabled. */
    untraced: <T>(block: () => T) => T;

    untracedVars?: () => SugarCubeStoryVariables;

    /** Emits a warning message. */
    warn: (message: string) => void;
  };
}

declare module "twine-sugarcube" {
  interface SugarCubeSetupObject {
    /** True when ?debug mode. */
    debug?: boolean;

    /** True when ?playtest mode. */
    playtest?: boolean;

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
