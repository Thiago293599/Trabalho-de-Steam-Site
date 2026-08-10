
/* ---------- Tema ---------- */
const THEME_STORAGE_KEY = "corridaTabuleiroTheme";
const themeToggle = document.getElementById("themeToggle");
const themeToggleIcon = document.getElementById("themeToggleIcon");
const themeToggleText = document.getElementById("themeToggleText");

function getCurrentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme, save = true) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;

  if (themeToggleIcon) {
    themeToggleIcon.textContent = nextTheme === "dark" ? "☀" : "☾";
  }

  if (themeToggleText) {
    themeToggleText.textContent = nextTheme === "dark" ? "Claro" : "Escuro";
  }

  if (themeToggle) {
    const label = nextTheme === "dark"
      ? "Ativar modo claro"
      : "Ativar modo escuro";
    themeToggle.setAttribute("aria-label", label);
    themeToggle.title = label;
  }

  if (save) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {}
  }
}

themeToggle?.addEventListener("click", () => {
  applyTheme(getCurrentTheme() === "dark" ? "light" : "dark");
});

applyTheme(getCurrentTheme(), false);

const BOARD_SIZE = 40;
const REQUIRED_SERVER_PROTOCOL = 8;
const MULTIPLAYER_TIMEOUT_MS = 6000;
const colors = ["#ef4444", "#3b82f6", "#22c55e", "#a855f7"];

/* ---------- Baralho temporário interativo ---------- */
const CARD_SPACES = {
  question: [4, 13, 22, 31],
  good: [7, 16, 25, 34],
  bad: [10, 19, 28, 37]
};

const CARD_META = {
  question: { label: "Pergunta", badge: "Carta de Pergunta", icon: "?" },
  good: { label: "Boa Sorte", badge: "Carta de Boa Sorte", icon: "★" },
  bad: { label: "Má Sorte", badge: "Carta de Má Sorte", icon: "!" }
};

const TEMP_CARDS = {
  question: [
    { id: "q1", title: "Conta rápida", text: "Quanto é 2 + 3?", options: ["4", "5", "6"], correctIndex: 1, successDelta: 1, failDelta: -2 },
    { id: "q2", title: "Formas", text: "Quantos lados tem um quadrado?", options: ["3 lados", "4 lados", "5 lados"], correctIndex: 1, successDelta: 0, failDelta: -1 },
    { id: "q3", title: "Número do dado", text: "Qual é o maior número de um dado comum?", options: ["5", "6", "8"], correctIndex: 1, successDelta: 2, failDelta: -2 },
    { id: "q4", title: "Conta simples", text: "Quanto é 10 - 4?", options: ["5", "6", "7"], correctIndex: 1, successDelta: 1, failDelta: -2 },
    { id: "q5", title: "Sequência", text: "Qual número vem depois de 7?", options: ["6", "8", "9"], correctIndex: 1, successDelta: 0, failDelta: -1 }
  ],
  good: [
    { id: "g1", title: "Passo extra", text: "A sorte está do seu lado. Avance 1 casa.", delta: 1 },
    { id: "g2", title: "Caminho livre", text: "Você encontrou um atalho. Avance 2 casas.", delta: 2 },
    { id: "g3", title: "Grande sorte", text: "Ótima jogada! Avance 3 casas.", delta: 3 }
  ],
  bad: [
    { id: "b1", title: "Pequeno atraso", text: "Algo deu errado. Volte 1 casa.", delta: -1 },
    { id: "b2", title: "Caminho bloqueado", text: "Você precisou retornar. Volte 2 casas.", delta: -2 },
    { id: "b3", title: "Azar no caminho", text: "Hoje não foi seu dia. Volte 3 casas.", delta: -3 }
  ]
};

function getCardTypeForSpace(position) {
  const numericPosition = Number(position);
  for (const [type, spaces] of Object.entries(CARD_SPACES)) if (spaces.includes(numericPosition)) return type;
  return null;
}

function createLocalPendingCard(player) {
  const type = getCardTypeForSpace(player?.position);
  if (!type || !player) return null;
  const deck = TEMP_CARDS[type] || [];
  if (!deck.length) return null;
  return { ...deck[Math.floor(Math.random() * deck.length)], type, from: player.position };
}

function formatCardMove(delta) {
  const amount = Math.abs(Number(delta) || 0);
  if (!delta) return "Você permanece na mesma casa.";
  if (delta > 0) return `Avance ${amount} ${amount === 1 ? "casa" : "casas"}.`;
  return `Volte ${amount} ${amount === 1 ? "casa" : "casas"}.`;
}

function applyCardMove(player, delta) {
  const numericDelta = Number(delta) || 0;
  const from = player.position;
  player.position = Math.max(1, Math.min(BOARD_SIZE, from + numericDelta));
  return { from, to: player.position, delta: numericDelta, effect: formatCardMove(numericDelta) };
}

const configuredServerUrl = String(window.GAME_CONFIG?.SERVER_URL || "").trim();

function getServerUrl() {
  if (
    !configuredServerUrl ||
    configuredServerUrl.includes("SEU-PC.SEU-TAILNET") ||
    configuredServerUrl === "undefined"
  ) {
    return "";
  }

  return configuredServerUrl.replace(/\/+$/, "");
}

function getFrontendUrl(path = "") {
  const base = window.location.origin.replace(/\/+$/, "");
  return `${base}${path}`;
}

function serverEndpoint(path) {
  const base = getServerUrl();
  if (!base) return "";
  return `${base}${path.startsWith("/") ? path : "/" + path}`;
}

const mainMenuEl = document.getElementById("mainMenu");
const localMenuEl = document.getElementById("localMenu");
const localPhoneMenuEl = document.getElementById("localPhoneMenu");
const onlineMenuEl = document.getElementById("onlineMenu");
const gameAppEl = document.getElementById("gameApp");
const devMenuEl = document.getElementById("devMenu");
const danceDevScreenEl = document.getElementById("danceDevScreen");

const devBackBtn = document.getElementById("devBackBtn");
const danceLabBackBtn = document.getElementById("danceLabBackBtn");
const devTestDiceBtn = document.getElementById("devTestDiceBtn");
const devTestCardBtn = document.getElementById("devTestCardBtn");
const devMechanicStatus = document.getElementById("devMechanicStatus");
const openDanceLabBtn = document.getElementById("openDanceLabBtn");
const danceLabServerWarning = document.getElementById("danceLabServerWarning");
const danceRoomCode = document.getElementById("danceRoomCode");
const danceJoinUrl = document.getElementById("danceJoinUrl");
const copyDanceJoinUrlBtn = document.getElementById("copyDanceJoinUrlBtn");
const createDanceRoomBtn = document.getElementById("createDanceRoomBtn");
const enableDanceSensorsBtn = document.getElementById("enableDanceSensorsBtn");
const stopDanceSensorsBtn = document.getElementById("stopDanceSensorsBtn");
const resetDanceScoreBtn = document.getElementById("resetDanceScoreBtn");
const danceLabMessage = document.getElementById("danceLabMessage");
const danceLabStatusBadge = document.getElementById("danceLabStatusBadge");
const dancePlayerCount = document.getElementById("dancePlayerCount");
const danceSensorPlayers = document.getElementById("danceSensorPlayers");
const danceTestVideo = document.getElementById("danceTestVideo");
const danceSongAssetStatus = document.getElementById("danceSongAssetStatus");
const danceSongTime = document.getElementById("danceSongTime");
const danceCurrentMove = document.getElementById("danceCurrentMove");
const danceNextMove = document.getElementById("danceNextMove");
const danceVideoJudgements = document.getElementById("danceVideoJudgements");
const dancePictoLane = document.getElementById("dancePictoLane");
const dancePictoItems = document.getElementById("dancePictoItems");
const danceKaraoke = document.getElementById("danceKaraoke");
const danceKaraokeCurrent = document.getElementById("danceKaraokeCurrent");
const danceKaraokeNext = document.getElementById("danceKaraokeNext");
const danceSyncValue = document.getElementById("danceSyncValue");
const danceSyncVideoTime = document.getElementById("danceSyncVideoTime");
const danceSyncTimelineTime = document.getElementById("danceSyncTimelineTime");
const danceSyncDelayBtn = document.getElementById("danceSyncDelayBtn");
const danceSyncAdvanceBtn = document.getElementById("danceSyncAdvanceBtn");
const danceSyncDelayFineBtn = document.getElementById("danceSyncDelayFineBtn");
const danceSyncAdvanceFineBtn = document.getElementById("danceSyncAdvanceFineBtn");
const danceSyncResetBtn = document.getElementById("danceSyncResetBtn");
const dancePlayerShell = document.getElementById("dancePlayerShell");
const dancePlayerControls = dancePlayerShell?.querySelector(".dance-player-controls") || null;
const danceVideoStage = document.getElementById("danceVideoStage");
const danceIpkGoldStageFx = document.getElementById("danceIpkGoldStageFx");
const danceIpkGoldStageImage = document.getElementById("danceIpkGoldStageImage");
const danceIpkGoldStageFlare = document.getElementById("danceIpkGoldStageFlare");
const danceSongAudio = document.getElementById("danceSongAudio");
const danceQualityMode = document.getElementById("danceQualityMode");
const danceQualityActive = document.getElementById("danceQualityActive");
const danceLyricsSize = document.getElementById("danceLyricsSize");
const danceVideoFit = document.getElementById("danceVideoFit");
const dancePlayPauseBtn = document.getElementById("dancePlayPauseBtn");
const dancePlayerClock = document.getElementById("dancePlayerClock");
const danceSeek = document.getElementById("danceSeek");
const danceVolume = document.getElementById("danceVolume");
const danceWindowBtn = document.getElementById("danceWindowBtn");
const danceFullscreenBtn = document.getElementById("danceFullscreenBtn");
const danceScoreBar = document.getElementById("danceScoreBar");
const danceScoreBarFill = document.getElementById("danceScoreBarFill");
const danceStarHud = document.getElementById("danceStarHud");
const danceHudStars = document.getElementById("danceHudStars");
const danceGoldCanvas = document.getElementById("danceGoldCanvas");
const danceYeahFinalVideo = document.getElementById("danceYeahFinalVideo");
const dancePreloadOverlay = document.getElementById("dancePreloadOverlay");
const dancePreloadTitle = document.getElementById("dancePreloadTitle");
const dancePreloadStatus = document.getElementById("dancePreloadStatus");
const dancePreloadFill = document.getElementById("dancePreloadFill");
const dancePreloadPercent = document.getElementById("dancePreloadPercent");
const danceYeahPrepareMsInput = document.getElementById("danceYeahPrepareMs");
const danceYeahLoopRestartMsInput = document.getElementById("danceYeahLoopRestartMs");
const danceYeahFinishOffsetMsInput = document.getElementById("danceYeahFinishOffsetMs");
const danceYeahFinalDelayMsInput = document.getElementById("danceYeahFinalDelayMs");
const danceYeahScalePctInput = document.getElementById("danceYeahScalePct");
const danceYeahApplyBtn = document.getElementById("danceYeahApplyBtn");
const danceYeahPreviewBtn = document.getElementById("danceYeahPreviewBtn");
const danceYeahResetBtn = document.getElementById("danceYeahResetBtn");
const danceYeahDevStatus = document.getElementById("danceYeahDevStatus");

const localModeBtn = document.getElementById("localModeBtn");
const onlineModeBtn = document.getElementById("onlineModeBtn");
const controlsModeBtn = document.getElementById("controlsModeBtn");
const localBackBtn = document.getElementById("localBackBtn");
const sameDeviceBtn = document.getElementById("sameDeviceBtn");
const phoneModeBtn = document.getElementById("phoneModeBtn");
const phoneBackBtn = document.getElementById("phoneBackBtn");
const onlineBackBtn = document.getElementById("onlineBackBtn");
const gameMenuBtn = document.getElementById("gameMenuBtn");

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const onlineJoinForm = document.getElementById("onlineJoinForm");
const onlineCreateForm = document.getElementById("onlineCreateForm");
const confirmJoinBtn = document.getElementById("confirmJoinBtn");
const confirmCreateBtn = document.getElementById("confirmCreateBtn");
const onlinePlayerName = document.getElementById("onlinePlayerName");
const hostPlayerName = document.getElementById("hostPlayerName");
const roomCodeInput = document.getElementById("roomCodeInput");
const onlineMessage = document.getElementById("onlineMessage");
const onlineActions = document.getElementById("onlineActions");
const onlineLobby = document.getElementById("onlineLobby");
const onlineRoomCodeEl = document.getElementById("onlineRoomCode");
const onlineHostBadge = document.getElementById("onlineHostBadge");
const onlineShareBox = document.getElementById("onlineShareBox");
const onlineShareUrl = document.getElementById("onlineShareUrl");
const copyOnlineLinkBtn = document.getElementById("copyOnlineLinkBtn");
const onlineConnectedCount = document.getElementById("onlineConnectedCount");
const onlineLobbyStatus = document.getElementById("onlineLobbyStatus");
const onlinePlayersEl = document.getElementById("onlinePlayers");
const startOnlineGameBtn = document.getElementById("startOnlineGameBtn");
const onlineLobbyHelp = document.getElementById("onlineLobbyHelp");
const serverStatusEl = document.getElementById("serverStatus");
const serverStatusText = document.getElementById("serverStatusText");
const leaveOnlineLobbyBtn = document.getElementById("leaveOnlineLobbyBtn");
const leaveOnlineGameBtn = document.getElementById("leaveOnlineGameBtn");

const boardEl = document.getElementById("board");
const playerCountEl = document.getElementById("playerCount");
const nameFieldsEl = document.getElementById("nameFields");
const setupEl = document.getElementById("setup");
const controlsEl = document.getElementById("gameControls");
const startBtn = document.getElementById("startBtn");
const rollBtn = document.getElementById("rollBtn");
const restartBtn = document.getElementById("restartBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const turnNameEl = document.getElementById("turnName");
const diceEl = document.getElementById("dice");
const diceSceneEl = document.getElementById("diceScene");
const statusEl = document.getElementById("status");
const scoreboardEl = document.getElementById("scoreboard");
const winnerModal = document.getElementById("winnerModal");
const winnerText = document.getElementById("winnerText");
const gameEyebrow = document.getElementById("gameEyebrow");

const cardModal = document.getElementById("cardModal");
const drawnCard = document.getElementById("drawnCard");
const cardTypeBadge = document.getElementById("cardTypeBadge");
const cardIcon = document.getElementById("cardIcon");
const cardPlayerName = document.getElementById("cardPlayerName");
const cardTitle = document.getElementById("cardTitle");
const cardText = document.getElementById("cardText");
const cardAnswers = document.getElementById("cardAnswers");
const cardFeedback = document.getElementById("cardFeedback");
const cardEffect = document.getElementById("cardEffect");
const closeCardBtn = document.getElementById("closeCardBtn");
const cardDeckBtn = document.getElementById("cardDeckBtn");
const deckTypeText = document.getElementById("deckTypeText");
const deckHint = document.getElementById("deckHint");
let activeCardSession = null;
let localPendingCard = null;
let localPendingCardResolve = null;

const phoneServerWarning = document.getElementById("phoneServerWarning");
const phoneLobby = document.getElementById("phoneLobby");
const phoneRoomCode = document.getElementById("phoneRoomCode");
const phoneQr = document.getElementById("phoneQr");
const qrLoading = document.getElementById("qrLoading");
const phoneJoinUrl = document.getElementById("phoneJoinUrl");
const networkChoiceWrap = document.getElementById("networkChoiceWrap");
const networkAddressSelect = document.getElementById("networkAddressSelect");
const copyJoinUrlBtn = document.getElementById("copyJoinUrlBtn");
const connectedPlayers = document.getElementById("connectedPlayers");
const connectedCount = document.getElementById("connectedCount");
const lobbyStatus = document.getElementById("lobbyStatus");
const startPhoneGameBtn = document.getElementById("startPhoneGameBtn");

let players = [];
let currentPlayer = 0;
let gameOver = false;
let gameMode = "same-device";

let remoteSocket = null;
let remoteRoomCode = "";
let remoteState = null;
let joinUrls = [];
let remoteRollAnimating = false;

let onlineRoomCode = "";
let onlinePlayerId = "";
let onlineState = null;
let onlineIsHost = false;
let onlineShareUrls = [];
let onlineRollAnimating = false;
let onlineResumeToken = "";
let onlineResumeInProgress = false;
let onlineExplicitLeave = false;
let serverStatusTimer = null;

let devSensorRoomCode = "";
let devSensorState = null;
let devSensorJoinUrl = "";
let devSensorModeEnabled = false;
let danceTestMoves = [];
let danceTestPictos = [];
let dancePictoAtlas = null;
let danceTestLyrics = [];
let danceLyricLines = [];
let danceLastLyricLineIndex = -999;
// O videoOffset do JSON já aparece refletido nos timestamps da timeline de Rain Over Me
// (o primeiro beat é exatamente 2812 ms). Portanto ele NÃO deve ser subtraído novamente.
let danceSourceVideoOffsetMs = 0;
const DANCE_RAIN_OVER_ME_DEFAULT_SYNC_MS = -1725;
const DANCE_RAIN_OVER_ME_SYNC_STORAGE_KEY = "jdRainOverMeSyncOffsetMsV4";
let danceManualSyncOffsetMs = DANCE_RAIN_OVER_ME_DEFAULT_SYNC_MS;
let danceTestSongLoaded = false;
const devSensorLive = new Map();
const DANCE_MAX_SCORE = 13333;
const DANCE_JUDGEMENTS = ["PERFECT", "SUPER", "GOOD", "OK", "YEAH", "X"];
// Os pictos agora entram mais perto do alvo, como no jogo, em vez de atravessar a tela lentamente.
const DANCE_PICTO_LEAD_MS = 3400;
const DANCE_PICTO_LINGER_MS = 620;
const DANCE_PICTO_SPAWN_PERCENT = 122;
const DANCE_PICTO_TARGET_PERCENT = 22;
// O asset 1P/2P/3P/4P usa exatamente esta faixa vertical para a barra colorida.
// Esses valores vieram do alpha do PNG 3840x2160: y 478..1680.
const DANCE_SCORE_BAR_TOP_PERCENT = (478 / 2160) * 100;
const DANCE_SCORE_BAR_BOTTOM_PERCENT = (1680 / 2160) * 100;
let danceHudAnimationFrame = 0;
let danceJudgeActiveMoveIndex = -1;
let danceJudgeAccumulators = new Map();
const danceLocallyJudgedMoves = new Set();
let danceLastVideoTimeMs = 0;
const DANCE_QUALITY_STORAGE_KEY = "jdVideoQualityModeV1";
const DANCE_LYRICS_SIZE_STORAGE_KEY = "jdLyricsSizeV1";
const DANCE_VIDEO_FIT_STORAGE_KEY = "jdVideoFitV1";
const DANCE_VIDEO_SOURCES = {
  low: "minigames/just-dance/songs/RainOverMe/RainOverMe_Low.mp4",
  medium: "minigames/just-dance/songs/RainOverMe/RainOverMe_Medium.mp4",
  high: "minigames/just-dance/songs/RainOverMe/RainOverMe_High.mp4"
};
const DANCE_AUDIO_SOURCE = "minigames/just-dance/songs/RainOverMe/RainOverMe_Audio.mp3";
const DANCE_PLAYER_AVATAR_SOURCE = "minigames/just-dance/songs/RainOverMe/rainoverme_thumb_kiwi.jpg";
const DANCE_GOLD_SPRITE_BASE = "minigames/just-dance/hud/gold-sprites";
const DANCE_GOLD_SPRITES = Object.freeze({
  start: Object.freeze({
    fps: 60, frameWidth: 960, frameHeight: 540, frames: 100,
    sheets: Object.freeze([
      Object.freeze({ file: "start_00.webp", startFrame: 0, frameCount: 20, columns: 5 }),
      Object.freeze({ file: "start_01.webp", startFrame: 20, frameCount: 20, columns: 5 }),
      Object.freeze({ file: "start_02.webp", startFrame: 40, frameCount: 20, columns: 5 }),
      Object.freeze({ file: "start_03.webp", startFrame: 60, frameCount: 20, columns: 5 }),
      Object.freeze({ file: "start_04.webp", startFrame: 80, frameCount: 20, columns: 5 })
    ])
  }),
  finish: Object.freeze({
    fps: 60, frameWidth: 960, frameHeight: 540, frames: 29,
    sheets: Object.freeze([
      Object.freeze({ file: "finish_00.webp", startFrame: 0, frameCount: 15, columns: 5 }),
      Object.freeze({ file: "finish_01.webp", startFrame: 15, frameCount: 14, columns: 5 })
    ])
  })
});
const DANCE_YEAH_FINAL_SOURCE = "minigames/just-dance/hud/yeah/FinishYeah.mp4";
const DANCE_IPK_GOLD_BASE = "minigames/just-dance/hud/ipk-gold";
const DANCE_GOLD_DEFAULTS = Object.freeze({ prepareMs: 3250, loopRestartMs: 0, finishOffsetMs: 0, finalDelayMs: 0, finalScalePct: 100 });
const DANCE_YEAH_DEV_STORAGE_KEY = "jdYeahDevSettingsIpkV1";
const DANCE_GOLD_FINISH_WINDOW_MS = 850;
let danceGoldPrepareMs = DANCE_GOLD_DEFAULTS.prepareMs;
let danceGoldLoopRestartMs = DANCE_GOLD_DEFAULTS.loopRestartMs;
let danceGoldFinishOffsetMs = DANCE_GOLD_DEFAULTS.finishOffsetMs;
let danceYeahFinalDelayMs = DANCE_GOLD_DEFAULTS.finalDelayMs;
let danceYeahScalePct = DANCE_GOLD_DEFAULTS.finalScalePct;
const DANCE_CRITICAL_IMAGE_SOURCES = [
  DANCE_PLAYER_AVATAR_SOURCE,
  "minigames/just-dance/songs/RainOverMe/pictos-atlas.png",
  "minigames/just-dance/hud/images/Star.png",
  "minigames/just-dance/hud/images/Superstar.png",
  "minigames/just-dance/hud/images/Megastar.png",
  "minigames/just-dance/hud/ipk-base/textures/star_outline.png",
  "minigames/just-dance/hud/ipk-base/textures/bkg_player_new.png",
  "minigames/just-dance/hud/ipk-base/textures/bkg_player_new_outline.png",
  "minigames/just-dance/hud/ipk-base/textures/hud_players_line.png",
  "minigames/just-dance/hud/ipk-base/textures/line_linear_gradient_mask.png",
  `${DANCE_IPK_GOLD_BASE}/feedback_gold.png`,
  `${DANCE_IPK_GOLD_BASE}/feedback_gold_flare.png`,
  `${DANCE_IPK_GOLD_BASE}/feedback_gold_bad.png`
];
const DANCE_QUALITY_LABELS = { low: "Low • 360p", medium: "Medium • 720p", high: "High • 1080p" };
const DANCE_SCORING_BASE = "minigames/just-dance/hud/scoring";
const DANCE_STAR_VISUALS = {
  normal: "minigames/just-dance/hud/images/Star.png",
  superstar: "minigames/just-dance/hud/images/Superstar.png",
  megastar: "minigames/just-dance/hud/images/Megastar.png"
};
let danceHudVisualRank = "normal";
let danceStageResizeObserver = null;
// Texturas/FX extraídos do patch_pc.ipk fornecido para reconstruir os feedbacks originais.
const DANCE_FEEDBACK_ASSETS = {
  X: { image: "feedback_bad.png", flare: null, profile: "bad" },
  GOLD_X: { image: "feedback_gold_bad.png", flare: "feedback_gold_flare.png", profile: "gold-bad" },
  OK: { image: "feedback_ok.png", flare: "feedback_ok_flare.png", profile: "ok" },
  GOOD: { image: "feedback_good.png", flare: "feedback_good_flare.png", profile: "good" },
  SUPER: { image: "feedback_super.png", flare: "feedback_perfect_flare.png", profile: "super" },
  PERFECT: { image: "feedback_perfect.png", flare: "feedback_perfectplus_flare.png", profile: "perfect" },
  YEAH: { image: "feedback_gold.png", flare: "feedback_gold_flare.png", profile: "yeah" }
};
let danceQualityPreference = "auto";
let danceActiveQuality = "low";
let danceAutoCeiling = "high";
let danceQualitySwitching = false;
let danceStallTimes = [];
let dancePlayerSeeking = false;
let danceWindowMode = false;
let danceStartSoundPlayed = false;
const danceHudPreviousScores = new Map();
const danceHudSounds = new Map();
const danceGoldSpriteImages = new Map();
let danceGoldAnimationFrame = 0;
let danceGoldAnimationToken = 0;
let danceGoldAnimationKind = "";
let danceGoldAnimationStartedAt = 0;
let danceGoldAnimationStartFrame = 0;
let danceGoldAnimationFirstPass = false;
let danceGoldAnimationOnComplete = null;
let danceLastYeahFxAt = 0;
let dancePreloadReady = false;
let dancePreloadPromise = null;
let dancePreloadGeneration = 0;
let dancePreloadedVideoQuality = "";
let danceCoreMediaPreloaded = false;
let danceHudSoundsPreloaded = false;
const danceManagedBlobUrls = new Map();
let danceActiveGoldMoveIndex = -1;
let danceStartLoopGoldIndex = -1;
let danceStartLoopFirstPassAudio = null;
let danceStartLoopCycleToken = 0;
const danceFinishedGoldIntroMoves = new Set();
let dancePendingYeahAfterFinish = false;
let danceYeahFinalTimer = 0;
let danceYeahPreviewTimer = 0;


const ONLINE_SESSION_KEY = "corridaTabuleiroOnlineSessionV1";

function showOnly(screen) {
  [mainMenuEl, localMenuEl, localPhoneMenuEl, onlineMenuEl, devMenuEl, danceDevScreenEl, gameAppEl]
    .forEach(el => el.classList.add("hidden"));
  screen.classList.remove("hidden");
}

function showMainMenu() {
  winnerModal.classList.add("hidden");
  closeDevSensorRoom();
  closeRemoteRoom();
  leaveOnlineRoom();
  resetLocalGame(false);
  resetOnlineMenu();
  showOnly(mainMenuEl);
}

function openLocalMode() {
  closeRemoteRoom();
  leaveOnlineRoom();
  resetLocalGame(false);
  showOnly(localMenuEl);
}

function openSameDeviceMode() {
  closeRemoteRoom();
  gameMode = "same-device";
  gameAppEl.classList.remove("remote-board");
  gameEyebrow.textContent = "Jogo local";
  resetLocalGame(false);
  showOnly(gameAppEl);
}

function showLocalMenu() {
  winnerModal.classList.add("hidden");
  closeRemoteRoom();
  leaveOnlineRoom();
  resetLocalGame(false);
  showOnly(localMenuEl);
}

async function openPhoneLocalMode() {
  gameMode = "phone-host";
  resetRemoteLobbyVisuals();
  showOnly(localPhoneMenuEl);
  lobbyStatus.textContent = "Verificando servidor…";

  if (!(await verifyMultiplayerServer({ mode: "phone" }))) return;
  createRemoteRoom();
}

function openControlsMode() {
  // Abre a página do controle no mesmo servidor.
  // O jogador pode digitar o código manualmente.
  window.location.href = "/controller.html";
}

function openOnlineMode() {
  closeRemoteRoom();
  if (gameMode !== "online") {
    leaveOnlineRoom();
  }
  resetOnlineMenu();
  showOnly(onlineMenuEl);
  startServerStatusWatch();
}

function resetOnlineMenu() {
  onlineActions.classList.remove("hidden");
  onlineJoinForm.classList.add("hidden");
  onlineCreateForm.classList.add("hidden");
  onlineLobby.classList.add("hidden");
  onlineMessage.classList.add("hidden");
  onlineMessage.textContent = "";
  onlineShareBox.classList.add("hidden");
  roomCodeInput.value = "";
}

function showOnlineMessage(message) {
  onlineMessage.textContent = message;
  onlineMessage.classList.remove("hidden");
}

function showJoinRoom() {
  onlineCreateForm.classList.add("hidden");
  onlineJoinForm.classList.remove("hidden");
  onlineMessage.classList.add("hidden");
  setTimeout(() => onlinePlayerName.focus(), 0);
}

function showCreateRoom() {
  onlineJoinForm.classList.add("hidden");
  onlineCreateForm.classList.remove("hidden");
  onlineMessage.classList.add("hidden");
  setTimeout(() => hostPlayerName.focus(), 0);
}

function normalizeRoomCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

function setServerStatus(kind, text) {
  if (!serverStatusEl || !serverStatusText) return;

  serverStatusEl.classList.remove("online", "offline", "checking", "reconnecting");
  serverStatusEl.classList.add(kind);
  serverStatusText.textContent = text;
}

function isCompatibleMultiplayerServer(status) {
  return Boolean(
    status?.ok &&
    Number(status?.protocolVersion || 0) >= REQUIRED_SERVER_PROTOCOL &&
    status?.features?.interactiveCards === true &&
    status?.features?.multiplayerCardSync === true
  );
}

async function fetchServerStatus({ timeoutMs = 4000 } = {}) {
  const url = serverEndpoint("/api/status");
  if (!url) return { ok: false, reason: "not-configured", status: null };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store", signal: controller.signal });
    const status = await response.json();
    if (!response.ok || !status?.ok) return { ok: false, reason: "invalid", status };
    return { ok: true, reason: "ok", status };
  } catch {
    return { ok: false, reason: "offline", status: null };
  } finally {
    clearTimeout(timer);
  }
}

