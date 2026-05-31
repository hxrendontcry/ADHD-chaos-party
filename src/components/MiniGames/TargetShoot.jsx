import React, { useState, useEffect, useRef } from 'react';

export default function TargetShoot({ score, onScoreChange, useSoundHook }) {
  const [targets, setTargets] = useState([]);
  const [scorePopups, setScorePopups] = useState([]);
  const [shake, setShake] = useState(false);
  
  const containerRef = useRef(null);
  const targetIdRef = useRef(0);
  const { playPop, playBuzzer } = useSoundHook;

  // Spawn targets
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      setTargets(prev => {
        if (prev.length >= 4) return prev; // Limit to 4 targets max

        const isGolden = Math.random() > 0.85;
        const size = isGolden ? 40 : 55 + Math.random() * 25; // Golden targets are smaller
        const speed = isGolden ? 2 : 1 + Math.random() * 1.5;

        const newTarget = {
          id: targetIdRef.current++,
          x: 10 + Math.random() * 75, // %
          y: 15 + Math.random() * 65, // %
          vx: (Math.random() > 0.5 ? 1 : -1) * speed,
          vy: (Math.random() > 0.5 ? 1 : -1) * speed,
          size,
          isGolden,
          lifespan: 180 // 180 frames = 3 seconds
        };

        return [...prev, newTarget];
      });
    }, 450);

    return () => clearInterval(spawnInterval);
  }, []);

  // Update target physics (movement & bounce off borders)
  useEffect(() => {
    const physInterval = setInterval(() => {
      setTargets(prev => 
        prev
          .map(t => {
            let nextX = t.x + t.vx * 0.4;
            let nextY = t.y + t.vy * 0.4;
            let nextVx = t.vx;
            let nextVy = t.vy;

            // Bounce off left/right (10% to 90%)
            if (nextX <= 5 || nextX >= 90) {
              nextVx = -t.vx;
              nextX = t.x; // reset pos
            }
            // Bounce off top/bottom (15% to 85%)
            if (nextY <= 10 || nextY >= 80) {
              nextVy = -t.vy;
              nextY = t.y; // reset pos
            }

            return {
              ...t,
              x: nextX,
              y: nextY,
              vx: nextVx,
              vy: nextVy,
              lifespan: t.lifespan - 1
            };
          })
          .filter(t => t.lifespan > 0) // Remove expired targets
      );
    }, 16); // ~60fps

    return () => clearInterval(physInterval);
  }, []);

  const handleTargetClick = (target, e) => {
    e.stopPropagation();
    
    // Remove clicked target
    setTargets(prev => prev.filter(t => t.id !== target.id));
    playPop();

    // Score calc
    const points = target.isGolden ? 35 : 20;
    onScoreChange(score + points);

    // Score Popup
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const newPopup = {
        id: Math.random(),
        x: clickX,
        y: clickY,
        text: `+${points}`,
        color: target.isGolden ? 'var(--neon-yellow)' : 'var(--neon-cyan)'
      };
      setScorePopups(prev => [...prev, newPopup]);
      setTimeout(() => {
        setScorePopups(prev => prev.filter(p => p.id !== newPopup.id));
      }, 700);
    }
  };

  const handleMiss = () => {
    // Clicked background -> deduct points
    playBuzzer();
    onScoreChange(Math.max(0, score - 5));
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  return (
    <div 
      ref={containerRef} 
      onClick={handleMiss} 
      className={shake ? 'animate-shake' : ''}
      style={styles.gameArea}
    >
      <div style={styles.instructions}>🎯 POP THE FLOATING TARGETS! Avoid missing! 🎯</div>

      {targets.map((t) => (
        <div
          key={t.id}
          onClick={(e) => handleTargetClick(t, e)}
          style={{
            ...styles.target,
            left: `${t.x}%`,
            top: `${t.y}%`,
            width: `${t.size}px`,
            height: `${t.size}px`,
            backgroundColor: t.isGolden ? 'rgba(255,234,0,0.1)' : 'rgba(0,240,255,0.1)',
            borderColor: t.isGolden ? 'var(--neon-yellow)' : 'var(--neon-cyan)',
            boxShadow: t.isGolden 
              ? '0 0 20px var(--neon-yellow), inset 0 0 10px var(--neon-yellow)' 
              : '0 0 20px var(--neon-cyan), inset 0 0 10px var(--neon-cyan)'
          }}
        >
          {/* Bullseye inner rings */}
          <div style={{ ...styles.ringInner, borderColor: 'inherit' }} />
          <div style={{ ...styles.bullseyeCenter, backgroundColor: 'inherit' }} />
        </div>
      ))}

      {/* Floating score text */}
      {scorePopups.map((p) => (
        <div
          key={p.id}
          style={{
            ...styles.popup,
            left: `${p.x}px`,
            top: `${p.y}px`,
            color: p.color,
            textShadow: `0 0 8px ${p.color}`
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
    cursor: 'crosshair'
  },
  instructions: {
    position: 'absolute',
    top: '15px',
    left: '0',
    right: '0',
    textAlign: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    zIndex: 5
  },
  target: {
    position: 'absolute',
    borderRadius: '50%',
    border: '3px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'translate(-50%, -50%)',
    cursor: 'pointer',
    transition: 'transform 0.1s'
  },
  ringInner: {
    width: '60%',
    height: '60%',
    borderRadius: '50%',
    border: '2px solid'
  },
  bullseyeCenter: {
    width: '25%',
    height: '25%',
    borderRadius: '50%',
    position: 'absolute'
  },
  popup: {
    position: 'absolute',
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.4rem',
    pointerEvents: 'none',
    animation: 'floatUp 0.7s forwards ease-out',
    transform: 'translate(-50%, -100%)'
  }
};
