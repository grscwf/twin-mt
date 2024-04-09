(() => {
  /**
   * @typedef { { title?: string, code?: string } } NextLink
   */

  /**
   * @param { JQuery } jq
   * @param { NextLink } next
   */
  function cleanHtml(jq, next) {
    jq.removeClass("passage-in");
    jq.find("[data-name=silently]").remove();
    jq.find(".debug").replaceWith(function () {
      return $(this).contents();
    });
    jq.find(".fade-in-absorb").removeClass("fade-in-absorb");
    jq.find(".fade-in-hidden").removeClass("fade-in-hidden");
    jq.find(".glitch-fading-in").removeClass("glitch-fading-in");
    jq.find(".patience-debug").remove();
    jq.find(".random-walk-chosen").removeClass("random-walk-chosen");
    jq.find(".ro-debug").remove();
    jq.find(".tame-hide").removeClass("tame-hide");
    jq.find(".tran-remove").remove();

    // highlight the link followed.
    if (next.title != null) {
      let link = jq.find(`a[data-passage="${next.title}"]`);
      if (link.length > 1 && next.code != null) {
        link = link.filter(`[data-mta-code="${next.code}"]`);
      }
      link.addClass("tran-next");

      // remove tran-cut
      const cut = jq.find(".tran-cut");
      cut.each((i, el) => {
        if ($(el).attr("data-passage") === next.title) {
          while (
            el.parentNode != null &&
            !el.classList.contains("tran-entry")
          ) {
            while (el.nextSibling != null) {
              el.nextSibling.remove();
            }
            el = /** @type { HTMLElement } */ (el.parentNode);
          }
          $(el).append(`<span class="tran-elided">&hellip;</span>`);
        }
      });
    }

    // remove tran-cut-span
    jq.find(".tran-cut-span").each((i, el) => {
      if ($(el).find(".tran-next").length) {
        while (el.parentNode != null && !el.classList.contains("tran-entry")) {
          while (el.nextSibling != null) {
            el.nextSibling.remove();
          }
          el = /** @type { HTMLElement } */ (el.parentNode);
        }
        $(el).append(`<span class="tran-elided">&hellip;</span>`);
      }
    });

    // add an hr before any fade-in that has a paragraph before
    const fb1 = jq.find(".fade-in").prev("br");
    fb1.replaceWith("<hr class=time-sep>");

    // glitch link
    const gl = jq.find(".glitch-link");
    if (gl.length) {
      const clicked = gl.find("a.tran-next");
      if (clicked.length) {
        gl.removeClass("glitch-link");
      } else {
        gl.remove();
      }
    }

    // glitch text
    const gh = jq.find(".mt-hidden");
    gh.addClass("glitch-fading-out");
    gh.removeClass("mt-hidden");
    jq.find("#tame-1 a").remove();

    // remove trailing space and Continue/Return links
    const shouldRemove = (/** @type { Node } */ node) => {
      if (node.nodeName === "#text") {
        if (node.nodeValue == null) return true;
        if (node.nodeValue.trim() === "") return true;
      }
      const el = /** @type { HTMLElement } */ (node);
      if (el.nodeName === "BR") return true;
      if (el.nodeName === "A") {
        if (el.className === "caged-continue") return false;
        if (el.textContent == null) return true;
        const text = el.textContent.trim();
        if (text === "Continue") return true;
        if (text === "Return") return true;
      }
      return false;
    };
    /** @type { Node | undefined } */
    let node = jq[0];
    while (node != null && node.lastChild != null) {
      while (node.lastChild != null && shouldRemove(node.lastChild)) {
        node.lastChild.remove();
      }
      node = node.lastChild;
    }
  }

  /**
   * @param { string } title
   * @param { number } turn
   * @param { object } state
   * @param { NextLink } next
   */
  function tranRenderInternal(title, state, turn, next) {
    State.clearTemporary();
    State.temporary.isTranscript = true;
    State.temporary.tranPassage = title;
    State.temporary.tranTurn = turn;
    State.active.variables = clone(state) || {};
    MT.enumInit();

    const text = Story.get(title).text;
    let div = $("<div class=tran-entry>");
    MT.suppressErrors(() => {
      div.wiki(text);
    });
    // clone to remove event handlers
    div = div.clone();
    cleanHtml(div, next);

    return div;
  }

  MT.tranRenderOne = (title, state) => {
    const savedVars = State.active.variables;
    const savedTemp = Object.entries(State.temporary);
    try {
      return tranRenderInternal(title, state, 0, {});
    } finally {
      State.active.variables = savedVars;
      State.clearTemporary();
      for (const [k, v] of savedTemp) {
        State.temporary[k] = v;
      }
    }
  };

  MT.tranRender = (output) => {
    MT.isRendering = true;
    const outer = $("<div id=tran-outer>").appendTo(output);

    const hist = MT.getHistory();
    let turn = 0;

    const renderSome = () => {
      const batch = 10;
      const stop = Math.min(turn + batch, hist.length);

      const savedVars = State.active.variables;
      const savedTemp = Object.entries(State.temporary);
      try {
        for (; turn < stop; turn++) {
          const moment = hist[turn];

          if (turn !== 0) {
            $("<hr class=text-sep>").appendTo(outer);
          }

          /** @type { NextLink } */
          const next = {};
          if (turn + 1 < hist.length) {
            next.title = hist[turn + 1].title;
            const V = hist[turn + 1].variables;
            if (V.g_mtaCodeTurn === turn + 1) {
              next.code = V.g_mtaCode;
            }
          }
          const div = tranRenderInternal(
            moment.title,
            moment.variables,
            turn,
            next
          );

          if (setup.debug) {
            $("<div class=tran-title>").text(moment.title).prependTo(div);
          }

          $(outer).append(div);
        }
      } finally {
        State.active.variables = savedVars;
        State.clearTemporary();
        for (const [k, v] of savedTemp) {
          State.temporary[k] = v;
        }
      }
    };

    const renderLoop = () => {
      renderSome();
      if (turn < hist.length) {
        setTimeout(renderLoop);
      } else {
        renderDone();
      }
    };

    const renderDone = () => {
      const words = MT.countWords($(outer).text());
      const passages = hist.length;
      const minutes = Math.round(words / 250);
      let stats = `${passages} pages, ${words} words, ~${minutes} minutes`;
      $("#tran-stats").text(`(${stats})`);
      MT.isRendering = false;
    };

    renderLoop();
  };

  /**
   * <<tran-cut link>>
   * <<tran-cut text link>>
   *
   * Emit link. In the transcript, if the player followed this link,
   * elide everything after this link in the passage.
   */
  Macro.add("tran-cut", {
    handler: function () {
      const frag = document.createDocumentFragment();
      if (this.args.length === 1) {
        $(frag).wiki(this.args.raw);
      } else {
        $(frag).wiki(`<<link ${this.args.raw}>><</link>>`);
      }
      $(frag).find("a").addClass("tran-cut");
      $(this.output).append(frag);
    },
  });

  /**
   * <<tran-cut-span>>
   *   text
   * <</tran-cut-span>>
   *
   * Emit text. In the transcript, if the player follows a link within
   * the text, elide everything after this block.
   */
  Macro.add("tran-cut-span", {
    tags: [],
    handler: function () {
      const span = $("<span class=tran-cut-span>");
      span.wiki(this.payload[0]?.contents || "");
      $(this.output).append(span);
    },
  });

  /**
   * <<tran-skip>>...<</tran-skip>>
   * Emit body only when *not* rendering transcript.
   */
  Macro.add("tran-skip", {
    tags: [],
    handler: function () {
      const mkp = State.temporary.isTranscript ? "" : this.payload[0]?.contents;
      // this will add debug markers around the output
      $(this.output).wiki(mkp || "");
    },
  });
})();
