import React, { useState, useEffect, useRef } from 'react';
import BalloonPop from './MiniGames/BalloonPop';
import PanicClicker from './MiniGames/PanicClicker';
import StroopChaos from './MiniGames/StroopChaos';
import ChaosTyping from './MiniGames/ChaosTyping';
import QuickMath from './MiniGames/QuickMath';
import ClickRed from './MiniGames/ClickRed';
import SoundRepeat from './MiniGames/SoundRepeat';
import EmojiMatch from './MiniGames/EmojiMatch';
import ShakeSoda from './MiniGames/ShakeSoda';
import CoinCatch from './MiniGames/CoinCatch';
import KeyMasher from './MiniGames/KeyMasher';
import ColorTap from './MiniGames/ColorTap';
import TargetShoot from './MiniGames/TargetShoot';
import RhythmTap from './MiniGames/RhythmTap';
import FindImpostor from './MiniGames/FindImpostor';
import NumberConnect from './MiniGames/NumberConnect';

const GAME_COMPONENTS = {
  BalloonPop,
  PanicClicker,
  StroopChaos,
  ChaosTyping,
  QuickMath,
  ClickRed,
  SoundRepeat,
  EmojiMatch,
  ShakeSoda,
  CoinCatch,
  KeyMasher,
  ColorTap,
  TargetShoot,
  RhythmTap,
  FindImpostor,
  NumberConnect
};

const GAME_INSTRUCTIONS = {
  BalloonPop: { title: '🎈 Balloon Popper', desc: 'Pop as many neon balloons as you can! Avoid the black bombs!' },
  PanicClicker: { title: '⚡ Panic Clicker', desc: 'Click the button as fast as it moves!' },
  StroopChaos: { title: '🎨 Stroop Chaos', desc: 'Look at the word! Choose the matching text color or written word!' },
  ChaosTyping: { title: '⌨️ Chaos Typing', desc: 'Type the wacky words as fast as possible!' },
  QuickMath: { title: '🧮 Quick Math', desc: 'Choose YES or NO for simple math equations! (Keyboard: Arrow Left/Right)' },
  ClickRed: { title: '🔴 Click Red', desc: 'Click the red circle as fast as possible!' },
  SoundRepeat: { title: '🔊 Sound Repeat', desc: 'Repeat the flashing pattern of sounds and lights!' },
  EmojiMatch: { title: '🔍 Emoji Match', desc: 'Find the odd emoji out as fast as you can!' },
  ShakeSoda: { title: '🥤 Shake Soda', desc: 'Click/Tap the soda can repeatedly to shake it and explode it!' },
  CoinCatch: { title: '🗑️ Coin Catch', desc: 'Move your basket to catch falling coins and avoid bombs!' },
  KeyMasher: { title: '⌨️ Key Masher', desc: 'Mash the SPACEBAR or click the button as fast as possible!' },
  ColorTap: { title: '🌈 Color Tap', desc: 'Click/Tap the colored pad that matches the neon target word!' },
  TargetShoot: { title: '🎯 Target Shoot', desc: 'Shoot/Click the floating bullseyes as fast as possible! Do not miss!' },
  RhythmTap: { title: '⚡ Rhythm Tap', desc: 'Press SPACEBAR or click when the moving needle is in the green zone!' },
  FindImpostor: { title: '🔍 Find Impostor', desc: 'Scan the letter grid and click the single different character!' },
  NumberConnect: { title: '🔢 Number Connect', desc: 'Click the numbers in sequential order (1 → 2 → 3 → 4 → 5 → 6)!' }
};

