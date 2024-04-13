const alwaysConditional = new Set();
const alwaysVars = new Map();
const ignoreVars = new Set();

$(document).on(":passagestart", () => {
  alwaysConditional.clear();
  alwaysVars.clear();
  ignoreVars.clear();
});

/** @type {(ctx: MacroContext) => boolean} */
const withinInclude = (ctx) => {
  for (; ctx != null; ctx = /** @type {MacroContext} */ (ctx.parent)) {
    if (ctx.displayName === "include") return true;
  }
  return false;
};

/** @type {(ctx: MacroContext) => boolean} */
function withinCondition(ctx) {
  for (; ctx != null; ctx = /** @type {MacroContext} */ (ctx.parent)) {
    if (ctx.displayName === "if") return true;
    if (ctx.displayName === "switch") return true;
  }
  return false;
}

/** <<vi-always varname value [reason]>> */
Macro.add("vi-always", {
  handler: function () {
    if (State.temporary.isTranscript) return;
    const [vname, exp] = this.args;
    if (MT.varExpect(vname) != null && !withinInclude(this)) {
      MT.warn(`vi-always ${vname} is unnecessary`);
    }
    const actual = MT.untracedGet(vname);
    if (exp !== actual && !(exp === false && actual == null)) {
      // force a traced read, so it can be toggled
      const vars = /** @type {Record<string, unknown>} */ (State.variables);
      const read = vars[vname];
      MT.fail(`vi-always ${vname} ${exp}, but actual value is ${read}`);
      return;
    }
    alwaysVars.set(vname, exp);
    if (withinCondition(this)) {
      alwaysConditional.add(vname);
    }
  },
});

/** <<vi-always-if cond-var varname value [reason]>> */
Macro.add("vi-always-if", {
  handler: function () {
    if (State.temporary.isTranscript) return;
    const [cond, vname, exp] = this.args;
    const sect = MT.sectHere();
    if (MT.varExpect(vname) != null && !withinInclude(this)) {
      MT.warn(`vi-always-if ${cond} ${vname} is unnecessary`);
    }
    if (MT.untracedGet(cond)) {
      const actual = MT.untracedGet(vname);
      if (exp !== actual && !(exp === false && actual == null)) {
        // force a traced read, so it can be toggled
        const vars = /** @type {Record<string, unknown>} */ (State.variables);
        const read = vars[vname];
        MT.fail(
          `vi-always-if ${cond} ${vname} ${exp}, but actual value is ${read}`
        );
        return;
      }
      alwaysVars.set(vname, exp);
      if (withinCondition(this)) {
        alwaysConditional.add(vname);
      }
    }
  },
});

/** <<vi-ignore var1 ...>> */
Macro.add("vi-ignore", {
  handler: function () {
    if (State.temporary.isTranscript) return;
    for (const vn of this.args) {
      if (MT.varExpect(vn) != null) {
        MT.warn(`vi-ignore ${vn} is unnecessary`);
      }
      ignoreVars.add(vn);
    }
  },
});

/**
 * <<vi-ignore-if var1 var2 ...>>
 * If var1 is true, ignore remaining vars.
 * If var2 is true, ignore remaining vars.
 * etc.
 */
Macro.add("vi-ignore-if", {
  handler: function () {
    if (State.temporary.isTranscript) return;
    for (let p = 0; p < this.args.length - 1; p++) {
      const cvar = this.args[p];
      if (MT.varExpect(cvar) != null) {
        MT.warn(`vi-ignore-if ${cvar} is unnecessary`);
      }
      if (MT.untracedGet(cvar)) {
        this.args.slice(p + 1).forEach((vn) => ignoreVars.add(vn));
      }
    }
  },
});

/** @type {(val: unknown) => string} */
const str = (val) => (val == null ? String(val) : JSON.stringify(val));

