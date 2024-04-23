/**
 * @typedef {object} RoamStep
 * @prop {string} [t]
 * @prop {number} [i]
 * @prop {string} [code]
 */

const roamMilestones = new Set([
  "n1p Barbs Fast 1",
  "n1p Barbs Slow 1",
  "n1p Barbs Slow 2a1",
  "n1p Barbs Slow 2n1",
  "n1p Barbs Slow 2s1",
  "n1p Barbs Skip",
  "n1s Cast Alone 1",
  "n1s Cast Endgame 1",
  "n1s Cast Horny 1",
  "n1s Cast Itch 2",
  "n1s Cast Sight 1",
  "n1s Cast Sight Horny",
  "n1s Cast Younger 1",
  "n1s Guess Password",
  "n1s Impatient",
  "n1s Say Device 1",
  "n1s Say Lance",
  "n1s Say Password",
  "n1s Tap 1",
  "n1s Zero Bound",
]);

/** @type {Set<string>} */
const roamVisited = new Set();

/** @type {Record<string, string>} */
let roamLastPick = {};

let roamIgnoreFuture = false;

/** @type {(() => void) | null | undefined} */
let roamDoneFn = null;
let roamForce = false;
let roamLoop = 0;
/** @type {RoamStep[] | null | undefined} */
let roamPath = null;

let roamDelay = 50;
const maxLoop = 5;

MT.roaming = false;

MT.forgetWalkHistory = () => {
  roamVisited.clear();
  roamLastPick = {};
};

/** @type {(el: HTMLElement) => string} */
const idOf = (el) => {
  const title = $(el).attr("data-passage") || "";
  const code = $(el).attr("data-mta-code") || "";
  return `${title}/${code}`;
};

const hasTodo = () => {
  return (
    MT.isDraft(State.passage) ||
    /\bX[X]X\b|\bTO[D]O\b/.test($(".passage").text())
  );
};

/**
 * @arg {RoamStep[] | null} [path]
 * @arg {(() => void) | null} [doneFn]
 * @arg {boolean} [force]
 * @arg {number} [delay]
 */
const roamStart = (path, doneFn, force, delay) => {
  roamPath = path;
  roamDoneFn = doneFn;
  roamForce = force || false;
  roamDelay = delay || 50;

  $("#rw-roam").addClass("rw-roaming");
  MT.roaming = true;

  /* If starting from an ending, start looping. */
  if (path == null && tags().includes("roam-stop")) {
    roamLoop = maxLoop;
    return startLoop();
  }

  /* If starting from draft or todo, continue past todo */
  if (path == null && hasTodo()) {
    roamForce = true;
  }

  setTimeout(roamNext, roamDelay);
};

MT.roamStart = roamStart;

const roamStop = () => {
  MT.roaming = false;
  roamDoneFn = null;
  roamPath = null;
  $("#rw-roam").removeClass("rw-roaming");
};

const startLoop = () => {
  console.log("# starting new loop");
  MT.forgetWalkHistory();
  State.reset();
  State.variables.g_versionAtStart = setup.version;
  Engine.play("g1a Bound");
  roamForce = false;
  const neroStart = [{ t: "g1a Choose Character" }, { t: "n1a Nero Start" }];
  roamStart(neroStart, () => {
    roamStart(null, () => {
      roamLoop--;
      if (roamLoop > 0) startLoop();
    });
  });
};

/** @type {(reason: string) => void} */
const reportEnd = (reason) => {
  const V = State.variables;
  console.log(`${reason} after ${State.turns} steps at ${State.passage}`);
  console.log(`- local + session storage = ${MT.computeSizes()}`);
  const mp = MT.enumSymbol("MagicPhase", V.n_magicPhase || 0);
  const mpr = MT.enumSymbol("MagicPhase", V.n_magicPhaseReached || 0);
  console.log(`- magicPhase ${mp}, ${mpr}`);
};

