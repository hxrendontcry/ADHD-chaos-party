import React, { useState, useEffect, useRef } from 'react';

const COLORS = [
  { name: 'RED', color: '#ff0055', glow: 'rgba(255,0,85,0.4)' },
  { name: 'BLUE', color: '#00f0ff', glow: 'rgba(0,240,255,0.4)' },
  { name: 'GREEN', color: '#39ff14', glow: 'rgba(57,255,20,0.4)' },
  { name: 'YELLOW', color: '#ffea00', glow: 'rgba(255,234,0,0.4)' }
];

export default function SoundRepeat({ score, onScoreChange, useSoundHook }) {
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [activeButton, setActiveButton] = useState(-1);
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [shake, setShake] = useState(false);
  
  const { playCoin, playBuzzer } = useSoundHook;
  const sequenceLengthRef = useRef(3);

  // Play audio tone dynamically
  const playTone = (colorIdx) => {
    try {
      const frequencies = [261.63, 329.63, 392.00, 523.25];
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(frequencies[colorIdx], ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn(e);
    }
  };

  const generateSequence = (length) => {
    const newSeq = [];
    for (let i = 0; i < length; i++) {
      newSeq.push(Math.floor(Math.random() * 4));
    }
    setSequence(newSeq);
    setUserSequence([]);
    playSequence(newSeq);
  };

  const playSequence = (seq) => {
    setIsPlayingSeq(true);
    let step = 0;
    
    const interval = setInterval(() => {
      if (step >= seq.length) {
        clearInterval(interval);
        setActiveButton(-1);
        setIsPlayingSeq(false);
        return;
      }

      const currentBtn = seq[step];
      setActiveButton(currentBtn);
      playTone(currentBtn);

      setTimeout(() => {
        setActiveButton(-1);
      }, 300);

      step++;
    }, 550);
  };

  useEffect(() => {
    sequenceLengthRef.current = 3;
    generateSequence(3);
  }, []);

  const handleButtonClick = (btnIdx) => {
    if (isPlayingSeq) return;

    playTone(btnIdx);
    setActiveButton(btnIdx);
    setTimeout(() => setActiveButton(-1), 150);

    const nextUserSeq = [...userSequence, btnIdx];
    setUserSequence(nextUserSeq);

    // Verify step
    const currentStep = nextUserSeq.length - 1;
    if (nextUserSeq[currentStep] !== sequence[currentStep]) {
      // Wrong!
      playBuzzer();
      onScoreChange(Math.max(0, score - 10));
      setShake(true);
      setTimeout(() => setShake(false), 400);
      
      // Reset sequence
      sequenceLengthRef.current = 3;
      setTimeout(() => generateSequence(3), 800);
      return;
    }

    // Check if finished sequence
    if (nextUserSeq.length === sequence.length) {
      playCoin();
      onScoreChange(score + 30);
      
      // Increase difficulty
      sequenceLengthRef.current += 1;
      setTimeout(() => generateSequence(sequenceLengthRef.current), 800);
    }
  };

  return (
    <div style={styles.gameArea} className={shake ? 'animate-shake' : ''}>
      <div style={styles.instructions}>
        🔊 REPEAT THE FLASHING PATTERN! {isPlayingSeq ? ' (WATCH...)' : ' (YOUR TURN!)'}
      </div>

      <div style={styles.grid}>
        {COLORS.map((col, idx) => {
          const isActive = idx === activeButton;
          return (
            <div
              key={col.name}
              onClick={() => handleButtonClick(idx)}
              style={{
                ...styles.button,
                backgroundColor: col.color,
                opacity: isActive ? 1 : 0.45,
                boxShadow: isActive ? `0 0 30px ${col.color}` : 'none',
                transform: isActive ? 'scale(1.05)' : 'none',
                cursor: isPlayingSeq ? 'not-allowed' : 'pointer'
              }}
            />
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
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    maxWidth: '260px',
    width: '100%',
    margin: '10px auto'
  },
  button: {
    aspectRatio: '1',
    borderRadius: '16px',
    transition: 'all 0.15s ease',
  }
};
