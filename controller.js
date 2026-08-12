
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

const REQUIRED_SERVER_PROTOCOL = 11;
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
let sensorGenericFusionTimer = 0;
let sensorLastMotionReadingAt = 0;
let sensorLastGenericAccelAt = 0;

let sensorObserved = { motion: false, orientation: false, gyro: false, accelerometer: false, orientationFallback: false };

/* ---------- Just Dance V13: Where Have You Been + scoring por layout MSM no celular ---------- */
const PHONE_DANCE_MAX_SCORE = 13333;
const PHONE_DANCE_WEIGHTS = Object.freeze({ PERFECT: 1, SUPER: 0.8, GOOD: 0.6, OK: 0.35, YEAH: 1, X: 0 });
const PHONE_DANCE_SONGS = Object.freeze({
  RainOverMe: Object.freeze({ id:"RainOverMe", base:"minigames/just-dance/songs/RainOverMe", movesFile:"RainOverMe_moves0.json", classifierFormat:"msm", classifierFolder:"classifiers_WIIU" }),
  EarthSong: Object.freeze({ id:"EarthSong", base:"minigames/just-dance/songs/EarthSong", movesFile:"EarthSong_moves0.json", classifierFormat:"msm", classifierFolder:"classifiers_WIIU" }),
  ItsRainingMen: Object.freeze({ id:"ItsRainingMen", base:"minigames/just-dance/songs/ItsRainingMen", movesFile:"ItsRainingMen_moves0.json", classifierFormat:"msm", classifierFolder:"classifiers_WIIU" }),
  WhereHaveYou: Object.freeze({ id:"WhereHaveYou", base:"minigames/just-dance/songs/WhereHaveYou", movesFile:"WhereHaveYou_moves0.json", classifierFormat:"msm", classifierFolder:"classifiers_WIIU" })
});
const PHONE_DANCE_SCORE_TUNING = Object.freeze({
  RainOverMe: Object.freeze({ floor:.24, perfectRef:.58, minRef:.48, maxRef:.68, perfectQ:.76, superQ:.58, goodQ:.39, okQ:.20 }),
  EarthSong: Object.freeze({ floor:.22, perfectRef:.56, minRef:.46, maxRef:.66, perfectQ:.74, superQ:.57, goodQ:.38, okQ:.19 }),
  ItsRainingMen: Object.freeze({ floor:.24, perfectRef:.58, minRef:.48, maxRef:.68, perfectQ:.76, superQ:.58, goodQ:.39, okQ:.20 }),
  WhereHaveYou: Object.freeze({ floor:.24, perfectRef:.58, minRef:.48, maxRef:.68, perfectQ:.76, superQ:.58, goodQ:.39, okQ:.20 })
});
const PHONE_DANCE_MSM_LAYOUT_TUNING = Object.freeze({
  modern: Object.freeze({
    classifierWeight:.62, coverageWeight:.20, motionWeight:.11, peakWeight:.07,
    adaptiveCeiling:true, competitive:false
  }),
  "legacy-wiiu": Object.freeze({
    classifierWeight:.86, coverageWeight:.07, motionWeight:.05, peakWeight:.02,
    adaptiveCeiling:false, competitive:false
  })
});
const PHONE_DANCE_CALIBRATION_STORAGE_KEY = "jdPhoneClassifierCalibrationV7";
const PHONE_EARTH_CLASSIFIERS = Object.freeze({
  "earthsong_bras_genou":"00_Bras_Genou.livemove.bin","earthsong_poing_terre":"01_Poing_Terre.livemove.bin","earthsong_bras_sol":"02_Bras_Sol.livemove.bin","earthsong_jette":"03_Jette.livemove.bin","earthsong_lever":"04_Lever.livemove.bin","earthsong_poitrine_l":"05_Poitrine_L.livemove.bin","earthsong_spin":"06_Spin.livemove.bin","earthsong_bras_u":"07_Bras_U.livemove.bin","earthsong_bras_down":"08_Bras_Down.livemove.bin","earthsong_allemand":"09_Allemand.livemove.bin","earthsong_pointer_sol":"10_Pointer_Sol.livemove.bin","earthsong_poitrine_r":"11_Poitrine_R.livemove.bin","earthsong_main":"12_Main.livemove.bin","earthsong_bras":"13_Bras.livemove.bin","earthsong_ski_l":"14_Ski_L.livemove.bin","earthsong_saut_r":"15_Saut_R.livemove.bin","earthsong_saut_l":"16_Saut_L.livemove.bin","earthsong_bras_tendu":"17_Bras_Tendu.livemove.bin","earthsong_poing_lever_l":"18_Poing_Lever_L.livemove.bin","earthsong_poing_lever_r":"19_Poing_Lever_R.livemove.bin","earthsong_ski_r":"20_Ski_R.livemove.bin","earthsong_poing_l":"21_Poing_L.livemove.bin","earthsong_poing_r":"22_Poing_R.livemove.bin","earthsong_poing_f":"23_Poing_F.livemove.bin","earthsong_main_r":"24_Main_R.livemove.bin","earthsong_genou_tape":"25_Genou_Tape.livemove.bin","earthsong_genou_moi":"26_Genou_Moi.livemove.bin","earthsong_main_l":"27_Main_L.livemove.bin","earthsong_pose_fin":"28_Pose_Fin.livemove.bin","earthsong_poing_lever_f":"29_Poing_Lever_F.livemove.bin","earthsong_shake":"30_Shake.livemove.bin"
});
let phoneDanceSession = null;
let phoneDanceMoves = [];
let phoneDanceMovesRevision = "";
let phoneDanceLoadedSongId = "";
let phoneDanceProfiles = new Map();
let phoneDanceCompetitors = new Map();
let phoneDanceClassifierSummary = { loaded:0, total:0, format:"" };
let phoneDanceReady = false;
let phoneDanceLoadToken = 0;
let phoneDanceClock = { timelineMs:0, anchorPerf:performance.now(), playing:false, initialized:false };
let phoneDanceActiveMoveIndex = -1;
let phoneDanceStats = null;
let phoneDanceJudgedMoves = new Set();
let phoneDancePendingResults = new Map();
let phoneDanceLocal = null;
let phoneDanceLastTelemetryAt = 0;
let phoneDanceServerRttMs = 90;
let phoneDanceServerOffsetMs = 0;
let phoneDanceLatencyMeasuredAt = 0;
let phoneDanceCalibration = { gravity:9.81, motionScale:3.2, rotationScale:180, noiseMotion:0.035, noiseRotation:3, quietSamples:0 };
let phoneDanceMobileTuning = { songId:"", perfectRef:0, samples:[] };


// Gera a mesma assinatura no PC e no celular. Ela inclui nome, tempo,
// duração e goldMove; portanto qualquer atualização de movimentos ou YEAH
// faz o controle perceber a diferença e recarregar os dados corretos.
function phoneDanceMovesRevisionOf(moves){
  let hash=2166136261>>>0;
  const list=Array.isArray(moves)?moves:[];
  for(const move of list){
    const text=`${String(move?.name||"").toLowerCase()}|${Math.round(Number(move?.time||0))}|${Math.round(Number(move?.duration||0))}|${move?.goldMove?1:0};`;
    for(let i=0;i<text.length;i++){
      hash^=text.charCodeAt(i);
      hash=Math.imul(hash,16777619)>>>0;
    }
  }
  return `${list.length}-${hash.toString(36)}`;
}
function phoneDanceFreshUrl(url){
  const join=String(url).includes("?")?"&":"?";
  return `${url}${join}jdFresh=${Date.now()}`;
}


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
    "generic-fused": "Sensores fundidos",
    "mixed": "Misto"
  })[source] || "—";
}


