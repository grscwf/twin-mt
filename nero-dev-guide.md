# Dev guide for Nero <!-- omit in toc -->

- [About Twine and Twee](#about-twine-and-twee)
- [Working with Twee](#working-with-twee)
- [Working with Twine](#working-with-twine)
- [Debug controls](#debug-controls)
  - [Right side buttons](#right-side-buttons)
  - [Var info](#var-info)
  - [Compute variants](#compute-variants)
- [Story structure - Passages](#story-structure---passages)
- [Story structure - State](#story-structure---state)
- [Rationales](#rationales)

## About Twine and Twee

- There are two source formats for the story: Twine and Twee.
  - In general, creating paths is easier in Twine,
    and editing is easier with Twee.
- Twine's source format is a playable `.html` file, with all the
  story data in a `<tw-storydata>` section.
  - Twine keeps its `.html` storyfiles in `Documents/Twine/Stories`.
  - Export/publish from Twine will save a copy of the storyfile
    wherever you want.
  - Import into Twine will create or overwrite an existing storyfile.
- Twee is a plaintext format, files with a `.tw` suffix.
  - The program `tweego` will combine `.tw` files into an `.html` storyfile
    that can be played and/or imported into Twine.
  - `tweego` can also decompile an `.html` storyfile into a `.tw` file,
    but it doesn't (yet) have a way to auto-split.
  - This project has a NodeJS script that will do the auto-splitting.
    Details are below.
- The `.tw` files are the "primary" source, and the `.html` storyfile is
  built from the `.tw` files.
  - Converting the other way is supported because there are several things
    that are easier to do in Twine.

## Working with Twee

- Setup:
  - Install node and npm:
    - If you don't already have node and npm,
      install [volta](https://volta.sh/).
    - volta will automatically get a usable node/npm version.
    - If you don't want to use volta, node >=18 and npm >=9 should work.
      (Earlier versions might work, but untested.)
  - Install tweego:
    - Download the binary from https://www.motoslave.net/tweego/ and
      place it somewhere in your PATH
    - TODO: use https://www.npmjs.com/package/tweego-bin instead
  - Run `npm install`
  - If you're using `vscode` (recommended), install the `T3LT` extension.
- Basic workflow:
  - In your browser, open `twin-mt/nero.html?debug`
  - Run `npm run watch`
  - Edit some `.tw` files. `watch` should automatically rebuild `nero.html`
    very quickly.
  - Reload the page in your browser to test your edits.
- Committing changes:
  - Run `npm run check` and fix any undeclared/unused vars it reports.
  - If you aren't using `watch`, run `npm run to-html`
  - Run `git add . && git commit -am "some description"`
  - Run `git push`
- npm scripts:
  - `npm run check` will check the `.tw` files for undeclared and unused
    variables, which might be typos.
    - Variables are declared in the file `nero-vars.txt`.
    - In the report, "Used once" are vars that seem to be only used
      in one place. This might mean the var is unnecessary, but it's also
      possible that the var is used in a way the script does not detect.
  - `npm run to-html` will build the `.html` storyfiles from the `.tw` files.
    - The file `tools/rules.ts` describe which `.tw` files are used to build
      each `.html` storyfile.
  - `npm run watch` continually rebuilds the `.html` files whenever a
    `.tw` file changes.
    - It's somewhat careful to avoid overwriting an exported `.html` storyfile.
  - `npm run untwine` will break the `.html` storyfiles apart into `.tw` files.
    - This is potentially destructive, so it asks you to `git commit` any
      changes before proceeding, so you can easily see what untwining does,
      and undo it if it screws up.
    - Untwining looks at existing `.tw` files to see what filename each
      passage currently has, and it will update those files.
    - If the `.html` storyfile has a passage that doesn't yet have a `.tw`
      file, untwine will create a new one with a filename derived from the
      passage name. You can move/rename the file however you like, and
      the new name will be used in subsequent untwines.
    - untwine does not delete or rename passages.
      - If a passage is deleted in Twine, the `.tw` file will have to be
        manually deleted.
      - If a passage is renamed in Twine, untwine will create a new `.tw`
        file, and the old one will have to be manually deleted.

## Working with Twine

- Basic workflow:
  - Import `twin-mt/nero.html` into Twine.
    - This can be skipped if `nero.html` was not changed outside Twine.
  - In your browser, open `Documents/Twine/Stories/nero.html?debug`
  - Navigate in the story to an area of interest.
    - Use "WALK TO" in the sidebar to go to a particular section.
  - Make edits in Twine.
  - Reload the page in your browser to test the edits.
- Committing changes:
  - Publish to `twin-mt/nero.html`
  - Run `git add . && git commit -am "Before untwine"`
  - Run `npm run untwine`
  - Run `git diff` to verify that the untwining did what you expected.
  - If passages were deleted or renamed in Twine,
    manually delete obsolete `.tw` files.
  - If passages were added or renamed in Twine,
    move the new `.tw` files into an appropriate subdirectory.
  - Run `npm run check` and fix any unused/undeclared vars it reports.
  - Run `git add . && git commit -am "After untwine"`
  - Run `git push`
- Twine 2.5.1.0 has a bug where sometimes it tries to save the storyfile
  twice simultaneously, stepping on itself. Most of the time, the result
  is just a harmless alert box.
  - Occasionally, the result is invisibly deleting the storyfile.
    The file is gone from disk, not saved, but you don't find out until
    you quit Twine and restart.
  - The symptom of this is you start getting save failure alerts on almost
    every edit. One simple way to recover is to export/publish the story,
    quit and restart Twine, then import the published story.
  - You might also be able to recover the story from `Documents/Twine/Backups`.
- Twine's "Test from here" is sometimes useful, but generally the best dev
  workflow is to open Twine's storyfile directly in your browser.
  - Twine updates the storyfile automatically on every edit.
  - Reload in the browser will redisplay the current passage,
    using the latest version of the storyfile.

## Debug controls

- Adding `?debug` or `?tester` to the URL will turn on some debug controls.
- `?debug` mode turns on several features:
  - The top has a "var-info" display.
  - The right side has several buttons.
  - The left menu has some utilties, marked with a wrench icon.
  - A few macros show a wrench icon within a passage,
    for local control of the macro.
  - The bottom right is SugarCube's debug panel, which is somewhat redundant,
    but there are a few things it can do that aren't easy to do with the
    other debug controls.
- `?tester` mode is a subset of `?debug`, enabling some controls that
  are useful for play-testing, without spoilers.

### Right side buttons

- "notes" opens a textbox for writing or editing notes about
  the current passage. "Notes" in the left sidebar has more explanation
  of this feature.
- "log" opens a transcript of the current story session.
  This is helpful when using "seek".
- "back", "forw", "rand", "seek" will navigate history
  and do a random walk.
  - Pressing "rand" will highlight a random link in the current passage.
  - Pressing "rand" again will visit that link.
  - "back" deselects a highlighted link, or goes back to the previous passage.
  - "forw" goes forward in history, or does "rand" at the end of history.
  - "rand" tries to do shuffle, not uniform random, so repeated rand/back can
    potentially do an entire depth-first traversal of the story.
  - "seek" will repeat "rand" until it reaches a passage that's either
    "draft", contains a todo mark, or throws an error.
    - If you start seek from a "draft" passage, seek will not stop until it
      reaches a passage tagged "done".
    - If you start seek from a "done" passage, seek will loop Nero until
      it encounters an error or a non-draft todo.
    - Seek can be interrupted by pressing the button again.
  - <kbd>ctrl-comma</kbd> is a shortcut for "back".
  - <kbd>ctrl-period</kbd> is a shortcut for "forw".
  - <kbd>ctrl-slash</kbd> is a shortcut for "rand".
  - <kbd>ctrl-backslash</kbd> is a shortcut for "seek".
  - The randomness can be controlled slightly by marking some links.
    - Add the comment `//avoid` to the code argument of
      an `<<mtl>>` or `<<mta>>` link.
    - If the randomizer chooses an `//avoid` link,
      90% of the time it will reject it and try again.

### Var info

- At the top, "var-info" is a compact display of state variables.
  - Pressing "var-info" will show or hide the variables.
  - var-info only shows variables that are read or set by the current passage.
  - Hover over a variable will show verbose detail.
  - An up-arrow on the left of a varname means the var was set in this passage.
  - A down-arrow on the right of a varname means the var was read in this passage.
  - Boolean flags are either red (false) or green (true).
  - Enums are blue, showing the current value.
  - Other types are gray.
- var-info lets you change some flags.
  - If a boolean or enum is read by the passage, var-info will show it as
    a button.
  - Pressing the button will change the value that the var had before rendering the current passage, then redisplay the passage.
  - Enum flags are two buttons: left decreases, right increases.
  - Changing a flag adds another state to the history, and going back will revert the change.
- var-info highlights "notable" flags.
  - Notable flags are flags like `n1_naked` that are expected to have visible
    effects in the current passage.
  - Notable flags are defined by story section: eg, `n1_naked` is not notable
    if it's always true in a section.
  - If a passage does not read a notable flag, it's marked with a
    construction-sign warning.
  - The warning can be removed by:
    - using the flag,
    - or declaring it constant with `<<vi-always flag value>>`,
    - or ignoring it with `<<vi-ignore flag>>`.

### Compute variants

- var-info has a button "Compute variants", which will try to generate
  all the variants of the current passage
  that might be possible during play.
- This can take several seconds. During computation, the button will show
  how many states it has left to consider.
- The variants are shown with approximate outlining of diffs.
  - Red outline is text that is different from the next variant.
  - Green outline is text that is different from the previous variant.
  - Yellow outline is text that is different from both next and previous.
  - The diff is not minimal. It does a cheap comparison of dom structure
    that happens to work most of the time. because of the way SugarCube adds
    debug info when rendering in debug mode.
- The variants shown will have live links,
  but clicking on those links will probably not
  have a sensible result. Compute-variants does
  not clean up after itself (yet).
  When it's done, the current state is indeterminate.
  Reload the page before doing anything else.
- The computation is not perfect. It can sometimes generate texts that
  are impossible in normal play, and it will often miss generating texts
  that are possible. But it's helpful for doing a quick check of
  most of a passage's variants.
- The discovery process starts from the current game state.
- This will automatically discover any boolean-ish variables that are
  read by the passage, and it tries all states where those booleans are flipped.
- Uninteresting booleans can be excluded with `<<cv-ignore varname>>`.
- Non-booleans can be tried by declaring the values that should be tried:
  - `<<cv-try varname val1 val2 ...>>`
- You can also temporarily add a `<<cv-try>>` statement to check just a
  subset of the states, which is helpful when working on complicated passages.
  This works for restricting booleans too.
- Trying a state has two phases:
  - First, a fast consistency check rejects any states that
    should be impossible (eg, free and !naked).
    - This is the function `Nero.checkState` in the
      `Nero Constraints` init passage.
    - This check is approximate.
      It doesn't reject all illegal states,
      and sometimes it accepts some illegal states.
      But it's good enough to significantly reduce the number of
      states that reach the slow second phase.
  - Second, the state is used to render the passage into a scratch dom node.
    - If the rendering fails an assertion or throws an error,
      the state is rejected.
    - This does not trigger any of the passage events, and does
      not wait for any timers, so it might
      not have exactly the same behavior as normal gameplay.
      But most of the time this is fine.
- The states tested and rejected are somewhat sensitive to the order that
  flags are used in the passage (which affects what flags are discovered
  to be read, and considered relevant by the constraint tests).
  - It's sometimes useful to write conditions specifically for
    helping compute-variants, and maybe check flags redundantly.
- If a passage has constraints that only apply to some conditions,
  eg, an assertion on `t_ivexNear` only if `!$n2_ivexGone`,
  then you probably need to add `cv-try` for the asserted variables,
  to help compute-variants find a state that's consistent.
- For testing `n1_magicPhase` variants, add a `<<cv-try>>` statement:
  - Include `MP_beforeCast` if it's possible.
  - Include any values tested in the passage.
  - If the passage checks `n2_free`,
    include `MP_contact`, `MP_drained`, and `MP_tapLost`.
- For testing `n2_magicPhaseLost` variants:
  - Include `null` and any values tested in the passage.
  - Note, these values are impossible:
    `MP_onHold`, `MP_exitingHold`, `MP_lockedOut`, `MP_tapLost`
- TODO: these rules could be automatic.

## Story structure - Passages

- All of Nero's passages start with a codeword like `n1a/F`.
  - The lowercase `n` indicates it's a Nero passage.
  - The digit is story chapter, divided by restart points.
    - `n0` is for meta passages, not directly in the story.
    - `n1` is from start of story to Ivex leaving.
    - `n2` is from Ivex leaving (restartable) to exiting the first floor.
    - `n3` (todo) is the second floor (restartable).
    - `n4` (todo) is after escaping (restartable).
    - `n9` is Nero's endings.
  - The lowercase letters after the digit indicate a section within the chapter.
    - Some sections are "modules" that are used by multiple passages.
      Eg, `n1s` is the Spell/Sprite module used by all action passages.
    - Most sections are segments of a chapter that have distinct "notable"
      variables. Eg, `n1d` is the section where `n1_candleLit` is true
      but `n2_ivexGone` is false.
  - The `/F` indicates draft status of the passage.
    - `/F` is "finished" - passage is complete and fully written.
    - `/D` is "draft" - passage has all major logic, but placeholder text.
    - `/P` is "plan" - passage has an outline of logic.
    - `/S` is "sketch" - passage is a vague sketch.
    - Doing this in the passage title (instead of passage tags) lets us
      easily color the links to draft passages.
      TODO: use in-passage decl instead; renaming is annoying in twee.
- If a script or style is only used by a single passage, it's usually inlined
  in the passage.
- Large scripts used by a single passage are usually extracted to a
  a side passage with a direct `<<include>>`
- Scripts and styles used by multiple passages are in `Init` sections at
  the top of the story-graph.
  - These unfortunately do not get syntax-highlighting in Twine.
    (It's fine in vscode with T3LT.)
  - The main reason these are split out is because it's awkward to work with
    very large passages in Twine.
  - It's also helpful to bundle related javascript and stylesheets together.
  - It also seems like editing "Story Javascript" has a much higher risk of
    triggering the overlapping-save bug.

## Story structure - State

- All Nero state vars start with a prefix like `n1_` or `t_`.
  - The `n` is for persistent Nero variables.
  - The digit indicates what chapter sets the variable.
    - Restarting at chapter 2 will delete all `t_` variables,
      all `n2_` and later variables,
      and then restore a snapshot of `n1_` variables
      (which is saved before starting chapter 2).
  - The `t_` variables are for state that doesn't need to be added to a
    restart snapshot. Generally, local passage connection logic can be
    `t_` variables.
- `n0_` vars are for Nero state that persists across replays.
- `mt_` vars are for overall story state that persists across replays.
- Generally, a passage that changes state will change it at the
  bottom.
  - This makes it easier to write text for the state transition.
  - It also makes it easier to see state changes at a glance.
  - I settled on this convention partway through development, so some
    passages don't do this yet.
  - Ideally, state changes that aren't at the bottom will have a comment
    at the bottom mentioning it.
  - Conditional state changes are usually written without using `<<if>>`,
    because of a quirk with compute-variants:
    - An `<<if>>` that has no text will still count as a variant,
      because the debug markup is different.
    - This is confusing and unhelpful, but fixing this in compute-variants
      is not straightforward.
    - Rewriting conditionals without `<<if>>` is a simple workaround.

## Rationales

- State.random. SugarCube has an option to seed a deterministic rng,
  which in theory might be helpful for reproducing sessions.
  - The problem is that savestates with seeded random are incompatible with
    states without seeded random.
  - Conversion is possible, but there's no way to make the seed-added
    state reproducible.
  - In general, savestates are not necessarily reproducible anyway,
    since they can be created from multiple versions of the storygraph.
  - Approximate reproducible is still useful, but breaking old saves is
    makes it not worth it.
  - For any useful reproducible, stub out random with a fixed constant.
  - Also, if deterministic rng is enabled, SugarCube's structure makes it
    awkward to render a passage independent of history, as used by archives.
    (It's not impossible, but has some awkward caveats.)
