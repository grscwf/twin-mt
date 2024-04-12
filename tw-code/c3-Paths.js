/*
 * This module is about traversable paths.
 *
 * A choice point is a moment where a significant choice is available.
 * - The label describes the choice taken by the next step.
 * - In GOTO, selecting a choice label will traverse past that moment,
 *   to the next choice.
 * - If the choice also causes a significant status change,
 *   the label can be "choice + status"
 */

/**
 * @typedef {object} PathStep
 * @prop {string} [t] passage title
 * @prop {string} [code] mta/mtl code of the link into this passage
 * @prop {string} [choice] choice point label
 */

const pathIgnore = ["g1a Title Screen", "g1a Bound"];

/** Returns a full path of the current play session. */
MT.getPath = () => {
  const path = [];
  const hist = MT.getHistory();
  for (let i = 0, n = hist.length; i < n; i++) {
    const moment = hist[i];
    if (moment == null) continue;
    const title = moment.title || "";
    if (pathIgnore.includes(title)) continue;
    /** @type {PathStep} */
    const step = { t: title };

    let code = moment.variables.g_mtaCode;
    const turn = moment.variables.g_mtaCodeTurn;
    if (code != null && turn === i) {
      code = code.replace(/\s*[/][/](avoid|prefer)/, "");
      if (code !== "") {
        step.code = code;
      }
    }
    path.push(step);
  }
  return path;
};

/**
 * Finds the common prefix of P and Q.
 * Returns [PN, QN], which is the length of the common prefix in P and Q.
 *
 * This does not check against the actual storygraph. If P has a forced
 * step S that isn't in Q, it's assumed that Q can also have S.
 *
 * @type {(p: PathStep[], q: PathStep[]) => [number, number]}
 */
MT.commonPathLengths = (p, q) => {
  let pi = 0;
  let qi = 0;
  while (pi < p.length && qi < q.length) {
    const ps = p[pi];
    const qs = q[qi];
    MT.assert(ps != null, "");
    MT.assert(qs != null, "");
    if (ps.t == null) {
      pi++;
    } else if (qs.t == null) {
      qi++;
    } else {
      if (ps.t !== qs.t) break;
      if (ps.code !== qs.code) break;
      pi++, qi++;
    }
  }
  return [pi, qi];
};

const json = JSON._real_stringify || JSON.stringify;

/**
 * Returns a pretty string that's js for path.
 * 
 * @type {(path: PathStep[]) => string}
 */
MT.pathToJs = (path) => {
  let str = "[\n";
  for (const step of path) {
    str += "  {";
    str += ` t: ${json(step.t)}`;
    if (step.code != null) str += `, code: ${json(step.code)}`;
    str += " },\n";
  }
  str += "],\n";
  return str;
};

/**
 * @type {(path: PathStep[]) => string}
 */
MT.pathName = (path) => {
  const labels = path
    .filter((st) => st != null && st.choice != null)
    .map((st) => st.choice);
  if (labels.length) {
    return "> " + labels.join(" > ");
  }
  const titles = path.filter((st) => st.t != null).map((st) => st.t);
  return "> " + titles.join(" > ");
};
