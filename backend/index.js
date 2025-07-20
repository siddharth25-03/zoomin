const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { MongoClient } = require('mongodb');
const path = require('path');
const cors = require('cors');
require('dotenv').config();


// Sample image data
const imageData = require('../frontend/images.json');

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'https://zoominn.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: 'https://zoominn.vercel.app',
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.static(path.join(__dirname, '../public')));

// MongoDB connection
const mongoUri = process.env.MONGO_URL;
const dbName = 'multiplayerGame';
let db;

MongoClient.connect(mongoUri, { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });


// Leaderboard Endpoints
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await db
      .collection('leaderboard')
      .find()
      .sort({ score: -1 })
      .limit(10)
      .toArray();
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.post('/api/submit-score', async (req, res) => {
  const { name, score } = req.body;
  if (!name || typeof score !== 'number') {
    return res.status(400).json({ error: 'Name and score are required' });
  }
  try {
    await db.collection('leaderboard').insertOne({
      name: name.trim(),
      score,
      timestamp: new Date(),
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});



// Generate unique 6-character room code
async function generateRoomCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  const existingRoom = await db.collection('rooms').findOne({ roomCode: code });
  if (existingRoom) {
    return generateRoomCode();
  }
  return code;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createRoom', async (callback) => {
    try {
      const roomCode = await generateRoomCode();
      const room = {
        roomCode,
        players: [{ id: socket.id, name: 'Host', score: 0 }],
        gameState: {
          round: 0,
          currentImage: null,
          currentObjectName: '',
          hintCount: 3,
          size: 120,
          time: 30,
          revealedIndices: [],
          correctPlayers: [],
          chatMessages: [],
        },
        createdAt: new Date(),
      };
      await db.collection('rooms').insertOne(room);
      socket.join(roomCode);
      socket.emit('roomCreated', { roomCode, playerName: 'Host', isHost: true });
      io.to(roomCode).emit('playerList', room.players);
      callback({ roomCode });
      console.log(`Room created: ${roomCode} by ${socket.id}`);
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ error: 'Failed to create room' });
    }
  });

  socket.on('joinRoom', async ({ roomCode, playerName }, callback) => {
    if (!roomCode || !playerName) {
      callback({ error: 'Room code and player name are required' });
      return;
    }
    try {
      const room = await db.collection('rooms').findOne({ roomCode });
      if (!room) {
        callback({ error: 'Room does not exist' });
        return;
      }
      if (room.players.some((player) => player.name === playerName)) {
        callback({ error: 'Player name is already taken' });
        return;
      }
      const updatedPlayers = [...room.players, { id: socket.id, name: playerName, score: 0 }];
      await db.collection('rooms').updateOne(
        { roomCode },
        { $set: { players: updatedPlayers } }
      );
      socket.join(roomCode);
      socket.emit('roomJoined', { roomCode, playerName, isHost: false });
      io.to(roomCode).emit('playerList', updatedPlayers);
      callback({ success: true });
      console.log(`${playerName} joined room: ${roomCode}`);
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ error: 'Failed to join room' });
    }
  });

  socket.on('startGame', async ({ roomCode }) => {
    try {
      const room = await db.collection('rooms').findOne({ roomCode });
      if (!room || room.players[0].id !== socket.id) {
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }
      const newRound = await startNewRound(roomCode);
      io.to(roomCode).emit('gameStarted', newRound);
      console.log(`Game started in room: ${roomCode}, Round: ${newRound.round}`);
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  socket.on('submitGuess', async ({ roomCode, guess, playerName }) => {
    try {
      console.log('submitGuess:', { roomCode, guess, playerName });
      const room = await db.collection('rooms').findOne({ roomCode });
      if (!room) {
        console.log('Room not found:', roomCode);
        socket.emit('error', { message: 'Room does not exist' });
        return;
      }
      if (room.gameState.round === 0) {
        console.log('Game not started in room:', roomCode, room.gameState);
        socket.emit('error', { message: 'Game not active' });
        return;
      }
      if (!room.players.some(p => p.name === playerName)) {
        console.log('Player not in room:', playerName, roomCode);
        socket.emit('error', { message: 'Player not in room' });
        return;
      }

      const isCorrect = guess.toLowerCase().trim() === room.gameState.currentObjectName.toLowerCase();
      if (isCorrect) {
        const timeLeft = room.gameState.time;
        const updatedPlayers = room.players.map(player =>
          player.name === playerName ? { ...player, score: player.score + timeLeft * 10 } : player
        );
        const updatedCorrectPlayers = [...(room.gameState.correctPlayers || []), { name: playerName, time: timeLeft }];
        await db.collection('rooms').updateOne(
          { roomCode },
          { $set: { players: updatedPlayers, 'gameState.correctPlayers': updatedCorrectPlayers } }
        );
        const message = {
          playerName,
          message: `${playerName} has guessed the word!`,
          isCorrect: true,
          timestamp: new Date().toLocaleTimeString(),
        };
        await db.collection('rooms').updateOne(
          { roomCode },
          { $push: { 'gameState.chatMessages': message } }
        );
        io.to(roomCode).emit('chatMessage', message);
        io.to(roomCode).emit('playerList', updatedPlayers);
        io.to(roomCode).emit('updateGameState', {
          time: room.gameState.time,
          revealedIndices: room.gameState.revealedIndices || [],
          size: room.gameState.size,
          hintCount: room.gameState.hintCount,
          correctPlayers: updatedCorrectPlayers,
        });
        console.log('Correct guess:', { playerName, roomCode, correctPlayers: updatedCorrectPlayers });
      } else {
        const message = {
          playerName,
          guess,
          isCorrect: false,
          timestamp: new Date().toLocaleTimeString(),
        };
        await db.collection('rooms').updateOne(
          { roomCode },
          { $push: { 'gameState.chatMessages': message } }
        );
        io.to(roomCode).emit('chatMessage', message);
        console.log('Incorrect guess:', { playerName, guess, roomCode });
      }
    } catch (error) {
      console.error('Error submitting guess:', error);
      socket.emit('error', { message: 'Failed to submit guess' });
    }
  });

  socket.on('useHint', async ({ roomCode }) => {
    try {
      const room = await db.collection('rooms').findOne({ roomCode });
      if (!room || room.players[0].id !== socket.id) {
        socket.emit('error', { message: 'Only the host can use hints' });
        return;
      }
      if (room.gameState.hintCount > 0) {
        const newSize = room.gameState.size + 10000000;
        const newHintCount = room.gameState.hintCount - 1;
        await db.collection('rooms').updateOne(
          { roomCode },
          { $set: { 'gameState.size': newSize, 'gameState.hintCount': newHintCount } }
        );
        io.to(roomCode).emit('updateGameState', {
          time: room.gameState.time,
          revealedIndices: room.gameState.revealedIndices || [],
          size: newSize,
          hintCount: newHintCount,
          correctPlayers: room.gameState.correctPlayers || [],
        });
        console.log('Hint used:', { roomCode, newSize, newHintCount });
      } else {
        socket.emit('error', { message: 'No hints left' });
      }
    } catch (error) {
      console.error('Error using hint:', error);
    }
  });

  socket.on('nextRound', async ({ roomCode }) => {
    try {
      const room = await db.collection('rooms').findOne({ roomCode });
      if (!room || room.players[0].id !== socket.id) {
        socket.emit('error', { message: 'Only the host can start the next round' });
        return;
      }
      const newRound = await startNewRound(roomCode);
      io.to(roomCode).emit('nextRound', newRound);
      console.log(`Next round started in room: ${roomCode}, Round: ${newRound.round}`);
    } catch (error) {
      console.error('Error starting next round:', error);
    }
  });

  socket.on('requestTimerUpdate', async ({ roomCode }) => {
    try {
      const room = await db.collection('rooms').findOne({ roomCode });
      if (room && room.gameState.round > 0) {
        let time = room.gameState.time;
        if (time > 0) {
          time -= 1;
          let revealedIndices = Array.isArray(room.gameState.revealedIndices) ? room.gameState.revealedIndices : [];
          if (time === 15 || time === 8) {
            const indices = [];
            for (let i = 0; i < room.gameState.currentObjectName.length; i++) {
              if (room.gameState.currentObjectName[i] !== ' ' && !revealedIndices.includes(i)) {
                indices.push(i);
              }
            }
            if (indices.length > 0) {
              const revealIndex = indices[Math.floor(Math.random() * indices.length)];
              revealedIndices = [...revealedIndices, revealIndex];
            }
          }
          await db.collection('rooms').updateOne(
            { roomCode },
            { $set: { 'gameState.time': time, 'gameState.revealedIndices': revealedIndices } }
          );
          io.to(roomCode).emit('updateGameState', {
            time,
            revealedIndices,
            size: room.gameState.size,
            hintCount: room.gameState.hintCount,
            correctPlayers: room.gameState.correctPlayers || [],
          });
          console.log('Timer update:', { roomCode, time, revealedIndices });
          if (time === 0) {
            await endRound(roomCode);
          }
        }
      }
    } catch (error) {
      console.error('Error updating timer:', error);
    }
  });

  async function startNewRound(roomCode) {
    const room = await db.collection('rooms').findOne({ roomCode });
    if (!room) {
      console.error('startNewRound: Room not found:', roomCode);
      socket.emit('error', { message: 'Room does not exist' });
      return;
    }
    const newRoundNumber = room.gameState.round + 1;
    const randomObj = imageData[Math.floor(Math.random() * imageData.length)];
    const newGameState = {
      round: newRoundNumber,
      currentImage: randomObj.url || '/images/default.jpg',
      currentObjectName: randomObj.name,
      hintCount: 3,
      size: 120,
      time: 30,
      revealedIndices: [],
      correctPlayers: [],
      chatMessages: [],
    };
    await db.collection('rooms').updateOne(
      { roomCode },
      { $set: { gameState: newGameState } }
    );
    console.log('New round state:', newGameState);
    return newGameState;
  }

  async function endRound(roomCode) {
    const room = await db.collection('rooms').findOne({ roomCode });
    if (!room) {
      console.error('endRound: Room not found:', roomCode);
      return;
    }
    const isFinalRound = room.gameState.round >= 10;
    io.to(roomCode).emit('endRound', {
      objectName: room.gameState.currentObjectName,
      correctPlayers: room.gameState.correctPlayers || [],
      isFinalRound,
      players: room.players,
    });
    if (isFinalRound) {
      await db.collection('rooms').deleteOne({ roomCode });
      console.log(`Room deleted: ${roomCode}`);
    }
  }

  socket.on('disconnect', async () => {
    console.log('A user disconnected:', socket.id);
    try {
      const roomsCursor = await db.collection('rooms').find();
      const roomList = await roomsCursor.toArray();
      for (const room of roomList) {
        const playerIndex = room.players.findIndex((player) => player.id === socket.id);
        if (playerIndex !== -1) {
          const playerName = room.players[playerIndex].name;
          const updatedPlayers = [...room.players];
          updatedPlayers.splice(playerIndex, 1);
          await db.collection('rooms').updateOne(
            { roomCode: room.roomCode },
            { $set: { players: updatedPlayers } }
          );
          io.to(room.roomCode).emit('playerList', updatedPlayers);
          console.log(`${playerName} left room: ${room.roomCode}`);
          if (updatedPlayers.length === 0) {
            await db.collection('rooms').deleteOne({ roomCode: room.roomCode });
            console.log(`Room deleted: ${room.roomCode}`);
          }
        }
      }
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
