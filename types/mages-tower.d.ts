import "twine-sugarcube";

declare global {
  const MT: {
    caged: Record<string, unknown>;

    chain: {
      getCode: () => string;
      getUrl: () => string;
    };

    countWords: (text: string) => number;

    /** emit a diagnostic message */
    diag: (message: string) => void;

    enumInit: () => void;

    forgetWalkHistory: () => void;

    /** Returns history without is-menu loops. */
    getHistory: () => StoryMoment[];


    /** true when rendering transcript */
    isRendering: boolean;

    /** emit a note */
    note: (message: string, header?: string) => void;

    roamStart: (
      path: null | unknown[],
      doneFn?: null | (() => void),
      force?: null | boolean
    ) => void;

    suppressErrors: (block: () => void) => void;

    /** Renders current history to out. */
    tranRender: (out: DocumentFragment | Element) => void;

    /** Renders one passage with the given state to a new detached div. */
    tranRenderOne: (title: string, state: object) => JQuery<HtmlElement>;

    /** Emits a warning message. */
    warn: (message: string) => void;
  };
}

declare module "twine-sugarcube" {
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

    /** True if player chose barbed instead of smooth */
    n_barbs?: true;

    /** Current block shown by nero-caged. */
    n_cagedBlock?: number;

    /** Turn that n_cagedBlock is for. */
    n_cagedBlockTurn?: number;
  }

  interface SugarCubeSetupObject {
    /** True when ?debug mode. */
    debug?: boolean;

    /** True when ?tester mode. */
    tester?: boolean;

    version: string;
  }
}
