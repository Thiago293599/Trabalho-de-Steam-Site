(() => {
  "use strict";
  const $=s=>document.querySelector(s);
  const panel=$("#finalOnlineV2Panel"),actions=$("#finalOnlineV2Actions"),lobby=$("#finalOnlineV2Lobby"),remote=$("#finalOnlineV2Remote"),nameInput=$("#finalOnlineV2Name"),createBtn=$("#finalOnlineV2Create"),showJoin=$("#finalOnlineV2ShowJoin"),joinRow=$("#finalOnlineV2JoinRow"),codeInput=$("#finalOnlineV2CodeInput"),joinBtn=$("#finalOnlineV2Join"),roomCodeEl=$("#finalOnlineV2RoomCode"),playersEl=$("#finalOnlineV2Players"),statusEl=$("#finalOnlineV2Status"),startBtn=$("#finalOnlineV2Start"),leaveBtn=$("#finalOnlineV2Leave"),inviteBox=$("#finalOnlineV2Invite"),copyInvite=$("#finalOnlineV2CopyInvite"),controlSetup=$("#finalOnlineV2ControlSetup"),sensorPair=$("#finalOnlineV2SensorPair"),sensorStatus=$("#finalOnlineV2SensorStatus"),sensorQr=$("#finalOnlineV2SensorQr"),sensorLinkEl=$("#finalOnlineV2SensorLink"),sensorOpen=$("#finalOnlineV2SensorOpen"),sensorCopy=$("#finalOnlineV2SensorCopy");
  if(!panel)return;

  const boardView=$("#finalBoardView"),spacesLayer=$("#finalBoardSpaces"),tokensLayer=$("#finalBoardTokens"),playersList=$("#finalBoardPlayers"),roundText=$("#finalBoardRound"),turnName=$("#finalBoardTurnName"),turnAvatar=$("#finalBoardTurnAvatar"),instruction=$("#finalBoardInstruction"),eventBox=$("#finalBoardEvent"),rollButton=$("#finalRollDice"),diceResult=$("#finalDiceResult"),modeBadge=$("#finalBoardModeBadge"),minigameOverlay=$("#finalMinigameOverlay"),minigameIntro=$("#finalMinigameIntro"),droneGame=$("#finalDroneGame"),motionGame=$("#finalMotionEscapeGame"),motionLanes=$("#finalMotionEscapeLanes"),motionTimer=$("#finalMotionEscapeTimer"),motionWave=$("#finalMotionEscapeWave"),minigameResult=$("#finalMinigameResult"),minigameTitle=$("#finalMinigameTitle"),minigameDescription=$("#finalMinigameDescription"),droneQuestion=$("#finalDroneQuestion"),droneAnswers=$("#finalDroneAnswers"),droneTimer=$("#finalDroneTimer"),eduTopic=$("#finalEduTopic"),minigameWinner=$("#finalMinigameWinner"),minigameRanking=$("#finalMinigameRanking"),returnBoard=$("#finalReturnBoard"),startMinigame=$("#finalStartMinigame"),matchResultOverlay=$("#finalMatchResultOverlay"),matchRanking=$("#finalMatchRanking");

  const configured=String(window.GAME_CONFIG?.SERVER_URL||"").trim().replace(/\/+$/,"");
  const SESSION_KEY="steamPartyOnlineSessionV2";
  const SPACE_COUNT=28;
  const spaceTypes=["start","good","tech","bad","good","challenge","event","good","bad","tech","good","challenge","bad","event","good","tech","bad","good","challenge","event","good","bad","tech","good","challenge","bad","event","good"];
  const symbols={start:"INÍCIO",good:"+",bad:"−",tech:"T",challenge:"?",event:"!"};
  const path=(()=>{const p=[];for(let x=10;x<=90;x+=80/7)p.push({x,y:10});for(let y=21.5;y<=78.5;y+=57/5)p.push({x:90,y});for(let x=90;x>=10;x-=80/7)p.push({x,y:90});for(let y=78.5;y>=21.5;y-=57/5)p.push({x:10,y});return p.slice(0,SPACE_COUNT)})();

  let socket=null,roomCode="",playerId="",resumeToken="",state=null,isHost=false,v2State=null,wired=false,resuming=false,timer=0;
  const normalize=v=>String(v||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
  const selectedOnline=()=>document.querySelector('[data-match-mode="online"]')?.classList.contains("is-selected");
  const avatar=p=>window.STEAMParty?.avatarSvg?.(p,true)||`<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="42" fill="#65f2c3"/><circle cx="45" cy="52" r="5"/><circle cx="75" cy="52" r="5"/></svg>`;
  function saveSession(){try{localStorage.setItem(SESSION_KEY,JSON.stringify({roomCode,playerId,resumeToken,name:nameInput?.value||""}))}catch{}}
  function clearSession(){try{localStorage.removeItem(SESSION_KEY)}catch{}}
  function readSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||"null")}catch{return null}}
  function inviteUrl(){const u=new URL(location.href);u.searchParams.set("onlineRoom",roomCode);u.hash="";return u.toString()}
  function setStatus(t){if(statusEl)statusEl.textContent=t}

  function connect(){
    if(socket?.connected)return Promise.resolve(socket);
    return new Promise((resolve,reject)=>{
      if(typeof io!=="function"||!configured){reject(new Error("Servidor Online público não configurado."));return}
      socket=socket||io(configured,{transports:["websocket","polling"],reconnection:true,reconnectionDelay:700,reconnectionDelayMax:3500});
      wire();
      if(socket.connected){resolve(socket);return}
      const t=setTimeout(()=>reject(new Error("Servidor Online não respondeu.")),7000);
      socket.once("connect",()=>{clearTimeout(t);resolve(socket)});
    });
  }

  function wire(){
    if(wired||!socket)return; wired=true;
    socket.on("connect",()=>{if(roomCode&&playerId&&resumeToken&&!resuming)void resumeCurrentSession(false)});
    socket.on("online:state",s=>{if(s?.roomCode!==roomCode)return;state=s;isHost=playerId===state.hostPlayerId;renderLobby()});
    socket.on("online:v2-started",p=>{if(p?.roomCode!==roomCode)return;v2State=p.state;isHost=playerId===(p.hostPlayerId||state?.hostPlayerId);if(isHost){window.STEAMPartyBoard?.startOnlineHost?.(p.config||buildConfig(),state.players,p.hostPlayerId||playerId)}else renderReplica();});
    socket.on("online:v2-state",p=>{if(p?.roomCode!==roomCode)return;v2State=p.state;if(!isHost)renderReplica()});
    socket.on("online:v2-action",action=>{if(!action||action.roomCode!==roomCode||!isHost)return;window.dispatchEvent(new CustomEvent("steam-online-v2-action",{detail:action}))});
    socket.on("online:v2-sensor",payload=>{if(!payload||payload.roomCode!==roomCode||!isHost)return;window.dispatchEvent(new CustomEvent("steam-online-v2-sensor",{detail:payload}))});
    socket.on("online:room-closed",()=>reset("Sala encerrada."));
    socket.on("online:kicked",p=>reset(p?.message||"Você foi removido."));
  }

  function ack(event,payload){return connect().then(sock=>new Promise((resolve,reject)=>sock.timeout(7000).emit(event,payload,(err,res)=>err?reject(new Error("Servidor não respondeu.")):res?.ok?resolve(res):reject(new Error(res?.message||"Ação recusada.")))))}
  function buildConfig(){let raw={};try{raw=JSON.parse(localStorage.getItem("steamPartyMatchConfigV1")||"{}")||{}}catch{}const mode=state?.controlMethod==="phone-motion"?"phone-motion":"keyboard";return{...raw,mode:"online",humanPlayers:Math.max(2,state?.players?.length||2),controlMethod:mode==="phone-motion"?"online-phone-motion":"online-keyboard",motionMinigamesEnabled:mode==="phone-motion",minigamesEnabled:true}}
  function privateSensorUrl(){if(!roomCode||!playerId||!resumeToken)return"";const u=new URL("controller.html",location.href);u.searchParams.set("onlineSensor","1");u.searchParams.set("onlineRoom",roomCode);u.searchParams.set("onlinePlayer",playerId);u.searchParams.set("onlineToken",resumeToken);return u.toString()}
  function placeOnlinePanel(){
    const setup=document.querySelector("#finalMatchSetup");
    if(!setup)return null;
    if(panel.parentElement!==setup)setup.appendChild(panel);
    return setup;
  }

  function showPanel(){
    // V38: "match" nunca foi uma view válida da nova interface.
    // Isso escondia TODAS as views e deixava somente fundo/tema/versão na tela.
    window.STEAMParty?.showView?.("play");

    const setup=placeOnlinePanel();
    setup?.classList.remove("hidden");
    setup?.classList.add("is-online-v2");
    panel.classList.remove("hidden");

    const profile=window.STEAMParty?.getActiveProfile?.();
    if(profile?.name&&nameInput&&!nameInput.value)nameInput.value=profile.name;

    if(!configured){
      setStatus("Servidor Online público não configurado. Configure SERVER_URL para criar ou entrar em salas pela Internet.");
    }else if(!state){
      setStatus("Crie uma sala ou entre usando um código. Cada jogador abre este mesmo site no próprio dispositivo.");
    }

    setup?.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function hidePanel(){
    panel.classList.add("hidden");
    document.querySelector("#finalMatchSetup")?.classList.remove("is-online-v2");
  }

  function renderLobby(){
    if(!state)return;
    if(state.started&&v2State&&!isHost){renderReplica();return}
    actions.classList.add("hidden"); remote?.classList.add("hidden"); lobby.classList.remove("hidden");
    roomCodeEl.textContent=state.roomCode||roomCode; playersEl.innerHTML="";
    (state.players||[]).forEach((p,i)=>{const el=document.createElement("div");el.className="final-online-v2-player"+(p.connected===false?" is-offline":" ")+(p.sensorActive?" has-sensor":" ");el.innerHTML=`<span class="final-online-v2-avatar" style="--online-color:${p.color||'#45d9ff'}">${i+1}</span><span><strong></strong><small></small></span><span class="final-online-sensor-dot" title="Sensor"></span>`;el.querySelector("strong").textContent=p.name;const sensorText=state.controlMethod==="phone-motion"?(p.sensorActive?"Celular sensor pronto":"Aguardando celular sensor"):"Teclado e mouse";el.querySelector("small").textContent=p.id===state.hostPlayerId?`Host • ${sensorText}`:p.connected===false?"Reconectando…":`Online • ${sensorText}`;playersEl.appendChild(el)});
    isHost=playerId===state.hostPlayerId;
    controlSetup?.classList.toggle("hidden",!isHost);
    if(isHost&&controlSetup){controlSetup.querySelectorAll('input[name="finalOnlineControlMode"]').forEach(r=>r.checked=r.value===(state.controlMethod||"keyboard"))}
    const phoneMode=state.controlMethod==="phone-motion";
    sensorPair?.classList.toggle("hidden",!phoneMode);
    if(phoneMode){const me=(state.players||[]).find(p=>p.id===playerId),url=privateSensorUrl();if(sensorStatus)sensorStatus.textContent=me?.sensorActive?"Sensor ativo e pronto para os minigames.":me?.sensorControllerConnected?"Celular conectado. Ative a permissão de movimento nele.":"Conecte seu próprio celular antes da partida.";if(sensorLinkEl)sensorLinkEl.textContent=url;if(sensorQr&&url)sensorQr.src=`${configured}/api/qr?text=${encodeURIComponent(url)}`;if(sensorOpen)sensorOpen.dataset.url=url}
    const sensorReady=!phoneMode||(state.players||[]).every(p=>p.sensorActive);
    startBtn.classList.toggle("hidden",!isHost); startBtn.disabled=!isHost||(state.players?.length||0)<2||!sensorReady;
    if(inviteBox){inviteBox.textContent=isHost?inviteUrl():`Sala ${roomCode}`;inviteBox.classList.toggle("hidden",!isHost)}
    copyInvite?.classList.toggle("hidden",!isHost);
    setStatus(isHost?((state.players?.length||0)<2?"Compartilhe o link da sala. Cada jogador entra pela Internet.":phoneMode&&!sensorReady?"Modo sensores: todos os jogadores precisam conectar e ativar o próprio celular.":"Pronto. Todos jogarão no próprio navegador."):phoneMode&&!sensorReady?"Conecte seu celular de movimento abaixo e ative os sensores.":"Aguarde o host iniciar a partida.");
  }

  function ensureSpaces(){
    if(!spacesLayer||spacesLayer.children.length)return;
    path.forEach((pt,i)=>{const type=spaceTypes[i%spaceTypes.length],el=document.createElement("div");el.className="final-board-space";el.dataset.index=i;el.dataset.type=type;el.style.left=`${pt.x}%`;el.style.top=`${pt.y}%`;el.innerHTML=`<span>${type==="start"?"INÍCIO":symbols[type]}</span>`;spacesLayer.appendChild(el)});
  }
  function renderReplicaPlayers(){
    if(!playersList)return; playersList.innerHTML="";
    const current=v2State?.currentPlayerId;
    (v2State?.players||[]).forEach((p,i)=>{const row=document.createElement("div");row.className=`final-board-player${p.id===current?" is-turn":""}${p.id===playerId?" is-me":""}`;row.innerHTML=`<span class="final-board-player-avatar">${avatar(p)}</span><span><strong></strong><small></small></span><span class="final-board-player-score"><b>${Math.round(Number(p.score||0))}</b><span>PTS</span></span>`;row.querySelector("strong").textContent=p.name;row.querySelector("small").textContent=p.bot?`Bot • ${p.difficulty||"Normal"}`:p.id===playerId?"Você • Online":"Jogador Online";playersList.appendChild(row)});
  }
  function renderReplicaTokens(){
    if(!tokensLayer)return; tokensLayer.innerHTML="";
    (v2State?.players||[]).forEach((p,i)=>{const pt=path[Math.max(0,Math.min(path.length-1,Number(p.position||0)))]||path[0];const t=document.createElement("div");t.className="final-board-token";t.dataset.playerId=p.id;t.dataset.slot=String(p.slot||i+1);t.style.left=`${pt.x}%`;t.style.top=`${pt.y}%`;t.innerHTML=avatar(p);tokensLayer.appendChild(t)});
  }
  function showBoardReplica(){
    document.getElementById("finalShell")?.classList.remove("hidden"); document.body.classList.add("final-shell-v1");
    document.querySelectorAll("#finalShell .final-view").forEach(v=>v.classList.toggle("hidden",v!==boardView)); boardView?.classList.remove("hidden");
    if(boardView)boardView.dataset.onlineReplica="1";
  }
  function formatAnswer(v,unit){const n=Number(v),s=Number.isInteger(n)?String(n):String(Math.round(n*10)/10);return unit==="°"?`${s}°`:`${s} ${unit||""}`.trim()}
  function clearReplicaTimer(){clearInterval(timer);timer=0}
  function renderReplicaMinigame(){
    clearReplicaTimer(); if(!v2State)return;
    const phase=v2State.phase,mg=v2State.minigame;
    if(phase==="board"){minigameOverlay?.classList.add("hidden");matchResultOverlay?.classList.add("hidden");return}
    if(phase==="match-result"){minigameOverlay?.classList.add("hidden");matchResultOverlay?.classList.remove("hidden");if(matchRanking){matchRanking.innerHTML="";[...(v2State.players||[])].sort((a,b)=>Number(b.score||0)-Number(a.score||0)).forEach((p,i)=>{const r=document.createElement("div");r.className="final-ranking-row";r.innerHTML=`<b>${i+1}º</b><span><strong></strong><small></small></span><span><strong>${Math.round(Number(p.score||0))} pts</strong></span>`;r.querySelector("strong").textContent=p.name;r.querySelector("small").textContent=p.id===playerId?"Você":"Online";matchRanking.appendChild(r)})}return}
    matchResultOverlay?.classList.add("hidden"); minigameOverlay?.classList.remove("hidden");
    if(phase==="minigame-intro"){minigameIntro?.classList.remove("hidden");droneGame?.classList.add("hidden");motionGame?.classList.add("hidden");minigameResult?.classList.add("hidden");if(minigameTitle)minigameTitle.textContent=mg?.title||"Minigame";if(minigameDescription)minigameDescription.textContent="Aguardando o host iniciar. Você joga nesta própria tela.";startMinigame?.classList.add("hidden");return}
    startMinigame?.classList.remove("hidden");
    if(phase==="minigame"&&mg?.id==="flood-escape"&&mg?.problem){
      minigameIntro?.classList.add("hidden");droneGame?.classList.add("hidden");minigameResult?.classList.add("hidden");motionGame?.classList.remove("hidden");
      const progress=Array.isArray(mg.problem.progress)?mg.problem.progress:[];if(motionLanes){motionLanes.innerHTML="";progress.forEach(entry=>{const pct=Math.max(0,Math.min(100,Number(entry.progress||0))),row=document.createElement("div");row.className="final-motion-lane";row.innerHTML=`<div class="final-motion-lane-label"><strong></strong><span>${Math.round(pct)}%</span></div><div class="final-motion-track"><div class="final-motion-water"></div><div class="final-motion-safe">ABRIGO</div><div class="final-motion-runner">●</div><div class="final-motion-progress"></div></div>`;row.querySelector("strong").textContent=entry.name||"Jogador";row.querySelector(".final-motion-runner").style.left=`calc(${pct}% - 12px)`;row.querySelector(".final-motion-progress").style.width=`${pct}%`;motionLanes.appendChild(row)})}
      const tick=()=>{const left=Math.max(0,Number(mg.problem.deadlineServerMs||0)-Date.now());if(motionTimer)motionTimer.textContent=`Tempo: ${(left/1000).toFixed(1)} s`;const danger=Math.max(0,Math.min(100,(1-left/12000)*100));if(motionWave)motionWave.style.width=`${Math.min(86,danger*.72)}%`};tick();timer=setInterval(tick,100);return;
    }
    if(phase==="minigame"&&mg?.problem){
      minigameIntro?.classList.add("hidden");motionGame?.classList.add("hidden");minigameResult?.classList.add("hidden");droneGame?.classList.remove("hidden");
      if(eduTopic)eduTopic.textContent=mg.problem.topic||mg.title||"Desafio STEAM";if(droneQuestion)droneQuestion.textContent=mg.problem.question||"Responda";if(droneAnswers){droneAnswers.innerHTML="";(mg.problem.answers||[]).forEach(v=>{const b=document.createElement("button");b.className="final-drone-answer";b.textContent=formatAnswer(v,mg.problem.unit);b.onclick=()=>{droneAnswers.querySelectorAll("button").forEach(x=>x.disabled=true);sendAction("minigame-answer",{answer:Number(v),problemToken:mg.problem.token})};droneAnswers.appendChild(b)})}
      const tick=()=>{if(!droneTimer)return;const left=Math.max(0,Number(mg.problem.deadlineServerMs||0)-Date.now());droneTimer.textContent=`Tempo: ${(left/1000).toFixed(1)} s`};tick();timer=setInterval(tick,100);return;
    }
    if(phase==="minigame-result"){
      minigameIntro?.classList.add("hidden");droneGame?.classList.add("hidden");motionGame?.classList.add("hidden");minigameResult?.classList.remove("hidden");returnBoard?.classList.add("hidden");
      const results=mg?.results||[];if(minigameWinner)minigameWinner.textContent=results[0]?.name?`${results[0].name} venceu!`:"Resultado";if(minigameRanking){minigameRanking.innerHTML="";results.forEach((e,i)=>{const r=document.createElement("div");r.className="final-ranking-row";r.innerHTML=`<b>${e.place||i+1}º</b><span><strong></strong><small></small></span><span>${e.correct?"✓":"×"}</span>`;r.querySelector("strong").textContent=e.name||"Jogador";r.querySelector("small").textContent=e.correct?(e.timeMs?`${(Number(e.timeMs)/1000).toFixed(1)} s`:"Concluído"):"Errou";minigameRanking.appendChild(r)})}return;
    }
  }
  function renderReplica(){
    if(!v2State||isHost)return; showBoardReplica(); ensureSpaces(); renderReplicaPlayers(); renderReplicaTokens();
    const me=(v2State.players||[]).find(p=>p.id===playerId),current=(v2State.players||[]).find(p=>p.id===v2State.currentPlayerId),myTurn=v2State.currentPlayerId===playerId&&v2State.phase==="board";
    if(roundText)roundText.textContent=`Rodada ${v2State.round} / ${v2State.totalRounds}`;if(modeBadge)modeBadge.textContent=`Online • ${roomCode}`;if(turnName)turnName.textContent=current?.name||"Aguardando";if(turnAvatar)turnAvatar.innerHTML=current?avatar(current):"";if(eventBox)eventBox.textContent=v2State.eventText||"Partida Online sincronizada.";
    if(instruction)instruction.textContent=myTurn?"Sua vez — role o dado neste dispositivo.":current?`Vez de ${current.name}. O tabuleiro continuará sincronizado aqui.`:"Sincronizando partida…";
    if(rollButton){rollButton.disabled=!myTurn;rollButton.textContent=myTurn?"Rolar dado":"Aguardando…"}if(diceResult)diceResult.textContent="";
    renderReplicaMinigame();
  }

  function sendAction(type,data={}){return new Promise((resolve,reject)=>{if(!socket||!roomCode){reject(new Error("Sala desconectada."));return}socket.timeout(6500).emit("online:v2-action",{roomCode,type,...data,clientTime:Date.now()},(err,res)=>{if(err)reject(new Error("Servidor não respondeu."));else if(!res?.ok)reject(new Error(res?.message||"Ação recusada."));else resolve(res)})})}
  async function resumeCurrentSession(showErrors=true){if(resuming||!roomCode||!playerId||!resumeToken)return false;resuming=true;try{const r=await ack("online:resume",{roomCode,playerId,resumeToken});state=r.state;isHost=playerId===state.hostPlayerId;v2State=r.onlineV2State||v2State;saveSession();if(state.started&&v2State&&!isHost)renderReplica();else renderLobby();return true}catch(e){if(showErrors)setStatus(e.message);if(e.invalidSession)clearSession();return false}finally{resuming=false}}
  function reset(message=""){clearReplicaTimer();roomCode="";playerId="";resumeToken="";state=null;v2State=null;isHost=false;clearSession();boardView?.removeAttribute("data-online-replica");lobby.classList.add("hidden");remote?.classList.add("hidden");actions.classList.remove("hidden");if(message)window.STEAMParty?.showToast?.(message)}

  createBtn?.addEventListener("click",async()=>{try{const r=await ack("online:create-room",{name:(nameInput.value||"Jogador").trim()});roomCode=r.roomCode;playerId=r.playerId;resumeToken=r.resumeToken;state=r.state;isHost=true;saveSession();renderLobby()}catch(e){setStatus(e.message)}});
  showJoin?.addEventListener("click",()=>joinRow.classList.toggle("hidden")); codeInput?.addEventListener("input",()=>codeInput.value=normalize(codeInput.value));
  joinBtn?.addEventListener("click",async()=>{try{const r=await ack("online:join-room",{roomCode:normalize(codeInput.value),name:(nameInput.value||"Jogador").trim()});roomCode=r.roomCode;playerId=r.playerId;resumeToken=r.resumeToken;state=r.state;isHost=false;saveSession();renderLobby()}catch(e){setStatus(e.message)}});
  startBtn?.addEventListener("click",async()=>{if(!isHost||!state)return;const config=buildConfig();const initial={phase:"board",round:1,totalRounds:Number(config.rounds||5),currentPlayerId:state.players[0]?.id||"",eventText:"Partida Online iniciada.",players:state.players.map((p,i)=>({id:p.id,slot:i+1,name:p.name,human:true,bot:false,difficulty:"",position:0,score:0,laps:0,avatarShape:["round","square","triangle","hex"][i%4],avatarColor:["cyan","green","orange","pink"][i%4],avatarFace:"smile"})),minigame:null};try{await ack("online:v2-start",{roomCode,config,state:initial})}catch(e){setStatus(e.message)}});
  leaveBtn?.addEventListener("click",()=>{if(socket&&roomCode)socket.emit("online:leave-room",{roomCode},()=>{});reset()});
  rollButton?.addEventListener("click",async()=>{if(boardView?.dataset.onlineReplica!=="1")return;if(v2State?.phase!=="board"||v2State.currentPlayerId!==playerId)return;rollButton.disabled=true;rollButton.textContent="Enviando…";try{await sendAction("roll")}catch(e){rollButton.disabled=false;rollButton.textContent="Rolar dado";if(instruction)instruction.textContent=e.message||"Não foi possível rolar o dado."}});
  controlSetup?.addEventListener("change",async e=>{const input=e.target.closest('input[name="finalOnlineControlMode"]');if(!input||!isHost)return;try{await ack("online:v2-control-mode",{roomCode,controlMethod:input.value})}catch(err){setStatus(err.message)}});
  sensorOpen?.addEventListener("click",()=>{const url=sensorOpen.dataset.url||privateSensorUrl();if(url)window.open(url,"_blank","noopener")});
  sensorCopy?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(privateSensorUrl());window.STEAMParty?.showToast?.("Link do sensor copiado.")}catch{}});
  copyInvite?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(inviteUrl());window.STEAMParty?.showToast?.("Link Online copiado.")}catch{}});
  document.querySelector('[data-match-mode="online"]')?.addEventListener("click",()=>showPanel());
  document.querySelectorAll('[data-match-mode="local"],[data-match-mode="phones"]').forEach(btn=>{
    btn.addEventListener("click",()=>hidePanel());
  });

  // Captura antes do listener antigo do shell e impede qualquer queda no protótipo legado.
  document.querySelector("#finalContinuePrototype")?.addEventListener("click",e=>{
    if(!selectedOnline())return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    showPanel();
  },true);

  window.STEAMOnlineV2=Object.freeze({
    open:showPanel,
    close:hidePanel,
    publishState(next){
      if(!isHost||!socket||!roomCode)return;
      v2State=next;
      socket.emit("online:v2-state",{roomCode,state:next},()=>{});
    },
    sendAction,
    getRoomCode:()=>roomCode,
    getPlayerId:()=>playerId,
    isHost:()=>isHost,
    getControlMethod:()=>state?.controlMethod||"keyboard"
  });

  // Link de convite: cada pessoa abre o MESMO site, mesmo estando em outra rede.
  const queryCode=normalize(new URLSearchParams(location.search).get("onlineRoom"));
  if(queryCode){codeInput.value=queryCode;joinRow.classList.remove("hidden");showPanel();setStatus("Sala recebida pelo link. Digite seu nome e toque em Entrar.")}
  const saved=readSession();
  if(saved?.roomCode&&saved?.playerId&&saved?.resumeToken){roomCode=normalize(saved.roomCode);playerId=String(saved.playerId);resumeToken=String(saved.resumeToken);if(saved.name&&nameInput&&!nameInput.value)nameInput.value=saved.name;void connect().then(()=>resumeCurrentSession(false)).catch(()=>{})}
})();
