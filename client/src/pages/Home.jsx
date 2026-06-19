import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import SkinCustomizer from '../components/SkinCustomizer';
import { useIsMobile } from '../utils/useIsMobile';

export default function Home() {
  const { state, dispatch } = useGame();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState('create');
  const [joinCode, setJoinCode] = useState('');
  const [nameInput, setNameInput] = useState(state.playerName || '');
  const [skin, setSkin] = useState(state.playerSkin);
  const [fromUrl, setFromUrl] = useState(false);
  const [showSkin, setShowSkin] = useState(false);

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

  const handleCreate = () => {
    if (!nameInput.trim()) return;
    dispatch({ type: 'SET_NAME', name: nameInput.trim() });
    dispatch({ type: 'SET_SKIN', skin });
    state.socket.emit('create-lobby', { playerName: nameInput.trim(), skin });
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (!nameInput.trim() || code.length !== 6) return;
    dispatch({ type: 'SET_NAME', name: nameInput.trim() });
    dispatch({ type: 'SET_SKIN', skin });
    state.socket.emit('join-lobby', { code, playerName: nameInput.trim(), skin });
  };

  const isCreate = tab === 'create' && !fromUrl;
  const canSubmit = isCreate ? !!nameInput.trim() : (!!nameInput.trim() && joinCode.length === 6);

  const decos = ['🎨','✏️','🖌️','🎭','🌈','⭐','🦄','🎉','🎊','🎪'];

  return (
    <div className="page" style={{ position: 'relative', minHeight: '100dvh', background: 'linear-gradient(135deg, #FFF5E4 0%, #f0ebff 50%, #e0f7f6 100%)', overflow: 'auto' }}>
      {!isMobile && decos.map((d, i) => (
        <span key={i} className="deco" style={{
          top: `${10 + (i * 9) % 80}%`, left: `${(i * 11) % 90}%`,
          fontSize: 24 + (i % 3) * 8, animationDelay: `${i * 0.4}s`, animationDuration: `${3 + i % 3}s`,
        }}>{d}</span>
      ))}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: isMobile ? '20px 16px' : '40px 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 16 : 32 }}>
          <div style={{ fontSize: isMobile ? 44 : 72, marginBottom: 4 }}>🎨</div>
          <h1 style={{ fontSize: isMobile ? 34 : 52, fontWeight: 900, color: 'var(--dark)', lineHeight: 1, letterSpacing: -2 }}>צַיָּירוֹן!</h1>
          <p style={{ fontSize: 13, color: '#888', fontWeight: 600, marginTop: 6 }}>צייר • נחש • שחק • תצחק 😂</p>
        </div>

        <div className="card" style={{ width: '100%', maxWidth: 500, padding: isMobile ? '16px' : 32 }}>

          {fromUrl && joinCode && (
            <div style={{ background: 'linear-gradient(135deg, #e0f7f6, #c8f0ee)', border: '2px solid var(--accent)', borderRadius: 14, padding: '12px 16px', marginBottom: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 800 }}>הוזמנת להצטרף ללובי 🎉</div>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 8, color: 'var(--dark)', fontFamily: 'monospace', marginTop: 4 }}>{joinCode}</div>
            </div>
          )}

          {!fromUrl && (
            <div style={{ display: 'flex', background: '#f5f0ff', borderRadius: 50, padding: 4, marginBottom: 16, gap: 4 }}>
              {[['create','🏠 צור לובי'],['join','🚀 הצטרף']].map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 50, border: 'none',
                  background: tab === t ? 'white' : 'transparent',
                  boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  fontFamily: 'Heebo, sans-serif', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', color: tab === t ? 'var(--primary)' : '#888',
                  transition: 'all 0.2s',
                }}>{label}</button>
              ))}
            </div>
          )}

          {/* Name input */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 6 }}>🙋 השם שלך</label>
            <input
              className="input"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') isCreate ? handleCreate() : handleJoin(); }}
              placeholder="שם שחקן..."
              maxLength={16}
              style={{ fontSize: 17, fontWeight: 700 }}
              autoFocus={!isMobile}
            />
          </div>

          {/* Join code */}
          {(tab === 'join' || fromUrl) && !fromUrl && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 6 }}>🔑 קוד הלובי</label>
              <input
                className="input"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,6))}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="6 אותיות..."
                style={{ textAlign: 'center', letterSpacing: 8, fontSize: 22, fontWeight: 900 }}
                maxLength={6}
              />
            </div>
          )}

          {/* Action button — BEFORE skin customizer so it's visible on mobile */}
          <button
            className={`btn btn-lg ${isCreate ? 'btn-primary' : 'btn-accent'}`}
            style={{ width: '100%', marginBottom: 14 }}
            onClick={isCreate ? handleCreate : handleJoin}
            disabled={!canSubmit}
          >
            {isCreate ? '🏠 צור לובי חדש' : '🚀 הצטרף למשחק!'}
          </button>

          {/* Skin customizer — collapsible on mobile */}
          <div>
            <button onClick={() => setShowSkin(v => !v)} style={{
              width: '100%', padding: '10px 16px', border: '2px solid #e8e0f0', borderRadius: 14,
              background: 'white', cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
              fontWeight: 700, fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>🎨 עצב את הדמות שלך</span>
              <span style={{ fontSize: 11 }}>{showSkin ? '▲ סגור' : '▼ פתח'}</span>
            </button>
            {showSkin && (
              <div style={{ marginTop: 12 }}>
                <SkinCustomizer skin={skin} onChange={setSkin} />
              </div>
            )}
          </div>
        </div>

        <p style={{ marginTop: 14, color: '#bbb', fontSize: 12 }}>עד 20 שחקנים בלובי אחד 🎉</p>
      </div>
    </div>
  );
}
