import React, { useState, useEffect, useRef } from 'react';

export default function RhythmTap({ score, onScoreChange, useSoundHook }) {
  const [position, setPosition] = useState(0); // 0 to 100%
  const [targetStart, setTargetStart] = useState(40); // target zone start %
  const [targetWidth, setTargetWidth] = useState(20); // target zone width %
  const [shake, setShake] = useState(false);
  const { playPop, playBuzzer } = useSoundHook;

  const directionRef = useRef(1); // 1 = right, -1 = left
  const positionRef = useRef(0);
  const targetStartRef = useRef(40);
  const targetWidthRef = useRef(20);

  // Position target zone randomly
  const randomizeTarget = () => {
    // Target width shrinks as score increases, down to a minimum of 10%
    const currentScore = score || 0;
    const newWidth = Math.max(10, 24 - Math.floor(currentScore / 80));
    const newStart = Math.floor(Math.random() * (100 - newWidth));
    
    setTargetStart(newStart);
    setTargetWidth(newWidth);
    targetStartRef.current = newStart;
    targetWidthRef.current = newWidth;
  };

  // Run timing needle animation loop
  useEffect(() => {
    randomizeTarget();

    const speed = 2.2; // base speed
    const interval = setInterval(() => {
      let nextPos = positionRef.current + directionRef.current * speed;
      if (nextPos >= 100) {
        nextPos = 100;
        directionRef.current = -1;
      } else if (nextPos <= 0) {
        nextPos = 0;
        directionRef.current = 1;
      }
      positionRef.current = nextPos;
      setPosition(nextPos);
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  const handleTap = () => {
    const pos = positionRef.current;
    const tStart = targetStartRef.current;
    const tEnd = tStart + targetWidthRef.current;

    if (pos >= tStart && pos <= tEnd) {
      playPop();
      onScoreChange(score + 20);
      randomizeTarget();
    } else {
      playBuzzer();
      onScoreChange(Math.max(0, score - 8));
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }
  };

  // Keyboard support (SPACEBAR)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [score]);

  return (
    <div 
      style={styles.gameArea} 
      onClick={handleTap}
      className={shake ? 'animate-shake' : ''}
    >
      <div style={styles.instructions}>
        ⚡ PRESS <span className="neon-text-pink">SPACEBAR</span> OR <span className="neon-text-cyan">CLICK</span> WHEN NEEDLE IS IN THE GREEN ZONE! ⚡
      </div>

      <div style={styles.gaugeContainer}>
        {/* Track */}
        <div style={styles.track}>
          {/* Target Zone */}
          <div 
            style={{
              ...styles.targetZone,
              left: `${targetStart}%`,
              width: `${targetWidth}%`
            }}
          />
          {/* Sweeping Needle */}
          <div 
            style={{
              ...styles.needle,
              left: `${position}%`
            }}
          />
        </div>
      </div>

      <div style={styles.hint}>
        Precision is key! Misses deduct -8 points!
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
    cursor: 'pointer'
  },
  instructions: {
    textAlign: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '1rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4'
  },
  gaugeContainer: {
    width: '100%',
    padding: '40px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  track: {
    position: 'relative',
    width: '100%',
    height: '24px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    overflow: 'visible'
  },
  targetZone: {
    position: 'absolute',
    height: '100%',
    top: 0,
    background: 'rgba(57, 255, 20, 0.25)',
    borderLeft: '2px solid var(--neon-green)',
    borderRight: '2px solid var(--neon-green)',
    boxShadow: '0 0 15px rgba(57, 255, 20, 0.4), inset 0 0 10px rgba(57, 255, 20, 0.3)',
    borderRadius: '4px',
    transition: 'left 0.1s ease-out, width 0.1s ease-out'
  },
  needle: {
    position: 'absolute',
    width: '8px',
    height: '36px',
    top: '-8px',
    background: 'var(--neon-pink)',
    border: '1.5px solid white',
    boxShadow: '0 0 12px var(--neon-pink)',
    borderRadius: '4px',
    transform: 'translateX(-50%)',
    zIndex: 10
  },
  hint: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic'
  }
};
