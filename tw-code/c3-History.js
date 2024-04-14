
/* We need to keep entire history, for transcript and checkpoints. */
Config.history.maxStates = 100000;

const histIgnore = ["g1a Title Screen"];

/**
 * True if title is a menu passage
 * @type {(title: string) => boolean}
 */
const histIsMenu = (title) => {
  const passage = Story.get(title);
  return passage.tags.includes("is-menu");
};

/** Pops history to last story passage. */
MT.popToStory = () => {
  const hist = State.history;
  let pos = State.length - 1;
  while (pos > 0 && histIsMenu(hist[pos]?.title || "")) {
    pos--;
  }
  Engine.goTo(pos);
};

/**
 * Returns history without is-menu loops.
 * @type {() => StoryMoment[]}
 */
MT.getHistory = () => {
  /** @type {StoryMoment[]} */
  const result = [];

  const hist = State.history;
  for (let i = 0, n = hist.length; i < n; i++) {
    const moment = hist[i];
    MT.nonNull(moment, "moment");

    const title = moment.title;
    if (histIgnore.includes(title)) continue;
    if (histIsMenu(title)) continue;

    // if previous passage is a menu passage
    if (i > 0 && histIsMenu(hist[i - 1]?.title || "")) {
      // and we're returning to the same passage
      if (result.length > 0 && result[result.length - 1]?.title === title) {
        // skip this one too
        continue;
      }
    }

    result.push(moment);
  }
  return result;
};
