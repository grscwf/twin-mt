export type Rule = {
  target: string;
  dirs: string[];
  omit?: string[] | null | undefined;
};

// Note: fast-glob has a bug with "a-?", so use "a-*" instead

// Note: pathnames are relative to cwd
export const rules: Rule[] = [
  {
    target: "nero.html",
    dirs: [
      "tw-twine",
      "tw-code*",
      "tw-game-*",
      "tw-nero-*",
      "tw-drekkar-*",

      // last dir is where untwine will add new passages
      "tw-uncategorized",
    ],
  },
];
