import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const GameContext = createContext(null);

const initialState = {
  socket: null,
  playerName: '',
  playerSkin: { bodyColor: 0, eyeStyle: 0, hatStyle: 0, mouthStyle: 0 },
  lobbyCode: null,
  players: [],
  owner: null,
  isOwner: false,
  isSpectator: false,
  gameState: 'home',
  settings: { timeLimit: 80, rounds: 3, wordMode: 'random', customWords: [] },
  currentDrawer: null,
  myWord: null,
  myWordSpectating: false,
  maskedWord: null,
  wordLen: 0,
  round: 1,
  totalRounds: 3,
  timeLeft: 80,
  scores: {},
  messages: [],
  guessedPlayers: [],
  drawerName: '',
  drawerSkin: null,
  roundResult: null,
  ownerIsSpectator: false,
  error: null,
  qrData: null,
  reconnecting: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_NAME': return { ...state, playerName: action.name };
    case 'SET_SKIN': return { ...state, playerSkin: action.skin };
    case 'SET_SOCKET': return { ...state, socket: action.socket };
    case 'SET_ERROR': return { ...state, error: action.error };
    case 'CLEAR_ERROR': return { ...state, error: null };
    case 'SET_RECONNECTING': return { ...state, reconnecting: action.value };

    case 'LOBBY_CREATED':
    case 'LOBBY_JOINED':
      return {
        ...state,
        lobbyCode: action.code,
        players: action.players,
        settings: action.settings,
        owner: action.owner,
        isOwner: action.type === 'LOBBY_CREATED',
        isSpectator: false,
        gameState: 'lobby',
        messages: [],
        scores: {},
        roundResult: null,
        reconnecting: false,
      };

    case 'REJOINED': {
      const myId = state.socket?.id;
      const base = {
        ...state,
        lobbyCode: action.code,
        players: action.players,
        settings: action.settings,
        owner: action.owner,
        isOwner: action.owner === myId,
        isSpectator: action.players.find(p => p.id === myId)?.isSpectator || false,
        scores: action.scores || {},
        reconnecting: false,
      };
      if (action.gameState === 'lobby') {
        return { ...base, gameState: 'lobby', messages: [], roundResult: null };
      }
      if (action.gameState === 'playing') {
        return {
          ...base,
          gameState: 'playing',
          ownerIsSpectator: action.ownerIsSpectator,
          currentDrawer: action.currentDrawer,
          drawerName: action.drawerName,
          drawerSkin: action.drawerSkin,
          maskedWord: action.masked,
          wordLen: action.wordLen,
          round: action.round,
          totalRounds: action.totalRounds,
          timeLeft: action.timeLeft,
          messages: [],
          guessedPlayers: [],
          roundResult: null,
          myWord: null,
        };
      }
      return base;
    }

    case 'PLAYERS_UPDATE':
      return {
        ...state,
        players: action.players,
        owner: action.newOwner || state.owner,
        isOwner: (action.newOwner || state.owner) === state.socket?.id,
        isSpectator: action.players.find(p => p.id === state.socket?.id)?.isSpectator || false,
      };

    case 'SETTINGS_UPDATE':
      return { ...state, settings: action.settings };

    case 'GAME_STARTED':
      return {
        ...state,
        gameState: 'playing',
        ownerIsSpectator: action.ownerIsSpectator,
        messages: [],
        guessedPlayers: [],
        roundResult: null,
        myWord: null,
        maskedWord: null,
      };

    case 'ROUND_START':
      return {
        ...state,
        currentDrawer: action.drawer,
        drawerName: action.drawerName,
        drawerSkin: action.drawerSkin,
        round: action.round,
        totalRounds: action.totalRounds,
        timeLeft: action.timeLimit,
        maskedWord: action.masked,
        wordLen: action.wordLen,
        guessedPlayers: [],
        roundResult: null,
        myWord: null,
        myWordSpectating: false,
      };

    case 'YOUR_WORD':
      return { ...state, myWord: action.word, maskedWord: action.masked, myWordSpectating: action.spectating || false };

    case 'TICK':
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) };

    case 'ROUND_END':
      return { ...state, roundResult: { word: action.word }, scores: action.scores, myWord: null };

    case 'CHAT_MESSAGE':
      return { ...state, messages: [...state.messages, { type: 'chat', ...action }] };

    case 'PLAYER_GUESSED':
      return {
        ...state,
        guessedPlayers: [...state.guessedPlayers, action.playerId],
        scores: action.scores,
        messages: [...state.messages, { type: 'guessed', playerName: action.playerName, skin: action.skin, pts: action.pts }],
      };

    case 'GAME_OVER':
      localStorage.removeItem('drawgame_session');
      return { ...state, gameState: 'ended', scores: action.scores, players: action.players, winner: action.winner };

    case 'QR_CODE':
      return { ...state, qrData: action };
    case 'PUBLIC_URL':
      return { ...state, publicUrl: action.url };

    case 'RESET':
      localStorage.removeItem('drawgame_session');
      return { ...initialState, socket: state.socket };

    default: return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timerRef = useRef(null);
  // Keep a ref to current state for use inside socket callbacks
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const socket = io('/', { path: '/socket.io', transports: ['websocket', 'polling'] });
    dispatch({ type: 'SET_SOCKET', socket });

    // On connect / reconnect — try to restore session from localStorage
    socket.on('connect', () => {
      const raw = localStorage.getItem('drawgame_session');
      if (raw) {
        try {
          const { code, playerName, skin } = JSON.parse(raw);
          dispatch({ type: 'SET_RECONNECTING', value: true });
          socket.emit('rejoin-lobby', { code, playerName, skin });
        } catch { localStorage.removeItem('drawgame_session'); }
      }
    });

    socket.on('lobby-created', d => {
      localStorage.setItem('drawgame_session', JSON.stringify({
        code: d.code,
        playerName: stateRef.current.playerName,
        skin: stateRef.current.playerSkin,
      }));
      dispatch({ type: 'LOBBY_CREATED', ...d });
    });

    socket.on('lobby-joined', d => {
      localStorage.setItem('drawgame_session', JSON.stringify({
        code: d.code,
        playerName: stateRef.current.playerName,
        skin: stateRef.current.playerSkin,
      }));
      dispatch({ type: 'LOBBY_JOINED', ...d });
    });

    socket.on('rejoined', d => {
      dispatch({ type: 'REJOINED', ...d });
      // Restart timer if mid-game
      if (d.gameState === 'playing' && d.timeLeft > 0) {
        clearInterval(timerRef.current);
        let t = d.timeLeft;
        timerRef.current = setInterval(() => {
          t--;
          dispatch({ type: 'TICK' });
          if (t <= 0) clearInterval(timerRef.current);
        }, 1000);
      }
    });

    socket.on('players-update', d => dispatch({ type: 'PLAYERS_UPDATE', ...d }));
    socket.on('settings-update', d => dispatch({ type: 'SETTINGS_UPDATE', ...d }));
    socket.on('game-started', d => dispatch({ type: 'GAME_STARTED', ...d }));

    socket.on('round-start', d => {
      dispatch({ type: 'ROUND_START', ...d });
      clearInterval(timerRef.current);
      let t = d.timeLimit;
      timerRef.current = setInterval(() => {
        t--;
        dispatch({ type: 'TICK' });
        if (t <= 0) clearInterval(timerRef.current);
      }, 1000);
    });

    socket.on('your-word', d => dispatch({ type: 'YOUR_WORD', ...d }));
    socket.on('round-end', d => { clearInterval(timerRef.current); dispatch({ type: 'ROUND_END', ...d }); });
    socket.on('chat-message', d => dispatch({ type: 'CHAT_MESSAGE', ...d }));
    socket.on('player-guessed', d => dispatch({ type: 'PLAYER_GUESSED', ...d }));
    socket.on('game-over', d => dispatch({ type: 'GAME_OVER', ...d }));
    socket.on('qr-code', d => dispatch({ type: 'QR_CODE', ...d }));
    socket.on('public-url', d => dispatch({ type: 'PUBLIC_URL', url: d.url }));
    socket.on('error', d => {
      dispatch({ type: 'SET_RECONNECTING', value: false });
      dispatch({ type: 'SET_ERROR', error: d.msg });
      setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 3500);
    });

    return () => { socket.disconnect(); clearInterval(timerRef.current); };
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() { return useContext(GameContext); }