function multiplayerUpdateMessage() {
  return "O servidor do PC está em uma versão antiga. Substitua a pasta SERVIDOR_PC por esta versão e execute INICIAR_TUDO.bat novamente. As cartas, perguntas e turnos multiplayer dependem do servidor novo.";
}

async function verifyMultiplayerServer({ mode = "online" } = {}) {
  const result = await fetchServerStatus();

  if (!result.ok) {
    if (mode === "phone") {
      phoneServerWarning.classList.remove("hidden");
      phoneLobby.classList.add("hidden");
      const title = phoneServerWarning.querySelector("strong");
      const text = phoneServerWarning.querySelector("p");
      if (title) title.textContent = result.reason === "not-configured" ? "O servidor não está configurado." : "O servidor do PC não está acessível.";
      if (text) text.textContent = result.reason === "not-configured" ? "Configure o endereço do servidor e publique o site novamente." : "Execute INICIAR_TUDO.bat no PC e confirme que o Tailscale Funnel está ativo.";
    } else if (mode === "dev") {
      danceLabServerWarning?.classList.remove("hidden");
      if (danceLabMessage) danceLabMessage.textContent = result.reason === "not-configured" ? "Configure o endereço do servidor antes de testar sensores." : "Não foi possível alcançar o servidor do PC.";
    } else {
      showOnlineMessage(result.reason === "not-configured" ? "O servidor ainda não foi configurado neste site." : "Não foi possível alcançar o servidor do PC.");
      setServerStatus("offline", "Servidor offline");
    }
    return false;
  }

  const sensorCompatible = result.status?.features?.phoneMotionSensors === true && result.status?.features?.devSensorLab === true && result.status?.features?.danceJudgements === true;
  if (!isCompatibleMultiplayerServer(result.status) || (mode === "dev" && !sensorCompatible)) {
    if (mode === "phone") {
      phoneServerWarning.classList.remove("hidden");
      phoneLobby.classList.add("hidden");
      const title = phoneServerWarning.querySelector("strong");
      const text = phoneServerWarning.querySelector("p");
      if (title) title.textContent = "Servidor antigo detectado.";
      if (text) text.textContent = multiplayerUpdateMessage();
    } else if (mode === "dev") {
      danceLabServerWarning?.classList.remove("hidden");
      if (danceLabMessage) danceLabMessage.textContent = "O servidor aberto ainda não possui suporte ao Sensor Lab. Reinicie usando SERVIDOR_PC desta versão.";
    } else {
      showOnlineMessage(multiplayerUpdateMessage());
      setServerStatus("offline", "Servidor desatualizado");
    }
    return false;
  }

  return true;
}

async function checkServerStatus() {
  setServerStatus("checking", "Verificando servidor…");
  const result = await fetchServerStatus();

  if (!result.ok) {
    setServerStatus("offline", result.reason === "not-configured" ? "Servidor não configurado" : "Servidor offline");
    return false;
  }

  if (!isCompatibleMultiplayerServer(result.status)) {
    setServerStatus("offline", "Servidor desatualizado");
    return false;
  }

  setServerStatus("online", "Servidor online");
  return true;
}

function startServerStatusWatch() {
  checkServerStatus();

  if (serverStatusTimer) {
    clearInterval(serverStatusTimer);
  }

  serverStatusTimer = setInterval(() => {
    if (!onlineMenuEl.classList.contains("hidden") || gameMode === "online") {
      checkServerStatus();
    }
  }, 12000);
}

function readStoredOnlineSession() {
  try {
    const value = localStorage.getItem(ONLINE_SESSION_KEY);
    if (!value) return null;

    const data = JSON.parse(value);

    if (
      !data?.roomCode ||
      !data?.playerId ||
      !data?.resumeToken
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function saveOnlineSession() {
  if (!onlineRoomCode || !onlinePlayerId || !onlineResumeToken) return;

  try {
    localStorage.setItem(
      ONLINE_SESSION_KEY,
      JSON.stringify({
        roomCode: onlineRoomCode,
        playerId: onlinePlayerId,
        resumeToken: onlineResumeToken
      })
    );
  } catch {}
}

function clearStoredOnlineSession() {
  try {
    localStorage.removeItem(ONLINE_SESSION_KEY);
  } catch {}
}

function confirmLeaveOnlineRoom() {
  if (!onlineRoomCode) return true;

  if (onlineIsHost) {
    return window.confirm(
      "Você é o host. Se sair, a sala será encerrada para todos. Deseja continuar?"
    );
  }

  return window.confirm("Deseja sair desta sala?");
}


function resetDeckDisplay() {
  if (!cardDeckBtn) return;
  cardDeckBtn.disabled = true;
  cardDeckBtn.className = "card-deck";
  if (deckTypeText) deckTypeText.textContent = "Cartas";
  if (deckHint) deckHint.textContent = "O baralho será liberado quando você cair em uma casa de carta.";
}

function setDeckPending(type, { interactive = false, hint = "" } = {}) {
  if (!cardDeckBtn) return;
  const meta = CARD_META[type] || CARD_META.question;
  cardDeckBtn.className = `card-deck deck-${type || "question"} is-ready`;
  cardDeckBtn.disabled = !interactive;
  if (deckTypeText) deckTypeText.textContent = meta.label;
  if (deckHint) deckHint.textContent = hint || (interactive ? `Você caiu em uma casa de ${meta.label}. Clique no baralho para puxar a carta.` : `Aguardando o jogador puxar a carta de ${meta.label}.`);
}

function setDeckDrawing(type) {
  if (!cardDeckBtn) return;
  cardDeckBtn.disabled = true;
  cardDeckBtn.className = `card-deck deck-${type || "question"} is-drawing`;
  if (deckHint) deckHint.textContent = "Carta sendo puxada…";
}

function getDeckFlightOffset() {
  if (!cardDeckBtn) return { x: 0, y: 180 };
  const rect = cardDeckBtn.getBoundingClientRect();
  return { x: rect.left + rect.width / 2 - window.innerWidth / 2, y: rect.top + rect.height / 2 - window.innerHeight / 2 };
}

function closeCardModal(immediate = true) {
  if (!cardModal || !drawnCard) return;
  cardModal.classList.add("hidden");
  drawnCard.classList.remove("card-entering", "card-leaving", "card-resolved", "card-nudge");
  if (immediate) activeCardSession = null;
}

function buildAnswerButtons(card, interactive) {
  cardAnswers.innerHTML = "";
  cardAnswers.classList.toggle("hidden", card.type !== "question");
  if (card.type !== "question") return;
  (card.options || []).forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card-answer-option";
    button.dataset.answerIndex = String(index);
    button.textContent = option;
    button.disabled = !interactive;
    cardAnswers.appendChild(button);
  });
}

function showCardEvent(card, playerName = "Jogador", options = {}) {
  if (!card || !cardModal || !drawnCard) return;
  const meta = CARD_META[card.type] || CARD_META.question;
  const interactive = options.interactive !== false;
  const offset = getDeckFlightOffset();
  activeCardSession = { card, playerName, interactive, mode: options.mode || "local", onAnswer: options.onAnswer || null, onContinue: options.onContinue || null, onFinished: options.onFinished || null, waitingForServer: false };
  drawnCard.className = `drawn-card card-${card.type || "question"}`;
  drawnCard.style.setProperty("--deck-x", `${offset.x}px`);
  drawnCard.style.setProperty("--deck-y", `${offset.y}px`);
  cardTypeBadge.textContent = meta.badge; cardIcon.textContent = meta.icon; cardPlayerName.textContent = playerName;
  cardTitle.textContent = card.title || meta.label; cardText.textContent = card.text || "Carta temporária.";
  cardFeedback.className = "card-feedback hidden"; cardFeedback.textContent = "";
  buildAnswerButtons(card, interactive);
  if (card.type === "question") {
    cardEffect.textContent = `${formatCardMove(Number(card.successDelta || 0))} Se errar: ${formatCardMove(Number(card.failDelta || 0))}`;
    closeCardBtn.classList.add("hidden");
  } else {
    cardEffect.textContent = formatCardMove(Number(card.delta || 0));
    closeCardBtn.classList.toggle("hidden", !interactive); closeCardBtn.textContent = "Continuar"; closeCardBtn.disabled = false;
  }
  if (!interactive) {
    cardFeedback.classList.remove("hidden");
    cardFeedback.textContent = card.type === "question" ? "Aguardando o jogador escolher uma resposta…" : "Aguardando o jogador continuar…";
  }
  cardModal.classList.remove("hidden"); void drawnCard.offsetWidth; drawnCard.classList.add("card-entering");
}

function setCardWaiting(text = "Aguardando…") {
  if (!activeCardSession) return;
  activeCardSession.waitingForServer = true;
  cardAnswers.querySelectorAll("button").forEach(button => button.disabled = true);
  closeCardBtn.disabled = true;
  cardFeedback.className = "card-feedback waiting"; cardFeedback.textContent = text;
}

function markAnswerResult(result) {
  if (!activeCardSession) return;
  const options = activeCardSession.card.options || [];
  const correctIndex = options.findIndex(option => option === result.correctAnswer);
  [...cardAnswers.querySelectorAll(".card-answer-option")].forEach((button, index) => {
    button.disabled = true; button.classList.remove("is-correct","is-wrong","is-selected");
    if (index === correctIndex) button.classList.add("is-correct");
    if (index === Number(result.selectedIndex)) { button.classList.add("is-selected"); if (result.correct === false) button.classList.add("is-wrong"); }
  });
}

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function animateCardAway() {
  drawnCard.classList.remove("card-entering"); drawnCard.classList.add("card-leaving");
  await wait(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 30 : 720);
  cardModal.classList.add("hidden"); drawnCard.classList.remove("card-leaving","card-resolved");
}

async function resolveDisplayedCard(result) {
  if (!activeCardSession || !result) return;
  const session = activeCardSession; session.waitingForServer = false;
  if (session.card.type === "question") {
    markAnswerResult(result);
    cardFeedback.className = `card-feedback ${result.correct ? "correct" : "wrong"}`;
    cardFeedback.textContent = result.correct ? `Acertou! ${result.effect || formatCardMove(result.delta)}` : `Errou. A resposta certa era ${result.correctAnswer}. ${result.effect || formatCardMove(result.delta)}`;
  } else {
    cardFeedback.className = "card-feedback correct"; cardFeedback.textContent = result.effect || formatCardMove(result.delta);
  }
  cardEffect.textContent = result.effect || formatCardMove(result.delta); closeCardBtn.classList.add("hidden"); drawnCard.classList.add("card-resolved");
  await wait(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 60 : 900); await animateCardAway();
  activeCardSession = null; session.onFinished?.(result);
}

function waitForLocalDeckDraw(card, player) {
  localPendingCard = { card, player }; setDeckPending(card.type, { interactive: true });
  return new Promise(resolve => { localPendingCardResolve = resolve; });
}
function finishLocalCard(result) {
  const resolver = localPendingCardResolve; localPendingCard = null; localPendingCardResolve = null; resetDeckDisplay(); resolver?.(result);
}

function createBoard() {
  boardEl.innerHTML = "";
  const rows = 5;
  const cols = 8;

  for (let visualRow = rows - 1; visualRow >= 0; visualRow--) {
    const start = visualRow * cols + 1;
    let nums = Array.from({ length: cols }, (_, i) => start + i);
    if (visualRow % 2 === 1) nums.reverse();

    for (const number of nums) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (number === 1) cell.classList.add("start-cell");
      if (number === BOARD_SIZE) cell.classList.add("finish-cell");
      cell.dataset.position = number;

      const label = document.createElement("span");
      label.className = "cell-number";
      label.textContent = number;

      const cardType = getCardTypeForSpace(number);
      let cardMark = null;
      if (cardType) {
        const meta = CARD_META[cardType];
        cell.classList.add("card-cell", `card-cell-${cardType}`);
        cell.setAttribute("aria-label", `Casa ${number}: ${meta.label}`);
        cardMark = document.createElement("span");
        cardMark.className = "cell-card-mark";
        cardMark.textContent = meta.icon;
        cardMark.title = meta.badge;
      }

      const tokens = document.createElement("div");
      tokens.className = "tokens";
      if (cardMark) cell.append(label, cardMark, tokens);
      else cell.append(label, tokens);
      boardEl.appendChild(cell);
    }
  }
}

function updateNameFields() {
  const count = Number(playerCountEl.value);
  const existing = [...nameFieldsEl.querySelectorAll("input")].map(input => input.value);
  nameFieldsEl.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const label = document.createElement("label");
    label.textContent = `Nome do jogador ${i + 1}`;

    const input = document.createElement("input");
    input.maxLength = 18;
    input.value = existing[i] || `Jogador ${i + 1}`;
    label.appendChild(input);
    nameFieldsEl.appendChild(label);
  }
}

let dice3DReadyPromise = null;

function getDice3D() {
  if (window.Dice3D) return Promise.resolve(window.Dice3D);
  if (dice3DReadyPromise) return dice3DReadyPromise;

  dice3DReadyPromise = new Promise(resolve => {
    const finish = () => resolve(window.Dice3D || null);
    window.addEventListener("dice3d-ready", finish, { once: true });
    // Não deixa o jogo preso se o módulo externo não carregar.
    window.setTimeout(finish, 2500);
  });

  return dice3DReadyPromise;
}

function setDiceFace(value) {
  window.__pendingDiceFace = value;
  diceEl?.setAttribute("aria-label", `Dado mostrando ${value}`);

  if (window.Dice3D) {
    window.Dice3D.setFace(value);
  }
}

async function animateDiceTo(value) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setDiceFace(value);
    return;
  }

  const dice3D = await getDice3D();
  if (!dice3D) {
    setDiceFace(value);
    return;
  }

  diceSceneEl.classList.add("is-rolling");
  try {
    await dice3D.rollTo(value);
    window.__pendingDiceFace = value;
    diceEl?.setAttribute("aria-label", `Dado mostrando ${value}`);
  } catch (error) {
    console.error("Falha ao animar o dado 3D:", error);
    setDiceFace(value);
  } finally {
    diceSceneEl.classList.remove("is-rolling");
  }
}

function startGame() {
  gameMode = "same-device";
  const count = Number(playerCountEl.value);
  const inputs = [...nameFieldsEl.querySelectorAll("input")];

  players = Array.from({ length: count }, (_, i) => ({
    name: inputs[i].value.trim() || `Jogador ${i + 1}`,
    position: 1,
    color: colors[i]
  }));

  currentPlayer = 0;
  gameOver = false;
  localPendingCard = null;
  localPendingCardResolve = null;
  closeCardModal();
  resetDeckDisplay();
  setDiceFace(1);
  statusEl.textContent = "Clique em “Jogar dado”.";
  setupEl.classList.add("hidden");
  controlsEl.classList.remove("hidden");
  winnerModal.classList.add("hidden");
  rollBtn.disabled = false;
  gameAppEl.classList.remove("remote-board");
  gameEyebrow.textContent = "Jogo local";
  render();
}

function render() {
  document.querySelectorAll(".tokens").forEach(el => el.innerHTML = "");

  players.forEach((player, index) => {
    const cell = boardEl.querySelector(`[data-position="${player.position}"] .tokens`);
    if (!cell) return;

    const token = document.createElement("div");
    token.className = "token";
    token.style.background = player.color;
    token.title = player.name;
    token.textContent = index + 1;
    cell.appendChild(token);
  });

  scoreboardEl.innerHTML = "";
  players.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "player-row";

    const info = document.createElement("div");
    info.className = "player-info";

    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = player.color;

    const name = document.createElement("span");
    name.className = "player-name";
    name.textContent =
      player.name +
      (player.connected === false ? " • reconectando" : "") +
      (index === currentPlayer && !gameOver ? " ←" : "");

    if (player.connected === false) {
      row.classList.add("player-disconnected");
    }

    const position = document.createElement("span");
    position.className = "position";
    position.textContent = `Casa ${player.position}`;

    info.append(dot, name);
    row.append(info, position);
    scoreboardEl.appendChild(row);
  });

  if (players.length && !gameOver) {
    turnNameEl.textContent = players[currentPlayer]?.name || "—";
    turnNameEl.style.color = players[currentPlayer]?.color || "";
  }
}

async function rollDice() {
  if (gameOver) return;
  if (gameMode === "online") { rollOnlineDice(); return; }
  if (gameMode !== "same-device" || localPendingCard) return;
  rollBtn.disabled = true;
  const player = players[currentPlayer]; const result = Math.floor(Math.random() * 6) + 1;
  statusEl.textContent = `${player.name} está jogando o dado...`; await animateDiceTo(result);
  const target = player.position + result; let cardEvent = null;
  if (target > BOARD_SIZE) statusEl.textContent = `${player.name} tirou ${result}, mas precisa do número exato para chegar à casa ${BOARD_SIZE}.`;
  else {
    player.position = target;
    if (player.position !== BOARD_SIZE) cardEvent = createLocalPendingCard(player);
    if (cardEvent) statusEl.textContent = `${player.name} tirou ${result} e caiu na casa ${target}. Clique no baralho para puxar a carta de ${CARD_META[cardEvent.type].label}.`;
    else statusEl.textContent = `${player.name} tirou ${result} e avançou para a casa ${player.position}.`;
  }
  render();
  if (cardEvent) { await waitForLocalDeckDraw(cardEvent, player); statusEl.textContent = `${player.name} terminou a jogada na casa ${player.position}.`; }
  if (player.position === BOARD_SIZE) { gameOver = true; rollBtn.disabled = true; winnerText.textContent = `${player.name} venceu!`; setTimeout(() => winnerModal.classList.remove("hidden"), 350); return; }
  setTimeout(() => { currentPlayer = (currentPlayer + 1) % players.length; render(); rollBtn.disabled = false; }, 450);
}

function resetLocalGame(rebuildNames = true) {
  closeCardModal();
  resetDeckDisplay();
  localPendingCard = null;
  localPendingCardResolve = null;
  players = [];
  currentPlayer = 0;
  gameOver = false;
  controlsEl.classList.add("hidden");
  setupEl.classList.remove("hidden");
  winnerModal.classList.add("hidden");
  rollBtn.disabled = false;
  statusEl.textContent = "Clique em “Jogar dado”.";
  setDiceFace(1);
  createBoard();
  if (rebuildNames) updateNameFields();
}

function resetToSetup() {
  if (gameMode === "phone-host") {
    if (remoteSocket && remoteRoomCode) {
      remoteSocket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("host:restart-game", { roomCode: remoteRoomCode }, (error, response) => {
        if (error) {
          statusEl.textContent = "O servidor não respondeu ao reiniciar.";
          return;
        }
        if (!response?.ok) statusEl.textContent = response?.message || "Não foi possível reiniciar a partida.";
      });
    }
    return;
  }

  if (gameMode === "online") {
    if (!onlineIsHost) {
      statusEl.textContent = "Somente quem criou a sala pode reiniciar a partida.";
      return;
    }

    if (remoteSocket && onlineRoomCode) {
      restartBtn.disabled = true;
      remoteSocket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("online:restart-game", { roomCode: onlineRoomCode }, (error, response) => {
        if (error) {
          statusEl.textContent = "O servidor não respondeu ao reiniciar.";
          restartBtn.disabled = false;
          return;
        }
        if (!response?.ok) {
          statusEl.textContent = response?.message || "Não foi possível reiniciar a partida.";
          restartBtn.disabled = false;
        }
      });
    }
    return;
  }

  resetLocalGame(true);
}

