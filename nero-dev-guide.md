# Dev guide for Nero <!-- omit in toc -->

- [Working with Twine](#working-with-twine)
- [Working with Twee](#working-with-twee)
- [Dev workflows](#dev-workflows)
- [Debug controls](#debug-controls)
  - [Right side buttons](#right-side-buttons)
  - [Var info](#var-info)
  - [Compute variants](#compute-variants)
- [Story structure - Passages](#story-structure---passages)
- [Story structure - State](#story-structure---state)
- [Rationales](#rationales)

## Working with Twine

- Twine 2.5.1.0 has a bug where sometimes it tries to save the story file
  twice simultaneously, stepping on itself. Most of the time, the result
  is just a harmless alert box.
  - Occasionally, the result is invisibly deleting the story file.
    The file is gone from disk, not saved, but you don't find out until
    you quit Twine and restart.
  - The symptom of this is you start getting save failure alerts on almost
    every edit. One simple way to recover is to Publish the story, quit
    and restart Twine, then import the published story.
  - You might also be able to recover the story from `Documents/Twine/Backups`.
- Twine's "Test from here" is sometimes useful, but generally the best dev
  workflow is to open `Documents/Twine/Stories/nero.html` directly
  in your browser.
  - Twine updates that file automatically on every edit,
    and reload in the browser will redisplay the current passage,
    using the latest version of the story file.
- Append `?debug` to the URL to enable debug controls.

## Working with Twee

- `.tw` files are Twee format, which is sometimes easier to work with than
  Twine's `.html` story files.
- `make nero-to-tw` will convert `nero.html` to `nero.tw`.
- `make nero-to-html` will convert `nero.tw` to `nero.html`.
- Generally, you probably want to do most of your editing in Twine,
  because the visualization of storygraph structure is much better than the
  options available elsewhere, but some edits are easier to do in `.tw`.
- `make nero-check` will verify that state variables in `nero.tw` are all
  declared in the file `nero-vars.txt`.
- When using `vscode`, the `T3LT` extension will check the syntax of
  sugarcube macros in a `.tw` file. User macros are declared in the file
  `t3lt.twee-config.yml`.

## Dev workflows

- Primary workflow - editing in Twine.
  - Import `twin-mt/nero.html` into Twine.
    - This can be skipped if `nero.html` was not changed outside Twine.
  - In your browser, open `Documents/Twine/Stories/nero.html?debug`.
  - Navigate in the story to an area of interest.
    - Use "GOTO NERO" in the sidebar to jump to a particular section.
  - Make edits in Twine.
  - Reload page in browser to test the edits.
  - Periodically:
    - Publish to `twin-mt/nero.html`.
    - Run `make nero-to-tw`
      - The `.tw` diff is easier to read than the `.html` diff.
    - Run `git commit`
    - Run `git push`
- Alternate workflow - editing the `.tw` file.
  - Publish the Twine story to `twin-mt/nero.html`.
  - In your browser, open `twin-mt/nero.html?debug`.
  - Run `make nero-to-tw`.
  - Make edits to the `.tw` file.
  - Run `make nero-to-html`.
  - Reload page in browser to test the edits.
  - When done:
    - Run `git commit`
    - Run `git push`
    - Import `twin-mt/nero.html` into Twine.

## Debug controls

- Debug mode turns on several features:
  - The top has a "var-info" display. 
  - The right side has several buttons.
  - The left menu has some utilties, marked with a wrench icon.
  - A few macros show a wrench icon within a passage,
    for local control of the macro.
  - The bottom right is SugarCube's debug panel, which is somewhat redundant,
    but there are a few things it can do that aren't easy to do with the
    other debug controls.

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
    unfinished, contains a todo mark, or throws an error.
    - If you start seek from such a passage, seek will not stop until it
      reaches a passage tagged "done".
    - Seek can be interrupted by pressing the button again.
  - <kbd>ctrl-comma</kbd> is a shortcut for "back".
  - <kbd>ctrl-period</kbd> is a shortcut for "forw".
  - <kbd>ctrl-slash</kbd> is a shortcut for "rand".
  - <kbd>ctrl-backslash</kbd> is a shortcut for "seek".

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
  - If the passage checks `n1_mageSight`,
    include at least one value in the range
    `[MP_mageSight, MP_contact]`.
  - If the passage checks `n2_free`,
    include both `MP_contact` and `MP_broken`.
- For testing `n2_magicPhaseBroken` variants:
  - Include `null`, `MP_mageSight`, and any values tested in the passage.
  - Note, these values are impossible: `MP_beforeCast`, `MP_triedMagic`,
    `MP_wantPassword`
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
    - `n8` is Nero's ending archives.
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
      color the links to draft passages.
- If a script or style is only used by a single passage, it's usually inlined
  in the passage.
- Large scripts used by a single passage are usually extracted to a
  a side passage with a direct `<<include>>`
- Scripts and styles used by multiple passages are in `Init` sections at
  the top of the story-graph.
  - These unfortunately do not get syntax-highlighting the way that the
    special "Story Javascript" and "Story Stylesheet" passages do.
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
  - The problem is that savestats with seeded random are incompatible with
    states without seeded random.
  - Conversion is possible, but there's no way to make the seed-added
    state reproducible.
  - In general, savestates are not necessarily reproducible anyway,
    since they can be created from multiple versions of the storygraph.
  - Approximate reproducible is still useful, but breaking old saves is
    makes it not worth it.
  - For any useful reproducible, stub out random with a fixed constant.