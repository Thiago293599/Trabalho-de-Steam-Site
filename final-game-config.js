(() => {
  "use strict";
  window.STEAM_PARTY_CONFIG = Object.freeze({
    version: "0.6.0-party-dance-alpha",
    workingTitle: "Missão: Prevenir Desastres",
    titleIsProvisional: true,
    theme: "Tecnologia, Matemática e Desastres Ambientais",
    maxPlayers: 4,

    board: Object.freeze({
      diceMin: 1,
      diceMax: 10,
      visualDiceFaces: 6,
      minigameAfterRound: true,
      defaultRounds: 5,
      supportedRounds: Object.freeze([5, 10, 15]),
      spaces: 28,
      minigameReward: 10
    }),

    controls: Object.freeze({
      keyboard: Object.freeze({
        id: "keyboard",
        label: "Teclado",
        sensors: false
      }),
      phoneTouch: Object.freeze({
        id: "phone-touch",
        label: "Celular sem sensores",
        sensors: false
      }),
      phoneMotion: Object.freeze({
        id: "phone-motion",
        label: "Celular com sensores",
        sensors: true
      })
    }),

    justDance: Object.freeze({
      controllerOrientation: "portrait",
      generalControllerOrientation: "landscape",
      scoreMax: 13333,
      goldMoveDevMs: 1500,
      lyricsSize: "normal",
      syncMs: Object.freeze({
        WhereHaveYou: -1900,
        RainOverMe: -1725
      })
    }),

    minigameCompatibility: Object.freeze({
      samePcTwoOrMoreHumans: "disabled",
      phoneTouch: "enabled-no-motion",
      phoneMotion: "enabled-all",
      singlePlayerKeyboard: "enabled-no-motion"
    })
  });
})();