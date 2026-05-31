import React, { useState, useEffect } from 'react';

const OPTIONS = [
  { name: 'RED', color: '#ff0055' },
  { name: 'BLUE', color: '#00f0ff' },
  { name: 'GREEN', color: '#39ff14' },
  { name: 'YELLOW', color: '#ffea00' }
];

const MODES = ['COLOR', 'WORD'];

export default function StroopChaos({ score, onScoreChange, useSoundHook }) {
  const [question, setQuestion] = useState(null);
  const [shake, setShake] = useState(false);
  const { playCoin, playBuzzer } = useSoundHook;

  const generateQuestion = () => {
    const wordOption = OPTIONS[Math.floor(Math.random() * OPTIONS.length)];
    const colorOption = OPTIONS[Math.floor(Math.random() * OPTIONS.length)];
    const mode = MODES[Math.floor(Math.random() * MODES.length)];

    setQuestion({
      word: wordOption.name,
      textColor: colorOption.color,
      colorName: colorOption.name,
      mode
    });
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  const handleAnswer = (answerName) => {
    if (!question) return;

    let isCorrect = false;
    if (question.mode === 'WORD') {
      isCorrect = answerName === question.word;
    } else {
      isCorrect = answerName === question.colorName;
    }

    if (isCorrect) {
      playCoin();
      onScoreChange(score + 20);
    } else {
      playBuzzer();
      onScoreChange(Math.max(0, score - 10));
      // Trigger shake
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }

    generateQuestion();
  };

  if (!question) return null;

  return (
    <div style={styles.gameArea} className={shake ? 'animate-shake' : ''}>
      
      <div style={styles.modeContainer}>
        {question.mode === 'WORD' ? (
          <div style={styles.modeTextWord} className="animate-pulse-slow">
            👉 TAP THE WRITTEN WORD 👈
          </div>
        ) : (
          <div style={styles.modeTextColor} className="animate-pulse-slow">
            👉 TAP THE TEXT COLOR 👈
          </div>
        )}
      </div>

      <div style={styles.displayArea}>
        <h1 
          style={{
            ...styles.targetWord,
            color: question.textColor,
            textShadow: `0 0 25px ${question.textColor}`
          }}
        >
          {question.word}
        </h1>
      </div>

      <div style={styles.buttonsContainer}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.name}
            onClick={() => handleAnswer(opt.name)}
            className="btn btn-secondary"
            style={styles.answerBtn}
          >
            {opt.name}
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
    border: '2px solid rgba(255, 255, 255, 0.05)',
  },
  modeContainer: {
    textAlign: 'center',
    padding: '5px'
  },
  modeTextWord: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.25rem',
    color: 'var(--neon-pink)',
    textShadow: '0 0 10px rgba(255, 0, 127, 0.4)'
  },
  modeTextColor: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.25rem',
    color: 'var(--neon-cyan)',
    textShadow: '0 0 10px rgba(0, 240, 255, 0.4)'
  },
  displayArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  targetWord: {
    fontFamily: 'var(--font-display)',
    fontSize: '5rem',
    fontWeight: '800',
    letterSpacing: '2px',
    transition: 'all 0.15s ease'
  },
  buttonsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px'
  },
  answerBtn: {
    padding: '16px 0',
    fontSize: '1.2rem',
    letterSpacing: '1px'
  }
};
