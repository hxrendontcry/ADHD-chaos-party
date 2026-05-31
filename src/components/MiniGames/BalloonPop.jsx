import React, { useState, useEffect, useRef } from 'react';

const BALLOON_TYPES = ['normal', 'gold', 'bomb'];

export default function BalloonPop({ score, onScoreChange, useSoundHook }) {
  const [balloons, setBalloons] = useState([]);
  const [scorePopups, setScorePopups] = useState([]); // { id, x, y, text, color }
  const [shake, setShake] = useState(false);
  const containerRef = useRef(null);
  const balloonIdRef = useRef(0);
  const { playPop, playCoin, playBuzzer } = useSoundHook;

  // Spawn balloons
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      const typeRand = Math.random();
      let type = 'normal';
      if (typeRand > 0.85) type = 'gold';
      else if (typeRand > 0.70) type = 'bomb';

      const newBalloon = {
        id: balloonIdRef.current++,
        x: 5 + Math.random() * 85, // 5% to 90%
        y: -10, // starts offscreen at bottom
        speed: 1.2 + Math.random() * 2.2,
        type,
        size: type === 'gold' ? 55 : type === 'bomb' ? 65 : 60,
        color: type === 'gold' 
          ? 'var(--neon-yellow)' 
          : type === 'bomb' 
            ? '#111' 
            : ['var(--neon-pink)', 'var(--neon-cyan)', 'var(--neon-purple)', 'var(--neon-orange)'][Math.floor(Math.random() * 4)]
      };
      
      setBalloons(prev => [...prev, newBalloon]);
    }, 450);

    return () => clearInterval(spawnInterval);
  }, []);

  // Update balloons position
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setBalloons(prev => 
        prev
          .map(b => ({ ...b, y: b.y + b.speed }))
          .filter(b => b.y < 115) // Keep until float off-screen
      );
    }, 30);

    return () => clearInterval(moveInterval);
  }, []);

  const handlePop = (balloon, e) => {
    e.stopPropagation();
    
    // Remove popped balloon
    setBalloons(prev => prev.filter(b => b.id !== balloon.id));

    // Get click position relative to container
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let pointsGained = 0;
    let popupColor = 'white';

    if (balloon.type === 'normal') {
      playPop();
      pointsGained = 10;
      popupColor = 'var(--neon-cyan)';
    } else if (balloon.type === 'gold') {
      playCoin();
      pointsGained = 30;
      popupColor = 'var(--neon-yellow)';
    } else if (balloon.type === 'bomb') {
      playBuzzer();
      pointsGained = -20;
      popupColor = 'var(--neon-pink)';
      // Trigger shake
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }

    onScoreChange(score + pointsGained);

    // Add floating score popups
    const popupText = pointsGained > 0 ? `+${pointsGained}` : `${pointsGained}`;
    const newPopup = {
      id: Math.random(),
      x: clickX,
      y: clickY,
      text: popupText,
      color: popupColor
    };
    setScorePopups(prev => [...prev, newPopup]);
    setTimeout(() => {
      setScorePopups(prev => prev.filter(p => p.id !== newPopup.id));
    }, 800);
  };

  return (
    <div 
      ref={containerRef} 
      className={shake ? 'animate-shake' : ''} 
      style={styles.gameArea}
    >
      <div style={styles.instructions}>🎈 POP NEON BALLOONS! Avoid the Black Bombs 💣</div>

      {balloons.map((b) => (
        <div
          key={b.id}
          onClick={(e) => handlePop(b, e)}
          style={{
            ...styles.balloon,
            left: `${b.x}%`,
            bottom: `${b.y}%`,
            width: `${b.size}px`,
            height: `${b.size * 1.25}px`,
            backgroundColor: b.color,
            borderColor: b.type === 'gold' ? '#fff' : b.type === 'bomb' ? 'var(--neon-pink)' : 'transparent',
            boxShadow: b.type === 'gold' 
              ? '0 0 20px #ffea00' 
              : b.type === 'bomb' 
                ? '0 0 15px rgba(255, 0, 127, 0.4)' 
                : `0 0 15px ${b.color}`
          }}
        >
          {b.type === 'bomb' && <span style={styles.bombIcon}>💣</span>}
          {b.type === 'gold' && <span style={styles.starIcon}>✨</span>}
          {/* Balloon knot & string */}
          <div style={styles.knot}></div>
          <div style={styles.string}></div>
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
    fontSize: '1rem',
    color: 'var(--text-muted)',
    zIndex: 5
  },
  balloon: {
    position: 'absolute',
    borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
    cursor: 'pointer',
    transform: 'translateX(-50%)',
    transition: 'transform 0.1s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: '2px',
    borderStyle: 'solid'
  },
  bombIcon: {
    fontSize: '1.4rem'
  },
  starIcon: {
    fontSize: '1.2rem'
  },
  knot: {
    width: '10px',
    height: '6px',
    background: 'inherit',
    position: 'absolute',
    bottom: '-4px',
    left: 'calc(50% - 5px)',
    clipPath: 'polygon(0% 100%, 100% 100%, 50% 0%)'
  },
  string: {
    width: '2px',
    height: '30px',
    background: 'rgba(255, 255, 255, 0.25)',
    position: 'absolute',
    bottom: '-34px',
    left: 'calc(50% - 1px)'
  },
  popup: {
    position: 'absolute',
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.5rem',
    pointerEvents: 'none',
    animation: 'floatUp 0.8s forwards ease-out',
    transform: 'translate(-50%, -100%)'
  }
};

// Add standard keyframe for floatUp popup in style tags or use inline.
// We can inject a <style> tag directly in the component for the floatUp animation.
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes floatUp {
    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
    100% { transform: translate(-50%, -120%) scale(1.2); opacity: 0; }
  }
`;
document.head.appendChild(styleSheet);
