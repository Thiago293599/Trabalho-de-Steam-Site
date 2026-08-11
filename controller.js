
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

const REQUIRED_SERVER_PROTOCOL = 8;
const MULTIPLAYER_TIMEOUT_MS = 6000;
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

const serverUrl = getServerUrl();
const socket = serverUrl
  ? io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 700,
      reconnectionDelayMax: 3000
    })
  : null;

const joinScreen = document.getElementById("joinScreen");
const controllerBackBtn = document.getElementById("controllerBackBtn");
const controlScreen = document.getElementById("controlScreen");
const playerName = document.getElementById("playerName");
const roomCode = document.getElementById("roomCode");
const joinBtn = document.getElementById("joinBtn");
const joinMessage = document.getElementById("joinMessage");

const playerColor = document.getElementById("playerColor");
const playerLabel = document.getElementById("playerLabel");
const connectionBadge = document.getElementById("connectionBadge");
const turnKicker = document.getElementById("turnKicker");
const turnTitle = document.getElementById("turnTitle");
const turnDescription = document.getElementById("turnDescription");
const mobileDice = document.getElementById("mobileDice");
const mobileRollBtn = document.getElementById("mobileRollBtn");
const mobileDeckArea = document.getElementById("mobileDeckArea");
const mobileDeckBtn = document.getElementById("mobileDeckBtn");
const mobileDeckHint = document.getElementById("mobileDeckHint");
const mobileCardModal = document.getElementById("mobileCardModal");
const mobileDrawnCard = document.getElementById("mobileDrawnCard");
const mobileCardBadge = document.getElementById("mobileCardBadge");
const mobileCardIcon = document.getElementById("mobileCardIcon");
const mobileCardTitle = document.getElementById("mobileCardTitle");
const mobileCardText = document.getElementById("mobileCardText");
const mobileCardAnswers = document.getElementById("mobileCardAnswers");
const mobileCardFeedback = document.getElementById("mobileCardFeedback");
const mobileCardEffect = document.getElementById("mobileCardEffect");
const mobileCardContinue = document.getElementById("mobileCardContinue");
const playerPosition = document.getElementById("playerPosition");
const gameMessage = document.getElementById("gameMessage");
const sensorModePanel = document.getElementById("sensorModePanel");
const sensorModeTitle = document.getElementById("sensorModeTitle");
const sensorModeBadge = document.getElementById("sensorModeBadge");
const sensorModeText = document.getElementById("sensorModeText");
const enableSensorsBtn = document.getElementById("enableSensorsBtn");
const sensorMovementValue = document.getElementById("sensorMovementValue");
const sensorGyroValue = document.getElementById("sensorGyroValue");
const sensorPacketValue = document.getElementById("sensorPacketValue");
const sensorSourceValue = document.getElementById("sensorSourceValue");
const sensorMotionFill = document.getElementById("sensorMotionFill");
const sensorNotice = document.getElementById("sensorNotice");
const sensorDanceScore = document.getElementById("sensorDanceScore");
const sensorDanceRank = document.getElementById("sensorDanceRank");
const sensorDanceStars = document.getElementById("sensorDanceStars");
const sensorDanceJudgement = document.getElementById("sensorDanceJudgement");
const sensorDanceProgress = document.getElementById("sensorDanceProgress");
const boardControllerArea = document.getElementById("boardControllerArea");

let myPlayerId = "";
let joinedRoom = "";
let state = null;
let rolling = false;
let activeMobileCard = null;
let sensorModeRequested = false;
let sensorPermissionGranted = false;
let sensorStreaming = false;
let sensorPacketCount = 0;
let sensorLastSentAt = 0;
let sensorLatestOrientation = { alpha: 0, beta: 0, gamma: 0 };
let sensorLatestAcceleration = { x: 0, y: 0, z: 0 };
let sensorLatestAccelerationIncludingGravity = { x: 0, y: 0, z: 0 };
let sensorLatestRotation = { x: 0, y: 0, z: 0 };
let sensorDerivedRotation = { x: 0, y: 0, z: 0 };
let sensorOrientationPrevious = null;
let sensorLatestIntensity = 0;
let sensorLatestSource = "";
let sensorLastReportedActive = null;
let sensorLastStatusSignature = "";
let sensorWatchdogTimer = null;
let sensorGenericSensors = [];
let sensorGenericErrors = [];
let sensorObserved = { motion: false, orientation: false, gyro: false, accelerometer: false, orientationFallback: false };

