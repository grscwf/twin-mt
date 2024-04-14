/*
 * This tries to save entire player history in a compact-ish way.
 *
 * For now, we keep a linear list of histories in localStorage,
 * and rely on LZString to compact it. LZString is only so-so
 * compression, so this could be much more compact.
 * Current method uses about 70b per step, so 5M will hold ~70k steps.
 *
 * One tricky problem is the game can be run in multiple tabs,
 * and tabs can be cloned. We want to keep history of every tab.
 * The player might close a tab before it reaches any checkpoint,
 * and using the "unload" event is not reliable,
 * so we have to continually save every tab's history to localStorage,
 * without tabs overwriting each other.
 *
 * We do that by giving each tab a trail-id, and save that trail-id
 * to sessionStorage. Whenever a tab re-initializes, it generates
 * a new trail-id and deletes the trail stored with the saved trail-id.
 *
 * Trail objects have three possible representations
 * - trail.history - array of moments with all variables in each moment.
 * - trail.delta - delta-encoded history. Packed trails have only this.
 * - trail.lzState - lz-compressed state object. This is only in
 *     active-tab states, used for fast update.
 */

/**
 * @typedef {object} ActiveCache
 * @prop {string} id
 * @prop {number} time
 * @prop {number} tip
 * @prop {string} tipTitle
 * @prop {number} tipRand0
 * @prop {number} tipRand1
 * @prop {string} lzState
 *
 * @typedef {StoryMoment[]} SlimHistory
 *
 * @typedef {object} SlimTrail
 * @prop {string} [id]
 * @prop {number} [time]
 * @prop {SlimHistory} [delta]
 * @prop {string} [lzState]
 * @prop {SlimHistory} [history]
 */

let trailId = String(Date.now());

/* ~70b per step, 20k * 70 = ~1.4M */
const MAX_STEPS = 20000;

/**
 * Our last view of localStorage trail.packed
 *
 * @type {{ str: string | null, obj: Array<unknown> }}
 */
let packedCache = {
  str: "[]",
  obj: [],
};

/**
 * The last value we saved to trail.active.${trailId}
 * @type {ActiveCache | null | undefined}
 */
let activeCache = null;

/**
 * Returns a list of the packed trails.
 * The list returned is shared mutable, so be careful.
 * The trails in the list might not have .history expanded yet.
 *
 * @type {() => SlimTrail[]}
 */
MT.getPackedTrails = () => {
  const packed = localStorage.getItem("trail.packed") || "[]";
  if (packed !== packedCache.str) {
    packedCache.obj = deserializeList(packed, "trail.packed");
    packedCache.str = packed;
  }
  return /** @type {SlimTrail[]} */ (packedCache.obj);
};

/**
 * Deserializes str, expecting the result to be an array.
 *
 * @type {(str: string, id: string) => Array<unknown>}
 */
const deserializeList = (str, id) => {
  try {
    const json = LZString.decompressFromUTF16(str);
    const list = MT.jsonParse(json);
    if (Array.isArray(list)) {
      return list;
    }
    console.warn(`${id} did not deserialize to an array, ignoring.`);
  } catch (e) {
    console.warn(`Error deserializing ${id}`, e);
  }
  return [];
};

/** Claims and deletes any existing active trail for this session. */
const claimOldTrail = () => {
  const oldId = sessionStorage.getItem("trail.id");
  if (oldId != null) {
    const oldKey = `trail.active.${oldId}`;
    const oldVal = localStorage.getItem(oldKey);
    if (oldVal != null) {
      localStorage.removeItem(oldKey);
    }
  }
  sessionStorage.setItem("trail.id", trailId);
};

/** True if current history has diverged from saved active trial. */
const isDiverged = () => {
  if (activeCache == null) return false;
  if (State.size <= activeCache.tip) return true;
  const aTip = State.history[activeCache.tip];
  if (aTip == null) return true;
  return (
    aTip.title !== activeCache.tipTitle ||
    // instead of checking entire state, we check just g_rand0 and g_rand1
    aTip.variables.g_rand0 !== activeCache.tipRand0 ||
    aTip.variables.g_rand1 !== activeCache.tipRand1
  );
};

/** Pack current active trail and assign a new trailId */
const packStaleActive = () => {
  MT.nonNull(activeCache, "activeCache");
  packSomeTrails([activeCache]);
  const key = `trail.active.${trailId}`;
  localStorage.removeItem(key);
  trailId = String(Date.now());
  sessionStorage.setItem("trail.id", trailId);
};

/**
 * True if the moment in current history is a menu passage
 * @type {(moment: number) => boolean}
 */