export default function GameScreen({ 
  roomCode, 
  activeGame, 
  gamePhase, 
  playerId, 
  players, 
  socket, 
  useSoundHook, 
  isSolo, 
  onSoloScoreChange,
  roundDuration = 10 
}) {
  const [localScore, setLocalScore] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(roundDuration);
  const [opponentProgress, setOpponentProgress] = useState({}); // playerId -> progress
  const timerRef = useRef(null);
  
  // Ref to store the latest local score and prevent stale closure in the timer callback
  const localScoreRef = useRef(0);

  const { playTick, playBuzzer } = useSoundHook;

  const gameInfo = GAME_INSTRUCTIONS[activeGame] || { title: 'Prepare!', desc: 'Get ready for the next round.' };
  const GameComponent = GAME_COMPONENTS[activeGame];

  // 1. Handle 3s Instruction Countdown
  useEffect(() => {
    if (gamePhase === 'instruction') {
      setLocalScore(0);
      localScoreRef.current = 0;
      setCountdown(3);
      setTimeLeft(roundDuration);
      setOpponentProgress({});
      
      const countInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countInterval);
    }
  }, [gamePhase, activeGame, roundDuration]);

  // 2. Handle Gameplay Timer
  useEffect(() => {
    if (gamePhase === 'playing') {
      setTimeLeft(roundDuration);
      
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Auto submit when time hits 0
            handleTimeUp();
            return 0;
          }
          // Play tick sound on final 3 seconds
          if (prev <= 4) {
            playTick();
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [gamePhase, roundDuration]);

  // 3. Listen to real-time progress updates from opponents (Only if not in Solo)
  useEffect(() => {
    if (isSolo) return;

    const handleProgressUpdate = ({ playerId: senderId, progress }) => {
      if (senderId !== playerId) {
        setOpponentProgress(prev => ({
          ...prev,
          [senderId]: progress
        }));
      }
    };

    socket.on('progress-updated', handleProgressUpdate);
    return () => {
      socket.off('progress-updated', handleProgressUpdate);
    };
  }, [socket, playerId, isSolo]);

  const handleScoreChange = (newScore) => {
    setLocalScore(newScore);
    localScoreRef.current = newScore; // Update ref

    if (isSolo) {
      onSoloScoreChange(newScore);
    } else {
      // Send live score progress to opponents
      socket.emit('submit-progress', { code: roomCode, progress: newScore });
    }
  };

  const handleTimeUp = () => {
    playBuzzer();
    if (!isSolo) {
      // Submit latest score from Ref instead of stale localScore variable
      socket.emit('submit-round-score', { code: roomCode, score: localScoreRef.current });
    }
  };

  // Utility to get max score for progress percentage calculation
  const getMaxProgress = () => {
    const scores = Object.values(opponentProgress);
    scores.push(localScore);
    return Math.max(100, ...scores); // Base max at 100
  };

  const maxProgressVal = getMaxProgress();

  return (
    <div style={styles.container}>
      {gamePhase === 'instruction' ? (
        /* PHASE 1: INSTRUCTION COUNTDOWN SCREEN */
        <div className="glass-panel glass-panel-glow-pink animate-pulse" style={styles.instructionCard}>
          <p style={styles.prepareText}>GET READY FOR...</p>
          <h1 className="neon-text-pink" style={styles.gameTitle}>{gameInfo.title}</h1>
          <p style={styles.gameDesc}>{gameInfo.desc}</p>
          
          <div style={styles.countdownCircle}>
            <span style={styles.countdownNumber} className="neon-text-cyan">{countdown}</span>
          </div>
        </div>
      ) : (
        /* PHASE 2: ACTIVE GAMEPLAY SCREEN */
        <div style={styles.gameLayout}>
          {/* Main Gameplay Column */}
          <div style={styles.mainCol}>
            
            {/* Top Game Bar */}
            <div className="glass-panel" style={styles.topBar}>
              <h2 className="neon-text-cyan" style={{ fontSize: '1.4rem' }}>{gameInfo.title}</h2>
              <div style={styles.timerWrapper}>
                <span style={styles.timerText}>⏰ {timeLeft}s</span>
                <div style={styles.timerContainer}>
                  <div 
                    style={{ 
                      ...styles.timerProgress,
                      width: `${(timeLeft / roundDuration) * 100}%`,
                      backgroundColor: timeLeft <= 3 ? 'var(--neon-pink)' : 'var(--neon-green)',
                      boxShadow: timeLeft <= 3 ? '0 0 10px var(--neon-pink)' : '0 0 10px var(--neon-green)'
                    }} 
                  />
                </div>
              </div>
              <div style={styles.scoreBadge}>
                SCORE: <span className="neon-text-green">{localScore}</span>
              </div>
            </div>

            {/* Render dynamically loaded game */}
            {GameComponent && (
              <GameComponent
                score={localScore}
                onScoreChange={handleScoreChange}
                useSoundHook={useSoundHook}
              />
            )}
          </div>

          {/* Real-time Opponent Progress Sidebar */}
          <div className="glass-panel" style={styles.sidebar}>
            <h3 style={styles.sidebarTitle}>⚡ LIVE PROGRESS</h3>
            <div style={styles.opponentList}>
              {Object.values(players).map((p) => {
                const isSelf = p.id === playerId;
                const progressValue = isSelf ? localScore : (opponentProgress[p.id] || 0);
                const progressPercent = Math.min(100, (progressValue / maxProgressVal) * 100);
                
                return (
                  <div key={p.id} style={styles.opponentRow}>
                    <div style={styles.opponentMeta}>
                      <span>{p.avatar} {p.name} {isSelf && '(YOU)'}</span>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{progressValue}</span>
                    </div>
                    <div className="progress-container">
                      <div 
                        className={`progress-bar ${isSelf ? 'progress-pink' : 'progress-cyan'}`} 
                        style={{ width: `${progressPercent}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  instructionCard: {
    width: '100%',
    maxWidth: '500px',
    padding: '40px 30px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  },
  prepareText: {
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '1rem',
    color: 'var(--text-muted)',
    letterSpacing: '1px'
  },
  gameTitle: {
    fontSize: '2.8rem'
  },
  gameDesc: {
    fontSize: '1rem',
    lineHeight: '1.5',
    color: 'var(--text-muted)',
    marginBottom: '10px'
  },
  countdownCircle: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    border: '4px solid var(--neon-cyan)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)',
    animation: 'pulse 1s infinite'
  },
  countdownNumber: {
    fontFamily: 'var(--font-display)',
    fontSize: '3.2rem',
    fontWeight: '800'
  },
  gameLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 240px',
    gap: '20px',
    width: '100%',
    maxWidth: '850px'
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  topBar: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '15px'
  },
  timerWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    maxWidth: '300px'
  },
  timerText: {
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '1rem',
    width: '50px'
  },
  timerContainer: {
    flex: 1,
    height: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },
  timerProgress: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 1s linear'
  },
  scoreBadge: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.05rem',
    background: 'rgba(0, 0, 0, 0.2)',
    padding: '6px 14px',
    borderRadius: '10px',
    border: '1px solid var(--border-color)'
  },
  sidebar: {
    padding: '20px 15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  sidebarTitle: {
    fontSize: '0.9rem',
    letterSpacing: '1px',
    color: 'var(--text-muted)',
    textAlign: 'center'
  },
  opponentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  opponentRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  opponentMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    fontWeight: '600'
  }
};
