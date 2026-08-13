(() => {
  "use strict";
  const bridge=window.STEAMPartyControllerBridge;if(!bridge)return;
  const $=s=>document.querySelector(s);
  const panel=$("#finalPartyControllerPanel"),legacy=$("#boardControllerArea"),sensor=$("#sensorModePanel"),round=$("#finalPartyPhoneRound"),score=$("#finalPartyPhoneScore"),kicker=$("#finalPartyPhoneKicker"),title=$("#finalPartyPhoneTitle"),description=$("#finalPartyPhoneDescription"),dice=$("#finalPartyPhoneDice"),roll=$("#finalPartyPhoneRoll"),items=$("#finalPartyPhoneItems"),sensorButton=$("#finalPartyPhoneEnableSensors"),game=$("#finalPartyPhoneBoard"),mini=$("#finalPartyPhoneMinigame"),miniTopic=$("#finalPartyPhoneMiniTopic"),miniTitle=$("#finalPartyPhoneMiniTitle"),question=$("#finalPartyPhoneQuestion"),answers=$("#finalPartyPhoneAnswers"),timer=$("#finalPartyPhoneTimer"),result=$("#finalPartyPhoneResult"),resultTitle=$("#finalPartyPhoneResultTitle"),ranking=$("#finalPartyPhoneRanking"),controlScreen=$("#controlScreen"),connection=$("#connectionBadge"),orientationGate=$("#finalControllerOrientationGate"),orientationTitle=$("#finalOrientationTitle"),orientationText=$("#finalOrientationText"),fullscreenBtn=$("#finalEnterFullscreen");
  const socket=bridge.getSocket();
  let transport=bridge.getTransportMode?.()||"party",gameState=null,lobbyState=null,activeProblemToken="",answeredToken="",timerId=0,danceMode=false;
  const myId=()=>bridge.getPlayerId(),room=()=>bridge.getRoomCode();
  const me=()=>gameState?.players?.find(p=>String(p.id)===String(myId()))||null;

  function portraitOnly(){
    document.body.classList.add("controller-portrait-only");
    const landscape=window.matchMedia?.("(orientation: landscape)")?.matches||window.innerWidth>window.innerHeight;
    orientationGate?.classList.toggle("hidden",!landscape);
    if(orientationTitle)orientationTitle.textContent="Coloque o celular em pé";
    if(orientationText)orientationText.textContent="Este controle usa o modo retrato. O modo deitado será usado somente em minigames que realmente precisarem.";
    if(!landscape){
      try{screen.orientation?.lock?.("portrait").catch?.(()=>{})}catch{}
    }
  }
  function requestPortrait(){
    portraitOnly();
    try{screen.orientation?.lock?.("portrait").catch?.(()=>{})}catch{}
  }
  window.addEventListener("resize",portraitOnly);
  window.addEventListener("orientationchange",portraitOnly);
  fullscreenBtn?.addEventListener("click",async()=>{
    try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.()}catch{}
    requestPortrait();
  });
  document.addEventListener("pointerdown",()=>{requestPortrait()},{once:true});
  portraitOnly();
  function stopTimer(){clearInterval(timerId);timerId=0}
  function ui(active=true){panel?.classList.toggle("hidden",!active);legacy?.classList.add("hidden");if(active){sensor?.classList.add("hidden");controlScreen?.classList.remove("sensor-mode-active")}}
  function send(type,data={}){if(!socket||!room())return Promise.reject(new Error("Controle desconectado."));const event=transport==="online"?"online:controller-action":"controller:party-action";return new Promise((resolve,reject)=>socket.timeout(6500).emit(event,{roomCode:room(),type,...data,clientTime:Date.now()},(err,res)=>{if(err||!res?.ok){const e=new Error(res?.message||"O servidor não respondeu.");reject(e)}else resolve(res)}))}
  function renderItems(){if(!items)return;const mine=me(),inv=Array.isArray(mine?.inventory)?mine.inventory:[];items.innerHTML="";if(!inv.length){items.classList.add("hidden");return}items.classList.remove("hidden");inv.forEach(id=>{const meta={gps:["⌖","GPS","Próximo dado: mínimo 6"],map:["▦","Mapa","Avance 3 casas antes do dado"],rescue:["✚","Resgate","Proteção automática"],sensor:["◉","Alerta","Proteção automática"]}[id]||["◆",id,"Equipamento"];const b=document.createElement("button");b.type="button";b.className="final-party-phone-item";b.innerHTML=`<b>${meta[0]} ${meta[1]}</b><small>${meta[2]}</small>`;const usable=["gps","map"].includes(id)&&gameState?.phase==="board"&&gameState.currentPlayerId===myId();b.disabled=!usable;b.onclick=async()=>{b.disabled=true;try{await send("use-item",{itemId:id})}catch(e){description.textContent=e.message;renderItems()}};items.appendChild(b)})}
  function renderSensorButton(){if(!sensorButton)return;const needs=transport==="online"&&lobbyState?.controlMethod==="phone-motion"&&!bridge.sensorsGranted?.();sensorButton.classList.toggle("hidden",!needs);if(needs){sensorButton.disabled=false;sensorButton.textContent="Ativar sensores do controle"}}
  function renderBoard(){if(danceMode)return;ui(true);game.classList.remove("hidden");mini.classList.add("hidden");result.classList.add("hidden");stopTimer();const mine=me(),current=gameState?.players?.find(p=>p.id===gameState.currentPlayerId),myTurn=gameState?.currentPlayerId===myId();round.textContent=`Rodada ${gameState?.round||1} / ${gameState?.totalRounds||5}`;score.textContent=`${Math.round(mine?.score||0)} PTS`;kicker.textContent=myTurn?"Sua vez":transport==="online"?"Online":"Aguarde";title.textContent=myTurn?"Role o dado":`Vez de ${current?.name||"outro jogador"}`;description.textContent=myTurn?"Este celular é seu controle. Use itens e role o dado aqui.":"Acompanhe a partida na tela principal; o controle será liberado na sua vez.";roll.disabled=!myTurn;roll.classList.toggle("your-turn",myTurn);if(!myTurn)dice.textContent="?";renderItems();renderSensorButton()}
  function renderTimer(deadline){stopTimer();const tick=()=>{const left=Math.max(0,Number(deadline||0)-Date.now());if(timer)timer.textContent=`Tempo: ${(left/1000).toFixed(1)} s`;if(left<=0)stopTimer()};tick();timerId=setInterval(tick,100)}
  function renderMinigame(){if(danceMode)return;ui(true);game.classList.add("hidden");mini.classList.remove("hidden");result.classList.add("hidden");items?.classList.add("hidden");const p=gameState?.minigame?.problem;if(p?.kind==="motion-escape"){if(miniTopic)miniTopic.textContent="Sensor de movimento • Enchente";if(miniTitle)miniTitle.textContent="Fuga da Enchente";question.textContent="CHACOALHE O CELULAR para correr até o abrigo!";answers.innerHTML="";const mine=(p.progress||[]).find(x=>String(x.playerId)===String(myId())),prog=Math.max(0,Math.min(100,Number(mine?.progress||0)));const box=document.createElement("div");box.className="final-party-phone-motion-meter";box.innerHTML=`<div class="final-party-phone-motion-track"><div class="final-party-phone-motion-fill" style="width:${prog}%"></div><span>●</span></div><strong>${Math.round(prog)}%</strong>`;if(!bridge.sensorsGranted?.()){const b=document.createElement("button");b.className="final-primary";b.textContent="Ativar sensores";b.onclick=async()=>{b.disabled=true;try{await bridge.requestSensors?.();b.remove()}catch{b.disabled=false}};box.appendChild(b)}answers.appendChild(box);renderTimer(p.deadlineServerMs);return}if(!p){question.textContent="Preparando minigame…";answers.innerHTML="";return}round.textContent=`Rodada ${gameState.round} / ${gameState.totalRounds}`;score.textContent=`${Math.round(me()?.score||0)} PTS`;miniTopic.textContent=`Minigame • ${p.topic||"STEAM"}`;miniTitle.textContent=gameState.minigame?.title||"Desafio";question.textContent=p.question||"Escolha a resposta.";activeProblemToken=p.token||"";answers.innerHTML="";(p.answers||[]).forEach(value=>{const b=document.createElement("button");b.className="final-party-phone-answer";const n=Number(value),shown=Number.isInteger(n)?String(n):String(Math.round(n*10)/10);b.textContent=p.unit==="°"?`${shown}°`:`${shown} ${p.unit||""}`.trim();b.disabled=answeredToken===activeProblemToken;b.onclick=async()=>{if(answeredToken===activeProblemToken)return;answeredToken=activeProblemToken;answers.querySelectorAll("button").forEach(x=>x.disabled=true);b.classList.add("is-selected");try{await send("minigame-answer",{answer:n,problemToken:activeProblemToken})}catch(e){answeredToken="";description.textContent=e.message;answers.querySelectorAll("button").forEach(x=>x.disabled=false)}};answers.appendChild(b)});renderTimer(p.deadlineServerMs)}
  function renderIntro(){ui(true);game.classList.add("hidden");mini.classList.remove("hidden");result.classList.add("hidden");question.textContent="Prepare-se!";answers.innerHTML="";timer.textContent="Aguardando início…";stopTimer()}
  function renderResult(){ui(true);game.classList.add("hidden");mini.classList.add("hidden");result.classList.remove("hidden");items?.classList.add("hidden");stopTimer();const results=gameState?.minigame?.results||[],mineResult=results.find(r=>String(r.playerId)===String(myId()));resultTitle.textContent=mineResult?`${mineResult.place}º lugar`:"Resultado";score.textContent=`${Math.round(me()?.score||0)} PTS`;ranking.innerHTML="";results.forEach(r=>{const row=document.createElement("div");row.className="final-party-phone-rank-row";row.innerHTML=`<strong>${r.place}º ${r.name}</strong><span>${r.correct===false?"×":"✓"}</span>`;ranking.appendChild(row)})}
  function render(){if(!gameState)return;if(danceMode){panel?.classList.add("hidden");return}if(gameState.phase==="board")renderBoard();else if(gameState.phase==="minigame")renderMinigame();else if(gameState.phase==="minigame-intro")renderIntro();else if(gameState.phase==="minigame-result"||gameState.phase==="match-result")renderResult()}
  roll?.addEventListener("click",async()=>{if(!gameState||gameState.currentPlayerId!==myId())return;roll.disabled=true;dice.textContent="…";try{await send("roll")}catch(e){description.textContent=e.message;roll.disabled=false;dice.textContent="?"}});
  sensorButton?.addEventListener("click",async()=>{sensorButton.disabled=true;try{await bridge.requestSensors?.();sensorButton.textContent="Sensores ativos";sensorButton.classList.add("hidden")}catch{sensorButton.disabled=false}});
  window.addEventListener("steam-party-controller-joined",e=>{if(e.detail?.state?.purpose==="party-board-v2"){transport="party";ui(true);kicker.textContent="Party";title.textContent="Controle conectado";description.textContent="Dado, itens, respostas e sensores serão controlados por este celular."}});
  window.addEventListener("steam-online-controller-joined",e=>{transport="online";lobbyState=e.detail?.state||null;gameState=e.detail?.onlineV2State||null;ui(true);if(connection)connection.textContent="Controle Online";kicker.textContent="Online";title.textContent=gameState?"Controle retomado":"Controle completo conectado";description.textContent="Mantenha este celular aberto durante a partida.";renderSensorButton();if(gameState)render()});
  window.addEventListener("phone-dance-session",e=>{
    const reason=String(e.detail?.reason||"");
    if(!["party","online"].includes(transport))return;
    danceMode=reason!=="ended";
    if(danceMode){
      panel?.classList.add("hidden");
      return;
    }
    if(transport==="online"){
      ui(true);
      game?.classList.add("hidden");
      mini?.classList.add("hidden");
      result?.classList.remove("hidden");
      if(resultTitle)resultTitle.textContent="Esperando o restante terminar";
      if(ranking)ranking.innerHTML='<div class="final-party-phone-rank-row"><strong>Seu resultado foi enviado</strong><span>…</span></div>';
      stopTimer();
      return;
    }
    render();
  });
  socket?.on("online:controller-dance-session",payload=>{
    if(transport!=="online"||payload?.roomCode!==room())return;
    bridge.applyDanceSession?.(payload);
  });
  socket?.on("dev:sensor-mode",p=>{if(transport!=="party"||p?.roomCode!==room())return;const motion=p.enabled&&p.purpose==="motion-minigame";danceMode=Boolean(p.enabled&&!motion);if(!danceMode)render()});
  socket?.on("party:started",p=>{if(transport==="party"&&p?.roomCode===room()&&p.state){gameState=p.state;render()}});
  socket?.on("party:state",p=>{if(transport==="party"&&p?.roomCode===room()){gameState=p;render()}});
  socket?.on("online:state",p=>{if(transport!=="online"||p?.roomCode!==room())return;lobbyState=p;renderSensorButton()});
  socket?.on("online:v2-started",p=>{if(transport!=="online"||p?.roomCode!==room())return;gameState=p.state;render()});
  socket?.on("online:v2-state",p=>{if(transport!=="online"||p?.roomCode!==room())return;gameState=p.state;render()});
  socket?.on("online:room-closed",()=>{if(transport==="online"){stopTimer();title.textContent="Sala encerrada";roll.disabled=true}});
})();
