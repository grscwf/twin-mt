import "twine-sugarcube";

declare global {
  type NextLink = {
    title?: string;
    code?: string;
  };

  type TranscriptPage = {
    title: string;
    vars?: SugarCubeStoryVariables;
    temps?: SugarCubeTemporaryVariables;
    next?: NextLink;
  };

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

    /** emit a diagnostic message */
    diag: (message: string) => void;

    /** Sets some enum vars expected to have non-null values. */
    enumInit: () => void;

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

    /** Returns all metadata. */
    mdEntries: () => Array<[key: string, value: unknown]>;

    /** Sets a metadata variable. */
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
      /**
       * Renders a single page.
       * Note, page.vars and page.temps are not cloned,
       * so rendering a page can modify them.
       */
      renderPage(page: TranscriptPage): JQuery<HTMLElement>;

      /** Renders current history to out, asynchronously. */
      renderHistory(out: JQuery<HTMLElement>): void;
    };

    /** Returns a Set of unlocked keys. */
    unlockedSet: () => Set<string>;

    /** Runs block with var tracing disabled. */
    untraced: (block: () => void) => void;

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

    n_lustTextPos?: number;

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
