import React, { useState } from 'react';

const ALL_MINI_GAMES = [
  'BalloonPop', 'PanicClicker', 'StroopChaos', 'ChaosTyping', 'QuickMath', 
  'ClickRed', 'SoundRepeat', 'EmojiMatch', 'ShakeSoda', 'CoinCatch', 
  'KeyMasher', 'ColorTap', 'TargetShoot', 'RhythmTap', 'FindImpostor', 
  'NumberConnect'
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
  NumberConnect: '🔢 Number Connect'
};

export default function Room({ room, playerId, socket, useSoundHook }) {
  const [copied, setCopied] = useState(false);
  const [roundsCount, setRoundsCount] = useState(5);
  const [roundDuration, setRoundDuration] = useState(10);
  const [enabledGames, setEnabledGames] = useState(new Set(ALL_MINI_GAMES));
  const [showGameSelector, setShowGameSelector] = useState(false);
  
  const { playCoin } = useSoundHook;

  const players = Object.values(room.players);
  const isHost = room.hostId === playerId;

  const handleCopyCode = () => {
    playCoin();
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    playCoin();
    const activeGamesList = ALL_MINI_GAMES.filter(g => enabledGames.has(g));
    if (activeGamesList.length === 0) {
      alert("Please select at least 1 mini-game!");
      return;
    }

    socket.emit('start-game', { 
      code: room.code,
      roundsCount,
      roundDuration,
      enabledGames: activeGamesList
    });
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel glass-panel-glow-cyan" style={styles.panel}>
        
        <div style={styles.header}>
          <p style={styles.roomLabel}>ROOM CODE</p>
          <h1 className="neon-text-cyan" style={styles.roomCode} onClick={handleCopyCode}>
            {room.code}
          </h1>
          <button className="btn btn-secondary" style={styles.copyBtn} onClick={handleCopyCode}>
            {copied ? '✅ COPIED!' : '📋 COPY ROOM CODE'}
          </button>
        </div>

        <hr style={styles.divider} />

        <div style={styles.playerSection}>
          <h3 style={styles.sectionTitle}>
            PLAYERS IN PARTY ({players.length}/8)
          </h3>
          <div style={styles.playerGrid}>
            {players.map((p) => {
              const isCurrentPlayer = p.id === playerId;
              const isPlayerHost = p.id === room.hostId;
              return (
                <div 
                  key={p.id} 
                  className="glass-panel animate-float" 
                  style={{
                    ...styles.playerCard,
                    borderColor: isCurrentPlayer ? 'var(--neon-pink)' : 'var(--border-color)',
                    boxShadow: isCurrentPlayer ? '0 0 10px rgba(255, 0, 127, 0.15)' : 'none',
                    animationDelay: `${Math.random() * 2}s`
                  }}
                >
                  <span style={styles.avatar}>{p.avatar}</span>
                  <span style={styles.playerName}>
                    {p.name} {isCurrentPlayer && ' (YOU)'}
                  </span>
                  {isPlayerHost && <span style={styles.hostBadge}>👑 HOST</span>}
                </div>
              );
            })}
          </div>
        </div>

        <hr style={styles.divider} />

        {/* CUSTOMIZATION SETTINGS SECTION */}
        <div style={styles.settingsSection}>
          <h3 style={styles.sectionTitle}>🛠️ ROOM SETTINGS</h3>
          {isHost ? (
            <div style={styles.settingsForm}>
              <div style={styles.settingsGroup}>
                <label style={styles.settingsLabel}>ROUNDS COUNT</label>
                <select 
                  className="neon-input" 
                  style={styles.selectInput}
                  value={roundsCount} 
                  onChange={(e) => { playCoin(); setRoundsCount(parseInt(e.target.value)); }}
                >
                  <option value={1}>1 Round (Single Duel)</option>
                  <option value={2}>2 Rounds</option>
                  <option value={3}>3 Rounds (Short Blitz)</option>
                  <option value={5}>5 Rounds (Standard)</option>
                  <option value={7}>7 Rounds (Endurance)</option>
                  <option value={10}>10 Rounds (Chaos Master)</option>
                  <option value={12}>12 Rounds</option>
                  <option value={15}>15 Rounds (Ultimate Marathon)</option>
                </select>
              </div>

              <div style={styles.settingsGroup}>
                <label style={styles.settingsLabel}>STAGE DURATION</label>
                <select 
                  className="neon-input" 
                  style={styles.selectInput}
                  value={roundDuration} 
                  onChange={(e) => { playCoin(); setRoundDuration(parseInt(e.target.value)); }}
                >
                  <option value={3}>3 seconds (LIGHTNING RUSH)</option>
                  <option value={5}>5 seconds</option>
                  <option value={8}>8 seconds</option>
                  <option value={10}>10 seconds (Standard)</option>
                  <option value={12}>12 seconds</option>
                  <option value={15}>15 seconds</option>
                  <option value={20}>20 seconds (Focus Mode)</option>
                  <option value={25}>25 seconds</option>
                  <option value={30}>30 seconds (Patience Test)</option>
                </select>
              </div>

              {/* Game Selection Toggle */}
              <div style={styles.gameSelectorToggleContainer}>
                <button 
                  type="button"
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
                      type="button"
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '8px' }}
                      onClick={() => { playCoin(); setEnabledGames(new Set(ALL_MINI_GAMES)); }}
                    >
                      SELECT ALL
                    </button>
                    <button 
                      type="button"
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
            </div>
          ) : (
            <div style={styles.settingsReadOnly}>
              <p>Host is choosing settings...</p>
              <p style={{ color: 'var(--neon-cyan)', fontWeight: 'bold', marginTop: '5px' }}>
                Default: 5 Rounds, 10s per round
              </p>
            </div>
          )}
        </div>

        <hr style={styles.divider} />

        <div style={styles.footer}>
          {isHost ? (
            <div style={styles.hostControls}>
              {players.length < 2 && (
                <p style={styles.tipText}>
                  💡 Waiting for friends to join... (You can still start solo to test!)
                </p>
              )}
              <button className="btn btn-pink" style={styles.startBtn} onClick={handleStartGame}>
                🚀 START RUSH!
              </button>
            </div>
          ) : (
            <div style={styles.waitingNotice}>
              <div className="animate-pulse-slow" style={styles.waitingPulse}>
                ⚡ WAITING FOR HOST TO START...
              </div>
            </div>
          )}
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
  panel: {
    width: '100%',
    maxWidth: '540px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px'
  },
  roomLabel: {
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    letterSpacing: '1px'
  },
  roomCode: {
    fontSize: '3.6rem',
    cursor: 'pointer',
    letterSpacing: '3px',
    transition: 'transform 0.15s'
  },
  copyBtn: {
    fontSize: '0.8rem',
    padding: '6px 14px',
    borderRadius: '10px'
  },
  divider: {
    border: '0',
    height: '1px',
    background: 'var(--border-color)'
  },
  playerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  sectionTitle: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    letterSpacing: '1px',
    textAlign: 'center',
    marginBottom: '8px'
  },
  playerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '12px',
    marginTop: '5px'
  },
  playerCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 10px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '16px',
    position: 'relative',
    textAlign: 'center'
  },
  avatar: {
    fontSize: '2.5rem',
    marginBottom: '8px'
  },
  playerName: {
    fontWeight: '600',
    fontSize: '0.9rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%'
  },
  hostBadge: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    background: 'var(--neon-yellow)',
    color: '#000',
    fontSize: '0.65rem',
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '6px'
  },
  settingsSection: {
    display: 'flex',
    flexDirection: 'column'
  },
  settingsForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  settingsGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  settingsLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--text-muted)'
  },
  selectInput: {
    padding: '10px 15px',
    fontSize: '0.95rem',
    cursor: 'pointer'
  },
  settingsReadOnly: {
    textAlign: 'center',
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    background: 'rgba(0,0,0,0.15)',
    padding: '12px',
    borderRadius: '14px'
  },
  footer: {
    textAlign: 'center'
  },
  hostControls: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  tipText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)'
  },
  startBtn: {
    width: '100%',
    padding: '16px 0',
    fontSize: '1.3rem'
  },
  waitingNotice: {
    padding: '15px 0'
  },
  waitingPulse: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--neon-cyan)',
    textShadow: '0 0 10px rgba(0, 240, 255, 0.4)'
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
