(() => {
  const CAGED_BORDER = 0;

  /**
   * @typedef {object} SplitInfo
   * @prop {number} height
   * @prop {DocumentFragment[]} blocks
   * @prop {Array<string | undefined>} classes
   */

  Template.add("iCock", `<a class="caged-cock caged-i-cock">cock</a>`);
  Template.add("nCock", `<a class="caged-cock caged-n-cock">cock</a>`);
  Template.add("nCum", "<caged-cum>cum</caged-cum>");
  Template.add("nCumCap", "<caged-cum>Cum</caged-cum>");

  /**
   * <<nero-caged $next [slow]>>
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
      const next = /** @type {SugarCubeLink | string} */ (this.args[0]);
      const slow = this.args[1] === "slow";
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
            MT.fail(`Unexpected nero-caged ${payload.name}`, this);
        }
      }

      const split = splitText(text, fill, once);

      if (State.temporary.isTranscript) {
        renderTranscript(this.output, split);
      } else {
        const link = typeof next === "string" ? next : next.link;
        MT.nonNull(link, "nero-caged link");
        renderLive(this.output, split, link, slow);
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

      const grid = $(`<div class="caged-grid">`).appendTo(out);
      const cage = $(`<div class="caged-box caged-transcript">`).appendTo(grid);

      if (i === split.blocks.length - 1) {
        cage.addClass("caged-last");
      }

      const block = /** @type { DocumentFragment } */ (split.blocks[i]);
      cage.append($(block).contents());

      const classes = split.classes[i];
      if (classes != null) {
        cage.addClass(classes);
      }

      // const shocks = cage.find("[data-shock]");
      // if (shocks.length) {
      //   let n = 0;
      //   shocks.each((i, el) => {
      //     if (el.dataset.shock != null) {
      //       n += +el.dataset.shock;
      //     }
      //   });
      //   shakeWords(cage, n);
      // }

      cage.append("<a class=caged-continue>Continue</a>");

      if (split.height) {
        cage.attr("style", `height: ${split.height}px`);
      }
    }
  }

  /**
   * @arg {DocumentFragment | HTMLElement} out
   * @arg {SplitInfo} split
   * @arg {string} next
   * @arg {boolean} slow
   * @returns {void}
   */
  function renderLive(out, split, next, slow) {
    const grid = $(`<div class="caged-grid">`).appendTo(out);
    const box = $(`<div class="caged-box caged-fade-start">`);
    box.appendTo(grid);
    if (split.height) {
      box.attr("style", `height: ${split.height}px`);
    }

    /** @type { (i: number) => void } */
    const renderBlock = (i) => {
      box.toggleClass("caged-last", i === split.blocks.length - 1);
      box.empty();
      const block = split.blocks[i];
      if (block != null) {
        $(block).clone().appendTo(box);

        const classes = split.classes[i];
        if (classes != null) {
          box.addClass(classes);
        }
      }

      box.append("<a class=caged-continue>Continue</a>");

      MT.scrollSavePos();
    };

    /* Note: current history state, not active state */
    const cur = State.current.variables;
    if (cur.n_cagedBlockTurn !== State.turns) {
      cur.n_cagedBlock = 0;
    }
    cur.n_cagedBlockTurn = State.turns;
    cur.n_cagedBlock ??= 0;

    if (cur.n_cagedBlock >= split.blocks.length) {
      cur.n_cagedBlock = split.blocks.length - 1;
    }

    renderBlock(cur.n_cagedBlock);

    box.addClass(
      slow && cur.n_cagedBlock === 0 ? "caged-fade-slow" : "caged-fade-fast"
    );

    setTimeout(() => {
      box.removeClass("caged-fade-start");
      setTimeout(() => box.removeClass("caged-fade-fast"), 1000);
      setTimeout(() => box.removeClass("caged-fade-slow"), 3000);
    }, 300);

    const goPrev = () => {
      if (cur.n_cagedBlock == null || cur.n_cagedBlock === 0) {
        Engine.backward();
      } else {
        box.removeClass("caged-fade-fast caged-fade-slow");
        box.addClass("caged-fade-start");
        if (box.attr("data-shocked") != null) {
          // reset to 1, not 0
          box.attr("data-shocked", 1);
        }
        cur.n_cagedBlock--;
        renderBlock(cur.n_cagedBlock);
        setTimeout(() => box.addClass("caged-fade-fast"), 100);
        setTimeout(() => {
          box.removeClass("caged-fade-start");
          setTimeout(() => box.removeClass("caged-fade-fast"), 1000);
        }, 200);
      }
    };

    const goNext = () => {
      MT.nonNull(cur.n_cagedBlock, "cagedBlock");
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
        setTimeout(() => box.addClass("caged-fade-fast"), 100);
        setTimeout(() => {
          box.removeClass("caged-fade-start");
          setTimeout(() => box.removeClass("caged-fade-fast"), 1000);
        }, 200);
      }
    };

    box.on("click", (e) => {
      let t = $(e.target);
      // find an enclosing <a> or <caged-cum>
      while (t.length && !["A", "CAGED-CUM"].includes(t.prop("tagName"))) {
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
      } else if (t.hasClass("caged-cum-active")) {
        t.addClass("caged-touched");
      } else if (t.hasClass("caged-continue")) {
        const cocks = box.find(
          ".caged-cock:not(.caged-touched):not(.caged-optional)"
        );
        const shocks = box.find(
          `[data-shock]:not([data-shock="0"]):not(.caged-optional)`
        );
        const cum = box.find(
          `.caged-cum-active:not(.caged-touched):not(.caged-optional)`
        );
        if (cocks.length === 0 && shocks.length === 0 && cum.length === 0) {
          e.preventDefault();
          e.stopPropagation();
          goNext();
        } else {
          box.addClass("caged-flash");
          setTimeout(() => box.removeClass("caged-flash"), 500);
        }
      }
    });

    if (setup.debug) {
      const skip = $(
        `<div class=caged-skip>
          <a id="caged-prev">prev block</a>
          &#x1f527;
          <a id="caged-next">next block</a>
        </div>
        <`
      );
      skip.find("a#caged-prev").on("click", () => {
        goPrev();
      });
      skip.find("a#caged-next").on("click", () => {
        goNext();
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
      return { height: 0, blocks: [], classes: [] };
    }
    let rendered = renderWithWordsMarked(text);

    const outer = $(`<div class="passage caged-hidden">`);
    $("#passages").addClass("caged-render").prepend(outer);

    const inner = $(`<div class="caged-box caged-hidden">`);
    inner.appendTo(outer);
    inner.append($(rendered).contents());

    /** @type {DocumentFragment[]} */
    const blocks = [];
    let height = 0;
    try {
      const box = MT.jqUnwrap(inner).getBoundingClientRect();
      if (box.width === 0) {
        MT.warn("Failed to render in splitText.");
        const block = document.createDocumentFragment();
        $(rendered).contents().appendTo(block);
        return { height, blocks: [block], classes: [] };
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
        if (rect.bottom <= box.bottom - CAGED_BORDER) {
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
          if (parent != null && ["A", "CAGED-CUM"].includes(parent.tagName)) {
            parent.className += " caged-optional";
          }
        }

        const range = document.createRange();

        const first = /** @type { Node } */ (MT.jqUnwrap(inner).firstChild);
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
          MT.jqUnwrap($("<span>").text(c))
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

    /** @type {Array<string | undefined>} */
    const classes = [];
    let cumActive = false;
    blocks.forEach((block, i) => {
      if (cumActive || $(block).find("caged-cum-start").length) {
        cumActive = true;
        $(block).find("caged-cum").addClass("caged-cum-active");
      }
      if ($(block).find("caged-cum-stop").length) {
        // next block
        cumActive = false;
      }
    });

    return { height, blocks, classes };
  }
})();