/* ---------- Modo local com celulares ---------- */

function resetRemoteLobbyVisuals() {
  phoneServerWarning.classList.add("hidden");
  phoneLobby.classList.remove("hidden");
  phoneRoomCode.textContent = "------";
  phoneJoinUrl.textContent = "Preparando endereço…";
  phoneQr.classList.add("hidden");
  qrLoading.classList.remove("hidden");
  qrLoading.textContent = "Preparando QR Code…";
  connectedPlayers.innerHTML = "";
  connectedCount.textContent = "0 de 4";
  lobbyStatus.textContent = "Aguardando celulares…";
  startPhoneGameBtn.disabled = true;
  networkChoiceWrap.classList.add("hidden");
  networkAddressSelect.innerHTML = "";
  joinUrls = [];
  remoteState = null;
  renderLobbyPlayers([]);
}

function ensureRemoteSocket() {
  if (remoteSocket) return true;

  if (typeof io !== "function") {
    phoneServerWarning.classList.remove("hidden");
    phoneLobby.classList.add("hidden");
    return false;
  }

  const serverUrl = getServerUrl();

  if (!serverUrl) {
    if (gameMode === "online") {
      showOnlineMessage(
        "O endereço do servidor ainda não foi configurado. Execute CONFIGURAR_SITE.bat antes de publicar na Netlify."
      );
    } else if (gameMode === "dev-sensor") {
      danceLabServerWarning?.classList.remove("hidden");
      if (danceLabMessage) danceLabMessage.textContent = "O endereço do servidor ainda não foi configurado.";
    } else {
      phoneServerWarning.classList.remove("hidden");
      phoneLobby.classList.add("hidden");
    }
    return false;
  }

  remoteSocket = io(serverUrl, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 700,
    reconnectionDelayMax: 3000
  });

  remoteSocket.on("connect", () => {
    phoneServerWarning.classList.add("hidden");

    if (gameMode === "online" || onlineRoomCode) {
      setServerStatus("online", "Servidor online");

      if (
        onlineRoomCode &&
        onlinePlayerId &&
        onlineResumeToken &&
        !onlineExplicitLeave
      ) {
        resumeOnlineSession({ quiet: true });
      }
    }
  });

  remoteSocket.on("disconnect", () => {
    if (gameMode === "phone-host") {
      lobbyStatus.textContent = "Servidor desconectado.";
      statusEl.textContent = "A conexão com os celulares foi perdida.";
    }

    if (gameMode === "dev-sensor") {
      setDanceLabBadge("idle", "Sem conexão");
      if (danceLabMessage) danceLabMessage.textContent = "A conexão com o servidor foi perdida.";
    }

    if (gameMode === "online" && !onlineExplicitLeave) {
      setServerStatus("reconnecting", "Reconectando…");

      if (!gameAppEl.classList.contains("hidden")) {
        statusEl.textContent =
          "Conexão perdida. Tentando reconectar sem remover você da partida…";
        rollBtn.disabled = true;
      } else if (!onlineMenuEl.classList.contains("hidden")) {
        onlineLobbyStatus.textContent =
          "Conexão perdida. Tentando reconectar…";
      }
    }
  });

  remoteSocket.on("connect_error", () => {
    if (gameMode === "dev-sensor") {
      danceLabServerWarning?.classList.remove("hidden");
      setDanceLabBadge("idle", "Offline");
      if (danceLabMessage) danceLabMessage.textContent = "Falha ao conectar ao servidor do Sensor Lab.";
    }
    if (gameMode === "online") {
      setServerStatus("offline", "Servidor offline");

      if (!onlineRoomCode) {
        showOnlineMessage(
          "Não foi possível conectar ao servidor do jogo."
        );
      }
    }
  });

  remoteSocket.on("room:state", state => {
    if (!state) return;
    if (devSensorRoomCode && state.roomCode === devSensorRoomCode) {
      applyDevSensorState(state);
      return;
    }
    if (state.roomCode !== remoteRoomCode) return;
    applyRemoteState(state);
  });

  remoteSocket.on("dev:sensor-data", payload => {
    if (!payload || payload.roomCode !== devSensorRoomCode) return;
    handleDevSensorData(payload);
  });

  remoteSocket.on("dev:dance-judgement", payload => {
    handleDanceJudgementEvent(payload);
  });

  remoteSocket.on("dev:sensor-mode", payload => {
    if (!payload || payload.roomCode !== devSensorRoomCode) return;
    devSensorModeEnabled = Boolean(payload.enabled);
    setDanceLabBadge(devSensorModeEnabled ? "active" : "idle", devSensorModeEnabled ? "Sensores ativos" : "Parado");
    if (danceLabMessage) danceLabMessage.textContent = devSensorModeEnabled ? "Os celulares receberam o pedido para ativar os sensores." : "Envio de sensores pausado.";
  });

  remoteSocket.on("game:roll", async payload => {
    if (!payload || payload.state?.roomCode !== remoteRoomCode) return;
    await handleRemoteRoll(payload);
  });

  remoteSocket.on("game:card-drawn", payload => handleRemoteCardDrawn(payload));
  remoteSocket.on("game:card-resolved", async payload => { await handleRemoteCardResolved(payload); });

  remoteSocket.on("game:restarted", payload => {
    if (!payload || payload.state?.roomCode !== remoteRoomCode) return;
    winnerModal.classList.add("hidden");
    closeCardModal();
    resetDeckDisplay();
    setDiceFace(1);
    applyRemoteState(payload.state);
  });

  remoteSocket.on("room:closed", payload => {
    if (!payload) return;
    if (payload.roomCode === devSensorRoomCode) {
      devSensorRoomCode = "";
      devSensorState = null;
      devSensorModeEnabled = false;
      devSensorLive.clear();
      resetDanceLabUi(false);
      if (danceLabMessage) danceLabMessage.textContent = payload.message || "A sala de sensores foi encerrada.";
      return;
    }
    if (payload.roomCode !== remoteRoomCode) return;
    remoteRoomCode = "";
    remoteState = null;
    if (gameMode === "phone-host") {
      statusEl.textContent = "A sala local foi encerrada.";
      showOnly(localMenuEl);
    }
  });

  remoteSocket.on("online:state", state => {
    if (!state || state.roomCode !== onlineRoomCode) return;
    applyOnlineState(state);
  });

  remoteSocket.on("online:roll", async payload => {
    if (!payload || payload.state?.roomCode !== onlineRoomCode) return;
    await handleOnlineRoll(payload);
  });

  remoteSocket.on("online:card-drawn", payload => handleOnlineCardDrawn(payload));
  remoteSocket.on("online:card-resolved", async payload => { await handleOnlineCardResolved(payload); });

  remoteSocket.on("online:game-restarted", payload => {
    if (!payload || payload.state?.roomCode !== onlineRoomCode) return;
    winnerModal.classList.add("hidden");
    setDiceFace(1);
    applyOnlineState(payload.state);
  });

  remoteSocket.on("online:room-closed", payload => {
    if (!payload || payload.roomCode !== onlineRoomCode) return;

    const message = payload.message || "A sala foi encerrada.";
    clearStoredOnlineSession();
    clearOnlineClientState();

    resetOnlineMenu();
    showOnly(onlineMenuEl);
    showOnlineMessage(message);
    startServerStatusWatch();
  });

  remoteSocket.on("online:kicked", payload => {
    if (!payload || payload.roomCode !== onlineRoomCode) return;

    const message = payload.message || "Você foi removido da sala.";
    clearStoredOnlineSession();
    clearOnlineClientState();

    resetOnlineMenu();
    showOnly(onlineMenuEl);
    showOnlineMessage(message);
    startServerStatusWatch();
  });

  return true;
}

function createRemoteRoom() {
  if (!ensureRemoteSocket()) return;

  if (!remoteSocket.connected) {
    lobbyStatus.textContent = "Conectando ao servidor local…";
    remoteSocket.once("connect", () => createRemoteRoom());
    return;
  }

  remoteSocket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("host:create-room", {}, (error, response) => {
    if (error) {
      phoneServerWarning.classList.remove("hidden");
      phoneLobby.classList.add("hidden");
      const title = phoneServerWarning.querySelector("strong");
      const text = phoneServerWarning.querySelector("p");
      if (title) title.textContent = "O servidor não respondeu.";
      if (text) text.textContent = "Feche servidores antigos e execute INICIAR_TUDO.bat desta versão.";
      return;
    }
    if (!response?.ok) {
      phoneServerWarning.classList.remove("hidden");
      phoneLobby.classList.add("hidden");
      return;
    }

    remoteRoomCode = response.roomCode;
    joinUrls = [
      getFrontendUrl(`/controller.html?room=${encodeURIComponent(remoteRoomCode)}`)
    ];
    phoneRoomCode.textContent = remoteRoomCode;
    lobbyStatus.textContent = "Sala pronta.";
    setupNetworkChoices();
    applyRemoteState(response.state);
  });
}

function setupNetworkChoices() {
  networkAddressSelect.innerHTML = "";

  if (!joinUrls.length) {
    phoneJoinUrl.textContent = "Nenhum endereço de rede foi encontrado.";
    qrLoading.textContent = "Não foi possível gerar o QR Code.";
    return;
  }

  joinUrls.forEach((url, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    try {
      option.textContent = new URL(url).host;
    } catch {
      option.textContent = url;
    }
    networkAddressSelect.appendChild(option);
  });

  networkChoiceWrap.classList.toggle("hidden", joinUrls.length <= 1);
  updateJoinAddress(0);
}

function updateJoinAddress(index) {
  const url = joinUrls[index];
  if (!url) return;

  phoneJoinUrl.textContent = url;
  qrLoading.classList.remove("hidden");
  phoneQr.classList.add("hidden");
  qrLoading.textContent = "Gerando QR Code…";

  phoneQr.onload = () => {
    qrLoading.classList.add("hidden");
    phoneQr.classList.remove("hidden");
  };
  phoneQr.onerror = () => {
    qrLoading.classList.remove("hidden");
    qrLoading.textContent = "Não foi possível carregar o QR Code.";
    phoneQr.classList.add("hidden");
  };
  phoneQr.src = `${serverEndpoint("/api/qr")}?text=${encodeURIComponent(url)}&t=${Date.now()}`;
}

function renderLobbyPlayers(remotePlayers) {
  connectedPlayers.innerHTML = "";
  connectedCount.textContent = `${remotePlayers.length} de 4`;

  for (let i = 0; i < 4; i++) {
    const slot = document.createElement("div");
    const player = remotePlayers[i];
    slot.className = "connected-player" + (player ? "" : " empty");

    if (player) {
      const dot = document.createElement("span");
      dot.className = "player-slot-dot";
      dot.style.background = player.color;

      const name = document.createElement("strong");
      name.textContent = player.name;
      slot.append(dot, name);
    } else {
      slot.textContent = `Vaga ${i + 1}`;
    }

    connectedPlayers.appendChild(slot);
  }

  startPhoneGameBtn.disabled = remotePlayers.length < 2 || remotePlayers.length > 4;
  lobbyStatus.textContent =
    remotePlayers.length < 2
      ? "Aguardando pelo menos 2 jogadores…"
      : "Pronto para começar.";
}

function applyRemoteState(state) {
  if (!state) return;
  remoteState = state;
  remoteRoomCode = state.roomCode || remoteRoomCode;

  if (!state.started && !state.winnerId && !gameAppEl.classList.contains("hidden")) {
    showOnly(localPhoneMenuEl);
  }

  renderLobbyPlayers(state.players || []);

  if (state.started || state.winnerId) {
    gameMode = "phone-host";
    gameAppEl.classList.add("remote-board");
    gameEyebrow.textContent = "Jogo local • celulares";
    setupEl.classList.add("hidden");
    controlsEl.classList.remove("hidden");
    showOnly(gameAppEl);

    players = (state.players || []).map(p => ({
      id: p.id,
      name: p.name,
      position: p.position,
      color: p.color
    }));
    currentPlayer = Math.max(0, state.currentIndex || 0);
    gameOver = Boolean(state.winnerId);
    render();

    const active = state.players?.[state.currentIndex];
    const pending = state.pendingCard;
    if (pending) {
      const pendingPlayer = state.players?.find(player => player.id === pending.playerId);
      if (pending.drawn) {
        setDeckDrawing(pending.type);
        statusEl.textContent = `${pendingPlayer?.name || "Jogador"} está com uma carta aberta.`;
        if (pending.card && (!activeCardSession || activeCardSession.card?.id !== pending.card.id)) {
          closeCardModal();
          showCardEvent(pending.card, pendingPlayer?.name || "Jogador", { interactive: false, mode: "phone-host" });
        }
      } else {
        setDeckPending(pending.type, { interactive: false, hint: `${pendingPlayer?.name || "O jogador"} precisa tocar no baralho pelo celular.` });
        statusEl.textContent = `${pendingPlayer?.name || "Jogador"} precisa puxar a carta pelo celular.`;
      }
    } else {
      resetDeckDisplay();
      if (!gameOver && active) statusEl.textContent = `Aguardando ${active.name} jogar pelo celular.`;
    }

    if (state.winnerId) {
      const winner = state.players.find(p => p.id === state.winnerId);
      if (winner) {
        winnerText.textContent = `${winner.name} venceu!`;
        setTimeout(() => winnerModal.classList.remove("hidden"), 250);
      }
    }
  }
}

async function handleRemoteRoll(payload) {
  if (remoteRollAnimating) return; remoteRollAnimating = true;
  const rollingPlayer = payload.state?.players?.find(p => p.id === payload.playerId) || remoteState?.players?.find(p => p.id === payload.playerId);
  statusEl.textContent = `${rollingPlayer?.name || "Jogador"} está jogando o dado...`; await animateDiceTo(payload.result); applyRemoteState(payload.state);
  if (!payload.exactMove) statusEl.textContent = `${rollingPlayer?.name || "Jogador"} tirou ${payload.result}, mas precisa do número exato para chegar à casa ${BOARD_SIZE}.`;
  else if (payload.cardPending) statusEl.textContent = `${rollingPlayer?.name || "Jogador"} tirou ${payload.result}, caiu na casa ${payload.rollTo} e precisa puxar uma carta de ${(CARD_META[payload.card?.type] || CARD_META.question).label} no celular.`;
  else if (!payload.state?.winnerId) { const next=payload.state?.players?.[payload.state?.currentIndex]; statusEl.textContent = `${rollingPlayer?.name || "Jogador"} terminou na casa ${payload.to}. ` + (next ? `Agora é a vez de ${next.name}.` : ""); }
  remoteRollAnimating = false;
}
function handleRemoteCardDrawn(payload) {
  if (!payload || payload.state?.roomCode !== remoteRoomCode) return;
  const player=payload.state.players?.find(item=>item.id===payload.playerId); applyRemoteState(payload.state); setDeckDrawing(payload.card?.type);
  showCardEvent(payload.card, player?.name || "Jogador", { interactive:false, mode:"phone-host" });
}
async function handleRemoteCardResolved(payload) {
  if (!payload || payload.state?.roomCode !== remoteRoomCode) return;
  applyRemoteState(payload.state); if (activeCardSession) await resolveDisplayedCard(payload);
  const player=payload.state.players?.find(item=>item.id===payload.playerId); const next=payload.state.players?.[payload.state.currentIndex];
  if (!payload.state.winnerId) statusEl.textContent = `${player?.name || "Jogador"} terminou a carta na casa ${payload.to}. ` + (next ? `Agora é a vez de ${next.name}.` : "");
}

function closeRemoteRoom() {
  if (remoteSocket && remoteRoomCode) {
    remoteSocket.emit("host:close-room", { roomCode: remoteRoomCode });
  }
  remoteRoomCode = "";
  remoteState = null;
  joinUrls = [];
  gameAppEl.classList.remove("remote-board");
}

networkAddressSelect.addEventListener("change", () => {
  updateJoinAddress(Number(networkAddressSelect.value));
});

copyJoinUrlBtn.addEventListener("click", async () => {
  const text = phoneJoinUrl.textContent;
  if (!text || !text.startsWith("http")) return;
  try {
    await navigator.clipboard.writeText(text);
    copyJoinUrlBtn.textContent = "Copiado!";
    setTimeout(() => copyJoinUrlBtn.textContent = "Copiar endereço", 1200);
  } catch {
    copyJoinUrlBtn.textContent = "Selecione e copie o endereço acima";
  }
});

startPhoneGameBtn.addEventListener("click", () => {
  if (!remoteSocket || !remoteRoomCode) return;

  startPhoneGameBtn.disabled = true;
  lobbyStatus.textContent = "Iniciando partida…";

  remoteSocket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("host:start-game", { roomCode: remoteRoomCode }, (error, response) => {
    if (error) {
      lobbyStatus.textContent = "O servidor não respondeu. Reinicie o SERVIDOR_PC desta versão.";
      startPhoneGameBtn.disabled = false;
      return;
    }
    if (!response?.ok) {
      lobbyStatus.textContent = response?.message || "Não foi possível começar.";
      startPhoneGameBtn.disabled = false;
    }
  });
});


/* ---------- Modo Online (hospedado localmente por enquanto) ---------- */

function clearOnlineClientState() {
  onlineRoomCode = "";
  onlinePlayerId = "";
  onlineState = null;
  onlineIsHost = false;
  onlineShareUrls = [];
  onlineRollAnimating = false;
  onlineResumeToken = "";
  onlineResumeInProgress = false;
  leaveOnlineGameBtn?.classList.add("hidden");
  gameAppEl.classList.remove("online-board");
  if (gameMode === "online") {
    gameMode = "same-device";
  }
}

function leaveOnlineRoom({ notifyServer = true, clearSession = true } = {}) {
  onlineExplicitLeave = true;

  if (
    notifyServer &&
    remoteSocket &&
    remoteSocket.connected &&
    onlineRoomCode &&
    onlinePlayerId
  ) {
    remoteSocket.emit("online:leave-room", {
      roomCode: onlineRoomCode,
      playerId: onlinePlayerId
    });
  }

  if (clearSession) {
    clearStoredOnlineSession();
  }

  clearOnlineClientState();

  setTimeout(() => {
    onlineExplicitLeave = false;
  }, 250);
}

async function ensureOnlineConnection(onReady) {
  if (!(await verifyMultiplayerServer({ mode: "online" }))) return;
  setServerStatus("online", "Servidor online");

  if (!ensureRemoteSocket()) {
    showOnlineMessage("O servidor do PC não está disponível. Verifique o servidor Node e o Tailscale Funnel.");
    return;
  }

  if (remoteSocket.connected) {
    onReady();
    return;
  }

  showOnlineMessage("Conectando ao servidor local…");

  const timer = setTimeout(() => {
    showOnlineMessage(
      "O servidor demorou para responder. Feche servidores antigos do jogo e execute novamente o INICIAR_TUDO.bat desta versão."
    );
  }, 6000);

  remoteSocket.once("connect", () => {
    clearTimeout(timer);
    onReady();
  });
}

function getOnlinePlayer() {
  return onlineState?.players?.find(player => player.id === onlinePlayerId) || null;
}


function resumeOnlineSession({ quiet = false } = {}) {
  if (
    onlineResumeInProgress ||
    !onlineRoomCode ||
    !onlinePlayerId ||
    !onlineResumeToken
  ) {
    return;
  }

  if (!remoteSocket || !remoteSocket.connected) {
    return;
  }

  onlineResumeInProgress = true;

  if (!quiet) {
    setServerStatus("reconnecting", "Reconectando…");
    showOnlineMessage("Recuperando sua sala…");
  }

  remoteSocket.timeout(7000).emit(
    "online:resume",
    {
      roomCode: onlineRoomCode,
      playerId: onlinePlayerId,
      resumeToken: onlineResumeToken
    },
    (error, response) => {
      onlineResumeInProgress = false;

      if (error) {
        setServerStatus("reconnecting", "Reconectando…");
        return;
      }

      if (!response?.ok) {
        if (response?.invalidSession) {
          clearStoredOnlineSession();
          clearOnlineClientState();
          resetOnlineMenu();
          showOnly(onlineMenuEl);
          showOnlineMessage(response?.message || "A sala não existe mais.");
        }
        return;
      }

      onlineRoomCode = response.roomCode;
      onlinePlayerId = response.playerId;
      onlineResumeToken = response.resumeToken || onlineResumeToken;
      onlineIsHost = response.state?.hostPlayerId === response.playerId;
      gameMode = "online";

      saveOnlineSession();
      setServerStatus("online", "Servidor online");
      applyOnlineState(response.state);
    }
  );
}

function restoreStoredOnlineSession() {
  const stored = readStoredOnlineSession();
  if (!stored) return false;

  onlineRoomCode = normalizeRoomCode(stored.roomCode);
  onlinePlayerId = String(stored.playerId || "");
  onlineResumeToken = String(stored.resumeToken || "");

  if (
    onlineRoomCode.length !== 6 ||
    !onlinePlayerId ||
    !onlineResumeToken
  ) {
    clearStoredOnlineSession();
    clearOnlineClientState();
    return false;
  }

  gameMode = "online";
  showOnly(onlineMenuEl);
  resetOnlineMenu();
  showOnlineMessage("Reconectando à sua sala…");
  startServerStatusWatch();

  ensureOnlineConnection(() => {
    resumeOnlineSession();
  });

  return true;
}

function kickOnlinePlayer(playerId, playerName) {
  if (!onlineIsHost || !remoteSocket || !onlineRoomCode) return;

  const confirmed = window.confirm(
    `Remover ${playerName} da sala?`
  );

  if (!confirmed) return;

  remoteSocket.emit(
    "online:kick-player",
    {
      roomCode: onlineRoomCode,
      playerId
    },
    response => {
      if (!response?.ok) {
        onlineLobbyStatus.textContent =
          response?.message || "Não foi possível remover o jogador.";
      }
    }
  );
}

function leaveCurrentOnlineRoomFromUi() {
  if (!confirmLeaveOnlineRoom()) return;

  leaveOnlineRoom();
  winnerModal.classList.add("hidden");
  resetOnlineMenu();
  resetLocalGame(false);
  showOnly(mainMenuEl);
}

function renderOnlineLobby(state) {
  if (!state) return;

  onlineActions.classList.add("hidden");
  onlineJoinForm.classList.add("hidden");
  onlineCreateForm.classList.add("hidden");
  onlineMessage.classList.add("hidden");
  onlineLobby.classList.remove("hidden");

  onlineRoomCodeEl.textContent = state.roomCode || onlineRoomCode;
  const connectedNow = state.players.filter(player => player.connected !== false).length;
  onlineConnectedCount.textContent = `${connectedNow} conectados • ${state.players.length} na sala`;

  const me = state.players.find(player => player.id === onlinePlayerId);
  onlineHostBadge.textContent = onlineIsHost ? "Você é o host" : "Conectado";

  onlinePlayersEl.innerHTML = "";

  for (let i = 0; i < 4; i++) {
    const slot = document.createElement("div");
    const player = state.players[i];

    slot.className = "connected-player" + (player ? "" : " empty");

    if (!player) {
      slot.textContent = `Vaga ${i + 1}`;
      onlinePlayersEl.appendChild(slot);
      continue;
    }

    const dot = document.createElement("span");
    dot.className = "player-slot-dot";
    dot.style.background = player.color;

    const name = document.createElement("strong");
    name.textContent = player.name + (player.id === onlinePlayerId ? " (você)" : "");

    slot.append(dot, name);

    if (player.id === state.hostPlayerId) {
      const host = document.createElement("span");
      host.className = "online-player-host";
      host.textContent = "Host";
      slot.appendChild(host);
    }

    if (player.connected === false) {
      const connection = document.createElement("span");
      connection.className = "online-player-status offline";
      connection.textContent = "Reconectando…";
      slot.appendChild(connection);
    }

    if (
      onlineIsHost &&
      player.id !== state.hostPlayerId
    ) {
      const kick = document.createElement("button");
      kick.type = "button";
      kick.className = "online-kick-button";
      kick.textContent = "Expulsar";
      kick.addEventListener("click", () => {
        kickOnlinePlayer(player.id, player.name);
      });
      slot.appendChild(kick);
    }

    onlinePlayersEl.appendChild(slot);
  }

  startOnlineGameBtn.classList.toggle("hidden", !onlineIsHost);
  const hasDisconnectedPlayer = state.players.some(player => player.connected === false);

  startOnlineGameBtn.disabled =
    !onlineIsHost ||
    state.players.length < 2 ||
    state.started ||
    hasDisconnectedPlayer;

  if (onlineIsHost) {
    onlineLobbyStatus.textContent =
      hasDisconnectedPlayer
        ? "Aguardando reconexão de jogador…"
        : state.players.length < 2
          ? "Aguardando pelo menos mais 1 jogador…"
          : "Pronto para começar.";

    onlineLobbyHelp.textContent =
      state.players.length < 2
        ? "São necessários pelo menos 2 jogadores."
        : "Você pode iniciar a partida.";
  } else {
    onlineLobbyStatus.textContent = "Aguardando o host…";
    onlineLobbyHelp.textContent = "A partida começa quando o host apertar “Começar partida”.";
  }

  if (onlineIsHost && onlineShareUrls.length) {
    onlineShareBox.classList.remove("hidden");
    onlineShareUrl.textContent = onlineShareUrls[0];
  } else {
    onlineShareBox.classList.add("hidden");
  }
}

