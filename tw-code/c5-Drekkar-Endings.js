/** @type {ArchiveMap} */
MT.drekkarEndings = {
  xd_EnthrallmentLion: {
    title: "Bad Ending: Enthrallment (Lion)",
    passages: [
      "d3a Lion Fight",
      "d3a Lion Pindown",
      "d3a Lion Fucking",
      "d3a Lion Knotting",
      "d9a Enthrallment 1 (Knot)",
      "d9a Enthrallment 2",
      "d9a Enthrallment 3",
      "d9a Enthrallment 4",
    ],
  },
  xd_EnthrallmentQuick: {
    title: "Bad Ending: Enthrallment (Quick)",
    passages: [
      "d9a Enthrallment 1",
      "d9a Enthrallment 2",
      "d9a Enthrallment 3",
      "d9a Enthrallment 4",
    ],
  },

  xd_ExtractionForceful: {
    title: "Bad Ending: Extraction (Forceful)",
    passages: [
      "d9a Extraction 1",
      "d9a Extraction 2",
      "d9a Extraction 3",
      "d9a Extraction 4",
      "d9a Extraction 5",
      "d9a Extraction Forceful 1",
      "d9a Extraction Forceful 2",
      "d9a Extraction Forceful 3",
      "d9a Extraction Forceful 4",
      "d9a Extraction Finish",
      "d9a Extraction Finish Forceful",
    ],
  },
  xd_ExtractionGentle: {
    title: "Bad Ending: Extraction (Gentle)",
    passages: [
      "d9a Extraction 1",
      "d9a Extraction 2",
      "d9a Extraction 3",
      "d9a Extraction 4",
      "d9a Extraction 5",
      "d9a Extraction Gentle 1",
      "d9a Extraction Gentle 2",
      "d9a Extraction Gentle 3",
      "d9a Extraction Gentle 4",
      "d9a Extraction Finish",
      "d9a Extraction Finish Gentle",
    ],
  },

  xd_InterrogationFreeze: {},
  xd_InterrogationMild: {
    title: "Bad Ending: Interrogation (Mild, %freeze)",
    passages: [
      "d9b Ivex Torture 1",
      "d9b Ivex Torture 2",
      "d9b Easy Way",
      "d9b Resistance",
      (o) => (o.freeze ? "d9b Ice 1" : "d9b Shock 1"),
      (o) => (o.freeze ? "d9b Ice 2" : "d9b Shock 2"),
      (o) => (o.freeze ? "d9b Ice 3" : "d9b Shock 3"),
      "d9b Extra Torture",
      "d9b Compliant End",
    ],
  },
  xd_InterrogationRough: {
    title: "Bad Ending: Interrogation (Rough, %freeze)",
    passages: [
      "d9b Ivex Torture 1",
      "d9b Ivex Torture 2",
      "d9b Hard Way",
      "d9b Defiance",
      (o) => (o.freeze ? "d9b Ice 1" : "d9b Shock 1"),
      (o) => (o.freeze ? "d9b Ice 2" : "d9b Shock 2"),
      (o) => (o.freeze ? "d9b Ice 3" : "d9b Shock 3"),
      "d9b Extra Torture",
      "d9b Defiant End",
    ],
  },
  xd_InterrogationShock: {},

  xd_IvexEnthrallment: {
    title: "Ending: A New Servant",
    passages: [
      "d9x Ivex Enthrallment 1",
      "d9x Ivex Enthrallment 2",
      "d9x Ivex Enthrallment 3",
      "d9x Ivex Enthrallment 4",
      "d9x Ivex Enthrallment 5",
      "d9x Ivex Enthrallment 6",
      "d9x Ivex Enthrallment 7",
      "d9x Ivex Enthrallment 8",
      "d9x Ivex Enthrallment 9",
    ],
  },
  xd_IvexExtraction: {
    title: "Ending: Energy Supply",
    passages: [
      "d9x Ivex Extraction 1",
      "d9x Ivex Extraction 2",
      "d9x Ivex Extraction 3",
      "d9x Ivex Extraction 4",
      "d9x Ivex Extraction 5",
      "d9x Ivex Extraction 6",
      "d9x Ivex Extraction 7",
    ],
  },
  xd_IvexPunishment: {
    title: "Ending: Punishment",
    passages: [
      "d9y Personal Vengeance",
      "d9y Strip",
      "d9y Fondle",
      "d9y Spell",
      "d9y Lust Spell",
      "d9y Hold",
      "d9y Gag",
      "d9y Gag with Underwear",
      "d9y Hold Again",
      "d9y Fuck",
      "d9y Fucking",
      "d9y Edge",
      "d9y Fucking Again",
      "d9y Knot",
      "d9y Knotted Mage",
      "d9y Pull Out Finish",
      "d9y Pull Out Punishment Finish",
      "d9y Bounty Collection",
    ],
  },
};

for (const key of Object.keys(MT.drekkarEndings)) {
  MT.mdDefSaved(key);
}