const isMenu = (moment) => {
  const title = State.history[moment]?.title || "";
  return Story.get(title).tags.includes("is-menu");
};

/** Saves current state as an active trail to localStorage */
const saveCurrentTrail = () => {
  // Use the state that SugarCube already lz'ed
  const lzState = sessionStorage.getItem("nero.state");
  if (lzState == null) return;

  // Find current tip of history
  let tip = State.size - 1;
  while (tip > 0 && isMenu(tip)) {
    tip--;
  }
  if (tip <= 0) return;

  const moment = State.history[tip];
  MT.nonNull(moment, `history at tip ${tip}`);

  const tipTitle = moment.title;
  const tipVars = moment.variables;

  if (isDiverged()) {
    packStaleActive();
  }

  const key = `trail.active.${trailId}`;
  activeCache = {
    id: trailId,
    time: Date.now(),
    tip,
    tipTitle,
    tipRand0: tipVars.g_rand0 || 1,
    tipRand1: tipVars.g_rand1 || 0,
    lzState,
  };
  localStorage.setItem(key, MT.json(activeCache));
};

/**
 * Sets packed trails to `packed`, and stores it to localStorage.
 * `packed` will be modified and shared, so be careful.
 *
 * @type {(packed: SlimTrail[]) => void}
 */
const savePackedTrails = (packed) => {
  const compact = [];
  for (const trail of packed) {
    if (trail.delta == null) {
      if (trail.history == null) {
        MT.expandTrail(trail);
        MT.nonNull(trail.history, "trail.history");
      }
      trail.delta = State.deltaEncode(trail.history);
    }
    const slim = {
      id: trail.id,
      time: trail.time,
      delta: trail.delta,
    };
    compact.push(slim);
  }

  let steps = 0;
  for (let i = compact.length - 1; i >= 0; i--) {
    steps += compact[i]?.delta.length || 0;
    if (steps > MAX_STEPS) {
      console.warn(`Forgetting ${i} trails`);
      compact.splice(0, i);
      break;
    }
  }

  const str = LZString.compressToUTF16(MT.json(compact));
  localStorage.setItem("trail.packed", str);
  packedCache.str = str;
  packedCache.obj = packed;
};

/**
 * If trail has delta or state, expands in-place to history.
 *
 * @type {(trail: SlimTrail) => void}
 */
MT.expandTrail = (trail) => {
  if (trail.history != null) return;

  // if there's an lzState, decompress it
  if (trail.delta == null && trail.lzState != null) {
    let state;
    try {
      const str = LZString.decompressFromUTF16(trail.lzState);
      state = MT.jsonParse(str);
    } catch (e) {
      trail.history = [];
      return;
    }
    // state probably has delta, but could have history instead.
    // state index might not be at end of history, doesn't matter here.
    if (state.history != null) {
      trail.history = state.history;
      return;
    } else if (state.delta != null) {
      trail.delta = state.delta;
    }
  }

  if (trail.delta != null) {
    trail.history = State.deltaDecode(trail.delta);
    return;
  }

  console.warn(`expandTrail failed for some reason?`, trail);
  trail.history = [];
  return;
};

/**
 * Add some trails to packed trails
 *
 * @type {(trails: SlimTrail[]) => void}
 */
const packSomeTrails = (trails) => {
  const packed = MT.getPackedTrails();
  for (const trail of trails) {
    packed.push(trail);
  }
  savePackedTrails(packed);
};

/** Move stale active trails to packed trails. */
const packStaleTrails = () => {
  const stale = [];
  // If a tab is still open but hasn't been touched in N hours,
  // then we pack it prematurely. This is harmless, it just means
  // there will be an extra trail in packed trails.
  const old = Date.now() - 24 * 60 * 60 * 1000;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key != null && key.startsWith("trail.active.")) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    const trail = /** @type {SlimTrail} */ (
      MT.jsonParse(localStorage.getItem(key) || "{}")
    );
    if (trail != null && trail.time != null && trail.time < old) {
      localStorage.removeItem(key);
      stale.push(trail);
    }
  }
  if (stale.length) {
    packSomeTrails(stale);
  }
};

const packActiveTrail = () => {
  const key = `trail.active.${trailId}`;
  const str = localStorage.getItem(key);
  if (str == null) return;
  const trail = MT.jsonParse(str);
  packSomeTrails([trail]);
  localStorage.removeItem(key);
};

if (setup.playtest) {
  claimOldTrail();
  packStaleTrails();

  $(document).on(":passageend", saveCurrentTrail);
  $(document).on(":enginerestart", packActiveTrail);
}
