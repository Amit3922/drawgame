import React from 'react';
import { useGame } from '../context/GameContext';
import PlayerAvatar from './PlayerAvatar';

export default function PlayerList({ showScores = false }) {
  const { state } = useGame();
  const myId = state.socket?.id;
  const sorted = showScores
    ? [...state.players].sort((a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0))
    : state.players;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {sorted.map((p, i) => {
        const isMe = p.id === myId;
        const isDrawer = p.id === state.currentDrawer;
        const guessed = state.guessedPlayers.includes(p.id);
        const score = state.scores[p.id] || 0;

        return (
          <div key={p.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            borderRadius: 14,
            background: isMe ? 'linear-gradient(135deg, #FFE8DF, #fff5f0)' : '#f8f6ff',
            border: isMe ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {showScores && (
              <span style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? '#FFD700' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : '#ccc', minWidth: 20 }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}
              </span>
            )}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <PlayerAvatar skin={p.skin} size={36}/>
              {p.isOwner && <span style={{ position: 'absolute', top: -6, right: -6, fontSize: 14 }}>👑</span>}
              {isDrawer && <span style={{ position: 'absolute', top: -6, left: -6, fontSize: 14 }}>✏️</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name} {isMe && <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 800 }}>(אני)</span>}
                {p.isSpectator && <span style={{ fontSize: 10, color: '#aaa', marginRight: 4 }}>👁️</span>}
              </div>
              {showScores && (
                <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{score} נקודות</div>
              )}
            </div>
            {guessed && showScores && (
              <span style={{ fontSize: 16 }}>✅</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
