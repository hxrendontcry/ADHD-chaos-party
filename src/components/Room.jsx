import React, { useState } from 'react';

export default function Room({ room, playerId, socket, useSoundHook }) {
  const [copied, setCopied] = useState(false);
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
    socket.emit('start-game', { code: room.code });
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
    gap: '24px'
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
    transition: 'transform 0.15s',
    '&:hover': {
      transform: 'scale(1.05)'
    }
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
    textAlign: 'center'
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
  }
};
