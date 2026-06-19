import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useIsMobile } from '../utils/useIsMobile';

export default function Home() {
  const { state, dispatch } = useGame();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState('create');
  const [joinCode, setJoinCode] = useState('');
  const [nameInput, setNameInput] = useState(state.playerName || '');
  const [fromUrl, setFromUrl] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/join\/([A-Za-z]{6})/);
    if (match) {
      const code = match[1].toUpperCase();
      setJoinCode(code);
      setTab('join');
      setFromUrl(true);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const defaultSkin = state.playerSkin;

  const handleCreate = () => {
    const name = nameInput.trim();
    if (!name) return;
    dispatch({ type: 'SET_NAME', name });
    state.socket.emit('create-lobby', { playerName: name, skin: defaultSkin, deviceId: state.socket._deviceId });
  };

  const handleJoin = () => {
    const name = nameInput.trim();
    const code = joinCode.trim().toUpperCase();
    if (!name || code.length !== 6) return;
    dispatch({ type: 'SET_NAME', name });
    state.socket.emit('join-lobby', { code, playerName: name, skin: defaultSkin, deviceId: state.socket._deviceId });
  };

  const isCreate = tab === 'create' && !fromUrl;
  const canSubmit = isCreate ? !!nameInput.trim() : (!!nameInput.trim() && joinCode.length === 6);

  const decos = ['🎨','✏️','🖌️','🎭','🌈','⭐','🦄','🎉','🎊','🎪'];

  return (
    <div style={{ position: 'relative', minHeight: '100dvh', background: 'linear-gradient(135deg, #FFF5E4 0%, #f0ebff 50%, #e0f7f6 100%)', overflow: 'auto' }}>
      {!isMobile && decos.map((d, i) => (
        <span key={i} className="deco" style={{
          top: `${10 + (i * 9) % 80}%`, left: `${(i * 11) % 90}%`,
          fontSize: 24 + (i % 3) * 8, animationDelay: `${i * 0.4}s`, animationDuration: `${3 + i % 3}s`,
        }}>{d}</span>
      ))}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: isMobile ? '32px 20px' : '40px 20px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 36 }}>
          <div style={{ fontSize: isMobile ? 64 : 80, marginBottom: 6 }}>🎨</div>
          <h1 style={{ fontSize: isMobile ? 42 : 56, fontWeight: 900, color: 'var(--dark)', lineHeight: 1, letterSpacing: -2 }}>צַיָּירוֹן!</h1>
          <p style={{ fontSize: 14, color: '#888', fontWeight: 600, marginTop: 8 }}>צייר • נחש • שחק • תצחק 😂</p>
        </div>

        {/* Card */}
        <div className="card" style={{ width: '100%', maxWidth: 420, padding: isMobile ? '24px 20px' : 36 }}>

          {/* Invite banner */}
          {fromUrl && joinCode && (
            <div style={{ background: 'linear-gradient(135deg, #e0f7f6, #c8f0ee)', border: '2px solid var(--accent)', borderRadius: 14, padding: '14px 16px', marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 800 }}>הוזמנת להצטרף ללובי 🎉</div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 8, color: 'var(--dark)', fontFamily: 'monospace', marginTop: 6 }}>{joinCode}</div>
            </div>
          )}

          {/* Tabs */}
          {!fromUrl && (
            <div style={{ display: 'flex', background: '#f5f0ff', borderRadius: 50, padding: 4, marginBottom: 22, gap: 4 }}>
              {[['create','🏠 צור לובי'],['join','🚀 הצטרף']].map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: '11px 0', borderRadius: 50, border: 'none',
                  background: tab === t ? 'white' : 'transparent',
                  boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  fontFamily: 'Heebo, sans-serif', fontWeight: 700, fontSize: 15,
                  cursor: 'pointer', color: tab === t ? 'var(--primary)' : '#888',
                  transition: 'all 0.2s',
                }}>{label}</button>
              ))}
            </div>
          )}

          {/* Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#888', display: 'block', marginBottom: 7 }}>🙋 השם שלך</label>
            <input
              className="input"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') isCreate ? handleCreate() : handleJoin(); }}
              placeholder="שם שחקן..."
              maxLength={16}
              style={{ fontSize: 18, fontWeight: 700 }}
              autoFocus={!isMobile}
            />
          </div>

          {/* Join code */}
          {(tab === 'join' || fromUrl) && !fromUrl && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#888', display: 'block', marginBottom: 7 }}>🔑 קוד הלובי</label>
              <input
                className="input"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,6))}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="6 אותיות..."
                style={{ textAlign: 'center', letterSpacing: 8, fontSize: 24, fontWeight: 900 }}
                maxLength={6}
              />
            </div>
          )}

          {/* Submit button */}
          <button
            className={`btn btn-lg ${isCreate ? 'btn-primary' : 'btn-accent'}`}
            style={{ width: '100%', marginTop: 4 }}
            onClick={isCreate ? handleCreate : handleJoin}
            disabled={!canSubmit}
          >
            {isCreate ? '🏠 צור לובי חדש' : '🚀 הצטרף למשחק!'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 14, color: '#bbb', fontSize: 12 }}>
            {isCreate ? 'תוכל לעצב את הדמות שלך בלובי' : 'תוכל לעצב את הדמות שלך בלובי'} • עד 20 שחקנים
          </p>
        </div>
      </div>
    </div>
  );
}
