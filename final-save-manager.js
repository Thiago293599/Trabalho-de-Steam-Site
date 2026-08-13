(() => {
  "use strict";
  const SAVE_KEY="steamPartyBoardAutosaveV1",FORMAT="steam-party-save",VERSION=1;
  const $=(s,root=document)=>root.querySelector(s);

  function parse(raw,fallback=null){try{return JSON.parse(raw)}catch{return fallback}}
  function getSave(){
    const value=parse(localStorage.getItem(SAVE_KEY),null);
    if(!value||value.format!==FORMAT||Number(value.version)!==VERSION)return null;
    if(value.match?.mode!=="local"||!Array.isArray(value.board?.players)||!value.board.players.length)return null;
    return value;
  }
  function setSave(value){
    if(!value||value.format!==FORMAT||Number(value.version)!==VERSION)throw new Error("Save incompatível.");
    localStorage.setItem(SAVE_KEY,JSON.stringify(value));
    render();renderMenuCard();
    window.dispatchEvent(new CustomEvent("steam-party-save-updated",{detail:value}));
  }
  function deleteSave(show=true){
    localStorage.removeItem(SAVE_KEY);render();renderMenuCard();
    if(show)window.STEAMParty?.showToast?.("Save removido.");
  }
  function relativeTime(iso){
    const t=Date.parse(iso||"");if(!Number.isFinite(t))return"Data desconhecida";
    const d=Math.max(0,Date.now()-t);
    if(d<60000)return"Salvo agora";
    if(d<3600000)return`Salvo há ${Math.max(1,Math.round(d/60000))} min`;
    if(d<86400000)return`Salvo há ${Math.max(1,Math.round(d/3600000))} h`;
    return new Date(t).toLocaleString("pt-BR");
  }
  function phaseLabel(phase){
    return({"board":"Tabuleiro","minigame-intro":"Antes do minigame","post-minigame":"Minigame concluído"})[phase]||"Checkpoint";
  }
  function renderMenuCard(){
    const button=$("#finalContinueSaveCard"),summary=$("#finalContinueSaveSummary");
    if(!button||!summary)return;
    const save=getSave();
    button.classList.toggle("has-save",Boolean(save));
    if(!save){summary.textContent="Nenhuma partida local salva.";return}
    const b=save.board||{},next=b.players?.[b.turnIndex||0]?.name||"Jogador";
    summary.textContent=`Rodada ${b.round||1}/${b.totalRounds||1} • próxima vez: ${next}`;
  }
  function avatar(player){return window.STEAMParty?.avatarSvg?.(player,true)||""}
  function render(){
    const empty=$("#finalSaveEmpty"),card=$("#finalSaveCard");
    if(!empty||!card)return;
    const save=getSave();
    empty.classList.toggle("hidden",Boolean(save));
    card.classList.toggle("hidden",!save);
    if(!save)return;

    const b=save.board||{};
    $("#finalSaveTitle").textContent=`Rodada ${b.round||1} / ${b.totalRounds||1}`;
    $("#finalSaveTimestamp").textContent=relativeTime(save.savedAt);
    $("#finalSavePhase").textContent=phaseLabel(b.phase);
    $("#finalSaveMode").textContent="Local";
    $("#finalSavePlayerCount").textContent=String(b.players?.length||0);
    $("#finalSaveNextPlayer").textContent=b.players?.[b.turnIndex||0]?.name||"Jogador";

    const list=$("#finalSavePlayers");list.innerHTML="";
    (b.players||[]).forEach((player,index)=>{
      const item=document.createElement("div");
      item.className="final-save-player";
      item.innerHTML=`<span class="final-save-avatar">${avatar(player)}</span><span><strong></strong><small></small></span><b>${Math.round(Number(player.score||0))} pts</b>`;
      $("strong",item).textContent=player.name||`Jogador ${index+1}`;
      $("small",item).textContent=player.bot?`Bot • ${{easy:"Fácil",normal:"Normal",hard:"Difícil"}[player.difficulty]||"Normal"}`:`Casa ${Number(player.position||0)+1}`;
      list.appendChild(item);
    });
  }
  function resume(){
    const save=getSave();
    if(!save){window.STEAMParty?.showToast?.("Nenhuma partida salva.");return}
    const ok=window.STEAMPartyBoard?.restoreFromSave?.(save);
    if(!ok)window.STEAMParty?.showToast?.("Não foi possível restaurar esta partida.");
  }
  function exportSave(){
    const save=getSave();
    if(!save){window.STEAMParty?.showToast?.("Nenhuma partida para exportar.");return}
    const blob=new Blob([JSON.stringify({...save,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=`Partida_R${save.board?.round||1}.steamsave.json`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    window.STEAMParty?.showToast?.("Arquivo de partida exportado.");
  }
  async function importSave(file){
    if(!file)return;
    try{
      const value=JSON.parse(await file.text());
      if(value?.format!==FORMAT||Number(value?.version)!==VERSION||value?.match?.mode!=="local"||!Array.isArray(value?.board?.players)||!value.board.players.length)throw new Error();
      setSave({...value,savedAt:new Date().toISOString(),importedAt:new Date().toISOString(),reason:"import"});
      window.STEAMParty?.showToast?.("Partida importada.");
    }catch{window.STEAMParty?.showToast?.("Esse arquivo não é um save compatível.")}
  }

  $("#finalResumeSave")?.addEventListener("click",resume);
  $("#finalExportSave")?.addEventListener("click",exportSave);
  $("#finalDeleteSave")?.addEventListener("click",()=>deleteSave(true));
  $("#finalImportSave")?.addEventListener("change",e=>{importSave(e.target.files?.[0]);e.target.value=""});
  window.addEventListener("steam-party-save-updated",()=>{render();renderMenuCard()});
  window.addEventListener("storage",e=>{if(e.key===SAVE_KEY){render();renderMenuCard()}});

  window.STEAMPartySaves=Object.freeze({getSave,render,renderMenuCard,resume,exportSave,importSave,deleteSave});
  render();renderMenuCard();
})();