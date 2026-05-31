import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { submitHighScore } from '../supabase';

export default function Podiums({ players, playerId, room, socket, useSoundHook, isSolo, onSoloRestart, onSoloExit }) {
  const { playWinFanfare, playCoin } = useSoundHook;
  const isHost = isSolo || room.hostId === playerId;

  // Sort players by total score
  const sorted = Object.values(players).sort((a, b) => b.score - a.score);
  
  const p1 = sorted[0];
  const p2 = sorted[1];
  const p3 = sorted[2];

  // 1. Submit high score and trigger Confetti
  useEffect(() => {
    // Play winner audio loop
    playWinFanfare();

    // Submit current player score to the leaderboard
    const selfPlayer = players[playerId];
    if (selfPlayer) {
      submitHighScore(selfPlayer.name, selfPlayer.avatar, selfPlayer.score);
    }

    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleRestart = () => {
    playCoin();
    if (isSolo) {
      onSoloRestart();
    } else {
      socket.emit('restart-game', { code: room.code });
    }
  };

  const handleExit = () => {
    playCoin();
    if (isSolo) {
      onSoloExit();
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel glass-panel-glow-pink" style={styles.panel}>
        
        <div style={styles.header}>
          <h1 className="neon-text-pink animate-pulse-slow" style={styles.title}>
            👑 PARTY CHAMPIONS! 👑
          </h1>
          <p style={styles.subtitle}>What a chaotic ride. Congratulations!</p>
        </div>

        {/* Visual Podiums Grid */}
        <div style={styles.podiumContainer}>
          {/* 2nd Place (Left) */}
          {p2 && (
            <div style={styles.podiumCol}>
              <div style={styles.avatarWrap}>
                <span style={styles.podiumAvatar}>{p2.avatar}</span>
                <span style={styles.medalSilver}>🥈</span>
              </div>
              <div style={styles.podiumName}>{p2.name}</div>
              <div style={styles.scoreText}>{p2.score} pts</div>
              <div style={{ ...styles.podiumBar, ...styles.barSilver }}>
                <span style={styles.placeNumber}>2</span>
              </div>
            </div>
          )}

          {/* 1st Place (Middle) */}
          {p1 && (
            <div style={{ ...styles.podiumCol, marginTop: '-20px' }}>
              <div style={styles.avatarWrap}>
                <div style={styles.crown}>👑</div>
                <span style={{ ...styles.podiumAvatar, fontSize: '3.6rem' }}>{p1.avatar}</span>
                <span style={styles.medalGold}>🥇</span>
              </div>
              <div style={{ ...styles.podiumName, fontSize: '1.25rem', fontWeight: '800' }} className="neon-text-yellow">
                {p1.name}
              </div>
              <div style={{ ...styles.scoreText, fontSize: '1.1rem', fontWeight: '700' }}>{p1.score} pts</div>
              <div style={{ ...styles.podiumBar, ...styles.barGold }}>
                <span style={styles.placeNumber}>1</span>
              </div>
            </div>
          )}

          {/* 3rd Place (Right) */}
          {p3 && (
            <div style={styles.podiumCol}>
              <div style={styles.avatarWrap}>
                <span style={styles.podiumAvatar}>{p3.avatar}</span>
                <span style={styles.medalBronze}>🥉</span>
              </div>
              <div style={styles.podiumName}>{p3.name}</div>
              <div style={styles.scoreText}>{p3.score} pts</div>
              <div style={{ ...styles.podiumBar, ...styles.barBronze }}>
                <span style={styles.placeNumber}>3</span>
              </div>
            </div>
          )}
        </div>

        {/* Scroll list of other players */}
        {sorted.length > 3 && (
          <div style={styles.runnersUpList}>
            {sorted.slice(3).map((p, idx) => (
              <div key={p.id} style={styles.runnerRow}>
                <span>#{idx + 4} {p.avatar} {p.name}</span>
                <span style={{ fontWeight: '700' }}>{p.score} pts</span>
              </div>
            ))}
          </div>
        )}

        <hr style={styles.divider} />

        <div style={styles.footer}>
          {isHost ? (
            <div style={styles.btnRow}>
              <button className="btn btn-pink animate-pulse-slow" style={{ flex: 1, fontSize: '1.2rem' }} onClick={handleRestart}>
                🎮 PLAY AGAIN
              </button>
              {isSolo && (
                <button className="btn btn-secondary" style={{ flex: 0.8, fontSize: '1.1rem' }} onClick={handleExit}>
                  🚪 EXIT TO LOBBY
                </button>
              )}
            </div>
          ) : (
            <div style={styles.waitingPulse} className="animate-pulse-slow">
              ⚡ WAITING FOR HOST TO RESTART PARTY...
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
    padding: '35px 25px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    textAlign: 'center'
  },
  header: {
    marginBottom: '10px'
  },
  title: {
    fontSize: '2.6rem'
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    marginTop: '5px'
  },
  podiumContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: '240px',
    gap: '15px',
    marginTop: '20px'
  },
  podiumCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1
  },
  avatarWrap: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  crown: {
    position: 'absolute',
    top: '-20px',
    fontSize: '1.5rem',
    animation: 'float 2s infinite ease-in-out'
  },
  podiumAvatar: {
    fontSize: '2.8rem'
  },
  medalGold: { position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '1.25rem' },
  medalSilver: { position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '1.1rem' },
  medalBronze: { position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '1.1rem' },
  podiumName: {
    fontWeight: '600',
    fontSize: '0.9rem',
    marginTop: '6px',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  scoreText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '8px'
  },
  podiumBar: {
    width: '100%',
    borderRadius: '12px 12px 0 0',
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '10px'
  },
  barGold: {
    height: '110px',
    background: 'linear-gradient(to top, #d4af37, #ffd700)',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)'
  },
  barSilver: {
    height: '75px',
    background: 'linear-gradient(to top, #a6a6a6, #cccccc)',
    boxShadow: '0 0 15px rgba(204, 204, 204, 0.3)'
  },
  barBronze: {
    height: '50px',
    background: 'linear-gradient(to top, #7d5231, #cd7f32)',
    boxShadow: '0 0 12px rgba(205, 127, 50, 0.3)'
  },
  placeNumber: {
    color: '#0b0b14',
    fontFamily: 'var(--font-display)',
    fontWeight: '900',
    fontSize: '1.3rem'
  },
  runnersUpList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    background: 'rgba(0,0,0,0.15)',
    padding: '10px 15px',
    borderRadius: '14px',
    maxHeight: '100px',
    overflowY: 'auto',
    textAlign: 'left'
  },
  runnerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-muted)'
  },
  divider: {
    border: '0',
    height: '1px',
    background: 'var(--border-color)',
    margin: '5px 0'
  },
  btnRow: {
    display: 'flex',
    gap: '12px'
  },
  restartBtn: {
    width: '100%',
    padding: '15px 0',
    fontSize: '1.25rem'
  },
  waitingPulse: {
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    color: 'var(--neon-cyan)',
    fontSize: '1rem',
    padding: '10px 0'
  }
};
