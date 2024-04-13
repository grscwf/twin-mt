/*
 * Migrates data from saved games and saved session to current version.
 * Currently, this mostly just deletes obsolete data.
 * Sketch of full migration at bottom.
 */

const warnUnknownMetadata = () => {
  for (const [k, v] of MT.mdEntries()) {
    if (!MT.mdKnown(k)) {
      MT.diag("Warning: unknown metadata:", k);
    }
  }
}

const deleteOldStorage = () => {
  session.delete("mt-log-1");
  sessionStorage.removeItem("tabId");
  localStorage.removeItem("vp-1");
  localStorage.removeItem("vp-marks-enabled");
  localStorage.removeItem("tabIdLeases");
}

const migrateMetadata = () => {
  const rec = MT.mdRecord();
  /** @type {(from: string, to: string) => void} */
  const rename = (from, to) => {
    if (rec[from] != null && rec[to] == null) {
      State.metadata.set(to, rec[from]);
      State.metadata.delete(from);
    }
  };
  /** @type {(name: string) => void} */
  const remove = (name) => {
    if (rec[name] != null) {
      State.metadata.delete(name);
    }
  };

  remove("mg_trail");
  remove("mg_notesNoTrailTimes");
  remove("mi_notesNoTrailTimes");
  remove("mi_trail");
  remove("mn_arcBrokenBarbs");
  remove("mn_arcCagedBarbs");
  remove("mn_arcTamedBarbs");
  remove("mn_playerFailedCatch");
  remove("mn_playerLostEndgame");
  remove("mn_playerReadGlitch");
  remove("mn_playerSawIvexRemember");

  rename("mg_notesNoTrail", "mi_notesNoTrail");
  rename("notes", "mi_notes");
}

const migrateNotes = () => {
  const original = State.metadata.get("mi_notes") || "";
  let fixed = original;
  // migrate [passage] to [page]
  fixed = fixed.replace(/^(\[passage\s)/gm, "[page ");
  if (fixed !== original) {
    State.metadata.set("mi_notes", fixed);
  }
}

const checkSessionVersion = () => {
  const ver = State.variables.g_versionAtStart || "unknown version";
  if (ver === setup.version) return;
  MT.diag(
    `Warning: Current session is from a different version of the game.` +
      ` Some things may not work correctly.` +
      ` ("${ver}" !== "${setup.version}")`
  );
}

/** @type {(save: import("twine-sugarcube").SaveObject) => void} */
const checkSaveVersion = (save) => {
  // g_versionAtStart is set by Title Screen, so it's not in the
  // first state, but it will be in the second.
  if (save.state.history.length < 2) return;
  const V = save.state.history[1]?.variables || {};
  const ver = V.g_versionAtStart || "unknown version";
  if (ver === setup.version) return;
  $(document).one(":passagestart", () => {
    MT.diag(
      `Warning: Saved game is from a different version of the game.` +
        ` Some things may not work correctly.` +
        ` ("${ver}" !== "${setup.version}")`
    );
  });
}

const migrateInit = () => {
  deleteOldStorage();
  migrateMetadata();
  migrateNotes();
  // has to be run late, after all the mdDef* calls
  $(document).on(":storyready", warnUnknownMetadata);

  Save.onLoad.add((save) => checkSaveVersion(save));
  $(document).on(":storyready", checkSessionVersion);
}

migrateInit();

/*
 * Sketch of general saved-data migration.
 *
 * If story structure is changed, saved games and current-session will
 * need to be fixed to fit the new structure.
 *
 * Structure changes include: renaming a passage, renaming a state var,
 * renaming a metadata var.
 *
 * Saved games can be fixed with a `Save.onLoad.add(save => ...)` hook:
 * - for metadata, look in g0boot-Metadata `readFromSave`
 * - save.state is an expanded snapshot. see below.
 *
 * Current session needs to be fixed in an init script, before it's loaded.
 * - session.get("state") is a compact snapshot. see below.
 * - fix it, and write it back with session.set("state", state);
 *
 * Fixing a snapshot named `state`
 * - expanded snapshot has state.history
 * - compact snapshot has state.delta
 *   - use State.decodeDelta(state.delta) to get the flat history
 * - for each moment in the flat history
 *   - fix moment.title (passage name)
 *   - fix var names in moment.variables
 */
