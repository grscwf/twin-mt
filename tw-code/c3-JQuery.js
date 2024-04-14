/**
 * Returns the HTMLElement from a JQuery handle.
 * Throws if the handle is not exactly one element.
 * @type { (jq: JQuery) => HTMLElement }
 */
MT.jqUnwrap = (jq) => {
  MT.assert(jq.length === 1, "jqUnwrap should get single element");
  const el = jq[0];
  MT.assert(el instanceof HTMLElement, "jqUnwrap should get HTMLElement");
  return el;
};
