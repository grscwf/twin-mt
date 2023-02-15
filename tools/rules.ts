export type Rule = {
  target: string;
  dirs: string[];
};

const common = [
  "tw-common",
  "tw-drekkar-?",
]

// Note: pathnames are relative to cwd
export const rules: Rule[] = [
  {
    target: "index.html",
    dirs: [...common, "tw-drekkar-only"],
  },
  {
    target: "nero.html",
    dirs: [...common, "tw-nero-*", "tw-nero-other"],
  },
];
