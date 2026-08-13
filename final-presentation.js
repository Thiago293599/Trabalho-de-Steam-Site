(() => {
  "use strict";
  document.getElementById("finalPresentationMode")?.addEventListener("click",()=>{
    if(!window.STEAMPartyBoard?.startPresentation){
      window.STEAMParty?.showToast?.("Modo apresentação indisponível.");
      return;
    }
    window.STEAMPartyBoard.startPresentation();
  });

  document.getElementById("finalReplayTutorial")?.addEventListener("click",()=>{
    try{localStorage.removeItem("steamPartyBoardTutorialSeenV1")}catch{}
    window.STEAMParty?.showToast?.("O tutorial aparecerá na próxima vez que entrar no tabuleiro.");
    window.STEAMParty?.showView?.("main");
  });
})();