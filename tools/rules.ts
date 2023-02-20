export type Rule = {
  target: string;
  dirs: string[];
};

const common = [
  "tw-common",
  // Note: fast-glob has a bug with "tw-drekkar-?"
  "tw-drekkar-*",
]

// Note: pathnames are relative to cwd
export const rules: Rule[] = [
  {
    target: "index.html",
    dirs: [...common, "tw-only-drekkar"],
  },
  {
    target: "nero.html",
    dirs: [...common, "tw-nero-*", "tw-nero-0"],
  },
];