const params = new URLSearchParams(location.search);
const initialRoom = (params.get("room") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
roomCode.value = initialRoom;

function showMessage(element, text) {
  element.textContent = text;
  element.classList.remove("hidden");
}

function hideMessage(element) {
  element.classList.add("hidden");
}

function normalizeCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

const MOBILE_CARD_META={question:{label:"Pergunta",icon:"?"},good:{label:"Boa Sorte",icon:"★"},bad:{label:"Má Sorte",icon:"!"}};
function formatMobileMove(delta){const a=Math.abs(Number(delta)||0);if(!delta)return"Você permanece na mesma casa.";if(delta>0)return`Avance ${a} ${a===1?"casa":"casas"}.`;return`Volte ${a} ${a===1?"casa":"casas"}.`;}
function setMobileDeck(p){if(!p||p.playerId!==myPlayerId||p.drawn){mobileDeckArea.classList.add("hidden");mobileDeckBtn.disabled=true;return;}mobileDeckArea.classList.remove("hidden");mobileDeckBtn.disabled=false;mobileDeckBtn.className=`mobile-deck deck-${p.type||"question"} ready`;mobileDeckHint.textContent=`Você caiu em uma casa de ${MOBILE_CARD_META[p.type]?.label||"Carta"}. Toque no baralho para puxar.`;}
function showMobileCard(card){if(!card)return;activeMobileCard=card;const m=MOBILE_CARD_META[card.type]||MOBILE_CARD_META.question;mobileDrawnCard.className=`mobile-drawn-card card-${card.type||"question"}`;mobileCardBadge.textContent=m.label;mobileCardIcon.textContent=m.icon;mobileCardTitle.textContent=card.title;mobileCardText.textContent=card.text;mobileCardFeedback.className="mobile-card-feedback hidden";mobileCardAnswers.innerHTML="";if(card.type==="question"){mobileCardAnswers.classList.remove("hidden");(card.options||[]).forEach((o,i)=>{const b=document.createElement("button");b.type="button";b.className="mobile-answer-option";b.dataset.answerIndex=i;b.textContent=o;mobileCardAnswers.appendChild(b);});mobileCardEffect.textContent=`${formatMobileMove(card.successDelta)} Se errar: ${formatMobileMove(card.failDelta)}`;mobileCardContinue.classList.add("hidden");}else{mobileCardAnswers.classList.add("hidden");mobileCardEffect.textContent=formatMobileMove(card.delta);mobileCardContinue.classList.remove("hidden");mobileCardContinue.disabled=false;}mobileCardModal.classList.remove("hidden");void mobileDrawnCard.offsetWidth;mobileDrawnCard.classList.add("entering");}
function setMobileCardWaiting(){mobileCardAnswers.querySelectorAll("button").forEach(b=>b.disabled=true);mobileCardContinue.disabled=true;mobileCardFeedback.className="mobile-card-feedback waiting";mobileCardFeedback.textContent="Verificando…";}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function resolveMobileCard(p){if(!activeMobileCard)return;if(activeMobileCard.type==="question"){const buttons=[...mobileCardAnswers.querySelectorAll(".mobile-answer-option")],ci=(activeMobileCard.options||[]).findIndex(o=>o===p.correctAnswer);buttons.forEach((b,i)=>{b.disabled=true;if(i===ci)b.classList.add("correct");if(i===Number(p.selectedIndex)&&p.correct===false)b.classList.add("wrong");});mobileCardFeedback.className=`mobile-card-feedback ${p.correct?"correct":"wrong"}`;mobileCardFeedback.textContent=p.correct?`Acertou! ${p.effect}`:`Errou. Resposta certa: ${p.correctAnswer}. ${p.effect}`;}else{mobileCardFeedback.className="mobile-card-feedback correct";mobileCardFeedback.textContent=p.effect;}mobileCardEffect.textContent=p.effect;mobileCardContinue.classList.add("hidden");await sleep(850);mobileDrawnCard.classList.remove("entering");mobileDrawnCard.classList.add("leaving");await sleep(650);mobileCardModal.classList.add("hidden");mobileDrawnCard.classList.remove("leaving");activeMobileCard=null;}


/* ---------- Sensor do celular / base do Just Dance ---------- */

function getSensorCapabilities() {
  const motionEvent = window.DeviceMotionEvent;
  const orientationEvent = window.DeviceOrientationEvent;
  return {
    motion: typeof motionEvent !== "undefined",
    orientation: typeof orientationEvent !== "undefined",
    genericGyroscope: typeof window.Gyroscope !== "undefined",
    genericAccelerometer: typeof window.Accelerometer !== "undefined",
    genericLinearAcceleration: typeof window.LinearAccelerationSensor !== "undefined",
    observedMotion: Boolean(sensorObserved.motion),
    observedOrientation: Boolean(sensorObserved.orientation),
    observedGyro: Boolean(sensorObserved.gyro),
    observedAccelerometer: Boolean(sensorObserved.accelerometer),
    orientationFallback: Boolean(sensorObserved.orientationFallback),
    permissionApi: Boolean(
      (motionEvent && typeof motionEvent.requestPermission === "function") ||
      (orientationEvent && typeof orientationEvent.requestPermission === "function")
    ),
    secureContext: Boolean(window.isSecureContext)
  };
}

function setSensorBadge(kind, text) {
  if (!sensorModeBadge) return;
  sensorModeBadge.className = `sensor-mode-badge ${kind || "idle"}`;
  sensorModeBadge.textContent = text;
}

function setSensorPanelError(message, detail = "Confira as permissões do navegador e tente novamente.") {
  sensorModePanel?.classList.add("is-error");
  sensorModePanel?.classList.remove("is-live");
  setSensorBadge("idle", "Erro");
  if (sensorModeTitle) sensorModeTitle.textContent = "Sensor indisponível";
  if (sensorModeText) sensorModeText.textContent = message;
  if (sensorNotice) sensorNotice.textContent = detail;
}

function sensorSourceLabel(source) {
  return ({
    "devicemotion": "Motion",
    "deviceorientation": "Orientação",
    "orientation-fallback": "Orientação*",
    "generic-gyroscope": "Giroscópio",
    "generic-accelerometer": "Acelerômetro",
    "generic-linear-acceleration": "Acel. linear",
    "mixed": "Misto"
  })[source] || "—";
}

function reportSensorStatus(active = sensorStreaming, force = false) {
  if (!socket || !socket.connected || !joinedRoom) return;
  const normalized = Boolean(active);
  const capabilities = getSensorCapabilities();
  const signature = JSON.stringify({ active: normalized, capabilities });
  if (!force && signature === sensorLastStatusSignature) return;
  sensorLastReportedActive = normalized;
  sensorLastStatusSignature = signature;
  socket.timeout(MULTIPLAYER_TIMEOUT_MS).emit(
    "controller:sensor-status",
    { roomCode: joinedRoom, active: normalized, capabilities },
    () => {}
  );
}

function sensorVectorMagnitude(vector) {
  const x = Number(vector?.x || 0);
  const y = Number(vector?.y || 0);
  const z = Number(vector?.z || 0);
  return Math.sqrt(x * x + y * y + z * z);
}

function localSensorIntensity(acceleration, accelerationIncludingGravity, rotationRate) {
  const linear = sensorVectorMagnitude(acceleration);
  const gravity = sensorVectorMagnitude(accelerationIncludingGravity);
  const gravityMotion = Math.abs(gravity - 9.81);
  const rotation = sensorVectorMagnitude(rotationRate);
  const motion = linear > 0.02 ? linear : gravityMotion;
  return Math.max(0, Math.min(1, (motion / 15) * 0.72 + (rotation / 520) * 0.28));
}

function renderLocalSensorMeter(intensity = sensorLatestIntensity) {
  const percent = Math.round(Math.max(0, Math.min(1, Number(intensity || 0))) * 100);
  const rotation = sensorVectorMagnitude(sensorVectorMagnitude(sensorLatestRotation) > 0.001 ? sensorLatestRotation : sensorDerivedRotation);
  if (sensorMovementValue) sensorMovementValue.textContent = `${percent}%`;
  if (sensorGyroValue) sensorGyroValue.textContent = `${Math.round(rotation)}°/s`;
  if (sensorMotionFill) sensorMotionFill.style.width = `${percent}%`;
  if (sensorPacketValue) sensorPacketValue.textContent = String(sensorPacketCount);
  if (sensorSourceValue) sensorSourceValue.textContent = sensorSourceLabel(sensorLatestSource);
}

function shortestAngleDelta(next, previous) {
  let delta = Number(next || 0) - Number(previous || 0);
  delta = ((delta + 540) % 360) - 180;
  return delta;
}

function markObserved(key) {
  if (!sensorObserved[key]) {
    sensorObserved[key] = true;
    reportSensorStatus(sensorStreaming, true);
  }
}

function showSensorReceivingUi() {
  sensorModePanel?.classList.remove("is-error");
  sensorModePanel?.classList.add("is-live");
  setSensorBadge("live", "Enviando");
  if (sensorModeTitle) sensorModeTitle.textContent = "Sensores ativos";
  if (sensorModeText) {
    sensorModeText.textContent = sensorObserved.gyro
      ? "Giroscópio/aceleração detectados. Mova o celular para testar a telemetria."
      : "Movimento detectado. Se o giroscópio direto não estiver disponível, a rotação é estimada pela orientação do celular.";
  }
  if (enableSensorsBtn) {
    enableSensorsBtn.textContent = "Sensores ativados";
    enableSensorsBtn.disabled = true;
  }
  if (sensorNotice) {
    sensorNotice.textContent = sensorObserved.gyro
      ? "Giro direto detectado. A pontuação ainda é somente diagnóstico."
      : "Fallback de orientação ativo: já dá para testar, mesmo sem rotação direta do navegador.";
  }
}

function sendLatestSensorSample(source = "mixed", interval = 0) {
  if (!sensorStreaming || !sensorModeRequested || !socket?.connected || !joinedRoom) return;
  const now = performance.now();
  if (now - sensorLastSentAt < 28) return;
  sensorLastSentAt = now;

  const rotationRate = sensorVectorMagnitude(sensorLatestRotation) > 0.001
    ? sensorLatestRotation
    : sensorDerivedRotation;
  if (sensorVectorMagnitude(sensorLatestRotation) <= 0.001 && sensorVectorMagnitude(sensorDerivedRotation) > 0.001) {
    source = source === "deviceorientation" ? "orientation-fallback" : source;
    markObserved("orientationFallback");
  }

  sensorLatestIntensity = localSensorIntensity(
    sensorLatestAcceleration,
    sensorLatestAccelerationIncludingGravity,
    rotationRate
  );
  sensorLatestSource = source || "mixed";
  sensorPacketCount += 1;
  renderLocalSensorMeter(sensorLatestIntensity);
  showSensorReceivingUi();

  if (sensorWatchdogTimer) {
    clearTimeout(sensorWatchdogTimer);
    sensorWatchdogTimer = null;
  }

  const emitter = socket.volatile || socket;
  emitter.emit("controller:sensor-data", {
    roomCode: joinedRoom,
    sample: {
      acceleration: sensorLatestAcceleration,
      accelerationIncludingGravity: sensorLatestAccelerationIncludingGravity,
      rotationRate,
      orientation: sensorLatestOrientation,
      interval: Number(interval || 0),
      clientTime: Date.now(),
      source: sensorLatestSource
    }
  });
}

function handleDeviceOrientation(event) {
  markObserved("orientation");
  const now = performance.now();
  const next = {
    alpha: Number(event.alpha ?? 0),
    beta: Number(event.beta ?? 0),
    gamma: Number(event.gamma ?? 0)
  };
  if (sensorOrientationPrevious) {
    const dt = Math.max(0.016, Math.min(0.25, (now - sensorOrientationPrevious.at) / 1000));
    sensorDerivedRotation = {
      x: shortestAngleDelta(next.beta, sensorOrientationPrevious.value.beta) / dt,
      y: shortestAngleDelta(next.gamma, sensorOrientationPrevious.value.gamma) / dt,
      z: shortestAngleDelta(next.alpha, sensorOrientationPrevious.value.alpha) / dt
    };
  }
  sensorOrientationPrevious = { value: next, at: now };
  sensorLatestOrientation = next;
  sendLatestSensorSample("deviceorientation");
}

function handleDeviceMotion(event) {
  markObserved("motion");
  if (event.acceleration) {
    sensorLatestAcceleration = {
      x: Number(event.acceleration.x ?? 0),
      y: Number(event.acceleration.y ?? 0),
      z: Number(event.acceleration.z ?? 0)
    };
    markObserved("accelerometer");
  }
  if (event.accelerationIncludingGravity) {
    sensorLatestAccelerationIncludingGravity = {
      x: Number(event.accelerationIncludingGravity.x ?? 0),
      y: Number(event.accelerationIncludingGravity.y ?? 0),
      z: Number(event.accelerationIncludingGravity.z ?? 0)
    };
    markObserved("accelerometer");
  }
  if (event.rotationRate) {
    sensorLatestRotation = {
      x: Number(event.rotationRate.alpha ?? 0),
      y: Number(event.rotationRate.beta ?? 0),
      z: Number(event.rotationRate.gamma ?? 0)
    };
    markObserved("gyro");
  }
  sendLatestSensorSample("devicemotion", Number(event.interval || 0));
}

function registerGenericSensor(sensor, source, onReading) {
  if (!sensor) return;
  sensor.onreading = () => {
    try {
      onReading(sensor);
      sendLatestSensorSample(source, 1000 / 40);
    } catch {}
  };
  sensor.onerror = event => {
    const name = event?.error?.name || "SensorError";
    if (!sensorGenericErrors.includes(name)) sensorGenericErrors.push(name);
  };
  sensor.start();
  sensorGenericSensors.push(sensor);
}

function startGenericSensors() {
  if (!window.isSecureContext) return;
  try {
    if (typeof window.Gyroscope !== "undefined") {
      const gyro = new window.Gyroscope({ frequency: 40 });
      registerGenericSensor(gyro, "generic-gyroscope", value => {
        const RAD_TO_DEG = 180 / Math.PI;
        sensorLatestRotation = {
          x: Number(value.x || 0) * RAD_TO_DEG,
          y: Number(value.y || 0) * RAD_TO_DEG,
          z: Number(value.z || 0) * RAD_TO_DEG
        };
        markObserved("gyro");
      });
    }
  } catch (error) {
    sensorGenericErrors.push(error?.name || "GyroscopeError");
  }
  try {
    if (typeof window.LinearAccelerationSensor !== "undefined") {
      const linear = new window.LinearAccelerationSensor({ frequency: 40 });
      registerGenericSensor(linear, "generic-linear-acceleration", value => {
        sensorLatestAcceleration = { x: Number(value.x || 0), y: Number(value.y || 0), z: Number(value.z || 0) };
        markObserved("accelerometer");
      });
    } else if (typeof window.Accelerometer !== "undefined") {
      const accel = new window.Accelerometer({ frequency: 40 });
      registerGenericSensor(accel, "generic-accelerometer", value => {
        sensorLatestAccelerationIncludingGravity = { x: Number(value.x || 0), y: Number(value.y || 0), z: Number(value.z || 0) };
        markObserved("accelerometer");
      });
    }
  } catch (error) {
    sensorGenericErrors.push(error?.name || "AccelerometerError");
  }
}

function stopGenericSensors() {
  for (const sensor of sensorGenericSensors) {
    try { sensor.stop(); } catch {}
  }
  sensorGenericSensors = [];
}

function stopSensorStreaming({ keepPermission = true } = {}) {
  window.removeEventListener("devicemotion", handleDeviceMotion);
  window.removeEventListener("deviceorientation", handleDeviceOrientation);
  stopGenericSensors();
  if (sensorWatchdogTimer) clearTimeout(sensorWatchdogTimer);
  sensorWatchdogTimer = null;
  sensorStreaming = false;
  sensorOrientationPrevious = null;
  if (!keepPermission) sensorPermissionGranted = false;
  reportSensorStatus(false, true);
  sensorModePanel?.classList.remove("is-live");
  renderLocalSensorMeter(0);
}

function startSensorStreaming() {
  const caps = getSensorCapabilities();
  const anySensorApi = caps.motion || caps.orientation || caps.genericGyroscope || caps.genericAccelerometer || caps.genericLinearAcceleration;
  if (!caps.secureContext) {
    setSensorPanelError(
      "O navegador bloqueou os sensores porque esta página não está em uma conexão segura.",
      "Abra o controle por HTTPS. Em celular, um endereço http://192.168.x.x normalmente não libera giroscópio/acelerômetro."
    );
    return false;
  }
  if (!anySensorApi) {
    setSensorPanelError("Este navegador não expõe APIs de movimento, orientação, acelerômetro ou giroscópio.");
    return false;
  }

  window.removeEventListener("devicemotion", handleDeviceMotion);
  window.removeEventListener("deviceorientation", handleDeviceOrientation);
  stopGenericSensors();
  sensorObserved = { motion: false, orientation: false, gyro: false, accelerometer: false, orientationFallback: false };
  sensorLatestAcceleration = { x: 0, y: 0, z: 0 };
  sensorLatestAccelerationIncludingGravity = { x: 0, y: 0, z: 0 };
  sensorLatestRotation = { x: 0, y: 0, z: 0 };
  sensorDerivedRotation = { x: 0, y: 0, z: 0 };
  sensorLatestSource = "";
  sensorGenericErrors = [];
  sensorPacketCount = 0;
  sensorLastSentAt = 0;
  sensorStreaming = true;

  if (caps.orientation) window.addEventListener("deviceorientation", handleDeviceOrientation, { passive: true });
  if (caps.motion) window.addEventListener("devicemotion", handleDeviceMotion, { passive: true });
  startGenericSensors();

  sensorModePanel?.classList.remove("is-error", "is-live");
  setSensorBadge("waiting", "Testando");
  if (sensorModeTitle) sensorModeTitle.textContent = "Procurando sensores…";
  if (sensorModeText) sensorModeText.textContent = "Mova e gire o celular por alguns segundos para confirmar acelerômetro e giroscópio.";
  if (enableSensorsBtn) {
    enableSensorsBtn.textContent = "Testando sensores…";
    enableSensorsBtn.disabled = true;
  }
  if (sensorNotice) sensorNotice.textContent = "O sistema tenta DeviceMotion, DeviceOrientation e a Generic Sensor API automaticamente.";
  renderLocalSensorMeter(0);
  reportSensorStatus(true, true);

  sensorWatchdogTimer = setTimeout(() => {
    if (!sensorStreaming || sensorPacketCount > 0) return;
    setSensorBadge("waiting", "Sem dados");
    sensorModePanel?.classList.add("is-error");
    if (sensorModeTitle) sensorModeTitle.textContent = "Sensor não enviou dados";
    if (sensorModeText) sensorModeText.textContent = "A API existe, mas nenhuma leitura chegou. Isso costuma ser permissão do navegador, HTTPS ou acesso a sensores desativado no aparelho.";
    if (enableSensorsBtn) {
      enableSensorsBtn.disabled = false;
      enableSensorsBtn.textContent = "Tentar sensores novamente";
    }
    if (sensorNotice) {
      const extra = sensorGenericErrors.length ? ` Erros: ${[...new Set(sensorGenericErrors)].join(", ")}.` : "";
      sensorNotice.textContent = `No Chrome/Android, confira a permissão “Sensores de movimento”. No iPhone/iPad, aceite Movimento e Orientação ao tocar no botão.${extra}`;
    }
  }, 2200);
  return true;
}

async function requestAndStartSensors() {
  const caps = getSensorCapabilities();
  if (!sensorModeRequested) {
    if (sensorModeText) sensorModeText.textContent = "O computador ainda não ativou o Sensor Lab.";
    return;
  }
  if (!caps.secureContext) {
    setSensorPanelError(
      "Sensores de movimento exigem uma página segura neste navegador.",
      "Abra exatamente o endereço HTTPS mostrado pelo computador, em vez de um endereço HTTP local."
    );
    return;
  }
  const anySensorApi = caps.motion || caps.orientation || caps.genericGyroscope || caps.genericAccelerometer || caps.genericLinearAcceleration;
  if (!anySensorApi) {
    setSensorPanelError("Este aparelho/navegador não oferece APIs de movimento compatíveis.");
    return;
  }

  enableSensorsBtn.disabled = true;
  enableSensorsBtn.textContent = "Solicitando permissão…";
  try {
    const requests = [];
    if (window.DeviceMotionEvent && typeof window.DeviceMotionEvent.requestPermission === "function") {
      requests.push(window.DeviceMotionEvent.requestPermission());
    }
    if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === "function") {
      requests.push(window.DeviceOrientationEvent.requestPermission());
    }
    if (requests.length) {
      const results = await Promise.allSettled(requests);
      const granted = results.some(result => result.status === "fulfilled" && result.value === "granted");
      if (!granted) throw new Error("Permissão negada");
    }
    sensorPermissionGranted = true;
    startSensorStreaming();
  } catch (error) {
    sensorPermissionGranted = false;
    enableSensorsBtn.disabled = false;
    enableSensorsBtn.textContent = "Tentar ativar sensores novamente";
    setSensorPanelError("A permissão de movimento/orientação não foi concedida.", "Toque novamente no botão e permita Movimento e Orientação nas permissões do navegador.");
  }
}

