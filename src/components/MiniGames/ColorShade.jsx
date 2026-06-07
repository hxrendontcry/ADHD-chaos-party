import React, { useState, useEffect } from 'react';

export default function ColorShade({ score, onScoreChange, useSoundHook }) {
  const [grid, setGrid] = useState([]);
  const [oddIdx, setOddIdx] = useState(-1);
  const [baseColor, setBaseColor] = useState('');
  const [oddColor, setOddColor] = useState('');
  const [gridSize, setGridSize] = useState(3); // 3x3 or 4x4
  const [shake, setShake] = useState(false);
  const { playPop, playBuzzer } = useSoundHook;

  const generateColors = () => {
    // Determine grid size
    const currentScore = score || 0;
    const size = currentScore >= 80 ? 4 : 3;
    setGridSize(size);

    const totalCells = size * size;
    const odd = Math.floor(Math.random() * totalCells);
    setOddIdx(odd);

    // Pick base color HSL
    const h = Math.floor(Math.random() * 360);
    const s = 70 + Math.floor(Math.random() * 20); // 70-90%
    const l = 40 + Math.floor(Math.random() * 20); // 40-60%

    // Calculate shade offset. Narrows as score increases.
    const baseDiff = 25; // initial offset
    const diff = Math.max(3, baseDiff - Math.floor(currentScore / 18));
    const oddL = l + (Math.random() > 0.5 ? diff : -diff);

    const baseCol = `hsl(${h}, ${s}%, ${l}%)`;
    const oddCol = `hsl(${h}, ${s}%, ${oddL}%)`;

    setBaseColor(baseCol);
    setOddColor(oddCol);

    const cells = Array.from({ length: totalCells }).map((_, idx) => {
      return idx === odd ? oddCol : baseCol;
    });
    setGrid(cells);
  };

  useEffect(() => {
    generateColors();
  }, []);

  const handleCellClick = (idx) => {
    if (idx === oddIdx) {
      playPop();
      onScoreChange(score + 15);
      generateColors();
    } else {
      playBuzzer();
      onScoreChange(Math.max(0, score - 6));
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }
  };

  return (
    <div style={styles.gameArea} className={shake ? 'animate-shake' : ''}>
      <div style={styles.instructions}>
        🎨 SPOT THE SQUARE WITH A SLIGHTLY DIFFERENT COLOR SHADE! 🎨
      </div>

      <div 
        style={{
          ...styles.grid,
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          maxWidth: gridSize === 3 ? '240px' : '300px'
        }}
      >
        {grid.map((color, idx) => (
          <div
            key={idx}
            onClick={() => handleCellClick(idx)}
            style={{
              ...styles.cell,
              backgroundColor: color,
              boxShadow: `0 0 10px rgba(0, 0, 0, 0.2)`
            }}
          />
        ))}
      </div>

      <div style={styles.hint}>
        Hurry up! Precision scanning is key!
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
    border: '2px solid rgba(255, 255, 255, 0.05)'
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
    gap: '12px',
    width: '100%',
    margin: '10px auto'
  },
  cell: {
    aspectRatio: '1',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
    border: '1.5px solid rgba(255,255,255,0.05)',
    '&:hover': {
      transform: 'scale(1.03)',
      borderColor: 'rgba(255,255,255,0.3)'
    }
  },
  hint: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-muted)'
  }
};
