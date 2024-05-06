MT.titleStart = () => {
  const V = State.variables;
  const T = State.temporary;

  if (V.xd_IvexPunishment) {
    T.characterDisplay = "images/wolf.png";
  } else {
    T.characterDisplay = "images/panther.png";
  }

  V.g_versionAtStart = setup.version;
};

MT.titleContentWarning = () => {
  Dialog.setup("Content Warning");
  Dialog.wiki("<<include [[g1a Content Warning]]>>");
  Dialog.open();
};