function renderControllerDanceScore(dance = {}, animateJudgement = false) {
  const score = Math.max(0, Math.min(13333, Number(dance.score || 0)));
  const stars = Math.max(0, Math.min(5, Number(dance.stars || Math.floor(score / 2000))));
  if (sensorDanceScore) sensorDanceScore.textContent = score.toLocaleString("pt-BR");
  if (sensorDanceRank) {
    sensorDanceRank.textContent = dance.rank || (score >= 12000 ? "MEGASTAR" : score >= 11000 ? "SUPERSTAR" : stars ? `${stars} ESTRELA${stars === 1 ? "" : "S"}` : "SEM ESTRELAS");
    sensorDanceRank.className = score >= 12000 ? "megastar" : score >= 11000 ? "superstar" : "";
  }
  sensorDanceStars?.querySelectorAll("span").forEach((star, index) => star.classList.toggle("filled", index < stars));
  if (sensorDanceProgress) sensorDanceProgress.textContent = `${Number(dance.judgedMoves || 0)} / ${Number(dance.totalMoves || 0)} movimentos julgados`;
  if (sensorDanceJudgement && dance.lastJudgement) {
    sensorDanceJudgement.textContent = String(dance.lastJudgement).toUpperCase() === "YEAH" ? "YEAH!" : dance.lastJudgement;
    sensorDanceJudgement.className = `mobile-dance-judgement ${String(dance.lastJudgement).toUpperCase() === "YEAH" ? "yeah" : String(dance.lastJudgement).toLowerCase()}`;
    if (animateJudgement) {
      sensorDanceJudgement.classList.remove("pop");
      void sensorDanceJudgement.offsetWidth;
      sensorDanceJudgement.classList.add("pop");
    }
  }
}