function phoneClamp01(value){ return Math.max(0, Math.min(1, Number(value || 0))); }
function phoneMagnitude(v){ const x=Number(v?.x||0),y=Number(v?.y||0),z=Number(v?.z||0); return Math.sqrt(x*x+y*y+z*z); }
function phoneUnit(v){ const m=phoneMagnitude(v); return m>1e-5?{x:Number(v?.x||0)/m,y:Number(v?.y||0)/m,z:Number(v?.z||0)/m}:null; }
function phoneDot(a,b){ return Number(a?.x||0)*Number(b?.x||0)+Number(a?.y||0)*Number(b?.y||0)+Number(a?.z||0)*Number(b?.z||0); }
function phoneNormalizeId(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g,"");}
function phoneReadFixedAscii(buffer,offset,length){const b=new Uint8Array(buffer,offset,Math.min(length,Math.max(0,buffer.byteLength-offset)));let out="";for(const x of b){if(!x)break;if(x>=32&&x<127)out+=String.fromCharCode(x);}return out.trim();}
function phoneDanceClassifierCandidates(song,moveName){
  const n=String(moveName||"").toLowerCase();
  const live=PHONE_EARTH_CLASSIFIERS[n]||"";
  if(song?.classifierFormat==="msm")return[{format:"msm",folder:song.classifierFolder,file:`${n}.msm`}];
  if(song?.classifierFormat==="livemove")return live?[{format:"livemove",folder:song.classifierFolder,file:live}]:[];
  if(song?.classifierFormat==="auto"){
    const out=[{format:"msm",folder:song.classifierFolder||"classifiers_WIIU",file:`${n}.msm`}];
    if(live)out.push({format:"livemove",folder:song.fallbackClassifierFolder||"classifiers_WII_source",file:live});
    return out;
  }
  return[];
}
function phoneFindAscii(bytes,text){const t=Array.from(String(text||""),c=>c.charCodeAt(0)&255);outer:for(let i=0;i<=bytes.length-t.length;i++){for(let j=0;j<t.length;j++)if(bytes[i+j]!==t[j])continue outer;return i;}return-1;}
function phoneMsmSignature(profile){
  if(!profile||profile.format!=="msm")return"";
  const pick=a=>{const v=a||[],idx=[0,1,2,Math.floor(v.length*.25),Math.floor(v.length*.5),Math.floor(v.length*.75),v.length-3,v.length-2,v.length-1];return idx.filter(i=>i>=0&&i<v.length).map(i=>Number(v[i]||0).toFixed(5)).join(",");};
  return[profile.classifierType,profile.count,Number(profile.duration||0).toFixed(6),Number(profile.scaleA||0).toFixed(5),Number(profile.scaleB||0).toFixed(5),pick(profile.primary),pick(profile.secondary)].join("|");
}
function phoneParseMsm(buffer,moveName=""){
  if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<244)return null;
  const v=new DataView(buffer);
  const duration=v.getFloat32(200,false);
  let count=v.getUint32(232,false),channels=v.getUint32(236,false),start=244,layout="modern";
  const modernValid=count>0&&count<=512&&channels===2&&start+(count*2+2)*4<=buffer.byteLength;
  if(!modernValid){
    count=v.getUint32(224,false);
    channels=v.getUint32(228,false);
    start=236;
    layout="legacy-wiiu";
  }
  if(!count||count>512||channels!==2||start+(count*2+2)*4>buffer.byteLength)return null;
  const primary=[],secondary=[];
  for(let i=0;i<count;i++)primary.push(v.getFloat32(start+i*4,false));
  for(let i=0;i<count;i++)secondary.push(v.getFloat32(start+(count+i)*4,false));
  const scaleA=v.getFloat32(start+count*8,false),scaleB=v.getFloat32(start+count*8+4,false);
  const sourceMove=phoneReadFixedAscii(buffer,8,64);
  const sourceSong=phoneReadFixedAscii(buffer,72,64);
  const classifierType=phoneReadFixedAscii(buffer,136,64);
  const params=[204,208,212,216].map(offset=>offset+4<=buffer.byteLength?v.getFloat32(offset,false):0);
  if(![duration,scaleA,scaleB,...params,...primary,...secondary].every(Number.isFinite))return null;
  const profile={format:"msm",layout,moveName,sourceMove,sourceSong,classifierType,duration,count,channels,primary,secondary,scaleA,scaleB,params,sampleRate:duration>0?count/duration:0};
  profile.signature=phoneMsmSignature(profile);
  return profile;
}
function phoneParseLiveMove(buffer,moveName=""){if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<512)return null;const bytes=new Uint8Array(buffer),mi=phoneFindAscii(bytes,"motion");if(mi<0)return null;let co=mi+6;while(co<bytes.length&&bytes[co]===0)co++;if(co+4>bytes.length)return null;const v=new DataView(buffer),count=v.getUint32(co,true),start=co+4;if(!count||count>512||start+count*12>buffer.byteLength)return null;const axes=[[],[],[]];for(let a=0;a<3;a++)for(let i=0;i<count;i++){const x=v.getFloat32(start+(a*count+i)*4,true);if(!Number.isFinite(x)||Math.abs(x)>1000)return null;axes[a].push(x);}return{format:"livemove",moveName,count,axes};}
function phoneNormalize(values){const a=(values||[]).map(x=>Number(x||0));if(!a.length)return[];const mean=a.reduce((s,x)=>s+x,0)/a.length,variance=a.reduce((s,x)=>s+(x-mean)**2,0)/a.length,sd=Math.sqrt(Math.max(variance,1e-8));return a.map(x=>(x-mean)/sd);}
function phoneMedian(values){const a=(values||[]).map(Number).filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return 0;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function phoneRobustNormalize(values){const a=(values||[]).map(x=>Number(x||0));if(!a.length)return[];const med=phoneMedian(a),mad=phoneMedian(a.map(x=>Math.abs(x-med))),mean=a.reduce((s,x)=>s+x,0)/a.length,variance=a.reduce((s,x)=>s+(x-mean)**2,0)/a.length,sd=Math.sqrt(Math.max(variance,1e-8)),scale=Math.max(mad*1.4826,sd*.22,1e-4);return a.map(x=>Math.max(-6,Math.min(6,(x-med)/scale)));}
function phoneResample(values,target){const s=(values||[]).map(x=>Number(x||0)),n=Math.max(1,Math.round(target||1));if(!s.length)return Array(n).fill(0);if(s.length===1)return Array(n).fill(s[0]);const out=[];for(let i=0;i<n;i++){const p=i*(s.length-1)/Math.max(1,n-1),l=Math.floor(p),r=Math.min(s.length-1,l+1),m=p-l;out.push(s[l]*(1-m)+s[r]*m);}return out;}
function phoneShiftCorr(ref,obs,signFlip=true){const n=Math.min(ref?.length||0,obs?.length||0);if(n<4)return 0;const a=phoneNormalize(ref.slice(0,n)),b=phoneNormalize(obs.slice(0,n)),maxShift=Math.max(1,Math.floor(n*.16));let best=-1;for(let sh=-maxShift;sh<=maxShift;sh++){let dot=0,used=0;for(let i=0;i<n;i++){const j=i+sh;if(j<0||j>=n)continue;dot+=a[i]*b[j];used++;}if(used>=Math.max(3,n*.62)){const c=dot/used;best=Math.max(best,signFlip?Math.abs(c):c);}}return phoneClamp01(best);}
function phoneDerivative(values){const a=(values||[]).map(Number),out=[];for(let i=0;i<a.length;i++)out.push(i?Number(a[i]||0)-Number(a[i-1]||0):0);return out;}
function phoneDtwScore(reference,observed,allowSignFlip=false){
  const r=phoneRobustNormalize(reference),o=phoneRobustNormalize(observed);
  if(r.length<4||o.length<4)return 0;
  const calc=(aa,bb)=>{
    const n=aa.length,m=bb.length,band=Math.max(3,Math.ceil(Math.max(n,m)*.20)),inf=1e12,prev=Array(m+1).fill(inf),cur=Array(m+1).fill(inf);prev[0]=0;
    for(let i=1;i<=n;i++){
      cur.fill(inf);
      const j0=Math.max(1,i-band),j1=Math.min(m,i+band);
      for(let j=j0;j<=j1;j++){
        const d=Math.min(4,Math.abs(aa[i-1]-bb[j-1]));
        cur[j]=d+Math.min(cur[j-1],prev[j],prev[j-1]);
      }
      for(let j=0;j<=m;j++)prev[j]=cur[j];
    }
    const avg=prev[m]/Math.max(1,n+m);
    return phoneClamp01(Math.exp(-avg*1.35));
  };
  let best=calc(r,o);
  if(allowSignFlip)best=Math.max(best,calc(r,o.map(x=>-x)));
  return best;
}
function phoneShapeScore(reference,observed,allowSignFlip=false){
  if((reference?.length||0)<4||(observed?.length||0)<4)return 0;
  const obs=phoneResample(observed,reference.length);
  const corr=phoneShiftCorr(reference,obs,allowSignFlip);
  const dtw=phoneDtwScore(reference,obs,allowSignFlip);
  const deriv=phoneDtwScore(phoneDerivative(reference),phoneDerivative(obs),allowSignFlip);
  return phoneClamp01(corr*.46+dtw*.40+deriv*.14);
}
function phoneDirectionChanges(vectors){const out=[];let prev=null;for(const v of vectors){const u=phoneUnit(v);if(!u||!prev){out.push(0);if(u)prev=u;continue;}out.push(1-Math.max(-1,Math.min(1,phoneDot(u,prev))));prev=u;}return out;}
function phoneModelMagnitude(profile){if(profile?.format!=="livemove")return[];const n=profile.count;return Array.from({length:n},(_,i)=>Math.sqrt(profile.axes[0][i]**2+profile.axes[1][i]**2+profile.axes[2][i]**2));}
function phoneLiveMatch(profile,stats){const samples=stats?.samples||[],n=Number(profile?.count||0);if(!profile||n<4||samples.length<4)return 0;const rawAxes=["x","y","z"].map(axis=>phoneResample(samples.map(s=>Number(s.motion?.[axis]||0)),n));const modelAxes=profile.axes.map(a=>phoneResample(a,n));const perms=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];let axisBest=0;for(const p of perms){let sum=0;for(let a=0;a<3;a++)sum+=phoneShapeScore(modelAxes[a],rawAxes[p[a]],true);axisBest=Math.max(axisBest,sum/3);}const modelMag=phoneModelMagnitude(profile),obsMag=phoneResample(samples.map(s=>s.motionMag),n),mag=phoneShapeScore(modelMag,obsMag,false),modelDirs=phoneDirectionChanges(Array.from({length:n},(_,i)=>({x:profile.axes[0][i],y:profile.axes[1][i],z:profile.axes[2][i]}))),obsDirs=phoneResample(phoneDirectionChanges(samples.map(s=>s.motion)),n),dir=phoneShapeScore(modelDirs,obsDirs,false);return phoneClamp01(axisBest*.58+mag*.27+dir*.15);}
function phonePrincipalMotion(samples){
  const vectors=(samples||[]).map(s=>s.motion||{x:0,y:0,z:0});
  if(vectors.length<4)return null;
  const mean=vectors.reduce((a,v)=>({x:a.x+Number(v.x||0),y:a.y+Number(v.y||0),z:a.z+Number(v.z||0)}),{x:0,y:0,z:0});
  mean.x/=vectors.length;mean.y/=vectors.length;mean.z/=vectors.length;
  let cxx=0,cxy=0,cxz=0,cyy=0,cyz=0,czz=0;
  for(const v of vectors){const x=Number(v.x||0)-mean.x,y=Number(v.y||0)-mean.y,z=Number(v.z||0)-mean.z;cxx+=x*x;cxy+=x*y;cxz+=x*z;cyy+=y*y;cyz+=y*z;czz+=z*z;}
  let axis={x:1,y:.37,z:.19};
  for(let k=0;k<10;k++){const q={x:cxx*axis.x+cxy*axis.y+cxz*axis.z,y:cxy*axis.x+cyy*axis.y+cyz*axis.z,z:cxz*axis.x+cyz*axis.y+czz*axis.z},u=phoneUnit(q);if(!u)break;axis=u;}
  const along=[],deviation=[],magnitude=[];
  for(const v of vectors){const x=Number(v.x||0),y=Number(v.y||0),z=Number(v.z||0),p=x*axis.x+y*axis.y+z*axis.z,m=Math.sqrt(x*x+y*y+z*z);along.push(p);deviation.push(Math.sqrt(Math.max(0,m*m-p*p)));magnitude.push(m);}
  return{axis,along,deviation,magnitude};
}
function phoneSeriesCrest(values){const a=(values||[]).map(x=>Math.abs(Number(x||0)));if(!a.length)return 0;const rms=Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length);return rms>1e-5?Math.max(...a)/rms:0;}
function phoneCrestSimilarity(a,b){const x=Math.max(.05,phoneSeriesCrest(a)),y=Math.max(.05,phoneSeriesCrest(b));return phoneClamp01(Math.exp(-Math.abs(Math.log(x/y))*.75));}
function phoneMsmWindowCandidates(profile,stats,move){
  const all=stats?.samples||[];if(all.length<4)return[];
  const dur=Math.max(180,Number(profile?.duration||0)*1000),start=Number(move?.time||NaN),moveDur=Number(move?.duration||0);
  if(!Number.isFinite(start)||!all.some(s=>Number.isFinite(Number(s.timelineMs))))return[all];
  const latestStart=start+Math.max(0,moveDur-dur),starts=[start-80,start, start+Math.max(0,(moveDur-dur)/2),latestStart,latestStart+80];
  const out=[];
  for(const st of starts){const seg=all.filter(s=>Number(s.timelineMs)>=st&&Number(s.timelineMs)<=st+dur);if(seg.length>=4)out.push(seg);}
  if(!out.length)out.push(all);
  return out;
}
function phoneMsmMatchLegacySegment(profile,samples){
  const n=Number(profile?.count||0);if(!profile||n<4||samples.length<4)return 0;
  const principal=phonePrincipalMotion(samples);if(!principal)return 0;
  const type=String(profile.classifierType||"").toLowerCase();
  let primaryScore=0,secondaryScore=0,structureScore=0;
  if(type.includes("dir")){
    primaryScore=phoneShapeScore(profile.primary,principal.along,true);
    secondaryScore=phoneShapeScore(profile.secondary,principal.deviation,false);
    structureScore=(phoneCrestSimilarity(profile.primary,principal.along)+phoneCrestSimilarity(profile.secondary,principal.deviation))/2;
  }else{
    const motion=samples.map(s=>Number(s.motionMag||0)),jerk=samples.map(s=>Math.log1p(Math.max(0,Number(s.jerk||0)))),horizontal=samples.map(s=>Number(s.horizontal||0)),vertical=samples.map(s=>Math.abs(Number(s.vertical||0)));
    primaryScore=Math.max(phoneShapeScore(profile.primary,motion,false),phoneShapeScore(profile.primary,horizontal,false),phoneShapeScore(profile.primary,vertical,false));
    secondaryScore=Math.max(phoneShapeScore(profile.secondary,jerk,false),phoneShapeScore(profile.secondary,motion,false));
    structureScore=(phoneCrestSimilarity(profile.primary,motion)+phoneCrestSimilarity(profile.secondary,jerk))/2;
  }
  const span=Number(samples.at(-1)?.time||0)-Number(samples[0]?.time||0),target=Math.max(1,Number(profile.duration||0)*1000),durationScore=span>0?phoneClamp01(1-Math.abs(span-target)/(target*.75)):0.5;
  const raw=primaryScore*.58+secondaryScore*.27+structureScore*.10+durationScore*.05;
  return phoneClamp01((raw-.26)/.66);
}
function phoneMsmClassicCorr(ref,obs,signFlip=true){
  const n=Math.min(ref?.length||0,obs?.length||0);
  if(n<4)return 0;
  const a=phoneNormalize(ref.slice(0,n)),b=phoneNormalize(obs.slice(0,n));
  const maxShift=Math.max(1,Math.floor(n*.22));
  let best=-1;
  for(let sh=-maxShift;sh<=maxShift;sh++){
    let dot=0,used=0;
    for(let i=0;i<n;i++){
      const j=i+sh;
      if(j<0||j>=n)continue;
      dot+=a[i]*b[j];
      used++;
    }
    if(used>=Math.max(3,n*.58)){
      const c=dot/used;
      best=Math.max(best,signFlip?Math.abs(c):c);
    }
  }
  return phoneClamp01(best);
}
function phoneMsmMatchModern(profile,stats){
  const samples=stats?.samples||[],n=Number(profile?.count||0);
  if(!profile||n<4||samples.length<4)return 0;
  const features=[
    samples.map(s=>s.motionMag),
    samples.map(s=>s.horizontal),
    samples.map(s=>s.vertical),
    samples.map(s=>s.rotationMag),
    samples.map(s=>s.jerk),
    samples.map(s=>s.motion.x),
    samples.map(s=>s.motion.y),
    samples.map(s=>s.motion.z)
  ].map(series=>phoneResample(series,n));
  let primary=0,secondary=0;
  for(const feature of features){
    primary=Math.max(primary,phoneMsmClassicCorr(profile.primary,feature,true));
    secondary=Math.max(secondary,phoneMsmClassicCorr(profile.secondary,feature,true));
  }
  const energy=phoneMsmClassicCorr(
    profile.secondary,
    phoneResample(samples.map(s=>Number(s.motionMag||0)+Number(s.rotationMag||0)/180),n),
    true
  );
  const raw=primary*.52+secondary*.28+energy*.20;
  return phoneClamp01((raw-.08)/.82);
}
function phoneMsmMatchLegacy(profile,stats,move){
  const windows=phoneMsmWindowCandidates(profile,stats,move);
  let best=0;
  for(const samples of windows)best=Math.max(best,phoneMsmMatchLegacySegment(profile,samples));
  return best;
}
function phoneMsmMatch(profile,stats,move){
  return profile?.layout==="legacy-wiiu"
    ? phoneMsmMatchLegacy(profile,stats,move)
    : phoneMsmMatchModern(profile,stats);
}
function phoneClassifierMatch(profile,stats,move){
  return profile?.format==="livemove"
    ? phoneLiveMatch(profile,stats)
    : profile?.format==="msm"
      ? phoneMsmMatch(profile,stats,move)
      : 0;
}
function phoneMsmProfileSimilarity(a,b){
  if(a?.format!=="msm"||b?.format!=="msm")return 0;
  const primary=phoneShapeScore(a.primary,b.primary,true),secondary=phoneShapeScore(a.secondary,b.secondary,false);
  const da=Math.max(.001,Number(a.duration||0)),db=Math.max(.001,Number(b.duration||0)),duration=phoneClamp01(1-Math.abs(da-db)/Math.max(da,db));
  return phoneClamp01(primary*.62+secondary*.30+duration*.08);
}
function phoneBuildMsmCompetitors(){
  phoneDanceCompetitors=new Map();
  const entries=[...phoneDanceProfiles.entries()].filter(([,p])=>p?.format==="msm");
  for(const [name,profile] of entries){
    const list=entries.filter(([otherName,other])=>otherName!==name&&(other.signature||"")!==(profile.signature||"")).map(([otherName,other])=>({name:otherName,profile:other,similarity:phoneMsmProfileSimilarity(profile,other)})).sort((a,b)=>b.similarity-a.similarity).slice(0,5);
    phoneDanceCompetitors.set(name,list);
  }
}
function phoneMsmCompetitiveAdjust(profile,stats,move,targetScore){
  if(profile?.format!=="msm"||targetScore<=0)return{score:targetScore,runnerUp:0,margin:targetScore};
  const list=phoneDanceCompetitors.get(String(profile.moveName||"").toLowerCase())||[];
  let runnerUp=0,runnerName="";
  for(const item of list){const value=phoneMsmMatch(item.profile,stats,move);if(value>runnerUp){runnerUp=value;runnerName=item.name;}}
  const delta=runnerUp-targetScore;
  let score=targetScore;
  if(delta>.12)score=Math.min(score*.45,.43);
  else if(delta>.07)score*=.60;
  else if(delta>.035)score*=.78;
  else if(delta>.015)score*=.90;
  return{score:phoneClamp01(score),runnerUp:phoneClamp01(runnerUp),margin:targetScore-runnerUp,runnerName};
}

