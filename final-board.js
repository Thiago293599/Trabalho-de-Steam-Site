(() => {
  "use strict";
  const MATCH_KEY="steamPartyMatchConfigV1",CONFIG=window.STEAM_PARTY_CONFIG||{},BOARD_CONFIG=CONFIG.board||{},SPACE_COUNT=Number(BOARD_CONFIG.spaces||28),MIN_ROLL=Number(BOARD_CONFIG.diceMin||1),MAX_ROLL=Number(BOARD_CONFIG.diceMax||10),MINIGAME_REWARD=Number(BOARD_CONFIG.minigameReward||10);
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const view=$("#finalBoardView"),spacesLayer=$("#finalBoardSpaces"),tokensLayer=$("#finalBoardTokens"),playersList=$("#finalBoardPlayers"),roundText=$("#finalBoardRound"),turnName=$("#finalBoardTurnName"),turnAvatar=$("#finalBoardTurnAvatar"),instruction=$("#finalBoardInstruction"),eventBox=$("#finalBoardEvent"),rollButton=$("#finalRollDice"),diceCube=$("#finalDiceCube"),diceResult=$("#finalDiceResult"),modeBadge=$("#finalBoardModeBadge");
  const minigameOverlay=$("#finalMinigameOverlay"),minigameIntro=$("#finalMinigameIntro"),droneGame=$("#finalDroneGame"),minigameResult=$("#finalMinigameResult"),minigameTitle=$("#finalMinigameTitle"),minigameDescription=$("#finalMinigameDescription"),droneAnswers=$("#finalDroneAnswers"),droneQuestion=$("#finalDroneQuestion"),droneA=$("#finalDroneA"),droneB=$("#finalDroneB"),droneTimer=$("#finalDroneTimer"),minigameWinner=$("#finalMinigameWinner"),minigameRanking=$("#finalMinigameRanking"),matchResultOverlay=$("#finalMatchResultOverlay"),matchRanking=$("#finalMatchRanking");
  const partyLobby=$("#finalPartyLobbyOverlay"),partyRoomCode=$("#finalPartyRoomCode"),partyQr=$("#finalPartyQr"),partyJoinUrl=$("#finalPartyJoinUrl"),partyConnectedCount=$("#finalPartyConnectedCount"),partyConnectedPlayers=$("#finalPartyConnectedPlayers"),partyStart=$("#finalPartyStartMatch"),partyStatus=$("#finalPartyLobbyStatus");
  const network=window.STEAMPartyNetwork||null,danceBridge=window.STEAMJustDanceBridge||null,spaceTypes=["start","good","tech","bad","good","challenge","event","good","bad","tech","good","challenge","bad","event","good","tech","bad","good","challenge","event","good","bad","tech","good","challenge","bad","event","good"],symbols={start:"INÍCIO",good:"+",bad:"−",tech:"T",challenge:"?",event:"!"},colors=["cyan","green","orange","pink","purple","yellow"],shapes=["round","square","triangle","hex"],triples=[[3,4,5],[5,12,13],[6,8,10],[8,15,17],[7,24,25],[9,12,15],[12,16,20]];
  let state=null,rolling=false,roomState=null,droneTimerId=0,droneDeadline=0,currentProblem=null,minigameScores=[],phoneAnswers=new Map(),pendingStartConfig=null;
  const api=()=>window.STEAMParty||{},toast=m=>api().showToast?.(m),sleep=ms=>new Promise(r=>setTimeout(r,ms)),rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const avatar=p=>api().avatarSvg?.(p,true)||`<svg viewBox="0 0 120 120"><rect x="18" y="18" width="84" height="84" rx="34" fill="#65f2c3"/></svg>`;
  const isPhoneMatch=match=>Boolean(match&&(match.mode==="phones"||String(match.controlMethod||"").startsWith("phone-")));
  const path=(()=>{const p=[];for(let x=10;x<=90;x+=80/7)p.push({x,y:10});for(let y=21.5;y<=78.5;y+=57/5)p.push({x:90,y});for(let x=90;x>=10;x-=80/7)p.push({x,y:90});for(let y=78.5;y>=21.5;y-=57/5)p.push({x:10,y});return p.slice(0,SPACE_COUNT)})();
  const difficulty=v=>({easy:"Fácil",normal:"Normal",hard:"Difícil"}[v]||"Normal");
  function renderSpaces(){spacesLayer.innerHTML="";path.forEach((pt,i)=>{const type=spaceTypes[i%spaceTypes.length],el=document.createElement("div");el.className="final-board-space";el.dataset.index=i;el.dataset.type=type;el.style.left=`${pt.x}%`;el.style.top=`${pt.y}%`;el.innerHTML=`<span>${type==="start"?"INÍCIO":symbols[type]}</span>`;spacesLayer.appendChild(el)})}
  function playerFromController(ctrl,slot){return{slot,id:ctrl.id,human:true,bot:false,name:ctrl.name||`Jogador ${slot}`,avatarShape:shapes[(slot-1)%shapes.length],avatarColor:colors[(slot-1)%colors.length],avatarFace:"smile",difficulty:"",position:0,laps:0,score:0}}
  function playerLocal(slot,profile){return{slot,id:`local-${slot}`,human:true,bot:false,name:profile?.name||`Jogador ${slot}`,avatarShape:profile?.avatarShape||shapes[(slot-1)%shapes.length],avatarColor:profile?.avatarColor||colors[(slot-1)%colors.length],avatarFace:profile?.avatarFace||"smile",difficulty:"",position:0,laps:0,score:0}}
  function botPlayer(slot,diff="normal"){return{slot,id:`bot-${slot}`,human:false,bot:true,name:`Bot ${slot}`,avatarShape:shapes[(slot-1)%shapes.length],avatarColor:colors[(slot-1)%colors.length],avatarFace:"focus",difficulty:diff,position:0,laps:0,score:0}}
  function buildPlayers(match,controllers=[]){const humans=Math.max(1,Math.min(4,Number(match.humanPlayers||1))),players=[],active=api().getActiveProfile?.()||null;for(let i=1;i<=humans;i++)players.push(controllers[i-1]?playerFromController(controllers[i-1],i):playerLocal(i,i===1?active:null));for(let i=humans+1;i<=4;i++)players.push(botPlayer(i,match.bots?.[i-humans-1]?.difficulty||"normal"));return players}
  function renderPlayers(){playersList.innerHTML="";state.players.forEach((p,i)=>{const row=document.createElement("div");row.className=`final-board-player${i===state.turnIndex?" is-turn":""}`;row.innerHTML=`<span class="final-board-player-avatar">${avatar(p)}</span><span><strong></strong><small></small></span><span class="final-board-player-score"><b>${p.score}</b><span>PTS</span></span>`;$("strong",row).textContent=p.name;$("small",row).textContent=p.bot?`Bot • ${difficulty(p.difficulty)}`:"Humano";playersList.appendChild(row)})}
  function renderTokens(){tokensLayer.innerHTML="";state.players.forEach(p=>{const pt=path[p.position]||path[0],t=document.createElement("div");t.className="final-board-token";t.dataset.playerId=p.id;t.dataset.slot=p.slot;t.style.left=`${pt.x}%`;t.style.top=`${pt.y}%`;t.innerHTML=avatar(p);tokensLayer.appendChild(t)})}
  function updateToken(p){const t=$(`[data-player-id="${CSS.escape(p.id)}"]`,tokensLayer),pt=path[p.position]||path[0];if(t&&pt){t.style.left=`${pt.x}%`;t.style.top=`${pt.y}%`}}
  function partyState(phase="board",extra={}){if(!state)return{};return{phase,round:state.round,totalRounds:state.totalRounds,currentPlayerId:state.players[state.turnIndex]?.id||"",eventText:eventBox.textContent||"",players:state.players.map(p=>({id:p.id,name:p.name,human:p.human,bot:p.bot,difficulty:p.difficulty,position:p.position,score:p.score,laps:p.laps})),...extra}}
  function publish(phase="board",extra={}){if(state?.connected)network?.publishState(partyState(phase,extra))}
  function updateTurnUi(){const p=state.players[state.turnIndex];roundText.textContent=`Rodada ${state.round} / ${state.totalRounds}`;turnName.textContent=p.name;turnAvatar.innerHTML=avatar(p);renderPlayers();const phoneHuman=state.connected&&p.human;rollButton.disabled=rolling||p.bot||phoneHuman;rollButton.textContent=p.bot?"Bot jogando…":phoneHuman?"Use o celular":"Rolar dado";instruction.textContent=p.bot?`${p.name} está preparando a jogada.`:phoneHuman?`Aguardando ${p.name} rolar o dado no celular.`:"Role o dado para continuar.";instruction.classList.toggle("final-party-phone-wait",phoneHuman);diceResult.textContent="";publish("board");if(p.bot&&!rolling)setTimeout(()=>rollForCurrentPlayer("bot"),650)}
  function updateDice(result=null){$$(".face",diceCube).forEach((f,i)=>f.textContent=String(i===0&&result?result:rand(MIN_ROLL,MAX_ROLL)))}
  async function animateDice(result){diceCube.classList.add("rolling");const timer=setInterval(()=>updateDice(),72);await sleep(800);clearInterval(timer);diceCube.classList.remove("rolling");updateDice(result);diceCube.style.transform=`rotateX(${rand(1,3)*360-18}deg) rotateY(${rand(1,3)*360+28}deg)`;diceResult.textContent=`Saiu ${result}!`;await sleep(360)}
  async function movePlayer(p,steps){for(let i=0;i<steps;i++){const prev=p.position;p.position=(p.position+1)%SPACE_COUNT;if(p.position<prev){p.laps++;p.score+=3;eventBox.textContent=`${p.name} completou uma volta e ganhou +3 Pontos de Missão.`}updateToken(p);publish("board");await sleep(180)}}
  function resolveSpace(p){const type=spaceTypes[p.position%spaceTypes.length],events={start:()=>`${p.name} passou pela Central de Monitoramento.`,good:()=>{p.score+=3;return`Boa decisão de prevenção! ${p.name} ganhou +3 Pontos de Missão.`},bad:()=>{p.score=Math.max(0,p.score-2);return`Um imprevisto ambiental atrasou a missão. ${p.name} perdeu 2 pontos.`},tech:()=>{p.score+=4;return`Tecnologia de monitoramento encontrada! ${p.name} ganhou +4 pontos.`},challenge:()=>{p.score+=2;return`Casa de desafio! ${p.name} recebeu +2 pontos nesta versão Alpha.`},event:()=>{const d=Math.random()<.5?5:-3;p.score=Math.max(0,p.score+d);return d>0?`Evento de resgate bem-sucedido: +${d} pontos para ${p.name}.`:`Evento inesperado: ${p.name} perdeu ${Math.abs(d)} pontos.`}};eventBox.textContent=(events[type]||events.good)();renderPlayers();publish("board")}
  async function rollForCurrentPlayer(source="pc"){if(!state||rolling)return;const p=state.players[state.turnIndex];if(state.connected&&p.human&&source!=="phone")return;rolling=true;rollButton.disabled=true;const result=rand(MIN_ROLL,MAX_ROLL);await animateDice(result);await movePlayer(p,result);resolveSpace(p);await sleep(p.bot?700:950);rolling=false;nextTurn()}
  function nextTurn(){state.turnIndex++;if(state.turnIndex>=state.players.length){state.turnIndex=0;endRound();return}updateTurnUi()}
  function endRound(){if(state.match.minigamesEnabled){openMinigame();return}advanceRound()}
  function advanceRound(){if(state.round>=state.totalRounds){finishMatch();return}state.round++;eventBox.textContent=`Rodada ${state.round}. Todos voltam a jogar na mesma ordem.`;updateTurnUi()}
  function compatibleMinigames(){
    const games=[
      {id:"drone-route",title:"Rota do Drone",description:"Calcule a rota direta do drone usando o Teorema de Pitágoras.",sensorRequired:false},
      {id:"just-dance",title:"Just Dance",description:"Use o celular em pé e acompanhe a coreografia. O próprio celular calcula seus julgamentos.",sensorRequired:true}
    ];
    return games.filter(g=>{
      if(g.sensorRequired&&!state.match.motionMinigamesEnabled)return false;
      if(g.id==="just-dance"&&(!state.connected||!danceBridge))return false;
      return true;
    });
  }
  function openMinigame(){const games=compatibleMinigames();if(!games.length){advanceRound();return}const g=games[rand(0,games.length-1)];state.currentMinigame=g;minigameTitle.textContent=g.title;minigameDescription.textContent=g.description;minigameIntro.classList.remove("hidden");droneGame.classList.add("hidden");minigameResult.classList.add("hidden");minigameOverlay.classList.remove("hidden");publish("minigame-intro",{minigame:{id:g.id,title:g.title,status:"intro"}})}
  function makeProblem(){const[a,b,c]=triples[rand(0,triples.length-1)],wrong=new Set;while(wrong.size<3){const x=Math.max(1,c+rand(-5,6));if(x!==c)wrong.add(x)}return{a,b,c,answers:[c,...wrong].sort(()=>Math.random()-.5),token:`drone-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}}
  function startDroneGame(){minigameIntro.classList.add("hidden");minigameResult.classList.add("hidden");droneGame.classList.remove("hidden");droneGame.dataset.finished="0";currentProblem=makeProblem();minigameScores=[];phoneAnswers=new Map;droneA.textContent=`${currentProblem.a} km`;droneB.textContent=`${currentProblem.b} km`;droneQuestion.textContent=`O drone percorre ${currentProblem.a} km e depois ${currentProblem.b} km em ruas perpendiculares. Qual é a distância direta?`;droneAnswers.innerHTML="";if(!state.connected){currentProblem.answers.forEach(v=>{const b=document.createElement("button");b.type="button";b.className="final-drone-answer";b.textContent=`${v} km`;b.onclick=()=>submitLocalAnswer(v,b);droneAnswers.appendChild(b)})}else{const wait=document.createElement("div");wait.className="final-info-box";wait.textContent="As respostas aparecem nos celulares dos jogadores. O computador mostra o tempo e o resultado.";droneAnswers.appendChild(wait)}droneDeadline=performance.now()+12000;clearInterval(droneTimerId);droneTimerId=setInterval(updateTimer,100);updateTimer();publish("minigame",{minigame:{id:"drone-route",title:"Rota do Drone",status:"playing",problem:{token:currentProblem.token,a:currentProblem.a,b:currentProblem.b,answers:currentProblem.answers,deadlineServerMs:Date.now()+12000}}})}
  function updateTimer(){const left=Math.max(0,droneDeadline-performance.now());droneTimer.textContent=`Tempo: ${(left/1000).toFixed(1)} s`;if(left<=0){clearInterval(droneTimerId);state.connected?finalizeConnectedGame():submitLocalAnswer(null,null)}}
  const botAccuracy=b=>({easy:.45,normal:.70,hard:.90}[b.difficulty]||.70);
  function addBots(){state.players.filter(p=>p.bot).forEach(bot=>{const ok=Math.random()<botAccuracy(bot),base=({easy:8000,normal:5900,hard:4000}[bot.difficulty]||5900),time=Math.max(800,base+rand(-1400,1400));minigameScores.push({player:bot,correct:ok,timeMs:time,performance:ok?10000-time:0})})}
  function submitLocalAnswer(value,button){if(!currentProblem||droneGame.dataset.finished==="1")return;droneGame.dataset.finished="1";clearInterval(droneTimerId);$$(".final-drone-answer",droneAnswers).forEach(b=>b.disabled=true);const correct=value===currentProblem.c;if(button)button.classList.add(correct?"correct":"wrong");$$(".final-drone-answer",droneAnswers).find(b=>b.textContent===`${currentProblem.c} km`)?.classList.add("correct");const reaction=Math.max(250,12000-Math.max(0,droneDeadline-performance.now())),humans=state.players.filter(p=>p.human);humans.forEach((p,i)=>minigameScores.push({player:p,correct:i===0?correct:false,timeMs:i===0?reaction:12000,performance:i===0&&correct?10000-reaction:0}));addBots();setTimeout(showResults,850)}
  function handlePhoneAnswer(action){if(!state?.connected||!currentProblem||action.problemToken!==currentProblem.token||phoneAnswers.has(action.playerId))return;const p=state.players.find(x=>x.id===action.playerId&&x.human);if(!p)return;const correct=Number(action.answer)===currentProblem.c,timeMs=Math.max(200,Math.min(12000,12000-Math.max(0,droneDeadline-performance.now())));phoneAnswers.set(p.id,true);minigameScores.push({player:p,correct,timeMs,performance:correct?10000-timeMs:0});const needed=state.players.filter(x=>x.human).length;if(phoneAnswers.size>=needed)finalizeConnectedGame()}
  function finalizeConnectedGame(){if(!currentProblem||droneGame.dataset.finished==="1")return;droneGame.dataset.finished="1";clearInterval(droneTimerId);state.players.filter(p=>p.human&&!phoneAnswers.has(p.id)).forEach(p=>minigameScores.push({player:p,correct:false,timeMs:12000,performance:0}));addBots();setTimeout(showResults,500)}
  function showResults(){currentProblem=null;droneGame.classList.add("hidden");minigameResult.classList.remove("hidden");minigameScores.sort((a,b)=>b.performance-a.performance||a.timeMs-b.timeMs);const winner=minigameScores.find(e=>e.correct);if(winner?.player){winner.player.score+=MINIGAME_REWARD;minigameWinner.textContent=`${winner.player.name} venceu!`}else minigameWinner.textContent="Ninguém acertou desta vez.";minigameRanking.innerHTML="";const results=[];minigameScores.forEach((e,i)=>{const row=document.createElement("div");row.className="final-ranking-row";row.innerHTML=`<b>${i+1}º</b><span><strong></strong><small></small></span><span>${e.correct?"✓":"×"}</span>`;$("strong",row).textContent=e.player.name;$("small",row).textContent=e.correct?`${(e.timeMs/1000).toFixed(1)} s`:"Errou";minigameRanking.appendChild(row);results.push({playerId:e.player.id,name:e.player.name,correct:e.correct,timeMs:e.timeMs,place:i+1})});renderPlayers();publish("minigame-result",{minigame:{id:"drone-route",title:"Rota do Drone",status:"result",results}})}

  async function startPartyDance(){
    if(!state?.connected||!danceBridge||!network)return;
    // O clique em "Começar" ainda é um gesto do usuário. Tentamos fullscreen
    // imediatamente; se o navegador bloquear, o CSS ainda ocupa 100% da viewport.
    try{
      const target=document.getElementById("danceDevScreen")||document.documentElement;
      if(!document.fullscreenElement&&target?.requestFullscreen)target.requestFullscreen({navigationUI:"hide"}).catch(()=>{});
    }catch{}
    const ids=danceBridge.getSongIds?.()||["RainOverMe"];
    const songId=ids[rand(0,ids.length-1)];
    const info=danceBridge.getSongInfo?.(songId)||{title:"Just Dance",artist:""};
    state.currentDanceSong=info;
    minigameOverlay.classList.add("hidden");
    eventBox.textContent=`Preparando Just Dance: ${info.title}.`;
    publish("just-dance-loading",{minigame:{id:"just-dance",title:info.title,status:"loading"}});
    try{
      await network.setSensorMode(true);
      const prepared=await danceBridge.openPartyDanceSong(songId,network.getRoomCode());
      if(!prepared?.ok)throw new Error(prepared?.message||"Falha ao carregar música.");
      publish("just-dance",{minigame:{id:"just-dance",title:prepared.title,status:"playing"}});
      const playing=await danceBridge.startPartyDancePlayback();
      if(!playing)toast("Se o navegador bloquear o vídeo, toque em ▶ no player do PC.");
    }catch(error){
      try{await network.setSensorMode(false)}catch{}
      danceBridge.closePartyDanceSong?.();
      eventBox.textContent=`Não foi possível iniciar o Just Dance: ${error?.message||error}`;
      minigameOverlay.classList.remove("hidden");
      minigameIntro.classList.remove("hidden");
    }
  }

  async function finishPartyDance(){
    if(!state?.currentMinigame||state.currentMinigame.id!=="just-dance")return;
    try{await network.setSensorMode(false)}catch{}
    danceBridge.closePartyDanceSong?.();
    try{if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});}catch{}

    const scoreRows=[];
    const connectedPlayers=roomState?.players||[];
    state.players.filter(p=>p.human).forEach(player=>{
      const rp=connectedPlayers.find(item=>item.id===player.id);
      const dance=rp?.dance||{};
      scoreRows.push({
        player,
        score:Math.max(0,Number(dance.score||0)),
        stars:Math.max(0,Number(dance.stars||0))
      });
    });

    state.players.filter(p=>p.bot).forEach(bot=>{
      const ranges={easy:[3500,7600],normal:[6200,10400],hard:[8800,12600]};
      const range=ranges[bot.difficulty]||ranges.normal;
      scoreRows.push({player:bot,score:rand(range[0],range[1]),stars:0});
    });

    scoreRows.sort((a,b)=>b.score-a.score);
    const winner=scoreRows[0];
    if(winner?.player)winner.player.score+=MINIGAME_REWARD;

    minigameIntro.classList.add("hidden");
    droneGame.classList.add("hidden");
    minigameResult.classList.remove("hidden");
    minigameWinner.textContent=winner?.player?`${winner.player.name} venceu o Just Dance!`:"Just Dance concluído.";
    minigameRanking.innerHTML="";
    const results=[];
    scoreRows.forEach((entry,index)=>{
      const row=document.createElement("div");
      row.className="final-ranking-row";
      row.innerHTML=`<b>${index+1}º</b><span><strong></strong><small></small></span><span>${Math.round(entry.score).toLocaleString("pt-BR")}</span>`;
      $("strong",row).textContent=entry.player.name;
      $("small",row).textContent=entry.player.bot?`Bot • ${difficulty(entry.player.difficulty)}`:`Score Just Dance`;
      minigameRanking.appendChild(row);
      results.push({playerId:entry.player.id,name:entry.player.name,correct:true,timeMs:0,place:index+1});
    });
    minigameOverlay.classList.remove("hidden");
    renderPlayers();
    publish("minigame-result",{minigame:{id:"just-dance",title:state.currentDanceSong?.title||"Just Dance",status:"result",results}});
  }

  function closeMinigame(){clearInterval(droneTimerId);minigameOverlay.classList.add("hidden");advanceRound()}
  function finishMatch(){matchResultOverlay.classList.remove("hidden");const sorted=[...state.players].sort((a,b)=>b.score-a.score||b.laps-a.laps);matchRanking.innerHTML="";sorted.forEach((p,i)=>{const row=document.createElement("div");row.className="final-ranking-row";row.innerHTML=`<b>${i+1}º</b><span><strong></strong><small></small></span><span><strong>${p.score} pts</strong></span>`;const info=$("span",row);$("strong",info).textContent=p.name;$("small",row).textContent=p.bot?`Bot • ${difficulty(p.difficulty)}`:"Humano";matchRanking.appendChild(row)});publish("match-result",{minigame:null})}
  function renderLobby(){if(!pendingStartConfig||!roomState)return;const expected=Math.max(1,Number(pendingStartConfig.humanPlayers||1)),connected=roomState.players?.length||0;partyConnectedCount.textContent=`${connected} / ${expected}`;partyConnectedPlayers.innerHTML="";(roomState.players||[]).forEach((p,i)=>{const el=document.createElement("div");el.className="final-party-connected-player";el.innerHTML=`<strong></strong><small>Jogador ${i+1} • pronto</small>`;$("strong",el).textContent=p.name;partyConnectedPlayers.appendChild(el)});partyStart.disabled=connected<expected;partyStatus.textContent=connected<expected?`Aguardando ${expected-connected} celular${expected-connected===1?"":"es"}…`:"Todos os jogadores estão conectados."}
  async function startConnectedLobby(match){if(!network){toast("Ponte de rede indisponível.");return false}pendingStartConfig=match;roomState=null;api().showView?.("board");partyLobby.classList.remove("hidden");modeBadge.textContent="Celulares";try{const room=await network.createRoom();partyRoomCode.textContent=room.roomCode;partyJoinUrl.textContent=room.joinUrl;partyQr.src=room.qrUrl;partyStatus.textContent="Sala pronta. Aguardando celulares…";renderLobby();return true}catch(err){partyStatus.textContent=err.message||"Falha ao criar sala.";toast("Não foi possível criar a sala.");return false}}
  async function beginConnectedMatch(){if(!pendingStartConfig||!roomState)return;const expected=Math.max(1,Number(pendingStartConfig.humanPlayers||1));if((roomState.players?.length||0)<expected)return;state={match:pendingStartConfig,players:buildPlayers(pendingStartConfig,roomState.players.slice(0,expected)),round:1,totalRounds:Math.max(1,Number(pendingStartConfig.rounds||BOARD_CONFIG.defaultRounds||5)),turnIndex:0,currentMinigame:null,connected:true};renderSpaces();renderTokens();eventBox.textContent="Partida conectada iniciada. O celular do jogador da vez controla o dado.";partyLobby.classList.add("hidden");await network.startParty(expected,partyState("board"));pendingStartConfig=null;updateTurnUi()}
  function leaveBoard(){clearInterval(droneTimerId);network?.closeRoom();state=null;pendingStartConfig=null;roomState=null;view.classList.add("hidden");partyLobby.classList.add("hidden");minigameOverlay.classList.add("hidden");matchResultOverlay.classList.add("hidden");api().showView?.("main")}
  function start(match=null){const saved=match||JSON.parse(localStorage.getItem(MATCH_KEY)||"{}");if(!saved?.humanPlayers){toast("Configure a partida primeiro.");return false}if(saved.mode==="online"){return false}if(isPhoneMatch(saved)){startConnectedLobby(saved);return true}state={match:saved,players:buildPlayers(saved),round:1,totalRounds:Math.max(1,Number(saved.rounds||BOARD_CONFIG.defaultRounds||5)),turnIndex:0,currentMinigame:null,connected:false};renderSpaces();renderTokens();modeBadge.textContent="Local";eventBox.textContent="Partida iniciada. O dado possui 6 faces visuais e resultados de 1 a 10.";matchResultOverlay.classList.add("hidden");minigameOverlay.classList.add("hidden");api().showView?.("board");updateTurnUi();return true}
  rollButton?.addEventListener("click",()=>rollForCurrentPlayer("pc"));$("#finalStartMinigame")?.addEventListener("click",()=>{
    if(state?.currentMinigame?.id==="drone-route")startDroneGame();
    else if(state?.currentMinigame?.id==="just-dance")startPartyDance();
  });$("#finalReturnBoard")?.addEventListener("click",closeMinigame);$("#finalBoardExit")?.addEventListener("click",leaveBoard);$("#finalMatchBackMenu")?.addEventListener("click",leaveBoard);partyStart?.addEventListener("click",beginConnectedMatch);$("#finalPartyCancelLobby")?.addEventListener("click",leaveBoard);$("#finalPartyCopyLink")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(partyJoinUrl.textContent||"");toast("Link copiado.")}catch{toast("Não foi possível copiar automaticamente.")}});
  window.addEventListener("steam-party-room-state",e=>{const next=e.detail;if(!next||next.purpose!=="party-board-v2")return;roomState=next;renderLobby()});
  window.addEventListener("steam-party-dance-judgement",e=>{danceBridge?.handleJudgement?.(e.detail)});
  window.addEventListener("steam-party-dance-ended",()=>finishPartyDance());
  window.addEventListener("steam-party-presence",e=>{
    const p=state?.players?.find(x=>x.id===e.detail?.playerId);
    if(!p||!state?.connected)return;
    if(e.detail?.connected===false){
      eventBox.textContent=`${p.name} perdeu a conexão. Aguardando até ${Math.round(Number(e.detail?.graceMs||30000)/1000)} s para reconectar.`;
    }
  });
  window.addEventListener("steam-party-player-timeout",e=>{
    if(!state?.connected)return;
    const p=state.players.find(x=>x.id===e.detail?.playerId);
    if(!p||p.bot)return;
    p.human=false;
    p.bot=true;
    p.difficulty="normal";
    p.avatarFace="focus";
    eventBox.textContent=`${p.name} não reconectou a tempo. O jogador foi convertido em Bot Normal para a partida continuar.`;
    renderPlayers();
    publish("board");
    if(state.players[state.turnIndex]?.id===p.id&&!rolling)updateTurnUi();
  });
  window.addEventListener("steam-party-action",e=>{const a=e.detail;if(!state?.connected||!a)return;if(a.type==="roll"&&state.players[state.turnIndex]?.id===a.playerId)rollForCurrentPlayer("phone");if(a.type==="minigame-answer")handlePhoneAnswer(a)});
  window.addEventListener("steam-party-room-closed",()=>{if(state?.connected||pendingStartConfig){toast("A sala conectada foi encerrada.");leaveBoard()}});
  window.STEAMPartyDanceTransport=Object.freeze({
    publishSession: payload => network?.publishDanceSession(payload)
  });
  window.STEAMPartyBoard={start,rollForCurrentPlayer};
})();