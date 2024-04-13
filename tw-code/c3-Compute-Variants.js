/**
 * @typedef {object} CompRender
 * @prop {HTMLElement} dom
 * @prop {string} text
 * @prop {Array<{ obj: Record<string, unknown>, json: string }>} pairs
 */

/** @type {Set<string>} */
let cvIgnore = new Set();

/** @type {Record<string, unknown[]>} */
let cvTryVars = {};

// We assume a null var is a boolean and try `true` is a value.
// These vars might be null, but `true` is not valid.
const cvNonBooleans = new Set(["n_passFound", "n_passTried", "n_upset"]);

$(document).on(":passagestart", () => {
  cvIgnore = new Set();
  cvTryVars = {};
});

Macro.add("cv-ignore", {
  handler: function () {
    const varNames = /** @type {string[]} */ (this.args);

    for (let vn of varNames) {
      vn = vn.replace(/^\$/, "");
      cvIgnore.add(vn);
    }
  },
});

Macro.add("cv-try", {
  handler: function () {
    const vn = /** @type {string} */ (this.args[0]);
    const vals = /** @type {unknown[]} */ (this.args.slice(1));

    cvTryVars[vn] = vals;
  },
});

MT.computeVariants = function () {
  const statEl = $(".var-info-compute");
  statEl.addClass("cv-busy");

  const beginState = /** @type {Record<string, unknown>} */ (
    clone(State.current.variables)
  );
  const nowState = /** @type {Record<string, unknown>} */ (
    clone(State.active.variables)
  );
  const nowTemps = /** @type {Record<string, unknown>} */ (
    clone(State.temporary)
  );

  // ignore vars that weren't boolean-ish
  for (const k of Object.keys(beginState)) {
    if (beginState[k] != null && typeof beginState[k] !== "boolean") {
      cvIgnore.add(k);
    }
  }
  // ignore vars that aren't currently boolean-ish
  for (const k of Object.keys(nowState)) {
    if (nowState[k] != null && typeof nowState[k] !== "boolean") {
      cvIgnore.add(k);
    }
  }
  // ignore vars that can be null but are not boolean
  cvNonBooleans.forEach((vn) => cvIgnore.add(vn));
  // ignore vars that can be null but are enums
  Object.keys(MT.enumVars).forEach((vn) => cvIgnore.add(vn));

  /** @type {Array<Record<string, unknown>>} */
  const done = [];

  const usedSet = new Set(MT.trace.wasRead);

  cvIgnore.forEach((vn) => usedSet.delete(vn));

  // if a flag has an expectation for this section, limit to that value
  const sect = MT.sectHere();
  const expect = MT.sectExpect(sect);
  usedSet.forEach((vn) => {
    if (vn in expect) cvTryVars[vn] = [expect[vn]];
  });

  const todo = [beginState];
  const usedList = [...usedSet];
  // for state and vp pointing into usedList,
  // add new todo states that flip every value from vp to the end.
  // at this point, usedList is only boolean-ish values
  /** @type {(state: Record<string, unknown>, vp: number) => void} */
  const addRecursive = (state, vp) => {
    if (usedList.length <= vp) return;
    const vn = usedList[vp];
    const flipped = clone(state);
    flipped[vn] = !flipped[vn];
    todo.push(flipped);
    addRecursive(state, vp + 1);
    addRecursive(flipped, vp + 1);
  };
  addRecursive(beginState, 0);

  // for every var with explicit values to try, add states for them all
  Object.entries(cvTryVars).forEach(([vn, vals]) => {
    const [first, ...rest] = vals;
    if (!usedSet.has(vn)) usedSet.add(vn);
    cvIgnore.delete(vn);
    todo.forEach((t) => {
      t[vn] = first;
    });
    for (const val of rest) {
      [...todo].forEach((t0) => {
        const t1 = clone(t0);
        t1[vn] = val;
        todo.push(t1);
      });
    }
  });

  // At this point, todo has
  // - the current state
  // - all states with every alternate tryVar value
  // - all states with other non-ignored boolean-ish values flipped

  // Note, this can get confused by nondeterministic rng.

  const passageText = Story.get(State.passage).text;
  /** @type {Record<string, CompRender>} */
  const renders = {};
  /** @type {string[]} */
  const messages = [];

  let checked = 0;
  let tried = 0;

  const getValid = () => {
    for (let i = 0; i < 100; i++) {
      if (todo.length === 0) return null;
      const state = todo.pop() || {};
      done.push(state);
      checked++;
      const ok =
        MT.checkSectionState(state, sect, true, usedSet) &&
        MT.checkState(state, usedSet, false);
      if (ok) return state;
    }
    return null;
  };

  const tryOne = () => {
    const state = getValid();
    if (state == null) return;

    State.active.variables = clone(state);
    State.current.variables = clone(state);
    State.clearTemporary();
    State.temporary.isSpeculative = true;
    tried++;

    const output = $("<div class=passage>");
    MT.traceStart();
    const ok = MT.runsWithoutFail(() => output.wiki(passageText));
    MT.traceStop();

    MT.trace.wasRead.forEach((vn) => {
      if (usedSet.has(vn)) return;
      if (cvIgnore.has(vn)) return;
      if (usedSet.size >= 15) {
        messages.push(`ignoring var ${vn} (max 15)`);
        cvIgnore.add(vn);
        return;
      }
      usedSet.add(vn);
      if (state[vn] == null || typeof state[vn] === "boolean") {
        if (!(vn in expect)) {
          // add the inverse value to the todo list
          [...done, ...todo].forEach((st1) => {
            const st2 = clone(st1);
            st2[vn] = !st2[vn];
            todo.push(st2);
          });
        }
      }
    });

    if (!ok) return;

    const usedThisTime = [...MT.trace.wasRead]
      .filter((vn) => !cvIgnore.has(vn))
      .sort();
    const dom = MT.jqUnwrap(output);
    const html = dom.innerHTML;
    const text = dom.innerText;
    const render = renders[html] || (renders[html] = { dom, text, pairs: [] });
    const used = objSelect(state, usedThisTime);
    render.pairs.push({ obj: used, json: MT.json(used) });
  };

  const finish = () => {
    statEl.text("[compute variants]").removeClass("cv-busy");

    const varsUsed = [...usedSet].sort();
    const variants = Object.values(renders);
    variants.forEach((r) => {
      r.pairs.sort((a, b) => (a.json < b.json ? -1 : a.json > b.json ? +1 : 0));
    });
    variants.sort((a, b) => {
      // sorting by json puts false before true, which is good
      const aj = a.pairs[0]?.json || "";
      const bj = b.pairs[0]?.json || "";
      return aj < bj ? -1 : aj > bj ? +1 : 0;
    });
    const pos = $("#passages");
    pos.empty();
    const sum = $("<div id=cv-summary>").appendTo(pos);
    $("<div>").appendTo(sum)
      .text(`${variants.length} variants, ${checked} states checked, ${tried} states tried,
        ${varsUsed.length} vars`);
    messages.forEach((m) => $("<div>").text(m).appendTo(sum));
    for (const variant of variants) {
      pos.append("<hr>");
      const outer = $("<div class=cv-states>").appendTo(pos);
      variant.pairs.forEach((pair) => {
        const inner = $("<div class=cv-state>").appendTo(outer);
        for (const vn of Object.keys(pair.obj)) {
          const val = pair.obj[vn];
          if (val === false) {
            $(`<span class="cv-var cv-false">`).text(vn).appendTo(inner);
          } else if (val === true) {
            $(`<span class="cv-var cv-true">`).text(vn).appendTo(inner);
          } else if (MT.enumVars[vn] != null) {
            const sym = MT.enumSymbol(vn, val);
            $(`<span class="cv-var cv-enum">`).text(sym).appendTo(inner);
          } else {
            const str = MT.json(val);
            $(`<span class="cv-var cv-other">`)
              .text(`${vn}=${str}`)
              .appendTo(inner);
          }
          $(inner).append(" ");
        }
      });
      pos.append(variant.dom);
    }
    State.active.variables = nowState;
    State.clearTemporary();
    for (const k of Object.keys(nowTemps)) {
      State.temporary[k] = nowTemps[k];
    }
    highlightDiffs();
  };

  const tryNext = () => {
    if (checked >= 900000) {
      messages.push(`Stopping at ${checked} states checked`);
      todo.length = 0;
    }
    if (todo.length === 0) {
      finish();
    } else {
      if (checked % 100 === 0) {
        statEl.text(`[${todo.length} states pending]`);
      }
      for (let i = 0; i < 4; i++) {
        tryOne();
      }
      setTimeout(tryNext);
    }
  };
  tryNext();
};