function applyOnlineState(state) {
  if (!state) return;
  onlineState = state; onlineRoomCode = state.roomCode || onlineRoomCode; onlineIsHost = state.hostPlayerId === onlinePlayerId;
  if (!state.started && !state.winnerId) { gameMode="online"; winnerModal.classList.add("hidden"); resetDeckDisplay(); showOnly(onlineMenuEl); renderOnlineLobby(state); return; }
  gameMode="online"; gameAppEl.classList.remove("remote-board"); gameAppEl.classList.add("online-board"); leaveOnlineGameBtn.classList.remove("hidden"); gameEyebrow.textContent=`Jogo online • sala ${onlineRoomCode}`;
  setupEl.classList.add("hidden"); controlsEl.classList.remove("hidden"); showOnly(gameAppEl);
  players=state.players.map(player=>({id:player.id,name:player.name,position:player.position,color:player.color,connected:player.connected!==false})); currentPlayer=Math.max(0,state.currentIndex||0); gameOver=Boolean(state.winnerId); render();
  const active=state.players[state.currentIndex]; const myTurn=!gameOver&&active?.id===onlinePlayerId; const pending=state.pendingCard; const myPending=Boolean(pending&&pending.playerId===onlinePlayerId);
  rollBtn.disabled=!myTurn||onlineRollAnimating||Boolean(pending); restartBtn.textContent=onlineIsHost?"Reiniciar partida":"Somente o host reinicia"; restartBtn.disabled=!onlineIsHost;
  if (pending) {
    const pp=state.players.find(player=>player.id===pending.playerId);
    if (pending.drawn) {
      setDeckDrawing(pending.type);
      statusEl.textContent=myPending?"Sua carta está aberta. Resolva a carta para continuar.":`${pp?.name||"Jogador"} está resolvendo uma carta.`;
      if (pending.card && (!activeCardSession || activeCardSession.card?.id !== pending.card.id)) {
        closeCardModal();
        showCardEvent(pending.card,pp?.name||"Jogador",{interactive:myPending,mode:"online",onAnswer:index=>resolveOnlineCard(index),onContinue:()=>resolveOnlineCard()});
      }
    }
    else { setDeckPending(pending.type,{interactive:myPending&&!onlineRollAnimating,hint:myPending?"Você caiu em uma casa de carta. Clique no baralho para puxar.":`Aguardando ${pp?.name||"o jogador"} puxar a carta.`}); statusEl.textContent=myPending?"Você caiu em uma casa de carta. Clique no baralho.":`Aguardando ${pp?.name||"Jogador"} puxar uma carta.`; }
  } else {
    resetDeckDisplay();
    if (!gameOver&&active) { if (active.connected===false) {statusEl.textContent=`${active.name} perdeu a conexão. A partida aguarda a reconexão por alguns segundos…`; rollBtn.disabled=true;} else statusEl.textContent=myTurn?"É a sua vez. Jogue o dado.":`Aguardando ${active.name} jogar.`; }
  }
  if (gameOver) { const winner=state.players.find(player=>player.id===state.winnerId); rollBtn.disabled=true; winnerText.textContent=winner?.id===onlinePlayerId?"Você venceu!":`${winner?.name||"Jogador"} venceu!`; playAgainBtn.textContent=onlineIsHost?"Jogar novamente":"Fechar"; setTimeout(()=>winnerModal.classList.remove("hidden"),250); } else playAgainBtn.textContent="Jogar novamente";
}

function createOnlineRoom() {
  const name = hostPlayerName.value.trim() || "Jogador";

  confirmCreateBtn.disabled = true;
  showOnlineMessage("Criando sala…");

  ensureOnlineConnection(() => {
    remoteSocket.timeout(6000).emit("online:create-room", { name }, (error, response) => {
      confirmCreateBtn.disabled = false;

      if (error) {
        showOnlineMessage(
          "O servidor não respondeu ao pedido para criar a sala. Provavelmente há uma versão antiga do servidor aberta. Feche-a e execute o INICIAR_TUDO.bat desta versão."
        );
        return;
      }

      if (!response?.ok) {
        showOnlineMessage(response?.message || "Não foi possível criar a sala.");
        return;
      }

      onlineRoomCode = response.roomCode;
      onlinePlayerId = response.playerId;
      onlineResumeToken = response.resumeToken || "";
      onlineShareUrls = [
        getFrontendUrl(`/?onlineRoom=${encodeURIComponent(response.roomCode)}`)
      ];
      onlineIsHost = true;
      gameMode = "online";

      saveOnlineSession();
      applyOnlineState(response.state);
    });
  });
}

function joinOnlineRoom() {
  const name = onlinePlayerName.value.trim() || "Jogador";
  const code = normalizeRoomCode(roomCodeInput.value);

  if (code.length !== 6) {
    showOnlineMessage("Digite o código de 6 caracteres da sala.");
    return;
  }

  confirmJoinBtn.disabled = true;
  showOnlineMessage("Entrando na sala…");

  ensureOnlineConnection(() => {
    remoteSocket.timeout(6000).emit(
      "online:join-room",
      { roomCode: code, name },
      (error, response) => {
        confirmJoinBtn.disabled = false;

        if (error) {
          showOnlineMessage(
            "O servidor não respondeu. Confirme que todos estão usando esta versão do servidor."
          );
          return;
        }

        if (!response?.ok) {
          showOnlineMessage(response?.message || "Não foi possível entrar na sala.");
          return;
        }

        onlineRoomCode = response.roomCode;
        onlinePlayerId = response.playerId;
        onlineResumeToken = response.resumeToken || "";
        onlineShareUrls = [];
        onlineIsHost = response.state?.hostPlayerId === response.playerId;
        gameMode = "online";

        saveOnlineSession();
        applyOnlineState(response.state);
      }
    );
  });
}

function startOnlineGame() {
  if (!remoteSocket || !onlineRoomCode || !onlineIsHost) return;

  startOnlineGameBtn.disabled = true;
  onlineLobbyStatus.textContent = "Iniciando partida…";

  remoteSocket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("online:start-game", { roomCode: onlineRoomCode }, (error, response) => {
    if (error) {
      onlineLobbyStatus.textContent = "O servidor não respondeu. Reinicie o SERVIDOR_PC desta versão.";
      startOnlineGameBtn.disabled = false;
      return;
    }
    if (!response?.ok) {
      onlineLobbyStatus.textContent = response?.message || "Não foi possível começar.";
      startOnlineGameBtn.disabled = false;
    }
  });
}

function rollOnlineDice() {
  if (!remoteSocket || !onlineRoomCode || !onlineState || onlineRollAnimating) return;

  const active = onlineState.players[onlineState.currentIndex];
  if (!active || active.id !== onlinePlayerId) {
    statusEl.textContent = "Ainda não é a sua vez.";
    return;
  }

  if (onlineState.pendingCard) {
    statusEl.textContent = "Finalize a carta antes de jogar novamente.";
    return;
  }

  onlineRollAnimating = true;
  rollBtn.disabled = true;
  statusEl.textContent = "Jogando o dado…";

  remoteSocket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("online:roll", { roomCode: onlineRoomCode }, (error, response) => {
    if (error) {
      onlineRollAnimating = false;
      statusEl.textContent = "O servidor não respondeu. Confirme que o SERVIDOR_PC desta versão está aberto.";
      applyOnlineState(onlineState);
      return;
    }

    if (!response?.ok) {
      onlineRollAnimating = false;
      statusEl.textContent = response?.message || "Não foi possível jogar o dado.";
      applyOnlineState(onlineState);
    }
  });
}

async function handleOnlineRoll(payload) {
  if (payload.state?.roomCode !== onlineRoomCode) return;
  const prev=onlineState; const rp=prev?.players?.find(player=>player.id===payload.playerId)||payload.state?.players?.find(player=>player.id===payload.playerId);
  onlineRollAnimating=true; rollBtn.disabled=true; statusEl.textContent=`${rp?.name||"Jogador"} está jogando o dado…`; await animateDiceTo(payload.result); applyOnlineState(payload.state); onlineRollAnimating=false; applyOnlineState(payload.state);
  if (!payload.exactMove) statusEl.textContent=`${rp?.name||"Jogador"} tirou ${payload.result}, mas precisa do número exato para chegar à casa ${BOARD_SIZE}.`;
  else if (payload.cardPending) statusEl.textContent=payload.playerId===onlinePlayerId?`Você caiu na casa ${payload.rollTo}. Clique no baralho para puxar a carta.`:`${rp?.name||"Jogador"} caiu na casa ${payload.rollTo} e precisa puxar uma carta.`;
  else if (!payload.state?.winnerId) { const next=payload.state.players[payload.state.currentIndex]; statusEl.textContent=`${rp?.name||"Jogador"} terminou na casa ${payload.to}. `+(next?`Agora é a vez de ${next.name}.`:""); }
}
function handleOnlineCardDrawn(payload) {
  if (!payload||payload.state?.roomCode!==onlineRoomCode) return; applyOnlineState(payload.state); const player=payload.state.players?.find(item=>item.id===payload.playerId); const interactive=payload.playerId===onlinePlayerId; setDeckDrawing(payload.card?.type);
  if (!activeCardSession) showCardEvent(payload.card,player?.name||"Jogador",{interactive,mode:"online",onAnswer:index=>resolveOnlineCard(index),onContinue:()=>resolveOnlineCard()});
}
async function handleOnlineCardResolved(payload) {
  if (!payload||payload.state?.roomCode!==onlineRoomCode) return; onlineRollAnimating=true; applyOnlineState(payload.state); if (activeCardSession) await resolveDisplayedCard(payload); onlineRollAnimating=false; applyOnlineState(payload.state);
}
function drawOnlineCard() {
  if (!remoteSocket || !onlineRoomCode || !onlineState?.pendingCard) return;
  const pending = onlineState.pendingCard;
  if (pending.playerId !== onlinePlayerId || pending.drawn) return;

  setDeckDrawing(pending.type);
  remoteSocket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("online:draw-card", { roomCode: onlineRoomCode }, (error, response) => {
    if (error) {
      statusEl.textContent = "O servidor não respondeu ao puxar a carta. Atualize/reinicie o SERVIDOR_PC.";
      applyOnlineState(onlineState);
      return;
    }
    if (!response?.ok) {
      statusEl.textContent = response?.message || "Não foi possível puxar a carta.";
      applyOnlineState(onlineState);
    }
  });
}

function resolveOnlineCard(answerIndex) {
  if (!remoteSocket || !onlineRoomCode || !onlineState?.pendingCard) return;
  setCardWaiting("Verificando a carta…");

  remoteSocket.timeout(MULTIPLAYER_TIMEOUT_MS).emit(
    "online:resolve-card",
    { roomCode: onlineRoomCode, answerIndex },
    (error, response) => {
      if (!activeCardSession) return;

      if (error) {
        activeCardSession.waitingForServer = false;
        cardFeedback.className = "card-feedback wrong";
        cardFeedback.textContent = "O servidor não respondeu. Atualize/reinicie o SERVIDOR_PC e tente novamente.";
        cardAnswers.querySelectorAll("button").forEach(button => button.disabled = false);
        if (activeCardSession.card.type !== "question") closeCardBtn.disabled = false;
        return;
      }

      if (!response?.ok) {
        activeCardSession.waitingForServer = false;
        cardFeedback.className = "card-feedback wrong";
        cardFeedback.textContent = response?.message || "Não foi possível resolver a carta.";
        cardAnswers.querySelectorAll("button").forEach(button => button.disabled = false);
        if (activeCardSession.card.type !== "question") closeCardBtn.disabled = false;
      }
    }
  );
}

function handleGameMenuButton() {
  winnerModal.classList.add("hidden");

  if (gameMode === "online") {
    leaveCurrentOnlineRoomFromUi();
    return;
  }

  showLocalMenu();
}

function handleInitialRoute() {
  const params = new URLSearchParams(window.location.search);
  const code = normalizeRoomCode(params.get("onlineRoom") || "");

  if (restoreStoredOnlineSession()) {
    return;
  }

  if (code.length === 6) {
    showOnly(onlineMenuEl);
    resetOnlineMenu();
    showJoinRoom();
    roomCodeInput.value = code;
    startServerStatusWatch();
    setTimeout(() => onlinePlayerName.focus(), 50);
    return;
  }

  showOnly(mainMenuEl);
}


/* ---------- Menu Dev / Mini Games / Just Dance Sensor Lab ---------- */

const DEV_TEST_CARD = {
  id: "dev-question-1",
  type: "question",
  title: "Teste de carta",
  text: "Qual número vem depois de 4?",
  options: ["3", "5", "6"],
  correctIndex: 1,
  successDelta: 1,
  failDelta: -1
};


function safeLocalStorageGet(key, fallback = "") {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

function safeLocalStorageSet(key, value) {
  try { localStorage.setItem(key, String(value)); } catch {}
}

function getDanceMediaCurrentTime() {
  if (danceSongAudio && Number.isFinite(danceSongAudio.currentTime)) return Number(danceSongAudio.currentTime || 0);
  return Number(danceTestVideo?.currentTime || 0);
}

function getDanceMediaDuration() {
  const audioDuration = Number(danceSongAudio?.duration || 0);
  if (Number.isFinite(audioDuration) && audioDuration > 0) return audioDuration;
  const videoDuration = Number(danceTestVideo?.duration || 0);
  return Number.isFinite(videoDuration) ? videoDuration : 0;
}

function isDanceMediaPlaying() {
  return Boolean(danceSongAudio && !danceSongAudio.paused && !danceSongAudio.ended);
}

function syncDanceVideoToAudio(force = false) {
  if (!danceSongAudio || !danceTestVideo || danceQualitySwitching) return;
  const audioTime = Number(danceSongAudio.currentTime || 0);
  const videoTime = Number(danceTestVideo.currentTime || 0);
  const drift = audioTime - videoTime;
  if (force || Math.abs(drift) > 0.11) {
    try { danceTestVideo.currentTime = Math.max(0, audioTime); } catch {}
  }
}

function updateDancePlayerControls() {
  const current = getDanceMediaCurrentTime();
  const duration = getDanceMediaDuration();
  if (dancePlayPauseBtn) {
    const playing = isDanceMediaPlaying();
    dancePlayPauseBtn.textContent = playing ? "❚❚" : "▶";
    dancePlayPauseBtn.setAttribute("aria-label", playing ? "Pausar" : "Reproduzir");
  }
  if (dancePlayerClock) {
    const currentText = formatDanceTime(current).split(".")[0];
    const durationText = duration > 0 ? formatDanceTime(duration).split(".")[0] : "0:00";
    dancePlayerClock.textContent = `${currentText} / ${durationText}`;
  }
  if (danceSeek && !dancePlayerSeeking && duration > 0) danceSeek.value = String(Math.max(0, Math.min(1000, Math.round(current / duration * 1000))));
}

function danceHudSoundSource(name) {
  const ipk = {
    "gold-intro-ipk": `${DANCE_IPK_GOLD_BASE}/hud_goldmove_intro.wav`,
    "gold-impact-ipk": `${DANCE_IPK_GOLD_BASE}/hud_goldmove_explo.wav`
  };
  return ipk[name] || `minigames/just-dance/hud/sounds/${name}.mp3`;
}

function unlockDanceHudAudio() {
  const names = ["start-song", "star1", "star2", "star3", "star4", "star5", "superstar", "megastar", "yeah", "gold-intro-ipk", "gold-impact-ipk"];
  for (const name of names) {
    if (danceHudSounds.has(name)) continue;
    const audio = new Audio(danceHudSoundSource(name));
    audio.preload = "auto";
    audio.volume = name.startsWith("gold-") ? 0.794 : (name === "yeah" ? 0.86 : 0.72);
    danceHudSounds.set(name, audio);
  }
}

function playDanceHudSound(name) {
  unlockDanceHudAudio();
  const base = danceHudSounds.get(name);
  if (!base) return;
  try {
    const sound = base.cloneNode(true);
    sound.volume = base.volume;
    sound.play().catch(() => {});
  } catch {}
}


function setDancePreloadUi(percent = 0, status = "", title = "Preparando Just Dance…") {
  const value = Math.max(0, Math.min(100, Number(percent || 0)));
  dancePreloadOverlay?.classList.remove("hidden", "error");
  if (dancePreloadTitle) dancePreloadTitle.textContent = title;
  if (dancePreloadStatus && status) dancePreloadStatus.textContent = status;
  if (dancePreloadFill) dancePreloadFill.style.width = `${value.toFixed(1)}%`;
  if (dancePreloadPercent) dancePreloadPercent.textContent = `${Math.round(value)}%`;
}

function setDancePlayerReadyState(ready) {
  dancePreloadReady = Boolean(ready);
  if (dancePlayPauseBtn) dancePlayPauseBtn.disabled = !dancePreloadReady;
  if (danceSeek) danceSeek.disabled = !dancePreloadReady;
  if (danceQualityMode) danceQualityMode.disabled = !dancePreloadReady && Boolean(dancePreloadPromise);
  if (dancePreloadReady) dancePreloadOverlay?.classList.add("hidden");
}

async function fetchDanceBlob(url, onProgress = null) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status} ao carregar ${url}`);
  const total = Math.max(0, Number(response.headers.get("content-length") || 0));
  if (!response.body || typeof response.body.getReader !== "function") {
    const blob = await response.blob();
    onProgress?.(1, blob.size || total || 1, blob.size || total || 1);
    return blob;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value?.byteLength) {
      chunks.push(value);
      received += value.byteLength;
      const ratio = total > 0 ? Math.min(1, received / total) : 0;
      onProgress?.(ratio, received, total);
    }
  }
  const type = response.headers.get("content-type") || "application/octet-stream";
  const blob = new Blob(chunks, { type });
  onProgress?.(1, received, total || received || 1);
  return blob;
}

function replaceDanceManagedBlobUrl(key, blob) {
  const previous = danceManagedBlobUrls.get(key);
  if (previous) {
    try { URL.revokeObjectURL(previous); } catch {}
  }
  const next = URL.createObjectURL(blob);
  danceManagedBlobUrls.set(key, next);
  return next;
}

function waitDanceMediaMetadata(element, timeoutMs = 12000) {
  if (!element) return Promise.resolve();
  if (element.readyState >= 1 && Number.isFinite(element.duration)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let timer = 0;
    const cleanup = () => {
      clearTimeout(timer);
      element.removeEventListener("loadedmetadata", ok);
      element.removeEventListener("error", fail);
    };
    const ok = () => { cleanup(); resolve(); };
    const fail = () => { cleanup(); reject(new Error("Falha ao preparar mídia.")); };
    element.addEventListener("loadedmetadata", ok, { once: true });
    element.addEventListener("error", fail, { once: true });
    timer = window.setTimeout(() => { cleanup(); reject(new Error("Tempo esgotado ao preparar mídia.")); }, timeoutMs);
  });
}

async function installDanceMediaBlob(key, blob, element) {
  if (!element) return;
  const url = replaceDanceManagedBlobUrl(key, blob);
  element.src = url;
  if (element === danceTestVideo || element === danceYeahFinalVideo) element.muted = true;
  element.load();
  await waitDanceMediaMetadata(element);
}

function preloadDanceImage(url) {
  return new Promise(resolve => {
    const image = new Image();
    const finish = () => resolve(true);
    image.onload = finish;
    image.onerror = finish;
    image.decoding = "async";
    image.src = url;
    if (image.complete) finish();
  });
}


async function preloadDanceHudSounds(onProgress = null) {
  if (danceHudSoundsPreloaded) { onProgress?.(1, 1, 1); return; }
  unlockDanceHudAudio();
  const names = ["start-song", "star1", "star2", "star3", "star4", "star5", "superstar", "megastar", "yeah", "gold-intro-ipk", "gold-impact-ipk"];
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    const blob = await fetchDanceBlob(danceHudSoundSource(name));
    const url = replaceDanceManagedBlobUrl(`hud-sound-${name}`, blob);
    const audio = danceHudSounds.get(name);
    if (audio) { audio.src = url; audio.preload = "auto"; audio.load(); }
    onProgress?.((index + 1) / names.length, index + 1, names.length);
  }
  danceHudSoundsPreloaded = true;
}

async function preloadDanceCriticalImages(onProgress = null) {
  const urls = new Set(DANCE_CRITICAL_IMAGE_SOURCES);
  Object.values(DANCE_FEEDBACK_ASSETS).forEach(asset => {
    if (asset.image) urls.add(`${DANCE_SCORING_BASE}/${asset.image}`);
    if (asset.flare) urls.add(`${DANCE_SCORING_BASE}/${asset.flare}`);
  });
  for (let i = 1; i <= 4; i += 1) urls.add(`minigames/just-dance/hud/images/scorebars/${i}P_bar.png`);
  const list = Array.from(urls);
  let done = 0;
  await Promise.all(list.map(async url => {
    await preloadDanceImage(url);
    done += 1;
    onProgress?.(done / Math.max(1, list.length), done, list.length);
  }));
}

function getDanceGoldSpriteSheetUrl(kind, sheet) {
  return `${DANCE_GOLD_SPRITE_BASE}/${sheet.file}`;
}

async function preloadDanceGoldSpriteAtlases(onProgress = null) {
  const entries = [];
  for (const kind of ["start", "finish"]) {
    const meta = DANCE_GOLD_SPRITES[kind];
    meta.sheets.forEach((sheet, index) => entries.push({ kind, sheet, index }));
  }
  let done = 0;
  for (const entry of entries) {
    const key = `${entry.kind}:${entry.sheet.file}`;
    if (danceGoldSpriteImages.has(key)) {
      done += 1;
      onProgress?.(done / entries.length, done, entries.length);
      continue;
    }
    const url = getDanceGoldSpriteSheetUrl(entry.kind, entry.sheet);
    const blob = await fetchDanceBlob(url, ratio => onProgress?.((done + ratio) / entries.length, done, entries.length));
    const objectUrl = replaceDanceManagedBlobUrl(`gold-sprite-${entry.kind}-${entry.index}`, blob);
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Falha ao preparar ${entry.sheet.file}.`));
      img.src = objectUrl;
    });
    danceGoldSpriteImages.set(key, image);
    done += 1;
    onProgress?.(done / entries.length, done, entries.length);
  }
}

