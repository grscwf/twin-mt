/** @type {ArchiveMap} */
MT.neroEndings = {
  xn_Broken: {
    title: "Challenge Ending: Broken",
    passages: [
      "n9b Broken A1",
      "n9b Broken A2",
      "n9b Broken A3",
      "n9b Broken A4",
      "n9b Broken A5",
      "n9b Broken A6",
      "n9b Broken A7",
      "n9b Broken A8",
      "n9b Broken A9",
      "n9b Broken B1",
      "n9b Broken B2",
      "n9b Broken B3",
      "n9b Broken B4",
      "n9b Broken B5",
      "n9b Broken B6",
      "n9b Broken B7",
      "n9b Broken B8",
      "n9b Broken C1",
      "n9b Broken C2",
      "n9b Broken C3",
      "n9b Broken C4",
      "n9b Broken C5",
    ],
  },
  xn_CagedHarsh: {
    title: "Bad Ending: Caged (Harsh)",
    passages: [
      "n9a Caged Harsh 1",
      "n9a Caged Harsh 2",
      "n9a Caged Harsh 3",
      "n9a Caged Harsh 4",
      "n9a Caged Harsh 5",
      "n9a Caged Harsh 6",
      "n9a Caged Harsh End",
    ],
  },
  xn_CagedMild: {
    title: "Bad Ending: Caged (Mild)",
    passages: [
      "n9a Caged Mild 1",
      "n9a Caged Mild 2",
      "n9a Caged Mild 3",
      "n9a Caged Mild 4",
      "n9a Caged Mild 5",
      "n9a Caged Mild End",
    ],
  },
  xn_TamedHarsh: {
    title: "Bad Ending: Tamed (Harsh)",
    passages: [
      "n9a Tamed",
      "n9a Tamed Harsh 1",
      "n9a Tamed Harsh 2",
      "n9a Tamed Harsh 3",
      "n9a Tamed Harsh 4",
      "n9a Tamed Harsh 5",
      "n9a Tamed Harsh 6",
      "n9a Tamed Harsh 7",
      "n9a Tamed Harsh 8",
      "n9a Tamed Harsh 9",
      "n9a Tamed End 1",
      "n9a Tamed End 2",
    ],
  },
  xn_TamedMild: {
    title: "Bad Ending: Tamed (Mild)",
    passages: [
      "n9a Tamed",
      "n9a Tamed Mild 1",
      "n9a Tamed Mild 2",
      "n9a Tamed Mild 3",
      "n9a Tamed Mild 4",
      "n9a Tamed Mild 5",
      "n9a Tamed Mild 6",
      "n9a Tamed Mild 7",
      "n9a Tamed Mild 8",
      "n9a Tamed Mild 9",
      "n9a Tamed End 1",
      "n9a Tamed End 2",
    ],
  },

  // placeholders for unlock counting
  xn_HuntedMild: {},
  xn_HuntedHarsh: {},
  xn_OverwhelmedMild: {},
  xn_OverwhelmedHarsh: {},
  xn_Wrecked: {},

  xn_SatisfiedBlank: {},
  xn_SatisfiedMica: {},
  xn_SatisfiedPevhin: {},
  xn_Dominant: {},
  xn_Ascendant: {},
};

for (const key of Object.keys(MT.neroEndings)) {
  MT.mdDefSaved(key);
}

// archive selections
MT.mdDefUnsaved("mn_arcBarbs");
MT.mdDefUnsaved("mn_arcCagedVariant");
MT.mdDefUnsaved("mn_arcHuntedVariant");
MT.mdDefUnsaved("mn_arcOverwhelmedVariant");
MT.mdDefUnsaved("mn_arcSatisfiedVariant");
MT.mdDefUnsaved("mn_arcTamedVariant");
