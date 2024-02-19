import type { SugarCubeStoryVariables } from "twine-sugarcube";

declare global {
  const MT: Record<string, unknown> & {
    /** emit a diagnostic message */
    diag: (str) => void;

    choices: {
      getPath: () => string;
      getUrl: () => string;
    }
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
  }

  interface StateAPI {
    reset: () => void;
  }
}