async function prepareDancePlayerAssets(targetQuality, options = {}) {
  const quality = DANCE_VIDEO_SOURCES[targetQuality] ? targetQuality : "low";
  if (dancePreloadPromise) {
    try { await dancePreloadPromise; } catch {}
  }
  if (!options.force && dancePreloadReady && dancePreloadedVideoQuality === quality && danceCoreMediaPreloaded) {
    danceActiveQuality = quality;
    updateDanceQualityUi(options.reason || "");
    return true;
  }

  const generation = ++dancePreloadGeneration;
  const task = (async () => {
    setDancePlayerReadyState(false);
    danceQualitySwitching = true;
    if (danceQualityMode) danceQualityMode.disabled = true;
    const label = DANCE_QUALITY_LABELS[quality] || quality;
    const currentTime = Math.max(0, Number(options.currentTime ?? getDanceMediaCurrentTime() ?? 0));

    try {
      const coreNeeded = !danceCoreMediaPreloaded;
      const videoEnd = coreNeeded ? 70 : 95;
      setDancePreloadUi(0, `Carregando vídeo ${label}…`, "Carregando antes de iniciar");
      const videoBlob = await fetchDanceBlob(DANCE_VIDEO_SOURCES[quality], ratio => {
        if (generation !== dancePreloadGeneration) return;
        setDancePreloadUi(videoEnd * ratio, `Carregando vídeo ${label}…`);
      });
      await installDanceMediaBlob("video", videoBlob, danceTestVideo);
      dancePreloadedVideoQuality = quality;

      if (coreNeeded) {
        setDancePreloadUi(70, "Carregando áudio principal…");
        const audioBlob = await fetchDanceBlob(DANCE_AUDIO_SOURCE, ratio => setDancePreloadUi(70 + ratio * 14, "Carregando áudio principal…"));
        await installDanceMediaBlob("audio", audioBlob, danceSongAudio);

        // O Gold Move agora usa somente a HUD nativa do IPK (tapes/texturas + dois WAVs pequenos).
        // Nada de MP4, canvas de frames ou troca de mídia durante a música.
        danceCoreMediaPreloaded = true;
      }

      const hudStart = coreNeeded ? 84 : 95;
      const imageStart = coreNeeded ? 96 : 98;
      setDancePreloadUi(hudStart, "Carregando sons da HUD…");
      await preloadDanceHudSounds(ratio => setDancePreloadUi(hudStart + ratio * (imageStart - hudStart), "Carregando sons da HUD…"));
      setDancePreloadUi(imageStart, "Preparando HUD, pictos e julgamentos…");
      await preloadDanceCriticalImages(ratio => setDancePreloadUi(imageStart + ratio * (100 - imageStart), "Preparando HUD, pictos e julgamentos…"));

      try { if (danceSongAudio) danceSongAudio.currentTime = currentTime; } catch {}
      try { if (danceTestVideo) danceTestVideo.currentTime = currentTime; } catch {}
      danceActiveQuality = quality;
      danceQualitySwitching = false;
      updateDanceQualityUi(options.reason || "");
      setDancePreloadUi(100, "Tudo carregado. Pronto para dançar!", "Pronto");
      setDancePlayerReadyState(true);
      window.setTimeout(() => {
        if (dancePreloadReady) dancePreloadOverlay?.classList.add("hidden");
      }, 220);
      syncDanceVideoToAudio(true);
      updateDancePlayerControls();
      return true;
    } catch (error) {
      danceQualitySwitching = false;
      dancePreloadReady = false;
      if (dancePlayPauseBtn) dancePlayPauseBtn.disabled = true;
      if (danceSeek) danceSeek.disabled = true;
      if (danceQualityMode) danceQualityMode.disabled = false;
      dancePreloadOverlay?.classList.add("error");
      setDancePreloadUi(0, "Não foi possível carregar todos os arquivos. Troque a qualidade ou reabra o teste.", "Falha no carregamento");
      if (danceLabMessage) danceLabMessage.textContent = `Falha ao pré-carregar o player: ${error?.message || error}`;
      console.error("Dance preload failed", error);
      return false;
    }
  })();
  dancePreloadPromise = task;
  const result = await task;
  if (dancePreloadPromise === task) dancePreloadPromise = null;
  if (danceQualityMode) danceQualityMode.disabled = false;
  return result;
}

async function playDanceMedia() {
  if (!danceSongAudio || !danceTestVideo) return;
  if (!dancePreloadReady) {
    const target = danceQualityPreference === "auto" ? chooseAutoDanceQuality() : danceQualityPreference;
    const ready = await prepareDancePlayerAssets(target, { reason: danceQualityPreference === "auto" ? "perfil do aparelho" : "" });
    if (!ready) return;
  }
  unlockDanceHudAudio();
  syncDanceVideoToAudio(true);
  danceTestVideo.muted = true;
  try {
    await danceSongAudio.play();
    await danceTestVideo.play().catch(() => {});
  } catch (error) {
    if (danceLabMessage) danceLabMessage.textContent = "O navegador bloqueou a reprodução. Clique novamente em ▶.";
    return;
  }
  if (!danceStartSoundPlayed && getDanceMediaCurrentTime() < 1.2) {
    danceStartSoundPlayed = true;
    playDanceHudSound("start-song");
  }
  syncDanceMoveJudging();
  startDanceVisualHud();
  updateDancePlayerControls();
}

function pauseDanceMedia() {
  danceSongAudio?.pause();
  danceTestVideo?.pause();
  stopDanceGoldStartLoop();
  stopDanceGoldFinishLoop();
  syncDanceMoveJudging();
  stopDanceVisualHud();
  updateDancePlayerControls();
}

function seekDanceMedia(seconds) {
  const duration = getDanceMediaDuration();
  const target = Math.max(0, Math.min(duration || Infinity, Number(seconds || 0)));
  const wasPlaying = isDanceMediaPlaying();
  try { if (danceSongAudio) danceSongAudio.currentTime = target; } catch {}
  try { if (danceTestVideo) danceTestVideo.currentTime = target; } catch {}
  danceJudgeActiveMoveIndex = -1;
  danceJudgeAccumulators = new Map();
  resetDanceGoldMoveFx(true);
  updateDanceSongTimeline();
  if (wasPlaying) {
    danceTestVideo?.play().catch(() => {});
    startDanceVisualHud();
  }
}

function chooseAutoDanceQuality() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const effective = String(connection?.effectiveType || "").toLowerCase();
  const saveData = Boolean(connection?.saveData);
  const memory = Number(navigator.deviceMemory || 0);
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  const displayWidth = Math.max(screen?.width || 0, window.innerWidth || 0) * Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  if (saveData || effective.includes("2g")) return "low";
  if (effective === "3g" || (memory && memory <= 3)) return "low";
  if (mobile || (memory && memory <= 6) || displayWidth < 1500) return "medium";
  return "high";
}

function danceQualityIndex(value) { return ["low", "medium", "high"].indexOf(value); }

function updateDanceQualityUi(reason = "") {
  if (!danceQualityActive) return;
  const label = DANCE_QUALITY_LABELS[danceActiveQuality] || danceActiveQuality;
  danceQualityActive.textContent = danceQualityPreference === "auto" ? `Auto → ${label}${reason ? ` • ${reason}` : ""}` : label;
}

async function switchDanceVideoQuality(targetQuality, options = {}) {
  const quality = DANCE_VIDEO_SOURCES[targetQuality] ? targetQuality : "low";
  if (dancePreloadedVideoQuality === quality && dancePreloadReady && !options.force) {
    danceActiveQuality = quality;
    updateDanceQualityUi(options.reason || "");
    return true;
  }
  const currentTime = getDanceMediaCurrentTime();
  const wasPlaying = isDanceMediaPlaying();
  if (wasPlaying) pauseDanceMedia();
  const ready = await prepareDancePlayerAssets(quality, { ...options, currentTime });
  if (ready && wasPlaying) await playDanceMedia();
  return ready;
}

async function applyDanceQualityPreference(preference, announce = false) {
  danceQualityPreference = ["auto", "low", "medium", "high"].includes(preference) ? preference : "auto";
  safeLocalStorageSet(DANCE_QUALITY_STORAGE_KEY, danceQualityPreference);
  if (danceQualityMode) danceQualityMode.value = danceQualityPreference;
  const target = danceQualityPreference === "auto" ? chooseAutoDanceQuality() : danceQualityPreference;
  danceAutoCeiling = target;
  const reason = danceQualityPreference === "auto" ? "perfil do aparelho" : "";
  if (announce && danceLabMessage) danceLabMessage.textContent = `Carregando ${DANCE_QUALITY_LABELS[target]} antes de continuar…`;
  const ready = await switchDanceVideoQuality(target, { reason });
  if (announce && ready && danceLabMessage) danceLabMessage.textContent = danceQualityPreference === "auto" ? `Qualidade automática pronta (${DANCE_QUALITY_LABELS[target]}).` : `Qualidade fixa pronta: ${DANCE_QUALITY_LABELS[target]}.`;
  return ready;
}

function handleDancePlaybackStall() {
  if (danceQualityPreference !== "auto" || danceQualitySwitching) return;
  const now = performance.now();
  danceStallTimes = danceStallTimes.filter(t => now - t < 14000);
  danceStallTimes.push(now);
  if (danceStallTimes.length < 2) return;
  danceStallTimes = [];
  const index = danceQualityIndex(danceActiveQuality);
  if (index > 0) {
    const next = ["low", "medium", "high"][index - 1];
    switchDanceVideoQuality(next, { reason: "rede lenta" });
  }
}

function applyDanceLyricsSize(value, save = true) {
  const size = ["small", "normal", "large"].includes(value) ? value : "small";
  if (danceVideoStage) danceVideoStage.dataset.lyricsSize = size;
  if (danceLyricsSize) danceLyricsSize.value = size;
  if (save) safeLocalStorageSet(DANCE_LYRICS_SIZE_STORAGE_KEY, size);
}

function applyDanceVideoFit(value, save = true) {
  const fit = value === "cover" ? "cover" : "contain";
  if (danceVideoStage) danceVideoStage.dataset.videoFit = fit;
  if (danceVideoFit) danceVideoFit.value = fit;
  if (save) safeLocalStorageSet(DANCE_VIDEO_FIT_STORAGE_KEY, fit);
}

function setDanceWindowMode(enabled) {
  danceWindowMode = Boolean(enabled);
  document.body.classList.toggle("dance-window-player", danceWindowMode);
  dancePlayerShell?.classList.toggle("window-mode", danceWindowMode);
  if (danceWindowBtn) danceWindowBtn.textContent = danceWindowMode ? "Sair da janela" : "Preencher janela";
  if (danceWindowMode) setTimeout(() => { syncDanceVideoToAudio(true); syncDanceStageUiScale(); }, 80);
}

async function toggleDanceFullscreen() {
  if (!dancePlayerShell) return;
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await dancePlayerShell.requestFullscreen();
  } catch {
    if (danceLabMessage) danceLabMessage.textContent = "O navegador não permitiu entrar em tela cheia.";
  }
}

function syncDanceStageUiScale() {
  if (!danceVideoStage) return;

  // Em janela cheia/fullscreen, calcula o espaço REAL que sobrou depois dos controles.
  // Assim o 16:9 nunca estoura a tela mesmo quando os controles quebram em duas linhas no celular.
  const immersive = Boolean(dancePlayerShell?.classList.contains("window-mode") || document.fullscreenElement === dancePlayerShell);
  if (immersive && dancePlayerShell) {
    const shellWidth = Math.max(1, dancePlayerShell.clientWidth || window.innerWidth || 960);
    const shellHeight = Math.max(1, dancePlayerShell.clientHeight || window.innerHeight || 540);
    const controlsHeight = Math.max(0, dancePlayerControls?.getBoundingClientRect().height || 0);
    const availableHeight = Math.max(1, shellHeight - controlsHeight);
    const targetWidth = Math.max(1, Math.min(shellWidth, availableHeight * 16 / 9));
    const targetHeight = targetWidth * 9 / 16;
    danceVideoStage.style.width = `${targetWidth}px`;
    danceVideoStage.style.height = `${targetHeight}px`;
    if (dancePlayerControls) dancePlayerControls.style.width = `${targetWidth}px`;
  } else {
    danceVideoStage.style.removeProperty("width");
    danceVideoStage.style.removeProperty("height");
    dancePlayerControls?.style.removeProperty("width");
  }

  const width = Math.max(1, danceVideoStage.getBoundingClientRect().width || 960);
  const scale = width / 960;
  danceVideoStage.style.setProperty("--jd-ui-scale", String(scale));
}

function ensureDanceStageResponsiveScale() {
  syncDanceStageUiScale();
  if (!danceStageResizeObserver && typeof ResizeObserver === "function" && danceVideoStage) {
    danceStageResizeObserver = new ResizeObserver(() => syncDanceStageUiScale());
    danceStageResizeObserver.observe(danceVideoStage);
    if (dancePlayerShell) danceStageResizeObserver.observe(dancePlayerShell);
    if (dancePlayerControls) danceStageResizeObserver.observe(dancePlayerControls);
  }
  window.addEventListener("resize", syncDanceStageUiScale, { passive: true });
}

function danceHudVisualRankForScore(score = 0) {
  const value = Math.max(0, Number(score || 0));
  if (value >= 12000) return "megastar";
  if (value >= 11000) return "superstar";
  return "normal";
}

function applyDanceHudStarRankVisual(score = 0) {
  if (!danceHudStars) return;
  const nextRank = danceHudVisualRankForScore(score);
  const changed = nextRank !== danceHudVisualRank;
  danceHudVisualRank = nextRank;
  danceHudStars.dataset.rankVisual = nextRank;
  danceHudStars.querySelectorAll(".dance-hud-star .fill").forEach(img => {
    const wanted = DANCE_STAR_VISUALS[nextRank] || DANCE_STAR_VISUALS.normal;
    if (img.getAttribute("src") !== wanted) img.setAttribute("src", wanted);
  });
  if (changed) {
    danceHudStars.classList.remove("rank-shift", "rank-shift-superstar", "rank-shift-megastar");
    void danceHudStars.offsetWidth;
    danceHudStars.classList.add("rank-shift", `rank-shift-${nextRank}`);
    window.setTimeout(() => danceHudStars?.classList.remove("rank-shift", "rank-shift-superstar", "rank-shift-megastar"), 1150);
  }
}

function updateDancePlayerHudOverlay(count = 1) {
  const safe = Math.max(1, Math.min(4, Number(count || 1)));
  if (danceScoreBarFill) danceScoreBarFill.src = `minigames/just-dance/hud/images/scorebars/${safe}P_bar.png`;
  if (danceScoreBar) {
    danceScoreBar.dataset.players = String(safe);
    const nativeWidths = { 1: 28, 2: 59, 3: 90, 4: 121 };
    danceScoreBar.style.setProperty("--jd-scorebar-width", `${nativeWidths[safe] / 3840 * 100}%`);
  }
}

function updateDanceScoreBarVisual(score = 0) {
  const safeScore = Math.max(0, Math.min(DANCE_MAX_SCORE, Number(score || 0)));
  const progress = DANCE_MAX_SCORE > 0 ? safeScore / DANCE_MAX_SCORE : 0;

  // A barra é o recorte original do IPK/HUD e sobe inteira dentro de uma máscara.
  // Dessa forma a ponta arredondada original é sempre a borda que lidera o preenchimento.
  if (danceScoreBarFill) {
    danceScoreBarFill.style.transform = `translateY(${((1 - progress) * 100).toFixed(4)}%)`;
    danceScoreBarFill.style.opacity = progress > 0 ? "1" : "0";
  }

  applyDanceHudStarRankVisual(safeScore);

  const barSpan = DANCE_SCORE_BAR_BOTTOM_PERCENT - DANCE_SCORE_BAR_TOP_PERCENT;
  danceHudStars?.querySelectorAll(".dance-hud-star").forEach(slot => {
    const threshold = Number(slot.dataset.threshold || 0);
    const ratio = Math.max(0, Math.min(1, threshold / DANCE_MAX_SCORE));
    const top = DANCE_SCORE_BAR_BOTTOM_PERCENT - barSpan * ratio;
    slot.style.top = `${top.toFixed(4)}%`;
    slot.classList.toggle("filled", safeScore >= threshold);
  });
}

function renderDanceMainHud(dance = {}) {
  const score = Math.max(0, Math.min(DANCE_MAX_SCORE, Number(dance.score || 0)));
  updateDanceScoreBarVisual(score);
}

function pulseDanceHudMilestone(kind = "star") {
  if (!danceStarHud) return;
  danceStarHud.classList.remove("milestone");
  void danceStarHud.offsetWidth;
  danceStarHud.classList.add("milestone");
}

function handleDanceHudMilestones(playerId, oldScore, newScore) {
  if (!playerId) return;
  const before = Number.isFinite(Number(oldScore)) ? Number(oldScore) : Number(danceHudPreviousScores.get(playerId) || 0);
  const after = Math.max(0, Number(newScore || 0));
  danceHudPreviousScores.set(playerId, after);
  const thresholds = [
    [2000,"star1"],[4000,"star2"],[6000,"star3"],[8000,"star4"],[10000,"star5"],[11000,"superstar"],[12000,"megastar"]
  ];
  let last = null;
  for (const [threshold,sound] of thresholds) if (before < threshold && after >= threshold) last = sound;
  if (last) { playDanceHudSound(last); pulseDanceHudMilestone(last); }
}

function clampDanceYeahSetting(value, min, max, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, Math.round(parsed))) : fallback;
}

function renderDanceYeahDevSettings() {
  if (danceYeahPrepareMsInput) danceYeahPrepareMsInput.value = String(danceGoldPrepareMs);
  if (danceYeahLoopRestartMsInput) danceYeahLoopRestartMsInput.value = String(danceGoldLoopRestartMs);
  if (danceYeahFinishOffsetMsInput) danceYeahFinishOffsetMsInput.value = String(danceGoldFinishOffsetMs);
  if (danceYeahFinalDelayMsInput) danceYeahFinalDelayMsInput.value = String(danceYeahFinalDelayMs);
  if (danceYeahScalePctInput) danceYeahScalePctInput.value = String(danceYeahScalePct);
  if (danceYeahFinalVideo) danceYeahFinalVideo.style.setProperty("--dance-yeah-scale", String(danceYeahScalePct / 100));
  if (danceYeahDevStatus) danceYeahDevStatus.textContent = `Frames 60 FPS • Start -${danceGoldPrepareMs} ms • 1ª volta com som • loop mudo em ${danceGoldLoopRestartMs} ms • Finish ${formatDanceSyncOffset(danceGoldFinishOffsetMs)} • Final MP4 +${danceYeahFinalDelayMs} ms • ${danceYeahScalePct}%`;
}

function saveDanceYeahDevSettings() {
  try {
    localStorage.setItem(DANCE_YEAH_DEV_STORAGE_KEY, JSON.stringify({
      prepareMs: danceGoldPrepareMs,
      loopRestartMs: danceGoldLoopRestartMs,
      finishOffsetMs: danceGoldFinishOffsetMs,
      finalDelayMs: danceYeahFinalDelayMs,
      finalScalePct: danceYeahScalePct
    }));
  } catch {}
}

function loadDanceYeahDevSettings() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(DANCE_YEAH_DEV_STORAGE_KEY) || "null"); } catch {}
  danceGoldPrepareMs = clampDanceYeahSetting(saved?.prepareMs, 250, 6000, DANCE_GOLD_DEFAULTS.prepareMs);
  danceGoldLoopRestartMs = clampDanceYeahSetting(saved?.loopRestartMs, 0, 1600, DANCE_GOLD_DEFAULTS.loopRestartMs);
  danceGoldFinishOffsetMs = clampDanceYeahSetting(saved?.finishOffsetMs, -1500, 1500, DANCE_GOLD_DEFAULTS.finishOffsetMs);
  danceYeahFinalDelayMs = clampDanceYeahSetting(saved?.finalDelayMs, 0, 2000, DANCE_GOLD_DEFAULTS.finalDelayMs);
  danceYeahScalePct = clampDanceYeahSetting(saved?.finalScalePct, 60, 160, DANCE_GOLD_DEFAULTS.finalScalePct);
  renderDanceYeahDevSettings();
}

function applyDanceYeahDevSettings(announce = true) {
  danceGoldPrepareMs = clampDanceYeahSetting(danceYeahPrepareMsInput?.value, 250, 6000, DANCE_GOLD_DEFAULTS.prepareMs);
  danceGoldLoopRestartMs = clampDanceYeahSetting(danceYeahLoopRestartMsInput?.value, 0, 1600, DANCE_GOLD_DEFAULTS.loopRestartMs);
  danceGoldFinishOffsetMs = clampDanceYeahSetting(danceYeahFinishOffsetMsInput?.value, -1500, 1500, DANCE_GOLD_DEFAULTS.finishOffsetMs);
  danceYeahFinalDelayMs = clampDanceYeahSetting(danceYeahFinalDelayMsInput?.value, 0, 2000, DANCE_GOLD_DEFAULTS.finalDelayMs);
  danceYeahScalePct = clampDanceYeahSetting(danceYeahScalePctInput?.value, 60, 160, DANCE_GOLD_DEFAULTS.finalScalePct);
  saveDanceYeahDevSettings();
  renderDanceYeahDevSettings();
  resetDanceGoldMoveFx(false);
  if (announce && danceLabMessage) danceLabMessage.textContent = "Configuração do YEAH! aplicada e salva neste navegador.";
}

function resetDanceYeahDevSettings() {
  danceGoldPrepareMs = DANCE_GOLD_DEFAULTS.prepareMs;
  danceGoldLoopRestartMs = DANCE_GOLD_DEFAULTS.loopRestartMs;
  danceGoldFinishOffsetMs = DANCE_GOLD_DEFAULTS.finishOffsetMs;
  danceYeahFinalDelayMs = DANCE_GOLD_DEFAULTS.finalDelayMs;
  danceYeahScalePct = DANCE_GOLD_DEFAULTS.finalScalePct;
  saveDanceYeahDevSettings();
  renderDanceYeahDevSettings();
  resetDanceGoldMoveFx(false);
  if (danceLabMessage) danceLabMessage.textContent = "Configuração do YEAH! restaurada para o padrão.";
}

function scheduleDanceYeahFinalFx() {
  if (danceYeahFinalTimer) window.clearTimeout(danceYeahFinalTimer);
  danceYeahFinalTimer = window.setTimeout(() => {
    danceYeahFinalTimer = 0;
    playDanceYeahFx();
  }, Math.max(0, danceYeahFinalDelayMs));
}

function stopDanceStartLoopFirstAudio() {
  if (!danceStartLoopFirstPassAudio) return;
  try {
    danceStartLoopFirstPassAudio.pause();
    danceStartLoopFirstPassAudio.currentTime = 0;
  } catch {}
  danceStartLoopFirstPassAudio = null;
}

function playDanceStartLoopFirstAudio() {
  stopDanceStartLoopFirstAudio();
  unlockDanceHudAudio();
  const base = danceHudSounds.get("start-loop-first");
  if (!base) return;
  try {
    const sound = base.cloneNode(true);
    sound.volume = base.volume;
    sound.currentTime = 0;
    danceStartLoopFirstPassAudio = sound;
    sound.onended = () => {
      if (danceStartLoopFirstPassAudio === sound) danceStartLoopFirstPassAudio = null;
    };
    sound.play().catch(() => {
      if (danceStartLoopFirstPassAudio === sound) danceStartLoopFirstPassAudio = null;
    });
  } catch {}
}

function getDanceGoldSpriteImage(kind, sheet) {
  return danceGoldSpriteImages.get(`${kind}:${sheet.file}`) || null;
}

function getDanceGoldSpriteSheet(kind, frame) {
  const meta = DANCE_GOLD_SPRITES[kind];
  if (!meta) return null;
  return meta.sheets.find(sheet => frame >= sheet.startFrame && frame < sheet.startFrame + sheet.frameCount) || meta.sheets.at(-1) || null;
}

function drawDanceGoldSpriteFrame(kind, frame) {
  if (!danceGoldCanvas) return false;
  const meta = DANCE_GOLD_SPRITES[kind];
  if (!meta) return false;
  const safeFrame = Math.max(0, Math.min(meta.frames - 1, Math.floor(frame || 0)));
  const sheet = getDanceGoldSpriteSheet(kind, safeFrame);
  const image = sheet ? getDanceGoldSpriteImage(kind, sheet) : null;
  if (!sheet || !image || !image.complete || !image.naturalWidth) return false;
  const localFrame = safeFrame - sheet.startFrame;
  const sx = (localFrame % sheet.columns) * meta.frameWidth;
  const sy = Math.floor(localFrame / sheet.columns) * meta.frameHeight;
  const ctx = danceGoldCanvas.getContext("2d");
  if (!ctx) return false;
  ctx.clearRect(0, 0, danceGoldCanvas.width, danceGoldCanvas.height);
  ctx.drawImage(image, sx, sy, meta.frameWidth, meta.frameHeight, 0, 0, danceGoldCanvas.width, danceGoldCanvas.height);
  return true;
}

function clearDanceGoldCanvas() {
  const ctx = danceGoldCanvas?.getContext("2d");
  if (ctx && danceGoldCanvas) ctx.clearRect(0, 0, danceGoldCanvas.width, danceGoldCanvas.height);
  danceGoldCanvas?.classList.remove("active");
}

