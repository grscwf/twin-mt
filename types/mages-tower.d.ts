import type { SugarCubeStoryVariables } from "twine-sugarcube";

declare global {
  const MT: Record<string, unknown> & {
    diag: (str) => void;
  };
}

declare module "twine-sugarcube" {
  interface SugarCubeStoryVariables {

    /** True if player chose barbed instead of smooth */
    n_barbs: boolean;

    /** Current block shown by nero-caged. */
    n_cagedBlock: number;
    /** Turn that n_cagedBlock is for. */
    n_cagedBlockTurn: number;
  }

  interface SugarCubeSetupObject {
    /** True when ?debug mode. */
    debug: boolean;

    /** True when ?tester mode. */
    tester: boolean;
  }
}
