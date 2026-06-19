import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import PlayerAvatar from './PlayerAvatar';

export default function Chat({ isDrawer }) {
  const { state } = useGame();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const send = (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || isDrawer) return;
    state.socket.emit('chat-message', { message: msg });
    setInput('');
  };

  const myId = state.socket?.id;
  const alreadyGuessed = state.guessedPlayers.includes(myId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '2.5px solid #f0ebff' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, var(--primary), #ff9a5c)', color: 'white', fontWeight: 800, fontSize: 15 }}>
        💬 ניחושים
        {alreadyGuessed && <span style={{ marginRight: 8, fontSize: 13, opacity: 0.9 }}>✅ ניחשת!</span>}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {state.messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#bbb', marginTop: 30, fontSize: 14 }}>
            <div style={{ fontSize: 32 }}>🤔</div>
            נסו לנחש את הציור!
          </div>
        )}
        {state.messages.map((msg, i) => {
          if (msg.type === 'guessed') {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#E8F8E5', borderRadius: 12, padding: '8px 12px', border: '1.5px solid #c3ead0' }}>
                <PlayerAvatar skin={msg.skin} size={30}/>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2d7a3a' }}>
                  {msg.playerName} ניחש! 🎉 +{msg.pts} נקודות
                </span>
              </div>
            );
          }
          const isMe = msg.playerId === myId;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexDirection: isMe ? 'row-reverse' : 'row' }}>
              <PlayerAvatar skin={msg.skin} size={28}/>
              <div style={{ maxWidth: '70%' }}>
                <div style={{ fontSize: 10, color: '#aaa', marginBottom: 2, textAlign: isMe ? 'left' : 'right' }}>{msg.playerName}</div>
                <div style={{
                  background: isMe ? 'var(--primary)' : '#f5f0ff',
                  color: isMe ? 'white' : 'var(--text)',
                  padding: '7px 12px',
                  borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  fontSize: 14,
                  fontWeight: 500,
                  wordBreak: 'break-word',
                }}>
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <form onSubmit={send} style={{ padding: '10px 12px', borderTop: '2px solid #f5f0ff', display: 'flex', gap: 8 }}>
        {isDrawer ? (
          <div style={{ flex: 1, textAlign: 'center', color: '#aaa', fontSize: 13, padding: '10px 0' }}>
            אתה מצייר — אל תגלה! 🤫
          </div>
        ) : alreadyGuessed ? (
          <div style={{ flex: 1, textAlign: 'center', color: '#4caf50', fontSize: 14, fontWeight: 700, padding: '10px 0' }}>
            ✅ כל הכבוד! ניחשת נכון!
          </div>
        ) : (
          <>
            <input
              className="input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="הכנס ניחוש..."
              style={{ flex: 1, padding: '9px 14px', fontSize: 14 }}
              autoComplete="off"
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!input.trim()}>
              שלח
            </button>
          </>
        )}
      </form>
    </div>
  );
}
