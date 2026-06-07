import React, { useState, useEffect, useRef } from 'react';

const WORDS_POOL = ['NEON', 'CHAOS', 'RAPID', 'DOSE', 'JUICE', 'ZEST', 'HYPER', 'WACKY', 'FLASH', 'DOPAMINE', 'CLIK', 'BOOM', 'RUSH', 'WAVE'];

export default function WordRain({ score, onScoreChange, useSoundHook }) {
  const [words, setWords] = useState([]);
  const [typedText, setTypedText] = useState('');
  const [shake, setShake] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const wordIdRef = useRef(0);
  
  const { playPop, playBuzzer } = useSoundHook;

  // Auto-focus input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Fallback focus handler
    const handleGlobalClick = () => {
      if (inputRef.current) inputRef.current.focus();
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Spawn loop
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      setWords(prev => {
        if (prev.length >= 3) return prev; // Limit word count
        
        const randomWord = WORDS_POOL[Math.floor(Math.random() * WORDS_POOL.length)];
        const size = 18 + Math.random() * 4;
        
        const newWord = {
          id: wordIdRef.current++,
          text: randomWord,
          x: 10 + Math.random() * 70, // %
          y: 10, // % start near top
          speed: 0.6 + Math.random() * 0.8,
          size
        };
        return [...prev, newWord];
      });
    }, 1200);

    return () => clearInterval(spawnInterval);
  }, []);

  // Physics loop (downward movement)
  useEffect(() => {
    const physInterval = setInterval(() => {
      setWords(prev => {
        let hitBottom = false;

        const updated = prev.map(w => {
          const nextY = w.y + w.speed;
          if (nextY >= 80) {
            hitBottom = true;
          }
          return { ...w, y: nextY };
        });

        if (hitBottom) {
          playBuzzer();
          onScoreChange(Math.max(0, score - 8));
          setShake(true);
          setTimeout(() => setShake(false), 300);
          return updated.filter(w => w.y < 80);
        }

        return updated;
      });
    }, 30);

    return () => clearInterval(physInterval);
  }, [score]);

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    setTypedText(val);

    // Check if typed text matches any falling word
    const match = words.find(w => w.text === val);
    if (match) {
      playPop();
      onScoreChange(score + 20);
      setWords(prev => prev.filter(w => w.id !== match.id));
      setTypedText('');
    }
  };

  return (
    <div 
      ref={containerRef}
      style={styles.gameArea} 
      className={shake ? 'animate-shake' : ''}
    >
      <div style={styles.instructions}>
        ⌨️ TYPE THE FALLING WORDS TO VAPORIZE THEM! ⌨️
      </div>

      {/* Falling Words */}
      {words.map((w) => (
        <div
          key={w.id}
          style={{
            ...styles.word,
            left: `${w.x}%`,
            top: `${w.y}%`,
            fontSize: `${w.size}px`,
            color: 'var(--neon-cyan)',
            textShadow: '0 0 8px var(--neon-cyan)'
          }}
        >
          {w.text}
        </div>
      ))}

      {/* Input zone */}
      <div style={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          className="neon-input"
          style={styles.input}
          value={typedText}
          onChange={handleInputChange}
          placeholder="TYPE HERE..."
          autoComplete="off"
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
    position: 'relative',
    overflow: 'hidden',
    border: '2px solid rgba(255, 255, 255, 0.05)'
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
  word: {
    position: 'absolute',
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    letterSpacing: '1px',
    transform: 'translateX(-50%)',
    transition: 'top 0.03s linear'
  },
  inputWrapper: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    right: '20px',
    display: 'flex',
    justifyContent: 'center'
  },
  input: {
    maxWidth: '240px',
    textAlign: 'center',
    fontSize: '1.2rem',
    fontWeight: '800',
    letterSpacing: '2px',
    padding: '10px'
  }
};