function applySensorLabState(nextState, me) {
  const isSensorLab = nextState?.purpose === "sensor-lab";
  controlScreen?.classList.toggle("sensor-mode-active", isSensorLab);
  sensorModePanel?.classList.toggle("hidden", !isSensorLab);
  if (!isSensorLab) {
    sensorModeRequested = false;
    stopSensorStreaming();
    return false;
  }

  sensorModeRequested = Boolean(nextState.sensorMode);
  const serverSensor = me?.sensor || {};
  renderControllerDanceScore(me?.dance || {});
  if (sensorPacketValue) sensorPacketValue.textContent = String(Number(serverSensor.packetCount || sensorPacketCount));
  if (sensorMovementValue) sensorMovementValue.textContent = `${Math.round(Number(serverSensor.intensity || sensorLatestIntensity) * 100)}%`;
  if (sensorMotionFill) sensorMotionFill.style.width = `${Math.round(Number(serverSensor.intensity || sensorLatestIntensity) * 100)}%`;
  if (sensorSourceValue && serverSensor.lastSource && !sensorStreaming) sensorSourceValue.textContent = sensorSourceLabel(serverSensor.lastSource);

  turnKicker.textContent = "Mini Game em desenvolvimento";
  playerPosition.textContent = "—";
  mobileDeckArea.classList.add("hidden");
  mobileRollBtn.disabled = true;

  if (!sensorModeRequested) {
    stopSensorStreaming();
    setSensorBadge("waiting", "Aguardando");
    sensorModePanel?.classList.remove("is-error", "is-live");
    sensorModeTitle.textContent = "Celular conectado ao Sensor Lab";
    sensorModeText.textContent = "Aguarde o computador ativar os sensores. Depois toque no botão para liberar o movimento.";
    enableSensorsBtn.disabled = true;
    enableSensorsBtn.textContent = "Aguardando o computador";
    sensorNotice.textContent = window.isSecureContext ? "Conexão segura detectada." : "Este endereço não está em HTTPS; alguns navegadores podem bloquear sensores.";
    return true;
  }

  if (sensorPermissionGranted) {
    if (!sensorStreaming) startSensorStreaming();
  } else {
    setSensorBadge("waiting", "Permissão");
    sensorModePanel?.classList.remove("is-error", "is-live");
    sensorModeTitle.textContent = "Ative os sensores";
    sensorModeText.textContent = "O computador está pronto. Toque no botão abaixo para permitir o uso do movimento deste celular.";
    enableSensorsBtn.disabled = false;
    enableSensorsBtn.textContent = "Ativar sensores deste celular";
    sensorNotice.textContent = window.isSecureContext ? "Pronto para solicitar a permissão do navegador." : "Recomendado abrir esta página por HTTPS para liberar os sensores.";
  }
  return true;
}

