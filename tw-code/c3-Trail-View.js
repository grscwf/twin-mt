/**
 * @typedef {object} SectInfo
 * @prop {string} [use]
 * @prop {boolean} [alwaysShow]
 * @prop {string} [preamble]
 * @prop {string} [title]
 */

/** @type {Record<string, SectInfo>} */
const sectInfo = {
  n0a: {
    use: "n9a",
  },
  n1a: {
    alwaysShow: true,
    preamble: "Nero First Floor",
    title: "Beginning",
  },
  n1cn: {
    title: "Sparring",
  },
  n1cr: {
    title: "Charming",
  },
  n1cs: {
    title: "Yielding",
  },
  n1cx: {
    use: "n1d",
  },
  n1d: {
    title: "The Candle",
  },
  n1e: {
    use: "n1d",
  },
  n1f: {
    title: "The Globe",
  },
  n1p: {
    title: "The Cock",
  },
  n1s: {
    title: "The Magic",
  },
  n1x: {
    title: "The Objects",
  },
  n1y: {
    use: "n1x",
  },
  n2a: {
    title: "Alone",
  },
  n2b: {
    use: "n2a",
  },
  n2c: {
    use: "n2a",
  },
  n2f: {
    title: "Free",
  },
  n2x: {
    title: "Free Objects",
  },
  n2y: {
    title: "The Wand",
  },
  n9a: {
    title: "Endings",
  },
  n9b: {
    title: "Broken",
  },
};

/**
 * Ordered list of section names
 * @type {string[]}
 */
const sectNames = [];

/**
 * Record of section name -> array of titles
 * @type {Record<string, string[]>}
 */
const sections = {};

/** expose state for easier debugging */
MT.trailView = { sectNames, sections };

const gatherPassages = () => {
  const all = Story.lookupWith(() => true);
  for (const p of all) {
    if (p.tags.includes("inclusion")) continue;
    if (p.tags.includes("is-menu")) continue;
    if (p.tags.includes("mt-sketch")) continue;

    const m = /^[n]\d\w*\b/.exec(p.title);
    if (m == null) continue;

    let sect = m[0];
    let info = sectInfo[sect];
    MT.nonNull(info, `sectInfo[${sect}]`);

    if (info.use != null) {
      sect = info.use;
      info = sectInfo[sect];
      MT.nonNull(info, `sectInfo[${sect}]`);
      MT.assert(info.use == null, `sectInfo[${sect}].use should not chain`);
    }

    (sections[sect] ||= []).push(p.title);
  }

  sectNames.push(...Object.keys(sections).sort());

  for (const titles of Object.values(sections)) {
    titles.sort();
  }
};

/** @type {(title: string, state: Record<string, unknown>, out: JQuery<HTMLElement>) => void} */
const renderSeen = (title, state, out) => {
  out.empty();
  const div = MT.tran.renderPage({ title, vars: state });
  if (setup.debug) {
    const plain = MT.tran.renderPage({ title });
    const clue = makeClue(plain);
    clue.wiki("?debugIcon <hr>").appendTo(out);
    $("<div class=trail-info-title>").wiki(`?debugIcon ${title}`).appendTo(out);
  }
  out.append(div);
  if (setup.debug) {
    const read = JSON.parse(/** @type {string} */ (state.g_varsRead || "[]"));
    /** @type {Record<string, unknown>} */
    const obj = {};
    for (const v of read) {
      obj[v] = state[v];
    }
    const json = MT.json(obj, null, "  ");
    $("<div class=trail-info-state>").text(json).appendTo(out);
  }
};

/** @type {(title: string, out: JQuery<HTMLElement>) => void} */
const renderUnseen = (title, out) => {
  out.empty();
  const div = MT.tran.renderPage({ title });
  const clue = makeClue(div);
  out.append(clue);

  if (setup.debug) {
    $("<div class=trail-info-debug>")
      .append("<hr>")
      .append($("<div class=trail-info-title>").text(`\ud83d\udd27 ${title}`))
      .append(div)
      .appendTo(out);
  }
};

