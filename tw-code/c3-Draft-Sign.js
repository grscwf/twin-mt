const validSigns = ["mt-ready", "mt-draft", "mt-sketch"];

/** @type {(title: string) => string | null} */
MT.signOf = (title) => {
  const tags = Story.get(title || State.passage).tags;
  for (const sign of validSigns) {
    if (tags.includes(sign)) return sign;
  }
  return null;
};

/** @type {(title: string) => boolean} */
MT.isDraft = (title) => {
  const sign = MT.signOf(title);
  return sign === "mt-draft" || sign === "mt-sketch";
};

MT.signPassage = () => {
  // add sign to current passage
  $("#draft-sign").remove();
  const sign = MT.signOf(State.passage);
  if (sign) {
    $("<div>").attr("id", "draft-sign").addClass(sign).appendTo("body");
  }

  // add signs to links to other passages
  $("#passages a[data-passage]").each((i, el) => {
    const title = $(el).attr("data-passage");
    const sign = MT.signOf(title || "");
    if (sign != null) {
      $(el).addClass(sign);
    }
  });
};

$(document).on(":passagedisplay", MT.signPassage);
