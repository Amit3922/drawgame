import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';

const COLORS = [
  '#000000','#FFFFFF','#FF4757','#FF6B35','#FFE66D','#7BCC6B',
  '#4ECDC4','#45B7D1','#2D3561','#C7B8EA','#FF8FAB','#A0522D',
];

export default function DrawingCanvas({ isDrawer, size }) {
  const canvasRef = useRef(null);
  const { state } = useGame();
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [tool, setTool] = useState('pen'); // pen | eraser
  const drawing = useRef(false);
  const lastPos = useRef(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const drawLine = useCallback((ctx, x0, y0, x1, y1, col, bs, erase) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = erase ? '#FFFFFF' : col;
    ctx.lineWidth = erase ? bs * 3 : bs;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, []);

  // Handle incoming draw events from socket
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleDraw = (data) => {
      drawLine(ctx,
        data.prevX * canvas.width,
        data.prevY * canvas.height,
        data.x * canvas.width,
        data.y * canvas.height,
        data.color, data.brushSize, data.erase
      );
    };

    const handleClear = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    if (state.socket) {
      state.socket.on('draw', handleDraw);
      state.socket.on('clear-canvas', handleClear);
      return () => {
        state.socket.off('draw', handleDraw);
        state.socket.off('clear-canvas', handleClear);
      };
    }
  }, [state.socket, drawLine]);

  // Init canvas white
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDraw = (e) => {
    if (!isDrawer) return;
    e.preventDefault();
    drawing.current = true;
    const pos = getPos(e, canvasRef.current);
    lastPos.current = pos;
  };

  const onDraw = (e) => {
    if (!isDrawer || !drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    const prev = lastPos.current || pos;

    const erase = tool === 'eraser';
    drawLine(ctx, prev.x, prev.y, pos.x, pos.y, color, brushSize, erase);

    state.socket.emit('draw', {
      prevX: prev.x / canvas.width,
      prevY: prev.y / canvas.height,
      x: pos.x / canvas.width,
      y: pos.y / canvas.height,
      color, brushSize, erase,
    });

    lastPos.current = pos;
  };

  const endDraw = () => {
    drawing.current = false;
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    state.socket.emit('clear-canvas');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', border: '3px solid #e8e0f0' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{ width: '100%', height: '100%', display: 'block', cursor: isDrawer ? (tool === 'eraser' ? 'cell' : 'crosshair') : 'default', touchAction: 'none' }}
          onMouseDown={startDraw}
          onMouseMove={onDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={onDraw}
          onTouchEnd={endDraw}
        />
        {!isDrawer && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.85)', borderRadius: 50, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#888' }}>
            👀 צפייה
          </div>
        )}
      </div>

      {/* Tools */}
      {isDrawer && (
        <div style={{ background: 'white', borderRadius: 16, padding: '10px 14px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Color Palette */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool('pen'); }}
                style={{
                  width: 26, height: 26,
                  background: c,
                  border: color === c && tool === 'pen' ? '3px solid var(--dark)' : '2px solid #e0e0e0',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  boxShadow: color === c && tool === 'pen' ? '0 0 0 2px white inset' : 'none',
                  transition: 'transform 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={e => { setColor(e.target.value); setTool('pen'); }}
              style={{ width: 26, height: 26, border: '2px solid #e0e0e0', borderRadius: '50%', cursor: 'pointer', padding: 1 }}
              title="צבע מותאם"
            />
          </div>

          <div style={{ width: 1, height: 30, background: '#e8e0f0' }}/>

          {/* Brush size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>🖊️</span>
            <input
              type="range" min={2} max={30} value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              style={{ width: 80, accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#666', minWidth: 20 }}>{brushSize}</span>
          </div>

          <div style={{ width: 1, height: 30, background: '#e8e0f0' }}/>

          {/* Tool buttons */}
          <button
            onClick={() => setTool('pen')}
            style={{ padding: '6px 14px', borderRadius: 50, border: tool === 'pen' ? '2px solid var(--primary)' : '2px solid #e8e0f0', background: tool === 'pen' ? '#FFE8DF' : 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'Heebo, sans-serif', color: tool === 'pen' ? 'var(--primary)' : '#666' }}
          >✏️ עט</button>
          <button
            onClick={() => setTool('eraser')}
            style={{ padding: '6px 14px', borderRadius: 50, border: tool === 'eraser' ? '2px solid var(--primary)' : '2px solid #e8e0f0', background: tool === 'eraser' ? '#FFE8DF' : 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'Heebo, sans-serif', color: tool === 'eraser' ? 'var(--primary)' : '#666' }}
          >🧹 מחק</button>
          <button
            onClick={clearCanvas}
            style={{ padding: '6px 14px', borderRadius: 50, border: '2px solid #e8e0f0', background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'Heebo, sans-serif', color: '#e55' }}
          >🗑️ נקה</button>
        </div>
      )}
    </div>
  );
}