function stopDanceGoldCanvasAnimation(kind = "") {
  if (kind && danceGoldAnimationKind && danceGoldAnimationKind !== kind) return false;
  danceGoldAnimationToken += 1;
  if (danceGoldAnimationFrame) cancelAnimationFrame(danceGoldAnimationFrame);
  danceGoldAnimationFrame = 0;
  danceGoldAnimationKind = "";
  danceGoldAnimationOnComplete = null;
  clearDanceGoldCanvas();
  return true;
}

function startDanceGoldCanvasAnimation(kind, { loop = false, restartFrame = 0, onFirstPassEnd = null, onComplete = null } = {}) {
  const meta = DANCE_GOLD_SPRITES[kind];
  if (!meta || !danceGoldCanvas || !danceGoldSpriteImages.size) return false;
  stopDanceGoldCanvasAnimation();
  const token = ++danceGoldAnimationToken;
  const frameMs = 1000 / meta.fps;
  const fullDuration = meta.frames * frameMs;
  const safeRestart = Math.max(0, Math.min(meta.frames - 1, Math.floor(restartFrame || 0)));
  const loopFrames = Math.max(1, meta.frames - safeRestart);
  let firstPassReported = false;
  danceGoldAnimationKind = kind;
  danceGoldAnimationStartedAt = performance.now();
  danceGoldAnimationStartFrame = safeRestart;
  danceGoldAnimationFirstPass = true;
  danceGoldAnimationOnComplete = onComplete;
  danceGoldCanvas.classList.add("active");
  drawDanceGoldSpriteFrame(kind, 0);

  const draw = stamp => {
    if (token !== danceGoldAnimationToken || danceGoldAnimationKind !== kind) return;
    const elapsed = Math.max(0, stamp - danceGoldAnimationStartedAt);
    let frame = 0;

    if (elapsed < fullDuration) {
      frame = Math.min(meta.frames - 1, Math.floor(elapsed / frameMs));
    } else if (loop) {
      if (!firstPassReported) {
        firstPassReported = true;
        danceGoldAnimationFirstPass = false;
        onFirstPassEnd?.();
      }
      const loopElapsed = elapsed - fullDuration;
      frame = safeRestart + (Math.floor(loopElapsed / frameMs) % loopFrames);
    } else {
      drawDanceGoldSpriteFrame(kind, meta.frames - 1);
      const done = danceGoldAnimationOnComplete;
      stopDanceGoldCanvasAnimation(kind);
      done?.();
      return;
    }

    drawDanceGoldSpriteFrame(kind, frame);
    danceGoldAnimationFrame = requestAnimationFrame(draw);
  };
  danceGoldAnimationFrame = requestAnimationFrame(draw);
  return true;
}

function getDanceStartLoopRestartFrame() {
  const meta = DANCE_GOLD_SPRITES.start;
  const maxMs = Math.max(0, Math.floor((meta.frames - 1) * (1000 / meta.fps)));
  const safeMs = Math.max(0, Math.min(danceGoldLoopRestartMs, maxMs));
  return Math.floor(safeMs / (1000 / meta.fps));
}

function startDanceGoldStartLoopPlayback(moveIndex, { requireSongPlaying = true } = {}) {
  if (requireSongPlaying && !isDanceMediaPlaying()) return false;
  if (!danceGoldSpriteImages.size) return false;

  stopDanceGoldFinishLoop();
  stopDanceStartLoopFirstAudio();
  danceStartLoopCycleToken += 1;
  danceStartLoopGoldIndex = moveIndex;

  // Visual idêntico ao Start Loop original, mas reproduzido quadro a quadro em canvas.
  // O áudio continua separado: toca apenas na primeira volta e nunca entra nas repetições.
  playDanceStartLoopFirstAudio();
  return startDanceGoldCanvasAnimation("start", {
    loop: true,
    restartFrame: getDanceStartLoopRestartFrame(),
    onFirstPassEnd: stopDanceStartLoopFirstAudio
  });
}

async function previewDanceYeahSequence() {
  applyDanceYeahDevSettings(false);
  if (!dancePreloadReady || !danceGoldSpriteImages.size || !danceYeahFinalVideo?.src) {
    if (danceLabMessage) danceLabMessage.textContent = "Espere o carregamento chegar a 100% antes de testar o YEAH!.";
    return;
  }
  if (danceYeahPreviewTimer) window.clearTimeout(danceYeahPreviewTimer);
  resetDanceGoldMoveFx(false);
  stopDanceYeahFx();
  startDanceGoldStartLoopPlayback(-999, { requireSongPlaying: false });
  if (danceLabMessage) danceLabMessage.textContent = `Prévia: Start Loop em quadros, 1ª volta com som; loop mudo a partir de ${danceGoldLoopRestartMs} ms…`;
  const previewStartDuration = Math.max(350, Math.min(2500, danceGoldPrepareMs));
  danceYeahPreviewTimer = window.setTimeout(() => {
    danceYeahPreviewTimer = 0;
    stopDanceGoldStartLoop();
    startDanceGoldCanvasAnimation("finish", {
      loop: false,
      onComplete: () => {
        scheduleDanceYeahFinalFx();
        if (danceLabMessage) danceLabMessage.textContent = "Prévia do YEAH! concluída.";
      }
    });
  }, previewStartDuration);
}

function stopDanceYeahFx() {
  if (!danceYeahFinalVideo) return;
  try {
    danceYeahFinalVideo.pause();
    danceYeahFinalVideo.currentTime = 0;
  } catch {}
  danceYeahFinalVideo.onended = null;
  danceYeahFinalVideo.classList.remove("active");
}

function playDanceYeahFx() {
  const now = performance.now();
  if (now - danceLastYeahFxAt < 320) return;
  danceLastYeahFxAt = now;
  if (!danceYeahFinalVideo?.src) return;
  stopDanceYeahFx();
  playDanceHudSound("yeah");
  danceYeahFinalVideo.muted = true;
  danceYeahFinalVideo.volume = 0;
  danceYeahFinalVideo.style.setProperty("--dance-yeah-scale", String(danceYeahScalePct / 100));
  try { danceYeahFinalVideo.currentTime = 0; } catch {}
  danceYeahFinalVideo.classList.add("active");
  danceYeahFinalVideo.onended = () => {
    danceYeahFinalVideo.classList.remove("active");
    danceYeahFinalVideo.onended = null;
  };
  danceYeahFinalVideo.play().catch(() => danceYeahFinalVideo.classList.remove("active"));
}

function stopDanceGoldStartLoop() {
  danceStartLoopCycleToken += 1;
  stopDanceStartLoopFirstAudio();
  if (danceGoldAnimationKind === "start") stopDanceGoldCanvasAnimation("start");
  danceStartLoopGoldIndex = -1;
}

function stopDanceGoldFinishLoop() {
  if (danceGoldAnimationKind === "finish") stopDanceGoldCanvasAnimation("finish");
  danceActiveGoldMoveIndex = -1;
}

function resetDanceGoldMoveFx(clearHistory = true) {
  stopDanceGoldStartLoop();
  stopDanceGoldFinishLoop();
  if (danceYeahFinalTimer) window.clearTimeout(danceYeahFinalTimer);
  danceYeahFinalTimer = 0;
  if (danceYeahPreviewTimer) window.clearTimeout(danceYeahPreviewTimer);
  danceYeahPreviewTimer = 0;
  dancePendingYeahAfterFinish = false;
  if (clearHistory) danceFinishedGoldIntroMoves.clear();
}

function playDanceGoldStartLoop(moveIndex) {
  if (!danceGoldSpriteImages.size || !isDanceMediaPlaying()) return;
  if (danceStartLoopGoldIndex === moveIndex && danceGoldAnimationKind === "start") return;
  startDanceGoldStartLoopPlayback(moveIndex, { requireSongPlaying: true });
}

function playDanceGoldFinishLoop(moveIndex) {
  if (!danceGoldSpriteImages.size || danceFinishedGoldIntroMoves.has(moveIndex)) return;
  danceFinishedGoldIntroMoves.add(moveIndex);
  stopDanceGoldStartLoop();
  stopDanceGoldFinishLoop();
  danceActiveGoldMoveIndex = moveIndex;
  startDanceGoldCanvasAnimation("finish", {
    loop: false,
    onComplete: () => {
      danceActiveGoldMoveIndex = -1;
      if (dancePendingYeahAfterFinish) {
        dancePendingYeahAfterFinish = false;
        scheduleDanceYeahFinalFx();
      }
    }
  });
}

function queueDanceYeahFinalFx() {
  if (danceGoldAnimationKind === "finish") {
    dancePendingYeahAfterFinish = true;
    return;
  }
  scheduleDanceYeahFinalFx();
}

function updateDanceGoldMoveFx(timeMs) {
  if (!danceTestMoves.length) return;
  if (!isDanceMediaPlaying()) {
    if (danceGoldAnimationKind === "start") stopDanceGoldStartLoop();
    return;
  }

  let nextGoldIndex = -1;
  for (let index = 0; index < danceTestMoves.length; index += 1) {
    const move = danceTestMoves[index];
    if (!move?.goldMove) continue;
    const start = Number(move.time || 0);
    const finishStart = start + danceGoldFinishOffsetMs;
    const deltaToFinish = finishStart - timeMs;

    if (deltaToFinish > 0 && deltaToFinish <= danceGoldPrepareMs && nextGoldIndex < 0) nextGoldIndex = index;

    if (timeMs >= finishStart && timeMs <= finishStart + DANCE_GOLD_FINISH_WINDOW_MS) {
      playDanceGoldFinishLoop(index);
      nextGoldIndex = -1;
      break;
    }

    // Ao saltar para depois do Gold Move, não reproduz a introdução atrasada.
    if (timeMs > finishStart + DANCE_GOLD_FINISH_WINDOW_MS) danceFinishedGoldIntroMoves.add(index);
  }

  if (nextGoldIndex >= 0) playDanceGoldStartLoop(nextGoldIndex);
  else if (danceStartLoopGoldIndex >= 0) stopDanceGoldStartLoop();
}

// ---------- Gold Move nativo do patch_pc.ipk ----------
// patch_pc.ipk contém hud_pregoldmove/hud_goldmove, feedback_gold.tape,
// feedback_gold_bad.tape, feedbacks_move.tape e as texturas de YEAH/flare.
// A implementação abaixo substitui integralmente o pipeline StartLoop/FinishLoop/FinishYeah.
const danceIpkGoldIntroMoves = new Set();
let danceIpkGoldIntroAudio = null;
let danceIpkGoldImpactAudio = null;
let danceIpkGoldLastImpactAt = 0;

function stopDanceIpkGoldIntroAudio() {
  if (!danceIpkGoldIntroAudio) return;
  try { danceIpkGoldIntroAudio.pause(); danceIpkGoldIntroAudio.currentTime = 0; } catch {}
  danceIpkGoldIntroAudio = null;
}

function playDanceIpkGoldIntroAudio() {
  stopDanceIpkGoldIntroAudio();
  unlockDanceHudAudio();
  const base = danceHudSounds.get("gold-intro-ipk");
  if (!base) return;
  try {
    const sound = base.cloneNode(true);
    sound.volume = base.volume;
    sound.currentTime = 0;
    danceIpkGoldIntroAudio = sound;
    sound.onended = () => { if (danceIpkGoldIntroAudio === sound) danceIpkGoldIntroAudio = null; };
    sound.play().catch(() => { if (danceIpkGoldIntroAudio === sound) danceIpkGoldIntroAudio = null; });
  } catch {}
}

function playDanceIpkGoldImpactAudio() {
  const now = performance.now();
  if (now - danceIpkGoldLastImpactAt < 260) return;
  danceIpkGoldLastImpactAt = now;
  unlockDanceHudAudio();
  const base = danceHudSounds.get("gold-impact-ipk");
  if (!base) return;
  try {
    if (danceIpkGoldImpactAudio) { danceIpkGoldImpactAudio.pause(); danceIpkGoldImpactAudio.currentTime = 0; }
    const sound = base.cloneNode(true);
    sound.volume = base.volume;
    sound.currentTime = 0;
    danceIpkGoldImpactAudio = sound;
    sound.onended = () => { if (danceIpkGoldImpactAudio === sound) danceIpkGoldImpactAudio = null; };
    sound.play().catch(() => { if (danceIpkGoldImpactAudio === sound) danceIpkGoldImpactAudio = null; });
  } catch {}
}

let danceIpkGoldStageTimer = 0;
let danceIpkGoldLastStageFxAt = 0;

function hideDanceIpkGoldStageFx() {
  if (danceIpkGoldStageTimer) window.clearTimeout(danceIpkGoldStageTimer);
  danceIpkGoldStageTimer = 0;
  danceIpkGoldStageFx?.classList.remove("active");
}

function showDanceIpkGoldStageFx(kind = "yeah") {
  if (!danceIpkGoldStageFx || !danceIpkGoldStageImage || !danceIpkGoldStageFlare) return false;
  const now = performance.now();
  if (now - danceIpkGoldLastStageFxAt < 220) return false;
  danceIpkGoldLastStageFxAt = now;
  const isMiss = kind === "miss";
  danceIpkGoldStageImage.src = `${DANCE_IPK_GOLD_BASE}/${isMiss ? "feedback_gold_bad.png" : "feedback_gold.png"}`;
  danceIpkGoldStageImage.alt = isMiss ? "X" : "YEAH!";
  danceIpkGoldStageFlare.src = `${DANCE_IPK_GOLD_BASE}/feedback_gold_flare.png`;
  danceIpkGoldStageFx.classList.toggle("miss", isMiss);
  danceIpkGoldStageFx.classList.remove("active");
  void danceIpkGoldStageFx.offsetWidth;
  danceIpkGoldStageFx.classList.add("active");
  if (danceIpkGoldStageTimer) window.clearTimeout(danceIpkGoldStageTimer);
  danceIpkGoldStageTimer = window.setTimeout(() => {
    danceIpkGoldStageTimer = 0;
    danceIpkGoldStageFx?.classList.remove("active");
  }, isMiss ? 760 : 1220);
  return true;
}

function renderDanceYeahDevSettings() {
  if (danceYeahPrepareMsInput) danceYeahPrepareMsInput.value = String(danceGoldPrepareMs);
  if (danceYeahFinishOffsetMsInput) danceYeahFinishOffsetMsInput.value = String(danceGoldFinishOffsetMs);
  if (danceYeahDevStatus) danceYeahDevStatus.textContent = `IPK nativo • Pré -${danceGoldPrepareMs} ms • Impacto ${formatDanceSyncOffset(danceGoldFinishOffsetMs)} • YEAH visual 1,15 s + flare`;
}

function saveDanceYeahDevSettings() {
  try { localStorage.setItem(DANCE_YEAH_DEV_STORAGE_KEY, JSON.stringify({ prepareMs: danceGoldPrepareMs, finishOffsetMs: danceGoldFinishOffsetMs })); } catch {}
}

function loadDanceYeahDevSettings() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(DANCE_YEAH_DEV_STORAGE_KEY) || "null"); } catch {}
  danceGoldPrepareMs = clampDanceYeahSetting(saved?.prepareMs, 500, 6000, DANCE_GOLD_DEFAULTS.prepareMs);
  danceGoldFinishOffsetMs = clampDanceYeahSetting(saved?.finishOffsetMs, -1500, 1500, DANCE_GOLD_DEFAULTS.finishOffsetMs);
  renderDanceYeahDevSettings();
}

function applyDanceYeahDevSettings(announce = true) {
  danceGoldPrepareMs = clampDanceYeahSetting(danceYeahPrepareMsInput?.value, 500, 6000, DANCE_GOLD_DEFAULTS.prepareMs);
  danceGoldFinishOffsetMs = clampDanceYeahSetting(danceYeahFinishOffsetMsInput?.value, -1500, 1500, DANCE_GOLD_DEFAULTS.finishOffsetMs);
  saveDanceYeahDevSettings();
  renderDanceYeahDevSettings();
  resetDanceGoldMoveFx(false);
  if (announce && danceLabMessage) danceLabMessage.textContent = "Gold Move IPK aplicado. Nenhum vídeo/loop é usado.";
}

function resetDanceYeahDevSettings() {
  danceGoldPrepareMs = DANCE_GOLD_DEFAULTS.prepareMs;
  danceGoldFinishOffsetMs = DANCE_GOLD_DEFAULTS.finishOffsetMs;
  saveDanceYeahDevSettings();
  renderDanceYeahDevSettings();
  resetDanceGoldMoveFx(false);
  if (danceLabMessage) danceLabMessage.textContent = "Gold Move restaurado para o timing nativo do IPK.";
}

function resetDanceGoldMoveFx(clearHistory = true) {
  stopDanceIpkGoldIntroAudio();
  hideDanceIpkGoldStageFx();
  if (danceYeahPreviewTimer) window.clearTimeout(danceYeahPreviewTimer);
  danceYeahPreviewTimer = 0;
  if (clearHistory) danceIpkGoldIntroMoves.clear();
}

function queueDanceYeahFinalFx() {
  showDanceIpkGoldStageFx("yeah");
  playDanceIpkGoldImpactAudio();
}
function stopDanceYeahFx() { hideDanceIpkGoldStageFx(); }
function playDanceYeahFx() {
  showDanceIpkGoldStageFx("yeah");
  playDanceIpkGoldImpactAudio();
}
function stopDanceGoldStartLoop() { stopDanceIpkGoldIntroAudio(); }
function stopDanceGoldFinishLoop() {}
function playDanceGoldStartLoop() {}
function playDanceGoldFinishLoop() {}

function updateDanceGoldMoveFx(timeMs) {
  if (!danceTestMoves.length || !isDanceMediaPlaying()) return;
  for (let index = 0; index < danceTestMoves.length; index += 1) {
    const move = danceTestMoves[index];
    if (!move?.goldMove || danceIpkGoldIntroMoves.has(index)) continue;
    const impactTime = Number(move.time || 0) + danceGoldFinishOffsetMs;
    const delta = impactTime - timeMs;
    if (delta <= danceGoldPrepareMs && delta > 0) {
      danceIpkGoldIntroMoves.add(index);
      playDanceIpkGoldIntroAudio();
      break;
    }
    if (delta <= 0) danceIpkGoldIntroMoves.add(index);
  }
}

function previewDanceYeahSequence() {
  applyDanceYeahDevSettings(false);
  if (!dancePreloadReady) {
    if (danceLabMessage) danceLabMessage.textContent = "Espere o carregamento chegar a 100% antes de testar o Gold Move.";
    return;
  }
  resetDanceGoldMoveFx(false);
  playDanceIpkGoldIntroAudio();
  if (danceLabMessage) danceLabMessage.textContent = `Prévia IPK: hud_pregoldmove; impacto em ${danceGoldPrepareMs} ms.`;
  danceYeahPreviewTimer = window.setTimeout(() => {
    danceYeahPreviewTimer = 0;
    const slot = danceVideoJudgements?.querySelector(".dance-video-player-judge");
    const playerId = slot?.dataset?.playerId;
    showDanceIpkGoldStageFx("yeah");
    if (playerId) showDanceVideoJudgement(playerId, "YEAH", true);
    else playDanceIpkGoldImpactAudio();
    if (danceLabMessage) danceLabMessage.textContent = "Prévia IPK concluída: feedback_gold + hud_goldmove.";
  }, Math.max(0, danceGoldPrepareMs));
}

async function initializeDancePlayerSettings() {
  loadDanceYeahDevSettings();
  danceQualityPreference = safeLocalStorageGet(DANCE_QUALITY_STORAGE_KEY, "auto");
  if (!["auto","low","medium","high"].includes(danceQualityPreference)) danceQualityPreference = "auto";
  applyDanceLyricsSize(safeLocalStorageGet(DANCE_LYRICS_SIZE_STORAGE_KEY, "small"), false);
  applyDanceVideoFit(safeLocalStorageGet(DANCE_VIDEO_FIT_STORAGE_KEY, "contain"), false);
  if (danceQualityMode) danceQualityMode.value = danceQualityPreference;
  if (danceSongAudio && danceVolume) danceSongAudio.volume = Number(danceVolume.value || .9);
  preloadDanceFeedbackAssets();
  renderDanceMainHud({ score: 0, stars: 0 });
  updateDancePlayerHudOverlay(1);
  updateDancePlayerControls();
  const target = danceQualityPreference === "auto" ? chooseAutoDanceQuality() : danceQualityPreference;
  danceAutoCeiling = target;
  return prepareDancePlayerAssets(target, { reason: danceQualityPreference === "auto" ? "perfil do aparelho" : "" });
}

function danceRankLabel(dance = {}) {
  const score = Number(dance.score || 0);
  if (score >= 12000) return "MEGASTAR";
  if (score >= 11000) return "SUPERSTAR";
  const stars = Math.max(0, Math.min(5, Number(dance.stars || Math.floor(score / 2000))));
  return stars ? `${stars} ESTRELA${stars === 1 ? "" : "S"}` : "SEM ESTRELAS";
}

function danceJudgementDisplay(judgement) {
  return String(judgement || "").toUpperCase() === "YEAH" ? "YEAH!" : (judgement || "—");
}

function danceJudgementClass(judgement) {
  const value = String(judgement || "").toLowerCase();
  if (value.startsWith("yeah")) return "yeah";
  return value.replace(/[^a-z0-9_-]/g, "");
}

function danceFeedbackAsset(judgement, goldMove = false) {
  const value = String(judgement || "X").toUpperCase();
  const key = goldMove && value === "X" ? "GOLD_X" : value;
  return DANCE_FEEDBACK_ASSETS[key] || DANCE_FEEDBACK_ASSETS.X;
}

function preloadDanceFeedbackAssets() {
  const files = new Set();
  Object.values(DANCE_FEEDBACK_ASSETS).forEach(asset => {
    if (asset.image) files.add(asset.image);
    if (asset.flare) files.add(asset.flare);
  });
  for (const file of files) {
    const image = new Image();
    image.decoding = "async";
    image.src = `${DANCE_SCORING_BASE}/${file}`;
  }
}

function renderDanceVideoPlayerSlots(players = devSensorState?.players || []) {
  updateDancePlayerHudOverlay(players.length || 1);
  renderDanceMainHud(players[0]?.dance || {});
  if (!danceVideoJudgements) return;

  const visiblePlayers = players.slice(0, 4);
  const keepIds = new Set(visiblePlayers.map(player => String(player.id)));
  for (const oldItem of danceVideoJudgements.querySelectorAll(".dance-video-player-judge")) {
    if (!keepIds.has(String(oldItem.dataset.playerId || ""))) oldItem.remove();
  }

  // hud_players.isc do IPK usa slots espaçados em 200 unidades ao redor do centro.
  // No nosso canvas de referência 960px, isso equivale à metade das coordenadas 1920x1080.
  const slotPositions = {
    1: [0],
    2: [-100, 100],
    3: [-200, 0, 200],
    4: [-300, -100, 100, 300]
  }[visiblePlayers.length] || [0];

  visiblePlayers.forEach((player, playerIndex) => {
    let item = Array.from(danceVideoJudgements.querySelectorAll(".dance-video-player-judge"))
      .find(slot => String(slot.dataset.playerId) === String(player.id));
    if (!item) {
      item = document.createElement("div");
      item.className = "dance-video-player-judge";
      item.dataset.playerId = player.id;
      item.innerHTML = `
        <div class="dance-ipk-player-head">
          <div class="dance-ipk-player-card">
            <img class="dance-ipk-player-avatar" src="${DANCE_PLAYER_AVATAR_SOURCE}" alt="" aria-hidden="true">
            <span class="dance-ipk-player-color" aria-hidden="true"></span>
            <span class="dance-ipk-player-index"></span>
            <span class="dance-video-player-name"></span>
          </div>
          <span class="dance-ipk-player-line" aria-hidden="true"></span>
        </div>
        <div class="dance-video-feedback" aria-live="polite" aria-atomic="true">
          <img class="dance-video-judge-flare" alt="" aria-hidden="true">
          <img class="dance-video-judge-image" alt="">
        </div>`;
    }
    item.style.setProperty("--player-color", player.color || "#fff");
    item.style.setProperty("--jd-player-slot-x", `${((slotPositions[playerIndex] || 0) / 1920 * 100).toFixed(4)}%`);
    item.querySelector(".dance-ipk-player-index").textContent = `P${playerIndex + 1}`;
    item.querySelector(".dance-video-player-name").textContent = player.name || "Jogador";
    danceVideoJudgements.appendChild(item);
  });
}

