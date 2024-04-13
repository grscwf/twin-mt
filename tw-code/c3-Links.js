/**
 * <<mta $link [$code]>>
 *   $text
 * <</mta>>
 *
 * Similar to <<link $text $link>><<run $code>><</link>>
 * Allows double-bracket syntax for the link.
 * Adds a data-mt-code attribute for disambiguation.
 * Also arranges for the next passage to get the code as $g_mtaCode
 */
Macro.add("mta", {
  tags: [],
  handler: function () {
    const link = /** @type {SugarCubeLink | string} */ (this.args[0]);
    const code = /** @type {string | null | undefined} */ (this.args[1]);

    const text = this.payload[0]?.contents || "";
    $(makeLink(link, code, text)).appendTo(this.output);
  },
});

/**
 * <<mtl $link [$script]>>
 *   $text
 * <</mtl>>
 *
 * <<mta>> but wrapped in <li></li>
 */
Macro.add("mtl", {
  tags: [],
  handler: function () {
    const link = /** @type {SugarCubeLink | string} */ (this.args[0]);
    const code = /** @type {string | null | undefined} */ (this.args[1]);

    const text = this.payload[0]?.contents || "";
    $("<li>").append(makeLink(link, code, text)).appendTo(this.output);
  },
});

/**
 * <<mtl-if $bool $link [$reason]>>
 *   $text
 * <</mtl>>
 *
 * <<mtl>> but only if $bool.
 * Otherwise, show it as unavailable, with $reason
 */
Macro.add("mtl-if", {
  tags: [],
  handler: function () {
    const expr = /** @type {boolean | string} */ (this.args[0]);
    const link = /** @type {SugarCubeLink | string} */ (this.args[1]);
    const reason = /** @type {string | null | undefined} */ (this.args[2]);

    const text = this.payload[0]?.contents || "";
    const bool =
      typeof expr === "boolean"
        ? expr
        : /** @type {unknown} */ (Scripting.evalTwineScript(expr));

    if (bool) {
      $("<li>").append(makeLink(link, null, text)).appendTo(this.output);
    } else {
      const li = $("<li class=mtl-denied>").appendTo(this.output);
      $("<span class=mtl-action>").wiki(text.trim()).appendTo(li);
      if (reason != null && reason !== "") {
        $("<span class=mtl-reason>").text(`(${reason})`).appendTo(li);
      }
    }
  },
});

/**
 * <<mtl-denied $text [$reason]>>
 *
 * Show an unavailable action.
 */
Macro.add("mtl-denied", {
  handler: function () {
    const [text, reason] = this.args;
    const li = $("<li class=mtl-denied>").appendTo(this.output);
    $("<span class=mtl-action>").wiki(text.trim()).appendTo(li);
    if (reason != null && reason !== "") {
      $("<span class=mtl-reason>").text(`(${reason})`).appendTo(li);
    }
  },
});

/**
 * @arg {SugarCubeLink | string} link
 * @arg {string | null | undefined} code
 * @arg {string} text
 *
 */
const makeLink = (link, code, text) => {
  const el = document.createDocumentFragment();
  const dest = linkTitle(link);
  const destRepr = JSON.stringify(String(dest));
  const textRepr = JSON.stringify(String(text).trim());

  let body = "";
  if (code != null && code !== "") {
    const codeRepr = JSON.stringify(String(code));
    body = `<<run $g_mtaCode = ${codeRepr}; $g_mtaCodeTurn = ${State.turns}; ${code}>>`;
  }
  $(el).wiki(`<<link ${textRepr} ${destRepr}>>${body}<</link>>`);
  if (code != null && code !== "") {
    $(el).find("a").attr("data-mta-code", code);
  }
  return el;
};

/** @type {(link: SugarCubeLink | string) => string} */
const linkTitle = (link) => {
  if (typeof link !== "string" && link.isLink && link.link != null) {
    return link.link;
  }
  const str = String(link);
  const m = /^\[\[(?:[^|]+\|)?([^|]+)\]\]$/.exec(str);
  return m == null ? str : m[1] || "";
};

/**
 * <<mta-no-loop $link>>
 *   $text
 * <</mta-no-loop>>
 *
 * Show as a link if the destination hasn't been seen recently.
 * Otherwise just show the text.
 *
 * Seen recently is:
 * - within the last 20 passages,
 * - since the latest visit to $n_patiencePassage.
 */
Macro.add("mta-no-loop", {
  tags: [],
  handler: function () {
    const [link] = this.args;
    const dest = linkTitle(link);
    const text = this.payload[0]?.contents || "";
    if (recentlyViewed(dest)) {
      $(this.output).wiki(text);
    } else {
      $(this.output).append(makeLink(link, null, text));
    }
  },
});

/** @type {(name: string) => boolean} */
const recentlyViewed = (name) => {
  const T = State.temporary;
  const limit = MT.untracedGet("n_patiencePassage");
  const max = 20;
  const now = T.tranTurn || State.length - 1;
  for (let i = 0; i < max; i++) {
    const past = State.index(now - i);
    if (past == null) return false;
    if (past.title === limit) return false;
    if (past.title === name) return true;
  }
  return false;
};

/**
 * <<return-before $fromPassage>>
 *
 * Make a return link that goes to the passage before $fromPassage
 * in history.
 */
Macro.add("return-before", {
  handler: function () {
    if (State.temporary.isTranscript) return;

    let [from] = this.args;
    if (from.isLink) {
      from = from.link;
    }

    const hist = State.history;
    let i = State.length - 1;
    while (i >= 0 && hist[i]?.title !== from) {
      i--;
    }
    if (i < 1) {
      throw new Error(`return-before failed for ${from}`);
    }

    const dest = hist[i - 1]?.title;
    $(this.output).wiki(`<<mta [\[${dest}]]>>Return<</mta>>`);
  },
});

Template.add("gswLiam", () => {
  const fix = () => {
    const em = document.getElementById("gsw-liam");
    if (em == null) return;
    if (!(em instanceof HTMLAnchorElement)) return;
    const ma = $("#gsw-au")[0];
    // cspell:disable-next-line
    const a = atob("eEBtYWlsdG86");
    const b = a.slice(2);
    const c = ma?.textContent?.toLowerCase();
    const d = a[1];
    const e = em.getAttribute("id");
    const f = a.slice(2, 6);
    const url = `${b}${c}wolf${d}${e}${f}.com`;
    em.href = url;
    em.textContent = `e${f}`;
  };

  if (!State.temporary.isArchive) {
    $(document).one(":passageend", () => {
      setTimeout(fix, 100);
    });
  }

  const mkp =
    `<a id="gsw-liam" target="_blank"` +
    ` class="link-external" rel="noreferrer"></a>`;
  return mkp;
});
