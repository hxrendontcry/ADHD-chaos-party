import React, { useState, useEffect } from 'react';

const EMOJI_POOL = ['🦊', '🐷', '🐻', '🐸', '🐙', '🐝', '🦕', '🦖', '🦁', '🦄', '🐼', '🐨', '🍕', '🍩', '🥑'];

export default function EmojiMemory({ score, onScoreChange, useSoundHook }) {
  const [cards, setCards] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [showAll, setShowAll] = useState(true);
  const [shake, setShake] = useState(false);
  const { playPop, playBuzzer } = useSoundHook;

  const generateBoard = () => {
    setSelectedIndices([]);
    setShowAll(true);

    // Pick 2 random emojis
    const pool = [...EMOJI_POOL].sort(() => Math.random() - 0.5);
    const selectedEmojis = [pool[0], pool[1]];

    // Create pairs and shuffle
    const boardItems = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, idx) => ({
        id: idx,
        emoji,
        isMatched: false
      }));

    setCards(boardItems);

    // Hide cards after 800ms
    setTimeout(() => {
      setShowAll(false);
    }, 800);
  };

  useEffect(() => {
    generateBoard();
  }, []);

  const handleCardClick = (idx) => {
    if (showAll || cards[idx].isMatched || selectedIndices.includes(idx)) return;
    if (selectedIndices.length >= 2) return;

    playPop();
    const nextSelected = [...selectedIndices, idx];
    setSelectedIndices(nextSelected);

    if (nextSelected.length === 2) {
      const firstIdx = nextSelected[0];
      const secondIdx = nextSelected[1];

      if (cards[firstIdx].emoji === cards[secondIdx].emoji) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => (i === firstIdx || i === secondIdx) ? { ...c, isMatched: true } : c));
          setSelectedIndices([]);
          onScoreChange(score + 15);

          // Check if all matched
          const allMatched = cards.every((c, i) => (i === firstIdx || i === secondIdx) ? true : c.isMatched);
          if (allMatched) {
            onScoreChange(score + 25); // bonus points
            setTimeout(() => {
              generateBoard();
            }, 300);
          }
        }, 200);
      } else {
        // Mismatch
        setTimeout(() => {
          playBuzzer();
          onScoreChange(Math.max(0, score - 6));
          setSelectedIndices([]);
          setShake(true);
          setTimeout(() => setShake(false), 300);
        }, 500);
      }
    }
  };

  return (
    <div style={styles.gameArea} className={shake ? 'animate-shake' : ''}>
      <div style={styles.instructions}>
        🧠 MEMORIZE THE CARDS AND FIND THE MATCHING PAIRS! 🧠
      </div>

      <div style={styles.grid}>
        {cards.map((card, idx) => {
          const isFlipped = showAll || card.isMatched || selectedIndices.includes(idx);
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className="glass-panel"
              style={{
                ...styles.card,
                borderColor: isFlipped ? 'var(--neon-cyan)' : 'var(--border-color)',
                boxShadow: isFlipped ? '0 0 15px rgba(0, 240, 255, 0.2)' : 'none',
                background: isFlipped ? 'rgba(0, 240, 255, 0.08)' : 'rgba(0,0,0,0.3)',
                transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)'
              }}
            >
              <span 
                style={{ 
                  ...styles.emoji, 
                  opacity: isFlipped ? 1 : 0,
                  transform: isFlipped ? 'scale(1)' : 'scale(0)' 
                }}
              >
                {card.emoji}
              </span>
            </button>
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
    border: '2px solid rgba(255, 255, 255, 0.05)'
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
    gap: '20px',
    maxWidth: '220px',
    width: '100%',
    margin: '10px auto'
  },
  card: {
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(255, 255, 255, 0.08)',
    cursor: 'pointer',
    borderRadius: '20px',
    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
    perspective: '1000px',
    backfaceVisibility: 'hidden'
  },
  emoji: {
    fontSize: '2.5rem',
    transition: 'opacity 0.2s, transform 0.2s'
  }
};
