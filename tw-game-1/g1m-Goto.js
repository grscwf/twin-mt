MT.goto = {};

MT.goto.list = () => {
  const walks = MT.gotoPaths;
  const current = MT.getPath();
  let mkp = "<<nobr>>";
  for (let i = 0; i < walks.length; i++) {
    const walk = walks[i];
    MT.nonNull(walk, `walk step ${i}`);

    if (typeof walk === "string") {
      mkp += `<div class="walk-header">${walks[i]}</div>`;
      continue;
    }

    /** @type {(ch: string, type: string, step: GotoStep) => void} */
    const addSeg = (ch, type, step) => {
      const note = step.note ? " walk-choice-note" : "";
      if (step.width != null) {
        mkp += `<span class=walk-sp>`;
        mkp += `<span class="walk-sp-w${note}">> ${step.width}</span>`;
      }
      mkp += `<span class="walk-choice walk-choice-${type}${note}">`;
      mkp += `<<link "> ${ch}">>`;
      mkp += `<<run MT.goto.doWalk(${i}, "${ch}")>>`;
      mkp += `<</link>>`;
      if (step.width != null) mkp += `</span>`;
      mkp += `</span> `;
    };

    const path = walk.path;
    const [pn, cn] = MT.commonPathLengths(path, current);

    mkp += `<div class=walk-path>`;
    if (pn === path.length) {
      /* all of path is in the past of current */
      for (const st of path) {
        if (st.choice != null) addSeg(st.choice, "past", st);
      }
    } else if (cn === current.length) {
      /* all of current is on path */
      let ppn = pn;
      /* sometimes choice marker is an empty segment. */
      if (ppn !== 0 && path[ppn]?.choice != null) {
        while (ppn < path.length - 1 && path[ppn]?.choice != null) ppn++;
      }
      /* find finished choice in path */
      while (ppn > 1 && path[ppn]?.choice == null) ppn--;
      for (const st of path.slice(0, ppn)) {
        if (st.choice != null) addSeg(st.choice, "past", st);
      }
      for (const st of path.slice(ppn)) {
        if (st.choice != null) addSeg(st.choice, "future", st);
      }
    } else {
      /* path and current are disjoint */
      for (const st of path) {
        if (st.choice != null) addSeg(st.choice, "disjoint", st);
      }
    }
    const len = path.filter((st) => st.t != null).length;
    mkp += `<span class=walk-path-len>[${len}]</span>`;
    mkp += `</div>`;
  }
  mkp += "<</nobr>>";
  return mkp;
};

/** @type {(steps: GotoStep[], ch: string) => GotoStep[]} */
const getPathChoice = (steps, ch) => {
  const result = [];
  let seen = false;
  for (const step of steps) {
    if (step.choice != null && seen) break;
    result.push(step);
    if (step.choice != null) seen = step.choice === ch;
  }
  return result;
};

/** @type {(i: number, ch: string) => void} */
MT.goto.doWalk = (i, ch) => {
  MT.forgetWalkHistory();
  const walk = MT.gotoPaths[i];
  MT.nonNull(walk, `walk step ${i}`);
  MT.assert(typeof walk !== "string", "");
  const force = !!$("#walk-force").prop("checked");
  const path = getPathChoice(walk.path, ch);
  State.reset();
  State.variables.g_versionAtStart = setup.version;
  Engine.play("g1a Bound");
  MT.roamStart(path, null, force);
};

MT.goto.reWalk = () => {
  const path = MT.getPath();
  const force = !!$("#walk-force").prop("checked");
  MT.forgetWalkHistory();
  State.reset();
  State.variables.g_versionAtStart = setup.version;
  Engine.play("g1a Bound");
  MT.roamStart(path, null, force);
};

MT.goto.showCurrentPath = () => {
  const path = MT.getPath();
  const js = MT.pathToJs(path);
  $("#walk-current-path").val(`// current path [${path.length}]\n${js}`);
};

MT.goto.walkAll = () => {
  const walks = MT.gotoPaths;
  const force = !!$("#walk-force").prop("checked");
  let i = 0;
  const t0 = Date.now();
  const startNext = () => {
    const t1 = Date.now();
    while (i < walks.length && typeof walks[i] === "string") {
      i++;
    }
    if (i >= walks.length) {
      const dt = Date.now() - t0;
      console.log(`done walkAll in ${dt / 1000}s`);
      return;
    }
    const walk = walks[i++];
    MT.nonNull(walk, `walk step ${i - 1}`);
    MT.assert(typeof walk !== "string", "");
    console.log(`Starting ${MT.pathName(walk.path)}`);
    MT.forgetWalkHistory();
    State.reset();
    State.variables.g_versionAtStart = setup.version;
    Engine.play("g1a Bound");
    const done = () => {
      const dt = Date.now() - t1;
      console.log(`done path in ${dt / 1000}s`);
      startNext();
    };
    MT.roamStart(walk.path, done, force);
  };
  startNext();
};

MT.goto.init = () => {
  if (State.temporary.isTranscript) return;

  $(document).one(":passagedisplay", () => {
    const force = session.get("walk-force") || false;
    const el = $("#walk-force");
    el.prop("checked", force);
    el.on("input", () => {
      session.set("walk-force", !!el.prop("checked"));
    });

    MT.goto.showCurrentPath();
  });
};
