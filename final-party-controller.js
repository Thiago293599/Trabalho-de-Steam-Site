(() => {
  "use strict";
  const bridge=window.STEAMPartyControllerBridge;
  if(!bridge)return;
  const $=s=>document.querySelector(s),panel=$("#finalPartyControllerPanel"),legacy=$("#boardControllerArea"),sensor=$("#sensorModePanel"),round=$("#finalPartyPhoneRound"),score=$("#finalPartyPhoneScore"),kicker=$("#finalPartyPhoneKicker"),title=$("#finalPartyPhoneTitle"),description=$("#finalPartyPhoneDescription"),dice=$("#finalPartyPhoneDice"),roll=$("#finalPartyPhoneRoll"),game=$("#finalPartyPhoneBoard"),mini=$("#finalPartyPhoneMinigame"),question=$("#finalPartyPhoneQuestion"),answers=$("#finalPartyPhoneAnswers"),timer=$("#finalPartyPhoneTimer"),result=$("#finalPartyPhoneResult"),resultTitle=$("#finalPartyPhoneResultTitle"),ranking=$("#finalPartyPhoneRanking"),controlScreen=$("#controlScreen");
  let partyState=null,activeProblemToken="",answeredToken="",timerId=0,danceMode=false;
  const socket=bridge.getSocket();
  const myId=()=>bridge.getPlayerId(),room=()=>bridge.getRoomCode();
  function stopTimer(){clearInterval(timerId);timerId=0}
  function setPartyUi(active){
    if(danceMode){
      panel?.classList.add("hidden");
      legacy?.classList.add("hidden");
      sensor?.classList.remove("hidden");
      controlScreen?.classList.add("sensor-mode-active");
      return;
    }
    panel?.classList.toggle("hidden",!active);
    if(active){legacy?.classList.add("hidden");sensor?.classList.add("hidden");controlScreen?.classList.remove("sensor-mode-active")}
    else legacy?.classList.remove("hidden");
  }
  function me(){return partyState?.players?.find(p=>p.id===myId())||null}
  function renderTimer(deadline){stopTimer();const tick=()=>{const left=Math.max(0,Number(deadline||0)-Date.now());timer.textContent=`Tempo: ${(left/1000).toFixed(1)} s`;if(left<=0)stopTimer()};tick();timerId=setInterval(tick,100)}
  function emit(type,data={}){if(!socket||!room())return;socket.timeout(6000).emit("controller:party-action",{roomCode:room(),type,...data},(err,res)=>{if(err||!res?.ok){description.textContent=res?.message||"O servidor não respondeu.";if(type==="roll")roll.disabled=false}})}
  function renderBoard(){if(danceMode)return;setPartyUi(true);game.classList.remove("hidden");mini.classList.add("hidden");result.classList.add("hidden");stopTimer();const mine=me(),current=partyState.players?.find(p=>p.id===partyState.currentPlayerId),myTurn=partyState.currentPlayerId===myId();round.textContent=`Rodada ${partyState.round} / ${partyState.totalRounds}`;score.textContent=`${Math.round(mine?.score||0)} PTS`;kicker.textContent=myTurn?"Sua vez":"Aguarde";title.textContent=myTurn?"Role o dado":`Vez de ${current?.name||"outro jogador"}`;description.textContent=myTurn?"Toque no botão. O resultado aparecerá no computador.":"Seu controle será liberado automaticamente quando chegar sua vez.";roll.disabled=!myTurn;roll.classList.toggle("your-turn",myTurn);if(!myTurn)dice.textContent="?"}
  function renderMinigame(){if(danceMode)return;setPartyUi(true);game.classList.add("hidden");mini.classList.remove("hidden");result.classList.add("hidden");const p=partyState.minigame?.problem;if(!p){question.textContent="O computador está preparando a pergunta…";answers.innerHTML="";return}round.textContent=`Rodada ${partyState.round} / ${partyState.totalRounds}`;score.textContent=`${Math.round(me()?.score||0)} PTS`;question.textContent=`O drone percorre ${p.a} km e depois ${p.b} km em ruas perpendiculares. Qual é a distância direta?`;activeProblemToken=p.token||"";answers.innerHTML="";(p.answers||[]).forEach(value=>{const b=document.createElement("button");b.type="button";b.className="final-party-phone-answer";b.textContent=`${value} km`;b.disabled=answeredToken===activeProblemToken;b.onclick=()=>{if(answeredToken===activeProblemToken)return;answeredToken=activeProblemToken;answers.querySelectorAll("button").forEach(x=>x.disabled=true);b.classList.add("is-selected");emit("minigame-answer",{answer:Number(value),problemToken:activeProblemToken,clientTime:Date.now()})};answers.appendChild(b)});renderTimer(p.deadlineServerMs)}
  function renderIntro(){if(danceMode)return;setPartyUi(true);game.classList.add("hidden");mini.classList.remove("hidden");result.classList.add("hidden");question.textContent="Prepare-se! O computador vai iniciar o minigame.";answers.innerHTML="";timer.textContent="Aguardando o computador…";stopTimer()}
  function renderResult(){if(danceMode)return;setPartyUi(true);game.classList.add("hidden");mini.classList.add("hidden");result.classList.remove("hidden");stopTimer();const results=partyState.minigame?.results||[],mine=me(),mineResult=results.find(r=>r.playerId===myId());resultTitle.textContent=mineResult?`${mineResult.place}º lugar`:"Resultado da rodada";score.textContent=`${Math.round(mine?.score||0)} PTS`;ranking.innerHTML="";results.forEach(r=>{const row=document.createElement("div");row.className="final-party-phone-rank-row";row.innerHTML=`<strong>${r.place}º ${r.name}</strong><span>${r.correct===false?"×":"✓"}</span>`;ranking.appendChild(row)})}
  function render(){if(!partyState)return;if(danceMode){setPartyUi(false);return}if(partyState.phase==="board")renderBoard();else if(partyState.phase==="minigame")renderMinigame();else if(partyState.phase==="minigame-intro")renderIntro();else if(partyState.phase==="minigame-result")renderResult();else if(partyState.phase==="match-result"){renderResult();resultTitle.textContent="Partida encerrada"}else if(String(partyState.phase).startsWith("just-dance")){panel?.classList.add("hidden")}}
  window.addEventListener("steam-party-controller-joined",e=>{if(e.detail?.state?.purpose==="party-board-v2"){setPartyUi(true);kicker.textContent="Sala conectada";title.textContent=e.detail?.resumed?"Partida retomada":"Espere o computador iniciar";description.textContent=e.detail?.resumed?"Você voltou ao mesmo jogador.":"Você já está conectado ao novo tabuleiro."}});
  window.addEventListener("phone-dance-session",()=>{danceMode=true;setPartyUi(false)});
  socket?.on("dev:sensor-mode",payload=>{if(payload?.roomCode!==room())return;danceMode=Boolean(payload.enabled);setPartyUi(!danceMode);if(!danceMode)render()});
  socket?.on("party:started",payload=>{if(payload?.roomCode===room()&&payload.state){partyState=payload.state;render()}});
  socket?.on("party:state",next=>{if(!next||next.roomCode!==room())return;partyState=next;render()});
  socket?.on("room:closed",payload=>{if(payload?.roomCode!==room())return;stopTimer();danceMode=false;setPartyUi(false)});
  roll?.addEventListener("click",()=>{if(!partyState||partyState.currentPlayerId!==myId())return;roll.disabled=true;dice.textContent="…";emit("roll")});
})();