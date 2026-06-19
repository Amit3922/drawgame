import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import DrawingCanvas from '../components/DrawingCanvas';
import Chat from '../components/Chat';
import PlayerList from '../components/PlayerList';
import PlayerAvatar from '../components/PlayerAvatar';

function RoundOverlay({ result, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(45,53,97,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', borderRadius: 28, padding: '40px 60px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'slideDown 0.4s ease' }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>⏰</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: 'var(--dark)' }}>הסיבוב נגמר!</h2>
        <p style={{ color: '#888', fontSize: 16 }}>המילה הייתה:</p>
        <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--primary)', marginTop: 8, letterSpacing: 2 }}>{result.word}</div>
      </div>
    </div>
  );
}

function GameOverScreen() {
  const { state, dispatch } = useGame();
  const winner = state.winner;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, var(--dark), #1a1f3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ textAlign: 'center', color: 'white', padding: 40 }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>🏆</div>
        <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 8 }}>המשחק נגמר!</h1>
        {winner && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 12, fontSize: 16 }}>🥇 המנצח:</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '16px 32px' }}>
              <PlayerAvatar skin={winner.skin} size={64}/>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{winner.name}</div>
                <div style={{ color: 'var(--secondary)', fontWeight: 700 }}>{state.scores[winner.id] || 0} נקודות</div>
              </div>
            </div>
          </div>
        )}
        {/* Scoreboard */}
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, marginBottom: 32, minWidth: 300 }}>
          <h3 style={{ marginBottom: 16, color: 'rgba(255,255,255,0.7)' }}>טבלת ניקוד</h3>
          {state.players.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < state.players.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <span style={{ fontSize: 18, minWidth: 28 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}</span>
              <PlayerAvatar skin={p.skin} size={36}/>
              <span style={{ flex: 1, fontWeight: 700 }}>{p.name}</span>
              <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>{state.scores[p.id] || 0}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'RESET' })}>
          🏠 חזור לבית
        </button>
      </div>
    </div>
  );
}

export default function Game() {
  const { state } = useGame();
  const myId = state.socket?.id;
  const [showRoundEnd, setShowRoundEnd] = useState(false);

  const isDrawer = state.currentDrawer === myId;
  const imOwner = state.owner === myId;
  const ownerPlayer = state.players.find(p => p.id === state.owner);
  const ownerIsSpectator = ownerPlayer?.isSpectator || false;
  const timePercent = state.settings.timeLimit > 0 ? (state.timeLeft / state.settings.timeLimit) * 100 : 100;
  const isDanger = state.timeLeft <= 10;

  useEffect(() => {
    if (state.roundResult) setShowRoundEnd(true);
  }, [state.roundResult]);

  const myPlayer = state.players.find(p => p.id === myId);
  const imSpectator = myPlayer?.isSpectator || false;

  const wordDisplay = () => {
    if (isDrawer || (imOwner && imSpectator && state.myWord)) {
      return state.myWord || state.maskedWord || '';
    }
    return state.maskedWord || '';
  };

  const drawerPlayer = state.players.find(p => p.id === state.currentDrawer);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'linear-gradient(135deg, #FFF5E4, #f0ebff)', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ background: 'white', borderBottom: '3px solid #f0ebff', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, flexWrap: 'wrap' }}>
        {/* Round */}
        <div style={{ background: '#f5f0ff', borderRadius: 50, padding: '6px 16px', fontWeight: 800, fontSize: 14, color: 'var(--dark)' }}>
          סיבוב {state.round}/{state.totalRounds}
        </div>

        {/* Word */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          {state.currentDrawer ? (
            <>
              <div style={{ fontSize: 11, color: '#aaa', fontWeight: 600, marginBottom: 2 }}>
                {isDrawer ? '✏️ המילה שלך לציור:' : imSpectator && imOwner ? '👁️ המילה (צופה):' : `🎨 ${state.drawerName} מציירr:`}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: isDrawer || (imOwner && imSpectator) ? 3 : 10, color: isDrawer ? 'var(--primary)' : 'var(--dark)', direction: 'rtl' }}>
                {wordDisplay()}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 16, color: '#aaa', fontWeight: 600 }}>🎮 המשחק מתחיל...</div>
          )}
        </div>

        {/* Timer */}
        <div style={{ textAlign: 'center', minWidth: 100 }}>
          <div style={{ fontSize: isDanger ? 28 : 22, fontWeight: 900, color: isDanger ? 'var(--error)' : 'var(--dark)', transition: 'all 0.3s', ...(isDanger ? { animation: 'pulse 0.5s ease-in-out infinite' } : {}) }}>
            ⏱️ {state.timeLeft}
          </div>
          <div className="timer-bar-wrap" style={{ marginTop: 4, width: 100 }}>
            <div className={`timer-bar ${isDanger ? 'danger' : ''}`} style={{ width: `${timePercent}%` }}/>
          </div>
        </div>

        {/* Scores summary */}
        {drawerPlayer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8f6ff', borderRadius: 50, padding: '6px 14px' }}>
            <PlayerAvatar skin={drawerPlayer.skin} size={28}/>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{drawerPlayer.name} מציירr</span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', gap: 12, padding: '12px 16px', overflow: 'hidden' }}>
        {/* Player list sidebar */}
        <div style={{ width: 200, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#888', marginBottom: 10 }}>👥 שחקנים</div>
            <PlayerList showScores={true}/>
          </div>
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden', minWidth: 0 }}>
          {/* Canvas */}
          <div style={{ flex: ownerIsSpectator && !isDrawer ? '1' : '1.4', overflow: 'hidden' }}>
            <DrawingCanvas isDrawer={isDrawer}/>
          </div>

          {/* Chat - shown to everyone except solo drawer when owner is spectator */}
          {!isDrawer && (
            <div style={{ width: 280, flexShrink: 0 }}>
              <Chat isDrawer={false}/>
            </div>
          )}

          {/* Drawer also gets mini chat (read only to see guesses) */}
          {isDrawer && (
            <div style={{ width: 240, flexShrink: 0 }}>
              <div style={{ background: 'white', borderRadius: 16, padding: 14, height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: 'var(--primary)' }}>✏️ אתה המצייר!</div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {state.messages.map((msg, i) => (
                    <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #f5f0ff', fontSize: 13 }}>
                      {msg.type === 'guessed' ? (
                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>✅ {msg.playerName} ניחש!</span>
                      ) : (
                        <span style={{ color: '#666' }}><b>{msg.playerName}:</b> {'●'.repeat(Math.min(msg.message?.length || 0, 8))}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8f6ff', borderRadius: 10, fontSize: 12, color: '#aaa', textAlign: 'center' }}>
                  {state.guessedPlayers.length}/{state.players.filter(p => !p.isSpectator && p.id !== myId).length} ניחשו
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Round end overlay */}
      {showRoundEnd && state.roundResult && (
        <RoundOverlay result={state.roundResult} onDone={() => setShowRoundEnd(false)}/>
      )}

      {/* Game over */}
      {state.gameState === 'ended' && <GameOverScreen/>}
    </div>
  );
}