/** @type {(obj: Record<string, unknown>, keys: string[]) => Record<string, unknown>} */
const objSelect = (obj, keys) => {
  /** @type {Record<string, unknown>} */
  const result = {};
  keys.forEach((k) => (result[k] = obj[k] || false));
  return result;
};

const highlightDiffs = () => {
  const passages = $(".passage");
  for (let i = passages.length - 1; i > 0; i--) {
    diff(passages[i - 1], passages[i]);
  }
};

/** @type {(x: Node | null | undefined, y: Node | null | undefined) => void} */
const diff = (x, y) => {
  if (x == null) {
    mark(y, 2);
  } else if (y == null) {
    mark(x, 1);
  } else if (x.nodeType !== y.nodeType) {
    mark(x, 1), mark(y, 2);
  } else if (x.nodeType === Node.TEXT_NODE && x.nodeValue !== y.nodeValue) {
    mark(x, 1), mark(y, 2);
  } else {
    // dumb comparison that mostly works because of sugarcube debug annotations
    let i = 0;
    for (; i < x.childNodes.length; i++) {
      diff(x.childNodes[i], y.childNodes[i]);
    }
    for (; i < y.childNodes.length; i++) {
      mark(y.childNodes[i], 2);
    }
  }
};

/** @type {(node: Node | null | undefined, c: number) => void} */
const mark = (node, c) => {
  if (node != null && node.nodeType != Node.ELEMENT_NODE) {
    node = node.parentElement;
  }
  if (node != null) {
    $(node).addClass(c === 1 ? "cv-diff-a" : "cv-diff-b");
  }
};
