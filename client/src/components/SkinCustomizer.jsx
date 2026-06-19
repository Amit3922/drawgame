import React from 'react';
import PlayerAvatar, { BODY_COLORS, BODY_COLOR_NAMES, EYE_NAMES, HAT_NAMES, MOUTH_NAMES } from './PlayerAvatar';

export default function SkinCustomizer({ skin, onChange }) {
  const set = (key, val) => onChange({ ...skin, [key]: val });

  const Section = ({ label, count, field, names }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            onClick={() => set(field, i)}
            style={{
              padding: '6px 12px',
              borderRadius: 50,
              border: skin[field] === i ? '2.5px solid var(--primary)' : '2px solid #e8e0f0',
              background: skin[field] === i ? '#FFE8DF' : 'white',
              color: skin[field] === i ? 'var(--primary)' : '#666',
              fontSize: 13,
              fontFamily: 'Heebo, sans-serif',
              fontWeight: skin[field] === i ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {names[i]}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{ background: 'linear-gradient(135deg, #f5f0ff, #ffe8df)', borderRadius: '50%', padding: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <PlayerAvatar skin={skin} size={100} />
        </div>
      </div>

      <Section label="🎨 צבע גוף" count={BODY_COLORS.length} field="bodyColor" names={BODY_COLOR_NAMES} />
      <Section label="👀 עיניים" count={EYE_NAMES.length} field="eyeStyle" names={EYE_NAMES} />
      <Section label="🎩 כובע" count={HAT_NAMES.length} field="hatStyle" names={HAT_NAMES} />
      <Section label="😄 פה" count={MOUTH_NAMES.length} field="mouthStyle" names={MOUTH_NAMES} />
    </div>
  );
}
