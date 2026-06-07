import React, { useState, useEffect } from 'react';

export default function SumChaos({ score, onScoreChange, useSoundHook }) {
  const [grid, setGrid] = useState([]);
  const [targetSum, setTargetSum] = useState(10);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [shake, setShake] = useState(false);
  const { playPop, playBuzzer } = useSoundHook;

  const generateBoard = () => {
    // Determine target sum
    const target = 8 + Math.floor(Math.random() * 10); // 8 to 17
    setTargetSum(target);
    setSelectedIdx(null);

    // Generate at least one pair that adds up to target
    const firstNum = 2 + Math.floor(Math.random() * (target - 3));
    const secondNum = target - firstNum;

    const numbers = [firstNum, secondNum];

    // Fill the rest of the 9-cell grid with random numbers that don't easily add up
    while (numbers.length < 9) {
      const randomNum = 1 + Math.floor(Math.random() * (target - 1));
      numbers.push(randomNum);
    }

    // Shuffle
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    setGrid(shuffled);
  };

  useEffect(() => {
    generateBoard();
  }, []);

  const handleCellClick = (idx) => {
    if (selectedIdx === null) {
      // First selection
      playPop();
      setSelectedIdx(idx);
    } else if (selectedIdx === idx) {
      // De-select
      playPop();
      setSelectedIdx(null);
    } else {
      // Second selection -> check sum
      const num1 = grid[selectedIdx];
      const num2 = grid[idx];

      if (num1 + num2 === targetSum) {
        playPop();
        onScoreChange(score + 20);
        generateBoard();
      } else {
        playBuzzer();
        onScoreChange(Math.max(0, score - 6));
        setSelectedIdx(null);
        setShake(true);
        setTimeout(() => setShake(false), 300);
      }
    }
  };

  return (
    <div style={styles.gameArea} className={shake ? 'animate-shake' : ''}>
      <div style={styles.header}>
        <div style={styles.targetLabel}>TARGET SUM:</div>
        <div className="neon-text-pink animate-pulse-slow" style={styles.targetSum}>
          {targetSum}
        </div>
        <div style={styles.instructions}>
          Select TWO numbers that add up exactly to the target!
        </div>
      </div>

      <div style={styles.grid}>
        {grid.map((num, idx) => {
          const isSelected = selectedIdx === idx;
          return (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              className="glass-panel"
              style={{
                ...styles.cell,
                borderColor: isSelected ? 'var(--neon-pink)' : 'var(--border-color)',
                boxShadow: isSelected ? '0 0 15px var(--neon-pink)' : 'none',
                background: isSelected ? 'rgba(255, 0, 127, 0.15)' : 'rgba(255,255,255,0.03)'
              }}
            >
              {num}
            </button>
          );
        })}
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
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  targetLabel: {
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    letterSpacing: '1px'
  },
  targetSum: {
    fontSize: '2.8rem',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    lineHeight: '1.1'
  },
  instructions: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    maxWidth: '260px',
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
    cursor: 'pointer',
    borderRadius: '16px',
    transition: 'all 0.1s ease',
    outline: 'none',
    '&:hover': {
      transform: 'scale(1.05)',
      borderColor: 'var(--neon-pink)'
    }
  }
};
