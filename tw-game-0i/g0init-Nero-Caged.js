(() => {
  const BORDER = 0;

  // @ts-expect-error real_stringify
  const repr = JSON._real_stringify || JSON.stringify;

  /** @typedef { { height: number, blocks: string[] } } SplitInfo */

  Macro.add("nero-caged", {
    tags: ["nero-caged-fill"],
    handler: function () {
      const [next] = this.args;

      let body = this.payload[0]?.contents ?? "";
      body = body.replace(/[?]P/g, " ");

      let fill = this.payload[1]?.contents ?? "";
      fill = fill.replace(/[?]P/g, " ");

      const split = splitText(body, fill);

      if (State.temporary.isTranscript) {
        renderTranscript(this.output, split);
      } else {
        renderLive(this.output, split, next.isLink ? next.link : next);
      }
    },
  });

  /** @type { (out: DocumentFragment | HTMLElement, split: SplitInfo) => void } */
  function renderTranscript(out, split) {
    const last = State.variables.n_cagedBlock ?? split.blocks.length - 1;
    for (let i = 0; i < last + 1; i++) {
      if (i !== 0) {
        $("<br>").appendTo(out);
      }

      let block = /** @type { string } */ (split.blocks[i]);
      block = encloseCock(block);
      block += "<a class=caged-continue>Continue</a>";

      const cage = $("<div class='caged-box caged-transcript'>");
      cage.html(block).appendTo(out);

      if (split.height) {
        /** @type { HTMLElement } */
        (cage[0]).style.height = split.height + "px";
      }
    }
  }

  /** @type { (out: DocumentFragment | HTMLElement, split: SplitInfo, next: string) => void } */
  function renderLive(out, split, next) {
    const outer = $("<div class=caged-box>");
    outer.appendTo(out);

    if (split.height) {
      /** @type { HTMLElement } */
      (outer[0]).style.height = split.height + "px";
    }

    /** @type { (i: number) => void } */
    const render = (i) => {
      outer.empty();
      let text = split.blocks[i];
      if (text == null) throw new Error(`bug? ${i}`);
      text = encloseCock(text);
      const cont = document.createElement("a");
      cont.innerText = "Continue";
      cont.className = "caged-continue";
      outer.html(text);
      outer.append(cont);
    };

    /* Note: current history state, not active state */
    const curState = State.current.variables;
    curState.n_cagedBlock = 0;
    render(curState.n_cagedBlock);

    outer.on("click", (e) => {
      const t = $(e.target);
      if (t.hasClass("caged-cock")) {
        t.addClass("caged-blocked");
      } else if (t.hasClass("caged-continue")) {
        const open = outer.find(".caged-cock:not(.caged-blocked)");
        if (open.length) {
          outer.addClass("caged-flash");
          setTimeout(() => outer.removeClass("caged-flash"), 500);
        } else if (curState.n_cagedBlock == split.blocks.length - 1) {
          Engine.play(next);
        } else {
          outer.removeClass("caged-fade-in-2");
          outer.addClass("caged-fade-in-1");
          curState.n_cagedBlock++;
          render(curState.n_cagedBlock);
          setTimeout(() => outer.addClass("caged-fade-in-2"), 100);
          setTimeout(() => outer.removeClass("caged-fade-in-1"), 200);
        }
      }
    });
  }

  /** @type { (text: string) => string } */
  function encloseCock(text) {
    return text.replace(/\bcock\b/g, `<a class=caged-cock>cock</a>`);
  }

  /**
   * Split text into segments that fit in caged-box.
   * @type { (text: string, fill: string) => SplitInfo }
   */
  function splitText(text, fill) {
    const textWords = text.trim().split(/\s+/);
    const fillWords = fill.trim().split(/\s+/);
    const words = textWords.concat(fillWords);

    /** @type { HTMLSpanElement[] } */
    const spans = [];
    for (const word of words) {
      const span = document.createElement("span");
      if (/^<em>[^<\s]*<[/]em>\S?$/.test(word)) {
        span.innerHTML = word + " ";
        spans.push(span);
      } else if (/^</.test(word)) {
        MT.diag(`unexpected < in nero-caged ${repr(word)}`);
      } else if (/\bcock\b/.test(word)) {
        span.innerHTML = encloseCock(word) + " ";
        spans.push(span);
      } else {
        span.innerText = word + " ";
        spans.push(span);
      }
    }

    const inner = document.createElement("div");
    inner.className = "caged-box caged-hidden";
    const outer = $("<div class='passage caged-hidden'>");
    outer.append(inner);

    let height = 0;

    $("#passages").addClass("caged-render").prepend(outer);

    /** @type { string[] } */
    const blocks = [];
    try {
      const box = inner.getBoundingClientRect();
      if (box.width === 0) {
        MT.diag("failed to render in splitText");
        return { height, blocks: [text] };
      }

      let lastLine = 0;
      let prevLeft = 0;
      let blockStart = 0;
      let i = 0;
      for (; i < spans.length; i++) {
        const span = /** @type { HTMLSpanElement } */ (spans[i]);
        inner.append(span);
        const rect = span.getBoundingClientRect();
        if (rect.bottom > box.bottom - BORDER) {
          if (height === 0) {
            const bot = /** @type { HTMLSpanElement} */ (spans[lastLine]);
            const bRect = bot.getBoundingClientRect();
            height = bRect.bottom - box.top;
          }
          const block = words.slice(blockStart, i);
          blocks.push(block.join(" "));
          if (blockStart === lastLine) {
            throw new Error(`splitText failed to make progress?`);
          }
          for (let j = blockStart; j < lastLine; j++) {
            const first = /** @type { Element } */ (inner.children[0]);
            first.remove();
          }
          blockStart = lastLine;

          // If we're past the main text, stop rendering in middle filler
          if (i >= textWords.length) break;

        } else if (rect.left < prevLeft) {
          lastLine = i;
        }
        prevLeft = rect.left;
      }

      // If we didn't exit early, the last block doesn't fill the box.
      // Emit it anyway.
      if (i === spans.length) {
        const block = words.slice(blockStart);
        blocks.push(block.join(" "));
      }
    } finally {
      $("#passages").removeClass("caged-render");
      outer.remove();
    }

    return { height, blocks };
  }

  MT.splitText = splitText;
})();
