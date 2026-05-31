import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function KeyMasher({ score, onScoreChange, useSoundHook }) {
  const [progress, setProgress] = useState(0);
  const [totalMashes, setTotalMashes] = useState(0);
  const [shaking, setShaking] = useState(false);

  const { playCoin, playKeypress } = useSoundHook;

  const handleMash = () => {
    playKeypress();
    setTotalMashes(prev => prev + 1);
    setShaking(true);
    setTimeout(() => setShaking(false), 80);

    const nextProgress = progress + 5;
    if (nextProgress >= 100) {
      playCoin();
      confetti({
        particleCount: 20,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 20,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      onScoreChange(score + 25);
      setProgress(0);
    } else {
      setProgress(nextProgress);
    }
  };

  // Keyboard spacebar listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault(); // Stop page scrolling
        handleMash();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [progress, score]);

  return (
    <div style={styles.gameArea} className={shaking ? 'animate-shake' : ''}>
      <div style={styles.instructions}>⌨️ MASH SPACEBAR OR TAP THE BUTTON FAST! ⌨️</div>

      <div style={styles.mashDisplay}>
        <div style={styles.mashCounter}>MASHES: {totalMashes}</div>
        <button
          onClick={handleMash}
          style={styles.mashButton}
          className="btn btn-pink animate-pulse-slow"
        >
          💥 MASH!
        </button>
      </div>

      <div style={styles.barWrapper}>
        <div style={styles.progressText}>Dialing up: {progress}%</div>
        <div className="progress-container" style={{ height: '16px' }}>
          <div
            className="progress-bar progress-green"
            style={{
              width: `${progress}%`,
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
    fontSize: '0.95rem',
    color: 'var(--text-muted)'
  },
  mashDisplay: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px'
  },
  mashCounter: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    fontWeight: '700',
    color: 'var(--neon-cyan)',
    textShadow: '0 0 10px rgba(0, 240, 255, 0.3)'
  },
  mashButton: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    fontSize: '1.4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 25px var(--neon-pink)',
    border: '4px solid white',
    padding: '0',
    cursor: 'pointer'
  },
  barWrapper: {
    width: '100%',
    maxWidth: '320px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  progressText: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textAlign: 'center'
  }
};
