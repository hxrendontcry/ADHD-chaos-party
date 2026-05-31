import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev simplicity
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Room State Store
// roomId -> { code, hostId, players: { socketId: { id, name, avatar, score, currentRoundScore, isReady } }, gameStarted, currentRound, miniGamesOrder }
const rooms = new Map();

// Helper to generate unique room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(code));
  return code;
}

// Mini-games list to cycle through
const MINI_GAMES = ['BalloonPop', 'PanicClicker', 'StroopChaos', 'ChaosTyping', 'QuickMath'];

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Create Room
  socket.on('create-room', ({ name, avatar }, callback) => {
    const code = generateRoomCode();
    const player = {
      id: socket.id,
      name: name || 'Guest',
      avatar: avatar || '👾',
      score: 0,
      currentRoundScore: 0,
      isReady: true
    };

    rooms.set(code, {
      code,
      hostId: socket.id,
      players: { [socket.id]: player },
      gameStarted: false,
      currentRound: 0,
      miniGamesOrder: []
    });

    socket.join(code);
    console.log(`Room created: ${code} by ${name}`);
    callback({ success: true, room: rooms.get(code) });
  });

  // 2. Join Room
  socket.on('join-room', ({ code, name, avatar }, callback) => {
    const formattedCode = code.trim().toUpperCase();
    const room = rooms.get(formattedCode);

    if (!room) {
      return callback({ success: false, message: 'Room not found!' });
    }

    if (room.gameStarted) {
      return callback({ success: false, message: 'Game already in progress!' });
    }

    if (Object.keys(room.players).length >= 8) {
      return callback({ success: false, message: 'Room is full! (Max 8 players)' });
    }

    const player = {
      id: socket.id,
      name: name || 'Guest',
      avatar: avatar || '👾',
      score: 0,
      currentRoundScore: 0,
      isReady: false
    };

    room.players[socket.id] = player;
    socket.join(formattedCode);

    console.log(`Player ${name} joined room ${formattedCode}`);

    // Notify room of updated players list
    io.to(formattedCode).emit('room-updated', room);
    callback({ success: true, room });
  });

  // 3. Start Game (Host only)
  socket.on('start-game', ({ code }) => {
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id) return;

    room.gameStarted = true;
    room.currentRound = 0;
    
    // Shuffle mini-games list
    const shuffled = [...MINI_GAMES].sort(() => Math.random() - 0.5);
    room.miniGamesOrder = shuffled.slice(0, 5); // Take 5 games

    io.to(code).emit('game-started', {
      miniGamesOrder: room.miniGamesOrder,
      players: room.players
    });

    // Start the first game sequence
    startRoundSequence(code, 0);
  });

  // 4. Live Score updates (for real-time opponent progress bars)
  socket.on('submit-progress', ({ code, progress }) => {
    const room = rooms.get(code);
    if (!room) return;

    if (room.players[socket.id]) {
      room.players[socket.id].currentRoundScore = progress;
      // Broadcast player progress to other players in the room (low-latency updates)
      socket.to(code).emit('progress-updated', {
        playerId: socket.id,
        progress
      });
    }
  });

  // 5. Submit round final score
  socket.on('submit-round-score', ({ code, score }) => {
    const room = rooms.get(code);
    if (!room) return;

    if (room.players[socket.id]) {
      room.players[socket.id].score += score;
      room.players[socket.id].currentRoundScore = score;
      room.players[socket.id].isReady = true;

      // Check if all players have submitted
      const allPlayers = Object.values(room.players);
      const allDone = allPlayers.every(p => p.isReady);

      if (allDone) {
        // Reset player readiness for the next round
        allPlayers.forEach(p => {
          p.isReady = false;
        });

        // Broadcast leaderboard stage
        io.to(code).emit('round-completed', {
          players: room.players,
          currentRound: room.currentRound
        });

        // Schedule next round or game end
        setTimeout(() => {
          if (room.currentRound < room.miniGamesOrder.length - 1) {
            room.currentRound += 1;
            startRoundSequence(code, room.currentRound);
          } else {
            // Game Over
            io.to(code).emit('game-over', { players: room.players });
            room.gameStarted = false; // Reset room status so it can be replayed
            // Reset player scores
            allPlayers.forEach(p => {
              p.score = 0;
              p.currentRoundScore = 0;
            });
          }
        }, 5000); // Show leaderboard for 5 seconds
      }
    }
  });

  // 6. Request Restart Game (Host only)
  socket.on('restart-game', ({ code }) => {
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id) return;

    room.gameStarted = false;
    room.currentRound = 0;
    Object.values(room.players).forEach(p => {
      p.score = 0;
      p.currentRoundScore = 0;
      p.isReady = (p.id === room.hostId); // host starts ready
    });

    io.to(code).emit('game-restarted', room);
  });

  // 7. Disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find room the player was in
    for (const [code, room] of rooms.entries()) {
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        
        const remainingPlayers = Object.keys(room.players);
        
        if (remainingPlayers.length === 0) {
          // Delete room if empty
          rooms.delete(code);
          console.log(`Room ${code} deleted (empty)`);
        } else {
          // If host left, assign a new host
          if (room.hostId === socket.id) {
            room.hostId = remainingPlayers[0];
            room.players[room.hostId].isReady = true;
            console.log(`New host for room ${code}: ${room.players[room.hostId].name}`);
          }
          io.to(code).emit('room-updated', room);
          io.to(code).emit('player-left', { playerId: socket.id });
        }
        break;
      }
    }
  });
});