roomCode.addEventListener("input", () => {
  roomCode.value = normalizeCode(roomCode.value);
});

function applyState(nextState) {
  state = nextState;
  if (!state) return;

  if (Number(state.protocolVersion || 0) < REQUIRED_SERVER_PROTOCOL) {
    mobileRollBtn.disabled = true;
    mobileDeckArea.classList.add("hidden");
    turnKicker.textContent = "Servidor desatualizado";
    turnTitle.textContent = "Atualize o servidor online";
    turnDescription.textContent = "As cartas e os turnos deste controle exigem a versão nova do SERVIDOR_PC.";
    return;
  }

  const me = state.players.find(player => player.id === myPlayerId);
  if (!me) {
    mobileRollBtn.disabled = true;
    turnKicker.textContent = "Desconectado da partida";
    turnTitle.textContent = "Você não está mais nesta sala";
    return;
  }

  playerPosition.textContent = me.position;
  playerColor.style.background = me.color;
  playerLabel.textContent = me.name;

  if (applySensorLabState(state, me)) {
    return;
  }

  if (state.winnerId) {
    const winner = state.players.find(player => player.id === state.winnerId);
    mobileRollBtn.disabled = true;
    mobileRollBtn.classList.remove("your-turn");

    if (state.winnerId === myPlayerId) {
      turnKicker.textContent = "Fim da partida";
      turnTitle.textContent = "Você venceu! 🏆";
      turnDescription.textContent = "Olhe para o computador para ver o resultado final.";
    } else {
      turnKicker.textContent = "Fim da partida";
      turnTitle.textContent = `${winner?.name || "Outro jogador"} venceu`;
      turnDescription.textContent = "A partida terminou.";
    }
    return;
  }

  if (!state.started) {
    mobileRollBtn.disabled = true;
    mobileRollBtn.classList.remove("your-turn");
    turnKicker.textContent = "Conectado";
    turnTitle.textContent = "Aguardando o computador";
    turnDescription.textContent = "Quando todos estiverem conectados, a partida pode ser iniciada.";
    return;
  }

  const active=state.players[state.currentIndex],myTurn=active?.id===myPlayerId,pending=state.pendingCard,myPending=pending?.playerId===myPlayerId;
  setMobileDeck(pending); mobileRollBtn.disabled=!myTurn||rolling||Boolean(pending); mobileRollBtn.classList.toggle("your-turn",myTurn&&!rolling&&!pending);
  if(myPending){turnKicker.textContent="Carta obrigatória";if(pending.drawn){turnTitle.textContent="Resolva sua carta";turnDescription.textContent="Escolha uma resposta ou confirme o efeito para continuar.";if(pending.card&&!activeMobileCard)showMobileCard(pending.card);}else{turnTitle.textContent="Puxe uma carta";turnDescription.textContent="Toque no baralho abaixo. A carta precisa ser resolvida.";}}
  else if(pending){const pp=state.players.find(p=>p.id===pending.playerId);turnKicker.textContent="Aguarde";turnTitle.textContent=`${pp?.name||"Outro jogador"} está com uma carta`;turnDescription.textContent="A partida continua depois que a carta for resolvida.";}
  else if(myTurn){turnKicker.textContent="Sua vez";turnTitle.textContent="Jogue o dado";turnDescription.textContent="Toque no botão abaixo. O dado vai rolar no tabuleiro do computador.";}
  else{turnKicker.textContent="Aguarde";turnTitle.textContent=`Vez de ${active?.name||"outro jogador"}`;turnDescription.textContent="Seu botão será liberado automaticamente quando chegar a sua vez.";}
}

