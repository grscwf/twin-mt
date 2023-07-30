# Dev guide for Nero <!-- omit in toc -->

- [Twine and Twee](#twine-and-twee)
- [Working with Twee](#working-with-twee)
- [Working with Twine](#working-with-twine)
- [Debug controls](#debug-controls)
  - [Right side buttons](#right-side-buttons)
  - [Var info](#var-info)
  - [Compute variants](#compute-variants)
- [Story structure](#story-structure)
  - [Passages](#passages)
  - [State](#state)
- [Rationales](#rationales)
  - [not using `State.random`](#not-using-staterandom)
  - [using `<<nobr>>`](#using-nobr)

## Twine and Twee

- There are two source formats for the story: Twine and Twee.
  - In general, creating paths is easier in Twine,
    and editing is easier with Twee.
- Twine's source format is a playable `.html` file, with all the
  story data in a `<tw-storydata>` section.
  - Twine keeps its `.html` storyfiles in `Documents/Twine/Stories`.
  - Export or publish from Twine will save a copy of the storyfile
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
  - Run `git add .`
  - Run `git commit -am "some description"`
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
    - Use "GO TO" in the sidebar to go to a particular section.
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
  - The left menu has some utilities, marked with a wrench icon.
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
  This is helpful when using "roam".
- "back", "forw/rand", "roam" will navigate history
  and do a random walk.
  - The "forw/rand" button has two states.
    - "forw":
      - "forw" only shows when you're in the past of your current session.
      - Pressing "forw" will highlight the next link you visited.
      - Pressing "forw" again will move forward in history.
      - Note, moving forward in history is not exactly the same as
        visiting the link, because it restores the saved history state
        instead of computing a new state. In particular, any code changes
        you've just made will not take effect with "forw". You have to
        manually traverse forward yourself, which will delete your future
        history. ("Go To" has a "re-walk current path" that might be useful.)
      - You can cancel the "forw" selection by pressing "back" or any neutral
        text. Canceling also turns "forw" into "rand".
    - "rand":
      - Pressing "rand" will highlight a random link in the
        current passage.
      - Pressing "rand" again will visit that link.
      - If you don't like the selection, you can cancel it by pressing "back"
        or on any neutral text, then press "rand" to choose a different link.
      - "rand" tries to do shuffle, not uniform random, so repeated rand/back
        can potentially do an entire depth-first traversal of the story.
      - There are a few story points where "rand" is biased toward useful
        options, or away from bad options. See "Randomizer bias" below.
  - "roam" will repeat "rand" until it reaches a passage that's either
    "draft", contains a todo mark, or throws an error.
    - If you start roam from a "draft" passage, roam will not stop until it
      reaches a passage tagged "end".
    - If you start roam from a "end" passage, roam will loop Nero until
      it encounters an error or a non-draft todo.
    - roam can be interrupted by pressing the button again.
  - <kbd>ctrl-comma</kbd> is a shortcut for "back".
  - <kbd>ctrl-period</kbd> is a shortcut for "forw/rand".
  - <kbd>ctrl-slash</kbd> is a shortcut for "roam".
  - Randomizer bias:
    - The randomizer can be controlled slightly by marking some links.
    - Add `//prefer` or `//avoid` to the code argument of an
      `<<mtl>>` or `<<mta>>` link.
    - If the randomizer sees any `//prefer` link
      - 80% of the time it will choose one of those instead of any other.
    - If the randomizer choose an `//avoid` link
      - 90% of the time it will reject it and try again.

### Var info

- At the top, "var-info" is a compact display of state variables.
  - Pressing "var-info" will show or hide the variables.
  - var-info only shows a variable if it's read or set by the current passage,
    or if the variable is marked as notable in the current section.
  - Hover over a variable will show verbose detail.
  - An up-arrow on the left of a varname means the var was set in this passage.
  - A down-arrow on the right of a varname means the var was read in this passage.
  - Boolean flags are either red (false) or green (true).
  - Enums are blue, showing the current value.
  - Other types are gray.
- var-info lets you change some flags.
  - If a boolean or enum is read by the passage, var-info will show it as
    a button.
  - Pressing the button will change the value that the var had *before*
    rendering the current passage, then redisplay the passage.
  - Enum flags are two buttons: left decreases, right increases.
  - Changing a flag adds another state to the history,
    and going back will revert the change.
- var-info highlights "notable" flags.
  - Notable flags are flags like `n_naked` that are expected to have visible
    effects in the current passage.
  - Notable flags are defined by story section: eg, `n_naked` is not notable
    if it's always true in a section.
  - If a passage does not read a notable flag, it's marked with a
    construction-sign warning.
  - The warning can be removed by:
    - using the flag,
    - or declaring it constant with `<<vi-always flag value>>`,
    - or ignoring it with `<<vi-ignore flag>>`.
- The two numbers on the right side of var-info are an estimate
  of total chars stored in localStorage and sessionStorage.
  Note, these are utf-16 characters, not bytes.

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
    - This uses the functions `checkState` from `Init Nero Constraints`
      and `checkSectionState` from `Init Sections`
    - This check is approximate.
      It doesn't reject all illegal states,
      and sometimes it accepts some illegal states.
      But it's good enough to significantly reduce the number of
      states that reach the second phase, which is much slower.
  - Second, the state is used to render the passage into a scratch dom node.
    - If the rendering fails an assertion or throws an error,
      the state is rejected.
    - This does not trigger any of the passage events,
      and it does not wait for any timers,
      so it might not have exactly the same behavior as normal gameplay.
      Most of the time, it should be fine.
- The states tested and rejected are somewhat sensitive to the order that
  flags are used in the passage (which affects what flags are discovered
  and considered relevant by the constraint tests).
  - It's sometimes useful to write conditions specifically for
    helping compute-variants, including redundant flag checks.
- If a passage has constraints that only apply to some conditions,
  eg, an assertion on `n_ivexNear` only if `!$n_ivexGone`,
  then you probably need to add `cv-try` for the asserted variables,
  to help compute-variants find a state that's consistent.
- For testing `n_magicPhase` variants, add a `<<cv-try>>` statement:
  - Include `MP_beforeCast` if it's possible.
  - Include any values tested in the passage.
  - If the passage checks `n_free`,
    include `MP_contact`, `MP_drained`, and `MP_tapLost`.
- If a passage reads `n_magicPhaseReached`, it should have most of the
  same values as `n_magicPhase`.
  - Exclude: `MP_onHold`, `MP_exitingHold`, `MP_lockedOut`, `MP_tapLost`
- TODO: these rules could be automatic.

## Story structure

### Passages

- Almost all passages start with a code like `n1a`.
  - The code helps cluster related passages together in an alphabetical list.
  - The code also helps identify passage names uniquely, for easy search.
  - The first char can be
    - `d` for Drekkar's story
    - `n` for Nero's story
    - `g` for generic game passages not specific to either character.
  - The number is "chapter".
    - This is generally everything from one checkpoint to the next.
    - Note, `n2` is *not* the 2nd floor, it's the 2nd half of the 1st floor.
  - The trailing letters identify a section within the chapter.
    - This is partly for organization, but it's also for asserting state
      within a section. For example, within `n1d`,
      no matter where we are or how we got there, `n_naked` should be true.
  - Descriptions of each section are in the passage `g0init Sections`.
- If a script or style is only used by a single passage, it's usually inlined
  in the passage.
- Large scripts used by a single passage are usually extracted to a
  a side passage with a direct `<<include>>`
- Scripts and styles used by multiple passages are in `g0boot` or `g0init`
  passages that are at the top left of the story-graph.
  - At StoryInit, all `g0boot` passages are loaded in arbitrary order,
    then all `g0init` passages are loaded in arbitrary order.
  - These passages unfortunately do not get syntax-highlighting in Twine.
    (It's fine in vscode with T3LT.)
  - The main reason these are split out is because it's awkward to work with
    very large passages in Twine.
  - It's also helpful to bundle related javascript and stylesheets together.
  - It also seems like editing "Story Javascript" has a much higher risk of
    triggering the overlapping-save bug in Twine.
- Special passage tags:
  - `mt-sketch` - Passage is a vague sketch.
  - `mt-draft` - Passage is an incomplete draft.
  - `mt-ready` - Passage is fully written.
  - `inclusion` - Passage is included by another passage.
  - `is-menu` - Passage is a "menu" passage, not part of the story.
    (eg, "Credits").
    "Return to story" searches history for a passage without `is-menu`.

### State

- State variables are specific to a playthrough.
  - They get erased when the player restarts.
  - They're stored in saved games and checkpoints.
  - State variable names start with a prefix:
    - `d_` is Drekkar's story.
    - `n_` is Nero's story.
    - `g_` is state not specific to either story.
  - Important: Avoid storing arrays in state variables.
    - SugarCube uses a simple delta encoding for state history,
      so that each turn only needs to record the state that changes.
      However, its delta algorithm does not handle arrays,
      so any array value will be continually repeated in every delta.
- Metadata variables persist across playthroughs.
  - They don't get erased when the player restarts.
  - This is stuff like "which endings are unlocked".
  - Some of them are also stored in saved games.
  - Loading a saved game will set metadata from the saved game,
    but will not erase metadata that isn't in the saved game.
  - Metadata must be set with `MT.mdSet`.
  - Metadata is also mirrored to state variables for convenience,
    but setting the state variable will not update the metadata,
    and the value will be reset from metadata on the next `:passageinit`.
  - Metadata variable names start with a prefix:
    - `xd_` and `xn_` are Drekkar and Nero endings unlocked.
    - `kd_` and `kn_` are Drekkar and Nero keywords unlocked.
    - `md_` and `mn_` are for other Drekkar and Nero metadata.
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

### not using `State.random`
- SugarCube has an option to seed a deterministic rng,
  which in theory might be helpful for reproducing sessions.
- Savestates with seeded random are incompatible with
  savestates without seeded random.
- SugarCube does not expose the deterministic rng's state,
  which means it's difficult to render a passage
  independent of history, as used by archives and transcript.

### using `<<nobr>>`
- SugarCube's default line-breaking behavior is pretty awkward.
  - Passages with a lot of `<<if>>` and other macros need a lot of
    backslashes or `<<nobr>>`
  - When paragraphs must be a single line, diffs become really
    awkward to read.
- Most passages will have `<<nobr>>` around the whole passage.
  - `?P` is used to separate paragraphs.
  - `?P` is `<br><br>` instead of `<p>` because `<p>` has
    unintuitive behavior in html/css (`<p>` cannot contain any
    block elements.)
- A passage included be others should end with `<<nobr>>\`,
  because the inclusion does not inherit the parent's nobr,
  and the trailing newline will become a `<br>`.
- Any type of `nobr` breaks `//` comments in JS, because 
  `nobr` works by replacing newlines with spaces before parsing.
  - This is why we don't use `Config.passages.nobr`. Setting that
    makes it super awkward to write JS in the Init passages.
- Using the `nobr` tag instead of explicit `<<nobr>>` is maybe ok?
  But it feels better to make it explicit in the text.