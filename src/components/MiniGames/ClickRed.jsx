import React, { useState, useEffect } from 'react';

export default function ClickRed({ score, onScoreChange, useSoundHook }) {
  const [activeIdx, setActiveIdx] = useState(-1);
  const [shake, setShake] = useState(false);
  const { playPop, playBuzzer } = useSoundHook;

  const moveRedDot = (currentIdx = -1) => {
    let nextIdx = Math.floor(Math.random() * 9);
    while (nextIdx === currentIdx) {
      nextIdx = Math.floor(Math.random() * 9);
    }
    setActiveIdx(nextIdx);
  };

  useEffect(() => {
    moveRedDot();
  }, []);

  const handleCircleClick = (idx) => {
    if (idx === activeIdx) {
      playPop();
      onScoreChange(score + 15);
      moveRedDot(idx);
    } else {
      playBuzzer();
      onScoreChange(Math.max(0, score - 5));
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  return (
    <div style={styles.gameArea} className={shake ? 'animate-shake' : ''}>
      <div style={styles.instructions}>🔴 CLICK THE RED CIRCLES AS FAST AS POSSIBLE! 🔴</div>

      <div style={styles.grid}>
        {Array.from({ length: 9 }).map((_, idx) => {
          const isActive = idx === activeIdx;
          return (
            <div
              key={idx}
              onClick={() => handleCircleClick(idx)}
              style={{
                ...styles.circle,
                backgroundColor: isActive ? 'var(--neon-pink)' : 'rgba(255,255,255,0.05)',
                boxShadow: isActive ? '0 0 25px var(--neon-pink)' : 'none',
                borderColor: isActive ? 'white' : 'var(--border-color)'
              }}
            />
          );
        })}
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
  instructions: {
    textAlign: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '1rem',
    color: 'var(--text-muted)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    maxWidth: '280px',
    width: '100%',
    margin: '10px auto'
  },
  circle: {
    aspectRatio: '1',
    borderRadius: '50%',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    '&:hover': {
      transform: 'scale(1.05)'
    }
  }
};