/** @type {(div: JQuery<HTMLElement>) => JQuery<HTMLElement>} */
const makeClue = (div) => {
  const hasCut = div.find("#clue-cut, clue-cut").length !== 0;
  let wordsLeft = hasCut ? 100 : 10;
  /** @type {(node: Node) => void} */
  const trim = (node) => {
    if (wordsLeft <= 0) {
      node.parentNode?.removeChild(node);
    } else if (node.nodeType === 3 /* text */) {
      const words = node.nodeValue?.split(/\s+/) || [];
      let n = words.length;
      if (n > 0 && words[n - 1] === "") n -= 1;
      if (n > 0 && words[0] === "") n -= 1;
      if (n === 0) return;
      if (n > wordsLeft) {
        if (words[0] === "") wordsLeft += 1;
        const phrase = words.slice(0, wordsLeft).join(" ");
        const textNode = document.createTextNode(phrase);
        node.parentNode?.replaceChild(textNode, node);
      }
      wordsLeft -= n;
    } else if (node instanceof HTMLElement) {
      if (node.tagName === "CLUE-CUT" || node.id === "clue-cut") {
        wordsLeft = 0;
      } else if (/^(BR|HR)/.test(node.tagName)) {
        node.parentNode?.removeChild(node);
      } else if (/^(STYLE)$/.test(node.tagName)) {
        return;
      } else {
        const kids = Array.from(node.childNodes);
        kids.forEach((kid) => trim(kid));
      }
    } else {
      node.parentNode?.removeChild(node);
    }
  };
  const copy = div.clone();
  copy.find("meta-text").remove();
  copy.find(".clue-remove").remove();
  copy.find(".tran-diag").remove();
  trim(MT.jqUnwrap(copy));
  copy.addClass("trail-info-unseen");
  copy.append("...");
  return copy;
};

const lastNonMenuPassage = () => {
  const hist = State.history;
  for (let i = hist.length - 1; i >= 0; i--) {
    const title = hist[i]?.title || "";
    const passage = Story.get(title);
    if (!passage.tags.includes("is-menu")) {
      return title;
    }
  }
  return null;
};

