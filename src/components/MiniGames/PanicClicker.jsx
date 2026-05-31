import React, { useState, useRef } from 'react';

export default function PanicClicker({ score, onScoreChange, useSoundHook }) {
  const [btnPos, setBtnPos] = useState({ top: '50%', left: '50%' });
  const [clicks, setClicks] = useState(0);
  const [scorePopups, setScorePopups] = useState([]);
  const containerRef = useRef(null);
  const { playCoin } = useSoundHook;

  const handleClick = (e) => {
    e.stopPropagation();
    playCoin();
    setClicks(prev => prev + 1);
    
    // Calculate new position
    const topRand = 12 + Math.random() * 70; // 12% to 82%
    const leftRand = 12 + Math.random() * 76; // 12% to 88%
    setBtnPos({ top: `${topRand}%`, left: `${leftRand}%` });

    // Update score
    onScoreChange(score + 10);

    // Score popup
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const newPopup = {
      id: Math.random(),
      x: clickX,
      y: clickY,
      text: '+10'
    };
    setScorePopups(prev => [...prev, newPopup]);
    setTimeout(() => {
      setScorePopups(prev => prev.filter(p => p.id !== newPopup.id));
    }, 800);
  };

  return (
    <div ref={containerRef} style={styles.gameArea}>
      <div style={styles.instructions}>⚡ CLICK THE BUTTON AS FAST AS IT MOVES! ⚡</div>
      
      <div style={styles.scoreCounter}>CLICKS: {clicks}</div>

      <button
        onClick={handleClick}
        className="btn btn-pink animate-pulse-slow"
        style={{
          ...styles.clickButton,
          top: btnPos.top,
          left: btnPos.left,
        }}
      >
        💥 TAP!
      </button>

      {/* Floating score text */}
      {scorePopups.map((p) => (
        <div
          key={p.id}
          style={{
            ...styles.popup,
            left: `${p.x}px`,
            top: `${p.y}px`,
          }}
        >
          {p.text}
        </div>
      ))}
    </div>
  );
}

const styles = {
  gameArea: {
    width: '100%',
    height: '400px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '24px',
    position: 'relative',
    overflow: 'hidden',
    border: '2px solid rgba(255, 255, 255, 0.05)',
  },
  instructions: {
    position: 'absolute',
    top: '15px',
    left: '0',
    right: '0',
    textAlign: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '1rem',
    color: 'var(--text-muted)',
    zIndex: 5
  },
  scoreCounter: {
    position: 'absolute',
    bottom: '15px',
    left: '20px',
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--neon-cyan)',
    textShadow: '0 0 10px rgba(0, 240, 255, 0.3)'
  },
  clickButton: {
    position: 'absolute',
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    fontSize: '1.2rem',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 25px var(--neon-pink)',
    border: '3px solid white',
    padding: '0',
    transition: 'top 0.1s ease-out, left 0.1s ease-out'
  },
  popup: {
    position: 'absolute',
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.5rem',
    color: 'var(--neon-green)',
    textShadow: '0 0 8px var(--neon-green)',
    pointerEvents: 'none',
    animation: 'floatUp 0.8s forwards ease-out',
    transform: 'translate(-50%, -100%)'
  }
};
