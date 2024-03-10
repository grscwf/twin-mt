(() => {
  const BORDER = 0;

  // @ts-expect-error real_stringify
  const repr = JSON._real_stringify || JSON.stringify;

  /** @typedef { { height: number, blocks: DocumentFragment[] } } SplitInfo */

  Template.add("iCock", `<a class="caged-cock caged-i-cock">cock</a>`);
  Template.add("nCock", `<a class="caged-cock caged-n-cock">cock</a>`);

  /**
   * <<nero-caged>>
   *   Text that's split into blocks.
   *   Within the text, ?iCock and ?nCock have special behavior.
   * <<nero-caged-fill>>
   *   Text that's repeated to fill the last block.
   *   Can use randomness for variation.
   *   If omitted, fills with dots.
   * <<nero-caged-2 [wait]>>
   *   Text shown in bg box. "wait" means don't show until click.
   * <<nero-caged-2-fill>>
   *   Text repeated to fill bg box.
   * <</nero-caged>>
   */
  Macro.add("nero-caged", {
    tags: ["nero-caged-fill", "nero-caged-2", "nero-caged-2-fill"],
    handler: function () {
      const [next] = this.args;

      let cage = "";
      let fill = ". ";
      let cage2 = "";
      let fill2 = ". ";
      let wait = false;

      for (const payload of this.payload) {
        switch (payload.name) {
          case "nero-caged":
            cage = payload.contents.trim();
            break;
          case "nero-caged-fill":
            fill = payload.contents.trim();
            break;
          case "nero-caged-2":
            cage2 = payload.contents.trim();
            wait = payload.args[0] === "wait";
            break;
          case "nero-caged-2-fill":
            fill2 = payload.contents.trim();
            break;
          default:
            throw new Error(`Unexpected nero-caged ${payload.name}`);
        }
      }

      const split = splitText("caged-box", cage, fill, false);
      const split2 = splitText("caged-box2", cage2, fill2, true);

      if (State.temporary.isTranscript) {
        renderTranscript(this.output, split, split2, wait);
      } else {
        const link = next.isLink ? next.link : next;
        renderLive(this.output, split, link, split2, wait);
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

  /** @type { (out: DocumentFragment | HTMLElement, split: SplitInfo, split2: SplitInfo, wait: boolean) => void } */
  function renderTranscript(out, split, split2, wait) {
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
      cage.append("<a class=caged-continue>Continue</a>");

      if (split.height) {
        cage.attr("style", `height: ${split.height}px`);
      }

      if (i < split2.blocks.length) {
        const cage2 = $(`<div class="caged-box2 caged-transcript">`);
        cage2.appendTo(grid);
        const block2 = /** @type { DocumentFragment } */ (split2.blocks[i]);
        cage2.append($(block2).contents());
        if (split2.height) {
          cage2.attr("style", `height: ${split2.height}px`);
        }
      }
    }
  }

  /** @type { (out: DocumentFragment | HTMLElement, split: SplitInfo, next: string, split2: SplitInfo, wait: boolean) => void } */
  function renderLive(out, split, next, split2, wait) {
    const grid = $(`<div class="caged-grid">`).appendTo(out);
    const box = $(`<div class="caged-box caged-fade-slow caged-fade-start">`);
    box.appendTo(grid);
    if (split.height) {
      box.attr("style", `height: ${split.height}px`);
    }

    const box2 = $(`<div class="caged-box2 caged-fade-slow caged-fade-start">`);
    box2.appendTo(grid);
    if (split2.height) {
      box2.attr("style", `height: ${split2.height}px`);
    }

    /** @type { (i: number) => void } */
    const renderBlock = (i) => {
      box.toggleClass("caged-last", i === split.blocks.length - 1);
      box.empty();
      box.append(split.blocks[i] || "");
      box.append("<a class=caged-continue>Continue</a>");

      box2.empty();
      if (i < split2.blocks.length) {
        box2.append(split2.blocks[i] || "");
        box2.toggleClass("caged-last", i === split2.blocks.length - 1);
      }
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
      box2.removeClass("caged-fade-slow");
    }
    setTimeout(() => {
      box.removeClass("caged-fade-start");
      box2.removeClass("caged-fade-start");
    }, 300);

    const advance = () => {
      if (cur.n_cagedBlock == null) throw new Error("cagedBlock null?");
      if (cur.n_cagedBlock === split.blocks.length - 1) {
        Engine.play(next);
      } else {
        box.removeClass("caged-fade-fast caged-fade-slow");
        box.addClass("caged-fade-start");
        box2.removeClass("caged-fade-fast caged-fade-slow");
        box2.addClass("caged-fade-start");
        cur.n_cagedBlock++;
        renderBlock(cur.n_cagedBlock);
        setTimeout(() => {
          box.addClass("caged-fade-fast");
          box2.addClass("caged-fade-fast");
        }, 100);
        setTimeout(() => {
          box.removeClass("caged-fade-start");
          box2.removeClass("caged-fade-start");
        }, 200);
      }
    };

    box.on("click", (e) => {
      let t = $(e.target);
      // go up to an <a>
      while (t.length && t.prop("tagName") !== "A") {
        t = t.parent();
      }
      if (t.hasClass("caged-cock")) {
        t.addClass("caged-touched");
      } else if (t.hasClass("caged-continue")) {
        const open = box.find(
          ".caged-cock:not(.caged-touched):not(.caged-optional)"
        );
        if (open.length === 0 || (setup.debug && e.ctrlKey)) {
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
      const skip = $("<div class=caged-skip>");
      skip.html("&#x1f527; ctrl-click to skip the cock block");
      skip.appendTo(out);
    }
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
      for (const part of text.split(/(\s+)/)) {
        if (/\s/.test(part)) {
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
   * @type { (tag: string, text: string, fill: string, second: boolean) => SplitInfo }
   */
  function splitText(tag, text, fill, second) {
    if (text.trim() === "") {
      return { height: 0, blocks: [] };
    }
    let rendered = renderWithWordsMarked(text);

    const outer = $(`<div class="passage caged-hidden">`);
    $("#passages").addClass("caged-render").prepend(outer);

    const inner = $(`<div class="${tag} caged-hidden">`);
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

      let prevLine = 0;
      let prevLeft = 0;
      let filling = false;
      let spans = inner.find(".caged-word");
      let i = 0;
      for (;;) {
        if (i >= spans.length) {
          filling = true;
          inner.append(" ");
          let renderedFill = renderWithWordsMarked(fill);
          inner.append($(renderedFill).clone().contents());
          spans = inner.find(".caged-word");
          if (i >= spans.length) {
            MT.diag(`nero-caged failed to add more fill`);
            const block = document.createDocumentFragment();
            inner.contents().appendTo(block);
            blocks.push(block);
            break;
          }
          continue;
        }

        const span = /** @type { HTMLSpanElement } */ (spans[i]);
        const rect = span.getBoundingClientRect();

        // if the box isn't full yet
        if (rect.bottom <= box.bottom - BORDER) {
          // note, when a word is split, rect.left is at the second part
          if (rect.left < prevLeft) {
            prevLine = i;
          }
          prevLeft = rect.left;
          i++;
          continue;
        }

        // We have a full box now

        // Get the precise height of the full box
        const prevLineSpan = /** @type { HTMLElement } */ (spans[prevLine]);
        const prevRect = prevLineSpan.getBoundingClientRect();
        if (height === 0) {
          height = prevRect.bottom - box.top;
        }

        // Mark links in the last line as optional
        for (let j = prevLine; j < i; j++) {
          const span = /** @type { HTMLElement } */ (spans[j]);
          const par = span.parentElement;
          if (par != null && par.tagName === "A") {
            par.className += " caged-optional";
          }
        }

        const range = document.createRange();

        const first = /** @type { Node } */ (jqUnwrap(inner).firstChild);
        range.setStartBefore(first);

        if (second) {
          range.setEndAfter(span);
        } else {
          /** @type { Node } */
          let end = span;
          while (end.parentNode?.firstChild === end) {
            end = end.parentNode;
          }
          range.setEndBefore(end);
        }

        const block = range.cloneContents();
        blocks.push(block);

        if (filling) {
          break;
        }

        // Cut before the last line
        range.setEndBefore(prevLineSpan);

        // Try to find out exactly where the word break is
        const word = prevLineSpan.textContent || "";
        const chars = Array.from(word).map((c) =>
          jqUnwrap($("<span>").text(c))
        );
        $(prevLineSpan).empty().append(chars);
        for (const ch of chars) {
          const rect = ch.getBoundingClientRect();
          if (rect.left === prevRect.left) {
            range.setEndBefore(ch);
            break;
          }
        }

        range.deleteContents();
        inner.find(".caged-optional").removeClass("caged-optional");

        prevLine = 0;
        prevLeft = 0;
        spans = inner.find(".caged-word");
        i = 0;
      }
    } finally {
      $("#passages").removeClass("caged-render");
      outer.remove();
    }

    return { height, blocks };
  }

  // exposed for console experimentation
  MT.caged = {
    renderWithWordsMarked,
    splitText,
  };
})();
