import React, { useState } from 'react';
import confetti from 'canvas-confetti';

const FLAVORS = [
  { name: '🔥 CHILI SODA', color: 'var(--neon-pink)', shadow: 'rgba(255,0,127,0.5)' },
  { name: '⚡ ENERGY COKE', color: 'var(--neon-cyan)', shadow: 'rgba(0,240,255,0.5)' },
  { name: '🍋 LIME SPLASH', color: 'var(--neon-green)', shadow: 'rgba(57,255,20,0.5)' },
  { name: '🍇 GRAPE GUSH', color: 'var(--neon-purple)', shadow: 'rgba(157,78,221,0.5)' },
  { name: '🍊 FANTASY POP', color: 'var(--neon-orange)', shadow: 'rgba(255,103,0,0.5)' }
];

export default function ShakeSoda({ score, onScoreChange, useSoundHook }) {
  const [flavorIdx, setFlavorIdx] = useState(0);
  const [pressure, setPressure] = useState(0);
  const [shaking, setShaking] = useState(false);
  const { playPop, playKeypress } = useSoundHook;

  const currentFlavor = FLAVORS[flavorIdx];

  const handleShake = (e) => {
    e.stopPropagation();
    playKeypress();
    setShaking(true);
    setTimeout(() => setShaking(false), 80);

    const nextPressure = pressure + 7;
    
    if (nextPressure >= 100) {
      // Explode!
      playPop();
      
      // Localized mini-confetti burst from the can
      const rect = e.target.getBoundingClientRect();
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { 
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight 
        }
      });

      onScoreChange(score + 50);
      setPressure(0);
      setFlavorIdx((flavorIdx + 1) % FLAVORS.length);
    } else {
      setPressure(nextPressure);
    }
  };

  return (
    <div style={styles.gameArea}>
      <div style={styles.instructions}>🥤 SHAKE THE SODA UNTIL IT EXPLODES! 🥤</div>

      <div style={styles.canContainer}>
        <div
          onClick={handleShake}
          className={shaking ? 'animate-shake' : ''}
          style={{
            ...styles.sodaCan,
            backgroundColor: currentFlavor.color,
            boxShadow: `0 0 35px ${currentFlavor.shadow}`,
            transform: shaking ? 'scale(0.95) rotate(-3deg)' : 'none'
          }}
        >
          <div style={styles.tab}></div>
          <div style={styles.label}>{currentFlavor.name}</div>
        </div>
      </div>

      <div style={styles.gaugeWrapper}>
        <div style={styles.gaugeLabel}>PRESSURE: {pressure}%</div>
        <div className="progress-container" style={{ height: '14px' }}>
          <div
            className="progress-bar"
            style={{
              width: `${pressure}%`,
              backgroundColor: currentFlavor.color,
              boxShadow: `0 0 10px ${currentFlavor.color}`,
              transition: 'width 0.05s ease-out'
            }}
          />
        </div>
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
  canContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sodaCan: {
    width: '90px',
    height: '150px',
    borderRadius: '16px',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.05s ease',
    border: '3px solid white'
  },
  tab: {
    width: '20px',
    height: '6px',
    background: '#ccc',
    position: 'absolute',
    top: '-6px',
    borderRadius: '3px 3px 0 0',
    border: '1px solid #777'
  },
  label: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '0.75rem',
    color: '#0b0b14',
    textAlign: 'center',
    background: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    width: '80%',
    lineHeight: '1.2'
  },
  gaugeWrapper: {
    width: '100%',
    maxWidth: '300px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  gaugeLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textAlign: 'center'
  }
};