function phoneIsShake(move){ return /(?:^|[^a-z0-9])shake(?:[^a-z0-9]|\d|$)/i.test(String(move?.name||"")); }
function phoneMakeStats(){return{count:0,active:0,motionSum:0,motionPeak:0,rotationSum:0,rotationPeak:0,jerkSum:0,jerkPeak:0,reversals:0,strongReversals:0,prevMotion:null,prevUnit:null,prevTime:0,samples:[]};}
function phoneDanceResetLocal(clearQueue=true){phoneDanceActiveMoveIndex=-1;phoneDanceStats=null;phoneDanceJudgedMoves.clear();if(clearQueue)phoneDancePendingResults.clear();phoneDanceLocal={totalMoves:phoneDanceMoves.length,judgedMoves:0,rawScore:0,score:0,stars:0,rank:"SEM ESTRELAS",lastJudgement:"",judgementCounts:{PERFECT:0,SUPER:0,GOOD:0,OK:0,YEAH:0,X:0}};renderControllerDanceScore(phoneDanceLocal);}
function phoneDanceRank(d){const score=Math.max(0,Math.min(PHONE_DANCE_MAX_SCORE,Number(d.score||0))),stars=[2000,4000,6000,8000,10000].filter(x=>score>=x).length;d.stars=stars;d.rank=score>=12000?"MEGASTAR":score>=11000?"SUPERSTAR":stars?`${stars} ESTRELA${stars===1?"":"S"}`:"SEM ESTRELAS";}
function phoneDanceApplyLocalResult(move,result){if(!phoneDanceLocal)phoneDanceResetLocal(false);const per=PHONE_DANCE_MAX_SCORE/Math.max(1,phoneDanceMoves.length);phoneDanceLocal.rawScore=Math.min(PHONE_DANCE_MAX_SCORE,Number(phoneDanceLocal.rawScore||0)+per*PHONE_DANCE_WEIGHTS[result.judgement]);phoneDanceLocal.score=Math.round(phoneDanceLocal.rawScore);phoneDanceLocal.judgedMoves++;phoneDanceLocal.totalMoves=phoneDanceMoves.length;phoneDanceLocal.lastJudgement=result.judgement;phoneDanceLocal.lastMoveName=move?.name||"";phoneDanceLocal.lastQuality=result.quality;phoneDanceLocal.judgementCounts[result.judgement]=(phoneDanceLocal.judgementCounts[result.judgement]||0)+1;phoneDanceRank(phoneDanceLocal);renderControllerDanceScore(phoneDanceLocal,true);}
function phoneMeasureServerClock(force=false){if(!socket?.connected||!joinedRoom)return;const now=performance.now();if(!force&&now-phoneDanceLatencyMeasuredAt<5000)return;phoneDanceLatencyMeasuredAt=now;const wallStart=Date.now(),perfStart=performance.now();socket.emit("controller:dance-clock-ping",{roomCode:joinedRoom},response=>{if(!response?.ok)return;const rtt=Math.max(0,Math.min(4000,performance.now()-perfStart));const midpoint=wallStart+rtt/2;const offset=Number(response.serverTime||Date.now())-midpoint;phoneDanceServerRttMs=phoneDanceServerRttMs*.72+rtt*.28;phoneDanceServerOffsetMs=phoneDanceServerOffsetMs*.72+offset*.28;});}
function phoneUpdateCalibration(sample){const motion=phoneMagnitude(sample?.acceleration),rot=phoneMagnitude(sample?.rotationRate),g=phoneMagnitude(sample?.accelerationIncludingGravity);if(g>6&&g<13)phoneDanceCalibration.gravity=phoneDanceCalibration.gravity*.992+g*.008;if(motion<.30&&rot<18){phoneDanceCalibration.noiseMotion=phoneDanceCalibration.noiseMotion*.992+motion*.008;phoneDanceCalibration.noiseRotation=phoneDanceCalibration.noiseRotation*.992+rot*.008;phoneDanceCalibration.quietSamples++;}else{const targetM=Math.max(1.8,Math.min(7.5,motion*1.10));const targetR=Math.max(90,Math.min(520,rot*1.08));phoneDanceCalibration.motionScale=phoneDanceCalibration.motionScale*.997+targetM*.003;phoneDanceCalibration.rotationScale=phoneDanceCalibration.rotationScale*.997+targetR*.003;}}

