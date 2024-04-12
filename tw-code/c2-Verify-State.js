const verifyInit = () => {
  $(document).on(":passageend", () => {
    MT.untraced(() => {
      for (const [k, v] of Object.entries(State.variables)) {
        if (Array.isArray(v)) {
          MT.warn(`${k} is an array (will not be delta encoded)`);
        }
      }
    });
  });
};

verifyInit();
