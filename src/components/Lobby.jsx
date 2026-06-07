import React, { useState, useEffect } from 'react';
import { getTopScores } from '../supabase';

const AVATARS = ['👾', '🤪', '🦖', '🦙', '🍕', '🚀', '🦄', '💣', '🌶️', '🤡', '🍩', '🥑', '🍄', '🐙', '🐈'];

// Pool of all 20 available mini-games
const ALL_MINI_GAMES = [
  'BalloonPop', 'PanicClicker', 'StroopChaos', 'ChaosTyping', 'QuickMath', 
  'ClickRed', 'SoundRepeat', 'EmojiMatch', 'ShakeSoda', 'CoinCatch', 
  'KeyMasher', 'ColorTap', 'TargetShoot', 'RhythmTap', 'FindImpostor', 
  'NumberConnect', 'SumChaos', 'ColorShade', 'FruitSlice', 'WordRain'
];

const GAME_LABELS = {
  BalloonPop: '🎈 Balloon Pop',
  PanicClicker: '⚡ Panic Clicker',
  StroopChaos: '🎨 Stroop Chaos',
  ChaosTyping: '⌨️ Chaos Typing',
  QuickMath: '🧮 Quick Math',
  ClickRed: '🔴 Click Red',
  SoundRepeat: '🔊 Sound Repeat',
  EmojiMatch: '🔍 Emoji Match',
  ShakeSoda: '🥤 Shake Soda',
  CoinCatch: '🗑️ Coin Catch',
  KeyMasher: '⌨️ Key Masher',
  ColorTap: '🌈 Color Tap',
  TargetShoot: '🎯 Target Shoot',
  RhythmTap: '⚡ Rhythm Tap',
  FindImpostor: '🔍 Find Impostor',
  NumberConnect: '🔢 Number Connect',
  SumChaos: '🧮 Sum Chaos',
  ColorShade: '🎨 Color Shade',
  FruitSlice: '⚔️ Fruit Slasher',
  WordRain: '⌨️ Word Rain'
};

function getBotName(difficulty) {
  switch (difficulty) {
    case 'easy': return 'Potato Bot 🥔';
    case 'hard': return 'Pro Cyber ⚡';
    case 'insane': return 'CyberGod 👽';
    default: return 'Bot Turbo 🤖';
  }
}