/** @type {(vname: string) => JQuery<HTMLElement>} */
function varButton(vname) {
  const V = /** @type {Record<string, unknown>} */ (MT.untracedVars());
  const v0 = /** @type {Record<string, unknown>} */ (State.current.variables);

  const outer = $("<span class=var-info-button-outer>");
  let tags = "";

  if (MT.trace.wasDeleted.has(vname)) {
    tags += "[was-deleted]\n";
    outer.addClass("var-info-was-deleted");
  }
  if (MT.trace.wasRead.has(vname)) {
    tags += "[was-read]\n";
    outer.addClass("var-info-was-read");
  }
  if (MT.trace.wasSet.has(vname)) {
    tags += "[was-set]\n";
    outer.addClass("var-info-was-written");
  }

  const sect = MT.sectHere();
  const exp = MT.varExpect(vname);

  if (MT.isNotable(sect, vname)) {
    tags += "[section-notable]\n";
    outer.addClass("var-info-notable");
    if (ignoreVars.has(vname)) {
      tags += "[vi-ignore]\n";
      outer.addClass("var-info-ignored");
    } else if (alwaysVars.has(vname)) {
      tags += `[vi-always ${str(alwaysVars.get(vname))}]\n`;
      outer.addClass("var-info-always");
    } else if (!MT.trace.wasRead.has(vname)) {
      tags += "[to-do]\n";
      outer.addClass("var-info-to-do");
    }
  } else if (exp != null) {
    tags += `[section-always ${str(exp)}]\n`;
    outer.addClass("var-info-always");
  }

  const label = $("<span class=var-info-button-label>").appendTo(outer);

  const jval = str(V[vname]);
  if (MT.trace.wasSet.has(vname)) {
    const jval0 = str(v0[vname]);
    outer.attr("title", `${tags}${vname}=${jval0} ->\n${vname}=${jval}`);
  } else {
    outer.attr("title", `${tags}${vname}=${jval}`);
  }

  // assume undeclared is boolean
  const vtype =
    MT.enumVars[vname] || (vname in V ? typeof V[vname] : "boolean");

  const enumList = MT.enums[vtype];
  if (enumList != null) {
    outer.addClass("var-info-enum");
    const sym = enumList[+(V[vname] || 0)];
    const sameType = Object.values(MT.enumVars).filter(
      (t) => t === vtype
    ).length;
    label.text(sym != null ? sym : vname + "=" + jval);
    const n = enumList.length;
    if (MT.trace.wasRead.has(vname)) {
      const val0 = +(v0[vname] || 0);
      if (0 < val0) {
        $("<span>")
          .addClass("var-info-button-left var-info-can-change")
          .appendTo(outer)
          .on("click", () => {
            MT.revisitHere(() => {
              const vars = /** @type {Record<string, unknown>} */ (
                State.variables
              );
              vars[vname] = val0 - 1;
              State.variables.g_mutated = true;
            });
          });
      }
      if (val0 < n - 1) {
        $("<span>")
          .addClass("var-info-button-right var-info-can-change")
          .appendTo(outer)
          .on("click", () => {
            MT.revisitHere(() => {
              const vars = /** @type {Record<string, unknown>} */ (
                State.variables
              );
              vars[vname] = val0 + 1;
              State.variables.g_mutated = true;
            });
          });
      }
    }
    return outer;
  }

  // This doesn't work well with patience, need to fix something
  if (false && vtype === "number") {
    outer.addClass("var-info-number");
    $("<span class=var-info-vname>").text(vname).appendTo(label);
    label.append("=");
    $("<span class=var-info-value>").text(jval).appendTo(label);
    if (MT.trace.wasRead.has(vname)) {
      const val0 = +(v0[vname] || 0);
      $("<span>")
        .addClass("var-info-button-left var-info-can-change")
        .appendTo(outer)
        .on("click", () => {
          MT.revisitHere(() => {
            const vars = /** @type {Record<string, unknown>} */ (
              State.variables
            );
            vars[vname] = val0 - 1;
            State.variables.g_mutated = true;
          });
        });
      $("<span>")
        .addClass("var-info-button-right var-info-can-change")
        .appendTo(outer)
        .on("click", () => {
          MT.revisitHere(() => {
            const vars = /** @type {Record<string, unknown>} */ (
              State.variables
            );
            vars[vname] = val0 + 1;
            State.variables.g_mutated = true;
          });
        });
    }
    return outer;
  }

  if (vtype === "boolean") {
    outer.addClass("var-info-boolean-" + (V[vname] ? "true" : "false"));
    label.text(vname);
    if (MT.trace.wasRead.has(vname)) {
      outer.addClass("var-info-can-change");
      outer.on("click", () => {
        let val = !v0[vname];
        MT.revisitHere(() => {
          if (MT.mdKnown(vname)) {
            MT.mdSet(vname, val);
          } else {
            const vars = /** @type {Record<string, unknown>} */ (
              State.variables
            );
            vars[vname] = val;
          }
          State.variables.g_mutated = true;
        });
      });
    }
    return outer;
  }

  $("<span class=var-info-vname>").text(vname).appendTo(label);
  label.append("=");
  $("<span class=var-info-value>").text(jval).appendTo(label);
  outer.addClass("var-info-misc");
  return outer;
}

