/**
 * <<mf-please>>
 *   $text
 * <<mf-else>>
 *   $otherText
 * <</mf-please>>
 *
 * Nero has said something with "please", and the Sprite misinterprets
 * it as a command. Emits $text.
 *
 * If Sprite is inactive or waiting for a password, emits $otherText instead.
 */
Macro.add("mf-please", {
  tags: ["mf-else"],
  handler: function () {
    const V = MT.untracedVars();
    MT.nonNull(V.n_magicPhase, "magicPhase");
    let ready = true;
    ready = ready && V.n_magicPhase >= MP_wantDevice;
    ready = ready && V.n_magicPhase < MP_drained;
    ready = ready && MP_wantPass !== V.n_magicPhase;
    if (ready) {
      $(this.output).wiki(this.payload[0]?.contents || "");
    } else {
      const pl = this.payload[1];
      if (pl != null && pl.name === "mf-else") {
        $(this.output).wiki(pl.contents);
      }
    }
  },
});

/**
 * <<mf-pass $pw>>
 *   $moreText
 * <<mf-else>>
 *   $otherText
 * <</mf-pass>>
 *
 * Nero has said something that the Sprite misinterprets as a password.
 * This starts that process, emits text from the Sprite, and then $moreText.
 *
 * If Sprite is not asking for a password, emits $otherText instead.
 */
Macro.add("mf-pass", {
  tags: ["mf-else"],
  handler: function () {
    const [pw] = this.args;
    const V = State.variables;
    if (pw == null || pw === "" || MP_wantPass !== V.n_magicPhase) {
      const pl = this.payload[1];
      if (pl != null && pl.name === "mf-else") {
        $(this.output).wiki(pl.contents);
      }
      return;
    }

    // usually already set, except when debugging
    const tried = JSON.parse(V.n_passTried || "[]");
    tried.unshift(`#${pw}`);
    V.n_passTried = JSON.stringify(tried);
    V.n_magicPhase = MP_onHold;
    let mkp = `<<nobr>>`;
    mkp += ` ?P`;
    mkp += ` The Sprite ?sprSpeaks in Nero's ear.`;
    mkp += ` <span class=sprite-q>"Hm, that password doesn't sound right`;
    mkp += ` either, ?master`;
    mkp += ` Please hold while I double-check it, ?master"</span>`;
    mkp += this.payload[0]?.contents || "";
    mkp += ` <</nobr>>`;
    $(this.output).wiki(mkp);
    // for gathering stats in random-walks
    console.log(`mf-pass ${pw}`);
  },
});
