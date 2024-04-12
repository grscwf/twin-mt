MT.startTaming = () => {
  if (!State.temporary.isTranscript) {
    const passage = $(".passage");
    setTimeout(() => passage.addClass("tame-fade"), 200);
  }
};