const roamNext = () => {
  if (!MT.roaming) return roamStop();

  const chosen = $("#passages .random-walk-chosen");
  if (chosen.length === 1) {
    MT.jqUnwrap(chosen).click();
    setTimeout(roamNext, roamDelay);
    return;
  }

  /* show milestone */
  const here = State.passage;
  if (roamMilestones.has(here)) {
    console.log(`milestone ${here}`);
  }

  /* stop on problem */
  if (MT.diagHasWarning || MT.diagHasError) {
    console.log("stopping on problem");
    return roamStop();
  }

  /* stop on to-do (if not forced) */
  if (!roamForce && hasTodo()) {
    console.log("stopping on to-do");
    return roamStop();
  }

  /* skip comments in path */
  if (roamPath != null) {
    while (
      roamPath[0] != null &&
      roamPath[0].t == null &&
      roamPath[0].i == null
    ) {
      roamPath.shift();
    }
  }

  /* at end of path */
  if (roamPath != null && roamPath.length === 0) {
    if (roamDoneFn != null) setTimeout(roamDoneFn);
    reportEnd("path end");
    return roamStop();
  }

  /* follow path */
  if (roamPath != null) {
    const next = roamPath[0];
    MT.nonNull(next, "next roamPath");
    const links = $("#story a[data-passage]");
    /** @type {(i: number, el: HTMLElement, step: RoamStep) => boolean} */
    const isStep = (i, el, step) => {
      if (step.i != null && i === step.i) {
        return true;
      }
      const title = el.getAttribute("data-passage") || "";
      const code = el.getAttribute("data-mta-code") || "";
      return (
        title === step.t &&
        (code === "" || step.code == null || code === step.code)
      );
    };
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      MT.nonNull(link, "link");
      if (isStep(i, link, next)) {
        roamPath.shift();
        $(link).addClass("random-walk-chosen");
        setTimeout(roamNext, 100);
        return;
      }
    }
    MT.warn(`Broken path: ${JSON.stringify({next, roamPath})}`);
    return roamStop();
  }

  /* stop at stop passage */
  if (tags().includes("roam-stop")) {
    reportEnd("roam-stop");
    if (roamDoneFn != null) setTimeout(roamDoneFn);
    return roamStop();
  }

  /* pick a random link */
  if (goRandom(false)) {
    setTimeout(roamNext, roamDelay);
    return;
  }

  roamStop();
};

/** @type {(isManual?: boolean) => boolean} */
const goRandom = (isManual) => {
  const V = State.variables;

  const chosen = $("#passages .random-walk-chosen");
  if (chosen.length === 1) {
    roamIgnoreFuture = false;
    chosen.trigger("click");
    return true;
  }
  chosen.removeClass("random-walk-chosen");

  const here = State.passage;
  const all = $("#passages a[data-passage]");
  if (all.length === 0) return false;

  let avail = all;

  // bias toward climbing the ladder of magic.
  let important = "[data-mta-code*='//prefer']";
  switch (V.n_magicPhase) {
    case MP_beforeCast:
      important += ", [data-passage*=Cast]:not([data-passage*=Itch])";
      break;
    case MP_triedMagic:
      if (!V.n_mageSight) {
        important += ", [data-passage*=Sight]";
      } else {
        important += ", [data-passage*=Mirror], [data-passage*=Tap]";
      }
      break;
    case MP_wantDevice:
      important += ", [data-passage*=Say]";
      break;
    case MP_wantName:
      important += ", [data-passage*=Say], [data-passage*=Ask]";
      important += ", [data-passage*=Bottle]";
      break;
    case MP_wantTouch:
      important += ", [data-passage*=Ask], [data-passage*=Penguin]";
      break;
    case MP_wantPass:
      important += ", [data-passage*=Password], [data-passage*=Ask]";
      break;
  }
  const prefer = all.filter(important);
  if (!isManual && prefer.length && Math.random() < 0.7) {
    const names = prefer.map((i, el) => $(el).attr("data-passage"));
    console.log(`prefer [${[...names].join(",")}]`);
    avail = prefer;
  } else {
    avail = avail.filter((i, el) => !roamVisited.has(idOf(el)));
  }
  if (isManual) {
    // avoid the glitch link
    avail = avail.filter(
      (i, el) =>
        el.dataset["passage"] !== "n1p Barbs Glitch 1" || Math.random() < 0.1
    );
  }

  // Usually try to avoid already-seen
  const seen = $(".mt-seen-true a[data-passage]");
  if (seen.length && Math.random() > 0.8) {
    avail = avail.filter((i, el) => !seen.is(el));
  }

  /** @type {HTMLElement | null | undefined} */
  let pick = null;
  while (pick == null) {
    if (avail.length === 0) {
      all.each((i, el) => {
        roamVisited.delete(idOf(el));
      });
      avail = all;
      if (avail.length > 1) {
        // avoid picking the link we just picked
        avail = avail.filter((i, el) => idOf(el) !== roamLastPick[here]);
        if (avail.length === 0) avail = all;
      }
    }

    const rand = Math.floor(avail.length * Math.random());
    pick = avail[rand];
    MT.nonNull(pick, "random pick");
    const code = $(pick).attr("data-mta-code") || "";
    const avoid = code !== "" && code.includes("//avoid");
    if (!isManual && avoid && Math.random() < 0.9) {
      const title = $(pick).attr("data-passage");
      console.log(`avoiding ${title}`);
      pick = null;
      avail = avail.filter((j, el) => j !== rand);
    }
  }
  $(pick).addClass("random-walk-chosen");
  pick.scrollIntoView(false);
  const id = idOf(pick);
  roamLastPick[here] = id;
  roamVisited.add(id);
  return true;
};

