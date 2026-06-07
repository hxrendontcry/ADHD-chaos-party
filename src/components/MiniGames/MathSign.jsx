import React, { useState, useEffect } from 'react';

const OPERATORS = [
  { sign: '+', display: '＋' },
  { sign: '-', display: '－' },
  { sign: '*', display: '×' },
  { sign: '/', display: '÷' }
];

export default function MathSign({ score, onScoreChange, useSoundHook }) {
  const [numA, setNumA] = useState(0);
  const [numB, setNumB] = useState(0);
  const [result, setResult] = useState(0);
  const [correctSign, setCorrectSign] = useState('');
  const [shake, setShake] = useState(false);
  const { playPop, playBuzzer } = useSoundHook;

  const generateEquation = () => {
    // Pick a random operator
    const op = OPERATORS[Math.floor(Math.random() * OPERATORS.length)].sign;
    setCorrectSign(op);

    let a = 0, b = 0, res = 0;

    switch (op) {
      case '+':
        a = 2 + Math.floor(Math.random() * 18); // 2-19
        b = 2 + Math.floor(Math.random() * 18);
        res = a + b;
        break;
      case '-':
        a = 5 + Math.floor(Math.random() * 25); // 5-29
        b = 1 + Math.floor(Math.random() * (a - 2)); // b < a
        res = a - b;
        break;
      case '*':
        a = 2 + Math.floor(Math.random() * 8); // 2-9
        b = 2 + Math.floor(Math.random() * 8);
        res = a * b;
        break;
      case '/':
        b = 2 + Math.floor(Math.random() * 8); // divisor 2-9
        res = 2 + Math.floor(Math.random() * 8); // result 2-9
        a = b * res; // dividend
        break;
      default:
        break;
    }

    setNumA(a);
    setNumB(b);
    setResult(res);
  };

  useEffect(() => {
    generateEquation();
  }, []);

  const handleOperatorClick = (sign) => {
    if (sign === correctSign) {
      playPop();
      onScoreChange(score + 20);
      generateEquation();
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
        🧮 FILL IN THE MISSING OPERATOR TO SOLVE THE EQUATION! 🧮
      </div>

      <div className="glass-panel" style={styles.equationCard}>
        <span style={styles.number}>{numA}</span>
        <span className="neon-text-pink animate-pulse-slow" style={styles.missingSign}>
          [ ? ]
        </span>
        <span style={styles.number}>{numB}</span>
        <span style={styles.equal}>=</span>
        <span className="neon-text-cyan" style={styles.number}>{result}</span>
      </div>

      <div style={styles.grid}>
        {OPERATORS.map((op) => (
          <button
            key={op.sign}
            onClick={() => handleOperatorClick(op.sign)}
            className="btn btn-secondary animate-float"
            style={{ 
              ...styles.button,
              animationDelay: `${Math.random() * 2}s`
            }}
          >
            {op.display}
          </button>
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
    border: '2px solid rgba(255, 255, 255, 0.05)'
  },
  instructions: {
    textAlign: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4'
  },
  equationCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '20px 10px',
    maxWidth: '320px',
    width: '100%',
    margin: '10px auto',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1.5px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '16px'
  },
  number: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.2rem',
    fontWeight: '800'
  },
  missingSign: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.8rem',
    fontWeight: '800'
  },
  equal: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--text-muted)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    width: '100%',
    margin: '10px auto'
  },
  button: {
    height: '52px',
    fontSize: '1.4rem',
    padding: '0',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
  }
};
