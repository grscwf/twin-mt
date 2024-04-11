/*
 * All .js files are concatenated together
 * and evaluated within a SugarCube closure.
 *
 * This scope is *not* accessible to scripts within a passage.
 * Anything needed by passages must be defined on a global.
 *
 * The goal of the following structure is
 * to declare type-checked and docstring'ed modules in .js
 * without needing .ts or .d.ts files.
 *
 * tsc has slightly weird rules about declaring literal objects in .js files.
 *
 * If we have a declaration assigned a literal `{}`:
 *    const M = {};
 *
 * Then it can be augmented in the same scope.
 *    M.p1 = ...;
 *
 * If M is top-level, the augmentation can be top-level in another file.
 *
 * Within the same file as M, augmentations can be in nested scopes,
 * but not within closures:
 *    { M.p2 = ...; }             // This works.
 *    (() => { M.p3 = ...; })();  // This doesn't work.
 *
 * An augment can have a docstring.
 *    /** p4 doc ...
 *    M.p4 = ...;
 *
 * An augment does not copy the docstring of its initializer.
 *    /** p5 doc ...
 *    const p5 = ...;
 *    M.p5 = p5;        // No docstring.
 *
 * @readonly does not work.
 * 
 * tsc will *not* complain about duplicate function definitions in
 * separate files. So all top-level declarations should use "let" or "const".
 */

/** Mage's Tower namespace. */
const MT = {};

/** Alias for JSON._real_stringify. */
// this uses ?: because using || will infect the docstring of MT (tsc bug)
MT.repr = JSON._real_stringify ? JSON._real_stringify : JSON.stringify;

/** `window` as a extensible Record. */
MT.windowRec = /** @type {Record<string, unknown>} */ (
  /** @type {unknown} */ (window)
);

// Publish MT as a global
MT.windowRec.MT = MT;
