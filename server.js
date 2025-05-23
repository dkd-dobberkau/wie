const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Character data
const characters = [
  {name: "Anna", hair: "blond", eyes: "blau", glasses: false, hat: false, beard: false, gender: "w", age: "jung"},
  {name: "Ben", hair: "braun", eyes: "braun", glasses: true, hat: false, beard: false, gender: "m", age: "jung"},
  {name: "Clara", hair: "schwarz", eyes: "grün", glasses: false, hat: true, beard: false, gender: "w", age: "alt"},
  {name: "David", hair: "rot", eyes: "blau", glasses: false, hat: false, beard: true, gender: "m", age: "alt"},
  {name: "Emma", hair: "blond", eyes: "braun", glasses: true, hat: false, beard: false, gender: "w", age: "jung"},
  {name: "Frank", hair: "grau", eyes: "grau", glasses: false, hat: true, beard: true, gender: "m", age: "alt"},
  {name: "Gina", hair: "braun", eyes: "grün", glasses: false, hat: false, beard: false, gender: "w", age: "jung"},
  {name: "Hans", hair: "schwarz", eyes: "braun", glasses: true, hat: false, beard: false, gender: "m", age: "alt"},
  {name: "Ina", hair: "rot", eyes: "blau", glasses: false, hat: true, beard: false, gender: "w", age: "jung"},
  {name: "Jan", hair: "blond", eyes: "grün", glasses: false, hat: false, beard: true, gender: "m", age: "jung"},
  {name: "Kate", hair: "schwarz", eyes: "braun", glasses: true, hat: false, beard: false, gender: "w", age: "alt"},
  {name: "Lars", hair: "braun", eyes: "blau", glasses: false, hat: true, beard: false, gender: "m", age: "jung"},
  {name: "Mia", hair: "blond", eyes: "grün", glasses: false, hat: false, beard: false, gender: "w", age: "jung"},
  {name: "Nick", hair: "rot", eyes: "braun", glasses: true, hat: false, beard: true, gender: "m", age: "alt"},
  {name: "Olga", hair: "grau", eyes: "blau", glasses: false, hat: true, beard: false, gender: "w", age: "alt"},
  {name: "Paul", hair: "schwarz", eyes: "grün", glasses: false, hat: false, beard: false, gender: "m", age: "jung"}
];

// In-Memory Game State
const gameRooms = new Map();
const playerSessions = new Map();

// Port für Railway
const PORT = process.env.PORT || 3000;

// Cleanup alte Räume alle 10 Minuten
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 Minuten
  
  for (const [roomId, gameState] of gameRooms.entries()) {
    if (now - gameState.createdAt > maxAge) {
      console.log(`Räume ${roomId} aufgrund Inaktivität gelöscht`);
      gameRooms.delete(roomId);
    }
  }
}, 10 * 60 * 1000);

