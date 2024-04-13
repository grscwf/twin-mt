const sayPassword = "n1s Say Password";

const PW_621 = MT.windowRec.PW_621 = "621";
const PW_blood = MT.windowRec.PW_blood = "Blood";
const PW_carpe = MT.windowRec.PW_carpe = "Carpe Diem";
const PW_fuckToy = MT.windowRec.PW_fuckToy = "Fuck Toy 9000";
const PW_hunter = MT.windowRec.PW_hunter = "Hunter Too";
const PW_ivex = MT.windowRec.PW_ivex = "Ivex the Magnificent";
const PW_ivy = MT.windowRec.PW_ivy = "Ivy";
const PW_lance = MT.windowRec.PW_lance = "Lance Rockhard";
const PW_liskov = MT.windowRec.PW_liskov = "Caverns of Liskov";
const PW_luminance = MT.windowRec.PW_luminance = "Caverns of Luminance";
const PW_password = MT.windowRec.PW_password = "Password";
const PW_ransamaran = MT.windowRec.PW_ransamaran = "Ransamaran Ivory";
const PW_red = MT.windowRec.PW_red = "Red";
const PW_too = MT.windowRec.PW_too = "T-O-O";
const PW_uramos = MT.windowRec.PW_uramos = "Uramos";

/*
 * Passwords starting with "#" are from mf-pass.
 * Everything else should either be in basicPasswords or otherPasswords.
 */

/** @type {Record<string, string>} */
MT.basicPasswords = {};
{
  const bp = MT.basicPasswords;
  bp[PW_ivex] = "the egotistical choice";
  bp[PW_ransamaran] = "the mage school that Ivex attended";
  bp[PW_password] = "a common password";
}

/** @type {Record<string, string>} */
MT.otherPasswords = {};
{
  const op = MT.otherPasswords;
  /* books */
  op[PW_621] = "the year that Ivex graduated from high school";
  // never succeed at getting high school name

  /* bottle */
  op[PW_lance] = "the name of the enormous horse dildo";

  /* candle */
  op[PW_red] = "the color of the candle";
  op[PW_blood] = "another name for the candle's color";

  /* globe */
  op[PW_carpe] = "the slogan on the pillar in the snow globe";
  op[PW_liskov] = "a plausible source of Ivex's snow globe";
  op[PW_luminance] = "the most likely source of Ivex's snow globe";

  /* map */
  op[PW_uramos] = "the circle marked on the map";
  // never succeed at identifying the X

  /* penguin */
  op[PW_hunter] = "the name of Ivex's penguin";
  op[PW_too] = "a failure to say the name of Ivex's penguin";

  /* painting */
  op[PW_ivy] = "the name of Ivex's mother";

  /* wand */
  op[PW_fuckToy] = "the name of Ivex's wand";
};

/* Sprite responses spell out numbers and letters. */
/** @type {Record<string, string>} */
const passSprite = {};
{
  const ps = passSprite;
  ps[PW_621] = "Six Twenty One";
  ps[PW_fuckToy] = "Fuck Toy Nine Thousand";
  ps[PW_too] = "Tee Oh Oh";
}

/* Sprite has a few special wrong-password messages */
/** @type {Record<string, string>} */
const oldPasswords = {};
{
  const op = oldPasswords;
  op[PW_carpe] = "is not your password yet, ?master";
  op[PW_ivex] = "is obviously not your password, ?master";
  op[PW_password] = "is your mother's maiden name, not your password, ?master";
  op["I'm Sorry To Interrupt"] = "was last year's password, ?master";
  op["I Have A Question For You"] = "was last month's password, ?master";
}

let pwDebugAlready = false;
$(document).on(":passagestart", () => {
  pwDebugAlready = false;
});

/**
 * <<pw-found $pw>>
 * Add pw to passFound.
 * Can be used for things that Nero sees before he knows he needs a password.
 */
Macro.add("pw-found", {
  handler: function() {
    const [pw] = this.args;
    if (MT.otherPasswords[pw] == null) {
      throw new Error(`pw-found ${pw} undeclared password`);
    }
    const V = State.variables;
    const found = MT.jsonParse(V.n_passFound || "[]");
    if (!found.includes(pw)) {
      found.push(pw);
      V.n_passFound = MT.repr(found);
    }
  }
});

/**
 * <<pw-suggest $pw1>>
 *     $storyText1
 * <<pw-another $pw2>>
 *     $storyText2
 * <<pw-fail>>
 *     $storyTextFail
 * <</pw-suggest>>
 * Only does something when wantPass or onHold.
 * The first pw that isn't in passTried gets added to passFound,
 * and the corresponding text gets shown.
 * The passwords are not added to passFound until their text is shown,
 * so if a context suggests several passwords at the same time,
 * use <<pw-found>>.
 * If all the passwords in the block have been tried, show pw-fail text.
 * Also adds an action to say the password.
 */
