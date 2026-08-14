(() => {
  "use strict";

  const CONFIG = window.STEAM_PARTY_CONFIG || {};
  const PROFILE_KEY = "steamPartyProfilesV1";
  const ACTIVE_PROFILE_KEY = "steamPartyActiveProfileV1";
  const MATCH_KEY = "steamPartyMatchConfigV1";
  const JD_QUALITY_KEY = "jdVideoQualityModeV1";
  const JD_LYRICS_KEY = "jdLyricsSizeFinalV1";
  const JD_VOLUME_KEY = "jdVolumeV1";

  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => [...root.querySelectorAll(s)];
  const shell = qs("#finalShell");
  if (!shell) return;

  document.body.classList.add("final-shell-v1");

  const views = {
    start: qs("#finalStartScreen"),
    main: qs("#finalMainMenu"),
    play: qs("#finalPlayMenu"),
    profiles: qs("#finalProfilesMenu"),
    how: qs("#finalHowMenu"),
    free: qs("#finalFreeMenu"),
    credits: qs("#finalCreditsMenu"),
    settings: qs("#finalSettingsMenu"),
    saves: qs("#finalSavesMenu"),
    board: qs("#finalBoardView")
  };

  let selectedMatchMode = "local";
  let selectedFreeMode = "local";
  let editingProfileId = "";
  let editingProfilePhoto = "";
  let toastTimer = 0;

  function safeParse(raw, fallback) {
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  function getProfiles() {
    const list = safeParse(localStorage.getItem(PROFILE_KEY), []);
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }

  function setProfiles(list) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(list));
  }

  function activeProfileId() {
    return localStorage.getItem(ACTIVE_PROFILE_KEY) || "";
  }

  function setActiveProfile(id) {
    if (id) localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    else localStorage.removeItem(ACTIVE_PROFILE_KEY);
    renderProfileChip();
    renderProfiles();
    fillLegacyNames();
  }

  function getActiveProfile() {
    const id = activeProfileId();
    return getProfiles().find(p => p.id === id) || null;
  }

  function showToast(message) {
    let toast = qs("#finalToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "finalToast";
      toast.className = "final-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function showView(name) {
    Object.entries(views).forEach(([key, el]) => el?.classList.toggle("hidden", key !== name));
    if (name === "profiles") renderProfiles();
    if (name === "settings") renderGameSettings();
    if (name === "saves") window.STEAMPartySaves?.render?.();
    if (name === "main") {
      renderProfileChip();
      window.STEAMPartySaves?.renderMenuCard?.();
    }
  }

  function startGameShell() {
    showView("main");
  }

  function colorValue(name) {
    return ({
      cyan: "#56d9ff",
      green: "#65f2a8",
      orange: "#ffae57",
      pink: "#ff72b8",
      purple: "#a987ff",
      yellow: "#f6df65"
    })[name] || "#65f2c3";
  }

  function safeAvatarPhoto(value) {
    const text = String(value || "");
    if (text.length > 140000) return "";
    return /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(text) ? text : "";
  }

  async function profilePhotoFromFile(file) {
    if (!file || !String(file.type || "").startsWith("image/")) throw new Error("Selecione uma imagem.");
    if (Number(file.size || 0) > 12 * 1024 * 1024) throw new Error("A imagem é grande demais.");
    const bitmap = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível abrir a imagem.")); };
      img.src = url;
    });
    const render = (size, quality, type = "image/webp") => {
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d", { alpha:false });
      const iw = Math.max(1, bitmap.naturalWidth || bitmap.width || 1);
      const ih = Math.max(1, bitmap.naturalHeight || bitmap.height || 1);
      const scale = Math.max(size / iw, size / ih);
      const sw = size / scale, sh = size / scale;
      const sx = (iw - sw) / 2, sy = (ih - sh) / 2;
      ctx.fillStyle = "#111"; ctx.fillRect(0, 0, size, size);
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, size, size);
      return canvas.toDataURL(type, quality);
    };
    let data = render(224, .82, "image/webp");
    if (!data.startsWith("data:image/webp") || data.length > 115000) data = render(192, .76, "image/jpeg");
    if (data.length > 115000) data = render(160, .68, "image/jpeg");
    if (!safeAvatarPhoto(data)) throw new Error("Não foi possível compactar a foto.");
    return data;
  }

  function avatarSvg(profile = {}, small = false) {
    const photo = safeAvatarPhoto(profile.avatarPhoto);
    if (photo) return `<span class="final-avatar-photo${small ? " is-small" : ""}"><img src="${photo}" alt="" /></span>`;
    const color = colorValue(profile.avatarColor || "cyan");
    const shape = profile.avatarShape || "round";
    const face = profile.avatarFace || "smile";
    const shapePath = {
      round: '<rect x="18" y="18" width="84" height="84" rx="38"/>',
      square: '<rect x="18" y="18" width="84" height="84" rx="20"/>',
      triangle: '<path d="M60 13 L108 101 Q110 106 103 106 H17 Q10 106 12 101 Z"/>',
      hex: '<path d="M34 14 H86 L110 60 L86 106 H34 L10 60 Z"/>'
    }[shape] || '<rect x="18" y="18" width="84" height="84" rx="38"/>';
    const mouths = {
      smile: 'M43 72 Q60 88 77 72',
      calm: 'M46 76 Q60 82 74 76',
      focus: 'M47 78 H73',
      happy: 'M42 70 Q60 93 78 70'
    };
    const eyeRy = face === "happy" ? 3 : 5;
    return `<svg viewBox="0 0 120 120" role="img" aria-label="Avatar">
      <g fill="${color}" stroke="rgba(255,255,255,.62)" stroke-width="3">${shapePath}</g>
      <circle cx="45" cy="53" r="5" ry="${eyeRy}" fill="#082126"/>
      <circle cx="75" cy="53" r="5" ry="${eyeRy}" fill="#082126"/>
      <path d="${mouths[face] || mouths.smile}" fill="none" stroke="#082126" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M31 35 Q60 18 89 35" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }

  function renderProfileChip() {
    const chip = qs("#finalActiveProfileChip");
    if (!chip) return;
    const profile = getActiveProfile();
    const slot = qs(".final-mini-avatar", chip);
    const strong = qs("strong", chip);
    if (profile) {
      slot.innerHTML = avatarSvg(profile, true);
      slot.style.background = "transparent";
      strong.textContent = profile.name || "Jogador";
    } else {
      slot.innerHTML = "";
      slot.style.background = "linear-gradient(145deg,var(--final-accent),var(--final-accent-2))";
      strong.textContent = "Convidado";
    }
  }

  function profileTemplate() {
    return {
      id: `profile-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      name: "Jogador",
      avatarShape: "round",
      avatarColor: "cyan",
      avatarFace: "smile",
      avatarPhoto: "",
      stats: { matches: 0, wins: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function renderProfiles() {
    const list = qs("#finalProfileList");
    if (!list) return;
    const profiles = getProfiles();
    const activeId = activeProfileId();

    list.innerHTML = "";
    if (!profiles.length) {
      const empty = document.createElement("div");
      empty.className = "final-info-box";
      empty.textContent = "Nenhum perfil criado ainda. Crie um perfil ou importe um arquivo.";
      list.appendChild(empty);
    }

    profiles.forEach(profile => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `final-profile-item${profile.id === activeId ? " is-active" : ""}`;
      item.innerHTML = `<span class="avatar-slot">${avatarSvg(profile, true)}</span><span><strong></strong><small></small></span>`;
      qs("strong", item).textContent = profile.name || "Jogador";
      qs("small", item).textContent = profile.id === activeId ? "Perfil ativo" : "Toque para editar";
      item.addEventListener("click", () => openProfileEditor(profile.id));
      list.appendChild(item);
    });
  }

  function openProfileEditor(id) {
    const profiles = getProfiles();
    let profile = profiles.find(p => p.id === id);
    if (!profile) {
      profile = profileTemplate();
      profiles.push(profile);
      setProfiles(profiles);
    }
    editingProfileId = profile.id;
    qs("#finalProfileEditor")?.classList.remove("hidden");
    qs("#finalProfileName").value = profile.name || "Jogador";
    qs("#finalAvatarShape").value = profile.avatarShape || "round";
    qs("#finalAvatarColor").value = profile.avatarColor || "cyan";
    qs("#finalAvatarFace").value = profile.avatarFace || "smile";
    editingProfilePhoto = safeAvatarPhoto(profile.avatarPhoto);
    const removePhoto = qs("#finalRemoveProfilePhoto");
    if (removePhoto) removePhoto.disabled = !editingProfilePhoto;
    renderAvatarPreview();
    if (!activeProfileId()) setActiveProfile(profile.id);
    else renderProfiles();
  }

  function editorProfileData() {
    const current = getProfiles().find(p => p.id === editingProfileId) || profileTemplate();
    return {
      ...current,
      id: editingProfileId || current.id,
      name: String(qs("#finalProfileName")?.value || "Jogador").trim().slice(0,18) || "Jogador",
      avatarShape: qs("#finalAvatarShape")?.value || "round",
      avatarColor: qs("#finalAvatarColor")?.value || "cyan",
      avatarFace: qs("#finalAvatarFace")?.value || "smile",
      avatarPhoto: safeAvatarPhoto(editingProfilePhoto),
      updatedAt: new Date().toISOString()
    };
  }

  function renderAvatarPreview() {
    const preview = qs("#finalAvatarPreview");
    if (preview) preview.innerHTML = avatarSvg(editorProfileData());
  }

  function saveProfile(event) {
    event?.preventDefault();
    const profile = editorProfileData();
    const profiles = getProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index >= 0) profiles[index] = profile;
    else profiles.push(profile);
    setProfiles(profiles);
    editingProfileId = profile.id;
    setActiveProfile(profile.id);
    showToast("Perfil salvo neste dispositivo.");
  }

  function exportProfile() {
    if (!editingProfileId) return;
    saveProfile();
    const profile = getProfiles().find(p => p.id === editingProfileId);
    if (!profile) return;
    const payload = {
      format: "steam-party-profile",
      version: 1,
      exportedAt: new Date().toISOString(),
      profile
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = String(profile.name || "perfil").replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0,30) || "perfil";
    a.href = url;
    a.download = `${safe}.steamprofile.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Arquivo do perfil exportado.");
  }

  async function importProfile(file) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const source = payload?.format === "steam-party-profile" ? payload.profile : payload;
      if (!source || typeof source !== "object") throw new Error("Formato inválido");
      const profile = {
        ...profileTemplate(),
        ...source,
        id: `profile-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        name: String(source.name || "Jogador").slice(0,18),
        avatarPhoto: safeAvatarPhoto(source.avatarPhoto),
        stats: source.stats && typeof source.stats === "object" ? source.stats : { matches:0, wins:0 },
        importedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const profiles = getProfiles();
      profiles.push(profile);
      setProfiles(profiles);
      setActiveProfile(profile.id);
      openProfileEditor(profile.id);
      showToast("Perfil importado.");
    } catch {
      showToast("Não foi possível importar esse perfil.");
    }
  }

  function deleteProfile() {
    if (!editingProfileId) return;
    const profiles = getProfiles().filter(p => p.id !== editingProfileId);
    setProfiles(profiles);
    if (activeProfileId() === editingProfileId) setActiveProfile(profiles[0]?.id || "");
    editingProfileId = "";
    editingProfilePhoto = "";
    qs("#finalProfileEditor")?.classList.add("hidden");
    renderProfiles();
    showToast("Perfil removido deste dispositivo.");
  }

  function botDifficultyFor(index) {
    return qs(`[data-bot-index="${index}"]`)?.value || "normal";
  }

  function renderMatchRules() {
    const humans = Math.max(1, Math.min(4, Number(qs("#finalHumanPlayers")?.value || 1)));
    const control = qs("#finalControlMethod")?.value || "keyboard";
    const botCount = Math.max(0, 4 - humans);
    const botsList = qs("#finalBotsList");
    const badge = qs("#finalCompatibilityBadge");
    const message = qs("#finalRuleMessage");
    const controlSelect = qs("#finalControlMethod");

    // No multiplayer online/por celulares, não misturamos teclado com celular.
    const keyboardForbidden = (selectedMatchMode === "phones") || (selectedMatchMode === "online" && humans > 1);
    qsa('option[value="keyboard"]', controlSelect).forEach(option => option.disabled = keyboardForbidden);
    if (keyboardForbidden && control === "keyboard") {
      controlSelect.value = "phone-touch";
      return renderMatchRules();
    }

    const effectiveControl = controlSelect.value;
    const samePcMulti = selectedMatchMode === "local" && effectiveControl === "keyboard" && humans >= 2;
    const minigames = !samePcMulti;
    const continueButton = qs("#finalContinuePrototype");
    if (continueButton) {
      const connected = selectedMatchMode === "phones" || String(effectiveControl).startsWith("phone-");
      continueButton.textContent = selectedMatchMode === "online"
        ? "Abrir sala Online"
        : connected
          ? "Criar sala e iniciar tabuleiro"
          : "Iniciar tabuleiro";
    }
    const motion = minigames && effectiveControl === "phone-motion";

    qs("#finalMinigameStatus").textContent = minigames ? "Ativados" : "Desativados";
    qs("#finalMotionStatus").textContent = motion ? "Ativados" : "Desativados";
    qs("#finalBotCount").textContent = `${botCount} bot${botCount === 1 ? "" : "s"}`;

    badge.textContent = samePcMulti ? "Modo simplificado" : "Compatível";
    badge.classList.toggle("is-warning", samePcMulti);

    if (samePcMulti) {
      message.textContent = "Com 2–4 humanos no mesmo PC usando teclado, os minigames entre rodadas ficam desativados. O tabuleiro continua normalmente.";
    } else if (effectiveControl === "phone-motion") {
      message.textContent = "Todos os humanos usam celular com sensores. Minigames de toque e movimento ficam disponíveis.";
    } else if (effectiveControl === "phone-touch") {
      message.textContent = "Todos os humanos usam celular sem sensores. Minigames de movimento são filtrados, mas os de toque continuam disponíveis.";
    } else {
      message.textContent = "Um jogador pode usar teclado sem celular. Minigames que exigem sensores de movimento são filtrados automaticamente.";
    }

    const previous = {};
    qsa("[data-bot-index]", botsList).forEach(sel => previous[sel.dataset.botIndex] = sel.value);
    botsList.innerHTML = "";
    for (let i = 0; i < botCount; i++) {
      const card = document.createElement("div");
      card.className = "final-bot-card";
      card.innerHTML = `<strong>Bot ${i + 1}</strong><label>Dificuldade<select data-bot-index="${i}">
        <option value="easy">Fácil</option>
        <option value="normal">Normal</option>
        <option value="hard">Difícil</option>
      </select></label>`;
      const select = qs("select", card);
      select.value = previous[i] || "normal";
      botsList.appendChild(card);
    }

    return { humans, control: effectiveControl, botCount, minigames, motion };
  }

  function saveMatchConfig() {
    const rules = renderMatchRules();
    const bots = Array.from({ length: rules.botCount }, (_, i) => ({
      slot: rules.humans + i + 1,
      difficulty: botDifficultyFor(i)
    }));
    const config = {
      version: 1,
      mode: selectedMatchMode,
      humanPlayers: rules.humans,
      controlMethod: rules.control,
      bots,
      minigamesEnabled: rules.minigames,
      motionMinigamesEnabled: rules.motion,
      rounds: Math.max(1, Number(qs("#finalRoundCount")?.value || CONFIG.board?.defaultRounds || 5)),
      activeProfileId: activeProfileId(),
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(MATCH_KEY, JSON.stringify(config));
    showToast("Configuração da partida salva.");
    return config;
  }

  function selectMatchMode(mode) {
    selectedMatchMode = mode;
    qsa("[data-match-mode]").forEach(btn => btn.classList.toggle("is-selected", btn.dataset.matchMode === mode));
    const names = { local:"Local", phones:"Celulares", online:"Online" };
    qs("#finalMatchModeTitle").textContent = names[mode] || "Partida";
    qs("#finalMatchSetup")?.classList.remove("hidden");

    // Presets coerentes com o tipo escolhido.
    if (mode === "phones") qs("#finalControlMethod").value = "phone-motion";
    if (mode === "online") qs("#finalControlMethod").value = "phone-touch";
    if (mode === "local") qs("#finalControlMethod").value = "keyboard";
    const continueButton = qs("#finalContinuePrototype");
    if (continueButton) {
      continueButton.textContent = mode === "local"
        ? "Iniciar partida"
        : mode === "online"
          ? "Abrir sala Online"
          : "Criar sala e iniciar tabuleiro";
    }
    renderMatchRules();
    qs("#finalMatchSetup")?.scrollIntoView({ behavior:"smooth", block:"nearest" });

    if (mode === "online") {
      setTimeout(() => window.STEAMOnlineV2?.open?.(), 0);
    } else {
      window.STEAMOnlineV2?.close?.();
    }
  }


  function renderFreeControls() {
    qsa("[data-free-mode]").forEach(btn => btn.classList.toggle("is-selected", btn.dataset.freeMode === selectedFreeMode));
    const control = qs("#finalFreeControl");
    const humans = qs("#finalFreeHumans");
    const wrap = qs("#finalFreeControlWrap");
    const status = qs("#finalFreeStatus");
    if (selectedFreeMode === "party") {
      if (control) control.value = "phone-motion";
      if (control) control.disabled = true;
      if (humans && Number(humans.value) < 2) humans.value = "2";
      if (wrap) wrap.classList.remove("is-muted");
      if (status) status.textContent = "Party: todos usam celulares em pé e a tela principal fica apenas para acompanhar o jogo.";
    } else if (selectedFreeMode === "online") {
      if (control) control.disabled = false;
      if (humans && Number(humans.value) < 2) humans.value = "2";
      if (status) status.textContent = "Online: crie uma sala. Cada jogador usa a própria tela e, se escolher celular, o PC não recebe comandos de gameplay.";
    } else {
      if (control) control.disabled = false;
      if (status) status.textContent = control?.value === "phone-motion"
        ? "Local + celular: será criada uma sala de controle para este teste."
        : "Local: minigames de sensor usam Espaço/clique para simular movimento; Just Dance funciona como teste visual.";
    }
  }

  function freeConfig(minigameId) {
    const humans = Math.max(1, Math.min(4, Number(qs("#finalFreeHumans")?.value || 1)));
    const control = qs("#finalFreeControl")?.value === "phone-motion" ? "phone-motion" : "keyboard";
    const phone = selectedFreeMode === "party" || control === "phone-motion";
    const effectiveHumans = selectedFreeMode === "party" ? Math.max(2, humans) : humans;
    return {
      version: 1,
      mode: phone ? "phones" : "local",
      humanPlayers: effectiveHumans,
      controlMethod: phone ? "phone-motion" : "keyboard",
      bots: Array.from({length: Math.max(0,4-effectiveHumans)}, (_,i)=>({slot:effectiveHumans+i+1,difficulty:"normal"})),
      minigamesEnabled: true,
      motionMinigamesEnabled: phone || ["flood-escape","wildfire-pump","drone-balance","dam-alarm"].includes(minigameId),
      rounds: 1,
      activeProfileId: activeProfileId(),
      freeMode: true,
      freeModeSource: selectedFreeMode,
      forcedFreeMinigame: minigameId,
      savedAt: new Date().toISOString()
    };
  }

  function startFreeMinigame(minigameId) {
    if (!minigameId) return;
    if (selectedFreeMode === "online") {
      const control = qs("#finalFreeControl")?.value === "phone-motion" ? "phone-motion" : "keyboard";
      if (!window.STEAMOnlineV2?.openFree) {
        showToast("A interface Online ainda está carregando.");
        return;
      }
      window.STEAMOnlineV2.openFree(minigameId, { controlMethod:control });
      return;
    }
    const config = freeConfig(minigameId);
    if (!window.STEAMPartyBoard?.startFree?.(config, minigameId)) {
      showToast("Não foi possível iniciar este teste.");
    }
  }

  function fillLegacyNames() {
    const profile = getActiveProfile();
    if (!profile?.name) return;
    ["hostPlayerName", "onlinePlayerName", "playerName"].forEach(id => {
      const input = document.getElementById(id);
      if (input && !input.value) input.value = profile.name;
    });
  }

  function exitShellToLegacy() {
    shell.classList.add("hidden");
    document.body.classList.remove("final-shell-v1");
  }

  function returnToShellMain() {
    document.getElementById("mainMenu")?.classList.add("hidden");
    shell.classList.remove("hidden");
    document.body.classList.add("final-shell-v1");
    showView("main");
  }

  function openLegacyFromConfig() {
    const config = saveMatchConfig();

    // V15: o tabuleiro novo já roda localmente. A ponte completa do
    // tabuleiro novo com celulares/online será a próxima etapa.
    if (
      (config.mode === "local" || config.mode === "phones") &&
      window.STEAMPartyBoard?.start(config)
    ) return;

    // V38: Online pertence à NOVA interface. Nunca esconder o finalShell
    // e nunca acionar #onlineModeBtn da build antiga.
    if (config.mode === "online") {
      showView("play");
      qs("#finalMatchSetup")?.classList.remove("hidden");
      if (window.STEAMOnlineV2?.open) {
        window.STEAMOnlineV2.open();
      } else {
        qs("#finalOnlineV2Panel")?.classList.remove("hidden");
        showToast("Carregando interface Online…");
      }
      return;
    }

    exitShellToLegacy();
    document.getElementById("localModeBtn")?.click();
    setTimeout(() => {
      if (config.mode === "phones" || String(config.controlMethod).startsWith("phone-")) {
        document.getElementById("phoneModeBtn")?.click();
      } else {
        document.getElementById("sameDeviceBtn")?.click();
      }
    }, 30);
  }

  qs("#finalPressStart")?.addEventListener("click", startGameShell);
  views.start?.addEventListener("click", event => {
    if (event.target.closest("button")) return;
    startGameShell();
  });
  document.addEventListener("keydown", event => {
    if (!views.start?.classList.contains("hidden") && event.key === "Enter") {
      event.preventDefault();
      startGameShell();
    }
  });

  qsa("[data-final-nav]").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.finalNav)));
  qsa("[data-final-back]").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.finalBack)));
  qsa("[data-match-mode]").forEach(btn => btn.addEventListener("click", () => selectMatchMode(btn.dataset.matchMode)));


  qsa("[data-free-mode]").forEach(btn => btn.addEventListener("click", () => {
    selectedFreeMode = btn.dataset.freeMode || "local";
    renderFreeControls();
  }));
  qs("#finalFreeControl")?.addEventListener("change", renderFreeControls);
  qsa("[data-free-minigame]").forEach(btn => btn.addEventListener("click", () => startFreeMinigame(btn.dataset.freeMinigame)));

  qs("#finalHumanPlayers")?.addEventListener("change", renderMatchRules);
  qs("#finalControlMethod")?.addEventListener("change", renderMatchRules);
  qs("#finalSaveMatch")?.addEventListener("click", saveMatchConfig);
  qs("#finalContinuePrototype")?.addEventListener("click", openLegacyFromConfig);

  function readLocalSetting(key, fallback) {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  }

  function writeLocalSetting(key, value) {
    try { localStorage.setItem(key, String(value)); } catch {}
  }

  function renderGameSettings() {
    const quality = qs("#finalSettingJdQuality");
    const lyrics = qs("#finalSettingJdLyrics");
    const volume = qs("#finalSettingJdVolume");
    const volumeValue = qs("#finalSettingJdVolumeValue");
    if (quality) quality.value = ["auto","low","medium","high"].includes(readLocalSetting(JD_QUALITY_KEY,"auto")) ? readLocalSetting(JD_QUALITY_KEY,"auto") : "auto";
    if (lyrics) lyrics.value = ["small","normal","large"].includes(readLocalSetting(JD_LYRICS_KEY,"normal")) ? readLocalSetting(JD_LYRICS_KEY,"normal") : "normal";
    const v = Math.max(0, Math.min(100, Math.round(Number(readLocalSetting(JD_VOLUME_KEY,"0.9")) * 100)));
    if (volume) volume.value = String(v);
    if (volumeValue) volumeValue.textContent = `${v}%`;
  }

  function saveGameSetting(key, value, message = "Configuração salva.") {
    writeLocalSetting(key, value);
    const status = qs("#finalSettingsSaved");
    if (status) status.textContent = message;
    window.dispatchEvent(new CustomEvent("steam-party-settings-changed", { detail:{ key, value } }));
  }

  qs("#finalProfilePhoto")?.addEventListener("change", async event => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      editingProfilePhoto = await profilePhotoFromFile(file);
      const removePhoto = qs("#finalRemoveProfilePhoto");
      if (removePhoto) removePhoto.disabled = false;
      renderAvatarPreview();
      showToast("Foto preparada. Toque em Salvar perfil.");
    } catch (error) {
      showToast(error?.message || "Não foi possível usar essa foto.");
    }
  });
  qs("#finalRemoveProfilePhoto")?.addEventListener("click", () => {
    editingProfilePhoto = "";
    const button = qs("#finalRemoveProfilePhoto");
    if (button) button.disabled = true;
    renderAvatarPreview();
  });

  qs("#finalSettingJdQuality")?.addEventListener("change", event => saveGameSetting(JD_QUALITY_KEY, event.currentTarget.value, "Qualidade do Just Dance salva."));
  qs("#finalSettingJdLyrics")?.addEventListener("change", event => saveGameSetting(JD_LYRICS_KEY, event.currentTarget.value, "Tamanho das letras salvo."));
  qs("#finalSettingJdVolume")?.addEventListener("input", event => {
    const value = Math.max(0, Math.min(100, Number(event.currentTarget.value || 0)));
    const output = qs("#finalSettingJdVolumeValue");
    if (output) output.textContent = `${Math.round(value)}%`;
    saveGameSetting(JD_VOLUME_KEY, (value / 100).toFixed(2), "Volume do Just Dance salvo.");
  });

  qs("#finalNewProfile")?.addEventListener("click", () => openProfileEditor(""));
  qs("#finalProfileEditor")?.addEventListener("submit", saveProfile);
  qs("#finalExportProfile")?.addEventListener("click", exportProfile);
  qs("#finalDeleteProfile")?.addEventListener("click", deleteProfile);
  qs("#finalImportProfile")?.addEventListener("change", event => {
    importProfile(event.target.files?.[0]);
    event.target.value = "";
  });
  ["#finalProfileName","#finalAvatarShape","#finalAvatarColor","#finalAvatarFace"].forEach(selector => {
    qs(selector)?.addEventListener("input", renderAvatarPreview);
    qs(selector)?.addEventListener("change", renderAvatarPreview);
  });

  // Voltas do protótipo antigo regressam ao novo menu.
  ["localBackBtn","onlineBackBtn","devBackBtn"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", () => setTimeout(returnToShellMain, 0), true);
  });

  // Aplica o título provisório por uma configuração central.
  if (CONFIG.workingTitle) {
    qs("#finalGameTitle").textContent = CONFIG.workingTitle;
    document.title = CONFIG.workingTitle;
  }

  window.STEAMParty = Object.freeze({
    getProfiles,
    getActiveProfile,
    avatarSvg,
    saveMatchConfig,
    showView,
    showToast,
    returnToShellMain,
    shellElement: shell
  });

  renderProfileChip();
  fillLegacyNames();
  renderGameSettings();
  renderFreeControls();
  try {
    if (new URLSearchParams(location.search).get("profiles") === "1") showView("profiles");
  } catch {}
})();