export default function Lobby({ socket, setRoom, setPlayerId, useSoundHook, setSoloMode, setStage }) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [code, setCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [error, setError] = useState('');
  const [highScores, setHighScores] = useState([]);
  
  const [roundsCount, setRoundsCount] = useState(5);
  const [roundDuration, setRoundDuration] = useState(10);
  const [botDifficulty, setBotDifficulty] = useState('medium');
  const [enabledGames, setEnabledGames] = useState(new Set(ALL_MINI_GAMES));
  const [showGameSelector, setShowGameSelector] = useState(false);
  
  const { playCoin, playBuzzer } = useSoundHook;

  // Fetch High Scores on mount
  useEffect(() => {
    async function loadScores() {
      const scores = await getTopScores();
      setHighScores(scores);
    }
    loadScores();
  }, []);

  const handleCreate = () => {
    if (!name.trim()) {
      playBuzzer();
      setError('Please enter a nickname!');
      return;
    }
    setError('');
    playCoin();

    socket.emit('create-room', { name, avatar: selectedAvatar }, (response) => {
      if (response.success) {
        const roomData = response.room;
        roomData.roundsCount = roundsCount;
        roomData.roundDuration = roundDuration;
        
        setRoom(roomData);
        setPlayerId(socket.id);
        setSoloMode(false);
        setStage('room');
      } else {
        setError(response.message || 'Failed to create room.');
      }
    });
  };

  const handleJoin = () => {
    if (!name.trim()) {
      playBuzzer();
      setError('Please enter a nickname!');
      return;
    }
    if (!code.trim() || code.length !== 4) {
      playBuzzer();
      setError('Please enter a 4-letter room code!');
      return;
    }
    setError('');
    playCoin();

    socket.emit('join-room', { code, name, avatar: selectedAvatar }, (response) => {
      if (response.success) {
        setRoom(response.room);
        setPlayerId(socket.id);
        setSoloMode(false);
        setStage('room');
      } else {
        playBuzzer();
        setError(response.message || 'Failed to join room.');
      }
    });
  };

  // Solo Mode Init
  const handlePlaySolo = () => {
    if (!name.trim()) {
      playBuzzer();
      setError('Please enter a nickname!');
      return;
    }
    
    // Filter active games
    const activeGamesList = ALL_MINI_GAMES.filter(g => enabledGames.has(g));
    if (activeGamesList.length === 0) {
      playBuzzer();
      setError('Please select at least 1 mini-game!');
      return;
    }

    setError('');
    playCoin();

    // Shuffle and pick roundsCount games from enabled mini-games
    const shuffled = [...activeGamesList].sort(() => Math.random() - 0.5);
    let selectedGames = [];
    for (let i = 0; i < roundsCount; i++) {
      selectedGames.push(shuffled[i % shuffled.length]);
    }

    // Create a mock local room structure for solo play
    const mockRoom = {
      code: 'SOLO',
      hostId: 'YOU',
      players: {
        'YOU': { id: 'YOU', name: name.trim(), avatar: selectedAvatar, score: 0, currentRoundScore: 0, isReady: true },
        'BOT': { id: 'BOT', name: getBotName(botDifficulty), avatar: '🤖', score: 0, currentRoundScore: 0, isReady: false }
      },
      gameStarted: true,
      currentRound: 0,
      miniGamesOrder: selectedGames,
      roundsCount: parseInt(roundsCount),
      roundDuration: parseInt(roundDuration),
      botDifficulty: botDifficulty,
      enabledGames: activeGamesList // save selected pool for restart
    };

    setRoom(mockRoom);
    setPlayerId('YOU');
    setSoloMode(true);
  };

  return (
    <div style={styles.container}>
      <div style={styles.layoutWrapper}>
        
        {/* Left Side: Game Setup form */}
        <div className="glass-panel glass-panel-glow-pink" style={styles.panel}>
          <h1 className="neon-text-pink animate-pulse-slow" style={styles.title}>
            🤪 CHAOS PARTY
          </h1>
          <p style={styles.subtitle}>Fast, chaotic multiplayer games for rapid dopamine!</p>

          {error && <div className="animate-shake" style={styles.error}>{error}</div>}

          <div style={styles.formGroup}>
            <label style={styles.label}>NICKNAME</label>
            <input
              type="text"
              className="neon-input"
              placeholder="Type your name..."
              maxLength={12}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>PICK AN AVATAR</label>
            <div className="avatar-grid">
              {AVATARS.map((av) => (
                <div
                  key={av}
                  className={`avatar-item ${selectedAvatar === av ? 'active' : ''}`}
                  onClick={() => { playCoin(); setSelectedAvatar(av); }}
                >
                  {av}
                </div>
              ))}
            </div>
          </div>

          <hr style={styles.divider} />

          {/* EXPANDED GAME CONFIGURATION SELECTORS IN LOBBY */}
          <div style={styles.settingsContainer}>
            <div style={styles.settingsThird}>
              <label style={styles.label}>ROUNDS</label>
              <div className="spinner-container">
                <button 
                  type="button" 
                  className="spinner-btn"
                  onClick={() => { playCoin(); setRoundsCount(prev => Math.max(1, prev - 1)); }}
                >
                  -
                </button>
                <input 
                  type="number"
                  className="spinner-input"
                  min="1"
                  max="50"
                  value={roundsCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setRoundsCount(Math.min(50, Math.max(1, val)));
                  }}
                />
                <button 
                  type="button" 
                  className="spinner-btn"
                  onClick={() => { playCoin(); setRoundsCount(prev => Math.min(50, prev + 1)); }}
                >
                  +
                </button>
              </div>
            </div>
            
            <div style={styles.settingsThird}>
              <label style={styles.label}>DURATION (s)</label>
              <div className="spinner-container">
                <button 
                  type="button" 
                  className="spinner-btn"
                  onClick={() => { playCoin(); setRoundDuration(prev => Math.max(3, prev - 1)); }}
                >
                  -
                </button>
                <input 
                  type="number"
                  className="spinner-input"
                  min="3"
                  max="60"
                  value={roundDuration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 3;
                    setRoundDuration(Math.min(60, Math.max(3, val)));
                  }}
                />
                <button 
                  type="button" 
                  className="spinner-btn"
                  onClick={() => { playCoin(); setRoundDuration(prev => Math.min(60, prev + 1)); }}
                >
                  +
                </button>
              </div>
            </div>

            <div style={styles.settingsThird}>
              <label style={styles.label}>BOT LEVEL</label>
              <select 
                className="neon-input" 
                style={styles.selectInput}
                value={botDifficulty} 
                onChange={(e) => { playCoin(); setBotDifficulty(e.target.value); }}
              >
                <option value="easy">Potato 🥔</option>
                <option value="medium">Normal 🤖</option>
                <option value="hard">Pro ⚡</option>
                <option value="insane">CyberGod 👽</option>
              </select>
            </div>
          </div>

          {/* Game Selection Toggle */}
          <div style={styles.gameSelectorToggleContainer}>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', fontSize: '0.85rem', padding: '10px 0', borderRadius: '12px' }}
              onClick={() => { playCoin(); setShowGameSelector(!showGameSelector); }}
            >
              🧩 {showGameSelector ? 'CLOSE GAME SELECTOR' : 'SELECT MINI-GAMES POOL'} ({enabledGames.size}/{ALL_MINI_GAMES.length})
            </button>
          </div>

          {showGameSelector && (
            <div className="glass-panel" style={styles.gameSelectorPanel}>
              <div style={styles.gameSelectorHeader}>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '8px' }}
                  onClick={() => { playCoin(); setEnabledGames(new Set(ALL_MINI_GAMES)); }}
                >
                  SELECT ALL
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '8px' }}
                  onClick={() => { playCoin(); setEnabledGames(new Set()); }}
                >
                  CLEAR ALL
                </button>
              </div>
              <div style={styles.gameSelectorGrid}>
                {ALL_MINI_GAMES.map((gameName) => {
                  const isChecked = enabledGames.has(gameName);
                  return (
                    <label 
                      key={gameName} 
                      style={{
                        ...styles.gameSelectorLabel,
                        borderColor: isChecked ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.05)',
                        background: isChecked ? 'rgba(0, 240, 255, 0.05)' : 'rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        style={styles.checkbox}
                        checked={isChecked}
                        onChange={() => {
                          playCoin();
                          const updated = new Set(enabledGames);
                          if (updated.has(gameName)) {
                            updated.delete(gameName);
                          } else {
                            updated.add(gameName);
                          }
                          setEnabledGames(updated);
                        }}
                      />
                      <span style={{ fontSize: '0.8rem' }}>{GAME_LABELS[gameName]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <hr style={styles.divider} />

          {!showJoinInput ? (
            <div style={styles.btnColumn}>
              <div style={styles.btnRow}>
                <button className="btn btn-pink" style={{ flex: 1 }} onClick={handleCreate}>
                  👑 CREATE ROOM
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { playCoin(); setShowJoinInput(true); }}>
                  👉 JOIN ROOM
                </button>
              </div>
              <button className="btn btn-cyan" style={{ width: '100%' }} onClick={handlePlaySolo}>
                🤖 PLAY SOLO VS BOT
              </button>
            </div>
          ) : (
            <div style={styles.joinContainer} className="animate-pulse">
              <input
                type="text"
                className="neon-input"
                placeholder="ENTER 4-LETTER CODE"
                maxLength={4}
                style={styles.codeInput}
                value={code.toUpperCase()}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <div style={styles.btnRow}>
                <button className="btn btn-cyan" style={{ flex: 1 }} onClick={handleJoin}>
                  🎮 ENTER ROOM
                </button>
                <button className="btn btn-secondary" style={{ flex: 0.5 }} onClick={() => { playCoin(); setShowJoinInput(false); setError(''); }}>
                  BACK
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: High Scores Leaderboard */}
        <div className="glass-panel glass-panel-glow-cyan" style={styles.leaderboardPanel}>
          <h2 className="neon-text-cyan" style={styles.leaderboardTitle}>
            🏆 TOP 5 CHAMPIONS
          </h2>
          <p style={styles.leaderboardSubtitle}>All-Time Highest Scores</p>
          
          <div style={styles.leaderboardList}>
            {highScores.map((scoreItem, idx) => (
              <div key={idx} style={styles.leaderboardRow}>
                <div style={styles.leaderboardRowLeft}>
                  <span style={styles.leaderboardRank}>#{idx + 1}</span>
                  <span style={styles.leaderboardAvatar}>{scoreItem.avatar}</span>
                  <span style={styles.leaderboardName}>{scoreItem.name}</span>
                </div>
                <div className="neon-text-green" style={styles.leaderboardScore}>
                  {scoreItem.score} pts
                </div>
              </div>
            ))}
            {highScores.length === 0 && (
              <div style={styles.emptyLeaderboard}>Loading records...</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '85vh',
    padding: '20px'
  },
  layoutWrapper: {
    display: 'flex',
    gap: '24px',
    width: '100%',
    maxWidth: '900px',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  panel: {
    flex: '1 1 450px',
    maxWidth: '480px',
    padding: '35px 30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    textAlign: 'center'
  },
  leaderboardPanel: {
    flex: '1 1 350px',
    maxWidth: '380px',
    padding: '30px 25px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  title: {
    fontSize: '2.6rem',
    marginBottom: '5px'
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    lineHeight: '1.4',
    marginBottom: '5px'
  },
  label: {
    alignSelf: 'flex-start',
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '1px',
    marginBottom: '4px',
    textAlign: 'left',
    display: 'block'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  divider: {
    border: '0',
    height: '1px',
    background: 'var(--border-color)',
    margin: '3px 0'
  },
  settingsContainer: {
    display: 'flex',
    gap: '10px',
    width: '100%'
  },
  settingsThird: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  selectInput: {
    padding: '8px 10px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    borderRadius: '12px'
  },
  btnColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  btnRow: {
    display: 'flex',
    gap: '10px'
  },
  joinContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: '5px',
    fontSize: '1.6rem',
    fontFamily: 'var(--font-display)',
    fontWeight: '700'
  },
  error: {
    background: 'rgba(255, 0, 127, 0.15)',
    border: '1px solid var(--neon-pink)',
    color: '#ff66b2',
    padding: '10px',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  leaderboardTitle: {
    fontSize: '1.6rem',
    textAlign: 'center'
  },
  leaderboardSubtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    textAlign: 'center',
    marginTop: '-10px',
    marginBottom: '10px'
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  leaderboardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px'
  },
  leaderboardRowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  leaderboardRank: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    color: 'var(--text-muted)',
    fontSize: '1rem',
    width: '24px'
  },
  leaderboardAvatar: {
    fontSize: '1.4rem'
  },
  leaderboardName: {
    fontWeight: '600',
    fontSize: '0.95rem'
  },
  leaderboardScore: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1rem'
  },
  emptyLeaderboard: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    padding: '20px'
  },
  gameSelectorToggleContainer: {
    width: '100%',
    marginTop: '5px'
  },
  gameSelectorPanel: {
    width: '100%',
    padding: '15px',
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'rgba(22, 22, 39, 0.85)',
    border: '1.5px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    maxHeight: '220px',
    overflowY: 'auto'
  },
  gameSelectorHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px'
  },
  gameSelectorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '8px',
    textAlign: 'left'
  },
  gameSelectorLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    borderRadius: '10px',
    border: '1.5px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none'
  },
  checkbox: {
    cursor: 'pointer',
    accentColor: 'var(--neon-cyan)',
    width: '14px',
    height: '14px'
  }
};
