/** @typedef {import("twine-sugarcube").Passage} Passage */

/**
 * Fix up the in-browser saved game title.
 * @type {(this: Passage) => string | null}
 */
Config.passages.descriptions = function () {
  // SugarCube sometimes gets a description for a passage other than
  // the current one. In that case, use its default excerpt.
  if (this.title !== State.passage) return null;

  // For the current passage, use the rendered text, not the source text.

  const doc = $(".passage").clone();
  doc.find("script, style").remove();
  doc.find("br").replaceWith(" ");
  const text = doc.text();
  const words = text.trim().split(/\s+/);

  let excerpt = words.slice(0, 10).join(" ");

  // add unlock count
  const [unlocked, total] = countUnlocks();
  if (unlocked > 0) {
    excerpt = `${unlocked}\uD83D\uDD13 ${excerpt}`;
  }

  return excerpt;
};

/** Intercept file save and fix filename */
{
  // sugarcube's default save UI doesn't provide any way to change the
  // savefile name, and all its methods are readonly. but it uses a saveAs()
  // function that can be hooked. (the alternative is to re-implement or
  // copy the entire save UI just to tweak the savefile name.)

  const origSaveAs = saveAs;
  saveAs = (blob, name, opt) => {
    // add unlock count to name
    const [unlocked, total] = countUnlocks();
    if (unlocked > 0) {
      name = name.replace(/^nero-/, `nero-${unlocked}u-`);
    }
    return origSaveAs(blob, name, opt);
  };
}

/** @type {() => [number, number]} */
const countUnlocks = () => {
  const md = MT.mdRecord();
  let num = 0;
  let total = 0;
  /** @type {(keys: string[]) => void} */
  const add = (keys) => {
    total += keys.length;
    for (const k of keys) {
      if (md[k]) num++;
    }
  };

  add(Object.keys(MT.drekkarEndings));
  add(Object.keys(MT.neroEndings));
  add(Object.keys(MT.neroKeywords));

  return [num, total];
}
