(() => {
  /**
   * Returns the HTMLElement from a JQuery handle.
   * Throws if the handle is not exactly one element.
   * @type { (jq: JQuery) => HTMLElement }
   */
  MT.jqUnwrap = (jq) => {
    if (jq.length !== 1) {
      throw new Error(`tried to jqUnwrap length !== 1`);
    }
    const el = jq[0];
    if (!(el instanceof HTMLElement)) {
      throw new Error(`tried to jqUnwrap a non HTMLElement`);
    }
    return el;
  };
})();
