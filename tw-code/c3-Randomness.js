/*
 * This is a deterministic RNG that keeps its state in $g_rand0 and $g_rand1,
 * so it can be replayed for the History page.
 *
 * (SugarCube has a deterministic RNG option, but it uses hidden state
 * that can't be replayed easily.)
 */

/** @typedef {[number, number]} RandState */

/**
 * Returns x rotated left by k bits.
 * @type {(x: number, k: number) => number} */
const rotl = (x, k) => {
  return (x << k) | (x >>> (32 - k));
};

/**
 * Returns a random uint32. Uses and updates state, which should be
 * a nonzero [int32, int32] pair. The algorithm is "xoroshiro64**".
 * @type {(state: RandState) => number}
 */
MT.randNext = (state) => {
  const s0 = state[0];
  let s1 = state[1];
  const result = rotl(s0 * 0x9e3779bb, 5) * 5;
  s1 ^= s0;
  state[0] = rotl(s0, 26) ^ s1 ^ (s1 << 9);
  state[1] = rotl(s1, 13);
  return result >>> 0;
};

/**
 * Returns a new random state.
 * @type {() => RandState}
 */
MT.randCreate = () => {
  /** @type {RandState} */
  const state = [1, 0 | (Math.random() * 0xffffffff)];
  MT.randNext(state);
  MT.randNext(state);
  return state;
};

/**
 * Returns a random int in [0, n). Uses and updates $g_rand0 and $g_rand1
 * @type {(n: number) => number}
 */
MT.randInt = (n) => {
  /** @type {RandState} */
  let rng = [State.variables.g_rand0 || 1, State.variables.g_rand1 || 0];
  if (rng[0] == null || rng[1] == null) {
    MT.warn("g_rand0 and g_rand1 are not set");
    rng = MT.randCreate();
  }
  const r = MT.randNext(rng);
  State.variables.g_rand0 = rng[0];
  State.variables.g_rand1 = rng[1];
  return r % n;
};

/** Initializes $g_rand to a new state. */
MT.randReset = () => {
  const rng = MT.randCreate();
  State.variables.g_rand0 = rng[0];
  State.variables.g_rand1 = rng[1];
};

/**
 * Returns a random item from list (which can be a Set).
 * @type {<T>(list: T[] | Set<T>) => T}
 */
MT.pick = (list) => {
  if (list instanceof Set) list = Array.from(list);
  const n = MT.randInt(list.length);
  return /** @type {typeof list[0]} */ (list[n]);
};
