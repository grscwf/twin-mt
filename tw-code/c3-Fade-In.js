/*
 * Sometimes a player will click with intent to skip, but fade-in will
 * happen almost at the same time, and the click will land after the
 * fade-in happens. This is annoying if the click lands on a link and
 * follows it. So we absorb clicks a small amount of time after
 * automatic fade-in.
 */
const fadeAbsorbMsec = 500;

/**
 * This description assumes you're using the default style.
 *
 * <<fade-in 1.5s [no-dots | no-pulse | click-anywhere]>>
 *    - Normally, a pulsing "..." appears here.
 *    - After 1.5 seconds, this section's text fades in.
 *    - Click on the "..." will skip the delay.
 *    - Links in this section are shown without delay, but blocked out with
 *      a gray rectangle.
 *    - Clicking on a blocked-out link will also skip the delay.
 *    - "no-dots" means don't show the dots.
 *    - "no-pulse" means show the dots, but don't pulse them.
 *    - "click-anywhere" means clicking anywhere will skip the delay.
 * <<fade-next 2s>>
 *    - After the first section has faded-in, the "..." appears here.
 *    - After another 2s, this section's text fades in.
 *    - There can be any number of "fade-next" sections.
 * <</fade-in>>
 */
Macro.add("fade-in", {
  tags: ["fade-next"],
  handler: function () {
    const opts = /** @type {string[]} */ (this.args.slice(1));

    const noDots = opts.includes("no-dots");
    const noPulse = opts.includes("no-pulse");
    const clickAnywhere = opts.includes("click-anywhere");

    /** @type {Array<[delay: number, span: JQuery<HTMLElement>]>} */
    const queue = [];

    /** @type {number | null} */
    let timeout = null;

    /** @type {(ev: MouseEvent) => void} */
    const skipAll = (ev) => {
      // note, this assumes passage only has one fade-in
      const absorb = $("#story .fade-in-absorb");
      if (absorb.length) {
        ev.stopPropagation();
        ev.preventDefault();
        return;
      }

      const hidden = $("#story .fade-in-hidden");
      if (!hidden.length) {
        MT.jqUnwrap($("#story")).removeEventListener("click", skipAll, true);
        return;
      }

      hidden.removeClass("fade-in-hidden fade-in-next");
      hidden.addClass("fade-in-absorb");
      setTimeout(() => {
        hidden.removeClass("fade-in-absorb");
        MT.jqUnwrap($("#story")).removeEventListener("click", skipAll, true);
      }, fadeAbsorbMsec);
      queue.length = 0;
    };

    if (clickAnywhere) {
      MT.jqUnwrap($("#story")).addEventListener("click", skipAll, true);
    }

    const next = () => {
      if (timeout != null) clearTimeout(timeout);
      if (queue.length === 0) return;
      MT.assert(queue[0] != null, "queue element should != null");
      const [delay, span] = queue[0];
      span.addClass("fade-in-next");
      timeout = setTimeout(() => {
        if (span.hasClass("fade-in-hidden")) {
          span.addClass("fade-in-absorb");
          setTimeout(() => span.removeClass("fade-in-absorb"), fadeAbsorbMsec);
        }
        span.removeClass("fade-in-hidden fade-in-next");
        if (queue[0] != null && queue[0][1] === span) {
          queue.shift();
          next();
        }
      }, delay);
    };

    /** @type {(jq: JQuery<HTMLElement>) => void}  */
    const skipTo = (jq) => {
      const pos = queue.findIndex((q) => q[1] === jq);
      if (pos < 0) return;
      for (let i = 0; i <= pos; i++) {
        if (queue[0] != null) {
          const span = queue[0][1];
          span.removeClass("fade-in-hidden fade-in-next");
        }
        queue.shift();
      }
      next();
    };

    const T = State.temporary;

    for (let i = 0; i < this.payload.length; i++) {
      const section = this.payload[i];
      MT.assert(section != null, "section should != null");

      let delay = Util.fromCssTime(section.args[0]);
      delay = Math.max(delay, Engine.minDomActionDelay);

      if (MT.roaming || T.isTranscript) {
        delay = 0;
      }

      const span = $("<span>")
        .addClass("fade-in fade-in-hidden")
        .toggleClass("fade-in-no-dots", noDots)
        .toggleClass("fade-in-no-pulse", noPulse)
        .wiki(section.contents)
        .appendTo(this.output);

      if (T.isTranscript) {
        if (i < this.payload.length - 1) {
          const br = span.find("br").get(-1);
          if (br != null) {
            $(br).replaceWith("<hr class=time-sep>");
          }
        }
      }

      /** @type {(ev: MouseEvent) => void} */
      const hurry = (ev) => {
        if (span.hasClass("fade-in-absorb")) {
          ev.preventDefault();
          ev.stopPropagation();
        } else if (span.hasClass("fade-in-hidden")) {
          ev.preventDefault();
          ev.stopPropagation();
          span.removeClass("fade-in-hidden fade-in-next");
          span.addClass("fade-in-absorb");
          setTimeout(() => {
            span.removeClass("fade-in-absorb");
            MT.jqUnwrap(span).removeEventListener("click", hurry, true);
          }, fadeAbsorbMsec);
          skipTo(span);
        } else {
          MT.jqUnwrap(span).removeEventListener("click", hurry, true);
        }
      };
      MT.jqUnwrap(span).addEventListener("click", hurry, true);
      queue.push([delay, span]);
    }

    setTimeout(next);
  },
});