/** @type {(out: JQuery<HTMLElement>) => void} */
MT.trailViewRender = (out) => {
  const current = new Set(State.history.map((m) => m.title));
  const recent = new Set();
  const older = new Set();
  /** @type {Record<string, SugarCubeStoryVariables>} */
  const snapshots = {};

  const packed = MT.getPackedTrails();
  for (const trail of packed) {
    MT.expandTrail(trail);
    for (const step of trail.history || []) {
      older.add(step.title);
      snapshots[step.title] = step.variables;
    }
  }

  /** @type {(title: string, out: JQuery<HTMLElement>) => void} */
  const renderInfo = (title, out) => {
    if (current.has(title)) {
      const moments = State.history.filter((m) => m.title === title);
      const moment = moments.pop();
      if (moment != null) {
        renderSeen(
          title,
          /** @type {Record<string, unknown>} */ (moment.variables),
          out
        );
      }
    } else if (recent.has(title) || older.has(title)) {
      const state = /** @type {Record<string, unknown>} */ (snapshots[title]);
      renderSeen(title, state, out);
    } else {
      renderUnseen(title, out);
    }
  };

  /** @type {(target: JQuery<HTMLElement>) => void} */
  const select = (target) => {
    if (target == null || !target.length) return;

    $(".trail-selected").removeClass("trail-selected");
    target.addClass("trail-selected");

    let info = $("#trail-info");
    if (!info.length) {
      info = $("<div id=trail-info>");
    }
    info.appendTo(target.parent());

    const title = target.attr("data-title") || "";
    renderInfo(title, info);
    session.set("trail-sel", title);

    const win = $(window);
    const winTop = win.scrollTop() || 0;
    const winBot = winTop + (win.height() || 0);
    const top = target.offset()?.top || 0;
    if (top < winTop + 10 || top > winBot - 120) {
      target[0]?.scrollIntoView({ block: "center" });
    }
  };

  const deselect = () => {
    $("#trail-info").remove();
    $(".trail-selected").removeClass("trail-selected");
    session.delete("trail-sel");
  };

  /** @type {(ev: JQuery.KeyboardEventBase) => void} */
  const onKeyDown = (ev) => {
    let sel = $(".trail-selected");
    switch (ev.key) {
      case "ArrowUp": {
        ev.preventDefault();
        ev.stopPropagation();
        if (!sel.length) return;
        let pos = sel.prevAll(".trail-item").length;
        let t = sel.parent().prevAll(".trail-group").first();
        if (t.length) {
          const kids = t.find(".trail-item");
          pos = Math.min(pos, kids.length && kids.length - 1);
          t = $(/** @type {HTMLElement} */ (kids[pos]));
        }
        select(t);
        break;
      }
      case "ArrowDown": {
        ev.preventDefault();
        ev.stopPropagation();
        if (!sel.length) return;
        let pos = sel.prevAll(".trail-item").length;
        let t = sel.parent().nextAll(".trail-group").first();
        if (t.length) {
          const kids = t.find(".trail-item");
          pos = Math.min(pos, kids.length && kids.length - 1);
          t = $(/** @type {HTMLElement} */ (kids[pos]));
        }
        select(t);
        break;
      }
      case "ArrowLeft": {
        ev.preventDefault();
        ev.stopPropagation();
        if (!sel.length) return;
        let t = sel.prev(".trail-item");
        if (!t.length) {
          t = sel.parent().prevAll(".trail-group").first();
          t = t.find(".trail-item").last();
        }
        select(t);
        break;
      }
      case "ArrowRight": {
        ev.preventDefault();
        ev.stopPropagation();
        if (!sel.length) return;
        let t = sel.next(".trail-item");
        if (!t.length) {
          t = sel.parent().nextAll(".trail-group").first();
          t = t.find(".trail-item").first();
        }
        select(t);
        break;
      }
      case "Escape": {
        ev.preventDefault();
        ev.stopPropagation();
        deselect();
        break;
      }
    }
  };

  $(document).on("keydown", onKeyDown);
  $(document).one(":passageinit", () => {
    $(document).off("keydown", onKeyDown);
  });

  /** @type {(ev: JQuery.MouseEventBase) => void} */
  const onClick = (ev) => {
    const target = $(ev.target);
    if (target.hasClass("trail-selected")) {
      deselect();
    } else {
      select(target);
    }
  };

  const here = lastNonMenuPassage();

  let hasRecent = false;
  let hasOlder = false;
  for (const sect of sectNames) {
    const info = sectInfo[sect];
    MT.nonNull(info, `sectInfo[${sect}]`);
    if (info.preamble != null) {
      $(`<div class=trail-preamble>`).text(info.preamble).appendTo(out);
    }
    const group = $(`<div class=trail-group>`).appendTo(out);
    const groupTitle = $(`<div class=trail-group-title>`).appendTo(group);
    let anyKnown = false;
    for (const title of sections[sect] || []) {
      const item = $(`<div class=trail-item>`)
        .toggleClass("trail-current", current.has(title))
        .toggleClass("trail-recent", recent.has(title))
        .toggleClass("trail-older", older.has(title))
        .appendTo(group);
      if (setup.debug) {
        item.attr("title", title);
      }
      item.attr("data-title", title);
      if (title === here) {
        $(`<span id="trail-here">`).appendTo(item);
      }
      item.on("click", onClick);

      hasRecent ||= recent.has(title);
      hasOlder ||= older.has(title);
      anyKnown ||= current.has(title) || recent.has(title) || older.has(title);
    }
    if (anyKnown || info.alwaysShow) {
      groupTitle.text(info.title || "").addClass("trail-group-title-known");
    } else if (setup.debug) {
      groupTitle
        .text(info.title || "")
        .wiki("?debugIcon")
        .addClass("trail-group-title-debug");
    } else if (false) {
      groupTitle
        .text(info?.title?.replace(/./g, "?") || "")
        .addClass("trail-group-title-unknown");
    } else {
      group.remove();
    }
  }

  const sel = session.get("trail-sel");
  if (sel != null) {
    const jq = out.find(`[data-title="${sel}"]`);
    if (jq.length) {
      setTimeout(() => select(jq), 200);
    }
  }
};

const trailViewInit = () => {
  if (!setup.playtest) return;
  gatherPassages();
};

trailViewInit();
