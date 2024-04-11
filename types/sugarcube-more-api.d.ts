/*
 * SugarCube APIs that aren't declared in @types/twine-sugarcube
 */

import type {} from "twine-sugarcube";

declare module "twine-sugarcube" {
  interface MacroContext {
    readonly displayName: string;
    readonly source: string;
  }

  interface StateAPI {
    clearTemporary: () => void;
    reset: () => void;
  }
}

declare global {
  const DebugView: {
    disable: () => void;
  };

  interface JSON {
    _real_parse?: typeof JSON.parse;
    _real_stringify?: typeof JSON.stringify;
  }

  const session: {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
  };
}
