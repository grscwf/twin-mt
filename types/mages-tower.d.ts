import type { SugarCubeStoryVariables } from "twine-sugarcube";

declare global {
  const MT: Record<string, unknown> & {
    /** emit a diagnostic message */
    diag: (str) => void;
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
}