function phoneDanceGetScoreTuning(songId=phoneDanceSession?.songId){
  return PHONE_DANCE_SCORE_TUNING[songId] || PHONE_DANCE_SCORE_TUNING.RainOverMe;
}
function phoneDanceGetMsmLayoutTuning(profile){
  return PHONE_DANCE_MSM_LAYOUT_TUNING[profile?.layout] || PHONE_DANCE_MSM_LAYOUT_TUNING.modern;
}
function phoneDanceLoadMobileTuning(songId){
  const cfg=phoneDanceGetScoreTuning(songId);
  let savedRef=0;
  try{
    const all=JSON.parse(localStorage.getItem(PHONE_DANCE_CALIBRATION_STORAGE_KEY)||"{}");
    savedRef=Number(all?.[songId]?.perfectRef||0);
  }catch{}
  phoneDanceMobileTuning={songId,perfectRef:Number.isFinite(savedRef)&&savedRef>=cfg.minRef&&savedRef<=cfg.maxRef?savedRef:cfg.perfectRef,samples:[]};
}
function phoneDancePersistMobileTuning(){
  const songId=phoneDanceMobileTuning.songId;
  if(!songId)return;
  try{
    const all=JSON.parse(localStorage.getItem(PHONE_DANCE_CALIBRATION_STORAGE_KEY)||"{}");
    all[songId]={perfectRef:Math.round(phoneDanceMobileTuning.perfectRef*10000)/10000,updatedAt:Date.now()};
    localStorage.setItem(PHONE_DANCE_CALIBRATION_STORAGE_KEY,JSON.stringify(all));
  }catch{}
}
function phoneDanceCalibratedClassifier(raw,songId=phoneDanceSession?.songId,lockReference=false){
  const cfg=phoneDanceGetScoreTuning(songId);
  const ref=Math.max(cfg.floor+.08,lockReference?Number(cfg.perfectRef):Number(phoneDanceMobileTuning.perfectRef||cfg.perfectRef));
  const t=phoneClamp01((Number(raw||0)-cfg.floor)/(ref-cfg.floor));
  return phoneClamp01(t*t*(3-2*t));
}
function phoneDanceLearnMobileCeiling(raw,stats){
  const songId=phoneDanceSession?.songId;
  if(!songId||!stats)return;
  const cfg=phoneDanceGetScoreTuning(songId);
  const n=Math.max(1,Number(stats.count||0));
  const coverage=Number(stats.active||0)/n;
  if(coverage<.30||Number(raw||0)<cfg.floor+.08)return;
  const arr=phoneDanceMobileTuning.samples;
  arr.push(Number(raw||0));
  if(arr.length>48)arr.shift();
  if(arr.length<8)return;
  const sorted=arr.slice().sort((a,b)=>a-b);
  const p80=sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*.80))];
  const target=Math.max(cfg.minRef,Math.min(cfg.maxRef,p80*1.10));
  phoneDanceMobileTuning.perfectRef=phoneDanceMobileTuning.perfectRef*.86+target*.14;
  phoneDancePersistMobileTuning();
}
function phoneDanceChaosScore(stats){
  const n=Math.max(1,Number(stats?.count||0));
  const rev=phoneClamp01(Number(stats?.reversals||0)/Math.max(4,n*.28));
  const strong=phoneClamp01(Number(stats?.strongReversals||0)/Math.max(3,n*.14));
  const jerkAvg=Number(stats?.jerkSum||0)/n;
  const jerk=phoneClamp01(jerkAvg/Math.max(8,phoneDanceCalibration.motionScale*18));
  return rev*.46+strong*.34+jerk*.20;
}

