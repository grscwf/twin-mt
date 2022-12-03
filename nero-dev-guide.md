# Dev guide for Nero <!-- omit in toc -->

- [Working with Twine](#working-with-twine)
- [Working with Twee](#working-with-twee)
- [Dev workflows](#dev-workflows)
- [Debug controls](#debug-controls)
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

- Debug mode adds several useful passages to the left menu, marked with a
  wrench icon
- The "walk" and "back" buttons on the right will do a random walk.
  - Pressing "walk" will highlight a random link in the current passage.
  - Pressing "walk" again will visit that link.
  - "back" deselects a highlighted link, or goes back to the previous passage.
  - "walk" tries to do shuffle, not uniform random, so repeated walk/back can
    potentially do an entire depth-first traversal of the story.
  - <kbd>ctrl-period</kbd> is a shortcut for "walk".
  - <kbd>ctrl-comma</kbd> is a shortcut for "back".
- "var-info" at the top is a compact display of state variables.
  - Pressing "var-info" will show or hide the variables info.
  - var-info only shows variables that are read or set by the current passage.
  - Hover over a variable will show verbose detail.
  - Up-arrow on the left of a varname indicates the var was set.
  - Down-arrow on the right of a varname indicates the var was read.
  - Boolean flags are either red (false) or green (true).
  - Enums flags are blue, showing the current value.
  - Other types are gray.
- var-info lets you change some flags.
  - If a boolean or enum flag is read by the passage, var-info will show it as
    a button.
  - Pressing the button will change the value and redisplay the current passage.
  - Enum flags are two buttons: left decreases, right increases.
  - Changing a flag adds another state to the history.
    "back" will revert the change.
- var-info highlights "notable" flags.
  - Notable flags are flags like `n1_naked` that are expected to have visible
    effects in the current passage.
  - Notable flags are defined by story section: eg, `n1_naked` is not notable
    if it's always true in a section.
  - If a passage does not read a notable flag, it's marked with a
    construction-sign warning.
  - The warning can be removed by using the flag,
    or by declaring it constant with <nobr>`<<vi-always flag value>>`</nobr>,
    or by ignoring it with <nobr>`<<vi-ignore flag>>`</nobr>.

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
    - Restarting at chapter 2 will delete all `n2_` and later variables,
      and restore a snapshot of `n1_` variables
      (saved before starting chapter 2).
  - The `t_` variables are for state that's only used in local passage connections. They aren't saved or restored at a restart point.
- `n0_` vars are for Nero state that persists across replays.
- `mt_` vars are for overall story state that persists across replays.


## Rationales
TODO
