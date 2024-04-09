/*
 * SugarCube APIs that aren't declared in @types/twine-sugarcube
 */

import "twine-sugarcube";

declare module "twine-sugarcube" {
  interface StateAPI {
    clearTemporary: () => void;
    reset: () => void;
  }
}
