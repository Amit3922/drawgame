import React from 'react';

export const BODY_COLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#C7B8EA'];
export const BODY_COLOR_NAMES = ['אדום 🔴','טורקיז 🟦','כחול 🔵','ירוק 🟢','צהוב 🟡','סגול 🟣'];
export const EYE_NAMES = ['רגיל 👀','שמח 😊','קול 😎','מופתע 😲','ישנוני 😴'];
export const HAT_NAMES = ['ללא 🙅','כובע מסיבה 🎉','כתר 👑','כובע מצחייה 🧢','כובע קאובוי 🤠'];
export const MOUTH_NAMES = ['חיוך 😊','צחוק 😁','לשון 😛','עצוב 😢'];

export default function PlayerAvatar({ skin = {}, size = 60 }) {
  const { bodyColor = 0, eyeStyle = 0, hatStyle = 0, mouthStyle = 0 } = skin;
  const color = BODY_COLORS[bodyColor] || BODY_COLORS[0];

  const Eyes = () => {
    switch (eyeStyle) {
      case 1: return (
        <>
          <path d="M17 27 Q22 22 27 27" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M33 27 Q38 22 43 27" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </>
      );
      case 2: return (
        <>
          <rect x="14" y="24" width="14" height="8" rx="3" fill="#222"/>
          <rect x="32" y="24" width="14" height="8" rx="3" fill="#222"/>
          <line x1="28" y1="28" x2="32" y2="28" stroke="#444" strokeWidth="2"/>
          <circle cx="19" cy="27" r="2" fill="#555"/>
          <circle cx="37" cy="27" r="2" fill="#555"/>
        </>
      );
      case 3: return (
        <>
          <circle cx="22" cy="28" r="6" fill="white" stroke="#ccc" strokeWidth="0.5"/>
          <circle cx="38" cy="28" r="6" fill="white" stroke="#ccc" strokeWidth="0.5"/>
          <circle cx="22" cy="29" r="3" fill="#222"/>
          <circle cx="38" cy="29" r="3" fill="#222"/>
          <circle cx="23" cy="28" r="1.2" fill="white"/>
          <circle cx="39" cy="28" r="1.2" fill="white"/>
        </>
      );
      case 4: return (
        <>
          <path d="M17 28 Q22 24 27 28" fill="white"/>
          <path d="M17 28 L27 28" stroke="#333" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M33 28 Q38 24 43 28" fill="white"/>
          <path d="M33 28 L43 28" stroke="#333" strokeWidth="2.5" strokeLinecap="round"/>
        </>
      );
      default: return (
        <>
          <circle cx="22" cy="28" r="5" fill="white"/>
          <circle cx="38" cy="28" r="5" fill="white"/>
          <circle cx="23" cy="29" r="2.5" fill="#222"/>
          <circle cx="39" cy="29" r="2.5" fill="#222"/>
          <circle cx="24" cy="28" r="1" fill="white"/>
          <circle cx="40" cy="28" r="1" fill="white"/>
        </>
      );
    }
  };

  const Mouth = () => {
    switch (mouthStyle) {
      case 1: return (
        <>
          <path d="M22 38 Q30 45 38 38" stroke="#333" strokeWidth="2.5" fill="#FF9999" strokeLinecap="round"/>
          <ellipse cx="30" cy="41" rx="8" ry="3.5" fill="#FF9999"/>
          <path d="M22 38 Q30 45 38 38" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </>
      );
      case 2: return (
        <>
          <path d="M22 37 Q30 43 38 37" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <ellipse cx="30" cy="43" rx="5" ry="4" fill="#FF8FAB"/>
          <ellipse cx="30" cy="46" rx="3.5" ry="2" fill="#e8607a"/>
        </>
      );
      case 3: return (
        <path d="M22 42 Q30 37 38 42" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      );
      default: return (
        <path d="M22 38 Q30 44 38 38" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      );
    }
  };

  const Hat = () => {
    switch (hatStyle) {
      case 1: return (
        <>
          <polygon points="30,4 19,21 41,21" fill="#FF6B35" stroke="#e55a25" strokeWidth="1"/>
          <circle cx="30" cy="4" r="2.5" fill="#FFE66D"/>
          <circle cx="23" cy="15" r="2" fill="#FFE66D"/>
          <circle cx="31" cy="11" r="1.5" fill="#4ECDC4"/>
          <circle cx="37" cy="15" r="2" fill="#FF6B6B"/>
          <rect x="17" y="20" width="26" height="3" rx="1.5" fill="#e55a25"/>
        </>
      );
      case 2: return (
        <>
          <path d="M10 22 L15 10 L22 18 L30 6 L38 18 L45 10 L50 22 Z" fill="#FFD700" stroke="#d4a800" strokeWidth="1"/>
          <rect x="10" y="20" width="40" height="5" rx="2" fill="#FFD700"/>
          <circle cx="30" cy="6" r="3" fill="#FF4757"/>
          <circle cx="15.5" cy="10" r="2" fill="#2ED573"/>
          <circle cx="44.5" cy="10" r="2" fill="#1E90FF"/>
        </>
      );
      case 3: return (
        <>
          <rect x="14" y="12" width="32" height="11" rx="5" fill="#333"/>
          <ellipse cx="30" cy="23" rx="22" ry="4.5" fill="#333"/>
          <ellipse cx="13" cy="22" rx="4" ry="3" fill="#333"/>
          <rect x="24" y="13" width="8" height="3" rx="1.5" fill="#555"/>
        </>
      );
      case 4: return (
        <>
          <ellipse cx="30" cy="23" rx="26" ry="5" fill="#8B6914"/>
          <rect x="16" y="10" width="28" height="14" rx="8" fill="#A0522D"/>
          <ellipse cx="30" cy="24" rx="26" ry="4" fill="#7a5810"/>
        </>
      );
      default: return null;
    }
  };

  return (
    <svg width={size} height={size} viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="58" rx="18" ry="2.5" fill="rgba(0,0,0,0.12)"/>
      {hatStyle !== 1 && hatStyle !== 2 && <Hat />}
      <circle cx="30" cy="34" r="22" fill={color}/>
      <circle cx="14" cy="37" r="5" fill="rgba(255,255,255,0.25)"/>
      <circle cx="46" cy="37" r="5" fill="rgba(255,255,255,0.25)"/>
      <circle cx="16" cy="37" r="4.5" fill="rgba(255,100,100,0.3)"/>
      <circle cx="44" cy="37" r="4.5" fill="rgba(255,100,100,0.3)"/>
      <Eyes />
      <Mouth />
      {(hatStyle === 1 || hatStyle === 2) && <Hat />}
    </svg>
  );
}
