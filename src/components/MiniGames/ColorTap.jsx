import React, { useState, useEffect } from 'react';

const COLORS = [
  { name: 'RED', color: '#ff0055' },
  { name: 'BLUE', color: '#00f0ff' },
  { name: 'GREEN', color: '#39ff14' },
  { name: 'YELLOW', color: '#ffea00' }
];

export default function ColorTap({ score, onScoreChange, useSoundHook }) {
  const [target, setTarget] = useState(null);
  const [shake, setShake] = useState(false);
  const { playPop, playBuzzer } = useSoundHook;

  const rollTarget = () => {
    const rolled = COLORS[Math.floor(Math.random() * COLORS.length)];
    setTarget(rolled);
  };

  useEffect(() => {
    rollTarget();
  }, []);

  const handleColorClick = (colorName) => {
    if (!target) return;

    if (colorName === target.name) {
      playPop();
      onScoreChange(score + 15);
      rollTarget();
    } else {
      playBuzzer();
      onScoreChange(Math.max(0, score - 10));
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  if (!target) return null;

  return (
    <div style={styles.gameArea} className={shake ? 'animate-shake' : ''}>
      <div style={styles.header}>
        <div style={styles.prompt} className="animate-pulse-slow">
          👉 TAP <span style={{ color: target.color, textShadow: `0 0 10px ${target.color}` }}>{target.name}</span> 👈
        </div>
      </div>

      <div style={styles.grid}>
        {COLORS.map((col) => (
          <div
            key={col.name}
            onClick={() => handleColorClick(col.name)}
            style={{
              ...styles.pad,
              backgroundColor: col.color,
              boxShadow: `0 4px 15px rgba(0, 0, 0, 0.3)`
            }}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  gameArea: {
    width: '100%',
    height: '400px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '25px',
    border: '2px solid rgba(255, 255, 255, 0.05)',
  },
  header: {
    textAlign: 'center'
  },
  prompt: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.8rem',
    letterSpacing: '1px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    maxWidth: '280px',
    width: '100%',
    margin: '10px auto'
  },
  pad: {
    aspectRatio: '1.2',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    border: '2px solid transparent',
    '&:hover': {
      transform: 'scale(1.04)',
      borderColor: 'white'
    }
  }
};
