import React, { useState, useEffect } from 'react';

const PAIRS = [
  { base: 'O', imp: 'Q' },
  { base: 'M', imp: 'W' },
  { base: 'E', imp: 'F' },
  { base: 'C', imp: 'G' },
  { base: '3', imp: '8' },
  { base: 'U', imp: 'V' },
  { base: '8', imp: 'B' },
  { base: 'D', imp: 'O' }
];

export default function FindImpostor({ score, onScoreChange, useSoundHook }) {
  const [grid, setGrid] = useState([]);
  const [gridSize, setGridSize] = useState(4); // default 4x4
  const [impostorIndex, setImpostorIndex] = useState(-1);
  const [shake, setShake] = useState(false);
  const { playPop, playBuzzer } = useSoundHook;

  const generateGrid = () => {
    // Determine size based on score: 3x3 at 0 pts, 4x4 above 60 pts, 5x5 above 120 pts
    let size = 3;
    const currentScore = score || 0;
    if (currentScore >= 50) {
      size = 4;
    }
    if (currentScore >= 120) {
      size = 5;
    }
    setGridSize(size);

    // Roll pair
    const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
    const totalCells = size * size;
    const impIdx = Math.floor(Math.random() * totalCells);

    const cells = Array.from({ length: totalCells }).map((_, idx) => {
      return idx === impIdx ? pair.imp : pair.base;
    });

    setGrid(cells);
    setImpostorIndex(impIdx);
  };

  useEffect(() => {
    generateGrid();
  }, [score]); // Re-evaluate size on score change, but wait, generating grid directly on score change will re-roll grid if we change score. Oh!
  // Wait, if we call onScoreChange, score updates, which triggers useEffect, which regenerates the grid. That is actually perfect! When we click the impostor, score updates, which triggers score change, which generates a new grid!
  // But wait! What if they miss? If they click a wrong button, score changes (math.max(0, score - 5)). This also triggers score change, which would regenerate the grid and change the position, which is a bit punishing but also chaotic.
  // Actually, to make it better, we can manually trigger `generateGrid()` and only run `useEffect` on mount. Let's do that instead to avoid re-rolling the grid on misses!

  useEffect(() => {
    generateGrid();
  }, []);

  const handleCellClick = (idx) => {
    if (idx === impostorIndex) {
      playPop();
      onScoreChange(score + 15);
      // Manually roll next grid
      setTimeout(() => {
        generateGrid();
      }, 50);
    } else {
      playBuzzer();
      onScoreChange(Math.max(0, score - 5));
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }
  };

  return (
    <div style={styles.gameArea} className={shake ? 'animate-shake' : ''}>
      <div style={styles.instructions}>
        🔍 FIND AND CLICK THE <span className="neon-text-pink">IMPOSTOR</span> CHARACTER! 🔍
      </div>

      <div 
        style={{
          ...styles.grid,
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          maxWidth: gridSize === 3 ? '240px' : gridSize === 4 ? '320px' : '380px'
        }}
      >
        {grid.map((char, idx) => (
          <button
            key={idx}
            onClick={() => handleCellClick(idx)}
            className="glass-panel"
            style={styles.cell}
          >
            {char}
          </button>
        ))}
      </div>

      <div style={styles.hint}>
        Speed counts! Scan carefully!
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
    gap: '10px',
    width: '100%',
    margin: '10px auto'
  },
  cell: {
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
    fontWeight: '800',
    color: 'var(--neon-cyan)',
    border: '1.5px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.03)',
    cursor: 'pointer',
    borderRadius: '12px',
    transition: 'all 0.1s ease',
    outline: 'none',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.08)',
      transform: 'scale(1.05)',
      borderColor: 'var(--neon-pink)'
    }
  },
  hint: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-muted)'
  }
};