Macro.add("pw-suggest", {
  tags: ["pw-another", "pw-fail"],
  handler: function() {
    const T = State.temporary;
    const V = State.variables;
    const wantPass = MP_wantPass === V.n_magicPhase;
    const onHold = MP_onHold === V.n_magicPhase
      || MP_exitingHold === V.n_magicPhase;
    if (!wantPass && !onHold) return;

    // check that all clauses have declared passwords
    for (const p of this.payload) {
      if (p.name === "pw-fail") continue;
      const [pw] = p.args;
      if (MT.otherPasswords[pw] == null) {
        throw new Error(`${p.name} ${pw} undeclared password`);
      }
    }

    const tried = JSON.parse(V.n_passTried || "[]");
    const found = JSON.parse(V.n_passFound || "[]");

    let allFailed = true;
    for (const p of this.payload) {
      if (p.name === "pw-fail") continue;
      const [pw] = p.args;
      if (tried.includes(pw)) continue;

      allFailed = false;
      if (!found.includes(pw)) {
        found.push(pw);
        V.n_passFound = JSON.stringify(found);
      }
      $(this.output).wiki(p.contents);
      if (wantPass) {
        const text =`Tell the Sprite, "${pw}".`;
        const code = `$n_passToTry = "${pw}"`;
        T.pwActions ||= "";
        T.pwActions += `<li>[\[\`${text}\`|${sayPassword}][${code}]]</li>`;
      } else {
        $(this.output).append(
          `Nero will have to remember to try it when the
          Sprite is ready for another guess.`);
      }
      break;
    }

    if (allFailed) {
      const p = this.payload.find(p => p.name === "pw-fail");
      if (p !== null) $(this.output).wiki(p?.contents || "");
    }

    if (setup.debug) {
      let debug = !!session.get("pw-debug");
      $("#passages").toggleClass("pw-debug-show", debug);
      const outer = $("<span class=pw-debug>").appendTo(this.output);
      $("<span class=pw-label>").wiki(" ?debugIcon").appendTo(outer)
        .click(() => {
          debug = !debug;
          session.set("pw-debug", debug);
          $("#passages").toggleClass("pw-debug-show", debug);
        });
      if (!pwDebugAlready) {
        pwDebugAlready = true;
        $("<a>").text(" (reset)").appendTo(outer)
          .on("click", () => MT.revisitHere(() => {
            const V = State.variables;
            V.n_passTried = "[]";
            V.g_mutated = true;
          }));
      }
      for (const p of this.payload) {
        if (p.name === "pw-fail") continue;
        const [pw] = p.args;
        if (tried.includes(pw)) continue;
        $("<a>").text(` (try ${pw})`).appendTo(outer)
          .on("click", () => MT.revisitHere(() => {
            const V = State.variables;
            const tried = JSON.parse(V.n_passTried || "[]");
            tried.push(pw);
            V.n_passTried = JSON.stringify(tried);
            V.g_mutated = true;
          }));
      }
    }
  }
});

/** True if Nero is waiting for another password attempt. */
MT.passAgainSoon = () => {
  const V = State.variables;
  const mp = V.n_magicPhase;
  if (MP_onHold === mp || MP_exitingHold === mp) {
    const tried = JSON.parse(V.n_passTried || "[]");
    return tried.length !== 3 || MT.untracedGet("n_candleHorny");
  }
  return false;
};

/** True if Nero is looking for a password. */
MT.passWanted = () => {
  const V = State.variables;
  const mp = V.n_magicPhase;
  if (MP_wantPass === V.n_magicPhase) return true;
  return MT.passAgainSoon();
};

Template.add("sprBadPass", () => {
  const V = State.variables;

  const tried = JSON.parse(V.n_passTried || '["#bug"]');
  const pw = tried[0].replace(/^#/, "");

  let mkp = `<em>${pw}</em> `;
  if (passSprite[pw] != null) {
    mkp = `<em>${passSprite[pw]}</em> `;
  }

  // oldPassword joke detracts from the tried joke
  if (oldPasswords[pw] && tried.length !== 2) {
    mkp += oldPasswords[pw];
  } else {
    mkp += "is not the correct password, ?master";
  }

  switch (tried.length) {
    case 1:
      mkp += " You have two tries";
      break;
    case 2:
      mkp += " You have only one"
        + " <span class=sprite-squish>look up the singular form of the word"
        + " and use it here also remind me to figure out how to bind the"
        + " Sprite to my voice in case I ever capture a mage who knows how"
        + " to activate it</span>";
      break;
    case 3:
      mkp += " You have zero tries";
      break;
    case 4:
      mkp += " You have no more tries";
      break;
    default:
      throw new Error(`unexpected passTried ${V.n_passTried}`);
  }
  return mkp;
});
