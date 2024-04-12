/*
 * SugarCube APIs that aren't declared in @types/twine-sugarcube
 */

import type { StoryMoment } from "twine-sugarcube";

declare module "twine-sugarcube" {
  interface EngineAPI {
    minDomActionDelay: number;
  }

  interface MacroContext {
    readonly displayName: string;
    readonly source: string;
  }

  interface StateAPI {
    clearTemporary: () => void;
    deltaDecode: (hist: StoryMoment[]) => StoryMoment[];
    deltaEncode: (hist: StoryMoment[]) => StoryMoment[];
    history: StoryMoment[];
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

  const Util: {
    fromCssTime: (time: string) => number;
  };

  const session: {
    delete: (key: string) => void;
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
  };

  const storage: {
    _prefix: string;
  };

  let saveAs: (
    blob: unknown,
    name: string,
    opt: Record<string, unknown>
  ) => void;

  const LZString: {
    decompressFromUTF16: (str: string) => string;
    compressToUTF16: (str: string) => string;
  };
}
