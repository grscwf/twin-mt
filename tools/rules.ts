export type Rule = {
  target: string;
  deps: string[];
  dirs: string[];
  toHtml: string;
};

// Note: pathnames are relative to cwd
export const rules: Rule[] = [
  {
    target: "nero.html",
    deps: ["nero.tw"],
    dirs: ["tw-common", "tw-drekkar", "tw-nero"],
    toHtml: "tweego nero.tw -o nero.html",
  },
  {
    target: "index.html",
    deps: ["story.tw"],
    dirs: ["tw-common", "tw-drekkar", "tw-drekkar-only"],
    toHtml: "tweego story.tw -o index.html",
  }
];