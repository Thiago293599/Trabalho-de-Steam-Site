(() => {
  "use strict";
  const bridge=window.STEAMPartyControllerBridge;if(!bridge)return;
  const $=s=>document.querySelector(s);
  const panel=$("#finalPartyControllerPanel"),legacy=$("#boardControllerArea"),sensor=$("#sensorModePanel"),round=$("#finalPartyPhoneRound"),score=$("#finalPartyPhoneScore"),kicker=$("#finalPartyPhoneKicker"),title=$("#finalPartyPhoneTitle"),description=$("#finalPartyPhoneDescription"),dice=$("#finalPartyPhoneDice"),roll=$("#finalPartyPhoneRoll"),items=$("#finalPartyPhoneItems"),sensorButton=$("#finalPartyPhoneEnableSensors"),game=$("#finalPartyPhoneBoard"),mini=$("#finalPartyPhoneMinigame"),miniTopic=$("#finalPartyPhoneMiniTopic"),miniTitle=$("#finalPartyPhoneMiniTitle"),question=$("#finalPartyPhoneQuestion"),answers=$("#finalPartyPhoneAnswers"),timer=$("#finalPartyPhoneTimer"),result=$("#finalPartyPhoneResult"),resultTitle=$("#finalPartyPhoneResultTitle"),ranking=$("#finalPartyPhoneRanking"),continueBtn=$("#finalPartyPhoneContinue"),controlScreen=$("#controlScreen"),connection=$("#connectionBadge"),orientationGate=$("#finalControllerOrientationGate"),orientationTitle=$("#finalOrientationTitle"),orientationText=$("#finalOrientationText"),fullscreenBtn=$("#finalEnterFullscreen");
  const socket=bridge.getSocket();
  let transport=bridge.getTransportMode?.()||"party",gameState=null,lobbyState=null,activeProblemToken="",answeredToken="",timerId=0,danceMode=false,lastMotionToken="",lastMotionMilestone=0,lastInventorySnapshot=null;
  const myId=()=>bridge.getPlayerId(),room=()=>bridge.getRoomCode();
  const me=()=>gameState?.players?.find(p=>String(p.id)===String(myId()))||null;

  function readyButtonMarkup(label="Pronto",detail="Preparar movimento e sensores",state="idle"){
    const icon=state==="ready"?"✓":state==="loading"?"…":"✓";
    return `<span class="final-ready-check" aria-hidden="true">${icon}</span><span class="final-ready-copy"><b>${label}</b><small>${detail}</small></span>`;
  }
  function setReadyButton(button,label="Pronto",detail="Preparar movimento e sensores",state="idle",disabled=false){
    if(!button)return;
    button.innerHTML=readyButtonMarkup(label,detail,state);
    button.dataset.readyState=state;
    button.disabled=Boolean(disabled);
  }
  function motionCoach(mechanic="shake"){
    return {
      shake:["↕","Movimente com ritmo"],
      level:["—","Mantenha estável"],
      alternate:["↔","Alterne os lados"],
      lean:["◆","Acompanhe a rota"],
      rotate:["⟳","Gire com controle"]
    }[mechanic]||["●","Siga o movimento"];
  }
  function motionMilestone(token,progress){
    const safeToken=String(token||"motion");
    if(lastMotionToken!==safeToken){lastMotionToken=safeToken;lastMotionMilestone=0}
    const milestone=Math.floor(Math.max(0,Math.min(100,Number(progress||0)))/25);
    if(milestone>lastMotionMilestone){
      lastMotionMilestone=milestone;
      if(milestone>0)try{navigator.vibrate?.(milestone>=4?[35,30,55]:[20])}catch{}
    }
  }

  async function prepareSensors(){
    await bridge.requestSensors?.();
    const deadline=Date.now()+2800;
    while(Date.now()<deadline){
      if(bridge.sensorsReady?.())return true;
      await new Promise(r=>setTimeout(r,120));
    }
    return Boolean(bridge.sensorsReady?.());
  }

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
  function renderItems(){if(!items)return;const mine=me(),inv=Array.isArray(mine?.inventory)?mine.inventory:[];
    const currentKey=inv.slice().sort().join("|");
    if(lastInventorySnapshot!==null){
      const before=lastInventorySnapshot?lastInventorySnapshot.split("|").filter(Boolean):[];
      if(inv.length>before.length)window.EcoAudio?.sfx?.("itemReceived",{cooldown:260});
    }
    lastInventorySnapshot=currentKey;
    items.innerHTML="";if(!inv.length){items.classList.add("hidden");return}items.classList.remove("hidden");inv.forEach(id=>{const meta={gps:["⌖","GPS","Próximo dado: mínimo 6"],map:["▦","Mapa","Avance 3 casas antes do dado"],rescue:["✚","Resgate","Proteção automática"],sensor:["◉","Alerta","Proteção automática"]}[id]||["◆",id,"Equipamento"];const b=document.createElement("button");b.type="button";b.className="final-party-phone-item";b.innerHTML=`<b>${meta[0]} ${meta[1]}</b><small>${meta[2]}</small>`;const usable=["gps","map"].includes(id)&&gameState?.phase==="board"&&gameState.currentPlayerId===myId();b.disabled=!usable;b.onclick=async()=>{b.disabled=true;try{await send("use-item",{itemId:id});window.EcoAudio?.sfx?.("itemUsed",{cooldown:180})}catch(e){description.textContent=e.message;renderItems()}};items.appendChild(b)})}
  function renderSensorButton(){
    if(!sensorButton)return;
    const onlineNeeds=transport==="online"&&lobbyState?.controlMethod==="phone-motion";
    const partyNeeds=transport==="party";
    const needs=(onlineNeeds||partyNeeds)&&!bridge.sensorsGranted?.();
    sensorButton.classList.toggle("hidden",!needs);
    if(needs){
      sensorButton.classList.add("final-controller-ready-button");
      setReadyButton(sensorButton,"Pronto","Prepare o movimento antes do minigame","idle",false);
    }
  }
  function renderBoard(){if(danceMode)return;ui(true);continueBtn?.classList.add("hidden");game.classList.remove("hidden");mini.classList.add("hidden");result.classList.add("hidden");stopTimer();const mine=me(),current=gameState?.players?.find(p=>p.id===gameState.currentPlayerId),myTurn=gameState?.currentPlayerId===myId();round.textContent=`Rodada ${gameState?.round||1} / ${gameState?.totalRounds||5}`;score.textContent=`${Math.round(mine?.score||0)} PTS`;kicker.textContent=myTurn?"Sua vez":transport==="online"?"Online":"Aguarde";title.textContent=myTurn?"Role o dado":`Vez de ${current?.name||"outro jogador"}`;description.textContent=myTurn?"Este celular é seu controle. Use itens e role o dado aqui.":"Acompanhe a partida na tela principal; o controle será liberado na sua vez.";roll.disabled=!myTurn;roll.classList.toggle("your-turn",myTurn);if(!myTurn)dice.textContent="?";renderItems();renderSensorButton()}
  function renderTimer(deadline){stopTimer();const tick=()=>{const left=Math.max(0,Number(deadline||0)-Date.now());if(timer)timer.textContent=`Tempo: ${(left/1000).toFixed(1)} s`;if(left<=0)stopTimer()};tick();timerId=setInterval(tick,100)}
  function renderMinigame(){
    if(danceMode)return;
    ui(true);continueBtn?.classList.add("hidden");game.classList.add("hidden");mini.classList.remove("hidden");result.classList.add("hidden");items?.classList.add("hidden");
    const p=gameState?.minigame?.problem;
    if(String(p?.kind||"").startsWith("motion-")){
      if(miniTopic)miniTopic.textContent=p.topic||"Sensor de movimento";
      if(miniTitle)miniTitle.textContent=gameState.minigame?.title||"Desafio de movimento";
      question.textContent=p.question||"Use os sensores do celular!";
      answers.innerHTML="";
      const mine=(p.progress||[]).find(x=>String(x.playerId)===String(myId()));
      const prog=Math.max(0,Math.min(100,Number(mine?.progress||0)));
      motionMilestone(p.token,prog);

      if(!bridge.sensorsGranted?.()){
        const ready=document.createElement("div");
        ready.className="final-motion-ready-card";
        const [icon,hint]=motionCoach(p.mechanic||"shake");
        ready.innerHTML=`<div class="final-motion-ready-icon">${icon}</div><strong>Prepare o celular</strong><small>${hint}. Toque em Pronto uma única vez para liberar o movimento.</small>`;
        const b=document.createElement("button");
        b.type="button";
        b.className="primary final-controller-ready-button final-motion-ready-button";
        setReadyButton(b,"Pronto","Autorizar e preparar sensores","idle",false);
        b.onclick=async()=>{
          setReadyButton(b,"Preparando…","Autorize o movimento se o navegador pedir","loading",true);
          try{
            const ready=await prepareSensors();
            if(!ready)throw new Error("Sensor sem leitura");
            setReadyButton(b,"Pronto ✓","Movimento preparado","ready",true);
            try{navigator.vibrate?.(25)}catch{}
            setTimeout(()=>renderMinigame(),320);
          }catch{
            setReadyButton(b,"Tentar novamente","Não foi possível preparar o movimento","retry",false);
          }
        };
        ready.appendChild(b);answers.appendChild(ready);renderTimer(p.deadlineServerMs);return;
      }

      const [icon,hint]=motionCoach(p.mechanic||"shake");
      const box=document.createElement("div");
      box.className=`final-party-phone-motion-meter motion-${p.mechanic||"shake"}`;
      box.innerHTML=`<div class="final-motion-phone-coach"><span>${icon}</span><small>${hint}</small></div><div class="final-party-phone-motion-track"><div class="final-party-phone-motion-fill" style="width:${prog}%"></div><span class="final-motion-runner-dot">●</span></div><strong>${Math.round(prog)}%</strong><small>${p.scenario||"Mova o celular conforme a instrução."}</small>`;
      answers.appendChild(box);renderTimer(p.deadlineServerMs);return;
    }
    if(!p){question.textContent="Preparando minigame…";answers.innerHTML="";return}
    round.textContent=`Rodada ${gameState.round} / ${gameState.totalRounds}`;
    score.textContent=`${Math.round(me()?.score||0)} PTS`;
    miniTopic.textContent=`Minigame • ${p.topic||"STEAM"}`;
    miniTitle.textContent=gameState.minigame?.title||"Desafio";
    question.textContent=p.question||"Escolha a resposta.";
    activeProblemToken=p.token||"";
    answers.innerHTML="";
    (p.answers||[]).forEach(value=>{
      const b=document.createElement("button");b.className="final-party-phone-answer";
      const n=Number(value),shown=Number.isInteger(n)?String(n):String(Math.round(n*10)/10);
      b.textContent=p.unit==="°"?`${shown}°`:`${shown} ${p.unit||""}`.trim();
      b.disabled=answeredToken===activeProblemToken;
      b.onclick=async()=>{
        if(answeredToken===activeProblemToken)return;
        answeredToken=activeProblemToken;answers.querySelectorAll("button").forEach(x=>x.disabled=true);b.classList.add("is-selected");
        try{await send("minigame-answer",{answer:n,problemToken:activeProblemToken})}
        catch(e){answeredToken="";description.textContent=e.message;answers.querySelectorAll("button").forEach(x=>x.disabled=false)}
      };
      answers.appendChild(b)
    });
    renderTimer(p.deadlineServerMs)
  }
  function renderDanceSongSelection(){ui(true);game.classList.add("hidden");mini.classList.remove("hidden");result.classList.add("hidden");items?.classList.add("hidden");stopTimer();const mg=gameState?.minigame||{},songs=Array.isArray(mg.songs)?mg.songs:[],owner=String(mg.selectorPlayerId||""),mine=String(myId()||"");if(miniTopic)miniTopic.textContent="Just Dance";if(miniTitle)miniTitle.textContent="Escolha a música";question.textContent=owner===mine?"Escolha uma música, veja o preview na tela e confirme.":"O jogador responsável está escolhendo a música.";answers.innerHTML="";songs.forEach(song=>{const card=document.createElement("div");card.className=`final-party-phone-song${song.id===mg.selectedSongId?" is-selected":""}`;card.innerHTML=`<img alt=""><div><strong></strong><small></small><div class="final-party-phone-song-actions"></div></div>`;card.querySelector("img").src=song.cover||"";card.querySelector("img").alt=`Capa de ${song.title||"música"}`;card.querySelector("strong").textContent=song.title||"Música";card.querySelector("small").textContent=song.artist||"";const actions=card.querySelector(".final-party-phone-song-actions"),preview=document.createElement("button"),choose=document.createElement("button");preview.type="button";preview.textContent="Ver preview";preview.disabled=owner!==mine;preview.onclick=async()=>{preview.disabled=true;try{await send("jd-song-preview",{songId:song.id})}catch(e){description.textContent=e.message}finally{preview.disabled=false}};choose.type="button";choose.textContent=song.id===mg.selectedSongId?"Selecionada":"Escolher";choose.disabled=owner!==mine;choose.onclick=async()=>{try{await send("jd-song-select",{songId:song.id})}catch(e){description.textContent=e.message}};actions.append(preview,choose);answers.appendChild(card)});if(continueBtn){continueBtn.classList.toggle("hidden",owner!==mine);continueBtn.disabled=owner!==mine||!mg.selectedSongId;continueBtn.dataset.action="jd-song-confirm";continueBtn.textContent="Confirmar música"}if(timer)timer.textContent=owner===mine?"O preview toca na tela principal.":"Aguardando escolha…"}
  function renderIntro(){ui(true);game.classList.add("hidden");mini.classList.remove("hidden");result.classList.add("hidden");question.textContent="Prepare-se!";answers.innerHTML="";timer.textContent="Confirme abaixo para começar.";stopTimer();if(continueBtn){continueBtn.classList.remove("hidden");continueBtn.disabled=false;continueBtn.dataset.action="minigame-start";continueBtn.textContent="Começar minigame"}}
  function renderResult(){ui(true);game.classList.add("hidden");mini.classList.add("hidden");result.classList.remove("hidden");items?.classList.add("hidden");stopTimer();if(continueBtn&&gameState?.phase!=="match-result"){continueBtn.classList.remove("hidden");continueBtn.disabled=false;continueBtn.dataset.action="minigame-continue";continueBtn.textContent="Continuar"}else continueBtn?.classList.add("hidden");const results=gameState?.minigame?.results||[],mineResult=results.find(r=>String(r.playerId)===String(myId()));resultTitle.textContent=mineResult?`${mineResult.place}º lugar`:"Resultado";score.textContent=`${Math.round(me()?.score||0)} PTS`;ranking.innerHTML="";results.forEach(r=>{const row=document.createElement("div");row.className="final-party-phone-rank-row";row.innerHTML=`<strong>${r.place}º ${r.name}</strong><span>${r.correct===false?"×":"✓"}</span>`;ranking.appendChild(row)})}
  function render(){if(!gameState)return;if(danceMode){panel?.classList.add("hidden");return}if(gameState.phase==="board")renderBoard();else if(gameState.phase==="minigame")renderMinigame();else if(gameState.phase==="minigame-intro")renderIntro();else if(gameState.phase==="just-dance-select")renderDanceSongSelection();else if(gameState.phase==="minigame-result"||gameState.phase==="match-result")renderResult()}
  continueBtn?.addEventListener("click",async()=>{
    const type=continueBtn.dataset.action;if(!type)return;continueBtn.disabled=true;const old=continueBtn.textContent;continueBtn.textContent="Enviando…";
    try{await send(type)}catch(e){continueBtn.disabled=false;continueBtn.textContent=old;if(description)description.textContent=e.message}
  });
  roll?.addEventListener("click",async()=>{if(!gameState||gameState.currentPlayerId!==myId())return;roll.disabled=true;dice.textContent="…";try{await send("roll")}catch(e){description.textContent=e.message;roll.disabled=false;dice.textContent="?"}});
  sensorButton?.addEventListener("click",async()=>{
    setReadyButton(sensorButton,"Preparando…","Autorize o movimento se o navegador pedir","loading",true);
    try{
      const ready=await prepareSensors();
      if(!ready)throw new Error("Sensor sem leitura");
      setReadyButton(sensorButton,"Pronto ✓","Movimento preparado","ready",true);
      try{navigator.vibrate?.(25)}catch{}
      setTimeout(()=>sensorButton.classList.add("hidden"),450);
    }catch{
      setReadyButton(sensorButton,"Tentar novamente","Não foi possível preparar o movimento","retry",false);
    }
  });
  window.addEventListener("steam-party-controller-joined",e=>{if(e.detail?.state?.purpose==="party-board-v2"){window.EcoAudio?.sfx?.("playerConnected",{cooldown:500});transport="party";ui(true);kicker.textContent="Party";title.textContent="Controle conectado";description.textContent="Dado, itens, respostas e sensores serão controlados por este celular."}});
  window.addEventListener("steam-online-controller-joined",e=>{window.EcoAudio?.sfx?.("playerConnected",{cooldown:500});transport="online";lobbyState=e.detail?.state||null;gameState=e.detail?.onlineV2State||null;ui(true);if(connection)connection.textContent="Controle Online";kicker.textContent="Online";title.textContent=gameState?"Controle retomado":"Controle completo conectado";description.textContent="Mantenha este celular aberto durante a partida.";renderSensorButton();if(gameState)render()});
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
  socket?.on("online:room-closed",()=>{if(transport==="online"){window.EcoAudio?.sfx?.("playerDisconnected",{cooldown:700});stopTimer();title.textContent="Sala encerrada";roll.disabled=true}});
})();
