/**
 * <<random-once seenVar>>
 * <<ro-choice>>
 *     text
 * <<ro-choice $condition>>
 *     text
 * <<ro-choice false>>
 *     placeholder for deleted choice, to avoid breaking saved games
 * <</random-once>>
 */
Macro.add("random-once", {
  tags: ["ro-choice"],
  handler: function () {
    /** @type {string} */
    const seenVar = this.args[0];

    /** @type {Set<number>} */
    const valid = new Set();

    for (let i = 1; i < this.payload.length; i++) {
      const cond = this.payload[i]?.args.full || "";
      if (cond === "" || eval(cond)) {
        valid.add(i);
      }
    }

    MT.assert(valid.size > 0, "random-once should have valid choices");

    const vars = /** @type {Record<string, string>} */ (State.variables);

    /** @type {number[]} */
    let seen = JSON.parse(vars[seenVar] || "[]");

    let avail = new Set(valid);
    seen.forEach((i) => avail.delete(i));

    if (avail.size === 0) {
      avail = new Set(valid);
      if (avail.size > 1 && seen.length > 0) {
        avail.delete(seen[seen.length - 1] || -1);
      }
      seen = [];
    }

    const choice = MT.pick(avail);
    seen.push(choice);
    vars[seenVar] = JSON.stringify(seen);

    $(this.output).wiki(this.payload[choice]?.contents || "");
  },
});
