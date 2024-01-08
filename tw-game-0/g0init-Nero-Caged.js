(() => {
  const BORDER = 4;

  // @ts-expect-error real_stringify
  const repr = JSON._real_stringify || JSON.stringify;

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
        renderLive(this.output, split);
      }

    },
  });

  /** @type { (out: DocumentFragment | HTMLElement, split: string[]) => void } */
  function renderTranscript(out, split) {
    for (let i = 0; i < split.length; i++) {
      if (i !== 0) {
        $("<br>").appendTo(out);
      }

      let part = split[i];
      if (part == null) throw new Error("bug?");
      part = encloseCock(part);
      if (i !== split.length - 1) {
        part += "<div class=caged-continue>Continue</div>";
      }

      const outer = $("<div class='caged-box caged-transcript'>");
      outer.html(part).appendTo(out);
    }
  }

  /** @type { (out: DocumentFragment | HTMLElement, split: string[]) => void } */
  function renderLive(out, split) {
    // XXX cock should look like a link, and click on cock blocks it
    // XXX if not all cocks blocked, click on continue is blocked and highlights cocks
    // XXX click on continue to render the next box

    const outer = $("<div class=caged-box>");
    outer.appendTo(out);

    let first = split[0];
    if (first != null) {
      first = encloseCock(first);
      outer.html(first + `<div class=caged-continue>Continue</div>`);
    }
  }

  /** @type { (text: string) => string } */
  function encloseCock(text) {
    return text.replace(/\bcock\b/g, `<span class=caged-cock>cock</span>`);
  }

  /**
   * Split text into segments that fit in caged-box.
   * @type { (text: string) => string[] }
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
        return [text];
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
          // XXX if no cocks in the current block, go back and add some.
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

    return blocks;
  }

  MT["splitText"] = splitText;
})();
