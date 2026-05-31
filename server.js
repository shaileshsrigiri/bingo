const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const gameState = new Map();
const playerGames = new Map();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('create_game', (playerName, callback) => {
      const gameId = Math.random().toString(36).substr(2, 9);
      const playerId = socket.id;

      gameState.set(gameId, {
        gameId,
        player1: { id: playerId, name: playerName, grid: null, marked: null, bingoLetters: [false, false, false, false, false], completedLines: [] },
        player2: null,
        currentTurn: 'player1',
        gameStatus: 'setup',
        lastCalledNumber: null,
        calledNumbers: [],
      });

      playerGames.set(playerId, gameId);
      socket.join(gameId);
      socket.emit('game_created', { gameId, playerId });

      if (callback) callback({ gameId, playerId });
    });

    socket.on('join_game', (gameId, playerName, callback) => {
      const game = gameState.get(gameId);
      if (!game) {
        if (callback) callback({ error: 'Game not found' });
        return;
      }

      const playerId = socket.id;
      game.player2 = { id: playerId, name: playerName, grid: null, marked: null, bingoLetters: [false, false, false, false, false], completedLines: [] };
      playerGames.set(playerId, gameId);
      socket.join(gameId);

      io.to(gameId).emit('game_joined', { gameId, player1: game.player1, player2: game.player2 });
      if (callback) callback({ gameId, playerId });
    });

    socket.on('set_grid', (gameId, grid, callback) => {
      const game = gameState.get(gameId);
      if (!game) return;

      const playerId = socket.id;
      if (game.player1.id === playerId) {
        game.player1.grid = grid;
        game.player1.marked = Array(5).fill(null).map(() => Array(5).fill(false));
      } else if (game.player2 && game.player2.id === playerId) {
        game.player2.grid = grid;
        game.player2.marked = Array(5).fill(null).map(() => Array(5).fill(false));
      }

      // Check if both players have set their grids
      if (game.player1.grid && game.player2 && game.player2.grid) {
        game.gameStatus = 'playing';
        game.currentTurn = 'player1';
        io.to(gameId).emit('game_started', { game });
      }

      if (callback) callback({ success: true });
    });

    socket.on('call_number', (gameId, number, callback) => {
      const game = gameState.get(gameId);
      if (!game || game.gameStatus !== 'playing') return;

      const playerId = socket.id;
      const isPlayer1 = game.player1.id === playerId;

      if (isPlayer1 && game.currentTurn !== 'player1') return;
      if (!isPlayer1 && game.currentTurn !== 'player2') return;

      // Prevent calling the same number twice
      if (game.calledNumbers.includes(number)) return;

      game.lastCalledNumber = number;
      game.calledNumbers.push(number);

      // Mark number on both grids
      markNumberOnGrid(game.player1, number);
      if (game.player2) markNumberOnGrid(game.player2, number);

      io.to(gameId).emit('number_called', { number, playerId });

      // Check for new completed lines
      const newLines1 = checkLinesForPlayer(game.player1);
      const newLines2 = game.player2 ? checkLinesForPlayer(game.player2) : [];

      if (newLines1.length > 0) {
        io.to(gameId).emit('line_completed', { playerId: game.player1.id, lines: newLines1 });
        updateBingoLetters(game.player1);
      }

      if (newLines2.length > 0) {
        io.to(gameId).emit('line_completed', { playerId: game.player2.id, lines: newLines2 });
        updateBingoLetters(game.player2);
      }

      // Switch turn
      game.currentTurn = game.currentTurn === 'player1' ? 'player2' : 'player1';

      if (callback) callback({ success: true });
    });

    socket.on('bingo_pressed', (gameId, callback) => {
      const game = gameState.get(gameId);
      if (!game) return;

      const playerId = socket.id;
      const isPlayer1 = game.player1.id === playerId;
      const player = isPlayer1 ? game.player1 : game.player2;

      if (player && player.completedLines.length >= 5) {
        game.gameStatus = 'finished';
        io.to(gameId).emit('bingo_pressed', { playerId, winner: playerId });
      }

      if (callback) callback({ success: true });
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      const gameId = playerGames.get(socket.id);
      if (gameId) {
        const game = gameState.get(gameId);
        if (game) {
          io.to(gameId).emit('player_left', { playerId: socket.id });
          gameState.delete(gameId);
        }
        playerGames.delete(socket.id);
      }
    });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});

function markNumberOnGrid(player, number) {
  if (!player.grid) return;
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (player.grid[i][j] === number) {
        player.marked[i][j] = true;
      }
    }
  }
}

function checkLinesForPlayer(player) {
  const newLines = [];
  const alreadyCompleted = new Set(
    player.completedLines.map(line => `${line.type}-${line.index}`)
  );

  // Check rows
  for (let i = 0; i < 5; i++) {
    const key = `row-${i}`;
    if (!alreadyCompleted.has(key) && player.marked[i].every(m => m)) {
      newLines.push({ type: 'row', index: i });
      player.completedLines.push({ type: 'row', index: i });
    }
  }

  // Check columns
  for (let j = 0; j < 5; j++) {
    const key = `column-${j}`;
    if (!alreadyCompleted.has(key)) {
      if (Array(5).fill(null).every((_, i) => player.marked[i][j])) {
        newLines.push({ type: 'column', index: j });
        player.completedLines.push({ type: 'column', index: j });
      }
    }
  }

  // Check diagonals
  const diag1Key = 'diagonal-0';
  if (!alreadyCompleted.has(diag1Key)) {
    if (Array(5).fill(null).every((_, i) => player.marked[i][i])) {
      newLines.push({ type: 'diagonal', index: 0 });
      player.completedLines.push({ type: 'diagonal', index: 0 });
    }
  }

  const diag2Key = 'diagonal-1';
  if (!alreadyCompleted.has(diag2Key)) {
    if (Array(5).fill(null).every((_, i) => player.marked[i][4 - i])) {
      newLines.push({ type: 'diagonal', index: 1 });
      player.completedLines.push({ type: 'diagonal', index: 1 });
    }
  }

  return newLines;
}

function updateBingoLetters(player) {
  const lineCount = player.completedLines.length;
  for (let i = 0; i < Math.min(lineCount, 5); i++) {
    player.bingoLetters[i] = true;
  }
}