function showDanceVideoJudgement(playerId, judgement, goldMove = false) {
  const item = danceVideoJudgements?.querySelector(`[data-player-id="${CSS.escape(playerId)}"]`);
  if (!item) return;
  const feedback = item.querySelector(".dance-video-feedback");
  const image = item.querySelector(".dance-video-judge-image");
  const flare = item.querySelector(".dance-video-judge-flare");
  if (!feedback || !image || !flare) return;

  const asset = danceFeedbackAsset(judgement, goldMove);
  image.src = `${DANCE_SCORING_BASE}/${asset.image}`;
  image.alt = danceJudgementDisplay(judgement);
  flare.src = asset.flare ? `${DANCE_SCORING_BASE}/${asset.flare}` : "";
  flare.hidden = !asset.flare;
  feedback.setAttribute("aria-label", danceJudgementDisplay(judgement));
  feedback.className = `dance-video-feedback feedback-${asset.profile}`;
  // Reinicia a animação para julgamentos consecutivos do mesmo tipo.
  void feedback.offsetWidth;
  feedback.classList.add("active");

  const normalizedJudgement = String(judgement || "").toUpperCase();
  if (normalizedJudgement.startsWith("YEAH")) {
    showDanceIpkGoldStageFx("yeah");
    playDanceIpkGoldImpactAudio();
  } else if (goldMove && normalizedJudgement === "X") {
    showDanceIpkGoldStageFx("miss");
  }
}

function pictoAtlasPosition(name) {
  const coords = dancePictoAtlas?.images?.[name];
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const tile = dancePictoAtlas?.imageSize || { width: 256, height: 256 };
  const maxX = Math.max(1, Number(tile.width || 256) * 5);
  const maxY = Math.max(1, Number(tile.height || 256) * 5);
  return {
    x: Math.max(0, Math.min(100, Number(coords[0] || 0) / maxX * 100)),
    y: Math.max(0, Math.min(100, Number(coords[1] || 0) / maxY * 100))
  };
}

function getDanceTimelineTimeMs() {
  if (!danceTestVideo) return 0;
  // Os tempos de beats, pictos, lyrics e moves já estão no mesmo relógio do vídeo.
  // O ajuste manual existe apenas para calibração fina no Menu Dev.
  return getDanceMediaCurrentTime() * 1000 + danceManualSyncOffsetMs;
}

function formatDanceSyncOffset(ms) {
  const value = Math.round(Number(ms || 0));
  if (!value) return "0 ms";
  return `${value > 0 ? "+" : ""}${value} ms`;
}

function renderDanceSyncCalibration() {
  const videoMs = getDanceMediaCurrentTime() * 1000;
  const timelineMs = getDanceTimelineTimeMs();
  if (danceSyncValue) danceSyncValue.textContent = formatDanceSyncOffset(danceManualSyncOffsetMs);
  if (danceSyncVideoTime) danceSyncVideoTime.textContent = formatDanceTime(videoMs / 1000);
  if (danceSyncTimelineTime) danceSyncTimelineTime.textContent = formatDanceTime(timelineMs / 1000);
}

function setDanceManualSyncOffset(nextMs, announce = true) {
  danceManualSyncOffsetMs = Math.max(-3000, Math.min(3000, Math.round(Number(nextMs || 0))));
  try { localStorage.setItem(DANCE_RAIN_OVER_ME_SYNC_STORAGE_KEY, String(danceManualSyncOffsetMs)); } catch {}
  renderDanceSyncCalibration();
  updateDanceSongTimeline();
  startDanceVisualHud();
  if (announce && danceLabMessage) {
    const direction = danceManualSyncOffsetMs > 0 ? "HUD adiantado" : danceManualSyncOffsetMs < 0 ? "HUD atrasado" : "timestamps originais";
    danceLabMessage.textContent = `Sincronia: ${formatDanceSyncOffset(danceManualSyncOffsetMs)} (${direction}).`;
  }
}

function nudgeDanceSync(deltaMs) {
  setDanceManualSyncOffset(danceManualSyncOffsetMs + Number(deltaMs || 0));
}

function buildDanceLyricLines(lyrics = []) {
  const lines = [];
  let current = [];
  for (const raw of lyrics) {
    const segment = {
      time: Number(raw?.time || 0),
      duration: Math.max(1, Number(raw?.duration || 0)),
      text: String(raw?.text || ""),
      isLineEnding: Boolean(raw?.isLineEnding)
    };
    current.push(segment);
    if (segment.isLineEnding) {
      lines.push({
        start: current[0]?.time || 0,
        end: Math.max(...current.map(item => item.time + item.duration)),
        text: current.map(item => item.text).join(""),
        segments: current
      });
      current = [];
    }
  }
  if (current.length) {
    lines.push({
      start: current[0]?.time || 0,
      end: Math.max(...current.map(item => item.time + item.duration)),
      text: current.map(item => item.text).join(""),
      segments: current
    });
  }
  return lines;
}

function danceLyricIndexAt(timeMs) {
  if (!danceLyricLines.length) return -1;
  let index = -1;
  for (let i = 0; i < danceLyricLines.length; i += 1) {
    if (danceLyricLines[i].start <= timeMs) index = i;
    else break;
  }
  return index;
}

function mountDanceLyricLine(index) {
  if (!danceKaraokeCurrent || !danceKaraokeNext) return;
  danceKaraokeCurrent.innerHTML = "";
  const line = index >= 0 ? danceLyricLines[index] : null;
  if (line) {
    for (const segment of line.segments) {
      const span = document.createElement("span");
      span.className = "dance-karaoke-segment";
      span.textContent = segment.text;
      span.dataset.start = String(segment.time);
      span.dataset.duration = String(segment.duration);
      span.style.setProperty("--fill", "0%");
      danceKaraokeCurrent.appendChild(span);
    }
  }
  const nextIndex = index < 0 ? 0 : index + 1;
  danceKaraokeNext.textContent = danceLyricLines[nextIndex]?.text || "";
  danceKaraoke?.classList.toggle("has-current", Boolean(line));
  danceKaraoke?.classList.remove("advance");
  if (danceKaraoke && index >= 0 && danceLastLyricLineIndex !== -999) {
    void danceKaraoke.offsetWidth;
    danceKaraoke.classList.add("advance");
  }
  danceLastLyricLineIndex = index;
}

function renderDanceLyrics(timeMs) {
  if (!danceKaraoke || !danceLyricLines.length) return;
  const index = danceLyricIndexAt(timeMs);
  if (index !== danceLastLyricLineIndex) mountDanceLyricLine(index);
  danceKaraokeCurrent?.querySelectorAll(".dance-karaoke-segment").forEach(segment => {
    const start = Number(segment.dataset.start || 0);
    const duration = Math.max(1, Number(segment.dataset.duration || 1));
    const fill = Math.max(0, Math.min(1, (timeMs - start) / duration));
    segment.style.setProperty("--fill", `${(fill * 100).toFixed(2)}%`);
  });
}

function renderDancePictos(timeMs) {
  if (!dancePictoItems || !dancePictoAtlas || !danceTestPictos.length) return;
  dancePictoItems.innerHTML = "";
  for (const picto of danceTestPictos) {
    const delta = Number(picto.time || 0) - timeMs;
    if (delta > DANCE_PICTO_LEAD_MS || delta < -DANCE_PICTO_LINGER_MS) continue;
    const position = pictoAtlasPosition(picto.name);
    if (!position) continue;

    // Antes do alvo: entra de fora da tela e corre rapidamente até a barra branca.
    // Depois do alvo: permanece no ponto, cresce e some suavemente.
    const beforeHit = delta >= 0;
    const travel = beforeHit ? Math.max(0, Math.min(1, 1 - delta / DANCE_PICTO_LEAD_MS)) : 1;
    const hitProgress = beforeHit ? 0 : Math.max(0, Math.min(1, -delta / DANCE_PICTO_LINGER_MS));
    const left = DANCE_PICTO_SPAWN_PERCENT - travel * (DANCE_PICTO_SPAWN_PERCENT - DANCE_PICTO_TARGET_PERCENT);
    const gold = /gold/i.test(String(picto.name || ""));
    const baseScale = gold ? 0.98 : 0.90;
    const scale = baseScale + travel * 0.12 + hitProgress * 0.50;
    const opacity = Math.max(0, 0.94 * (1 - hitProgress));

    const item = document.createElement("div");
    item.className = `dance-picto-item${hitProgress > 0 ? " hit" : ""}${gold ? " gold" : ""}`;
    item.dataset.pictoName = picto.name || "";
    item.style.left = `${left}%`;
    item.style.opacity = String(opacity);
    item.style.transform = `scale(${scale.toFixed(3)})`;
    item.style.backgroundPosition = `${position.x}% ${position.y}%`;
    item.title = `${picto.name || "picto"} • ${formatDanceTime(Number(picto.time || 0) / 1000)}`;
    dancePictoItems.appendChild(item);
  }
}

function updateDanceVisualHud() {
  if (!danceTestVideo) return;
  const timeMs = getDanceTimelineTimeMs();
  renderDancePictos(timeMs);
  renderDanceLyrics(timeMs);
  updateDanceGoldMoveFx(timeMs);
  syncDanceVideoToAudio(false);
  updateDancePlayerControls();
  if (isDanceMediaPlaying()) danceHudAnimationFrame = requestAnimationFrame(updateDanceVisualHud);
  else danceHudAnimationFrame = 0;
}
function startDanceVisualHud() {
  if (danceHudAnimationFrame) cancelAnimationFrame(danceHudAnimationFrame);
  danceHudAnimationFrame = requestAnimationFrame(updateDanceVisualHud);
}
function stopDanceVisualHud() {
  if (danceHudAnimationFrame) cancelAnimationFrame(danceHudAnimationFrame);
  danceHudAnimationFrame = 0;
  updateDanceVisualHud();
}

function danceMoveIndexAt(timeMs) {
  for (let index = 0; index < danceTestMoves.length; index += 1) {
    const move = danceTestMoves[index];
    const start = Number(move.time || 0);
    const end = start + Number(move.duration || 0);
    if (timeMs >= start && timeMs <= end) return index;
    if (start > timeMs) break;
  }
  return -1;
}

function resetLocalDanceJudging() {
  danceJudgeActiveMoveIndex = -1;
  danceJudgeAccumulators = new Map();
  danceLocallyJudgedMoves.clear();
  danceLastVideoTimeMs = 0;
  danceLastLyricLineIndex = -999;
  resetDanceGoldMoveFx(true);
}

function beginDanceMoveJudging(index) {
  if (index < 0 || danceLocallyJudgedMoves.has(index)) return;
  danceJudgeActiveMoveIndex = index;
  danceJudgeAccumulators = new Map();
  for (const player of devSensorState?.players || []) {
    danceJudgeAccumulators.set(player.id, { count: 0, sum: 0, peak: 0, active: 0, rotationSum: 0, rotationPeak: 0 });
  }
}

function provisionalDanceJudgement(stats, move = null) {
  if (!stats || stats.count < 2) return { judgement: "X", quality: 0 };
  const avg = stats.sum / Math.max(1, stats.count);
  const coverage = stats.active / Math.max(1, stats.count);
  const avgRotation = stats.rotationSum / Math.max(1, stats.count);
  const avgQ = Math.max(0, Math.min(1, (avg - 0.025) / 0.30));
  const peakQ = Math.max(0, Math.min(1, (stats.peak - 0.06) / 0.48));
  const rotationQ = Math.max(0, Math.min(1, avgRotation / 230));
  const quality = Math.max(0, Math.min(1, avgQ * 0.38 + peakQ * 0.30 + coverage * 0.18 + rotationQ * 0.14));
  const roundedQuality = Math.round(quality * 1000) / 1000;
  if (move?.goldMove) return { judgement: quality >= 0.45 ? "YEAH" : "X", quality: roundedQuality };
  const judgement = quality >= 0.78 ? "PERFECT" : quality >= 0.62 ? "SUPER" : quality >= 0.45 ? "GOOD" : quality >= 0.24 ? "OK" : "X";
  return { judgement, quality: roundedQuality };
}

function renderDanceStars(card, dance = {}) {
  if (!card) return;
  const scoreEl = card.querySelector('[data-dance-score]');
  const rankEl = card.querySelector('[data-dance-rank]');
  const judgedEl = card.querySelector('[data-dance-progress]');
  const score = Math.max(0, Math.min(DANCE_MAX_SCORE, Number(dance.score || 0)));
  const stars = Math.max(0, Math.min(5, Number(dance.stars || Math.floor(score / 2000))));
  if (scoreEl) scoreEl.textContent = score.toLocaleString("pt-BR");
  if (rankEl) {
    rankEl.textContent = danceRankLabel(dance);
    rankEl.className = `dance-rank-badge ${score >= 12000 ? "megastar" : score >= 11000 ? "superstar" : ""}`.trim();
  }
  if (judgedEl) judgedEl.textContent = `${Number(dance.judgedMoves || 0)} / ${Number(dance.totalMoves || danceTestMoves.length || 0)} movimentos`;
  card.querySelectorAll('.dance-star').forEach((star, index) => star.classList.toggle('filled', index < stars));
  const counts = dance.judgementCounts || {};
  for (const judgement of DANCE_JUDGEMENTS) {
    const countEl = card.querySelector(`[data-count="${judgement}"]`);
    if (countEl) countEl.textContent = String(Number(counts[judgement] || 0));
  }
}

function showDanceJudgementOnCard(playerId, judgement, dance, moveName = "", goldMove = false) {
  const card = danceSensorPlayers?.querySelector(`[data-player-id="${CSS.escape(playerId)}"]`);
  if (!card) return;
  renderDanceStars(card, dance || {});
  const judgementEl = card.querySelector('[data-dance-judgement]');
  if (judgementEl) {
    judgementEl.textContent = danceJudgementDisplay(judgement);
    judgementEl.className = `dance-last-judgement ${danceJudgementClass(judgement)}`;
    judgementEl.classList.remove('pop');
    void judgementEl.offsetWidth;
    judgementEl.classList.add('pop');
  }
  const moveEl = card.querySelector('[data-dance-last-move]');
  if (moveEl && moveName) moveEl.textContent = moveName;
  showDanceVideoJudgement(playerId, judgement, goldMove);
}

function finalizeDanceMoveJudging(index) {
  if (index < 0 || danceLocallyJudgedMoves.has(index) || !remoteSocket || !devSensorRoomCode) return;
  const move = danceTestMoves[index];
  const playersNow = devSensorState?.players || [];
  if (!move || !playersNow.length) return;

  const results = playersNow.map(player => {
    const stats = danceJudgeAccumulators.get(player.id) || { count: 0, sum: 0, peak: 0, active: 0, rotationSum: 0, rotationPeak: 0 };
    return { playerId: player.id, ...provisionalDanceJudgement(stats, move) };
  });

  danceLocallyJudgedMoves.add(index);
  remoteSocket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("host:dance-judgement", {
    roomCode: devSensorRoomCode,
    moveIndex: index,
    moveName: move.name || `move-${index + 1}`,
    goldMove: Boolean(move.goldMove),
    totalMoves: danceTestMoves.length,
    results
  }, (error, response) => {
    if (error || !response?.ok) {
      danceLocallyJudgedMoves.delete(index);
      if (danceLabMessage) danceLabMessage.textContent = response?.message || "Falha ao registrar o julgamento deste movimento.";
      return;
    }
    if (response.state) applyDevSensorState(response.state);
  });
}

function syncDanceMoveJudging() {
  if (!danceTestVideo || !danceTestMoves.length) return;
  if (!devSensorModeEnabled || !(devSensorState?.players?.length)) {
    danceJudgeActiveMoveIndex = -1;
    danceJudgeAccumulators = new Map();
    return;
  }
  const timeMs = getDanceTimelineTimeMs();
  const currentIndex = danceMoveIndexAt(timeMs);

  // Saltos grandes no vídeo encerram apenas a janela que estava realmente ativa;
  // movimentos pulados não são pontuados automaticamente.
  if (danceJudgeActiveMoveIndex >= 0 && currentIndex !== danceJudgeActiveMoveIndex) {
    finalizeDanceMoveJudging(danceJudgeActiveMoveIndex);
    danceJudgeActiveMoveIndex = -1;
    danceJudgeAccumulators = new Map();
  }
  if (isDanceMediaPlaying() && currentIndex >= 0 && !danceLocallyJudgedMoves.has(currentIndex) && danceJudgeActiveMoveIndex !== currentIndex) {
    beginDanceMoveJudging(currentIndex);
  }
  danceLastVideoTimeMs = timeMs;
}

function collectDanceJudgementSample(payload) {
  if (!danceTestVideo || !isDanceMediaPlaying() || !devSensorModeEnabled || !danceTestMoves.length) return;
  syncDanceMoveJudging();
  if (danceJudgeActiveMoveIndex < 0) return;
  const stats = danceJudgeAccumulators.get(payload.playerId) || { count: 0, sum: 0, peak: 0, active: 0, rotationSum: 0, rotationPeak: 0 };
  const intensity = Math.max(0, Math.min(1, Number(payload.intensity || 0)));
  const rotationRate = payload.sample?.rotationRate || {};
  const rotation = Math.sqrt((Number(rotationRate.x) || 0) ** 2 + (Number(rotationRate.y) || 0) ** 2 + (Number(rotationRate.z) || 0) ** 2);
  stats.count += 1;
  stats.sum += intensity;
  stats.peak = Math.max(stats.peak, intensity);
  if (intensity >= 0.08 || rotation >= 35) stats.active += 1;
  stats.rotationSum += rotation;
  stats.rotationPeak = Math.max(stats.rotationPeak, rotation);
  danceJudgeAccumulators.set(payload.playerId, stats);
}

function handleDanceJudgementEvent(payload) {
  if (!payload || payload.roomCode !== devSensorRoomCode) return;
  const previousScores = new Map((devSensorState?.players || []).map(player => [player.id, Number(player.dance?.score || 0)]));
  if (payload.state) devSensorState = payload.state;
  for (const result of payload.results || []) {
    handleDanceHudMilestones(result.playerId, previousScores.get(result.playerId), result.dance?.score);
    showDanceJudgementOnCard(result.playerId, result.judgement, result.dance, payload.moveName || "", Boolean(payload.goldMove));
  }
  renderDanceMainHud(devSensorState?.players?.[0]?.dance || payload.results?.[0]?.dance || {});
}

function setDanceLabBadge(kind = "idle", text = "Parado") {
  if (!danceLabStatusBadge) return;
  danceLabStatusBadge.className = `sensor-lab-badge ${kind}`;
  danceLabStatusBadge.textContent = text;
}

function resetDanceLabUi(clearMessage = true) {
  if (danceRoomCode) danceRoomCode.textContent = "------";
  if (danceJoinUrl) danceJoinUrl.textContent = "Crie uma sala para começar.";
  if (copyDanceJoinUrlBtn) copyDanceJoinUrlBtn.disabled = true;
  if (enableDanceSensorsBtn) enableDanceSensorsBtn.disabled = true;
  if (stopDanceSensorsBtn) stopDanceSensorsBtn.disabled = true;
  if (resetDanceScoreBtn) resetDanceScoreBtn.disabled = true;
  if (dancePlayerCount) dancePlayerCount.textContent = "0 / 4";
  if (danceSensorPlayers) danceSensorPlayers.innerHTML = '<div class="dance-empty-state">Conecte um celular para visualizar os sensores.</div>';
  if (clearMessage && danceLabMessage) danceLabMessage.textContent = "Nenhuma sala criada.";
  resetLocalDanceJudging();
  danceLabServerWarning?.classList.add("hidden");
  setDanceLabBadge("idle", "Parado");
}

function openDevMenu() {
  winnerModal.classList.add("hidden");
  closeRemoteRoom();
  leaveOnlineRoom();
  resetLocalGame(false);
  closeDevSensorRoom();
  gameMode = "dev";
  showOnly(devMenuEl);
  if (devMechanicStatus) devMechanicStatus.textContent = "Pronto para testes.";
}

