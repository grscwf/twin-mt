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
      "tw-init",
      "tw-mt",
      "tw-drekkar-*",
      "tw-nero-*",

      // this is where untwine will add new passages
      // TODO: should be a separate property
      "tw-nero-0",
    ],

    // Omit wip for release builds
    // omit: ["tw-nero-3", "tw-nero-wip"],
  },
];
