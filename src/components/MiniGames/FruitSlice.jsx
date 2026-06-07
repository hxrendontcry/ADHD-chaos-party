import React, { useState, useEffect, useRef } from 'react';

const FRUITS = ['🍉', '🍌', '🍍', '🍎', '🍓', '🍇', '🍒', '🍊'];

export default function FruitSlice({ score, onScoreChange, useSoundHook }) {
  const [items, setItems] = useState([]);
  const [shake, setShake] = useState(false);
  const containerRef = useRef(null);
  const itemIdRef = useRef(0);
  const { playPop, playBuzzer } = useSoundHook;

  // Spawn loop
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      setItems(prev => {
        if (prev.length >= 8) return prev; // limit count

        const isBomb = Math.random() > 0.8;
        const emoji = isBomb ? '💣' : FRUITS[Math.floor(Math.random() * FRUITS.length)];
        const size = isBomb ? 45 : 50 + Math.random() * 15;

        // Spawn from bottom/side
        const newItem = {
          id: itemIdRef.current++,
          x: 10 + Math.random() * 80, // %
          y: 90, // % start near bottom
          vx: (Math.random() - 0.5) * 2, // horizontal velocity
          vy: -3 - Math.random() * 3, // vertical velocity (go up)
          emoji,
          isBomb,
          size,
          rotation: Math.random() * 360,
          vrot: (Math.random() - 0.5) * 5,
          sliced: false
        };
        return [...prev, newItem];
      });
    }, 450);

    return () => clearInterval(spawnInterval);
  }, []);

  // Physics loop (gravity and translation)
  useEffect(() => {
    const physicsInterval = setInterval(() => {
      setItems(prev => {
        return prev
          .map(item => {
            // Apply gravity
            const nextVy = item.vy + 0.1;
            const nextY = item.y + item.vy * 0.8;
            const nextX = item.x + item.vx * 0.8;
            const nextRot = item.rotation + item.vrot;

            return {
              ...item,
              x: nextX,
              y: nextY,
              vy: nextVy,
              rotation: nextRot
            };
          })
          // Filter out items that fell off screen
          .filter(item => item.y < 110 && item.x > -10 && item.x < 110);
      });
    }, 16);

    return () => clearInterval(physicsInterval);
  }, []);

  const handleHover = (item, e) => {
    if (item.sliced) return;

    // Mark as sliced
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, sliced: true } : i));

    if (item.isBomb) {
      playBuzzer();
      onScoreChange(Math.max(0, score - 15));
      setShake(true);
      setTimeout(() => setShake(false), 300);
    } else {
      playPop();
      onScoreChange(score + 10);
    }
  };

  return (
    <div 
      ref={containerRef}
      style={styles.gameArea} 
      className={shake ? 'animate-shake' : ''}
    >
      <div style={styles.instructions}>
        ⚔️ SLICE FLOATING FRUITS BY SWIPING OVER THEM! Avoid bombs! ⚔️
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          onMouseEnter={(e) => handleHover(item, e)}
          onTouchStart={(e) => handleHover(item, e)}
          onTouchMove={(e) => handleHover(item, e)}
          style={{
            ...styles.item,
            left: `${item.x}%`,
            top: `${item.y}%`,
            fontSize: `${item.size}px`,
            transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.sliced ? 0.3 : 1})`,
            opacity: item.sliced ? 0 : 1,
            pointerEvents: item.sliced ? 'none' : 'auto',
            filter: item.isBomb ? 'none' : 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.4))'
          }}
        >
          {item.emoji}
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
  item: {
    position: 'absolute',
    userSelect: 'none',
    cursor: 'pointer',
    transition: 'transform 0.15s ease-out, opacity 0.15s ease-out'
  }
};
