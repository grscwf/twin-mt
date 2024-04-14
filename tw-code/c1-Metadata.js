/*
 * This module manages game metadata.
 * It's mostly a wrapper around SugarCube's metadata, with:
 * - "clear metadata" that preserves keys marked IGNORED.
 * - saving and loading keys marked SAVED to saved games.
 * - copying metadata to State.variables for easy access and debug tooling.
 *
 * Note, the values copied to State.variables are writable,
 * but writing them *does not* write to metadata.
 * Persisting a value needs to use `MT.mdSet`.
 */

/** @typedef {1 | 2 | 3} MetaType */

// metadata types
const META_UNSAVED = 1;
const META_SAVED = 2;
const META_IGNORED = 3;

/**
 * metadata key -> metadata type.
 * @type {Record<string, MetaType>}
 */
const metaKnownKeys = {};

/**
 * If `key` is not known, reports a warning and returns true.
 * @type {(key: string) => boolean}
 */
const metaWarnUnknownKey = (key) => {
  if (!(key in metaKnownKeys)) {
    MT.warn(`Unknown metadata key ${key}`);
    return true;
  }
  return false;
};

/**
 * If `key` is already known, reports a warning and returns true.
 * @type {(key: string) => boolean}
 */
const metaWarnKnownKey = (key) => {
  if (key in metaKnownKeys) {
    MT.warn(`Metadata key ${key} already exists.`);
    return true;
  }
  return false;
};

/**
 * Defines `key` to be UNSAVED metadata, which means:
 * - it ISN'T stored in saved games.
 * - it IS mirrored to State.variables.
 * - it IS deleted by "clear metadata".
 * @type {(key: string) => void}
 */
MT.mdDefUnsaved = (key) => {
  if (metaWarnKnownKey(key)) return;
  metaKnownKeys[key] = META_UNSAVED;
};

/**
 * Defines `key` to be SAVED metadata, which means;
 * - it IS stored in saved games.
 * - it IS mirrored to State.variables.
 * - it IS deleted by "clear metadata".
 * - loading a saved game will set its value from the saved game,
 *   but only if it isn't already set.
 * @type {(key: string) => void}
 */
MT.mdDefSaved = (key) => {
  if (metaWarnKnownKey(key)) return;
  metaKnownKeys[key] = META_SAVED;
};

/**
 * Defines `key` to be IGNORED metadata, which means:
 * - it ISN'T stored in saved games.
 * - it ISN'T mirrored to State.variables.
 * - it ISN'T deleted by "clear metadata".
 * @type {(key: string) => void}
 */
MT.mdDefIgnored = (key) => {
  if (metaWarnKnownKey(key)) return;
  metaKnownKeys[key] = META_IGNORED;
};

/**
 * True if `key` is a known metadata key.
 * @type {(key: string) => boolean}
 */
MT.mdKnown = (key) => metaKnownKeys[key] != null;

/**
 * Returns the value of metadata `key`.
 *
 * Note, each call will always decompress and deserialize
 * all metadata from localStorage, so this is somewhat expensive.
 *
 * If you don't need the authoritative value, you can read the
 * copy in State.variables (which might be out-of-date if the
 * value was changed in another tab).
 *
 * If you want more than a few authoritative values at a time,
 * use `MT.mdEntries` or `MT.mdRecord`.
 * @type {(key: string) => unknown}
 */
MT.mdGetUncached = (key) => {
  metaWarnUnknownKey(key);
  return State.metadata.get(key);
};

/**
 * Sets metadata `key` to `value`. Any false-y value will delete the key.
 *
 * Note, each call will always decompress and deserialize
 * all metadata from localStorage, then reserialize and recompress
 * back to localStorage. So this is very expensive, and SugarCube
 * doesn't give us a way to batch multiple set operations
 * (other than bypassing SugarCube and doing it ourselves.)
 *
 * When _isTranscript, will set state but not metadata.
 * @type {(key: string, value: unknown) => void}
 */
MT.mdSet = (key, value) => {
  metaWarnUnknownKey(key);
  if (!State.temporary.isTranscript) {
    if (value) {
      State.metadata.set(key, value);
    } else {
      State.metadata.delete(key);
    }
  }
  const vars = /** @type {Record<string, unknown>} */ (State.variables);
  if (value && metaKnownKeys[key] !== META_IGNORED) {
    vars[key] = value;
  } else {
    delete vars[key];
  }
};

/** Returns an array of all [key, value] metadata entries. */
MT.mdEntries = () => {
  return State.metadata.entries() || [];
};

/** Returns an object-map of all metadata. */
MT.mdRecord = () => {
  return Object.fromEntries(MT.mdEntries());
};

/** Deletes all metadata, except for IGNORED keys. */
MT.mdClear = () => {
  const preserve = [];
  const entries = State.metadata.entries() || [];
  for (const [key, value] of entries) {
    metaWarnUnknownKey(key);
    if (metaKnownKeys[key] === META_IGNORED) {
      preserve.push([key, value]);
    }
  }
  State.metadata.clear();
  for (const [key, value] of preserve) {
    State.metadata.set(key, value);
  }
  metaCopyToVars();
};

/**
 * Merges metadata from `save` into current metadata.
 * @type {(save: SaveObject) => void}
 */
const metaReadFromSave = (save) => {
  if (!save.metadata) return;
  const current = MT.mdRecord();
  let unlocks = false;
  for (const [key, value] of Object.entries(save.metadata)) {
    if (value && metaKnownKeys[key] === META_SAVED && !current[key]) {
      State.metadata.set(key, value);
      unlocks = true;
    }
  }
  metaCopyToVars();
  if (unlocks) {
    MT.note("The Archives have unlocked some more entries.");
  }
};

/**
 * Adds current metadata to `save`.
 * @type {(save: SaveObject) => void}
 */
const metaWriteToSave = (save) => {
  save.metadata ||= {};
  const entries = State.metadata.entries() || [];
  for (const [key, value] of entries) {
    if (metaKnownKeys[key] === META_SAVED) {
      save.metadata[key] = value;
    }
  }
};

/** Copies current metadata to State.variables */
const metaCopyToVars = () => {
  const U = /** @type {Record<string, unknown>} */ (
    MT.untracedVars ? MT.untracedVars() : State.variables
  );
  const rec = MT.mdRecord();
  for (const key of Object.keys(rec)) {
    if (metaKnownKeys[key] !== META_IGNORED) {
      U[key] = rec[key];
    }
  }
  // delete unset known keys
  for (const key of Object.keys(metaKnownKeys)) {
    if (U[key] && (!rec[key] || metaKnownKeys[key] === META_IGNORED)) {
      delete U[key];
    }
  }
};

const metaInit = () => {
  Save.onLoad.add(metaReadFromSave);
  Save.onSave.add(metaWriteToSave);
  $(document).on(":passageinit", metaCopyToVars);
};

metaInit();
