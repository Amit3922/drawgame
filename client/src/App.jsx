import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';

function ErrorToast() {
  const { state } = useGame();
  if (!state.error) return null;
  return <div className="error-toast">❌ {state.error}</div>;
}

function Router() {
  const { state } = useGame();

  return (
    <BrowserRouter>
      <ErrorToast />
      <Routes>
        <Route path="/" element={
          state.gameState === 'home' ? <Home /> :
          state.gameState === 'lobby' ? <Lobby /> :
          (state.gameState === 'playing' || state.gameState === 'ended') ? <Game /> :
          <Home />
        } />
        <Route path="/join/:code" element={<Home />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Router />
    </GameProvider>
  );
}
