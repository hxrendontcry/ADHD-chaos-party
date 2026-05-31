import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import Room from './components/Room';
import GameScreen from './components/GameScreen';
import Leaderboard from './components/Leaderboard';
import Podiums from './components/Podiums';
import { useSound } from './hooks/useSound';

// Setup connection URL dynamically so friends can connect on local IP
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : `http://${window.location.hostname}:3001`);

const socket = io(SOCKET_URL, { autoConnect: false });

export default function App() {
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  
  // Stages: 'lobby' | 'room' | 'game' | 'leaderboard' | 'gameover'
  const [stage, setStage] = useState('lobby');
  
  // Game state
  const [activeGame, setActiveGame] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [gamePhase, setGamePhase] = useState('instruction'); // 'instruction' | 'playing'
  const [isSoloMode, setIsSoloMode] = useState(false);

  // References for Solo Mode Timers
  const soloInstructionTimer = useRef(null);
  const soloPlayTimer = useRef(null);
  const soloBotProgressTimer = useRef(null);
  const soloLocalScoreRef = useRef(0); // Cache local score for timer reference

  // Sound system hook
  const soundHook = useSound();
  const { startBGM, stopBGM, muted, toggleMute, playBuzzer } = soundHook;

  // Connect socket on mount
  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  // Multi-player Socket listeners
  useEffect(() => {
    socket.on('room-updated', (updatedRoom) => {
      if (!isSoloMode) setRoom(updatedRoom);
    });

    socket.on('game-started', ({ miniGamesOrder, players }) => {
      if (!isSoloMode) {
        setStage('game');
        setRoom(prev => ({ ...prev, players }));
        startBGM();
      }
    });

    socket.on('round-instruction', ({ game, roundIndex }) => {
      if (!isSoloMode) {
        setActiveGame(game);
        setCurrentRound(roundIndex);
        setGamePhase('instruction');
        setStage('game');
      }
    });

    socket.on('round-start', ({ game, duration }) => {
      if (!isSoloMode) {
        setGamePhase('playing');
      }
    });

    socket.on('round-completed', ({ players, currentRound: completedRound }) => {
      if (!isSoloMode) {
        setRoom(prev => ({ ...prev, players }));
        setStage('leaderboard');
      }
    });

    socket.on('game-over', ({ players }) => {
      if (!isSoloMode) {
        setRoom(prev => ({ ...prev, players }));
        setStage('gameover');
        stopBGM();
      }
    });

    socket.on('game-restarted', (restartedRoom) => {
      if (!isSoloMode) {
        setRoom(restartedRoom);
        setStage('room');
      }
    });

    socket.on('player-left', ({ playerId: leftId }) => {
      if (!isSoloMode) {
        setRoom((prev) => {
          if (!prev) return null;
          const newPlayers = { ...prev.players };
          delete newPlayers[leftId];
          return { ...prev, players: newPlayers };
        });
      }
    });

    return () => {
      socket.off('room-updated');
      socket.off('game-started');
      socket.off('round-instruction');
      socket.off('round-start');
      socket.off('round-completed');
      socket.off('game-over');
      socket.off('game-restarted');
      socket.off('player-left');
    };
  }, [isSoloMode, startBGM, stopBGM]);

  // Solo Mode Game Loop Logic
  useEffect(() => {
    if (!isSoloMode) return;

    if (stage === 'game') {
      if (gamePhase === 'instruction') {
        // Reset local score cache
        soloLocalScoreRef.current = 0;
        
        // Phase 1: 3 seconds instruction page
        soloInstructionTimer.current = setTimeout(() => {
          setGamePhase('playing');
        }, 3000);
      } 
      
      else if (gamePhase === 'playing') {
        // Start Bot progress increase interval
        soloBotProgressTimer.current = setInterval(() => {
          setRoom(prev => {
            if (!prev) return null;
            const updatedPlayers = { ...prev.players };
            if (updatedPlayers.BOT) {
              const increment = Math.floor(Math.random() * 8) + 4; // Add 4-11 points
              updatedPlayers.BOT.currentRoundScore += increment;
            }
            return { ...prev, players: updatedPlayers };
          });
        }, 600);

        // Phase 2: 10 seconds gameplay page
        soloPlayTimer.current = setTimeout(() => {
          // Play buzzer on time up
          playBuzzer();
          
          // Clear Bot progress updates
          clearInterval(soloBotProgressTimer.current);

          // Commit final round scores to total scores
          setRoom(prev => {
            if (!prev) return null;
            const updatedPlayers = { ...prev.players };
            
            // Add scores
            updatedPlayers.YOU.score += soloLocalScoreRef.current;
            updatedPlayers.YOU.currentRoundScore = soloLocalScoreRef.current;
            
            updatedPlayers.BOT.score += updatedPlayers.BOT.currentRoundScore;
            
            return { ...prev, players: updatedPlayers };
          });

          // Transition to Leaderboard
          setStage('leaderboard');

          // Schedule next round or game over in 5 seconds
          setTimeout(() => {
            setRoom(prev => {
              if (!prev) return null;
              
              const nextRoundIndex = prev.currentRound + 1;
              const hasNextRound = nextRoundIndex < prev.miniGamesOrder.length;
              
              if (hasNextRound) {
                // Prepare next round
                setCurrentRound(nextRoundIndex);
                setActiveGame(prev.miniGamesOrder[nextRoundIndex]);
                setGamePhase('instruction');
                
                // Reset round scores
                const resetPlayers = { ...prev.players };
                resetPlayers.YOU.currentRoundScore = 0;
                resetPlayers.BOT.currentRoundScore = 0;
                
                setStage('game');
                return {
                  ...prev,
                  currentRound: nextRoundIndex,
                  players: resetPlayers
                };
              } else {
                // Game Over
                setStage('gameover');
                stopBGM();
                return prev;
              }
            });
          }, 5000);

        }, 10000);
      }
    }

    return () => {
      clearTimeout(soloInstructionTimer.current);
      clearTimeout(soloPlayTimer.current);
      clearInterval(soloBotProgressTimer.current);
    };
  }, [isSoloMode, stage, gamePhase]);

  // Handle local score changes from Solo Game Screen
  const handleSoloScoreChange = (newScore) => {
    soloLocalScoreRef.current = newScore;
    setRoom(prev => {
      if (!prev) return null;
      const updatedPlayers = { ...prev.players };
      if (updatedPlayers.YOU) {
        updatedPlayers.YOU.currentRoundScore = newScore;
      }
      return { ...prev, players: updatedPlayers };
    });
  };

  // Trigger start game for Solo
  useEffect(() => {
    if (isSoloMode && room && stage === 'lobby') {
      setStage('game');
      setActiveGame(room.miniGamesOrder[0]);
      setCurrentRound(0);
      setGamePhase('instruction');
      startBGM();
    }
  }, [isSoloMode, room, stage]);

  const handleSoloRestart = () => {
    // Re-shuffle mini-games
    const shuffled = ['BalloonPop', 'PanicClicker', 'StroopChaos', 'ChaosTyping', 'QuickMath'].sort(() => Math.random() - 0.5);
    
    setRoom(prev => {
      const resetPlayers = { ...prev.players };
      resetPlayers.YOU.score = 0;
      resetPlayers.YOU.currentRoundScore = 0;
      resetPlayers.BOT.score = 0;
      resetPlayers.BOT.currentRoundScore = 0;

      return {
        ...prev,
        currentRound: 0,
        miniGamesOrder: shuffled,
        players: resetPlayers
      };
    });

    setStage('game');
    setCurrentRound(0);
    setActiveGame(shuffled[0]);
    setGamePhase('instruction');
    startBGM();
  };

  const handleSoloExit = () => {
    setIsSoloMode(false);
    setRoom(null);
    setPlayerId(null);
    setStage('lobby');
    stopBGM();
  };

  // Dynamic layout rendering based on current stage
  const renderStage = () => {
    switch (stage) {
      case 'lobby':
        return (
          <Lobby
            socket={socket}
            setRoom={setRoom}
            setPlayerId={setPlayerId}
            useSoundHook={soundHook}
            setSoloMode={setIsSoloMode}
          />
        );
      case 'room':
        return (
          <Room
            room={room}
            playerId={playerId}
            socket={socket}
            useSoundHook={soundHook}
          />
        );
      case 'game':
        return (
          <GameScreen
            roomCode={room.code}
            activeGame={activeGame}
            gamePhase={gamePhase}
            playerId={playerId}
            players={room.players}
            socket={socket}
            useSoundHook={soundHook}
            // Overrides for Solo Mode
            isSolo={isSoloMode}
            onSoloScoreChange={handleSoloScoreChange}
          />
        );
      case 'leaderboard':
        return (
          <Leaderboard
            players={room.players}
            currentRound={currentRound}
            playerId={playerId}
          />
        );
      case 'gameover':
        return (
          <Podiums
            players={room.players}
            playerId={playerId}
            room={room}
            socket={socket}
            useSoundHook={soundHook}
            isSolo={isSoloMode}
            onSoloRestart={handleSoloRestart}
            onSoloExit={handleSoloExit}
          />
        );
      default:
        return <div>Unknown Stage</div>;
    }
  };

  return (
    <div>
      {/* Floating Sound Toggle */}
      <button 
        className="sound-toggle-btn" 
        onClick={toggleMute}
        title={muted ? "Unmute sounds" : "Mute sounds"}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {/* Header decoration */}
      <div style={styles.topDecoration} />

      {/* Main app content container */}
      <main style={styles.main}>
        {renderStage()}
      </main>
    </div>
  );
}

const styles = {
  topDecoration: {
    height: '6px',
    background: 'linear-gradient(90deg, var(--neon-pink) 0%, var(--neon-cyan) 50%, var(--neon-yellow) 100%)',
    boxShadow: '0 0 15px rgba(255, 0, 127, 0.4)'
  },
  main: {
    minHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch'
  }
};
