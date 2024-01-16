import type { SugarCubeStoryVariables } from "twine-sugarcube";

declare global {
  const MT: Record<string, unknown> & {
    diag: (str) => void;
  };
}

declare module "twine-sugarcube" {
  interface SugarCubeStoryVariables {
    /** Current block shown by nero-caged. */
    n_cagedBlock: number;
  }
}
