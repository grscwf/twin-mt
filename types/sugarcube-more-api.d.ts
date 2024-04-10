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

declare global {
  interface JSON {
    _real_parse?: typeof JSON.parse;
    _real_stringify?: typeof JSON.stringify;
  }

  const session: {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
  }
}