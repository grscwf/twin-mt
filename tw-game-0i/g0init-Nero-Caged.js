(() => {
  const BORDER = 0;

  // @ts-expect-error real_stringify
  const repr = JSON._real_stringify || JSON.stringify;

  /** @typedef { { height: number, blocks: string[] } } SplitInfo */

  /**
   * <<nero-caged>>
   *   Text that's split into blocks.
   *   - Cannot use SugarCube <<macros>> or ?templates.
   *   - Can use simple html elements around single words like <em>word</em>.
   *   - Cannot use html elements with attributes.
   *   - Cannot use html elements around multiple words.
   *   Some special words:
   *   - plain "cock" is Nero's cock.
   *   - "@ivexCock" is Ivex's cock.
   *   - "@barbed" is either "barbed" or "smooth".
   *
   * <<nero-caged-fill>>
   *   Text used to fill the last block, which can be cut off.
   * <</nero-caged>>
   */
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
    const outer = $(`<div class="caged-box caged-fade-slow caged-fade-start">`);
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

      outer.html(text);

      const cont = document.createElement("a");
      cont.innerText = "Continue";
      cont.className = "caged-continue";
      outer.append(cont);
    };

    /* Note: current history state, not active state */
    const cur = State.current.variables;
    if (cur.n_cagedBlockTurn !== State.turns) {
      cur.n_cagedBlock = 0;
    }
    cur.n_cagedBlockTurn = State.turns;
    cur.n_cagedBlock ??= 0;
    render(cur.n_cagedBlock);
    if (cur.n_cagedBlock !== 0) {
      outer.removeClass("caged-fade-slow");
    }
    setTimeout(() => outer.removeClass("caged-fade-start"), 300);

    const advance = () => {
      if (cur.n_cagedBlock == split.blocks.length - 1) {
        Engine.play(next);
      } else {
        outer.removeClass("caged-fade-fast");
        outer.removeClass("caged-fade-slow");
        outer.addClass("caged-fade-start");
        cur.n_cagedBlock++;
        render(cur.n_cagedBlock);
        setTimeout(() => outer.addClass("caged-fade-fast"), 100);
        setTimeout(() => outer.removeClass("caged-fade-start"), 200);
      }
    };

    outer.on("click", (e) => {
      const t = $(e.target);
      if (t.hasClass("caged-cock")) {
        t.addClass("caged-touched");
      } else if (t.hasClass("caged-continue")) {
        const open = outer.find(
          ".caged-cock:not(.caged-touched):not(.caged-optional)"
        );
        if (open.length === 0 || (setup.debug && e.shiftKey)) {
          advance();
        } else {
          outer.addClass("caged-flash");
          setTimeout(() => outer.removeClass("caged-flash"), 500);
        }
      }
    });

    if (setup.debug) {
      const skip = $("<div class=caged-skip>");
      skip.html("&#x1f527; shift-click to skip the cock block");
      skip.appendTo(out);
    }
  }

  /**
   * Split text into segments that fit in caged-box.
   * @type { (text: string, fill: string) => SplitInfo }
   */
  function splitText(text, fill) {
    const textWords = text.trim().split(/\s+/);
    const fillWords = fill.trim().split(/\s+/);
    const words = textWords.concat(fillWords);

    for (let i = 0; i < words.length; i++) {
      const word = /** @type { string } */ (words[i]);
      if (/\bcock\b/.test(word)) {
        words[i] = word.replace(/\bcock\b/, `<a class=caged-cock>cock</a>`);
        continue;
      }

      {
        const m = /@(\w+)/.exec(word);
        if (m) {
          let replace = word;
          switch (m[1]) {
            case "ivexCock":
              replace = `<a class="caged-cock caged-ivex-cock">cock</a>`;
              break;
            case "barbed":
              replace = State.variables.n_barbs ? "barbed" : "smooth";
              break;
            default:
              MT.diag(`Unexpected ${word} in nero-caged`);
              break;
          }
          words[i] =
            word.slice(0, m.index) +
            replace +
            word.slice(m.index + m[0].length);
          continue;
        }
      }

      if (/^<[^>]*$/.test(word)) {
        // probably an html element with an attr that we split at space.
        MT.diag(`unexpected < in nero-caged ${repr(word)}`);
        continue;
      }
      if (/^[^<]*<[/]/.test(word)) {
        // probably an html element around multiple words that we split
        MT.diag(`unexpected </ in nero-caged ${repr(word)}`);
        continue;
      }

      {
        const m = /(@|<<|^[?])/.exec(word);
        if (m) {
          MT.diag(`unexpected ${repr(m[1])} in nero-caged ${repr(word)}`);
          continue;
        }
      }
    }

    /** @type { HTMLSpanElement[] } */
    const spans = [];
    for (const word of words) {
      const span = document.createElement("span");
      span.innerHTML = word + " ";
      spans.push(span);
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
          // Get the precise height of a full box
          if (height === 0) {
            const bot = /** @type { HTMLSpanElement} */ (spans[lastLine]);
            const bRect = bot.getBoundingClientRect();
            height = bRect.bottom - box.top;
          }
          // If there's any cock in the last line, mark it as optional,
          // since it might be overlapped by "Continue"
          for (let j = lastLine; j < i; j++) {
            const word = /** @type { string } */ (words[j]);
            if (word.includes("caged-cock")) {
              words[j] = word.replace(
                /=caged-cock/,
                `="caged-cock caged-optional"`
              );
            }
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

    console.log(blocks);
    return { height, blocks };
  }

  MT.splitText = splitText;
})();
