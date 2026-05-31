import React, { useState, useEffect } from 'react';

const EMOJI_PAIRS = [
  { normal: '🐱', odd: '🐶' },
  { normal: '🍎', odd: '🍓' },
  { normal: '🦖', odd: '🐉' },
  { normal: '👽', odd: '🤖' },
  { normal: '🍕', odd: '🍔' },
  { normal: '🍩', odd: '🍪' },
  { normal: '🚗', odd: '🚓' },
  { normal: '⚽', odd: '🏀' }
];

export default function EmojiMatch({ score, onScoreChange, useSoundHook }) {
  const [grid, setGrid] = useState([]);
  const [oddIdx, setOddIdx] = useState(-1);
  const [shake, setShake] = useState(false);
  const { playCoin, playBuzzer } = useSoundHook;

  const generateGrid = () => {
    const pair = EMOJI_PAIRS[Math.floor(Math.random() * EMOJI_PAIRS.length)];
    const tempGrid = Array(25).fill(pair.normal);
    const targetIdx = Math.floor(Math.random() * 25);
    tempGrid[targetIdx] = pair.odd;
    
    setGrid(tempGrid);
    setOddIdx(targetIdx);
  };

  useEffect(() => {
    generateGrid();
  }, []);

  const handleEmojiClick = (idx) => {
    if (idx === oddIdx) {
      playCoin();
      onScoreChange(score + 20);
      generateGrid();
    } else {
      playBuzzer();
      onScoreChange(Math.max(0, score - 10));
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  return (
    <div style={styles.gameArea} className={shake ? 'animate-shake' : ''}>
      <div style={styles.instructions}>🔍 FIND THE ODD EMOJI OUT! 🔍</div>

      <div style={styles.grid}>
        {grid.map((emoji, idx) => (
          <div
            key={idx}
            onClick={() => handleEmojiClick(idx)}
            style={styles.emojiItem}
          >
            {emoji}
          </div>
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
  instructions: {
    textAlign: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '1rem',
    color: 'var(--text-muted)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px',
    maxWidth: '280px',
    width: '100%',
    margin: '10px auto'
  },
  emojiItem: {
    aspectRatio: '1',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.6rem',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.08)',
      transform: 'scale(1.08)'
    }
  }
};
