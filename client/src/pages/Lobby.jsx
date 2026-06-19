import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useGame } from '../context/GameContext';
import SkinCustomizer from '../components/SkinCustomizer';
import PlayerAvatar from '../components/PlayerAvatar';
import { useIsMobile } from '../utils/useIsMobile';

export default function Lobby() {
  const { state, dispatch } = useGame();
  const isMobile = useIsMobile();
  const [skin, setSkin] = useState(state.playerSkin);
  const [settings, setSettings] = useState(state.settings);
  const [customWordsInput, setCustomWordsInput] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('players'); // mobile tabs: players | skin | settings
  const myId = state.socket?.id;

  const joinUrl = `${window.location.origin}/join/${state.lobbyCode}`;

  useEffect(() => {
    if (!state.lobbyCode) return;
    QRCode.toDataURL(joinUrl, { width: 220, margin: 1, color: { dark: '#2D3561', light: '#FFF5E4' } })
      .then(setQrDataUrl).catch(console.error);
  }, [joinUrl]);

  useEffect(() => { setSettings(state.settings); }, [state.settings]);

  const updateSkin = (newSkin) => {
    setSkin(newSkin);
    dispatch({ type: 'SET_SKIN', skin: newSkin });
    state.socket.emit('update-skin', { skin: newSkin });
  };

  const updateSettings = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    state.socket.emit('update-settings', { settings: next });
  };

  const toggleSpectator = () => state.socket.emit('toggle-spectator', { isSpectator: !state.isSpectator });
  const startGame = () => state.socket.emit('start-game');

  const applyCustomWords = () => {
    const words = customWordsInput.split(/[\n,]+/).map(w => w.trim()).filter(Boolean);
    updateSettings({ customWords: words, wordMode: 'custom' });
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(joinUrl); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activePlayers = state.players.filter(p => !p.isSpectator);
  const canStart = activePlayers.length >= 2;

  // ── Mobile layout ──────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', minHeight: '100vh', background: '#f5f0ff', overflow: 'hidden' }}>

        {/* Mobile top bar */}
        <div style={{ background: 'white', padding: '12px 16px', borderBottom: '2px solid #f0ebff', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700 }}>קוד לובי</div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 5, color: 'var(--primary)', fontFamily: 'monospace' }}>{state.lobbyCode}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowQR(true)} style={{ fontSize: 12, padding: '7px 12px' }}>📱 QR</button>
              <button className="btn btn-accent btn-sm" onClick={copyLink} style={{ fontSize: 12, padding: '7px 12px' }}>
                {copied ? '✅' : '📋 לינק'}
              </button>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{state.players.length}/20 שחקנים • {state.isOwner ? 'אתה המנהל 👑' : 'מחכים להתחלה...'}</div>
        </div>

        {/* Mobile tab bar */}
        <div style={{ display: 'flex', background: 'white', borderBottom: '2px solid #f0ebff', flexShrink: 0 }}>
          {[['players','👥 שחקנים'], ['skin','🎨 דמות'], ...(state.isOwner ? [['settings','⚙️ הגדרות']] : [])].map(([t, label]) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              flex: 1, padding: '10px 4px', border: 'none', borderBottom: activeTab === t ? '3px solid var(--primary)' : '3px solid transparent',
              background: 'white', color: activeTab === t ? 'var(--primary)' : '#888',
              fontFamily: 'Heebo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>

        {/* Mobile tab content */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}>
          {activeTab === 'skin' && (
            <div style={{ background: 'white', borderRadius: 16, padding: 16 }}>
              <SkinCustomizer skin={skin} onChange={updateSkin} />
            </div>
          )}

          {activeTab === 'players' && (
            <div style={{ background: 'white', borderRadius: 16, padding: 16 }}>
              <h3 style={{ fontWeight: 800, marginBottom: 12, fontSize: 15 }}>👥 שחקנים</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {state.players.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: p.id === myId ? '#FFF5E4' : '#f8f6ff', border: p.id === myId ? '2px solid var(--primary)' : '2px solid transparent' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <PlayerAvatar skin={p.skin} size={40}/>
                      {p.isOwner && <span style={{ position: 'absolute', top: -5, right: -5, fontSize: 14 }}>👑</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name} {p.id === myId && <span style={{ color: 'var(--primary)', fontSize: 11 }}>(אני)</span>}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{p.isSpectator ? '👁️ צופה' : '🎮 שחקן'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && state.isOwner && (
            <div style={{ background: 'white', borderRadius: 16, padding: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 6 }}>⏱️ זמן לסיבוב: {settings.timeLimit} שניות</label>
                <input type="range" min={20} max={180} step={10} value={settings.timeLimit}
                  onChange={e => updateSettings({ timeLimit: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}/>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 6 }}>🔄 סיבובים: {settings.rounds}</label>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[1,2,3,4,5,6].map(n => (
                    <button key={n} onClick={() => updateSettings({ rounds: n })} style={{
                      flex: 1, padding: '8px 0', borderRadius: 9,
                      border: settings.rounds === n ? 'none' : '2px solid #e8e0f0',
                      background: settings.rounds === n ? 'var(--primary)' : 'white',
                      color: settings.rounds === n ? 'white' : '#666',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
                    }}>{n}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 6 }}>📝 מילים</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[['random','🎲 אקראי'],['custom','✍️ מותאם']].map(([val,label]) => (
                    <button key={val} onClick={() => updateSettings({ wordMode: val })} style={{
                      flex: 1, padding: '10px 0', borderRadius: 10,
                      border: settings.wordMode === val ? 'none' : '2px solid #e8e0f0',
                      background: settings.wordMode === val ? 'var(--accent)' : 'white',
                      color: settings.wordMode === val ? 'white' : '#666',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
                    }}>{label}</button>
                  ))}
                </div>
              </div>
              {settings.wordMode === 'custom' && (
                <div style={{ marginBottom: 16 }}>
                  <textarea value={customWordsInput} onChange={e => setCustomWordsInput(e.target.value)}
                    placeholder={'כלב\nחתול\nבית'} rows={4}
                    style={{ width: '100%', padding: '8px 12px', border: '2px solid #e8e0f0', borderRadius: 10, fontFamily: 'Heebo, sans-serif', fontSize: 13, resize: 'vertical', outline: 'none', direction: 'rtl' }}/>
                  <button className="btn btn-accent btn-sm" style={{ marginTop: 6, width: '100%' }} onClick={applyCustomWords}>
                    שמור {customWordsInput.split(/[\n,]+/).filter(w=>w.trim()).length} מילים
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '2px solid #f5f0ff' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>👁️ שחק כצופה</span>
                <button onClick={toggleSpectator} style={{
                  width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: state.isSpectator ? 'var(--primary)' : '#ddd', position: 'relative', transition: 'background 0.2s',
                }}>
                  <span style={{ position: 'absolute', top: 3, left: state.isSpectator ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}/>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile start button */}
        {state.isOwner && (
          <div style={{ padding: '12px 16px', background: 'white', borderTop: '2px solid #f0ebff', flexShrink: 0 }}>
            <button className="btn btn-primary btn-lg pulse" style={{ width: '100%' }} onClick={startGame} disabled={!canStart}>
              {canStart ? '🚀 התחל משחק!' : `עוד ${2 - activePlayers.length} שחקנים נדרשים`}
            </button>
          </div>
        )}

        {/* QR Modal */}
        {showQR && (
          <div onClick={() => setShowQR(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#FFF5E4', borderRadius: 24, padding: 28, textAlign: 'center', width: '100%', maxWidth: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
              <h2 style={{ margin: '0 0 6px', fontWeight: 900, fontSize: 20 }}>📱 שתף עם חברים</h2>
              <p style={{ color: '#aaa', fontSize: 13, margin: '0 0 16px' }}>סרוק או שלח את הלינק</p>
              {qrDataUrl ? <img src={qrDataUrl} alt="QR" style={{ width: 200, height: 200, borderRadius: 14, border: '4px solid white', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}/> : <div className="spinner"/>}
              <div style={{ marginTop: 12, fontFamily: 'monospace', fontSize: 22, fontWeight: 900, letterSpacing: 6, color: 'var(--primary)' }}>{state.lobbyCode}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
                <button className="btn btn-accent btn-sm" onClick={copyLink}>{copied ? '✅ הועתק!' : '📋 העתק'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowQR(false)}>סגור</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Desktop layout ──────────────────────────────────────────
  return (
    <div className="page" style={{ background: 'linear-gradient(135deg, #FFF5E4, #f0ebff)', minHeight: '100vh' }}>
      <div style={{ background: 'white', borderBottom: '3px solid #f0ebff', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--dark)', margin: 0 }}>🏠 הלובי</h1>
          <p style={{ color: '#aaa', margin: 0, fontSize: 13 }}>מחכים שכולם יצטרפו... ({state.players.length}/20)</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa' }}>קוד לובי</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 6, color: 'var(--primary)', fontFamily: 'monospace' }}>{state.lobbyCode}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowQR(true)}>📱 QR</button>
          <button className="btn btn-accent btn-sm" onClick={copyLink}>{copied ? '✅ הועתק!' : '📋 העתק לינק'}</button>
        </div>
      </div>

      {showQR && (
        <div onClick={() => setShowQR(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FFF5E4', borderRadius: 28, padding: 36, textAlign: 'center', maxWidth: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <h2 style={{ margin: '0 0 6px', fontWeight: 900, fontSize: 22 }}>📱 שתף עם חברים</h2>
            <p style={{ color: '#aaa', fontSize: 13, margin: '0 0 20px' }}>סרוק או שלח את הלינק</p>
            {qrDataUrl ? <img src={qrDataUrl} alt="QR" style={{ width: 220, height: 220, borderRadius: 16, border: '4px solid white', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}/> : <div className="spinner"/>}
            <div style={{ marginTop: 16, fontFamily: 'monospace', fontSize: 24, fontWeight: 900, letterSpacing: 6, color: 'var(--primary)' }}>{state.lobbyCode}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#aaa', wordBreak: 'break-all' }}>{joinUrl}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center' }}>
              <button className="btn btn-accent" onClick={copyLink}>{copied ? '✅ הועתק!' : '📋 העתק לינק'}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowQR(false)}>סגור</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 300px', gap: 16, maxWidth: 1100, margin: '16px auto', padding: '0 16px', alignItems: 'start' }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 12, fontSize: 15 }}>👥 שחקנים</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {state.players.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: p.id === myId ? '#FFF5E4' : '#f8f6ff', border: p.id === myId ? '2px solid var(--primary)' : '2px solid transparent' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <PlayerAvatar skin={p.skin} size={40}/>
                  {p.isOwner && <span style={{ position: 'absolute', top: -5, right: -5, fontSize: 14 }}>👑</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name} {p.id === myId && <span style={{ color: 'var(--primary)', fontSize: 10 }}>(אני)</span>}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{p.isSpectator ? '👁️ צופה' : '🎮 שחקן'}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', background: '#f0ebff', borderRadius: 12, fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 1.6 }}>📤 שתף את הלינק כדי שחברים יצטרפו</div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: 15 }}>🎨 עצב את הדמות שלך</h3>
          <SkinCustomizer skin={skin} onChange={updateSkin} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {state.isOwner ? (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15 }}>⚙️ הגדרות משחק</h3>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 6 }}>⏱️ זמן לסיבוב: {settings.timeLimit} שניות</label>
                <input type="range" min={20} max={180} step={10} value={settings.timeLimit} onChange={e => updateSettings({ timeLimit: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--primary)' }}/>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 6 }}>🔄 סיבובים: {settings.rounds}</label>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[1,2,3,4,5,6].map(n => (
                    <button key={n} onClick={() => updateSettings({ rounds: n })} style={{ flex: 1, padding: '7px 0', borderRadius: 9, border: settings.rounds === n ? 'none' : '2px solid #e8e0f0', background: settings.rounds === n ? 'var(--primary)' : 'white', color: settings.rounds === n ? 'white' : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>{n}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'block', marginBottom: 6 }}>📝 מילים</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[['random','🎲 אקראי'],['custom','✍️ מותאם']].map(([val,label]) => (
                    <button key={val} onClick={() => updateSettings({ wordMode: val })} style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: settings.wordMode === val ? 'none' : '2px solid #e8e0f0', background: settings.wordMode === val ? 'var(--accent)' : 'white', color: settings.wordMode === val ? 'white' : '#666', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>{label}</button>
                  ))}
                </div>
              </div>
              {settings.wordMode === 'custom' && (
                <div style={{ marginBottom: 14 }}>
                  <textarea value={customWordsInput} onChange={e => setCustomWordsInput(e.target.value)} placeholder={'כלב\nחתול\nבית'} rows={4} style={{ width: '100%', padding: '8px 12px', border: '2px solid #e8e0f0', borderRadius: 10, fontFamily: 'Heebo, sans-serif', fontSize: 13, resize: 'vertical', outline: 'none', direction: 'rtl' }}/>
                  <button className="btn btn-accent btn-sm" style={{ marginTop: 6, width: '100%' }} onClick={applyCustomWords}>שמור {customWordsInput.split(/[\n,]+/).filter(w=>w.trim()).length} מילים</button>
                  {settings.customWords.length > 0 && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>✅ {settings.customWords.length} מילים שמורות</div>}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '2px solid #f5f0ff' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>👁️ צפה בלי לשחק</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>תראה את המילה ואת הציור</div>
                </div>
                <button onClick={toggleSpectator} style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: state.isSpectator ? 'var(--primary)' : '#ddd', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 3, left: state.isSpectator ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}/>
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>⏳</div>
              <h3 style={{ fontWeight: 800, marginBottom: 6, fontSize: 16 }}>מחכים למנהל...</h3>
              <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>ה-{state.players.find(p => p.isOwner)?.name || 'מנהל'} יתחיל בקרוב</p>
            </div>
          )}
          {state.isOwner && (
            <button className="btn btn-primary btn-lg pulse" style={{ width: '100%' }} onClick={startGame} disabled={!canStart}>
              {canStart ? '🚀 התחל משחק!' : `עוד ${2 - activePlayers.length} שחקנים נדרשים`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