async function verifyControllerServer() {
  if (!serverUrl) {
    showMessage(joinMessage, "O endereço do servidor ainda não foi configurado neste site.");
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`${serverUrl}/api/status?t=${Date.now()}`, { cache: "no-store", signal: controller.signal });
    const status = await response.json();
    const compatible = Boolean(
      response.ok &&
      status?.ok &&
      Number(status?.protocolVersion || 0) >= REQUIRED_SERVER_PROTOCOL &&
      status?.features?.interactiveCards === true &&
      status?.features?.multiplayerCardSync === true &&
      status?.features?.danceJudgements === true
    );

    if (!compatible) {
      showMessage(joinMessage, "O servidor online está desatualizado. Atualize a implantação do servidor para esta versão.");
      return false;
    }
    return true;
  } catch {
    showMessage(joinMessage, "Não foi possível acessar o servidor online. Aguarde o serviço iniciar e tente novamente.");
    return false;
  } finally {
    clearTimeout(timer);
  }
}

joinBtn.addEventListener("click", async () => {
  if (!socket) {
    showMessage(
      joinMessage,
      "O endereço do servidor ainda não foi configurado neste site."
    );
    return;
  }

  joinBtn.disabled = true;
  hideMessage(joinMessage);
  if (!(await verifyControllerServer())) {
    joinBtn.disabled = false;
    return;
  }

  const code = normalizeCode(roomCode.value);
  const name = playerName.value.trim();

  if (code.length !== 6) {
    joinBtn.disabled = false;
    showMessage(joinMessage, "Digite o código de 6 caracteres mostrado no computador.");
    return;
  }

  socket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("controller:join", { roomCode: code, name }, (error, response) => {
    if (error) {
      joinBtn.disabled = false;
      showMessage(joinMessage, "O servidor não respondeu ao conectar. Reinicie o SERVIDOR_PC desta versão.");
      return;
    }
    joinBtn.disabled = false;

    if (!response?.ok) {
      showMessage(joinMessage, response?.message || "Não foi possível entrar na sala.");
      return;
    }

    myPlayerId = response.playerId;
    joinedRoom = code;
    sensorLastReportedActive = null;
    playerColor.style.background = response.color;
    joinScreen.classList.add("hidden");
    controlScreen.classList.remove("hidden");
    connectionBadge.textContent = "Conectado";
    applyState(response.state);
    reportSensorStatus(false);
  });
});