function initVarInfo() {
  if (!setup.playtest) return;

  $(document).on(":passagestart", () => {
    MT.traceStart();
  });

  $(document).on(":passageend", () => {
    MT.traceStop();

    // Save list of vars read to entry state (not active state)
    delete State.variables.g_varsRead;
    const read = Array.from(MT.trace.wasRead).sort();
    if (read.length) State.current.variables.g_varsRead = JSON.stringify(read);

    // Save whether current passage has branches
    delete State.current.variables.g_branchy;
    const branchy = $("#passages a[data-passage]").length > 1;
    if (branchy) State.current.variables.g_branchy = true;

    MT.trace.wasTopRead.forEach((vn) => {
      if (alwaysVars.has(vn) && !alwaysConditional.has(vn)) {
        const c = alwaysVars.get(vn);
        MT.warn(`vi-always ${vn} ${c}, but var was read`);
      }
      const exp = MT.varExpect(vn);
      if (exp != null) {
        MT.warn(`${vn} always ${exp} in this section, but var was read`);
      }
    });

    const notable = MT.allNotable();
    const to_do = notable.filter(
      (vn) =>
        !ignoreVars.has(vn) && !alwaysVars.has(vn) && !MT.trace.wasRead.has(vn)
    );
    if (to_do.length && !MT.isDraft()) {
      MT.warn(`non-draft passage has unused notable vars: ${to_do}`);
    }

    if (!setup.debug) return;

    const touched = new Set();
    MT.trace.wasRead.forEach((v) => touched.add(v));
    MT.trace.wasSet.forEach((v) => touched.add(v));
    MT.trace.wasDeleted.forEach((v) => touched.add(v));
    notable.forEach((f) => touched.add(f));

    $(".var-info").remove();
    const outer = $("<div class=var-info>");

    outer.prependTo("#sticky-head");

    let show = session.get("var-info-show");
    outer.toggleClass("var-info-hidden", !show);

    $(`<span class="var-info-label var-info-show">`)
      .text("var-info")
      .appendTo(outer)
      .click(() => {
        show = !show;
        session.set("var-info-show", show);
        outer.toggleClass("var-info-hidden", !show);
      });

    $("<span class=var-info-compute>[compute variants]</span>")
      .appendTo(outer)
      .click(() => MT.computeVariants());

    if (touched.size) {
      const el = $("<span class=var-info-touched>").appendTo(outer);
      [...touched].sort().forEach((v) => varButton(v).appendTo(el));
    }

    $("<span class=var-info-separator>").text("||").appendTo(outer);
    $(`<span class="var-info-passage var-info-show">`)
      .text(State.passage)
      .appendTo(outer);

    const sizes = MT.computeSizes();
    $(`<span class="var-info-separator var-info-show">`)
      .text("||")
      .appendTo(outer);
    $(`<span class="var-info-sizes var-info-show">`)
      .text(sizes)
      .attr(
        "title",
        "Storage size estimate in bytes\n" +
          "ss = sessionStorage (current tab)\n" +
          "ls = localStorage (shared by tabs)\n" +
          "md = SugarCube metadata (within localStorage)\n"
      )
      .appendTo(outer);

    if (to_do.length) outer.addClass("var-info-to-do");
  });
}

initVarInfo();
