(() => {
  const BORDER = 4;

  // @ts-expect-error real_stringify
  const repr = JSON._real_stringify || JSON.stringify;

  /** @typedef { { height: number, blocks: string[] } } SplitInfo */

  Macro.add("nero-caged", {
    tags: [],
    handler: function () {
      const [next] = this.args;

      let body = this.payload[0]?.contents ?? "";
      body = body.replace(/[?]P/g, " ");
      const split = splitText(body);

      if (State.temporary.isTranscript) {
        renderTranscript(this.output, split);
      } else {
        renderLive(this.output, split, next.isLink ? next.link : next);
      }

    },
  });

  /** @type { (out: DocumentFragment | HTMLElement, split: SplitInfo) => void } */
  function renderTranscript(out, split) {
    for (let i = 0; i < split.blocks.length; i++) {
      if (i !== 0) {
        $("<br>").appendTo(out);
      }

      let part = split.blocks[i];
      if (part == null) throw new Error("bug?");
      part = encloseCock(part);
      if (i !== split.blocks.length - 1) {
        part += "<a class=caged-continue>Continue</a>";
      }

      const outer = $("<div class='caged-box caged-transcript'>");
      outer.html(part).appendTo(out);
    }
  }

  /** @type { (out: DocumentFragment | HTMLElement, split: SplitInfo, next: string) => void } */
  function renderLive(out, split, next) {

    const outer = $("<div class=caged-box>");
    outer.appendTo(out);

    /** @type { (i: number) => void } */
    const render = i => {
      outer.empty();
      let text = split.blocks[i];
      if (text == null) throw new Error(`bug? ${i}`);
      text = encloseCock(text);
      const cont = document.createElement("a");
      cont.innerText = "Continue";
      cont.className = "caged-continue";
      if (i == split.blocks.length - 1) {
        text += "<br>";
        cont.className += "caged-final";
      }
      outer.html(text);
      outer.append(cont);
    };

    let current = 0;
    render(current);

    outer.on("click", e => {
      const t = $(e.target);
      if (t.hasClass("caged-cock")) {
        t.addClass("caged-blocked");
      } else if (t.hasClass("caged-continue")) {
        const open = outer.find(".caged-cock:not(.caged-blocked)");
        if (open.length) {
          outer.addClass("caged-flash");
          setTimeout(() => outer.removeClass("caged-flash"), 500);
        } else if (current == split.blocks.length - 1) {
          Engine.play(next);
        } else {
          current++;
          outer.removeClass("caged-fade-in-2");
          outer.addClass("caged-fade-in-1");
          render(current);
          setTimeout(() => outer.addClass("caged-fade-in-2"), 100);
          setTimeout(() => outer.removeClass("caged-fade-in-1"), 200);
        }
      }
    })
  }

  /** @type { (text: string) => string } */
  function encloseCock(text) {
    return text.replace(/\bcock\b/g, `<a class=caged-cock>cock</a>`);
  }

  /**
   * Split text into segments that fit in caged-box.
   * @type { (text: string) => SplitInfo }
   */
  function splitText(text) {
    const words = text.trim().split(/\s+/);
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

    $("#passages").addClass("caged-render").prepend(outer);

    /** @type { string[] } */
    const blocks = [];
    try {
      const box = inner.getBoundingClientRect();
      if (box.width === 0) {
        MT.diag("failed to render in splitText");
        return { height: 0, blocks: [text] };
      }

      let lastLine = 0;
      let prevLeft = 0;
      let blockStart = 0;
      for (let i = 0; i < spans.length; i++) {
        const span = spans[i];
        if (span == null) throw new Error("bug?");
        inner.append(span);
        const rect = span.getBoundingClientRect();
        if (rect.bottom > box.bottom - BORDER) {
          const block = words.slice(blockStart, i);
          blocks.push(block.join(" "));
          if (blockStart === lastLine) {
            throw new Error(`splitText failed to make progress?`);
          }
          for (let j = blockStart; j < lastLine; j++) {
            const first = inner.children[0];
            if (first == null) throw new Error("bug?");
            first.remove();
          }
          blockStart = lastLine;
        } else if (rect.left < prevLeft) {
          lastLine = i;
        }
        prevLeft = rect.left;
      }
      // XXX fill the last block with cock noise
      const block = words.slice(blockStart);
      blocks.push(block.join(" "));
    } finally {
      $("#passages").removeClass("caged-render");
      outer.remove();
    }

    return { height: 0, blocks };
  }

  MT["splitText"] = splitText;
})();