function formatDanceTime(seconds) {
  const totalMs = Math.max(0, Math.round(Number(seconds || 0) * 1000));
  const minutes = Math.floor(totalMs / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${minutes}:${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

async function loadDanceTestSongData() {
  if (danceTestSongLoaded) return true;
  try {
    const base = "minigames/just-dance/songs/RainOverMe";
    const [movesResponse, songResponse, atlasResponse] = await Promise.all([
      fetch(`${base}/moves/RainOverMe_moves0.json`, { cache: "no-store" }),
      fetch(`${base}/RainOverMe.json`, { cache: "no-store" }),
      fetch(`${base}/pictos-atlas.json`, { cache: "no-store" })
    ]);
    if (!movesResponse.ok || !songResponse.ok || !atlasResponse.ok) throw new Error("Falha ao carregar timeline/pictos.");
    const [moves, song, atlas] = await Promise.all([movesResponse.json(), songResponse.json(), atlasResponse.json()]);
    danceTestMoves = Array.isArray(moves) ? moves.slice().sort((a, b) => Number(a.time || 0) - Number(b.time || 0)) : [];
    danceTestPictos = Array.isArray(song?.pictos) ? song.pictos.slice().sort((a, b) => Number(a.time || 0) - Number(b.time || 0)) : [];
    danceTestLyrics = Array.isArray(song?.lyrics) ? song.lyrics.slice().sort((a, b) => Number(a.time || 0) - Number(b.time || 0)) : [];
    danceLyricLines = buildDanceLyricLines(danceTestLyrics);
    danceSourceVideoOffsetMs = Math.max(0, Number(song?.videoOffset ?? 0));
    try {
      const storedRaw = localStorage.getItem(DANCE_RAIN_OVER_ME_SYNC_STORAGE_KEY);
      const storedSync = storedRaw === null ? NaN : Number(storedRaw);
      danceManualSyncOffsetMs = Number.isFinite(storedSync)
        ? Math.max(-3000, Math.min(3000, Math.round(storedSync)))
        : DANCE_RAIN_OVER_ME_DEFAULT_SYNC_MS;
    } catch {
      danceManualSyncOffsetMs = DANCE_RAIN_OVER_ME_DEFAULT_SYNC_MS;
    }
    dancePictoAtlas = atlas && typeof atlas === "object" ? atlas : null;
    danceTestSongLoaded = true;
    danceLastLyricLineIndex = -999;
    if (danceKaraoke && song?.lyricsColor) danceKaraoke.style.setProperty("--dance-lyric-color", String(song.lyricsColor));
    const goldCount = danceTestMoves.filter(move => Boolean(move.goldMove)).length;
    if (danceSongAssetStatus) danceSongAssetStatus.textContent = `${danceTestMoves.length} movimentos • ${danceTestPictos.length} pictos • ${danceLyricLines.length} linhas de letra • ${goldCount} Gold Moves/YEAH! • quadro 16:9 • Scoring FX do IPK • vídeo 360p/720p/1080p.`;
    renderDanceSyncCalibration();
    updateDanceSongTimeline();
    renderDanceVideoPlayerSlots();
    return true;
  } catch (error) {
    if (danceSongAssetStatus) danceSongAssetStatus.textContent = "Não foi possível ler a timeline ou os pictos da música.";
    return false;
  }
}

function updateDanceSongTimeline() {
  if (!danceTestVideo) return;
  const timeMs = getDanceTimelineTimeMs();
  if (danceSongTime) danceSongTime.textContent = formatDanceTime(getDanceMediaCurrentTime());
  renderDanceSyncCalibration();
  if (!danceTestMoves.length) {
    if (danceCurrentMove) danceCurrentMove.textContent = "—";
    if (danceNextMove) danceNextMove.textContent = "—";
    return;
  }
  let current = null;
  let next = null;
  for (const move of danceTestMoves) {
    const start = Number(move.time || 0);
    const end = start + Number(move.duration || 0);
    if (timeMs >= start && timeMs <= end) current = move;
    if (start > timeMs) { next = move; break; }
  }
  if (danceCurrentMove) danceCurrentMove.textContent = current?.name || "—";
  if (danceNextMove) danceNextMove.textContent = next ? `${next.name}${next.goldMove ? " • GOLD/YEAH!" : ""} • ${formatDanceTime(next.time / 1000)}` : "Fim";
  renderDancePictos(timeMs);
  renderDanceLyrics(timeMs);
  syncDanceMoveJudging();
}

async function openDanceSensorLab() {
  closeRemoteRoom();
  leaveOnlineRoom();
  resetLocalGame(false);
  closeDevSensorRoom();
  gameMode = "dev-sensor";
  resetDanceLabUi();
  showOnly(danceDevScreenEl);
  if (danceLabMessage) danceLabMessage.textContent = "Carregando música, vídeo e HUD antes de iniciar…";
  await loadDanceTestSongData();
  const playerReady = await initializeDancePlayerSettings();
  if (!playerReady) return;
  if (danceLabMessage) danceLabMessage.textContent = "Arquivos prontos. Verificando o servidor…";
  const compatible = await verifyMultiplayerServer({ mode: "dev" });
  if (compatible) {
    danceLabServerWarning?.classList.add("hidden");
    if (danceLabMessage) danceLabMessage.textContent = "Servidor pronto. Crie uma sala e conecte o celular.";
  }
}

function backToDevMenu() {
  closeDevSensorRoom();
  pauseDanceMedia();
  setDanceWindowMode(false);
  resetDanceGoldMoveFx(true);
  stopDanceYeahFx();
  gameMode = "dev";
  showOnly(devMenuEl);
}

function closeDevSensorRoom() {
  if (remoteSocket && devSensorRoomCode) {
    remoteSocket.emit("host:close-room", { roomCode: devSensorRoomCode });
  }
  devSensorRoomCode = "";
  devSensorState = null;
  devSensorJoinUrl = "";
  devSensorModeEnabled = false;
  devSensorLive.clear();
  resetLocalDanceJudging();
  if (danceDevScreenEl) resetDanceLabUi(false);
}

function sensorCapabilitiesText(sensor) {
  const caps = sensor?.capabilities || {};
  const names = [];
  if (caps.observedGyro) names.push("giroscópio ✓");
  else if (caps.genericGyroscope) names.push("giroscópio API");
  if (caps.observedAccelerometer) names.push("acelerômetro ✓");
  else if (caps.motion || caps.genericAccelerometer || caps.genericLinearAcceleration) names.push("acelerômetro API");
  if (caps.observedOrientation) names.push(caps.orientationFallback ? "orientação/fallback ✓" : "orientação ✓");
  else if (caps.orientation) names.push("orientação API");
  if (caps.secureContext === false) names.push("SEM HTTPS");
  return names.length ? names.join(" • ") : "aguardando informações do aparelho";
}

function renderDanceSensorPlayers(players = []) {
  if (!danceSensorPlayers || !dancePlayerCount) return;
  dancePlayerCount.textContent = `${players.length} / 4`;
  danceSensorPlayers.innerHTML = "";

  if (!players.length) {
    danceSensorPlayers.innerHTML = '<div class="dance-empty-state">Conecte um celular para visualizar os sensores.</div>';
    return;
  }

  for (const player of players) {
    const live = devSensorLive.get(player.id) || {};
    const sensor = player.sensor || {};
    const intensity = Math.max(0, Math.min(1, Number(live.intensity ?? sensor.intensity ?? 0)));
    const diagnosticScore = Number(live.testScore ?? sensor.testScore ?? 0);
    const dance = player.dance || {};
    const packets = Number(live.packetCount ?? sensor.packetCount ?? 0);
    const age = sensor.lastSeen ? Date.now() - Number(sensor.lastSeen) : Infinity;
    const isLive = Boolean(sensor.active && age < 2500) || Boolean(live.receivedAt && Date.now() - live.receivedAt < 2500);

    const card = document.createElement("article");
    card.className = "dance-sensor-player";
    card.dataset.playerId = player.id;
    card.innerHTML = `
      <div class="dance-player-top">
        <div class="dance-player-name"><span class="dance-player-dot"></span><strong></strong></div>
        <span class="dance-sensor-state ${isLive ? "live" : ""}">${isLive ? "recebendo" : (sensor.active ? "aguardando dados" : "sensor inativo")}</span>
      </div>
      <div class="dance-player-metrics">
        <div class="dance-player-metric"><span>Movimento</span><strong data-metric="intensity">${Math.round(intensity * 100)}%</strong></div>
        <div class="dance-player-metric"><span>Score</span><strong data-metric="score" data-dance-score>${Number(dance.score || 0).toLocaleString("pt-BR")}</strong></div>
        <div class="dance-player-metric"><span>Pacotes</span><strong data-metric="packets">${packets}</strong></div>
        <div class="dance-player-metric"><span>Giro</span><strong data-metric="rotation">0°/s</strong></div>
      </div>
      <div class="dance-intensity-track"><span class="dance-intensity-fill" style="width:${Math.round(intensity * 100)}%"></span></div>
      <div class="dance-score-panel">
        <div class="dance-score-topline"><div class="dance-stars" aria-label="Estrelas"><span class="dance-star">★</span><span class="dance-star">★</span><span class="dance-star">★</span><span class="dance-star">★</span><span class="dance-star">★</span></div><span data-dance-rank class="dance-rank-badge">SEM ESTRELAS</span></div>
        <div class="dance-score-detail"><span data-dance-progress>0 / ${danceTestMoves.length || 0} movimentos</span><span>máx. 13.333</span></div>
        <div class="dance-judgement-row"><strong data-dance-judgement class="dance-last-judgement ${danceJudgementClass(dance.lastJudgement)}">${danceJudgementDisplay(dance.lastJudgement)}</strong><span data-dance-last-move>${dance.lastMoveName || "Aguardando movimento"}</span></div>
        <div class="dance-judgement-counts"><span>P <b data-count="PERFECT">0</b></span><span>S <b data-count="SUPER">0</b></span><span>G <b data-count="GOOD">0</b></span><span>OK <b data-count="OK">0</b></span><span>Y! <b data-count="YEAH">0</b></span><span>X <b data-count="X">0</b></span></div>
      </div>
      <div class="dance-capabilities"></div>`;
    card.querySelector(".dance-player-dot").style.background = player.color || "#888";
    card.querySelector(".dance-player-name strong").textContent = player.name || "Jogador";
    card.querySelector(".dance-capabilities").textContent = `${sensorCapabilitiesText(sensor)} • diagnóstico ${diagnosticScore}`;
    danceSensorPlayers.appendChild(card);
    renderDanceStars(card, dance);
  }
}

function applyDevSensorState(state) {
  if (!state || state.roomCode !== devSensorRoomCode) return;
  devSensorState = state;
  devSensorModeEnabled = Boolean(state.sensorMode);
  renderDanceSensorPlayers(state.players || []);
  renderDanceVideoPlayerSlots(state.players || []);
  for (const player of state.players || []) {
    if (!danceHudPreviousScores.has(player.id)) danceHudPreviousScores.set(player.id, Number(player.dance?.score || 0));
  }
  renderDanceMainHud(state.players?.[0]?.dance || {});
  const count = state.players?.length || 0;
  if (enableDanceSensorsBtn) enableDanceSensorsBtn.disabled = !count || devSensorModeEnabled;
  if (stopDanceSensorsBtn) stopDanceSensorsBtn.disabled = !devSensorModeEnabled;
  if (resetDanceScoreBtn) resetDanceScoreBtn.disabled = !count;
  setDanceLabBadge(devSensorModeEnabled ? "active" : (count ? "waiting" : "idle"), devSensorModeEnabled ? "Sensores ativos" : (count ? "Celular conectado" : "Sala pronta"));
  if (danceLabMessage) {
    danceLabMessage.textContent = count
      ? `${count} ${count === 1 ? "celular conectado" : "celulares conectados"}. ${devSensorModeEnabled ? "Aguardando o usuário liberar os sensores no aparelho." : "Clique em Ativar sensores quando estiver pronto."}`
      : "Sala criada. Abra o endereço no celular e conecte como controle.";
  }
}

function handleDevSensorData(payload) {
  if (!payload?.playerId) return;
  devSensorLive.set(payload.playerId, { ...payload, receivedAt: Date.now() });
  collectDanceJudgementSample(payload);
  const card = danceSensorPlayers?.querySelector(`[data-player-id="${CSS.escape(payload.playerId)}"]`);
  if (!card) {
    if (devSensorState) renderDanceSensorPlayers(devSensorState.players || []);
    return;
  }
  const intensity = Math.max(0, Math.min(1, Number(payload.intensity || 0)));
  const intensityText = card.querySelector('[data-metric="intensity"]');
  const scoreText = card.querySelector('[data-metric="score"]');
  const packetText = card.querySelector('[data-metric="packets"]');
  const rotationText = card.querySelector('[data-metric="rotation"]');
  const fill = card.querySelector(".dance-intensity-fill");
  const stateText = card.querySelector(".dance-sensor-state");
  if (intensityText) intensityText.textContent = `${Math.round(intensity * 100)}%`;
  if (scoreText) {
    const statePlayer = devSensorState?.players?.find(player => player.id === payload.playerId);
    scoreText.textContent = Number(statePlayer?.dance?.score || 0).toLocaleString("pt-BR");
  }
  if (packetText) packetText.textContent = String(Number(payload.packetCount || 0));
  if (rotationText) {
    const r = payload.sample?.rotationRate || {};
    const rotation = Math.sqrt((Number(r.x)||0)**2 + (Number(r.y)||0)**2 + (Number(r.z)||0)**2);
    rotationText.textContent = `${Math.round(rotation)}°/s`;
  }
  if (fill) fill.style.width = `${Math.round(intensity * 100)}%`;
  if (stateText) { stateText.textContent = "recebendo"; stateText.classList.add("live"); }
}

async function createDanceSensorRoom() {
  gameMode = "dev-sensor";
  if (!(await verifyMultiplayerServer({ mode: "dev" }))) return;
  if (!ensureRemoteSocket()) return;

  if (!remoteSocket.connected) {
    setDanceLabBadge("waiting", "Conectando");
    if (danceLabMessage) danceLabMessage.textContent = "Conectando ao servidor…";
    remoteSocket.once("connect", createDanceSensorRoom);
    return;
  }

  closeDevSensorRoom();
  setDanceLabBadge("waiting", "Criando sala");
  createDanceRoomBtn.disabled = true;
  remoteSocket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("host:create-room", { purpose: "sensor-lab" }, (error, response) => {
    createDanceRoomBtn.disabled = false;
    if (error || !response?.ok) {
      danceLabServerWarning?.classList.remove("hidden");
      setDanceLabBadge("idle", "Erro");
      if (danceLabMessage) danceLabMessage.textContent = response?.message || "O servidor não respondeu ao criar a sala de sensores.";
      return;
    }

    devSensorRoomCode = response.roomCode;
    devSensorState = response.state;
    devSensorJoinUrl = getFrontendUrl(`/controller.html?room=${encodeURIComponent(devSensorRoomCode)}&dev=sensor`);
    if (danceRoomCode) danceRoomCode.textContent = devSensorRoomCode;
    if (danceJoinUrl) danceJoinUrl.textContent = devSensorJoinUrl;
    if (copyDanceJoinUrlBtn) copyDanceJoinUrlBtn.disabled = false;
    danceLabServerWarning?.classList.add("hidden");
    applyDevSensorState(response.state);
  });
}

function setDanceSensorMode(enabled) {
  if (!remoteSocket || !devSensorRoomCode) return;
  const button = enabled ? enableDanceSensorsBtn : stopDanceSensorsBtn;
  if (button) button.disabled = true;
  remoteSocket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("host:sensor-mode", { roomCode: devSensorRoomCode, enabled: Boolean(enabled) }, (error, response) => {
    if (error || !response?.ok) {
      if (danceLabMessage) danceLabMessage.textContent = response?.message || "Não foi possível alterar o modo de sensores.";
      if (button) button.disabled = false;
      return;
    }
    devSensorModeEnabled = Boolean(enabled);
    if (enableDanceSensorsBtn) enableDanceSensorsBtn.disabled = enabled || !(devSensorState?.players?.length);
    if (stopDanceSensorsBtn) stopDanceSensorsBtn.disabled = !enabled;
    setDanceLabBadge(enabled ? "active" : "idle", enabled ? "Sensores ativos" : "Parado");
  });
}

function resetDanceSensorTest() {
  if (!remoteSocket || !devSensorRoomCode) return;
  resetDanceScoreBtn.disabled = true;
  remoteSocket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("host:sensor-reset", { roomCode: devSensorRoomCode }, (error, response) => {
    resetDanceScoreBtn.disabled = false;
    if (error || !response?.ok) {
      if (danceLabMessage) danceLabMessage.textContent = response?.message || "Não foi possível zerar o teste.";
      return;
    }
    devSensorLive.clear();
    resetLocalDanceJudging();
    if (danceTestVideo) danceTestVideo.currentTime = 0;
    if (response.state) applyDevSensorState(response.state);
    if (danceLabMessage) danceLabMessage.textContent = "Score, estrelas, julgamentos e contadores zerados.";
  });
}

async function testDevDice() {
  if (devTestDiceBtn) devTestDiceBtn.disabled = true;
  const value = Math.floor(Math.random() * 6) + 1;
  if (devMechanicStatus) devMechanicStatus.textContent = `Rolando o dado até ${value}…`;
  await animateDiceTo(value);
  if (devMechanicStatus) devMechanicStatus.textContent = `Teste concluído: face ${value}.`;
  if (devTestDiceBtn) devTestDiceBtn.disabled = false;
}

function testDevCard() {
  const card = { ...DEV_TEST_CARD, options: [...DEV_TEST_CARD.options] };
  showCardEvent(card, "DEV", {
    interactive: true,
    mode: "dev",
    onAnswer(index) {
      const correct = Number(index) === card.correctIndex;
      const delta = correct ? card.successDelta : card.failDelta;
      resolveDisplayedCard({
        card,
        selectedIndex: Number(index),
        correct,
        correctAnswer: card.options[card.correctIndex],
        delta,
        from: 10,
        to: Math.max(1, 10 + delta),
        effect: formatCardMove(delta)
      });
      if (devMechanicStatus) devMechanicStatus.textContent = correct ? "Carta DEV: resposta correta." : "Carta DEV: resposta incorreta.";
    }
  });
}

/* ---------- Eventos ---------- */

danceSongAudio?.addEventListener("timeupdate", () => { updateDanceSongTimeline(); updateDancePlayerControls(); });
danceSongAudio?.addEventListener("loadedmetadata", () => { updateDanceSongTimeline(); updateDancePlayerControls(); });
danceSongAudio?.addEventListener("play", () => { syncDanceMoveJudging(); startDanceVisualHud(); updateDancePlayerControls(); });
danceSongAudio?.addEventListener("pause", () => { syncDanceMoveJudging(); stopDanceVisualHud(); updateDancePlayerControls(); });
danceSongAudio?.addEventListener("ended", () => {
  if (danceJudgeActiveMoveIndex >= 0) finalizeDanceMoveJudging(danceJudgeActiveMoveIndex);
  danceJudgeActiveMoveIndex = -1;
  danceTestVideo?.pause();
  stopDanceVisualHud();
  updateDancePlayerControls();
});
danceTestVideo?.addEventListener("loadedmetadata", () => { syncDanceVideoToAudio(true); updateDanceSongTimeline(); });
danceTestVideo?.addEventListener("waiting", handleDancePlaybackStall);
danceTestVideo?.addEventListener("stalled", handleDancePlaybackStall);
dancePlayPauseBtn?.addEventListener("click", () => { if (isDanceMediaPlaying()) pauseDanceMedia(); else playDanceMedia(); });
danceSeek?.addEventListener("pointerdown", () => { dancePlayerSeeking = true; });
danceSeek?.addEventListener("input", () => {
  const duration = getDanceMediaDuration();
  if (duration > 0) seekDanceMedia(duration * Number(danceSeek.value || 0) / 1000);
});
danceSeek?.addEventListener("change", () => { dancePlayerSeeking = false; updateDancePlayerControls(); });
danceSeek?.addEventListener("pointerup", () => { dancePlayerSeeking = false; updateDancePlayerControls(); });
danceVolume?.addEventListener("input", () => { if (danceSongAudio) danceSongAudio.volume = Math.max(0, Math.min(1, Number(danceVolume.value || 0))); });
danceQualityMode?.addEventListener("change", () => applyDanceQualityPreference(danceQualityMode.value, true));
danceLyricsSize?.addEventListener("change", () => applyDanceLyricsSize(danceLyricsSize.value, true));
danceVideoFit?.addEventListener("change", () => applyDanceVideoFit(danceVideoFit.value, true));
danceWindowBtn?.addEventListener("click", () => setDanceWindowMode(!danceWindowMode));
danceFullscreenBtn?.addEventListener("click", toggleDanceFullscreen);
document.addEventListener("fullscreenchange", () => { if (danceFullscreenBtn) danceFullscreenBtn.textContent = document.fullscreenElement ? "Sair da tela cheia" : "Tela cheia"; requestAnimationFrame(syncDanceStageUiScale); });

devBackBtn?.addEventListener("click", showMainMenu);
danceLabBackBtn?.addEventListener("click", backToDevMenu);
devTestDiceBtn?.addEventListener("click", testDevDice);
devTestCardBtn?.addEventListener("click", testDevCard);
openDanceLabBtn?.addEventListener("click", openDanceSensorLab);
createDanceRoomBtn?.addEventListener("click", createDanceSensorRoom);
enableDanceSensorsBtn?.addEventListener("click", () => setDanceSensorMode(true));
stopDanceSensorsBtn?.addEventListener("click", () => setDanceSensorMode(false));
resetDanceScoreBtn?.addEventListener("click", resetDanceSensorTest);
danceSyncDelayBtn?.addEventListener("click", () => nudgeDanceSync(-100));
danceSyncAdvanceBtn?.addEventListener("click", () => nudgeDanceSync(100));
danceSyncDelayFineBtn?.addEventListener("click", () => nudgeDanceSync(-25));
danceSyncAdvanceFineBtn?.addEventListener("click", () => nudgeDanceSync(25));
danceSyncResetBtn?.addEventListener("click", () => setDanceManualSyncOffset(DANCE_RAIN_OVER_ME_DEFAULT_SYNC_MS));
danceYeahApplyBtn?.addEventListener("click", () => applyDanceYeahDevSettings(true));
danceYeahPreviewBtn?.addEventListener("click", previewDanceYeahSequence);
danceYeahResetBtn?.addEventListener("click", resetDanceYeahDevSettings);
[danceYeahPrepareMsInput, danceYeahFinishOffsetMsInput, danceYeahFinalDelayMsInput, danceYeahScalePctInput].forEach(input => {
  input?.addEventListener("keydown", event => { if (event.key === "Enter") applyDanceYeahDevSettings(true); });
});
copyDanceJoinUrlBtn?.addEventListener("click", async () => {
  if (!devSensorJoinUrl) return;
  try {
    await navigator.clipboard.writeText(devSensorJoinUrl);
    copyDanceJoinUrlBtn.textContent = "Copiado!";
    setTimeout(() => copyDanceJoinUrlBtn.textContent = "Copiar endereço", 1200);
  } catch {
    copyDanceJoinUrlBtn.textContent = "Copie o endereço acima";
  }
});

document.addEventListener("keydown", event => {
  if (danceDevScreenEl?.classList.contains("hidden")) return;
  const tag = String(event.target?.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return;
  if (event.key === "[") { event.preventDefault(); nudgeDanceSync(event.shiftKey ? -250 : -25); }
  if (event.key === "]") { event.preventDefault(); nudgeDanceSync(event.shiftKey ? 250 : 25); }
  if (event.key === "\\") { event.preventDefault(); setDanceManualSyncOffset(DANCE_RAIN_OVER_ME_DEFAULT_SYNC_MS); }
});

document.addEventListener("keydown", event => {
  const target = event.target;
  const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
  if (typing) return;

  const mainVisible = mainMenuEl && !mainMenuEl.classList.contains("hidden");
  if (mainVisible && !event.ctrlKey && !event.altKey && !event.metaKey && (event.code === "Digit7" || event.code === "Numpad7" || event.key === "7")) {
    event.preventDefault();
    openDevMenu();
    return;
  }

  if (event.key === "Escape") {
    if (document.fullscreenElement) return;
    if (danceWindowMode) {
      event.preventDefault();
      setDanceWindowMode(false);
    } else if (danceDevScreenEl && !danceDevScreenEl.classList.contains("hidden")) {
      event.preventDefault();
      backToDevMenu();
    } else if (devMenuEl && !devMenuEl.classList.contains("hidden")) {
      event.preventDefault();
      showMainMenu();
    }
  }
});

localModeBtn.addEventListener("click", openLocalMode);
controlsModeBtn.addEventListener("click", openControlsMode);
onlineModeBtn.addEventListener("click", openOnlineMode);
localBackBtn.addEventListener("click", showMainMenu);
sameDeviceBtn.addEventListener("click", openSameDeviceMode);
phoneModeBtn.addEventListener("click", openPhoneLocalMode);
phoneBackBtn.addEventListener("click", showLocalMenu);
onlineBackBtn.addEventListener("click", showMainMenu);
gameMenuBtn.addEventListener("click", handleGameMenuButton);

createRoomBtn.addEventListener("click", showCreateRoom);
joinRoomBtn.addEventListener("click", showJoinRoom);

roomCodeInput.addEventListener("input", () => {
  roomCodeInput.value = normalizeRoomCode(roomCodeInput.value);
});

confirmCreateBtn.addEventListener("click", createOnlineRoom);
confirmJoinBtn.addEventListener("click", joinOnlineRoom);
startOnlineGameBtn.addEventListener("click", startOnlineGame);
leaveOnlineLobbyBtn.addEventListener("click", leaveCurrentOnlineRoomFromUi);
leaveOnlineGameBtn.addEventListener("click", leaveCurrentOnlineRoomFromUi);

copyOnlineLinkBtn.addEventListener("click", async () => {
  const text = onlineShareUrl.textContent;
  if (!text || !text.startsWith("http")) return;

  try {
    await navigator.clipboard.writeText(text);
    copyOnlineLinkBtn.textContent = "Copiado!";
    setTimeout(() => copyOnlineLinkBtn.textContent = "Copiar convite", 1200);
  } catch {
    copyOnlineLinkBtn.textContent = "Copie o endereço acima";
  }
});

function resolveLocalCard(answerIndex = null) {
  if (!localPendingCard || !activeCardSession) return;
  const {card,player}=localPendingCard; let correct=null,selectedIndex=null,delta=Number(card.delta||0),correctAnswer="";
  if(card.type==="question"){selectedIndex=Number(answerIndex);if(!Number.isInteger(selectedIndex)||selectedIndex<0||selectedIndex>=card.options.length)return;correct=selectedIndex===Number(card.correctIndex);delta=correct?Number(card.successDelta||0):Number(card.failDelta||0);correctAnswer=card.options[card.correctIndex];}
  const move=applyCardMove(player,delta);render();resolveDisplayedCard({card,selectedIndex,correct,correctAnswer,...move});
}
cardDeckBtn?.addEventListener("click",()=>{if(gameMode==="same-device"&&localPendingCard){const{card,player}=localPendingCard;setDeckDrawing(card.type);showCardEvent(card,player.name,{interactive:true,mode:"local",onAnswer:index=>resolveLocalCard(index),onContinue:()=>resolveLocalCard(),onFinished:finishLocalCard});return;}if(gameMode==="online")drawOnlineCard();});
cardAnswers?.addEventListener("click",event=>{const button=event.target.closest(".card-answer-option");if(!button||!activeCardSession||activeCardSession.waitingForServer||!activeCardSession.interactive||activeCardSession.card.type!=="question")return;activeCardSession.onAnswer?.(Number(button.dataset.answerIndex));});
closeCardBtn?.addEventListener("click",()=>{if(!activeCardSession||activeCardSession.waitingForServer||!activeCardSession.interactive)return;activeCardSession.onContinue?.();});
cardModal?.addEventListener("click",event=>{if(event.target===cardModal){drawnCard?.classList.remove("card-nudge");void drawnCard?.offsetWidth;drawnCard?.classList.add("card-nudge");}});

playerCountEl.addEventListener("change", updateNameFields);
startBtn.addEventListener("click", startGame);
rollBtn.addEventListener("click", rollDice);
restartBtn.addEventListener("click", resetToSetup);
playAgainBtn.addEventListener("click", () => {
  winnerModal.classList.add("hidden");

  if (gameMode === "online" && !onlineIsHost) {
    return;
  }

  resetToSetup();
});

ensureDanceStageResponsiveScale();
setDiceFace(1);
createBoard();
updateNameFields();
handleInitialRoute();
