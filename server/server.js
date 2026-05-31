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

// Expanded Pool of all 16 mini-games
const MINI_GAMES = [
  'BalloonPop', 'PanicClicker', 'StroopChaos', 'ChaosTyping', 'QuickMath', 
  'ClickRed', 'SoundRepeat', 'EmojiMatch', 'ShakeSoda', 'CoinCatch', 
  'KeyMasher', 'ColorTap', 'TargetShoot', 'RhythmTap', 'FindImpostor', 
  'NumberConnect'
];

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
      miniGamesOrder: [],
      roundsCount: 5,
      roundDuration: 10
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

  // 3. Start Game (Host only) - now receives customizable settings
  socket.on('start-game', ({ code, roundsCount, roundDuration, enabledGames }) => {
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id) return;

    room.gameStarted = true;
    room.currentRound = 0;
    
    // Save host settings
    room.roundsCount = parseInt(roundsCount) || 5;
    room.roundDuration = parseInt(roundDuration) || 10;
    
    // Reset player scores for the new game session
    Object.values(room.players).forEach(p => {
      p.score = 0;
      p.currentRoundScore = 0;
    });
    
    // Pick from host's selected games pool, or fallback to all games if none selected
    const activePool = (enabledGames && enabledGames.length > 0) ? enabledGames : MINI_GAMES;
    
    // Shuffle and construct game rotation order
    const shuffled = [...activePool].sort(() => Math.random() - 0.5);
    let selectedGames = [];
    for (let i = 0; i < room.roundsCount; i++) {
      selectedGames.push(shuffled[i % shuffled.length]);
    }
    room.miniGamesOrder = selectedGames;

    io.to(code).emit('game-started', {
      miniGamesOrder: room.miniGamesOrder,
      players: room.players,
      roundDuration: room.roundDuration
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

        // Schedule next round or game end after 5 seconds
        setTimeout(() => {
          if (room.currentRound < room.miniGamesOrder.length - 1) {
            room.currentRound += 1;
            startRoundSequence(code, room.currentRound);
          } else {
            // Game Over
            io.to(code).emit('game-over', { players: room.players });
            room.gameStarted = false; // Reset room status so it can be replayed
          }
        }, 5000);
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
      p.isReady = (p.id === room.hostId);
    });

    io.to(code).emit('game-restarted', room);
  });

  // 7. Disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    for (const [code, room] of rooms.entries()) {
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        
        const remainingPlayers = Object.keys(room.players);
        
        if (remainingPlayers.length === 0) {
          rooms.delete(code);
          console.log(`Room ${code} deleted (empty)`);
        } else {
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

// Manage the timed sequence of a round with customizable duration
function startRoundSequence(code, roundIndex) {
  const room = rooms.get(code);
  if (!room) return;

  const miniGame = room.miniGamesOrder[roundIndex];

  io.to(code).emit('round-instruction', {
    game: miniGame,
    roundIndex
  });

  // Wait 3 seconds countdown, then start playing
  setTimeout(() => {
    const activeRoom = rooms.get(code);
    if (!activeRoom || !activeRoom.gameStarted || activeRoom.currentRound !== roundIndex) return;

    Object.values(activeRoom.players).forEach(p => {
      p.currentRoundScore = 0;
      p.isReady = false;
    });

    io.to(code).emit('round-start', {
      game: miniGame,
      duration: activeRoom.roundDuration
    });

    // Auto collect score after round duration + 500ms grace period
    const roundMs = (activeRoom.roundDuration * 1000) + 500;
    setTimeout(() => {
      const currentRoom = rooms.get(code);
      if (!currentRoom || !currentRoom.gameStarted || currentRoom.currentRound !== roundIndex) return;

      let updated = false;
      Object.values(currentRoom.players).forEach(p => {
        if (!p.isReady) {
          p.score += p.currentRoundScore;
          p.isReady = true;
          updated = true;
        }
      });

      if (updated) {
        const allPlayers = Object.values(currentRoom.players);
        const allDone = allPlayers.every(p => p.isReady);
        if (allDone) {
          allPlayers.forEach(p => { p.isReady = false; });
          io.to(code).emit('round-completed', {
            players: currentRoom.players,
            currentRound: currentRoom.currentRound
          });

          setTimeout(() => {
            if (currentRoom.currentRound < currentRoom.miniGamesOrder.length - 1) {
              currentRoom.currentRound += 1;
              startRoundSequence(code, currentRoom.currentRound);
            } else {
              io.to(code).emit('game-over', { players: currentRoom.players });
              currentRoom.gameStarted = false;
            }
          }, 5000);
        }
      }
    }, roundMs);

  }, 3000);
}

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