mobileRollBtn.addEventListener("click", () => {
  if (!joinedRoom || rolling) return;

  rolling = true;
  mobileRollBtn.disabled = true;
  mobileRollBtn.classList.remove("your-turn");
  turnKicker.textContent = "Jogando";
  turnTitle.textContent = "Rolando o dado…";
  mobileDice.classList.remove("rolling");
  void mobileDice.offsetWidth;
  mobileDice.classList.add("rolling");

  socket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("controller:roll", { roomCode: joinedRoom }, (error, response) => {
    if (error) {
      rolling = false;
      showMessage(gameMessage, "O servidor não respondeu ao dado. Reinicie o SERVIDOR_PC desta versão.");
      applyState(state);
      return;
    }
    if (!response?.ok) {
      rolling = false;
      showMessage(gameMessage, response?.message || "Não foi possível jogar o dado.");
      applyState(state);
    }
  });
});

mobileDeckBtn.addEventListener("click", () => {
  const pending = state?.pendingCard;
  if (!socket || !joinedRoom || !pending || pending.playerId !== myPlayerId || pending.drawn) return;

  mobileDeckBtn.disabled = true;
  socket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("controller:draw-card", { roomCode: joinedRoom }, (error, response) => {
    if (error) {
      mobileDeckBtn.disabled = false;
      showMessage(gameMessage, "O servidor não respondeu ao baralho. Reinicie o SERVIDOR_PC desta versão.");
      return;
    }
    if (!response?.ok) {
      mobileDeckBtn.disabled = false;
      showMessage(gameMessage, response?.message || "Não foi possível puxar a carta.");
    }
  });
});

