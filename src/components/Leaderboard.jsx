import React from 'react';

const RANK_BADGES = {
  0: '👑 GIGACHAD',
  1: '⚡ SPEEDY',
  2: '💊 DOPAMINE KING',
  3: '🧊 CHILL PILL',
  4: '🐌 DISTRACTED',
  5: '🥱 SLEEPY',
  6: '🎈 BALLOON BRAIN',
  7: '🥔 POTATO'
};

export default function Leaderboard({ players, currentRound, playerId }) {
  // Sort players by total score
  const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);

  return (
    <div style={styles.container}>
      <div className="glass-panel glass-panel-glow-pink" style={styles.panel}>
        <div style={styles.header}>
          <p style={styles.subtitle}>ROUND {currentRound + 1} COMPLETED</p>
          <h1 className="neon-text-pink animate-pulse-slow" style={styles.title}>
            🏆 LEADERBOARD
          </h1>
        </div>

        <div style={styles.list}>
          {sortedPlayers.map((p, idx) => {
            const isSelf = p.id === playerId;
            const badge = RANK_BADGES[idx] || '🎮 GAMER';

            return (
              <div
                key={p.id}
                className="glass-panel"
                style={{
                  ...styles.row,
                  borderColor: isSelf ? 'var(--neon-cyan)' : 'var(--border-color)',
                  background: isSelf ? 'rgba(0, 240, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                  boxShadow: isSelf ? '0 0 10px rgba(0, 240, 255, 0.2)' : 'none'
                }}
              >
                <div style={styles.left}>
                  <span style={styles.rank}>#{idx + 1}</span>
                  <span style={styles.avatar}>{p.avatar}</span>
                  <span style={styles.name}>
                    {p.name} {isSelf && '(YOU)'}
                  </span>
                </div>
                <div style={styles.right}>
                  <span style={styles.badge}>{badge}</span>
                  <span style={styles.score}>{p.score} pts</span>
                  <span className="neon-text-green" style={styles.gain}>
                    +{p.currentRoundScore || 0}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.footer}>
          <p style={styles.waitingText} className="animate-pulse-slow">
            ⚡ NEXT ROUND STARTING IN A FEW SECONDS...
          </p>
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
    padding: '30px 25px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  header: {
    textAlign: 'center'
  },
  title: {
    fontSize: '2.5rem'
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    letterSpacing: '1px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '16px',
    transition: 'all 0.2s'
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  rank: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.2rem',
    color: 'var(--text-muted)',
    width: '30px'
  },
  avatar: {
    fontSize: '1.6rem'
  },
  name: {
    fontWeight: '600',
    fontSize: '1rem'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  badge: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-color)',
    padding: '3px 8px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    color: 'var(--text-muted)'
  },
  score: {
    fontWeight: '700',
    fontSize: '1.05rem'
  },
  gain: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '0.95rem',
    width: '45px',
    textAlign: 'right'
  },
  footer: {
    textAlign: 'center',
    marginTop: '10px'
  },
  waitingText: {
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    color: 'var(--neon-pink)',
    fontSize: '0.95rem'
  }
};
