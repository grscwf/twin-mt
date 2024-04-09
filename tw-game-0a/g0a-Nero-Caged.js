(() => {
  const BORDER = 0;

  /** @typedef { { height: number, blocks: DocumentFragment[] } } SplitInfo */

  Template.add("iCock", `<a class="caged-cock caged-i-cock">cock</a>`);
  Template.add("nCock", `<a class="caged-cock caged-n-cock">cock</a>`);

  /**
   * <<nero-caged>>
   *   Text that's split into blocks.
   *   Within the text, ?iCock and ?nCock have special behavior.
   * <<nero-caged-fill [once]>>
   *   Text that's used to fill the last block.
   *   Will be repeated, unless "once".
   *   Can use randomness for variation.
   *   If omitted, fills with dots.
   * <</nero-caged>>
   */
  Macro.add("nero-caged", {
    tags: ["nero-caged-fill"],
    handler: function () {
      const [next] = this.args;
      let text = "";
      let fill = ". ";
      let once = false;
      for (const payload of this.payload) {
        switch (payload.name) {
          case "nero-caged":
            text = payload.contents.trim();
            break;
          case "nero-caged-fill":
            fill = payload.contents.trim();
            once = payload.args[0] === "once";
            break;
          default:
            throw new Error(`Unexpected nero-caged ${payload.name}`);
        }
      }

      const split = splitText(text, fill, once);

      if (State.temporary.isTranscript) {
        renderTranscript(this.output, split);
      } else {
        const link = next.isLink ? next.link : next;
        renderLive(this.output, split, link);
      }
    },
  });

  /**
   * Returns the HTMLElement from a JQuery handle.
   * Throws if the handle is not exactly one element.
   * @type { (jq: JQuery) => HTMLElement }
   */
  function jqUnwrap(jq) {
    if (jq.length !== 1) {
      console.log({ jq });
      throw new Error(`jqUnwrap got length !== 1`);
    }
    return /** @type { HTMLElement } */ (jq[0]);
  }

  /** @type { (out: DocumentFragment | HTMLElement, split: SplitInfo) => void } */
  function renderTranscript(out, split) {
    const last = State.variables.n_cagedBlock ?? split.blocks.length - 1;
    for (let i = 0; i < last + 1; i++) {
      if (i !== 0) {
        $("<br>").appendTo(out);
      }

      const grid = $(`<div class="caged-grid">`).appendTo(out);
      const cage = $(`<div class="caged-box caged-transcript">`).appendTo(grid);

      if (i === split.blocks.length - 1) {
        cage.addClass("caged-last");
      }

      const block = /** @type { DocumentFragment } */ (split.blocks[i]);
      cage.append($(block).contents());

      // unlink shocks on last line.
      cage.find("[data-shock].caged-optional").each((i, el) => {
        $(el).replaceWith($(el).contents());
      });

      const shocks = cage.find("[data-shock]");
      if (shocks.length) {
        let n = 0;
        shocks.each((i, el) => {
          if (el.dataset.shock != null) {
            n += +el.dataset.shock;
          }
        });
        shakeWords(cage, n);
      }

      cage.append("<a class=caged-continue>Continue</a>");

      if (split.height) {
        cage.attr("style", `height: ${split.height}px`);
      }
    }
  }

  /** @type { (out: DocumentFragment | HTMLElement, split: SplitInfo, next: string) => void } */
  function renderLive(out, split, next) {
    const grid = $(`<div class="caged-grid">`).appendTo(out);
    const box = $(`<div class="caged-box caged-fade-slow caged-fade-start">`);
    box.appendTo(grid);
    if (split.height) {
      box.attr("style", `height: ${split.height}px`);
    }

    /** @type { (i: number) => void } */
    const renderBlock = (i) => {
      box.toggleClass("caged-last", i === split.blocks.length - 1);
      box.empty();
      box.append(split.blocks[i] || "");

      // unlink shocks on last line (repeated in next block)
      box.find("[data-shock].caged-optional").each((i, el) => {
        $(el).replaceWith($(el).contents());
      });

      box.append("<a class=caged-continue>Continue</a>");
    };

    /* Note: current history state, not active state */
    const cur = State.current.variables;
    if (cur.n_cagedBlockTurn !== State.turns) {
      cur.n_cagedBlock = 0;
    }
    cur.n_cagedBlockTurn = State.turns;
    cur.n_cagedBlock ??= 0;

    renderBlock(cur.n_cagedBlock);

    if (cur.n_cagedBlock !== 0) {
      box.removeClass("caged-fade-slow");
      box.addClass("caged-fade-fast");
    }
    setTimeout(() => {
      box.removeClass("caged-fade-start");
    }, 300);

    const advance = () => {
      if (cur.n_cagedBlock == null) throw new Error("cagedBlock null?");
      if (cur.n_cagedBlock === split.blocks.length - 1) {
        Engine.play(next);
      } else {
        box.removeClass("caged-fade-fast caged-fade-slow");
        box.addClass("caged-fade-start");
        if (box.attr("data-shocked") != null) {
          // reset to 1, not 0
          box.attr("data-shocked", 1);
        }
        cur.n_cagedBlock++;
        renderBlock(cur.n_cagedBlock);
        setTimeout(() => {
          box.addClass("caged-fade-fast");
        }, 100);
        setTimeout(() => {
          box.removeClass("caged-fade-start");
        }, 200);
      }
    };

    box.on("click", (e) => {
      let t = $(e.target);
      // find an enclosing <a>
      while (t.length && t.prop("tagName") !== "A") {
        t = t.parent();
      }
      const shock = t.attr("data-shock");
      if (shock != null) {
        e.preventDefault();
        e.stopPropagation();
        const n = +shock;
        if (n > 0) {
          doShocks(n, box);
          t.attr("data-shock", "0");
        }
      } else if (t.hasClass("caged-cock")) {
        t.addClass("caged-touched");
      } else if (t.hasClass("caged-continue")) {
        const cocks = box.find(
          ".caged-cock:not(.caged-touched):not(.caged-optional)"
        );
        const shocks = box.find(`[data-shock]:not([data-shock="0"])`);
        if (cocks.length === 0 && shocks.length === 0) {
          e.preventDefault();
          e.stopPropagation();
          advance();
        } else {
          box.addClass("caged-flash");
          setTimeout(() => box.removeClass("caged-flash"), 500);
        }
      }
    });

    if (setup.debug) {
      const skip = $(
        `<div class=caged-skip>
          &#x1f527; <a>next block</a>
        </div>`
      );
      skip.find("a").on("click", () => {
        advance();
      });
      skip.appendTo(out);
    }
  }

  /** @type { (n: number, box: JQuery<HTMLElement>) => void} */

  function doShocks(n, box) {
    box.removeClass("caged-fade-fast caged-fade-slow");

    let shocked = +(box.attr("data-shocked") || "0");
    shockOn();

    function shockOn() {
      box.addClass("caged-shocking");
      n--;
      ++shocked;
      box.attr("data-shocked", shocked);
      shakeWords(box, shocked);
      setTimeout(shockOff, 100);
    }
    function shockOff() {
      box.removeClass("caged-shocking");
      if (n > 0) {
        // avoid flashing faster than 3Hz
        // https://www.w3.org/TR/WCAG21/#seizures-and-physical-reactions
        setTimeout(shockOn, 400);
      }
    }
  }

  /** @type { (box: JQuery<HTMLElement>, n: Number) => void } */
  function shakeWords(box, n) {
    const words = box.find(".caged-word");
    const f = Math.max(1, Math.min(1 + (n - 1) / 2, 3));
    words.each((_, el) => {
      const dx = Math.floor(f * 8 * Math.random()) / 4 - f;
      const dy = Math.floor(f * 8 * Math.random()) / 4 - f;
      const rot = Math.floor(f * 16 * Math.random()) / 4 - 2 * f;
      $(el).addClass("caged-shocked");
      $(el).attr(
        "style",
        `top: ${dx}px; left: ${dy}px; transform: rotate(${rot}deg)`
      );
    });
  }

  /**
   * Render mkp into a dom tree with words individually marked
   * with <span class=caged-word>
   * @type { (mkp: string) => HTMLElement }
   */
  function renderWithWordsMarked(mkp) {
    const span = document.createElement("span");
    $(span).wiki(mkp);

    /**
     * Returns the next element after el, in pre-order traversal
     * @type { (el: HTMLElement) => HTMLElement | null}
     */
    const next = (el) => {
      if (el.nextElementSibling) {
        return /** @type { HTMLElement } */ (el.nextElementSibling);
      } else if (el.parentElement) {
        return next(el.parentElement);
      } else {
        return null;
      }
    };

    /**
     * Append text to el, marking individual words with spans.
     * @type { (text: string, el: HTMLElement) => void }
     */
    const appendWords = (text, el) => {
      for (const part of text.split(/([ ]+)/)) {
        if (/[ ]/.test(part)) {
          $(el).append(part);
        } else if (part !== "") {
          $("<span class=caged-word>").text(part).appendTo(el);
        }
      }
    };

    /** @type { HTMLElement | null } */
    let el = span;
    while (el != null) {
      if (el.className === "caged-word") {
        el = next(el);
      } else {
        let kids = Array.from(el.childNodes);
        $(el).empty();
        for (const kid of kids) {
          if (kid.nodeType === Node.TEXT_NODE) {
            appendWords(kid.nodeValue || "", el);
          } else {
            el.appendChild(kid);
          }
        }
        el = /** @type { HTMLElement } */ (el.firstElementChild) || next(el);
      }
    }
    return span;
  }

  /**
   * Split text into segments that fit in caged-box.
   * @type { (text: string, fill: string, once: boolean ) => SplitInfo }
   */
  function splitText(text, fill, once) {
    if (text.trim() === "") {
      return { height: 0, blocks: [] };
    }
    let rendered = renderWithWordsMarked(text);

    const outer = $(`<div class="passage caged-hidden">`);
    $("#passages").addClass("caged-render").prepend(outer);

    const inner = $(`<div class="caged-box caged-hidden">`);
    inner.appendTo(outer);
    inner.append($(rendered).contents());

    /** @type { DocumentFragment[] } */
    const blocks = [];
    let height = 0;
    try {
      const box = jqUnwrap(inner).getBoundingClientRect();
      if (box.width === 0) {
        MT.diag("failed to render in splitText");
        const block = document.createDocumentFragment();
        $(rendered).contents().appendTo(block);
        return { height, blocks: [block] };
      }

      let lineStart = 0;
      let prevWordLeft = 0;
      let usedFill = false;
      let words = inner.find(".caged-word");
      let current = 0;

      for (;;) {
        // if we ran out of words, add more words from fill
        if (current >= words.length && (!usedFill || !once)) {
          usedFill = true;
          inner.append(" ");
          const renderedFill = renderWithWordsMarked(fill);
          inner.append($(renderedFill).clone().contents());
          words = inner.find(".caged-word");
        }

        // if we still don't have words, we're done
        if (current >= words.length) {
          const block = document.createDocumentFragment();
          inner.contents().appendTo(block);
          blocks.push(block);
          break;
        }

        // get position of current word
        const word = /** @type { HTMLSpanElement } */ (words[current]);
        const rect = word.getBoundingClientRect();

        // if the box isn't full yet, go to the next word
        if (rect.bottom <= box.bottom - BORDER) {
          // did we start a new line?
          if (rect.left < prevWordLeft) {
            lineStart = current;
            word.className += " caged-split";
          }
          prevWordLeft = rect.left;
          current++;
          continue;
        }

        // Get the precise height of the full box
        const lineStartWord = /** @type { HTMLElement } */ (words[lineStart]);
        const lineStartRect = lineStartWord.getBoundingClientRect();
        if (height === 0) {
          height = lineStartRect.bottom - box.top;
        }

        // Mark links on last line as optional
        for (let j = lineStart; j < current; j++) {
          const word = /** @type { HTMLElement } */ (words[j]);
          const parent = word.parentElement;
          if (parent != null && parent.tagName === "A") {
            parent.className += " caged-optional";
          }
        }

        const range = document.createRange();

        const first = /** @type { Node } */ (jqUnwrap(inner).firstChild);
        range.setStartBefore(first);

        /** @type { Node } */
        let end = word;
        while (end.parentNode?.firstChild === end) {
          end = end.parentNode;
        }
        range.setEndBefore(end);

        const block = range.cloneContents();
        blocks.push(block);

        if (usedFill) {
          break;
        }

        // Cut before the last line
        range.setEndBefore(lineStartWord);

        // Try to find out exactly where the word break is
        const chars = Array.from(lineStartWord.textContent || "").map((c) =>
          jqUnwrap($("<span>").text(c))
        );
        $(lineStartWord).empty().append(chars);
        for (const ch of chars) {
          const rect = ch.getBoundingClientRect();
          if (rect.left === lineStartRect.left) {
            range.setEndBefore(ch);
            break;
          }
        }

        range.deleteContents();
        inner.find(".caged-optional").removeClass("caged-optional");

        lineStart = 0;
        prevWordLeft = 0;
        words = inner.find(".caged-word");
        current = 0;
      }
    } finally {
      $("#passages").removeClass("caged-render");
      outer.remove();
    }

    return { height, blocks };
  }
})();
