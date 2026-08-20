(() => {
  "use strict";
  if (window.EcoAudio) return;

  const BASE = "assets/audio/site/";
  const SFX = Object.freeze({
    click1: ["click1.mp3", .58],
    click2: ["click2.mp3", .64],
    click3: ["click3.mp3", .58],
    notification: ["notification.mp3", .62],
    collectItem: ["collect_item.wav", .58],
    itemReceived: ["item_received.mp3", .62],
    itemUsed: ["item_used.mp3", .62],
    playerConnected: ["player_connected.mp3", .48],
    playerDisconnected: ["player_disconnected.mp3", .46],
    step1: ["step1.mp3", .52],
    step2: ["step2.mp3", .52],
    step3: ["step3.mp3", .52],
    step4: ["step4.mp3", .52]
  });
  const MUSIC = Object.freeze({
    menu: ["menu_loop.ogg", .24, 1850],
    waiting: ["lobby_wait_loop.ogg", .20, 1500],
    loading: ["loading_loop.ogg", .18, 1050]
  });

  const cache = new Map();
  const cooldowns = new Map();
  let unlocked = false;
  let pendingMusic = "";
  let currentMusic = "";
  let musicToken = 0;
  let stepCursor = 0;

  const music = new Audio();
  music.preload = "auto";
  music.loop = true;
  music.volume = 0;

  const clamp = n => Math.max(0, Math.min(1, Number(n || 0)));
  const now = () => performance.now();

  function inJustDance(target = null) {
    if (target?.closest?.("#danceDevScreen, #sensorModePanel")) return true;
    const pcDance = document.querySelector("#danceDevScreen.party-dance-session:not(.hidden)");
    const phoneDance = document.body.classList.contains("state-dance") ||
      document.querySelector("#sensorModePanel.final-dance-controller-clean:not(.hidden)");
    return Boolean(pcDance || phoneDance);
  }

  function source(path) { return `${BASE}${path}`; }

  function baseAudio(name) {
    if (cache.has(name)) return cache.get(name);
    const spec = SFX[name];
    if (!spec) return null;
    try {
      const audio = new Audio(source(spec[0]));
      audio.preload = "auto";
      audio.volume = clamp(spec[1]);
      cache.set(name, audio);
      return audio;
    } catch {
      return null;
    }
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    // Pré-carrega sem disparar nenhum som.
    Object.keys(SFX).forEach(name => {
      try { baseAudio(name)?.load?.(); } catch {}
    });
    if (pendingMusic) void setMusic(pendingMusic);
  }

  function sfx(name, options = {}) {
    if (inJustDance(options.target || null) && !options.allowDuringDance) return false;
    if (!unlocked) unlock();
    const base = baseAudio(name);
    if (!base) return false;

    const cooldown = Math.max(0, Number(options.cooldown || 0));
    const previous = cooldowns.get(name) || 0;
    if (cooldown && now() - previous < cooldown) return false;
    cooldowns.set(name, now());

    try {
      const audio = base.cloneNode(true);
      audio.volume = clamp((options.volume ?? 1) * base.volume);
      audio.currentTime = 0;
      audio.playbackRate = Math.max(.7, Math.min(1.35, Number(options.rate || 1)));
      audio.play().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  function step() {
    stepCursor = (stepCursor % 4) + 1;
    return sfx(`step${stepCursor}`, {
      rate: .97 + Math.random() * .07,
      cooldown: 70
    });
  }

  function fadeVolume(audio, from, to, duration, token, onDone) {
    const started = now();
    audio.volume = clamp(from);
    const tick = () => {
      if (token !== musicToken) return;
      const t = Math.min(1, (now() - started) / Math.max(1, duration));
      // easeOutCubic: entrada suave sem parecer que "salta" de volume.
      const eased = 1 - Math.pow(1 - t, 3);
      audio.volume = clamp(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
      else onDone?.();
    };
    requestAnimationFrame(tick);
  }

  async function setMusic(name) {
    if (!MUSIC[name]) return stopMusic();
    pendingMusic = name;
    if (!unlocked || inJustDance()) return false;
    if (currentMusic === name && !music.paused) return true;

    const [file, target, fadeMs] = MUSIC[name];
    const myToken = ++musicToken;

    if (!music.paused && music.currentTime > 0) {
      const from = music.volume;
      await new Promise(resolve => fadeVolume(music, from, 0, 260, myToken, resolve));
      if (myToken !== musicToken) return false;
    }

    currentMusic = name;
    pendingMusic = name;
    music.pause();
    music.src = source(file);
    music.loop = true;
    music.currentTime = 0;
    music.volume = 0;

    try {
      await music.play();
      if (myToken !== musicToken) return false;
      // O fade acontece APENAS aqui, no início da faixa.
      // Quando o elemento faz loop, o volume já ficou em target e não é resetado.
      fadeVolume(music, 0, target, fadeMs, myToken);
      return true;
    } catch {
      return false;
    }
  }

  function stopMusic(fadeMs = 360) {
    pendingMusic = "";
    const myToken = ++musicToken;
    if (music.paused) {
      currentMusic = "";
      music.volume = 0;
      return;
    }
    const from = music.volume;
    fadeVolume(music, from, 0, fadeMs, myToken, () => {
      if (myToken !== musicToken) return;
      music.pause();
      music.currentTime = 0;
      currentMusic = "";
    });
  }

  function musicForView(name) {
    const menuViews = new Set(["main","play","profiles","how","free","credits","settings","saves"]);
    if (menuViews.has(String(name || ""))) return setMusic("menu");
    stopMusic();
  }

  function loadingStart() { return setMusic("loading"); }
  function lobbyWaiting() { return setMusic("waiting"); }
  function lobbyEnded(next = "board") {
    if (next === "menu" || next === "play" || next === "main") return setMusic("menu");
    stopMusic();
  }

  // Primeira interação libera áudio nos navegadores que bloqueiam autoplay.
  document.addEventListener("pointerdown", unlock, { once:true, capture:true });
  document.addEventListener("keydown", unlock, { once:true, capture:true });

  // SFX de interface genéricos. Just Dance fica explicitamente excluído.
  document.addEventListener("click", event => {
    const button = event.target.closest?.("button, [role='button'], .final-file-button");
    if (!button || button.disabled || inJustDance(button)) return;
    if (button.matches(".final-danger, [data-audio='danger']")) sfx("click3", { target:button });
    else if (button.matches(".final-primary, .primary, .roll-button, .final-main-primary, [data-audio='primary']")) sfx("click2", { target:button });
    else sfx("click1", { target:button });
  }, true);

  window.addEventListener("eco:view-changed", event => musicForView(event.detail?.name));
  window.addEventListener("eco:loading-start", loadingStart);
  window.addEventListener("eco:lobby-waiting", lobbyWaiting);
  window.addEventListener("eco:lobby-ended", event => lobbyEnded(event.detail?.next));
  window.addEventListener("eco:music-stop", () => stopMusic());

  window.EcoAudio = Object.freeze({
    unlock, sfx, step, setMusic, stopMusic, musicForView,
    loadingStart, lobbyWaiting, lobbyEnded,
    getCurrentMusic: () => currentMusic
  });
})();
