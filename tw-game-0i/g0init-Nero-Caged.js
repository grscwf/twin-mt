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
   *
   * <<nero-caged-fill>>
   *   Text that's repeated to fill the last block.
   *   If omitted, fills with dots.
   * <</nero-caged>>
   */
  Macro.add("nero-caged", {
    tags: ["nero-caged-fill"],
    handler: function () {
      const [next] = this.args;

      let body = this.payload[0]?.contents ?? "";

      let fill = this.payload[1]?.contents ?? "";
      if (fill.trim() === "") {
        fill = ". ";
      }

      const split = splitText(body, fill);

      if (State.temporary.isTranscript) {
        renderTranscript(this.output, split);
      } else {
        renderLive(this.output, split, next.isLink ? next.link : next);
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

      const cage = $("<div class='caged-box caged-transcript'>");
      cage.appendTo(out);

      if (i === last) {
        cage.addClass("caged-last");
      }

      const block = /** @type { DocumentFragment } */ (split.blocks[i]);
      cage.append($(block).contents());
      cage.append("<a class=caged-continue>Continue</a>");

      if (split.height) {
        cage.attr("style", `height: ${split.height}px`);
      }
    }
  }

  /** @type { (out: DocumentFragment | HTMLElement, split: SplitInfo, next: string) => void } */
  function renderLive(out, split, next) {
    const outer = $(`<div class="caged-box caged-fade-slow caged-fade-start">`);
    outer.appendTo(out);

    if (split.height) {
      outer.attr("style", `height: ${split.height}px`);
    }

    /** @type { (i: number) => void } */
    const renderBlock = (i) => {
      if (i === split.blocks.length - 1) {
        outer.addClass("caged-last");
      }
      outer.empty();
      outer.append(split.blocks[i] || "");
      outer.append("<a class=caged-continue>Continue</a>");
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
      outer.removeClass("caged-fade-slow");
    }
    setTimeout(() => outer.removeClass("caged-fade-start"), 300);

    const advance = () => {
      if (cur.n_cagedBlock === split.blocks.length - 1) {
        Engine.play(next);
      } else {
        outer.removeClass("caged-fade-fast caged-fade-slow");
        outer.addClass("caged-fade-start");
        cur.n_cagedBlock++;
        renderBlock(cur.n_cagedBlock);
        setTimeout(() => outer.addClass("caged-fade-fast"), 100);
        setTimeout(() => outer.removeClass("caged-fade-start"), 200);
      }
    };

    outer.on("click", (e) => {
      let t = $(e.target);
      // go up to an <a>
      while (t.length && t.prop("tagName") !== "A") {
        t = t.parent();
      }
      if (t.hasClass("caged-cock")) {
        t.addClass("caged-touched");
      } else if (t.hasClass("caged-continue")) {
        const open = outer.find(
          ".caged-cock:not(.caged-touched):not(.caged-optional)"
        );
        if (open.length === 0 || (setup.debug && e.shiftKey)) {
          e.preventDefault();
          e.stopPropagation();
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
   * @type { (text: string, fill: string) => SplitInfo }
   */
  function splitText(text, fill) {
    let rendered = renderWithWordsMarked(text);
    let renderedFill = renderWithWordsMarked(fill);

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

      let prevLine = 0;
      let prevLeft = 0;
      let filling = false;
      let spans = inner.find(".caged-word");
      let i = 0;
      for (;;) {
        if (i >= spans.length) {
          filling = true;
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
        if (rect.bottom > box.bottom - BORDER) {
          const prevLineSpan = /** @type { HTMLElement } */ (spans[prevLine]);
          // Get the precise height of a full box
          if (height === 0) {
            const rect = prevLineSpan.getBoundingClientRect();
            height = rect.bottom - box.top;
          }

          // Mark links in the last line as optional
          for (let j = prevLine; j < i; j++) {
            const span = /** @type { HTMLElement } */ (spans[j]);
            const par = span.parentElement;
            if (par != null && par.tagName === "A") {
              par.className += " caged-optional";
            }
          }
          
          const first = /** @type { Node } */ (jqUnwrap(inner).firstChild);
          const range = document.createRange();
          range.setStartBefore(first);

          /** @type { Node } */
          let end = span;
          while (end.parentNode?.firstChild === end) {
            end = end.parentNode;
          }
          range.setEndBefore(end);

          const block = range.cloneContents();
          blocks.push(block);

          if (filling) {
            break;
          }

          range.setEndBefore(prevLineSpan);
          range.deleteContents();

          prevLine = 0;
          prevLeft = 0;
          spans = inner.find(".caged-word");
          i = 0;
          continue;
        }

        if (rect.left < prevLeft) {
          prevLine = i;
        }
        prevLeft = rect.left;
        i++;
      }
    } finally {
      $("#passages").removeClass("caged-render");
      outer.remove();
    }

    return { height, blocks };
  }

  MT.caged = {
    renderWithWordsMarked,
    splitText,
  };
})();