mobileCardAnswers.addEventListener("click", event => {
  const button = event.target.closest(".mobile-answer-option");
  if (!button || !activeMobileCard) return;

  setMobileCardWaiting();
  socket.timeout(MULTIPLAYER_TIMEOUT_MS).emit(
    "controller:resolve-card",
    { roomCode: joinedRoom, answerIndex: Number(button.dataset.answerIndex) },
    (error, response) => {
      if (error) {
        mobileCardFeedback.className = "mobile-card-feedback wrong";
        mobileCardFeedback.textContent = "O servidor não respondeu à resposta. Reinicie o SERVIDOR_PC desta versão.";
        mobileCardAnswers.querySelectorAll("button").forEach(item => item.disabled = false);
        return;
      }
      if (!response?.ok) {
        mobileCardFeedback.className = "mobile-card-feedback wrong";
        mobileCardFeedback.textContent = response?.message || "Não foi possível responder.";
        mobileCardAnswers.querySelectorAll("button").forEach(item => item.disabled = false);
      }
    }
  );
});

mobileCardContinue.addEventListener("click", () => {
  if (!activeMobileCard || activeMobileCard.type === "question") return;
  setMobileCardWaiting();

  socket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("controller:resolve-card", { roomCode: joinedRoom }, (error, response) => {
    if (error) {
      mobileCardFeedback.className = "mobile-card-feedback wrong";
      mobileCardFeedback.textContent = "O servidor não respondeu. Reinicie o SERVIDOR_PC desta versão.";
      mobileCardContinue.disabled = false;
      return;
    }
    if (!response?.ok) {
      mobileCardFeedback.className = "mobile-card-feedback wrong";
      mobileCardFeedback.textContent = response?.message || "Não foi possível continuar.";
      mobileCardContinue.disabled = false;
    }
  });
});

if (socket) {
  socket.on("dev:dance-judgement", payload => {
    if (!joinedRoom || payload?.roomCode !== joinedRoom) return;
    const result = (payload.results || []).find(item => item.playerId === myPlayerId);
    if (result?.dance) renderControllerDanceScore(result.dance, true);
    if (payload.state) applyState(payload.state);
  });

  socket.on("dev:sensor-mode", payload => {
    if (!joinedRoom || payload?.roomCode !== joinedRoom) return;
    sensorModeRequested = Boolean(payload.enabled);
    if (payload.state) applyState(payload.state);
    if (!sensorModeRequested) stopSensorStreaming();
  });

  socket.on("room:state", nextState => {
    if (!joinedRoom || nextState.roomCode !== joinedRoom) return;
    applyState(nextState);
  });

  socket.on("game:roll", payload => {
    if (!joinedRoom || payload.state?.roomCode !== joinedRoom) return;

    mobileDice.textContent = payload.result;
    mobileDice.classList.remove("rolling");

    if (payload.playerId === myPlayerId) {
      rolling = false;
      hideMessage(gameMessage);

      if(!payload.exactMove)showMessage(gameMessage,`Você tirou ${payload.result}, mas precisa do número exato para chegar à casa 40.`);
      else if(payload.cardPending)showMessage(gameMessage,`Você caiu na casa ${payload.rollTo}. Agora puxe a carta no baralho abaixo.`);
      else showMessage(gameMessage,`Você tirou ${payload.result} e foi para a casa ${payload.to}.`);
    }

    applyState(payload.state);
  });

  socket.on("game:card-drawn",payload=>{if(!joinedRoom||payload.state?.roomCode!==joinedRoom)return;applyState(payload.state);if(payload.playerId===myPlayerId&&!activeMobileCard)showMobileCard(payload.card);});
  socket.on("game:card-resolved",async payload=>{if(!joinedRoom||payload.state?.roomCode!==joinedRoom)return;applyState(payload.state);if(payload.playerId===myPlayerId){await resolveMobileCard(payload);showMessage(gameMessage,`${payload.effect} Você terminou na casa ${payload.to}.`);}applyState(payload.state);});

  socket.on("game:restarted", payload => {
    mobileDice.textContent = "?";
    hideMessage(gameMessage);
    rolling = false;
    applyState(payload.state);
  });

  socket.on("room:closed", payload => {
    if (!joinedRoom || payload.roomCode !== joinedRoom) return;
    stopSensorStreaming();
    sensorModeRequested = false;
    sensorLastReportedActive = null;
    joinedRoom = "";
    mobileRollBtn.disabled = true;
    mobileRollBtn.classList.remove("your-turn");
    connectionBadge.textContent = "Sala encerrada";
    turnKicker.textContent = "Conexão encerrada";
    turnTitle.textContent = "O computador fechou a sala";
    turnDescription.textContent = "Volte ao QR Code de uma nova sala para jogar novamente.";
  });

  socket.on("disconnect", () => {
    connectionBadge.textContent = "Sem conexão";
    mobileRollBtn.disabled = true;
    stopSensorStreaming();
  });

  socket.on("connect", () => {
    if (myPlayerId) {
      connectionBadge.textContent = "Conectado";
      reportSensorStatus(sensorStreaming, true);
    }
  });
}

enableSensorsBtn?.addEventListener("click", requestAndStartSensors);

controllerBackBtn.addEventListener("click", () => {
  stopSensorStreaming({ keepPermission: false });
  window.location.href = "/";
});
