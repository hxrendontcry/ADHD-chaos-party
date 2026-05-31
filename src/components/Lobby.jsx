import React, { useState, useEffect } from 'react';
import { getTopScores } from '../supabase';

const AVATARS = ['👾', '🤪', '🦖', '🦙', '🍕', '🚀', '🦄', '💣', '🌶️', '🤡', '🍩', '🥑', '🍄', '🐙', '🐈'];

export default function Lobby({ socket, setRoom, setPlayerId, useSoundHook, setSoloMode, setStage }) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [code, setCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [error, setError] = useState('');
  const [highScores, setHighScores] = useState([]);
  
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
        setRoom(response.room);
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
    setError('');
    playCoin();

    // Create a mock local room structure for solo play
    const mockRoom = {
      code: 'SOLO',
      hostId: 'YOU',
      players: {
        'YOU': { id: 'YOU', name: name.trim(), avatar: selectedAvatar, score: 0, currentRoundScore: 0, isReady: true },
        'BOT': { id: 'BOT', name: 'Bot Turbo 🤖', avatar: '🤖', score: 0, currentRoundScore: 0, isReady: false }
      },
      gameStarted: true,
      currentRound: 0,
      miniGamesOrder: ['BalloonPop', 'PanicClicker', 'StroopChaos', 'ChaosTyping', 'QuickMath']
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
    gap: '20px',
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
    marginBottom: '10px'
  },
  label: {
    alignSelf: 'flex-start',
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '1px',
    marginBottom: '8px',
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
    margin: '5px 0'
  },
  btnColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  btnRow: {
    display: 'flex',
    gap: '12px'
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
  }
};
