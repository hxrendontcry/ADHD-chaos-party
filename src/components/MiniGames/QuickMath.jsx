import React, { useState, useEffect } from 'react';

export default function QuickMath({ score, onScoreChange, useSoundHook }) {
  const [problem, setProblem] = useState(null);
  const [solved, setSolved] = useState(0);
  const [shake, setShake] = useState(false);
  const { playCoin, playBuzzer } = useSoundHook;

  const generateProblem = () => {
    const isAddition = Math.random() > 0.5;
    const num1 = 1 + Math.floor(Math.random() * 12);
    const num2 = 1 + Math.floor(Math.random() * 12);
    
    let equation = '';
    let actualResult = 0;
    
    if (isAddition) {
      equation = `${num1} + ${num2}`;
      actualResult = num1 + num2;
    } else {
      // Keep result positive for speed math simplicity
      const big = Math.max(num1, num2);
      const small = Math.min(num1, num2);
      equation = `${big} - ${small}`;
      actualResult = big - small;
    }

    // 50% chance to show incorrect answer
    const showCorrect = Math.random() > 0.5;
    const displayResult = showCorrect ? actualResult : actualResult + (Math.random() > 0.5 ? 1 : -1);

    setProblem({
      equation,
      displayResult,
      isCorrect: actualResult === displayResult
    });
  };

  useEffect(() => {
    generateProblem();
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handleAnswer(true);
      } else if (e.key === 'ArrowRight') {
        handleAnswer(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [problem, score]);

  const handleAnswer = (userSaysYes) => {
    if (!problem) return;

    const correct = userSaysYes === problem.isCorrect;

    if (correct) {
      playCoin();
      onScoreChange(score + 15);
      setSolved(prev => prev + 1);
    } else {
      playBuzzer();
      onScoreChange(Math.max(0, score - 10));
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }

    generateProblem();
  };

  if (!problem) return null;

  return (
    <div style={styles.gameArea} className={shake ? 'animate-shake' : ''}>
      <div style={styles.instructions}>
        🧮 CHOOSE YES OR NO! (← Arrow Left = YES, → Arrow Right = NO)
      </div>

      <div style={styles.scoreCounter}>SOLVED: {solved}</div>

      <div style={styles.mathDisplay}>
        <h1 className="neon-text-yellow" style={styles.equation}>
          {problem.equation} = {problem.displayResult}
        </h1>
      </div>

      <div style={styles.btnRow}>
        <button 
          className="btn" 
          style={{ ...styles.btn, ...styles.yesBtn }} 
          onClick={() => handleAnswer(true)}
        >
          ✅ YES (←)
        </button>
        <button 
          className="btn" 
          style={{ ...styles.btn, ...styles.noBtn }} 
          onClick={() => handleAnswer(false)}
        >
          ❌ NO (→)
        </button>
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
  scoreCounter: {
    position: 'absolute',
    bottom: '15px',
    left: '20px',
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--neon-cyan)',
    textShadow: '0 0 10px rgba(0, 240, 255, 0.3)'
  },
  mathDisplay: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  equation: {
    fontSize: '4.8rem',
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    letterSpacing: '2px'
  },
  btnRow: {
    display: 'flex',
    gap: '20px'
  },
  btn: {
    flex: 1,
    padding: '18px 0',
    fontSize: '1.3rem',
    borderRadius: '18px'
  },
  yesBtn: {
    background: 'var(--neon-green)',
    color: '#0b0b14',
    boxShadow: '0 4px 15px rgba(57, 255, 20, 0.3)',
    '&:hover': {
      boxShadow: '0 0 20px rgba(57, 255, 20, 0.6)'
    }
  },
  noBtn: {
    background: 'var(--neon-pink)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(255, 0, 127, 0.3)',
    '&:hover': {
      boxShadow: '0 0 20px rgba(255, 0, 127, 0.6)'
    }
  }
};
