import React, { useState, useEffect, useRef } from 'react';

export default function CoinCatch({ score, onScoreChange, useSoundHook }) {
  const [basketX, setBasketX] = useState(150); // pixels
  const [items, setItems] = useState([]);
  const [scorePopups, setScorePopups] = useState([]);
  const [shake, setShake] = useState(false);
  
  const containerRef = useRef(null);
  const itemIdRef = useRef(0);
  const { playCoin, playBuzzer } = useSoundHook;

  // Handle Mouse movement inside container to move the basket
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    // Constrain basket within container
    x = Math.max(35, Math.min(rect.width - 35, x));
    setBasketX(x);
  };

  // Touch support for mobile
  const handleTouchMove = (e) => {
    if (!containerRef.current || !e.touches[0]) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = e.touches[0].clientX - rect.left;
    x = Math.max(35, Math.min(rect.width - 35, x));
    setBasketX(x);
  };

  // Spawn falling items
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      const isBomb = Math.random() > 0.8;
      const newItem = {
        id: itemIdRef.current++,
        x: 5 + Math.random() * 90, // percentage (5% to 95%)
        y: -10, // top (percentage)
        speed: 1.5 + Math.random() * 2,
        isBomb
      };
      setItems(prev => [...prev, newItem]);
    }, 450);

    return () => clearInterval(spawnInterval);
  }, []);

  // Move items down and check collisions at the bottom
  useEffect(() => {
    const moveInterval = setInterval(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      setItems(prev => {
        const remaining = [];
        
        prev.forEach(item => {
          const nextY = item.y + item.speed;
          
          // Check collision when item hits the basket level (y >= 90%)
          if (nextY >= 90 && item.y < 90) {
            // Convert item x percent to pixels
            const itemXPix = (item.x / 100) * rect.width;
            
            // Check if item falls within the basket width (70px wide, so offset +/- 35px)
            const distance = Math.abs(itemXPix - basketX);
            if (distance < 40) {
              // Caught!
              handleCatch(item, itemXPix);
            } else {
              // Missed and fell off-screen
              remaining.push({ ...item, y: nextY });
            }
          } else if (nextY < 100) {
            remaining.push({ ...item, y: nextY });
          }
        });

        return remaining;
      });
    }, 30);

    return () => clearInterval(moveInterval);
  }, [basketX, score]);

  const handleCatch = (item, itemXPix) => {
    let pointsGained = 0;
    let color = 'white';

    if (item.isBomb) {
      playBuzzer();
      pointsGained = -25;
      color = 'var(--neon-pink)';
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } else {
      playCoin();
      pointsGained = 15;
      color = 'var(--neon-yellow)';
    }

    onScoreChange(Math.max(0, score + pointsGained));

    // Show floating score popup
    const popupText = pointsGained > 0 ? `+${pointsGained}` : `${pointsGained}`;
    const newPopup = {
      id: Math.random(),
      x: itemXPix,
      text: popupText,
      color
    };
    setScorePopups(prev => [...prev, newPopup]);
    setTimeout(() => {
      setScorePopups(prev => prev.filter(p => p.id !== newPopup.id));
    }, 700);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      className={shake ? 'animate-shake' : ''}
      style={styles.gameArea}
    >
      <div style={styles.instructions}>🗑️ CATCH COINS 🪙 AVOID BOMBS 💣 (Move Mouse/Touch)</div>

      {/* Basket */}
      <div
        style={{
          ...styles.basket,
          left: `${basketX}px`,
        }}
      >
        <div style={styles.basketLip}></div>
        <div style={styles.basketBase}>🪣 BASKET</div>
      </div>

      {/* Falling Items */}
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            ...styles.fallingItem,
            left: `${item.x}%`,
            top: `${item.y}%`,
            boxShadow: item.isBomb ? '0 0 12px rgba(255,0,127,0.5)' : '0 0 12px rgba(255,234,0,0.5)'
          }}
        >
          {item.isBomb ? '💣' : '🪙'}
        </div>
      ))}

      {/* Floating score text */}
      {scorePopups.map((p) => (
        <div
          key={p.id}
          style={{
            ...styles.popup,
            left: `${p.x}px`,
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
    cursor: 'none' // Hide default cursor to use basket instead
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
  basket: {
    width: '80px',
    height: '35px',
    position: 'absolute',
    bottom: '10px',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    pointerEvents: 'none',
    zIndex: 3
  },
  basketLip: {
    height: '6px',
    background: '#ccc',
    borderRadius: '3px',
    border: '1px solid white',
    boxShadow: '0 0 8px rgba(255,255,255,0.4)'
  },
  basketBase: {
    flex: 1,
    background: 'linear-gradient(to bottom, var(--neon-cyan), #00a0cc)',
    border: '1px solid white',
    borderRadius: '0 0 10px 10px',
    color: '#0b0b14',
    fontSize: '0.65rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)'
  },
  fallingItem: {
    position: 'absolute',
    fontSize: '1.8rem',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none'
  },
  popup: {
    position: 'absolute',
    bottom: '50px', // pops up near basket level
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.4rem',
    pointerEvents: 'none',
    animation: 'floatUp 0.7s forwards ease-out',
    transform: 'translateX(-50%)'
  }
};
