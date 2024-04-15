/** @type {null | SugarCubeStoryVariables} */
let traceUnproxiedVars = null;
const traceBrand = Symbol("VarTraceBrand");

const traceNewContext = () => {
  return {
    withinInclude: false,
    wasDeleted: new Set(),
    wasRead: new Set(),
    wasSet: new Set(),
    wasTopRead: new Set(),
  };
};

MT.trace = traceNewContext();

Macro.add("var-trace-ignore", {
  tags: [],
  handler: function () {
    const body = this.payload[0]?.contents;
    MT.untraced(() => $(this.output).wiki(body || ""));
  },
});

const traceIncludeOriginal = Macro.get("include");
Macro.delete("include");
Macro.add("include", {
  handler: function () {
    const save = MT.trace.withinInclude;
    MT.trace.withinInclude = true;
    try {
      traceIncludeOriginal.handler.call(this);
    } finally {
      MT.trace.withinInclude = save;
    }
  },
});

/** Start tracing. */
MT.traceStart = () => {
  MT.traceStop();
  MT.trace = traceNewContext();
  traceUnproxiedVars = State.active.variables;
  State.active.variables = new Proxy(traceUnproxiedVars, {
    defineProperty(o, prop, desc) {
      if (typeof prop === "string") MT.trace.wasSet.add(prop);
      return Reflect.defineProperty(o, prop, desc);
    },
    deleteProperty(o, prop) {
      if (typeof prop === "string") MT.trace.wasDeleted.add(prop);
      return Reflect.deleteProperty(o, prop);
    },
    get(o, prop, recv) {
      if (prop === "_trace") return traceBrand;
      if (typeof prop === "string") {
        MT.trace.wasRead.add(prop);
        if (!MT.trace.withinInclude) MT.trace.wasTopRead.add(prop);
      }
      return Reflect.get(o, prop, recv);
    },
    set(o, prop, val, recv) {
      if (typeof prop === "string") MT.trace.wasSet.add(prop);
      return Reflect.set(o, prop, val, recv);
    },
  });
};

/** Stop tracing. */
MT.traceStop = () => {
  const brand = State.active.variables._trace;
  MT.assert(
    brand == null || brand === traceBrand,
    "Multiple instances of Trace in conflict."
  );
  if (traceUnproxiedVars != null) {
    State.active.variables = traceUnproxiedVars;
    traceUnproxiedVars = null;
  }
};

/**
 * Get vname's value without tracing it.
 * @type {(varName: string) => unknown} */
MT.untracedGet = (varName) => {
  const vars = /** @type {Record<string, unknown>} */ (
    traceUnproxiedVars || State.active.variables
  );
  return vars[varName];
};

/**
 * Returns all state vars, without tracing.
 * @type {() => SugarCubeStoryVariables}
 */
MT.untracedVars = () => {
  return traceUnproxiedVars || State.active.variables;
};

/**
 * Run block without tracing any variables during its execution.
 * @type {<T>(block: () => T) => T}
 */
MT.untraced = (block) => {
  if (traceUnproxiedVars == null) return block();
  const proxy = State.active.variables;
  const saveUnproxied = traceUnproxiedVars;
  try {
    State.active.variables = saveUnproxied;
    traceUnproxiedVars = null;
    return block();
  } finally {
    State.active.variables = proxy;
    traceUnproxiedVars = saveUnproxied;
  }
};
