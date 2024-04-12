/** @type {(text: string) => number} */
MT.countWords = function (text) {
  const tokens = text.split(/(<[<].*?>>|<.*>)/);

  /** @type {(p: number, re: RegExp) => number} */
  const skipTo = (p, re) => {
    while (p < tokens.length && !re.test(tokens[p] || "")) {
      ++p;
    }
    return p;
  };

  let n = 0;
  for (let p = 0; p < tokens.length; p++) {
    const token = tokens[p] || "";
    const t = token.trim();
    if (t === "") {
      /* nothing */
    } else if (/^<?<script/.test(t)) {
      n += 1;
      p = skipTo(p, /^<?<[/]script/);
    } else if (t.startsWith("<style")) {
      n += 1;
      p = skipTo(p, /^<[/]style/);
    } else if (t.startsWith("<")) {
      n += 1;
    } else {
      const words = t.split(/[\s]+/).filter((w) => /\w/.test(w) && w !== "?P");
      n += words.length;
    }
  }
  return n;
};