// Socket.io Events
io.on('connection', (socket) => {
  console.log('🎮 Spieler verbunden:', socket.id);
  
  // Raum erstellen
  socket.on('createRoom', (playerName) => {
    try {
      const roomId = generateRoomId();
      const gameState = createNewGame(roomId, socket.id, playerName);
      gameRooms.set(roomId, gameState);
      playerSessions.set(socket.id, { roomId, playerNumber: 1, playerName });
      
      socket.join(roomId);
      socket.emit('roomCreated', { 
        roomId, 
        playerNumber: 1,
        gameState: sanitizeGameState(gameState, 1)
      });
      
      console.log(`🏠 Raum ${roomId} erstellt von ${playerName}`);
    } catch (error) {
      console.error('Fehler beim Raum erstellen:', error);
      socket.emit('error', 'Fehler beim Raum erstellen');
    }
  });
  
  // Raum beitreten
  socket.on('joinRoom', (data) => {
    try {
      const { roomId, playerName } = data;
      const gameState = gameRooms.get(roomId);
      
      if (!gameState) {
        socket.emit('error', 'Raum nicht gefunden');
        return;
      }
      
      if (gameState.players.length >= 2) {
        socket.emit('error', 'Raum ist bereits voll');
        return;
      }
      
      if (gameState.status !== 'waiting') {
        socket.emit('error', 'Spiel läuft bereits');
        return;
      }
      
      gameState.players.push({ id: socket.id, name: playerName });
      gameState.status = 'ready';
      gameState.gameLog.push(`${playerName} ist dem Spiel beigetreten`);
      playerSessions.set(socket.id, { roomId, playerNumber: 2, playerName });
      
      socket.join(roomId);
      
      // Beide Spieler über ready state informieren
      io.to(roomId).emit('gameReady', {
        roomId,
        players: gameState.players,
        status: gameState.status
      });
      
      console.log(`🤝 ${playerName} ist Raum ${roomId} beigetreten`);
    } catch (error) {
      console.error('Fehler beim Raum beitreten:', error);
      socket.emit('error', 'Fehler beim Raum beitreten');
    }
  });
  
  // Spiel starten
  socket.on('startGame', () => {
    const session = playerSessions.get(socket.id);
    if (!session) return;
    
    const gameState = gameRooms.get(session.roomId);
    if (!gameState || gameState.status !== 'ready') return;
    
    gameState.status = 'selecting';
    gameState.gameLog.push('Spiel gestartet! Wählt eure Charaktere aus.');
    
    // Beiden Spielern das Spiel senden (mit gefilterten Daten)
    gameState.players.forEach((player, index) => {
      const playerNumber = index + 1;
      io.to(player.id).emit('gameStarted', {
        gameState: sanitizeGameState(gameState, playerNumber),
        characters,
        playerNumber
      });
    });
    
    console.log(`🎯 Spiel in Raum ${session.roomId} gestartet`);
  });
  
  // Charakter auswählen
  socket.on('selectCharacter', (data) => {
    const session = playerSessions.get(socket.id);
    if (!session) return;
    
    const gameState = gameRooms.get(session.roomId);
    if (!gameState || gameState.status !== 'selecting') return;
    
    const { characterIndex } = data;
    gameState.selections[session.playerNumber - 1] = characterIndex;
    gameState.gameLog.push(`${session.playerName} hat einen Charakter gewählt`);
    
    // Prüfen ob beide Spieler gewählt haben
    if (gameState.selections.filter(s => s !== null).length === 2) {
      gameState.status = 'playing';
      gameState.currentPlayer = 1;
      gameState.gameLog.push('Beide Spieler haben gewählt. Das Fragespiel beginnt!');
    }
    
    // Update an beide Spieler
    gameState.players.forEach((player, index) => {
      const playerNumber = index + 1;
      io.to(player.id).emit('gameUpdate', {
        gameState: sanitizeGameState(gameState, playerNumber),
        characters
      });
    });
    
    console.log(`✅ Charakter gewählt in Raum ${session.roomId}`);
  });
  
  // Charakter eliminieren
  socket.on('eliminateCharacter', (data) => {
    const session = playerSessions.get(socket.id);
    if (!session) return;
    
    const gameState = gameRooms.get(session.roomId);
    if (!gameState || gameState.status !== 'playing') return;
    
    const { characterIndex } = data;
    const playerIndex = session.playerNumber - 1;
    
    if (!gameState.eliminated[playerIndex]) {
      gameState.eliminated[playerIndex] = [];
    }
    
    if (!gameState.eliminated[playerIndex].includes(characterIndex)) {
      gameState.eliminated[playerIndex].push(characterIndex);
      gameState.gameLog.push(`${session.playerName} hat ${characters[characterIndex].name} eliminiert`);
    }
    
    // Update an beide Spieler
    gameState.players.forEach((player, index) => {
      const playerNumber = index + 1;
      io.to(player.id).emit('gameUpdate', {
        gameState: sanitizeGameState(gameState, playerNumber),
        characters
      });
    });
  });
  
  // Frage stellen
  socket.on('askQuestion', (data) => {
    const session = playerSessions.get(socket.id);
    if (!session) return;
    
    const gameState = gameRooms.get(session.roomId);
    if (!gameState || gameState.status !== 'playing') return;
    if (gameState.currentPlayer !== session.playerNumber) return;
    
    const { question } = data;
    
    // Frage an den anderen Spieler weiterleiten
    const otherPlayer = gameState.players.find(p => p.id !== socket.id);
    if (otherPlayer) {
      gameState.gameLog.push(`${session.playerName}: "${question}"`);
      io.to(otherPlayer.id).emit('questionReceived', {
        question,
        from: session.playerName,
        fromPlayerNumber: session.playerNumber
      });
    }
  });
  
  // Frage beantworten
  socket.on('answerQuestion', (data) => {
    const session = playerSessions.get(socket.id);
    if (!session) return;
    
    const gameState = gameRooms.get(session.roomId);
    if (!gameState || gameState.status !== 'playing') return;
    
    const { answer, questionFrom } = data;
    const answerText = answer ? 'Ja' : 'Nein';
    
    gameState.gameLog.push(`${session.playerName}: "${answerText}"`);
    
    // Spieler wechseln
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    
    // Antwort an alle senden
    io.to(session.roomId).emit('questionAnswered', {
      answer: answerText,
      from: session.playerName,
      nextPlayer: gameState.currentPlayer
    });
    
    // Game update
    gameState.players.forEach((player, index) => {
      const playerNumber = index + 1;
      io.to(player.id).emit('gameUpdate', {
        gameState: sanitizeGameState(gameState, playerNumber),
        characters
      });
    });
  });
  
  // Raten
  socket.on('makeGuess', (data) => {
    const session = playerSessions.get(socket.id);
    if (!session) return;
    
    const gameState = gameRooms.get(session.roomId);
    if (!gameState || gameState.status !== 'playing') return;
    
    const { characterIndex } = data;
    const otherPlayerIndex = session.playerNumber === 1 ? 1 : 0;
    const correctCharacter = gameState.selections[otherPlayerIndex];
    
    const guessedCharacter = characters[characterIndex];
    gameState.gameLog.push(`${session.playerName} rät: ${guessedCharacter.name}`);
    
    if (characterIndex === correctCharacter) {
      // Gewonnen!
      gameState.status = 'finished';
      gameState.winner = session.playerNumber;
      gameState.gameLog.push(`🎉 ${session.playerName} hat gewonnen!`);
      
      io.to(session.roomId).emit('gameFinished', {
        winner: session.playerNumber,
        winnerName: session.playerName,
        correctCharacter: characters[correctCharacter],
        gameLog: gameState.gameLog
      });
      
      console.log(`🏆 ${session.playerName} hat in Raum ${session.roomId} gewonnen`);
    } else {
      // Falsch geraten
      gameState.gameLog.push(`❌ Falsch! Das Spiel geht weiter.`);
      gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
      
      // Game update
      gameState.players.forEach((player, index) => {
        const playerNumber = index + 1;
        io.to(player.id).emit('gameUpdate', {
          gameState: sanitizeGameState(gameState, playerNumber),
          characters
        });
      });
    }
  });
  
  // Chat-Nachricht
  socket.on('chatMessage', (data) => {
    const session = playerSessions.get(socket.id);
    if (!session) return;
    
    const { message } = data;
    io.to(session.roomId).emit('chatMessage', {
      message,
      from: session.playerName,
      timestamp: Date.now()
    });
  });
  
  // Neues Spiel
  socket.on('newGame', () => {
    const session = playerSessions.get(socket.id);
    if (!session) return;
    
    const gameState = gameRooms.get(session.roomId);
    if (!gameState) return;
    
    // Game state zurücksetzen
    gameState.status = 'ready';
    gameState.selections = [null, null];
    gameState.eliminated = [[], []];
    gameState.currentPlayer = 1;
    gameState.winner = null;
    gameState.gameLog = ['Neues Spiel gestartet!'];
    gameState.createdAt = Date.now();
    
    io.to(session.roomId).emit('gameReset', {
      gameState: sanitizeGameState(gameState, session.playerNumber)
    });
  });
  
  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('❌ Spieler getrennt:', socket.id);
    handlePlayerDisconnect(socket.id);
  });
});

