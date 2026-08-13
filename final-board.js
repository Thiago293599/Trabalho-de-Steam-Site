(() => {
  "use strict";
  const MATCH_KEY="steamPartyMatchConfigV1",SAVE_KEY="steamPartyBoardAutosaveV1",SAVE_FORMAT="steam-party-save",SAVE_VERSION=1,CONFIG=window.STEAM_PARTY_CONFIG||{},BOARD_CONFIG=CONFIG.board||{},SPACE_COUNT=Number(BOARD_CONFIG.spaces||28),MIN_ROLL=Number(BOARD_CONFIG.diceMin||1),MAX_ROLL=Number(BOARD_CONFIG.diceMax||10),MINIGAME_REWARD=Number(BOARD_CONFIG.minigameReward||10);
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const view=$("#finalBoardView"),spacesLayer=$("#finalBoardSpaces"),tokensLayer=$("#finalBoardTokens"),playersList=$("#finalBoardPlayers"),roundText=$("#finalBoardRound"),turnName=$("#finalBoardTurnName"),turnAvatar=$("#finalBoardTurnAvatar"),instruction=$("#finalBoardInstruction"),eventBox=$("#finalBoardEvent"),rollButton=$("#finalRollDice"),diceCube=$("#finalDiceCube"),diceResult=$("#finalDiceResult"),modeBadge=$("#finalBoardModeBadge");
  const minigameOverlay=$("#finalMinigameOverlay"),minigameIntro=$("#finalMinigameIntro"),droneGame=$("#finalDroneGame"),minigameResult=$("#finalMinigameResult"),minigameTitle=$("#finalMinigameTitle"),minigameDescription=$("#finalMinigameDescription"),droneAnswers=$("#finalDroneAnswers"),droneQuestion=$("#finalDroneQuestion"),droneA=$("#finalDroneA"),droneB=$("#finalDroneB"),droneTimer=$("#finalDroneTimer"),eduVisual=$("#finalEduVisual"),eduTopic=$("#finalEduTopic"),minigameWinner=$("#finalMinigameWinner"),minigameRanking=$("#finalMinigameRanking"),matchResultOverlay=$("#finalMatchResultOverlay"),matchRanking=$("#finalMatchRanking");
  const boardStage=$("#finalBoardStage"),manualSaveButton=$("#finalBoardManualSave"),saveStatus=$("#finalBoardSaveStatus"),
  tutorialOverlay=$("#finalBoardTutorial"),tutorialProgress=$("#finalTutorialProgress"),tutorialIcon=$("#finalTutorialIcon"),tutorialEyebrow=$("#finalTutorialEyebrow"),tutorialTitle=$("#finalTutorialTitle"),tutorialText=$("#finalTutorialText"),tutorialDots=$("#finalTutorialDots"),tutorialNext=$("#finalTutorialNext"),tutorialSkip=$("#finalTutorialSkip"),
  inventoryPanel=$("#finalInventoryPanel"),inventorySlots=$("#finalInventorySlots"),inventoryHint=$("#finalInventoryHint"),
  itemOverlay=$("#finalItemOverlay"),itemIcon=$("#finalItemIcon"),itemEyebrow=$("#finalItemEyebrow"),itemTitle=$("#finalItemTitle"),itemDescription=$("#finalItemDescription"),itemEffect=$("#finalItemEffect"),itemClose=$("#finalItemClose"),
  environmentBanner=$("#finalEnvironmentBanner"),environmentIcon=$("#finalEnvironmentIcon"),environmentTitle=$("#finalEnvironmentTitle"),environmentDescription=$("#finalEnvironmentDescription"),
  educationConcepts=$("#finalEducationConcepts"),educationDisasters=$("#finalEducationDisasters"),educationTechnologies=$("#finalEducationTechnologies"),
  partyLobby=$("#finalPartyLobbyOverlay"),partyRoomCode=$("#finalPartyRoomCode"),partyQr=$("#finalPartyQr"),partyJoinUrl=$("#finalPartyJoinUrl"),partyConnectedCount=$("#finalPartyConnectedCount"),partyConnectedPlayers=$("#finalPartyConnectedPlayers"),partyStart=$("#finalPartyStartMatch"),partyStatus=$("#finalPartyLobbyStatus");
  const network=window.STEAMPartyNetwork||null,danceBridge=window.STEAMJustDanceBridge||null,spaceTypes=["start","good","tech","bad","good","challenge","event","good","bad","tech","good","challenge","bad","event","good","tech","bad","good","challenge","event","good","bad","tech","good","challenge","bad","event","good"],symbols={start:"INÍCIO",good:"+",bad:"−",tech:"T",challenge:"?",event:"!"},colors=["cyan","green","orange","pink","purple","yellow"],shapes=["round","square","triangle","hex"],triples=[[3,4,5],[5,12,13],[6,8,10],[8,15,17],[7,24,25],[9,12,15],[12,16,20]];
  const TUTORIAL_KEY="steamPartyBoardTutorialSeenV1";
  let state=null,rolling=false,roomState=null,droneTimerId=0,droneDeadline=0,currentProblem=null,minigameScores=[],phoneAnswers=new Map(),pendingStartConfig=null,partyDanceBotTimer=0,partyDanceBotEvents=[],partyDanceBotEventCursor=0,tutorialStep=0,environmentBannerTimer=0;
  const api=()=>window.STEAMParty||{},toast=m=>api().showToast?.(m),sleep=ms=>new Promise(r=>setTimeout(r,ms)),rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const avatar=p=>api().avatarSvg?.(p,true)||`<svg viewBox="0 0 120 120"><rect x="18" y="18" width="84" height="84" rx="34" fill="#65f2c3"/></svg>`;
  const isPhoneMatch=match=>Boolean(match&&(match.mode==="phones"||String(match.controlMethod||"").startsWith("phone-")));
  const path=(()=>{const p=[];for(let x=10;x<=90;x+=80/7)p.push({x,y:10});for(let y=21.5;y<=78.5;y+=57/5)p.push({x:90,y});for(let x=90;x>=10;x-=80/7)p.push({x,y:90});for(let y=78.5;y>=21.5;y-=57/5)p.push({x:10,y});return p.slice(0,SPACE_COUNT)})();
  const difficulty=v=>({easy:"Fácil",normal:"Normal",hard:"Difícil"}[v]||"Normal");
  function cleanPlayerForSave(player){
    return {
      slot:Number(player?.slot||1),
      id:String(player?.id||""),
      human:Boolean(player?.human),
      bot:Boolean(player?.bot),
      name:String(player?.name||"Jogador").slice(0,24),
      avatarShape:String(player?.avatarShape||"round"),
      avatarColor:String(player?.avatarColor||"cyan"),
      avatarFace:String(player?.avatarFace||"smile"),
      difficulty:String(player?.difficulty||"normal"),
      position:Math.max(0,Math.min(SPACE_COUNT-1,Number(player?.position||0))),
      laps:Math.max(0,Number(player?.laps||0)),
      score:Math.max(0,Number(player?.score||0)),
      inventory:Array.isArray(player?.inventory)?player.inventory.slice(0,2).map(String):[],
      activeEffects:{
        gps:Boolean(player?.activeEffects?.gps),
        mapBoost:Math.max(0,Math.min(3,Number(player?.activeEffects?.mapBoost||0)))
      }
    };
  }

  function buildSavePayload(phase="board",reason="auto"){
    if(!state||state.connected)return null;
    return {
      format:SAVE_FORMAT,
      version:SAVE_VERSION,
      savedAt:new Date().toISOString(),
      reason:String(reason||"auto"),
      match:{...(state.match||{}),mode:"local"},
      board:{
        phase:String(phase||"board"),
        round:Math.max(1,Number(state.round||1)),
        totalRounds:Math.max(1,Number(state.totalRounds||1)),
        turnIndex:Math.max(0,Math.min(state.players.length-1,Number(state.turnIndex||0))),
        eventText:String(eventBox?.textContent||""),
        currentMinigame:state.currentMinigame?{
          id:String(state.currentMinigame.id||""),
          title:String(state.currentMinigame.title||""),
          description:String(state.currentMinigame.description||"")
        }:null,
        education:{
          concepts:[...(state.education?.concepts||[])],
          disasters:[...(state.education?.disasters||[])],
          technologies:[...(state.education?.technologies||[])]
        },
        roundEvent:state.roundEvent?{id:state.roundEvent.id}:null,
        players:state.players.map(cleanPlayerForSave)
      }
    };
  }

  function updateSaveStatus(text="Salvo"){
    if(!saveStatus)return;
    saveStatus.textContent=text;
    saveStatus.classList.add("is-saved");
    clearTimeout(updateSaveStatus.timer);
    updateSaveStatus.timer=setTimeout(()=>saveStatus?.classList.remove("is-saved"),1200);
  }

  function checkpoint(phase="board",reason="auto"){
    const payload=buildSavePayload(phase,reason);
    if(!payload)return false;
    try{
      localStorage.setItem(SAVE_KEY,JSON.stringify(payload));
      updateSaveStatus(reason==="manual"?"Salvo agora":"Checkpoint salvo");
      window.dispatchEvent(new CustomEvent("steam-party-save-updated",{detail:payload}));
      return true;
    }catch{
      updateSaveStatus("Falha ao salvar");
      return false;
    }
  }

  function clearCheckpoint(){
    try{localStorage.removeItem(SAVE_KEY)}catch{}
    window.dispatchEvent(new CustomEvent("steam-party-save-updated",{detail:null}));
  }

  function validSavePayload(payload){
    return Boolean(
      payload &&
      payload.format===SAVE_FORMAT &&
      Number(payload.version||0)===SAVE_VERSION &&
      payload.match?.mode==="local" &&
      Array.isArray(payload.board?.players) &&
      payload.board.players.length>=1
    );
  }

  function renderRestoredBoardBase(){
    renderSpaces();
    renderTokens();
    modeBadge.textContent="Local • Continuada";
    matchResultOverlay.classList.add("hidden");
    minigameOverlay.classList.add("hidden");
    partyLobby.classList.add("hidden");
    api().showView?.("board");
  }

  function restoreFromSave(payload){
    if(!validSavePayload(payload)){
      toast("Este arquivo de save não é compatível.");
      return false;
    }

    stopPartyDanceBotFeedback();
    clearInterval(droneTimerId);
    rolling=false;

    const savedBoard=payload.board;
    state={
      match:{...payload.match,mode:"local"},
      players:savedBoard.players.map(cleanPlayerForSave),
      round:Math.max(1,Number(savedBoard.round||1)),
      totalRounds:Math.max(1,Number(savedBoard.totalRounds||payload.match?.rounds||BOARD_CONFIG.defaultRounds||5)),
      turnIndex:Math.max(0,Math.min(savedBoard.players.length-1,Number(savedBoard.turnIndex||0))),
      currentMinigame:savedBoard.currentMinigame?{...savedBoard.currentMinigame}:null,
      education:{
        concepts:[...(savedBoard.education?.concepts||[])],
        disasters:[...(savedBoard.education?.disasters||[])],
        technologies:[...(savedBoard.education?.technologies||[])]
      },
      roundEvent:null,
      connected:false
    };

    if(manualSaveButton)manualSaveButton.disabled=false;
    renderRestoredBoardBase();
    state.roundEvent=eventById(savedBoard.roundEvent?.id)||null;
    if(state.roundEvent&&boardStage)boardStage.dataset.environment=state.roundEvent.id;
    eventBox.textContent=String(savedBoard.eventText||"Partida restaurada.");

    const phase=String(savedBoard.phase||"board");
    if(phase==="minigame-intro"){
      renderPlayers();
      const player=state.players[state.turnIndex];
      roundText.textContent=`Rodada ${state.round} / ${state.totalRounds}`;
      turnName.textContent=player?.name||"Jogador";
      turnAvatar.innerHTML=avatar(player||{});
      setTimeout(()=>openMinigame(state.currentMinigame?.id||null),80);
    }else if(phase==="post-minigame"){
      advanceRound();
    }else{
      updateTurnUi();
    }

    updateSaveStatus("Partida restaurada");
    return true;
  }

  const EQUIPMENT_MAX=2;

  const equipmentCatalog=Object.freeze({
    rescue:{
      id:"rescue",
      name:"Kit de Resgate",
      icon:"✚",
      short:"Proteção",
      description:"Cancela automaticamente a próxima perda causada por uma casa negativa.",
      effect:"Uso automático • bloqueia 1 penalidade vermelha."
    },
    sensor:{
      id:"sensor",
      name:"Sensor de Alerta",
      icon:"◉",
      short:"Alerta",
      description:"Se uma casa de evento causar perda de pontos, o sensor cancela a penalidade.",
      effect:"Uso automático • protege de 1 evento negativo."
    },
    gps:{
      id:"gps",
      name:"GPS de Emergência",
      icon:"⌖",
      short:"Rota segura",
      description:"No próximo lançamento, qualquer resultado abaixo de 6 passa a valer 6.",
      effect:"Use antes de rolar • garante no mínimo 6."
    },
    map:{
      id:"map",
      name:"Mapa Digital",
      icon:"▦",
      short:"+3 casas",
      description:"Avança 3 casas antes de rolar o dado, sem ativar a casa intermediária.",
      effect:"Use antes de rolar • avance 3 casas."
    }
  });

  function ensurePlayerEquipment(player){
    if(!player)return;
    if(!Array.isArray(player.inventory))player.inventory=[];
    if(!player.activeEffects||typeof player.activeEffects!=="object"){
      player.activeEffects={gps:false,mapBoost:0};
    }
  }

  function randomEquipmentId(player){
    ensurePlayerEquipment(player);
    const ids=Object.keys(equipmentCatalog);
    // Tenta evitar duplicata quando há opção diferente.
    const unique=ids.filter(id=>!player.inventory.includes(id));
    const pool=unique.length?unique:ids;
    return pool[rand(0,pool.length-1)];
  }

  function equipmentById(id){
    return equipmentCatalog[String(id||"")]||null;
  }

  function showItemOverlay(item,eyebrow="Equipamento encontrado"){
    if(!item||!itemOverlay)return;
    itemIcon.textContent=item.icon;
    itemEyebrow.textContent=eyebrow;
    itemTitle.textContent=item.name;
    itemDescription.textContent=item.description;
    itemEffect.textContent=item.effect;
    itemOverlay.classList.remove("hidden");
  }

  function closeItemOverlay(){
    itemOverlay?.classList.add("hidden");
  }

  function grantEquipment(player,id=null){
    ensurePlayerEquipment(player);
    if(player.inventory.length>=EQUIPMENT_MAX){
      player.score+=2;
      eventBox.textContent=`${player.name} já estava com o inventário cheio e recebeu +2 Pontos de Missão.`;
      return null;
    }
    const chosen=id||randomEquipmentId(player);
    player.inventory.push(chosen);
    const item=equipmentById(chosen);
    if(item){
      eventBox.textContent=`${player.name} encontrou ${item.name}.`;
      if(player.human&&!player.bot)showItemOverlay(item);
    }
    renderInventory();
    renderPlayers();
    return item;
  }

  function removeEquipment(player,id){
    ensurePlayerEquipment(player);
    const index=player.inventory.indexOf(id);
    if(index<0)return false;
    player.inventory.splice(index,1);
    return true;
  }

  function consumeAutoProtection(player,type){
    ensurePlayerEquipment(player);
    const id=type==="bad"?"rescue":"sensor";
    if(!player.inventory.includes(id))return null;
    removeEquipment(player,id);
    renderInventory();
    return equipmentById(id);
  }

  async function useEquipment(player,id,source="pc"){
    if(!state||!player||rolling)return false;
    ensurePlayerEquipment(player);
    if(!player.inventory.includes(id))return false;
    const current=state.players[state.turnIndex];
    if(current?.id!==player.id)return false;

    if(id==="gps"){
      removeEquipment(player,id);
      player.activeEffects.gps=true;
      eventBox.textContent=`${player.name} ativou o GPS: o próximo dado terá resultado mínimo 6.`;
      renderInventory();renderPlayers();checkpoint("board","auto");
      if(player.human&&source==="pc")showItemOverlay(equipmentById(id),"Equipamento ativado");
      return true;
    }

    if(id==="map"){
      removeEquipment(player,id);
      eventBox.textContent=`${player.name} abriu o Mapa Digital e avançou 3 casas.`;
      renderInventory();renderPlayers();
      await movePlayer(player,3);
      checkpoint("board","auto");
      if(player.human&&source==="pc")showItemOverlay(equipmentById(id),"Equipamento usado");
      return true;
    }

    // rescue/sensor são automáticos.
    return false;
  }

  function botShouldUseEquipment(player){
    ensurePlayerEquipment(player);
    if(player.activeEffects.gps)return null;

    // Mapa é bom quase sempre; bots melhores usam com mais frequência.
    if(player.inventory.includes("map")){
      const chance=player.difficulty==="hard"?.90:player.difficulty==="easy"?.45:.70;
      if(Math.random()<chance)return"map";
    }

    if(player.inventory.includes("gps")){
      const chance=player.difficulty==="hard"?.82:player.difficulty==="easy"?.35:.60;
      if(Math.random()<chance)return"gps";
    }
    return null;
  }

  function renderInventory(){
    if(!inventorySlots||!state)return;
    const player=state.players[state.turnIndex];
    ensurePlayerEquipment(player);
    inventorySlots.innerHTML="";

    for(let slot=0;slot<EQUIPMENT_MAX;slot++){
      const id=player.inventory[slot];
      const item=equipmentById(id);
      const button=document.createElement("button");
      button.type="button";
      button.className=`final-inventory-slot${item?" has-item":""}`;
      button.disabled=!item||rolling||player.bot||!["gps","map"].includes(item.id);

      if(item){
        button.innerHTML=`<span class="final-inventory-icon">${item.icon}</span><span><strong>${item.name}</strong><small>${["gps","map"].includes(item.id)?"Toque para usar":"Automático"}</small></span>`;
        button.title=item.description;
        button.addEventListener("click",()=>useEquipment(player,item.id,"pc"));
      }else{
        button.innerHTML=`<span class="final-inventory-empty">+</span><span><strong>Vazio</strong><small>Casa de tecnologia</small></span>`;
      }
      inventorySlots.appendChild(button);
    }

    if(inventoryHint){
      if(player.bot)inventoryHint.textContent=`Inventário de ${player.name} • uso automático`;
      else if(player.activeEffects.gps)inventoryHint.textContent="GPS ativo • próximo dado mínimo 6";
      else inventoryHint.textContent="GPS e Mapa são manuais; proteções são automáticas.";
    }
  }

  const environmentEvents=[
    {id:"flood",title:"Alerta de Enchente",icon:"≈",disaster:"Enchente",technology:"Sensores de chuva",description:"O nível da água subiu. Casas negativas ficam mais perigosas, mas tecnologia de monitoramento vale mais.",modifiers:{badExtra:1,techBonus:1}},
    {id:"landslide",title:"Risco de Deslizamento",icon:"△",disaster:"Deslizamento",technology:"Sensores de encosta",description:"A encosta está instável. Desafios de análise ganham mais valor nesta rodada.",modifiers:{badExtra:1,challengeBonus:2}},
    {id:"wildfire",title:"Foco de Incêndio",icon:"✦",disaster:"Incêndio florestal",technology:"Drones e satélites",description:"Um foco de calor foi detectado. Casas de tecnologia ajudam mais no monitoramento.",modifiers:{techBonus:2}},
    {id:"dam",title:"Alerta de Barragem",icon:"▰",disaster:"Falha de barragem",technology:"Sensores estruturais",description:"A estrutura está sob observação. Casas de evento ficam mais intensas.",modifiers:{eventPower:1}},
    {id:"drought",title:"Período de Seca",icon:"☼",disaster:"Seca",technology:"Mapas e satélites",description:"A disponibilidade de água caiu. Tecnologia de mapeamento recebe bônus nesta rodada.",modifiers:{goodPenalty:1,techBonus:1}}
  ];

  const tutorialSteps=[
    {icon:"🎲",eyebrow:"Como jogar",title:"Role o dado",text:"O dado parece um cubo de seis faces, mas é digital e pode sortear números de 1 a 10."},
    {icon:"◎",eyebrow:"Casas do tabuleiro",title:"Cada casa muda a missão",text:"Casas verdes ajudam, vermelhas atrapalham, azuis representam tecnologia e amarelas trazem desafios."},
    {icon:"◆",eyebrow:"Fim da rodada",title:"Hora do minigame",text:"Depois que todos jogarem uma vez, começa um minigame compatível com os controles da partida."},
    {icon:"∑",eyebrow:"Objetivo STEAM",title:"Matemática aplicada a problemas reais",text:"Os desafios relacionam Pitágoras, Trigonometria e Tales a drones, sensores, satélites e desastres ambientais."}
  ];

  function addUnique(target,value){
    if(value&&!target.includes(value))target.push(value);
  }

  function registerEducationForMinigame(id){
    if(!state?.education)return;
    if(id==="drone-route"){
      addUnique(state.education.concepts,"Teorema de Pitágoras");
      addUnique(state.education.technologies,"Drones");
    }else if(id==="slope-sensor"){
      addUnique(state.education.concepts,"Trigonometria");
      addUnique(state.education.technologies,"Sensores de encosta");
      addUnique(state.education.disasters,"Deslizamento");
    }else if(id==="satellite-scale"){
      addUnique(state.education.concepts,"Tales / Escala");
      addUnique(state.education.technologies,"Satélites e mapas");
    }else if(id==="just-dance"){
      addUnique(state.education.concepts,"Movimento e coordenação");
    }
  }

  function eventById(id){return environmentEvents.find(event=>event.id===id)||null}

  function showEnvironmentBanner(event){
    if(!event||!environmentBanner)return;
    environmentIcon.textContent=event.icon;
    environmentTitle.textContent=event.title;
    environmentDescription.textContent=event.description;
    environmentBanner.classList.remove("hidden");
    environmentBanner.dataset.event=event.id;
    clearTimeout(environmentBannerTimer);
    environmentBannerTimer=setTimeout(()=>environmentBanner?.classList.add("hidden"),5200);
  }

  function applyRoundEnvironmentEvent(forceId=null){
    if(!state)return null;
    let event=forceId?eventById(forceId):null;
    if(!event&&state.match?.presentationMode){
      const demo=["flood","landslide","wildfire"];
      event=eventById(demo[(state.round-1)%demo.length]);
    }
    if(!event)event=environmentEvents[rand(0,environmentEvents.length-1)];
    state.roundEvent=event;
    if(boardStage)boardStage.dataset.environment=event.id;
    addUnique(state.education.disasters,event.disaster);
    addUnique(state.education.technologies,event.technology);
    eventBox.textContent=`${event.title}: ${event.description}`;
    showEnvironmentBanner(event);
    return event;
  }

  function roundModifiers(){return state?.roundEvent?.modifiers||{}}

  function showTutorial(force=false){
    if(!tutorialOverlay)return;
    if(!force){
      try{if(localStorage.getItem(TUTORIAL_KEY)==="1")return}catch{}
      if(state?.match?.presentationMode)return;
    }
    tutorialStep=0;
    renderTutorialStep();
    tutorialOverlay.classList.remove("hidden");
  }

  function closeTutorial(markSeen=true){
    tutorialOverlay?.classList.add("hidden");
    if(markSeen){try{localStorage.setItem(TUTORIAL_KEY,"1")}catch{}}
  }

  function renderTutorialStep(){
    const step=tutorialSteps[tutorialStep]||tutorialSteps[0];
    tutorialProgress.textContent=`${tutorialStep+1} / ${tutorialSteps.length}`;
    tutorialIcon.textContent=step.icon;
    tutorialEyebrow.textContent=step.eyebrow;
    tutorialTitle.textContent=step.title;
    tutorialText.textContent=step.text;
    tutorialNext.textContent=tutorialStep>=tutorialSteps.length-1?"Começar":"Próximo";
    tutorialDots.innerHTML="";
    tutorialSteps.forEach((_,index)=>{
      const dot=document.createElement("span");
      dot.className=index===tutorialStep?"active":"";
      tutorialDots.appendChild(dot);
    });
  }

  function nextTutorial(){
    if(tutorialStep>=tutorialSteps.length-1){closeTutorial(true);return}
    tutorialStep++;
    renderTutorialStep();
  }

  function chip(container,label,type){
    if(!container||!label)return;
    const el=document.createElement("span");
    el.className=`final-education-chip ${type||""}`.trim();
    el.textContent=label;
    container.appendChild(el);
  }

  function renderEducationSummary(){
    if(!state?.education)return;
    educationConcepts.innerHTML="";
    educationDisasters.innerHTML="";
    educationTechnologies.innerHTML="";

    const a=document.createElement("strong");a.textContent="Matemática";educationConcepts.appendChild(a);
    (state.education.concepts||[]).forEach(v=>chip(educationConcepts,v,"concept"));

    const b=document.createElement("strong");b.textContent="Desastres / riscos";educationDisasters.appendChild(b);
    (state.education.disasters||[]).forEach(v=>chip(educationDisasters,v,"disaster"));

    const c=document.createElement("strong");c.textContent="Tecnologia";educationTechnologies.appendChild(c);
    (state.education.technologies||[]).forEach(v=>chip(educationTechnologies,v,"technology"));
  }

  function renderSpaces(){spacesLayer.innerHTML="";path.forEach((pt,i)=>{const type=spaceTypes[i%spaceTypes.length],el=document.createElement("div");el.className="final-board-space";el.dataset.index=i;el.dataset.type=type;el.style.left=`${pt.x}%`;el.style.top=`${pt.y}%`;el.innerHTML=`<span>${type==="start"?"INÍCIO":symbols[type]}</span>`;spacesLayer.appendChild(el)})}
  function playerFromController(ctrl,slot){return{slot,id:ctrl.id,human:true,bot:false,name:ctrl.name||`Jogador ${slot}`,avatarShape:shapes[(slot-1)%shapes.length],avatarColor:colors[(slot-1)%colors.length],avatarFace:"smile",difficulty:"",position:0,laps:0,score:0,inventory:[],activeEffects:{gps:false,mapBoost:0}}}
  function playerLocal(slot,profile){return{slot,id:`local-${slot}`,human:true,bot:false,name:profile?.name||`Jogador ${slot}`,avatarShape:profile?.avatarShape||shapes[(slot-1)%shapes.length],avatarColor:profile?.avatarColor||colors[(slot-1)%colors.length],avatarFace:profile?.avatarFace||"smile",difficulty:"",position:0,laps:0,score:0,inventory:[],activeEffects:{gps:false,mapBoost:0}}}
  function botPlayer(slot,diff="normal"){return{slot,id:`bot-${slot}`,human:false,bot:true,name:`Bot ${slot}`,avatarShape:shapes[(slot-1)%shapes.length],avatarColor:colors[(slot-1)%colors.length],avatarFace:"focus",difficulty:diff,position:0,laps:0,score:0,inventory:[],activeEffects:{gps:false,mapBoost:0}}}
  function buildPlayers(match,controllers=[]){const humans=Math.max(1,Math.min(4,Number(match.humanPlayers||1))),players=[],active=api().getActiveProfile?.()||null;for(let i=1;i<=humans;i++)players.push(controllers[i-1]?playerFromController(controllers[i-1],i):playerLocal(i,i===1?active:null));for(let i=humans+1;i<=4;i++)players.push(botPlayer(i,match.bots?.[i-humans-1]?.difficulty||"normal"));return players}
  function renderPlayers(){playersList.innerHTML="";state.players.forEach((p,i)=>{const row=document.createElement("div");row.className=`final-board-player${i===state.turnIndex?" is-turn":""}`;row.innerHTML=`<span class="final-board-player-avatar">${avatar(p)}</span><span><strong></strong><small></small></span><span class="final-board-player-score"><b>${p.score}</b><span>PTS</span></span>`;$("strong",row).textContent=p.name;ensurePlayerEquipment(p);
      const inv=p.inventory.length?` • ${p.inventory.length} item${p.inventory.length===1?"":"s"}`:"";
      $("small",row).textContent=p.bot?`Bot • ${difficulty(p.difficulty)}${inv}`:`Humano${inv}`;
      playersList.appendChild(row)})}
  function renderTokens(){tokensLayer.innerHTML="";state.players.forEach(p=>{const pt=path[p.position]||path[0],t=document.createElement("div");t.className="final-board-token";t.dataset.playerId=p.id;t.dataset.slot=p.slot;t.style.left=`${pt.x}%`;t.style.top=`${pt.y}%`;t.innerHTML=avatar(p);tokensLayer.appendChild(t)})}
  function updateToken(p){const t=$(`[data-player-id="${CSS.escape(p.id)}"]`,tokensLayer),pt=path[p.position]||path[0];if(t&&pt){t.style.left=`${pt.x}%`;t.style.top=`${pt.y}%`}}
  function partyState(phase="board",extra={}){if(!state)return{};return{phase,round:state.round,totalRounds:state.totalRounds,currentPlayerId:state.players[state.turnIndex]?.id||"",eventText:eventBox.textContent||"",players:state.players.map(p=>({id:p.id,name:p.name,human:p.human,bot:p.bot,difficulty:p.difficulty,position:p.position,score:p.score,laps:p.laps})),...extra}}
  function publish(phase="board",extra={}){if(state?.connected)network?.publishState(partyState(phase,extra))}
  function updateTurnUi(){const p=state.players[state.turnIndex];checkpoint("board","auto");renderInventory();roundText.textContent=`Rodada ${state.round} / ${state.totalRounds}`;turnName.textContent=p.name;turnAvatar.innerHTML=avatar(p);renderPlayers();const phoneHuman=state.connected&&p.human;rollButton.disabled=rolling||p.bot||phoneHuman;rollButton.textContent=p.bot?"Bot jogando…":phoneHuman?"Use o celular":"Rolar dado";instruction.textContent=p.bot?`${p.name} está preparando a jogada.`:phoneHuman?`Aguardando ${p.name} rolar o dado no celular.`:"Role o dado para continuar.";instruction.classList.toggle("final-party-phone-wait",phoneHuman);diceResult.textContent="";publish("board");if(p.bot&&!rolling)setTimeout(async()=>{
      const item=botShouldUseEquipment(p);
      if(item)await useEquipment(p,item,"bot");
      setTimeout(()=>rollForCurrentPlayer("bot"),item==="map"?300:80);
    },650)}
  function updateDice(result=null){$$(".face",diceCube).forEach((f,i)=>f.textContent=String(i===0&&result?result:rand(MIN_ROLL,MAX_ROLL)))}
  async function animateDice(result){diceCube.classList.add("rolling");const timer=setInterval(()=>updateDice(),72);await sleep(800);clearInterval(timer);diceCube.classList.remove("rolling");updateDice(result);diceCube.style.transform=`rotateX(${rand(1,3)*360-18}deg) rotateY(${rand(1,3)*360+28}deg)`;diceResult.textContent=`Saiu ${result}!`;await sleep(360)}
  async function movePlayer(p,steps){for(let i=0;i<steps;i++){const prev=p.position;p.position=(p.position+1)%SPACE_COUNT;if(p.position<prev){p.laps++;p.score+=3;eventBox.textContent=`${p.name} completou uma volta e ganhou +3 Pontos de Missão.`}updateToken(p);publish("board");await sleep(180)}}
  function resolveSpace(p){
    ensurePlayerEquipment(p);
    const type=spaceTypes[p.position%spaceTypes.length],mods=roundModifiers();
    const goodPoints=Math.max(1,3-Number(mods.goodPenalty||0));
    const badPoints=2+Number(mods.badExtra||0);
    const techPoints=4+Number(mods.techBonus||0);
    const challengePoints=2+Number(mods.challengeBonus||0);
    const eventPower=Number(mods.eventPower||0);
    const events={
      start:()=>`${p.name} passou pela Central de Monitoramento.`,
      good:()=>{p.score+=goodPoints;return`Boa decisão de prevenção! ${p.name} ganhou +${goodPoints} Pontos de Missão.`},
      bad:()=>{
        const protection=consumeAutoProtection(p,"bad");
        if(protection)return`${protection.name} protegeu ${p.name}. Nenhum ponto foi perdido.`;
        p.score=Math.max(0,p.score-badPoints);
        return`Um imprevisto ambiental atrasou a missão. ${p.name} perdeu ${badPoints} pontos.`;
      },
      tech:()=>{
        p.score+=techPoints;
        const item=grantEquipment(p);
        return item
          ?`Tecnologia encontrada! ${p.name} ganhou +${techPoints} pontos e recebeu ${item.name}.`
          :`Tecnologia encontrada! ${p.name} ganhou +${techPoints} pontos.`;
      },
      challenge:()=>{p.score+=challengePoints;return`Casa de desafio! ${p.name} recebeu +${challengePoints} pontos.`},
      event:()=>{
        const positive=5+eventPower,negative=3+eventPower,d=Math.random()<.5?positive:-negative;
        if(d<0){
          const protection=consumeAutoProtection(p,"event");
          if(protection)return`${protection.name} detectou o risco a tempo. ${p.name} não perdeu pontos.`;
        }
        p.score=Math.max(0,p.score+d);
        return d>0?`Evento de resgate bem-sucedido: +${d} pontos para ${p.name}.`:`Evento inesperado: ${p.name} perdeu ${Math.abs(d)} pontos.`;
      }
    };
    eventBox.textContent=(events[type]||events.good)();
    renderInventory();renderPlayers();checkpoint("board","auto");publish("board");
  }
  async function rollForCurrentPlayer(source="pc"){if(!state||rolling)return;const p=state.players[state.turnIndex];if(state.connected&&p.human&&source!=="phone")return;rolling=true;rollButton.disabled=true;let result=rand(MIN_ROLL,MAX_ROLL);
    ensurePlayerEquipment(p);
    if(p.activeEffects.gps){
      result=Math.max(6,result);
      p.activeEffects.gps=false;
      eventBox.textContent=`GPS de ${p.name}: resultado mínimo garantido em 6.`;
    }
    await animateDice(result);await movePlayer(p,result);resolveSpace(p);await sleep(p.bot?700:950);rolling=false;nextTurn()}
  function nextTurn(){state.turnIndex++;if(state.turnIndex>=state.players.length){state.turnIndex=0;endRound();return}updateTurnUi()}
  function endRound(){
    if(state.match.minigamesEnabled){
      const forced=state.match?.presentationMode?(state.match.forcedMinigames||[])[Math.max(0,state.round-1)]||null:null;
      openMinigame(forced);return;
    }
    advanceRound();
  }
  function advanceRound(){if(state.round>=state.totalRounds){finishMatch();return}state.round++;applyRoundEnvironmentEvent();updateTurnUi()}
  function compatibleMinigames(){
    const games=[
      {
        id:"drone-route",
        title:"Rota do Drone",
        description:"Calcule a rota direta de monitoramento usando o Teorema de Pitágoras.",
        sensorRequired:false,
        topic:"Pitágoras"
      },
      {
        id:"slope-sensor",
        title:"Sensor de Encosta",
        description:"Calcule a inclinação de uma encosta para posicionar sensores de risco de deslizamento.",
        sensorRequired:false,
        topic:"Trigonometria"
      },
      {
        id:"satellite-scale",
        title:"Mapa de Satélite",
        description:"Use escala e proporcionalidade para estimar distâncias em uma imagem de monitoramento.",
        sensorRequired:false,
        topic:"Tales / Escala"
      },
      {
        id:"just-dance",
        title:"Just Dance",
        description:"Use o celular em pé e acompanhe a coreografia. O próprio celular calcula seus julgamentos.",
        sensorRequired:true,
        topic:"Movimento"
      }
    ];
    return games.filter(g=>{
      if(g.sensorRequired&&!state.match.motionMinigamesEnabled)return false;
      if(g.id==="just-dance"&&(!state.connected||!danceBridge))return false;
      return true;
    });
  }
  function openMinigame(forcedId=null){const games=compatibleMinigames();if(!games.length){advanceRound();return}const g=games.find(game=>game.id===forcedId)||games[rand(0,games.length-1)];state.currentMinigame=g;registerEducationForMinigame(g.id);minigameTitle.textContent=g.title;minigameDescription.textContent=g.description;minigameIntro.classList.remove("hidden");droneGame.classList.add("hidden");minigameResult.classList.add("hidden");minigameOverlay.classList.remove("hidden");checkpoint("minigame-intro","auto");publish("minigame-intro",{minigame:{id:g.id,title:g.title,status:"intro"}})}
  function shuffled(values){
    return [...values].sort(()=>Math.random()-.5);
  }

  function uniqueNumericAnswers(correct,candidates){
    const result=[correct];
    for(const value of candidates){
      const n=Number(value);
      if(!Number.isFinite(n))continue;
      if(!result.some(existing=>Math.abs(existing-n)<1e-9))result.push(n);
      if(result.length>=4)break;
    }
    while(result.length<4){
      let fallback=Math.max(1,Math.round(correct)+rand(-8,8));
      if(!result.includes(fallback))result.push(fallback);
    }
    return shuffled(result.slice(0,4));
  }

  function makeDroneProblem(){
    const[a,b,c]=triples[rand(0,triples.length-1)];
    const answers=uniqueNumericAnswers(c,[c-2,c+2,c+4,c-4,c+1]);
    return{
      gameId:"drone-route",
      kind:"pitagoras",
      topic:"Teorema de Pitágoras",
      scenario:"Um drone precisa chegar diretamente ao ponto de monitoramento.",
      question:`O drone percorre ${a} km para leste e depois ${b} km para norte. Qual seria a distância em linha reta entre o início e o destino?`,
      a,b,c,
      answer:c,
      unit:"km",
      answers,
      token:`drone-${Date.now()}-${Math.random().toString(36).slice(2,7)}`
    };
  }

  function makeSlopeProblem(){
    const triplesSlope=[[3,4],[4,3],[5,12],[8,15],[7,24],[9,12],[12,16]];
    const[rise,run]=triplesSlope[rand(0,triplesSlope.length-1)];
    const angle=Math.round(Math.atan2(rise,run)*180/Math.PI);
    const answers=uniqueNumericAnswers(angle,[angle-10,angle+10,90-angle,angle-5,angle+6]);
    return{
      gameId:"slope-sensor",
      kind:"trigonometria",
      topic:"Trigonometria • Tangente",
      scenario:"A equipe precisa medir a inclinação antes de instalar sensores de deslizamento.",
      question:`A encosta sobe ${rise} m a cada ${run} m na horizontal. Aproximadamente qual é o ângulo de inclinação em relação ao solo?`,
      a:rise,
      b:run,
      c:angle,
      answer:angle,
      unit:"°",
      answers,
      token:`slope-${Date.now()}-${Math.random().toString(36).slice(2,7)}`
    };
  }

  function makeSatelliteProblem(){
    const cases=[
      [2,10,7],[2,8,6],[3,12,8],[4,20,7],[5,25,9],[2,14,5],[3,15,7]
    ];
    const[mapCm,realKm,measuredCm]=cases[rand(0,cases.length-1)];
    const answer=realKm/mapCm*measuredCm;
    const answers=uniqueNumericAnswers(answer,[
      answer+(realKm/mapCm),
      answer-(realKm/mapCm),
      realKm*measuredCm,
      answer+5,
      answer-5
    ]);
    return{
      gameId:"satellite-scale",
      kind:"escala",
      topic:"Tales • Escala e Proporção",
      scenario:"Uma imagem de satélite mostra a extensão de uma área monitorada.",
      question:`No mapa, ${mapCm} cm representam ${realKm} km. Uma região mede ${measuredCm} cm na imagem. Qual é a distância real correspondente?`,
      a:mapCm,
      b:realKm,
      c:measuredCm,
      answer,
      unit:"km",
      answers,
      token:`scale-${Date.now()}-${Math.random().toString(36).slice(2,7)}`
    };
  }

  function makeEduProblem(gameId){
    if(gameId==="slope-sensor")return makeSlopeProblem();
    if(gameId==="satellite-scale")return makeSatelliteProblem();
    return makeDroneProblem();
  }

  function renderEduVisual(problem){
    if(!eduVisual)return;
    eduVisual.dataset.kind=problem.kind||"";
    if(eduTopic)eduTopic.textContent=problem.topic||"Matemática";

    if(problem.kind==="trigonometria"){
      eduVisual.innerHTML=`
        <div class="final-slope-ground"></div>
        <div class="final-slope-line"></div>
        <div class="final-slope-rise"><span>${problem.a} m</span></div>
        <div class="final-slope-run"><span>${problem.b} m</span></div>
        <div class="final-slope-sensor-icon">◉</div>
        <div class="final-slope-angle">θ ?</div>`;
      return;
    }

    if(problem.kind==="escala"){
      eduVisual.innerHTML=`
        <div class="final-map-grid"></div>
        <div class="final-map-zone"></div>
        <div class="final-map-ruler"><span>${problem.c} cm</span></div>
        <div class="final-map-scale">${problem.a} cm = ${problem.b} km</div>
        <div class="final-satellite-icon">◆</div>`;
      return;
    }

    eduVisual.innerHTML=`
      <div class="final-route-leg final-route-a"><span>${problem.a} km</span></div>
      <div class="final-route-leg final-route-b"><span>${problem.b} km</span></div>
      <div class="final-drone-direct">✈</div>`;
  }

  function answerLabel(value,unit){
    const n=Number(value);
    const displayed=Number.isInteger(n)?String(n):String(Math.round(n*10)/10);
    return unit==="°"?`${displayed}°`:`${displayed} ${unit||""}`.trim();
  }

  function startEduGame(gameId){
    minigameIntro.classList.add("hidden");
    minigameResult.classList.add("hidden");
    droneGame.classList.remove("hidden");
    droneGame.dataset.finished="0";

    currentProblem=makeEduProblem(gameId);
    minigameScores=[];
    phoneAnswers=new Map();

    renderEduVisual(currentProblem);
    droneQuestion.textContent=currentProblem.question;
    droneAnswers.innerHTML="";

    if(!state.connected){
      currentProblem.answers.forEach(value=>{
        const button=document.createElement("button");
        button.type="button";
        button.className="final-drone-answer";
        button.dataset.answer=String(value);
        button.textContent=answerLabel(value,currentProblem.unit);
        button.onclick=()=>submitLocalAnswer(value,button);
        droneAnswers.appendChild(button);
      });
    }else{
      const wait=document.createElement("div");
      wait.className="final-info-box";
      wait.textContent="As respostas aparecem nos celulares. O computador mostra o desafio, o tempo e depois o ranking.";
      droneAnswers.appendChild(wait);
    }

    droneDeadline=performance.now()+12000;
    clearInterval(droneTimerId);
    droneTimerId=setInterval(updateTimer,100);
    updateTimer();

    publish("minigame",{
      minigame:{
        id:currentProblem.gameId,
        title:state.currentMinigame?.title||"Desafio STEAM",
        status:"playing",
        problem:{
          token:currentProblem.token,
          kind:currentProblem.kind,
          topic:currentProblem.topic,
          scenario:currentProblem.scenario,
          question:currentProblem.question,
          unit:currentProblem.unit,
          a:currentProblem.a,
          b:currentProblem.b,
          c:currentProblem.c,
          answers:currentProblem.answers,
          deadlineServerMs:Date.now()+12000
        }
      }
    });
  }

  function startDroneGame(){
    startEduGame("drone-route");
  }

  function updateTimer(){
    const left=Math.max(0,droneDeadline-performance.now());
    droneTimer.textContent=`Tempo: ${(left/1000).toFixed(1)} s`;
    if(left<=0){
      clearInterval(droneTimerId);
      state.connected?finalizeConnectedGame():submitLocalAnswer(null,null);
    }
  }

  const botAccuracy=b=>({easy:.45,normal:.70,hard:.90}[b.difficulty]||.70);

  function addBots(){
    state.players.filter(p=>p.bot).forEach(bot=>{
      const ok=Math.random()<botAccuracy(bot);
      const base=({easy:8000,normal:5900,hard:4000}[bot.difficulty]||5900);
      const time=Math.max(800,base+rand(-1400,1400));
      minigameScores.push({player:bot,correct:ok,timeMs:time,performance:ok?10000-time:0});
    });
  }

  function submitLocalAnswer(value,button){
    if(!currentProblem||droneGame.dataset.finished==="1")return;
    droneGame.dataset.finished="1";
    clearInterval(droneTimerId);
    $$(".final-drone-answer",droneAnswers).forEach(b=>b.disabled=true);

    const correct=Number(value)===Number(currentProblem.answer);
    if(button)button.classList.add(correct?"correct":"wrong");
    $$(".final-drone-answer",droneAnswers)
      .find(b=>Number(b.dataset.answer)===Number(currentProblem.answer))
      ?.classList.add("correct");

    const reaction=Math.max(250,12000-Math.max(0,droneDeadline-performance.now()));
    const humans=state.players.filter(p=>p.human);
    humans.forEach((p,i)=>minigameScores.push({
      player:p,
      correct:i===0?correct:false,
      timeMs:i===0?reaction:12000,
      performance:i===0&&correct?10000-reaction:0
    }));
    addBots();
    setTimeout(showResults,850);
  }

  function handlePhoneAnswer(action){
    if(!state?.connected||!currentProblem||action.problemToken!==currentProblem.token||phoneAnswers.has(action.playerId))return;
    const p=state.players.find(x=>x.id===action.playerId&&x.human);
    if(!p)return;

    const correct=Number(action.answer)===Number(currentProblem.answer);
    const timeMs=Math.max(200,Math.min(12000,12000-Math.max(0,droneDeadline-performance.now())));
    phoneAnswers.set(p.id,true);
    minigameScores.push({player:p,correct,timeMs,performance:correct?10000-timeMs:0});

    const needed=state.players.filter(x=>x.human).length;
    if(phoneAnswers.size>=needed)finalizeConnectedGame();
  }

  function finalizeConnectedGame(){
    if(!currentProblem||droneGame.dataset.finished==="1")return;
    droneGame.dataset.finished="1";
    clearInterval(droneTimerId);
    state.players.filter(p=>p.human&&!phoneAnswers.has(p.id)).forEach(p=>
      minigameScores.push({player:p,correct:false,timeMs:12000,performance:0})
    );
    addBots();
    setTimeout(showResults,500);
  }

  function showResults(){
    const completedProblem=currentProblem;
    currentProblem=null;
    droneGame.classList.add("hidden");
    minigameResult.classList.remove("hidden");

    minigameScores.sort((a,b)=>b.performance-a.performance||a.timeMs-b.timeMs);
    const winner=minigameScores.find(e=>e.correct);
    if(winner?.player){
      winner.player.score+=MINIGAME_REWARD;
      minigameWinner.textContent=`${winner.player.name} venceu!`;
    }else{
      minigameWinner.textContent="Ninguém acertou desta vez.";
    }

    minigameRanking.innerHTML="";
    const results=[];
    minigameScores.forEach((entry,index)=>{
      const row=document.createElement("div");
      row.className="final-ranking-row";
      row.innerHTML=`<b>${index+1}º</b><span><strong></strong><small></small></span><span>${entry.correct?"✓":"×"}</span>`;
      $("strong",row).textContent=entry.player.name;
      $("small",row).textContent=entry.correct?`${(entry.timeMs/1000).toFixed(1)} s`:"Errou";
      minigameRanking.appendChild(row);
      results.push({
        playerId:entry.player.id,
        name:entry.player.name,
        correct:entry.correct,
        timeMs:entry.timeMs,
        place:index+1
      });
    });

    renderPlayers();
    checkpoint("post-minigame","auto");
    publish("minigame-result",{
      minigame:{
        id:completedProblem?.gameId||state.currentMinigame?.id||"edu",
        title:state.currentMinigame?.title||"Desafio STEAM",
        status:"result",
        results
      }
    });
  }

  function stopPartyDanceBotFeedback(){
    clearInterval(partyDanceBotTimer);
    partyDanceBotTimer=0;
    partyDanceBotEvents=[];
    partyDanceBotEventCursor=0;
  }

  function botDanceJudgement(bot, move){
    const roll=Math.random();

    // Gold Move usa a mesma janela/move da música: o bot só pode dar YEAH ou X.
    if(move?.goldMove){
      const yeahChance=bot.difficulty==="hard"?.94:bot.difficulty==="easy"?.55:.78;
      return roll<yeahChance?"YEAH":"X";
    }

    if(bot.difficulty==="hard")
      return roll<.52?"PERFECT":roll<.82?"SUPER":roll<.95?"GOOD":roll<.99?"OK":"X";
    if(bot.difficulty==="easy")
      return roll<.09?"PERFECT":roll<.27?"SUPER":roll<.53?"GOOD":roll<.80?"OK":"X";
    return roll<.27?"PERFECT":roll<.57?"SUPER":roll<.81?"GOOD":roll<.95?"OK":"X";
  }

  function botDanceReactionOffset(bot){
    // Todos julgam o MESMO move; só varia um pouco o instante em torno do fim da janela.
    if(bot.difficulty==="hard")return rand(-90,70);
    if(bot.difficulty==="easy")return rand(-20,190);
    return rand(-60,125);
  }

  function startPartyDanceBotFeedback(){
    stopPartyDanceBotFeedback();
    const bots=state?.players?.filter(player=>player.bot)||[];
    const timeline=danceBridge?.getMoveTimeline?.()||[];
    if(!bots.length||!timeline.length||!danceBridge?.applyBotMoveJudgement||!danceBridge?.getCurrentTimelineMs)return;

    // Pré-calcula um evento por BOT e por MOVE real da música.
    // Não existe mais timer de "julgamento aleatório a cada 1,9 s".
    partyDanceBotEvents=[];
    timeline.forEach(move=>{
      const moveEnd=Number(move.time||0)+Math.max(0,Number(move.duration||0));
      bots.forEach(bot=>{
        partyDanceBotEvents.push({
          atMs:Math.max(Number(move.time||0),moveEnd+botDanceReactionOffset(bot)),
          bot,
          move,
          judgement:botDanceJudgement(bot,move)
        });
      });
    });
    partyDanceBotEvents.sort((a,b)=>a.atMs-b.atMs||a.move.index-b.move.index||a.bot.slot-b.bot.slot);
    partyDanceBotEventCursor=0;

    partyDanceBotTimer=setInterval(()=>{
      const now=Number(danceBridge.getCurrentTimelineMs?.()||0);
      // Processa tudo que venceu; se houve um pequeno stall de vídeo, não perde o move.
      while(
        partyDanceBotEventCursor<partyDanceBotEvents.length &&
        partyDanceBotEvents[partyDanceBotEventCursor].atMs<=now+18
      ){
        const event=partyDanceBotEvents[partyDanceBotEventCursor++];
        danceBridge.applyBotMoveJudgement(
          event.bot.id,
          event.judgement,
          event.move.index,
          Boolean(event.move.goldMove)
        );
      }
    },45);
  }

  async function startPartyDance(){
    if(!state?.connected||!danceBridge||!network)return;
    const ids=danceBridge.getSongIds?.()||["RainOverMe"];
    const songId=ids[rand(0,ids.length-1)];
    const info=danceBridge.getSongInfo?.(songId)||{title:"Just Dance",artist:""};
    state.currentDanceSong=info;
    minigameOverlay.classList.add("hidden");
    eventBox.textContent=`Preparando Just Dance: ${info.title}.`;
    publish("just-dance-loading",{minigame:{id:"just-dance",title:info.title,status:"loading"}});
    try{
      await network.setSensorMode(true);
      const prepared=await danceBridge.openPartyDanceSong(songId,network.getRoomCode(),state.players);
      if(!prepared?.ok)throw new Error(prepared?.message||"Falha ao carregar música.");
      publish("just-dance",{minigame:{id:"just-dance",title:prepared.title,status:"playing"}});
      const playing=await danceBridge.startPartyDancePlayback();
      if(!playing)toast("O navegador bloqueou a reprodução automática. Tente iniciar novamente.");
      startPartyDanceBotFeedback();
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
    stopPartyDanceBotFeedback();

    // O retorno visual não espera rede: fecha o stage e restaura o tabuleiro imediatamente.
    danceBridge.closePartyDanceSong?.();
    api().showView?.("board");
    view?.classList.remove("hidden");
    network.setSensorMode(false).catch(()=>{});

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

    const localDanceScores=danceBridge?.getPartyScores?.()||[];
    state.players.filter(p=>p.bot).forEach(bot=>{
      const local=localDanceScores.find(item=>String(item.id)===String(bot.id));
      const dance=local?.dance||{};
      scoreRows.push({
        player:bot,
        score:Math.max(0,Number(dance.score||0)),
        stars:Math.max(0,Number(dance.stars||0))
      });
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
    checkpoint("post-minigame","auto");
    publish("minigame-result",{minigame:{id:"just-dance",title:state.currentDanceSong?.title||"Just Dance",status:"result",results}});
  }

  function closeMinigame(){clearInterval(droneTimerId);minigameOverlay.classList.add("hidden");advanceRound()}
  function finishMatch(){clearCheckpoint();renderEducationSummary();matchResultOverlay.classList.remove("hidden");const sorted=[...state.players].sort((a,b)=>b.score-a.score||b.laps-a.laps);matchRanking.innerHTML="";sorted.forEach((p,i)=>{const row=document.createElement("div");row.className="final-ranking-row";row.innerHTML=`<b>${i+1}º</b><span><strong></strong><small></small></span><span><strong>${p.score} pts</strong></span>`;const info=$("span",row);$("strong",info).textContent=p.name;$("small",row).textContent=p.bot?`Bot • ${difficulty(p.difficulty)}`:"Humano";matchRanking.appendChild(row)});publish("match-result",{minigame:null})}
  function renderLobby(){if(!pendingStartConfig||!roomState)return;const expected=Math.max(1,Number(pendingStartConfig.humanPlayers||1)),connected=roomState.players?.length||0;partyConnectedCount.textContent=`${connected} / ${expected}`;partyConnectedPlayers.innerHTML="";(roomState.players||[]).forEach((p,i)=>{const el=document.createElement("div");el.className="final-party-connected-player";el.innerHTML=`<strong></strong><small>Jogador ${i+1} • pronto</small>`;$("strong",el).textContent=p.name;partyConnectedPlayers.appendChild(el)});partyStart.disabled=connected<expected;partyStatus.textContent=connected<expected?`Aguardando ${expected-connected} celular${expected-connected===1?"":"es"}…`:"Todos os jogadores estão conectados."}
  async function startConnectedLobby(match){if(!network){toast("Ponte de rede indisponível.");return false}pendingStartConfig=match;roomState=null;api().showView?.("board");partyLobby.classList.remove("hidden");modeBadge.textContent="Celulares";try{const room=await network.createRoom();partyRoomCode.textContent=room.roomCode;partyJoinUrl.textContent=room.joinUrl;partyQr.src=room.qrUrl;partyStatus.textContent="Sala pronta. Aguardando celulares…";renderLobby();return true}catch(err){partyStatus.textContent=err.message||"Falha ao criar sala.";toast("Não foi possível criar a sala.");return false}}
  async function beginConnectedMatch(){if(!pendingStartConfig||!roomState)return;const expected=Math.max(1,Number(pendingStartConfig.humanPlayers||1));if((roomState.players?.length||0)<expected)return;state={match:pendingStartConfig,players:buildPlayers(pendingStartConfig,roomState.players.slice(0,expected)),round:1,totalRounds:Math.max(1,Number(pendingStartConfig.rounds||BOARD_CONFIG.defaultRounds||5)),turnIndex:0,currentMinigame:null,education:{concepts:[],disasters:[],technologies:[]},roundEvent:null,connected:true};renderSpaces();renderTokens();applyRoundEnvironmentEvent();partyLobby.classList.add("hidden");await network.startParty(expected,partyState("board"));pendingStartConfig=null;updateTurnUi()}
  function leaveBoard(){if(state&&!state.connected)checkpoint("board","exit");clearInterval(droneTimerId);stopPartyDanceBotFeedback();network?.closeRoom();state=null;pendingStartConfig=null;roomState=null;view.classList.add("hidden");partyLobby.classList.add("hidden");itemOverlay?.classList.add("hidden");minigameOverlay.classList.add("hidden");matchResultOverlay.classList.add("hidden");api().showView?.("main")}
  function start(match=null){const saved=match||JSON.parse(localStorage.getItem(MATCH_KEY)||"{}");if(!saved?.humanPlayers){toast("Configure a partida primeiro.");return false}if(saved.mode==="online"){return false}if(isPhoneMatch(saved)){if(manualSaveButton)manualSaveButton.disabled=true;startConnectedLobby(saved);return true}if(manualSaveButton)manualSaveButton.disabled=false;state={match:saved,players:buildPlayers(saved),round:1,totalRounds:Math.max(1,Number(saved.rounds||BOARD_CONFIG.defaultRounds||5)),turnIndex:0,currentMinigame:null,education:{concepts:[],disasters:[],technologies:[]},roundEvent:null,connected:false};renderSpaces();renderTokens();modeBadge.textContent=saved.presentationMode?"Apresentação STEAM":"Local";matchResultOverlay.classList.add("hidden");minigameOverlay.classList.add("hidden");api().showView?.("board");applyRoundEnvironmentEvent();updateTurnUi();setTimeout(()=>showTutorial(false),350);return true}
  itemClose?.addEventListener("click",closeItemOverlay);
  tutorialNext?.addEventListener("click",nextTutorial);
  tutorialSkip?.addEventListener("click",()=>closeTutorial(true));
  manualSaveButton?.addEventListener("click",()=>{
    if(!state)return;
    if(state.connected){toast("Saves completos de partidas com celulares entrarão depois.");return}
    checkpoint("board","manual");
    toast("Partida salva neste dispositivo.");
  });
  rollButton?.addEventListener("click",()=>rollForCurrentPlayer("pc"));$("#finalStartMinigame")?.addEventListener("click",()=>{
    const id=state?.currentMinigame?.id;
    if(["drone-route","slope-sensor","satellite-scale"].includes(id))startEduGame(id);
    else if(id==="just-dance")startPartyDance();
  });$("#finalReturnBoard")?.addEventListener("click",closeMinigame);$("#finalBoardExit")?.addEventListener("click",leaveBoard);$("#finalMatchBackMenu")?.addEventListener("click",leaveBoard);partyStart?.addEventListener("click",beginConnectedMatch);$("#finalPartyCancelLobby")?.addEventListener("click",leaveBoard);$("#finalPartyCopyLink")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(partyJoinUrl.textContent||"");toast("Link copiado.")}catch{toast("Não foi possível copiar automaticamente.")}});
  window.addEventListener("steam-party-room-state",e=>{const next=e.detail;if(!next||next.purpose!=="party-board-v2")return;roomState=next;renderLobby()});
  window.addEventListener("steam-party-dance-judgement",e=>{if(e.detail?.state)roomState=e.detail.state;danceBridge?.handleJudgement?.(e.detail)});
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
  window.STEAMPartyBoard=Object.freeze({
    start,
    startPresentation:()=>start({
      version:1,mode:"local",humanPlayers:1,controlMethod:"keyboard",
      bots:[{slot:2,difficulty:"normal"},{slot:3,difficulty:"normal"},{slot:4,difficulty:"normal"}],
      rounds:3,minigamesEnabled:true,motionMinigamesEnabled:false,
      presentationMode:true,
      forcedMinigames:["drone-route","slope-sensor","satellite-scale"],
      activeProfileId:"",savedAt:new Date().toISOString()
    }),
    showTutorial:()=>showTutorial(true),
    rollForCurrentPlayer,
    restoreFromSave,
    createCheckpoint:()=>checkpoint("board","manual"),
    getCurrentSave:()=>buildSavePayload("board","manual"),
    clearCheckpoint
  });
})();