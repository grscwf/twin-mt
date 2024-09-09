import type {
  SugarCubeStoryVariables,
  SugarCubeTemporaryVariables,
} from "twine-sugarcube";

/** Enums */
declare global {
  const MP_beforeCast: number;
  const MP_triedMagic: number;
  const MP_wantDevice: number;
  const MP_wantName: number;
  const MP_wantTouch: number;
  const MP_wantPass: number;
  const MP_onHold: number;
  const MP_exitingHold: number;
  const MP_contact: number;
  const MP_lockedOut: number;
  const MP_drained: number;
  const MP_tapLost: number;

  const IC_distant: number;
  const IC_gone: number;
  const IC_guildName: number;
  const IC_mindControl: number;
  const IC_explainTheft: number;
  const IC_obeyMe: number;
  const IC_lickPaw: number;
  const IC_begForMe: number;
  const IC_comfortable: number;
  const IC_whoSentYou: number;
}

declare module "twine-sugarcube" {
  interface SugarCubeSetupObject {
    /** True when ?debug mode. */
    debug?: unknown;

    /** True when ?playtest mode. */
    playtest?: boolean;

    version: string;
  }

  interface SugarCubeStoryVariables {
    /** Brand for var tracing. */
    _trace?: Symbol;

    /** Not yet used. */
    d_knot?: boolean;
    d_knotChoiceMade?: boolean;

    /** Passage has branches. */
    g_branchy?: boolean;

    g_arcChoice?: {
      name: string;
      barbs?: boolean;
      freeze?: boolean;
    };
    g_arcName?: string;

    /** Which choice was taken to go from previous turn to this turn. */
    g_choiceTaken?: number;

    /**
     * When player clicks on a link with a code,
     * g_mtaCode is set to that code.
     * This is to disambiguate multiple links to the same passage.
     */
    g_mtaCode?: string;

    /** Turn that set g_mtaCode. */
    g_mtaCodeTurn?: number;

    /** True if state was manipulated with a debug tool. */
    g_mutated?: boolean;

    /** Set by Notes Popup for Notes Single. */
    g_notesOrigin?: string;

    /** State for MT.rand */
    g_rand0?: number;

    /** State for MT.rand */
    g_rand1?: number;

    /** Story version at start of history */
    g_versionAtStart?: string;

    /** Vars that were read while rendering current passage. */
    g_varsRead?: string;

    /** Latest barbs choice was no. */
    mg_barbsNo?: boolean;

    /** Latest barbs choice was yes. */
    mg_barbsYes?: boolean;

    /** True if trail intro was seen. */
    mg_trailIntroSeen?: boolean;

    /** Latest knot choice was no. */
    mg_knotNo?: boolean;

    /** Latest knot choice was yes. */
    mg_knotYes?: boolean;

    mn_playerLeftStudyWithMirror?: boolean;

    n_afterAction?: string;
    n_afterItch?: string;
    n_afterLook?: string;
    n_afterLookContinue?: string;

    /** True if next passage should announce barbs choice. */
    n_announceBarbsSoon?: boolean;

    /** True if player chose barbed instead of smooth */
    n_barbs?: boolean | undefined;
    n_barbsChoiceMade?: boolean;

    /** Current block shown by nero-caged. */
    n_cagedBlock?: number;

    /** Turn that n_cagedBlock is for. */
    n_cagedBlockTurn?: number;

    n_castEndgame?: boolean | undefined;
    n_castItch?: boolean;
    n_castOil?: boolean;
    n_castYounger?: boolean;

    n_didSomeAction?: boolean;

    n_dimBookcases?: boolean;
    n_dimBooks?: boolean;
    n_dimBottle?: boolean;
    n_dimCabinets?: boolean;
    n_dimCoins?: boolean;
    n_dimCross?: boolean;
    n_dimDesk?: boolean;
    n_dimGlobe?: boolean;
    n_dimGrav?: boolean;
    n_dimKnife?: boolean;
    n_dimMap?: boolean;
    n_dimMirror?: boolean;
    n_dimPainting?: boolean;
    n_dimPenguin?: boolean;
    n_dimStudy?: boolean;
    n_dimWall?: boolean;
    n_dimWand?: boolean;
    n_dimWindow?: boolean;

    n_free?: boolean;

    n_glitched?: boolean;

    n_globeAskedHorny?: boolean;
    n_globeViewed?: boolean;

    n_gravKnown?: boolean;
    n_gravViewed?: boolean;

    n_ivexContext?: number;

    n_kwAnnounce?: string;

    n_lustTextPos?: number;

    n_mageSight?: boolean;

    n_magicPhase?: number;
    n_magicPhaseReached?: number;

    n_mirrorBroken?: boolean;
    n_mirrorMagicKnown?: boolean;

    n_opportunist?: boolean;

    n_passFound?: string;
    n_passTried?: string;

    n_patienceAccel?: boolean;
    n_patienceActions?: number;
    n_patienceLooks?: number;
    n_patiencePassage?: string;
    n_patienceReturn?: number;

    n_spriteQuiet?: boolean;

    n_struggleKnown?: boolean;

    xd_IvexPunishment?: boolean;

    xn_Broken2?: boolean;
    xn_CagedHarsh2?: boolean;
    xn_CagedMild2?: boolean;
    xn_TamedHarsh?: boolean;
    xn_TamedMild?: boolean;
  }

  interface SugarCubeTemporaryVariables {
    /** True if rendering passage as archives entry. */
    isArchive?: boolean;

    /** True if rendering for compute-variants. */
    isSpeculative?: boolean;

    /** True if rendering passage as transcript, archives, or trail entry. */
    isTranscript?: boolean;

    /** Set by Notes button for Notes Popup. */
    notesOrigin?: string;
  }
}