function phoneDanceClockNow(){if(!phoneDanceClock.initialized)return 0;return phoneDanceClock.timelineMs+(phoneDanceClock.playing?(performance.now()-phoneDanceClock.anchorPerf):0);}
function phoneDanceSyncClock(payload){const now=performance.now(),reason=String(payload?.reason||"sync"),playing=Boolean(payload?.playing);phoneMeasureServerClock(false);const serverNowEstimate=Date.now()+phoneDanceServerOffsetMs;const serverAge=Number.isFinite(Number(payload?.serverTime))?Math.max(0,Math.min(1800,serverNowEstimate-Number(payload.serverTime))):Math.max(0,phoneDanceServerRttMs/2);const hostLeg=Math.max(0,Math.min(1000,Number(payload?.hostOneWayMs||0)));const target=Number(payload?.timelineMs||0)+(playing?serverAge+hostLeg:0); if(!phoneDanceClock.initialized||["song","seek","room","play","pause","ended"].includes(reason)){phoneDanceClock={timelineMs:target,anchorPerf:now,playing,initialized:true};return;} const predicted=phoneDanceClockNow(),drift=target-predicted; const correction=Math.max(-55,Math.min(55,drift*.14)); phoneDanceClock={timelineMs:predicted+correction,anchorPerf:now,playing,initialized:true};}
async function phoneLoadDanceSong(songId,expectedRevision="") {
  const song=PHONE_DANCE_SONGS[songId]||PHONE_DANCE_SONGS.RainOverMe,token=++phoneDanceLoadToken;
  phoneDanceReady=false;
  phoneDanceProfiles=new Map();
  phoneDanceCompetitors=new Map();
  phoneDanceLoadMobileTuning(song.id);
  if(sensorNotice)sensorNotice.textContent=`Carregando movimentos e classifiers ${String(song.classifierFormat||"").toUpperCase()} diretamente neste celular…`;
  try{
    // O celular é a fonte do julgamento. Ele próprio lê o moves atual, sem cache.
    let moves=[];
    let loadedRevision="";
    for(let attempt=0;attempt<2;attempt++){
      const r=await fetch(phoneDanceFreshUrl(`${song.base}/moves/${song.movesFile}`),{cache:"no-store"});
      if(!r.ok)throw new Error(`moves HTTP ${r.status}`);
      const body=await r.json();
      moves=Array.isArray(body)?body.slice().sort((a,b)=>Number(a.time||0)-Number(b.time||0)):[];
      loadedRevision=phoneDanceMovesRevisionOf(moves);
      if(!expectedRevision||loadedRevision===String(expectedRevision))break;
    }
    if(token!==phoneDanceLoadToken)return;
    phoneDanceMoves=moves;
    phoneDanceMovesRevision=loadedRevision;
    phoneDanceLoadedSongId=song.id;

    const names=[...new Set(phoneDanceMoves.map(m=>String(m?.name||"")).filter(Boolean))];
    const candidates=new Map();
    await Promise.all(names.map(async name=>{
      const found=[];
      for(const candidate of phoneDanceClassifierCandidates(song,name)){
        try{
          const fr=await fetch(phoneDanceFreshUrl(`${song.base}/${candidate.folder}/${candidate.file}`),{cache:"no-store"});
          if(!fr.ok)continue;
          const buf=await fr.arrayBuffer();
          const p=candidate.format==="msm"?phoneParseMsm(buf,name):phoneParseLiveMove(buf,name);
          if(p)found.push({...candidate,profile:p});
        }catch{}
      }
      candidates.set(String(name).toLowerCase(),found);
    }));
    if(token!==phoneDanceLoadToken)return;

    // IMPORTANT: o arquivo pertencente ao nome do movimento é usado se for
    // parseável. MSMs com conteúdo igual NÃO são descartados: isso é decisão
    // do pacote da música, não do servidor nem de uma heurística nossa.
    const msmSignatureCounts=new Map();
    for(const found of candidates.values())for(const item of found)if(item.profile?.format==="msm"){
      const sig=item.profile.signature||phoneMsmSignature(item.profile);
      msmSignatureCounts.set(sig,(msmSignatureCounts.get(sig)||0)+1);
    }
    let loaded=0,duplicateMsm=0;
    for(const name of names){
      const found=candidates.get(String(name).toLowerCase())||[];
      const chosen=(found.find(x=>x.profile?.format==="msm")||found[0]||null)?.profile||null;
      if(chosen){
        phoneDanceProfiles.set(String(name).toLowerCase(),chosen);
        loaded++;
        if(chosen.format==="msm"&&Number(msmSignatureCounts.get(chosen.signature||phoneMsmSignature(chosen))||0)>1)duplicateMsm++;
      }
    }
    if(token!==phoneDanceLoadToken)return;
    phoneBuildMsmCompetitors();
    const activeFormats=[...new Set([...phoneDanceProfiles.values()].map(p=>String(p.format||"").toUpperCase()))];
    phoneDanceClassifierSummary={loaded,total:names.length,format:activeFormats.join("+")||String(song.classifierFormat||"").toUpperCase(),duplicateMsm};
    phoneDanceReady=phoneDanceMoves.length>0;
    phoneDanceResetLocal(true);

    const revisionOk=!expectedRevision||phoneDanceMovesRevision===String(expectedRevision);
    if(sensorNotice){
      const duplicateInfo=duplicateMsm?` • ${duplicateMsm} nomes usam MSM de conteúdo repetido (ainda assim são usados)`:"";
      const revisionInfo=revisionOk?"":` • AVISO: revisão PC ${expectedRevision} / celular ${phoneDanceMovesRevision}`;
      sensorNotice.textContent=`Celular pronto • ${loaded}/${names.length} classifiers ${activeFormats.join("+")||"—"}${duplicateInfo}${revisionInfo} • julgamento é calculado aqui e enviado pronto ao servidor.`;
    }
  }catch(error){
    console.error("Falha ao preparar classifiers no celular",error);
    phoneDanceReady=false;
    if(sensorNotice)sensorNotice.textContent="Não foi possível carregar movimentos/classifiers no celular. O servidor não gera nota de substituição.";
  }
}
async function phoneApplyDanceSession(payload){
  if(!payload||payload.roomCode!==joinedRoom)return;
  const previousSongId=phoneDanceSession?.songId||"";
  const incomingRevision=String(payload?.movesRevision||"");
  const songChanged=previousSongId!==String(payload.songId||"");
  const songNotLoaded=phoneDanceLoadedSongId!==String(payload.songId||"");
  const timelineMismatch=Boolean(incomingRevision&&phoneDanceMovesRevision&&incomingRevision!==phoneDanceMovesRevision);
  const explicitSongRefresh=String(payload?.reason||"")==="song";
  phoneDanceSession={...payload};
  phoneDanceSyncClock(payload);
  if(songChanged||songNotLoaded||timelineMismatch||explicitSongRefresh){
    await phoneLoadDanceSong(payload.songId,incomingRevision);
    phoneDanceSyncClock(payload);
  }
  if(sensorModeRequested&&sensorPermissionGranted&&!sensorStreaming)startSensorStreaming();
}
function phoneMoveIndexAt(ms){for(let i=0;i<phoneDanceMoves.length;i++){const m=phoneDanceMoves[i],start=Number(m.time||0)-130,end=Number(m.time||0)+Number(m.duration||0)+170;if(ms>=start&&ms<=end)return i;if(start>ms)break;}return-1;}
function phoneJudge(stats,move){
  if(!stats||stats.count<4)return{judgement:"X",quality:0,classifierMatch:0,classifierRaw:0};
  const n=Math.max(1,stats.count);
  const coverage=stats.active/n;
  const avgMotion=stats.motionSum/n;
  const avgRot=stats.rotationSum/n;
  const coverageQ=phoneClamp01((coverage-.06)/.58);
  const motionEvidence=Math.max(phoneClamp01(avgMotion/(phoneDanceCalibration.motionScale*1.10)),phoneClamp01(avgRot/(phoneDanceCalibration.rotationScale*1.18)));
  const peakEvidence=Math.max(phoneClamp01(stats.motionPeak/(phoneDanceCalibration.motionScale*1.95)),phoneClamp01(stats.rotationPeak/(phoneDanceCalibration.rotationScale*2.55)));
  const profile=phoneDanceProfiles.get(String(move?.name||"").toLowerCase())||null;
  const layoutCfg=profile?.format==="msm"?phoneDanceGetMsmLayoutTuning(profile):PHONE_DANCE_MSM_LAYOUT_TUNING.modern;

  let rawClassifier=profile?phoneClassifierMatch(profile,stats,move):0;
  let classifierRunnerUp=0,classifierMargin=rawClassifier;

  // O matcher competitivo rígido do V6 prejudicava os MSM modernos:
  // movimentos parecidos de Rain Over Me / It's Raining Men derrubavam a nota
  // mesmo quando o classifier correto tinha boa correlação.
  if(profile?.format==="msm"&&layoutCfg.competitive){
    const competitive=phoneMsmCompetitiveAdjust(profile,stats,move,rawClassifier);
    rawClassifier=competitive.score;
    classifierRunnerUp=competitive.runnerUp;
    classifierMargin=competitive.margin;
  }

  if(phoneIsShake(move)){
    const rev=phoneClamp01(stats.reversals/Math.max(3,n*.16));
    const strong=phoneClamp01(stats.strongReversals/Math.max(2,n*.08));
    const jerk=phoneClamp01((stats.jerkSum/n)/(phoneDanceCalibration.motionScale*14));
    const shake=rev*.46+strong*.24+jerk*.18+phoneClamp01(avgRot/(phoneDanceCalibration.rotationScale*.85))*.12;
    rawClassifier=Math.max(rawClassifier,shake*.92);
  }

  const clear=coverage>=.10&&(avgMotion>=Math.max(phoneDanceCalibration.noiseMotion*2.2,phoneDanceCalibration.motionScale*.070)||avgRot>=Math.max(phoneDanceCalibration.noiseRotation*2.4,phoneDanceCalibration.rotationScale*.055));
  if(!clear)return{judgement:"X",quality:.02,classifierMatch:0,classifierRaw:Math.round(rawClassifier*1000)/1000};

  const songId=phoneDanceSession?.songId||"RainOverMe";
  const cfg=phoneDanceGetScoreTuning(songId);
  const adaptive=Boolean(profile&&layoutCfg.adaptiveCeiling);

  const mobileClassifier=profile?phoneDanceCalibratedClassifier(rawClassifier,songId,!adaptive):0;
  if(adaptive)phoneDanceLearnMobileCeiling(rawClassifier,stats);

  let q=0;
  if(profile){
    q=mobileClassifier*layoutCfg.classifierWeight
      +coverageQ*layoutCfg.coverageWeight
      +motionEvidence*layoutCfg.motionWeight
      +peakEvidence*layoutCfg.peakWeight;
  }else{
    q=Math.min(.54,coverageQ*.55+motionEvidence*.30+peakEvidence*.15);
  }

  if(profile&&!phoneIsShake(move)){
    const chaos=phoneDanceChaosScore(stats);
    if(chaos>.80)q=Math.min(q,cfg.superQ+.08);
  }
  if(profile&&rawClassifier<cfg.floor*.78)q=Math.min(q,cfg.okQ+.02);

  q=phoneClamp01(q);
  const quality=Math.round(q*1000)/1000;
  const cm=Math.round(mobileClassifier*1000)/1000;
  const raw=Math.round(rawClassifier*1000)/1000;
  const refValue=adaptive
    ? Number(phoneDanceMobileTuning.perfectRef||cfg.perfectRef)
    : Number(cfg.perfectRef);
  const ref=Math.round(refValue*1000)/1000;

  if(move?.goldMove){
    const yeah=profile?(mobileClassifier>=.42&&q>=.44):q>=.48;
    return{
      judgement:yeah?"YEAH":"X",
      quality,
      classifierMatch:cm,
      classifierRaw:raw,
      classifierRunnerUp:Math.round(classifierRunnerUp*1000)/1000,
      classifierMargin:Math.round(classifierMargin*1000)/1000,
      calibrationRef:ref,
      classifierLayout:profile?.layout||profile?.format||"none"
    };
  }

  const judgement=q>=cfg.perfectQ?"PERFECT":q>=cfg.superQ?"SUPER":q>=cfg.goodQ?"GOOD":q>=cfg.okQ?"OK":"X";
  return{
    judgement,
    quality,
    classifierMatch:cm,
    classifierRaw:raw,
    classifierRunnerUp:Math.round(classifierRunnerUp*1000)/1000,
    classifierMargin:Math.round(classifierMargin*1000)/1000,
    calibrationRef:ref,
    classifierLayout:profile?.layout||profile?.format||"none"
  };
}
function phoneQueueResult(index,move,result){const payload={roomCode:joinedRoom,moveIndex:index,moveName:move?.name||`move-${index+1}`,goldMove:Boolean(move?.goldMove),totalMoves:phoneDanceMoves.length,movesRevision:phoneDanceMovesRevision,...result,scoredAt:Date.now(),source:"phone-v13-wherehaveyou-msm"};phoneDancePendingResults.set(index,payload);phoneDanceApplyLocalResult(move,result);phoneFlushDanceResults();}
function phoneFlushDanceResults(){if(!socket?.connected||!joinedRoom||!phoneDancePendingResults.size)return;for(const [index,payload] of [...phoneDancePendingResults]){socket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("controller:dance-judgement",payload,(error,response)=>{if(!error&&response?.ok){phoneDancePendingResults.delete(index);if(response.state)applyState(response.state);}});}}
function phoneFinalizeActiveMove(){const i=phoneDanceActiveMoveIndex;if(i<0||phoneDanceJudgedMoves.has(i))return;const move=phoneDanceMoves[i];if(!move)return;const result=phoneJudge(phoneDanceStats,move);phoneDanceJudgedMoves.add(i);phoneQueueResult(i,move,result);phoneDanceActiveMoveIndex=-1;phoneDanceStats=null;}
function phoneSyncMoveWindow(){if(!phoneDanceReady||!phoneDanceClock.playing||!sensorStreaming)return;const current=phoneMoveIndexAt(phoneDanceClockNow());if(phoneDanceActiveMoveIndex>=0&&current!==phoneDanceActiveMoveIndex)phoneFinalizeActiveMove();if(current>=0&&!phoneDanceJudgedMoves.has(current)&&phoneDanceActiveMoveIndex!==current){phoneDanceActiveMoveIndex=current;phoneDanceStats=phoneMakeStats();}}
function phoneCollectDanceSample(sample){if(!phoneDanceReady||!phoneDanceSession||!phoneDanceClock.playing||!sensorStreaming)return;phoneSyncMoveWindow();if(phoneDanceActiveMoveIndex<0||!phoneDanceStats)return;const st=phoneDanceStats,now=performance.now(),linear={x:Number(sample.acceleration?.x||0),y:Number(sample.acceleration?.y||0),z:Number(sample.acceleration?.z||0)},gravity={x:Number(sample.accelerationIncludingGravity?.x||0),y:Number(sample.accelerationIncludingGravity?.y||0),z:Number(sample.accelerationIncludingGravity?.z||0)},rotation={x:Number(sample.rotationRate?.x||0),y:Number(sample.rotationRate?.y||0),z:Number(sample.rotationRate?.z||0)};let motion=linear;if(phoneMagnitude(linear)<.04&&st.prevGravity){motion={x:gravity.x-st.prevGravity.x,y:gravity.y-st.prevGravity.y,z:gravity.z-st.prevGravity.z};}st.prevGravity={...gravity};const gmag=phoneMagnitude(gravity);if(gmag>6&&gmag<13&&phoneMagnitude(motion)<.35){phoneDanceCalibration.gravity=phoneDanceCalibration.gravity*.985+gmag*.015;phoneDanceCalibration.quietSamples++;}const gu=phoneUnit(gravity)||{x:0,y:0,z:1},vertical=phoneDot(motion,gu),motionMag=phoneMagnitude(motion),horizontal=Math.sqrt(Math.max(0,motionMag*motionMag-vertical*vertical)),rotationMag=phoneMagnitude(rotation),dt=st.prevTime?Math.max(.018,Math.min(.12,(now-st.prevTime)/1000)):.035;st.prevTime=now;let jerk=0;if(st.prevMotion)jerk=phoneMagnitude({x:(motion.x-st.prevMotion.x)/dt,y:(motion.y-st.prevMotion.y)/dt,z:(motion.z-st.prevMotion.z)/dt});st.prevMotion={...motion};const unit=motionMag>.10?phoneUnit(motion):null;if(unit&&st.prevUnit){const dot=Math.max(-1,Math.min(1,phoneDot(unit,st.prevUnit)));if(dot<-.18)st.reversals++;if(dot<-.52)st.strongReversals++;}if(unit)st.prevUnit=unit;st.count++;if(motionMag>=.20||rotationMag>=18)st.active++;st.motionSum+=motionMag;st.motionPeak=Math.max(st.motionPeak,motionMag);st.rotationSum+=rotationMag;st.rotationPeak=Math.max(st.rotationPeak,rotationMag);st.jerkSum+=jerk;st.jerkPeak=Math.max(st.jerkPeak,jerk);st.samples.push({time:now,timelineMs:phoneDanceClockNow(),motion,gravity,rotation,motionMag,rotationMag,vertical,horizontal,jerk});if(st.samples.length>220)st.samples.shift();}

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
      ? "Giroscópio/aceleração detectados. O julgamento dos movimentos acontece neste celular."
      : "Movimento detectado. A rotação pode ser estimada pela orientação; a nota continua sendo calculada localmente.";
  }
  if (enableSensorsBtn) {
    enableSensorsBtn.textContent = "Sensores ativados";
    enableSensorsBtn.disabled = true;
  }
  if (sensorNotice) {
    const cls = phoneDanceClassifierSummary.total ? ` • ${phoneDanceClassifierSummary.loaded}/${phoneDanceClassifierSummary.total} ${phoneDanceClassifierSummary.format}` : "";
    sensorNotice.textContent = sensorObserved.gyro
      ? `Pontuação V5 local ativa${cls}. O servidor recebe apenas os resultados prontos.`
      : `Fallback de orientação ativo${cls}. O servidor não calcula sua posição nem sua nota.`;
  }
}

