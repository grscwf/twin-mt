const barbGlitch = [
  `<span class=glitch-switch>\
    <div class=glitch-switch-1>barbed</div>\
    <div class=glitch-switch-2>smooth</div>\
  </span>`,
  `<span class=glitch-switch>\
    <div class=glitch-switch-1>smooth</div>\
    <div class=glitch-switch-2>barbed</div>\
  </span>`,
];

Template.add("barbed", () => {
  const V = State.variables;
  if (V.n_glitched && barbGlitch[0]) return barbGlitch[0];
  return V.n_barbs ? "barbed" : "smooth";
});

Macro.add("glitch-text", {
  tags: [],
  handler: function () {
    const speed = parseInt(this.args[0] || "15", 10);
    const outer = $("<span id=glitch-2 class=mt-hidden>")
      .wiki(this.payload[0]?.contents || "")
      .appendTo(this.output);
    glitchWithin(outer, 0, speed);
  },
});

/** @type {(jq: JQuery<HTMLElement>, g: number, speed: number) => number} */
const glitchWithin = (jq, g, speed) => {
  for (const child of jq.contents()) {
    if (child.nodeType === Node.TEXT_NODE) {
      g = glitchText(child, g, speed);
    } else if (child instanceof HTMLElement) {
      g = glitchWithin($(child), g, speed);
    }
  }
  return g;
}

// cspell: disable-next-line
const glitchVowels = "áaeiouyAEIOUY";

/** @type {(textNode: Node, g: number, speed: number) => number} */
const glitchText = (textNode, g, speed) => {
  const outer = $("<span class=glitch-text>");
  textNode.parentNode?.replaceChild(MT.jqUnwrap(outer), textNode);
  const words = textNode.nodeValue?.split(/(\s+)/) || [];
  for (const word of words) {
    if (/\s/.test(word)) {
      outer.append(word);
    } else if (word === "##barbed-1##") {
      $(barbGlitch[0] || "").appendTo(outer);
    } else if (word === "##barbed-2##") {
      $(barbGlitch[1] || "").appendTo(outer);
    } else {
      const gf = Math.min(Math.floor(g / speed), 4);
      g++;
      const inner = $(`<span class="glitch-word-${gf}">`).appendTo(outer);
      for (const letter of word.split("")) {
        const isV = glitchVowels.includes(letter);
        const c = isV ? "v" : "c";
        $(`<span class="glitch-${c}">`).text(letter).appendTo(inner);
      }
    }
  }
  return g;
}