// Manage the timed sequence of a round
// Phase 1: Instruction Screen (3s)
// Phase 2: Play Game (10s)
function startRoundSequence(code, roundIndex) {
  const room = rooms.get(code);
  if (!room) return;

  const miniGame = room.miniGamesOrder[roundIndex];

  // Send instruction stage trigger
  io.to(code).emit('round-instruction', {
    game: miniGame,
    roundIndex
  });

  // Wait 3 seconds, then start playing
  setTimeout(() => {
    const activeRoom = rooms.get(code);
    if (!activeRoom || !activeRoom.gameStarted || activeRoom.currentRound !== roundIndex) return;

    // Reset current round scores
    Object.values(activeRoom.players).forEach(p => {
      p.currentRoundScore = 0;
      p.isReady = false;
    });

    io.to(code).emit('round-start', {
      game: miniGame,
      duration: 10 // 10 seconds gameplay
    });

    // After 10.5 seconds, force collect scores for anyone who didn't submit
    setTimeout(() => {
      const currentRoom = rooms.get(code);
      if (!currentRoom || !currentRoom.gameStarted || currentRoom.currentRound !== roundIndex) return;

      // Find players who haven't finished and auto-submit
      let updated = false;
      Object.values(currentRoom.players).forEach(p => {
        if (!p.isReady) {
          p.score += p.currentRoundScore; // Add whatever they got
          p.isReady = true;
          updated = true;
        }
      });

      if (updated) {
        // Trigger completion if not already triggered
        const allPlayers = Object.values(currentRoom.players);
        const allDone = allPlayers.every(p => p.isReady);
        if (allDone) {
          allPlayers.forEach(p => { p.isReady = false; });
          io.to(code).emit('round-completed', {
            players: currentRoom.players,
            currentRound: currentRoom.currentRound
          });

          // Go to next round or end game after 5s
          setTimeout(() => {
            if (currentRoom.currentRound < currentRoom.miniGamesOrder.length - 1) {
              currentRoom.currentRound += 1;
              startRoundSequence(code, currentRoom.currentRound);
            } else {
              io.to(code).emit('game-over', { players: currentRoom.players });
              currentRoom.gameStarted = false;
              allPlayers.forEach(p => {
                p.score = 0;
                p.currentRoundScore = 0;
              });
            }
          }, 5000);
        }
      }
    }, 10500);

  }, 3000);
}

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