function sendLatestSensorSample(source = "mixed", interval = 0) {
  if (!sensorStreaming || !sensorModeRequested) return;
  const now = performance.now();
  if (now - sensorLastSentAt < 26) return;
  sensorLastSentAt = now;

  const rotationRate = sensorVectorMagnitude(sensorLatestRotation) > 0.001 ? sensorLatestRotation : sensorDerivedRotation;
  if (sensorVectorMagnitude(sensorLatestRotation) <= 0.001 && sensorVectorMagnitude(sensorDerivedRotation) > 0.001) {
    source = source === "deviceorientation" ? "orientation-fallback" : source;
    markObserved("orientationFallback");
  }
  sensorLatestIntensity = localSensorIntensity(sensorLatestAcceleration, sensorLatestAccelerationIncludingGravity, rotationRate);
  sensorLatestSource = source || "mixed";
  sensorPacketCount += 1;
  renderLocalSensorMeter(sensorLatestIntensity);
  showSensorReceivingUi();
  if (sensorWatchdogTimer) { clearTimeout(sensorWatchdogTimer); sensorWatchdogTimer = null; }

  const sample = {
    acceleration: { ...sensorLatestAcceleration },
    accelerationIncludingGravity: { ...sensorLatestAccelerationIncludingGravity },
    rotationRate: { ...rotationRate },
    orientation: { ...sensorLatestOrientation },
    interval: Number(interval || 0), clientTime: Date.now(), source: sensorLatestSource
  };

  phoneUpdateCalibration(sample);
  // CRÍTICO: primeiro pontua localmente. Isto não depende de ping, Render ou PC.
  phoneCollectDanceSample(sample);

  // Telemetria visual bem mais leve; se a rede cair ela simplesmente é descartada.
  if (socket?.connected && joinedRoom && now - phoneDanceLastTelemetryAt >= 240) {
    phoneDanceLastTelemetryAt = now;
    const emitter = socket.volatile || socket;
    emitter.emit("controller:sensor-data", { roomCode: joinedRoom, sample });
  }
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
  // Orientação é fallback. Quando há DeviceMotion/acelerômetro recente, não deixa
  // este evento ocupar a janela de amostragem com aceleração antiga.
  if (now - sensorLastMotionReadingAt > 140 && now - sensorLastGenericAccelAt > 140) {
    sendLatestSensorSample("deviceorientation");
  }
}

