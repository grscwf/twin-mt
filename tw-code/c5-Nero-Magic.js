/** True if Nero has cast a spell. */
MT.neroDidCast = () => {
  const V = State.variables;
  return (
    V.n_magicPhase != null &&
    V.n_magicPhase > MP_beforeCast &&
    (!V.n_glitched ||
      V.n_castEndgame ||
      V.n_castItch ||
      V.n_castOil ||
      V.n_castYounger)
  );
};
