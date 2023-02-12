export type Rule = {
  target: string;
  dirs: string[];
};

// Note: pathnames are relative to cwd
export const rules: Rule[] = [
  {
    target: "nero.html",
    dirs: ["tw-common", "tw-drekkar", "tw-nero", "tw-nero-changed"],
  },
  {
    target: "index.html",
    dirs: ["tw-common", "tw-drekkar", "tw-drekkar-only"],
  }
];