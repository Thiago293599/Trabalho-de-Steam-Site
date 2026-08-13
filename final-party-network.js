(() => {
  "use strict";

  const configured = String(window.GAME_CONFIG?.SERVER_URL || "").trim().replace(/\/+$/, "");
  let socket = null;
  let roomCode = "";
  let roomState = null;
  let connecting = null;

  function dispatch(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function serverUrl() {
    if (!configured || configured.includes("SEU-PC.SEU-TAILNET") || configured === "undefined") return "";
    return configured;
  }

  function connect() {
    if (socket?.connected) return Promise.resolve(socket);
    if (connecting) return connecting;
    connecting = new Promise((resolve, reject) => {
      if (typeof io !== "function" || !serverUrl()) {
        connecting = null;
        reject(new Error("Servidor não configurado."));
        return;
      }
      if (!socket) {
        socket = io(serverUrl(), {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 700,
          reconnectionDelayMax: 3000
        });
        socket.on("room:state", state => {
          if (!state || state.roomCode !== roomCode) return;
          roomState = state;
          dispatch("steam-party-room-state", state);
        });
        socket.on("party:state", state => {
          if (!state || state.roomCode !== roomCode) return;
          dispatch("steam-party-state", state);
        });
        socket.on("party:action", action => {
          if (!action || action.roomCode !== roomCode) return;
          dispatch("steam-party-action", action);
        });
        socket.on("party:presence", payload => {
          if (!payload || payload.roomCode !== roomCode) return;
          dispatch("steam-party-presence", payload);
        });
        socket.on("party:player-timeout", payload => {
          if (!payload || payload.roomCode !== roomCode) return;
          dispatch("steam-party-player-timeout", payload);
        });
        socket.on("dev:dance-judgement", payload => {
          if (!payload || payload.roomCode !== roomCode) return;
          dispatch("steam-party-dance-judgement", payload);
        });
        socket.on("dev:sensor-data", payload => {
          if (!payload || payload.roomCode !== roomCode) return;
          dispatch("steam-party-sensor-data", payload);
        });
        socket.on("dev:dance-reset", payload => {
          if (!payload || payload.roomCode !== roomCode) return;
          dispatch("steam-party-dance-reset", payload);
        });
        socket.on("room:closed", payload => {
          if (!payload || payload.roomCode !== roomCode) return;
          dispatch("steam-party-room-closed", payload);
          roomCode = "";
          roomState = null;
        });
      }
      const done = () => {
        connecting = null;
        resolve(socket);
      };
      if (socket.connected) done();
      else {
        const timer = setTimeout(() => {
          connecting = null;
          reject(new Error("Servidor não respondeu."));
        }, 7000);
        socket.once("connect", () => { clearTimeout(timer); done(); });
        socket.once("connect_error", () => { clearTimeout(timer); connecting = null; reject(new Error("Falha ao conectar.")); });
      }
    });
    return connecting;
  }

  function emitAck(event, payload, timeout = 7000) {
    return connect().then(sock => new Promise((resolve, reject) => {
      sock.timeout(timeout).emit(event, payload, (error, response) => {
        if (error) reject(new Error("O servidor não respondeu."));
        else if (!response?.ok) reject(new Error(response?.message || "Ação recusada pelo servidor."));
        else resolve(response);
      });
    }));
  }

  async function createRoom() {
    await connect();
    const response = await emitAck("host:create-room", { purpose: "party-board-v2" });
    roomCode = response.roomCode;
    roomState = response.state;
    dispatch("steam-party-room-state", roomState);
    return {
      ...response,
      joinUrl: `${location.origin}${location.pathname.replace(/[^/]*$/, "")}controller.html?room=${encodeURIComponent(roomCode)}&party=1`,
      qrUrl: `${serverUrl()}/api/qr?text=${encodeURIComponent(`${location.origin}${location.pathname.replace(/[^/]*$/, "")}controller.html?room=${encodeURIComponent(roomCode)}&party=1`)}`
    };
  }

  function startParty(expectedHumans, state) {
    return emitAck("host:party-start", { roomCode, expectedHumans, state });
  }

  function publishState(state) {
    if (!roomCode || !socket?.connected) return Promise.resolve(null);
    return emitAck("host:party-state", { roomCode, state }, 4500).catch(() => null);
  }


  function setSensorMode(enabled, purpose="dance") {
    if (!roomCode) return Promise.reject(new Error("Sala não criada."));
    return emitAck("host:sensor-mode", { roomCode, enabled: Boolean(enabled), purpose:String(purpose||"dance") });
  }

  function publishDanceSession(payload) {
    if (!roomCode) return Promise.reject(new Error("Sala não criada."));
    return emitAck("host:dance-session", { ...payload, roomCode }, 4500);
  }

  function resetDanceScore() {
    if (!roomCode) return Promise.reject(new Error("Sala não criada."));
    return emitAck("host:sensor-reset", { roomCode }, 4500);
  }

  function closeRoom() {
    if (roomCode && socket) socket.emit("host:close-room", { roomCode });
    roomCode = "";
    roomState = null;
  }

  window.STEAMPartyNetwork = Object.freeze({
    createRoom,
    startParty,
    publishState,
    setSensorMode,
    publishDanceSession,
    resetDanceScore,
    closeRoom,
    getRoomCode: () => roomCode,
    getRoomState: () => roomState,
    getServerUrl: serverUrl
  });
})();