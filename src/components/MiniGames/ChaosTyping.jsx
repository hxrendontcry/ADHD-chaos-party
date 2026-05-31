import React, { useState, useEffect, useRef } from 'react';

const WORDS = [
  'SKIBIDI', 'POGGERS', 'BEEF', 'HONK', 'YEET', 'OOF', 'SHREK', 
  'AMOGUS', 'SHEESH', 'GIGACHAD', 'BRUH', 'NOOB', 'BINGUS', 'DOGE'
];

const COLORS = ['var(--neon-pink)', 'var(--neon-cyan)', 'var(--neon-purple)', 'var(--neon-orange)', 'var(--neon-yellow)'];

export default function ChaosTyping({ score, onScoreChange, useSoundHook }) {
  const [targetWord, setTargetWord] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [wordColor, setWordColor] = useState(COLORS[0]);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const inputRef = useRef(null);
  
  const { playCoin, playKeypress } = useSoundHook;

  const pickWord = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    setTargetWord(word);
    setWordColor(color);
    setInputValue('');
  };

  useEffect(() => {
    pickWord();
    // Auto-focus input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value.toUpperCase();
    playKeypress();
    setInputValue(val);

    if (val === targetWord) {
      playCoin();
      onScoreChange(score + 15);
      setWordsCompleted(prev => prev + 1);
      pickWord();
    }
  };

  // Re-focus input if clicked anywhere in game area
  const handleAreaClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Function to render letters with colors based on progress
  const renderWordLetters = () => {
    return targetWord.split('').map((char, index) => {
      let letterColor = 'white';
      let textShadow = 'none';

      if (index < inputValue.length) {
        if (inputValue[index] === char) {
          letterColor = 'var(--neon-green)';
          textShadow = '0 0 10px rgba(57, 255, 20, 0.6)';
        } else {
          letterColor = 'var(--neon-pink)';
          textShadow = '0 0 10px rgba(255, 0, 127, 0.6)';
        }
      }

      return (
        <span 
          key={index} 
          style={{ 
            color: letterColor,
            textShadow,
            transition: 'color 0.1s'
          }}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div style={styles.gameArea} onClick={handleAreaClick}>
      <div style={styles.instructions}>⌨️ TYPE THE WORDS AS FAST AS POSSIBLE! ⌨️</div>

      <div style={styles.scoreCounter}>WORDS: {wordsCompleted}</div>

      <div style={styles.wordDisplay}>
        <h1 style={{ ...styles.word, textShadow: `0 0 20px ${wordColor}` }}>
          {renderWordLetters()}
        </h1>
      </div>

      <div style={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          className="neon-input"
          style={styles.typingInput}
          value={inputValue}
          onChange={handleChange}
          placeholder="TYPE HERE..."
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
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
    cursor: 'text'
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
  wordDisplay: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  word: {
    fontFamily: 'var(--font-display)',
    fontSize: '4.5rem',
    fontWeight: '800',
    letterSpacing: '5px'
  },
  inputContainer: {
    width: '100%',
    maxWidth: '350px',
    margin: '0 auto'
  },
  typingInput: {
    textAlign: 'center',
    fontSize: '1.3rem',
    letterSpacing: '2px',
    fontWeight: '600'
  }
};