const roamInit = () => {
  if (!setup.playtest) return;

  function updateLabel() {
    const isMenu = tags().includes("is-menu");
    $("#random-walk").toggleClass("at-menu", isMenu);

    const noFuture = () => {
      if (isMenu) return false;
      if (roamIgnoreFuture) return true;
      if (State.length === State.size) return true;
      const moment = State.history[State.length];
      if (moment == null) return true;
      const next = moment.title;
      const links = $("#passages a[data-passage]").filter(
        (i, el) => $(el).attr("data-passage") === next
      );
      return links.length === 0;
    };

    const el = $("#rw-forw");
    el.text(noFuture() ? "rand" : "next");
  }

  const goBack = () => {
    const chosen = $("#passages .random-walk-chosen");
    if (chosen.length > 0) {
      roamIgnoreFuture = true;
      chosen.removeClass("random-walk-chosen");
      updateLabel();
    } else {
      roamIgnoreFuture = false;
      Engine.backward();
    }
  };

  const goForward = () => {
    if (tags().includes("is-menu")) return;
    if (State.length === State.size || roamIgnoreFuture) {
      goRandom(true);
      return;
    }
    roamIgnoreFuture = false;

    const moment = State.history[State.length];
    MT.nonNull(moment, "current moment");
    const next = moment.title;
    const chosen = $("#passages .random-walk-chosen");
    if (chosen.length === 1) {
      if (chosen.attr("data-passage") === next) {
        Engine.forward();
      } else {
        goRandom(true);
      }
      return;
    }
    chosen.removeClass("random-walk-chosen");
    const links = $("#passages a[data-passage]").filter(
      (i, el) => $(el).attr("data-passage") === next
    );
    if (links.length === 1) {
      links.addClass("random-walk-chosen");
      MT.jqUnwrap(links).scrollIntoView(false);
    } else {
      goRandom(true);
    }
  };

  const roamToggle = () => {
    if (tags().includes("is-menu")) return;
    if (MT.roaming) {
      roamStop();
    } else {
      roamStart();
    }
  };

  $(() => {
    $("#random-walk").remove();
    const outer = $("<div>").attr("id", "random-walk").appendTo("#story");
    $("<a>")
      .attr("title", "<ctrl-comma> backward")
      .text("back")
      .on("click", goBack)
      .appendTo(outer);
    if (setup.debug) {
      $("<a id=rw-roam>")
        .toggleClass("rw-roaming", MT.roaming)
        .text("roam")
        .on("click", roamToggle)
        .appendTo(outer);
    }
    $("<a id=rw-forw>")
      .attr("title", "<ctrl-period> forward or random")
      .text("forw")
      .on("click", goForward)
      .appendTo(outer);
    updateLabel();
  });

  // ctrl-comma doesn't generate keypress events
  $(document).on("keydown", (ev) => {
    if (!ev.ctrlKey) return;
    const focus = document.activeElement;
    const tag = focus != null ? focus.tagName : "";
    if (/^(textarea|input|select)$/i.test(tag)) return;
    if (ev.key === ",") return goBack();
    if (ev.key === ".") return goForward();
  });

  // Click somewhere on page, cancel selection
  $("html").on("click", (ev) => {
    if (MT.roaming) return;
    if (ev.target == null) return;
    if (ev.target.tagName === "A") return;

    const chosen = $("#passages .random-walk-chosen");
    if (chosen.length) {
      chosen.removeClass("random-walk-chosen");
      roamIgnoreFuture = true;
      updateLabel();
    }
  });

  $(document).on(":passagedisplay", () => {
    updateLabel();
  });
};

roamInit();