// Helper Functions
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createNewGame(roomId, playerId, playerName) {
  return {
    id: roomId,
    status: 'waiting', // waiting, ready, selecting, playing, finished
    players: [{ id: playerId, name: playerName }],
    selections: [null, null], // Gewählte Charaktere
    eliminated: [[], []], // Eliminierte Charaktere pro Spieler
    currentPlayer: 1,
    winner: null,
    gameLog: [`Raum ${roomId} erstellt`],
    createdAt: Date.now()
  };
}

function sanitizeGameState(gameState, playerNumber) {
  // Entfernt sensible Daten für den jeweiligen Spieler
  return {
    id: gameState.id,
    status: gameState.status,
    players: gameState.players.map(p => ({ name: p.name })),
    mySelection: gameState.selections[playerNumber - 1],
    eliminated: gameState.eliminated[playerNumber - 1] || [],
    currentPlayer: gameState.currentPlayer,
    winner: gameState.winner,
    gameLog: gameState.gameLog,
    playerCount: gameState.players.length
  };
}

function handlePlayerDisconnect(socketId) {
  const session = playerSessions.get(socketId);
  if (session) {
    const gameState = gameRooms.get(session.roomId);
    if (gameState) {
      // Anderen Spieler benachrichtigen
      gameState.gameLog.push(`${session.playerName} hat das Spiel verlassen`);
      io.to(session.roomId).emit('playerDisconnected', {
        playerName: session.playerName,
        gameLog: gameState.gameLog
      });
      
      // Raum nach 5 Minuten löschen
      setTimeout(() => {
        if (gameRooms.has(session.roomId)) {
          console.log(`🗑️ Raum ${session.roomId} wegen Inaktivität gelöscht`);
          gameRooms.delete(session.roomId);
        }
      }, 5 * 60 * 1000);
    }
    playerSessions.delete(socketId);
  }
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    rooms: gameRooms.size,
    players: playerSessions.size,
    uptime: process.uptime()
  });
});

// Stats Endpoint
app.get('/stats', (req, res) => {
  const roomStats = Array.from(gameRooms.values()).reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1;
    return acc;
  }, {});
  
  res.json({
    totalRooms: gameRooms.size,
    totalPlayers: playerSessions.size,
    roomsByStatus: roomStats,
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage()
  });
});

server.listen(PORT, () => {
  console.log(`🚂 Railway Server läuft auf Port ${PORT}`);
  console.log(`📊 Stats verfügbar unter: http://localhost:${PORT}/stats`);
});