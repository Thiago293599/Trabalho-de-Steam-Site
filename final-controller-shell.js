(() => {
  "use strict";

  const SONGS = {
    RainOverMe: {
      title: "Rain Over Me", artist: "Pitbull Ft. Marc Anthony",
      cover: "minigames/just-dance/songs/RainOverMe/rainoverme_cover@2x.jpg"
    },
    EarthSong: {
      title: "Earth Song", artist: "Michael Jackson",
      cover: "minigames/just-dance/songs/EarthSong/earthsong_cover@2x.jpg"
    },
    ItsRainingMen: {
      title: "It's Raining Men", artist: "The Weather Girls",
      cover: "minigames/just-dance/songs/ItsRainingMen/itsrainingmen_cover@2x.jpg"
    },
    WhereHaveYou: {
      title: "Where Have You Been", artist: "Rihanna",
      cover: "minigames/just-dance/songs/WhereHaveYou/wherehaveyou_cover@2x.jpg"
    }
  };

  const MAX_SCORE = 13333;
  const SOUND_ROOT = "minigames/just-dance/hud/sounds";
  const starSounds = [1,2,3,4,5].map(n => new Audio(`${SOUND_ROOT}/star${n}.mp3`));
  const yeahSound = new Audio(`${SOUND_ROOT}/yeah.mp3`);
  starSounds.forEach(audio => { audio.preload = "auto"; audio.volume = .72; });
  yeahSound.preload = "auto"; yeahSound.volume = .78;

  const joinScreen = document.getElementById("joinScreen");
  const controlScreen = document.getElementById("controlScreen");
  const sensorPanel = document.getElementById("sensorModePanel");
  const gate = document.getElementById("finalControllerOrientationGate");
  const gateTitle = document.getElementById("finalOrientationTitle");
  const gateText = document.getElementById("finalOrientationText");
  const fullscreenBtn = document.getElementById("finalEnterFullscreen");
  const songCard = document.getElementById("finalDanceSongCard");
  const songCover = document.getElementById("finalDanceSongCover");
  const songTitle = document.getElementById("finalDanceSongTitle");
  const songArtist = document.getElementById("finalDanceSongArtist");
  const scoreEl = document.getElementById("sensorDanceScore");
  const progressFill = document.getElementById("finalDanceProgressFill");
  const judgementEl = document.getElementById("sensorDanceJudgement");
  const starsWrap = document.getElementById("sensorDanceStars");

  let audioUnlocked = false;
  let starBaselineReady = false;
  let lastStars = 0;
  let lastYeahAt = 0;
  let currentSongId = "";

  function isDanceMode() {
    return Boolean(controlScreen?.classList.contains("sensor-mode-active") || (sensorPanel && !sensorPanel.classList.contains("hidden")));
  }

  function requiredOrientation() {
    return isDanceMode() ? "portrait" : "landscape";
  }

  function orientationMatches(mode) {
    const landscape = window.innerWidth > window.innerHeight;
    return mode === "portrait" ? !landscape : landscape;
  }

  async function requestFullscreenAndOrientation() {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      }
    } catch {}
    try {
      const orientation = requiredOrientation();
      if (screen.orientation?.lock) await screen.orientation.lock(orientation);
    } catch {}
    updateOrientationGate();
  }

  function updateOrientationGate() {
    if (!gate) return;
    // Enquanto está na tela de conexão, apenas recomenda; depois de conectar,
    // a orientação passa a ser requisito real do controle.
    const connected = Boolean(controlScreen && !controlScreen.classList.contains("hidden"));
    if (!connected) {
      gate.classList.add("hidden");
      return;
    }
    const mode = requiredOrientation();
    const ok = orientationMatches(mode);
    gate.classList.toggle("hidden", ok);
    if (!ok) {
      if (mode === "portrait") {
        gateTitle.textContent = "Deixe o celular em pé";
        gateText.textContent = "O controle do Just Dance usa a orientação vertical.";
      } else {
        gateTitle.textContent = "Gire o celular";
        gateText.textContent = "Os controles gerais e os outros minigames usam a orientação horizontal.";
      }
    }
  }

  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    [...starSounds, yeahSound].forEach(audio => {
      try {
        audio.muted = true;
        const p = audio.play();
        if (p?.then) p.then(() => { audio.pause(); audio.currentTime = 0; audio.muted = false; }).catch(() => { audio.muted = false; });
        else audio.muted = false;
      } catch { audio.muted = false; }
    });
  }

  function playAudio(audio) {
    if (!audioUnlocked || !audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {}
  }

  function renderSong(songId) {
    currentSongId = songId;
    const song = SONGS[songId];
    if (!song) {
      songCard?.classList.add("hidden");
      return;
    }
    songCard?.classList.remove("hidden");
    if (songTitle) songTitle.textContent = song.title;
    if (songArtist) songArtist.textContent = song.artist;
    if (songCover) {
      songCover.src = song.cover;
      songCover.alt = `Capa de ${song.title}`;
    }
    starBaselineReady = false;
    lastStars = 0;
  }

  function readScore() {
    return Number(String(scoreEl?.textContent || "0").replace(/[^\d]/g, "")) || 0;
  }

  function renderScoreProgress() {
    const score = Math.max(0, Math.min(MAX_SCORE, readScore()));
    if (progressFill) progressFill.style.width = `${(score / MAX_SCORE) * 100}%`;

    const filled = starsWrap ? [...starsWrap.querySelectorAll("span")].filter(s => s.classList.contains("filled")).length : 0;
    if (!starBaselineReady) {
      lastStars = filled;
      starBaselineReady = true;
      return;
    }
    if (filled > lastStars) {
      for (let star = lastStars + 1; star <= filled; star++) {
        playAudio(starSounds[Math.min(4, star - 1)]);
        const starEl = starsWrap?.querySelectorAll("span")?.[star - 1];
        if (starEl) {
          starEl.classList.remove("final-dance-star-pop");
          void starEl.offsetWidth;
          starEl.classList.add("final-dance-star-pop");
        }
      }
    }
    lastStars = filled;
  }

  function maybePlayYeah() {
    if (!judgementEl) return;
    const isYeah = String(judgementEl.textContent || "").trim().toUpperCase().startsWith("YEAH");
    const popped = judgementEl.classList.contains("pop");
    const now = performance.now();
    if (isYeah && popped && now - lastYeahAt > 550) {
      lastYeahAt = now;
      playAudio(yeahSound);
    }
  }

  window.addEventListener("phone-dance-session", event => {
    renderSong(String(event.detail?.songId || ""));
    updateOrientationGate();
    requestFullscreenAndOrientation();
  });

  window.addEventListener("resize", updateOrientationGate);
  window.addEventListener("orientationchange", () => setTimeout(updateOrientationGate, 120));
  document.addEventListener("fullscreenchange", updateOrientationGate);

  document.getElementById("joinBtn")?.addEventListener("click", () => {
    unlockAudio();
    requestFullscreenAndOrientation();
  }, { capture:true });

  document.getElementById("enableSensorsBtn")?.addEventListener("click", () => {
    unlockAudio();
    requestFullscreenAndOrientation();
  }, { capture:true });

  fullscreenBtn?.addEventListener("click", () => {
    unlockAudio();
    requestFullscreenAndOrientation();
  });

  document.addEventListener("pointerdown", unlockAudio, { once:true, capture:true });

  const classObserver = new MutationObserver(() => updateOrientationGate());
  if (controlScreen) classObserver.observe(controlScreen, { attributes:true, attributeFilter:["class"] });
  if (sensorPanel) classObserver.observe(sensorPanel, { attributes:true, attributeFilter:["class"] });

  if (scoreEl || starsWrap) {
    const scoreObserver = new MutationObserver(renderScoreProgress);
    if (scoreEl) scoreObserver.observe(scoreEl, { childList:true, subtree:true, characterData:true });
    if (starsWrap) scoreObserver.observe(starsWrap, { attributes:true, subtree:true, attributeFilter:["class"] });
  }

  if (judgementEl) {
    const judgementObserver = new MutationObserver(maybePlayYeah);
    judgementObserver.observe(judgementEl, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:["class"] });
  }

  renderScoreProgress();
  updateOrientationGate();
})();