function handleDeviceMotion(event) {
  markObserved("motion");
  sensorLastMotionReadingAt = performance.now();
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

function scheduleGenericSensorSample() {
  if (sensorGenericFusionTimer) return;
  sensorGenericFusionTimer = window.setTimeout(() => {
    sensorGenericFusionTimer = 0;
    sendLatestSensorSample("generic-fused", 1000 / 40);
  }, 7);
}

function registerGenericSensor(sensor, source, onReading) {
  if (!sensor) return;
  sensor.onreading = () => {
    try {
      onReading(sensor);
      if (source.includes("acceleration") || source.includes("accelerometer")) sensorLastGenericAccelAt = performance.now();
      scheduleGenericSensorSample();
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
  if (sensorGenericFusionTimer) { clearTimeout(sensorGenericFusionTimer); sensorGenericFusionTimer = 0; }
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
  sensorLastMotionReadingAt = 0;
  sensorLastGenericAccelAt = 0;
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
  const serverDance = me?.dance || {};
  const displayDance = phoneDanceLocal && Number(phoneDanceLocal.judgedMoves || 0) >= Number(serverDance.judgedMoves || 0) ? phoneDanceLocal : serverDance;
  renderControllerDanceScore(displayDance);
  if (sensorPacketValue) sensorPacketValue.textContent = String(Number(serverSensor.packetCount || sensorPacketCount));
  if (sensorMovementValue) sensorMovementValue.textContent = `${Math.round(Number(serverSensor.intensity || sensorLatestIntensity) * 100)}%`;
  if (sensorMotionFill) sensorMotionFill.style.width = `${Math.round(Number(serverSensor.intensity || sensorLatestIntensity) * 100)}%`;
  if (sensorSourceValue && serverSensor.lastSource && !sensorStreaming) sensorSourceValue.textContent = sensorSourceLabel(serverSensor.lastSource);

  turnKicker.textContent = "Just Dance • pontuação no celular";
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
    sensorModeText.textContent = "O computador está pronto. Ative os sensores: classifiers, recalibração Wii→celular e julgamento serão processados neste celular.";
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
      status?.features?.danceJudgements === true &&
      status?.features?.danceTimelineRelay === true
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
  socket.on("dev:dance-session", payload => {
    if (!joinedRoom || payload?.roomCode !== joinedRoom) return;
    phoneApplyDanceSession(payload);
  });

  socket.on("dev:dance-reset", payload => {
    if (!joinedRoom || payload?.roomCode !== joinedRoom) return;
    phoneDanceResetLocal(true);
    if (payload.state) applyState(payload.state);
    if (sensorNotice) sensorNotice.textContent = "Pontuação local zerada pelo computador. Classifiers continuam carregados no celular.";
  });

  socket.on("dev:dance-judgement", payload => {
    if (!joinedRoom || payload?.roomCode !== joinedRoom) return;
    const result = (payload.results || []).find(item => item.playerId === myPlayerId);
    if (result?.dance) {
      const serverDance = result.dance;
      const displayDance = phoneDanceLocal && Number(phoneDanceLocal.judgedMoves || 0) > Number(serverDance.judgedMoves || 0) ? phoneDanceLocal : serverDance;
      renderControllerDanceScore(displayDance, false);
    }
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
    phoneDanceResetLocal(true);
    phoneDanceSession = null;
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
    connectionBadge.textContent = sensorStreaming ? "Sem conexão • pontuando localmente" : "Sem conexão";
    mobileRollBtn.disabled = true;
    // Não desliga os sensores: a nota continua sendo calculada e entra numa fila local.
    if (sensorNotice && sensorStreaming) sensorNotice.textContent = "Internet instável: continuando a pontuar neste celular. Os resultados serão enviados quando reconectar.";
  });

  socket.on("connect", () => {
    if (myPlayerId && joinedRoom) {
      connectionBadge.textContent = "Reconectando sala…";
      socket.timeout(MULTIPLAYER_TIMEOUT_MS).emit("controller:resume", { roomCode: joinedRoom, playerId: myPlayerId }, (error, response) => {
        if (!error && response?.ok) {
          connectionBadge.textContent = "Conectado";
          if (response.state) applyState(response.state);
          if (response.danceSession) phoneApplyDanceSession(response.danceSession);
          reportSensorStatus(sensorStreaming, true);
          phoneMeasureServerClock(true);
          phoneFlushDanceResults();
        } else {
          connectionBadge.textContent = "Reconexão pendente";
        }
      });
    }
  });
}

enableSensorsBtn?.addEventListener("click", requestAndStartSensors);

controllerBackBtn.addEventListener("click", () => {
  stopSensorStreaming({ keepPermission: false });
  window.location.href = "/";
});
