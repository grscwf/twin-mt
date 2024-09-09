Template.add("P", "<br><br>");

Template.add(
  "construction",
  `<div class="mt-cons clue-remove">&#x1f6a7;Under Construction&#x1f6a7;</div>`
);

Template.add("debugIcon", "<mt-icon>&#x1f527;</mt-icon>");

Template.add("msTara", "Ms.&nbsp;Tara");

Template.add(
  "restartAction",
  `<li><<link "Try again from the beginning.">>` +
    `<<run Engine.restart()>>` +
    `<</link>></li>`
);

Template.add("testIcon", "<mt-icon>&#x1f9ea;</mt-icon>");
