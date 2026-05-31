import React, { useState, useEffect, useRef } from 'react';

export default function NumberConnect({ score, onScoreChange, useSoundHook }) {
  const [nodes, setNodes] = useState([]);
  const [expected, setExpected] = useState(1);
  const [shake, setShake] = useState(false);
  const containerRef = useRef(null);
  
  const { playPop, playBuzzer } = useSoundHook;

  const MAX_NUMBER = 6;

  const generateNodes = () => {
    const newNodes = [];
    
    // Generate numbers from 1 to MAX_NUMBER
    for (let i = 1; i <= MAX_NUMBER; i++) {
      // Find non-overlapping coordinates (rudimentary grid / random checks)
      let x, y, overlap;
      let attempts = 0;
      
      do {
        x = 10 + Math.random() * 80; // percentage
        y = 20 + Math.random() * 60; // percentage
        
        // check overlap with existing nodes
        overlap = newNodes.some(n => {
          const dx = n.x - x;
          const dy = n.y - y;
          return Math.sqrt(dx * dx + dy * dy) < 15; // minimum distance in %
        });
        attempts++;
      } while (overlap && attempts < 100);

      newNodes.push({ id: i, x, y, clicked: false });
    }

    setNodes(newNodes);
    setExpected(1);
  };

  useEffect(() => {
    generateNodes();
  }, []);

  const handleNodeClick = (node, e) => {
    e.stopPropagation();

    if (node.clicked) return;

    if (node.id === expected) {
      playPop();
      
      // Mark as clicked
      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, clicked: true } : n));

      if (expected === MAX_NUMBER) {
        // Completed the sequence!
        onScoreChange(score + 30);
        // Reset with new nodes
        setTimeout(() => {
          generateNodes();
        }, 150);
      } else {
        onScoreChange(score + 10);
        setExpected(expected + 1);
      }
    } else {
      // Clicked wrong number
      playBuzzer();
      onScoreChange(Math.max(0, score - 5));
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }
  };

  const handleMiss = () => {
    playBuzzer();
    onScoreChange(Math.max(0, score - 5));
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  return (
    <div 
      ref={containerRef}
      style={styles.gameArea} 
      onClick={handleMiss}
      className={shake ? 'animate-shake' : ''}
    >
      <div style={styles.instructions}>
        🔢 CLICK THE NUMBERS IN SEQUENTIAL ORDER: <span className="neon-text-pink">1 → 2 → 3 → 4 → 5 → 6</span>! 🔢
      </div>

      {nodes.map((node) => {
        const isNext = node.id === expected;
        return (
          <div
            key={node.id}
            onClick={(e) => handleNodeClick(node, e)}
            style={{
              ...styles.node,
              left: `${node.x}%`,
              top: `${node.y}%`,
              opacity: node.clicked ? 0.2 : 1,
              transform: node.clicked ? 'translate(-50%, -50%) scale(0.8)' : 'translate(-50%, -50%) scale(1)',
              borderColor: isNext ? 'var(--neon-green)' : node.clicked ? 'rgba(255,255,255,0.1)' : 'var(--neon-cyan)',
              boxShadow: isNext 
                ? '0 0 15px var(--neon-green)' 
                : node.clicked ? 'none' : '0 0 10px rgba(0, 240, 255, 0.2)',
              backgroundColor: isNext ? 'rgba(57, 255, 20, 0.15)' : 'rgba(0, 0, 0, 0.4)'
            }}
          >
            {node.id}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  gameArea: {
    width: '100%',
    height: '400px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '24px',
    position: 'relative',
    overflow: 'hidden',
    border: '2px solid rgba(255, 255, 255, 0.05)',
    cursor: 'default'
  },
  instructions: {
    position: 'absolute',
    top: '15px',
    left: '0',
    right: '0',
    textAlign: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    zIndex: 5
  },
  node: {
    position: 'absolute',
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    border: '2.5px solid',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.3rem',
    cursor: 'pointer',
    transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    userSelect: 'none'
  }
};
