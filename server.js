const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const path = require('path');
const os = require('os');

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const rooms = new Map();

const HEBREW_WORDS = [
  'כלב','חתול','בית','עץ','שמש','ירח','כוכב','דג','ציפור','סוס',
  'פרח','תפוח','בננה','אריה','פיל','קוף','ברווז','פרפר','חיפושית','נחש',
  'מכונית','אוטובוס','אופניים','רכבת','מטוס','ספינה','טרקטור','אופנוע',
  'שולחן','כיסא','מיטה','דלת','חלון','מטריה','כובע','נעל','גרב','תיק',
  'עוגה','גלידה','פיצה','המבורגר','שוקולד','ממתק','ענבים','אבטיח','תות',
  'כדורגל','כדורסל','טניס','שחייה','ריצה','גלישה','שחמט','ג׳ודו',
  'גיטרה','פסנתר','תוף','חליל','כינור','חצוצרה',
  'טלוויזיה','טלפון','מחשב','מצלמה','שעון','מחבת','מקרר',
  'הר','ים','נהר','מדבר','יער','כפר','עיר','גשם','שלג','ענן',
  'מלך','נסיכה','קוסם','ניינג׳ה','פיראט','אסטרונאוט','ליצן',
  'פיה','דרקון','חד קרן','ענק','גמד','רובוט','זומבי','נחש',
  'כיכר','גשר','מגדל','טירה','סירה','כדור','בלון','מצנח',
  'ארנב','צב','תנין','ג׳ירפה','פינגווין','פולר','דוב','שועל'
];

function genCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function pickWord(room) {
  const pool = (room.settings.wordMode === 'custom' && room.settings.customWords.length > 0)
    ? room.settings.customWords
    : HEBREW_WORDS;
  const unused = pool.filter(w => !room.usedWords.has(w));
  const list = unused.length > 0 ? unused : pool;
  const word = list[Math.floor(Math.random() * list.length)];
  room.usedWords.add(word);
  return word;
}

function maskWord(word) {
  return word.split('').map(c => c === ' ' ? '  ' : '_').join(' ');
}

function startRound(code) {
  const room = rooms.get(code);
  if (!room) return;

  const activePlayers = room.players.filter(p => !p.isSpectator);
  if (activePlayers.length < 1) return;

  room.drawerIndex = (room.drawerIndex + 1) % activePlayers.length;

  if (room.drawerIndex === 0 && room.roundStarted) {
    room.currentRound++;
    if (room.currentRound > room.settings.rounds) {
      endGame(code);
      return;
    }
  }
  room.roundStarted = true;

  const drawer = activePlayers[room.drawerIndex];
  room.currentDrawer = drawer.id;
  room.currentWord = pickWord(room);
  room.guessedPlayers = new Set();
  room.roundStartTime = Date.now();

  io.to(code).emit('clear-canvas');

  // Send round-start FIRST (sets masked word for everyone), then your-word to drawer
  // so that your-word (which sets the real word) is never overwritten by round-start
  io.to(code).emit('round-start', {
    drawer: room.currentDrawer,
    drawerName: drawer.name,
    drawerSkin: drawer.skin,
    round: room.currentRound,
    totalRounds: room.settings.rounds,
    timeLimit: room.settings.timeLimit,
    masked: maskWord(room.currentWord),
    wordLen: room.currentWord.length
  });

  io.to(room.currentDrawer).emit('your-word', {
    word: room.currentWord,
    masked: maskWord(room.currentWord)
  });

  const ownerPlayer = room.players.find(p => p.id === room.owner);
  if (ownerPlayer && ownerPlayer.isSpectator) {
    io.to(room.owner).emit('your-word', {
      word: room.currentWord,
      masked: maskWord(room.currentWord),
      spectating: true
    });
  }

  room.roundTimer = setTimeout(() => endRound(code), room.settings.timeLimit * 1000);
}

function endRound(code) {
  const room = rooms.get(code);
  if (!room) return;
  clearTimeout(room.roundTimer);
  room.roundTimer = null;

  io.to(code).emit('round-end', {
    word: room.currentWord,
    scores: room.scores
  });

  setTimeout(() => startRound(code), 4000);
}

function endGame(code) {
  const room = rooms.get(code);
  if (!room) return;

  const sorted = room.players
    .filter(p => !p.isSpectator)
    .sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0));

  io.to(code).emit('game-over', {
    scores: room.scores,
    players: sorted,
    winner: sorted[0] || null
  });

  room.gameState = 'ended';
}

io.on('connection', socket => {
  socket.on('create-lobby', ({ playerName, skin }) => {
    let code;
    do { code = genCode(); } while (rooms.has(code));

    const player = { id: socket.id, name: playerName, skin, isOwner: true, isSpectator: false };
    const room = {
      code, owner: socket.id,
      players: [player],
      settings: { timeLimit: 80, rounds: 3, wordMode: 'random', customWords: [] },
      gameState: 'lobby',
      currentRound: 1, drawerIndex: -1, roundStarted: false,
      currentDrawer: null, currentWord: null,
      guessedPlayers: new Set(), usedWords: new Set(),
      scores: {}, roundTimer: null, roundStartTime: 0
    };

    rooms.set(code, room);
    socket.join(code);
    socket.roomCode = code;
    socket.emit('lobby-created', { code, players: room.players, settings: room.settings, owner: room.owner });
  });

  socket.on('join-lobby', ({ code, playerName, skin }) => {
    const room = rooms.get(code);
    if (!room) return socket.emit('error', { msg: 'החדר לא נמצא 😢' });
    if (room.gameState !== 'lobby') return socket.emit('error', { msg: 'המשחק כבר התחיל!' });
    if (room.players.length >= 20) return socket.emit('error', { msg: 'החדר מלא! (מקסימום 20)' });
    if (room.players.find(p => p.name === playerName)) return socket.emit('error', { msg: 'שם השחקן כבר תפוס!' });

    const player = { id: socket.id, name: playerName, skin, isOwner: false, isSpectator: false };
    room.players.push(player);
    socket.join(code);
    socket.roomCode = code;

    socket.emit('lobby-joined', { code, players: room.players, settings: room.settings, owner: room.owner });
    socket.to(code).emit('players-update', { players: room.players });
  });

  // Rejoin after page refresh / reconnect
  socket.on('rejoin-lobby', ({ code, playerName, skin }) => {
    const room = rooms.get(code);
    if (!room) return; // room gone, silently ignore

    const player = room.players.find(p => p.name === playerName);
    if (!player) return;

    // Update old socket ID → new socket ID everywhere
    const oldId = player.id;
    player.id = socket.id;
    player.skin = skin;
    if (room.owner === oldId) room.owner = socket.id;
    if (room.currentDrawer === oldId) room.currentDrawer = socket.id;
    if (room.scores[oldId] !== undefined) {
      room.scores[socket.id] = room.scores[oldId];
      delete room.scores[oldId];
    }

    socket.join(code);
    socket.roomCode = code;

    const timeLeft = room.gameState === 'playing'
      ? Math.max(0, room.settings.timeLimit - Math.floor((Date.now() - room.roundStartTime) / 1000))
      : room.settings.timeLimit;

    const drawerPlayer = room.players.find(p => p.id === room.currentDrawer);

    socket.emit('rejoined', {
      code,
      players: room.players,
      settings: room.settings,
      owner: room.owner,
      gameState: room.gameState,
      currentDrawer: room.currentDrawer,
      drawerName: drawerPlayer?.name || '',
      drawerSkin: drawerPlayer?.skin || null,
      scores: room.scores,
      masked: room.currentWord ? maskWord(room.currentWord) : null,
      wordLen: room.currentWord?.length || 0,
      round: room.currentRound,
      totalRounds: room.settings.rounds,
      timeLeft,
      ownerIsSpectator: room.players.find(p => p.id === room.owner)?.isSpectator || false,
    });

    if (room.currentDrawer === socket.id && room.currentWord) {
      socket.emit('your-word', { word: room.currentWord, masked: maskWord(room.currentWord) });
    }

    io.to(code).emit('players-update', { players: room.players });
  });

  socket.on('update-skin', ({ skin }) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;
    const p = room.players.find(p => p.id === socket.id);
    if (p) { p.skin = skin; io.to(socket.roomCode).emit('players-update', { players: room.players }); }
  });

  socket.on('update-settings', ({ settings }) => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.owner !== socket.id) return;
    room.settings = { ...room.settings, ...settings };
    io.to(socket.roomCode).emit('settings-update', { settings: room.settings });
  });

  socket.on('toggle-spectator', ({ isSpectator }) => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.owner !== socket.id) return;
    const p = room.players.find(p => p.id === socket.id);
    if (p) { p.isSpectator = isSpectator; io.to(socket.roomCode).emit('players-update', { players: room.players }); }
  });

  socket.on('start-game', () => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.owner !== socket.id) return;
    const active = room.players.filter(p => !p.isSpectator);
    if (active.length < 2) return socket.emit('error', { msg: 'צריך לפחות 2 שחקנים!' });

    room.gameState = 'playing';
    room.scores = {};
    room.players.forEach(p => { room.scores[p.id] = 0; });

    io.to(socket.roomCode).emit('game-started', { ownerIsSpectator: room.players.find(p => p.id === room.owner)?.isSpectator });
    setTimeout(() => startRound(socket.roomCode), 2000);
  });

  socket.on('draw', data => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.currentDrawer !== socket.id) return;
    socket.to(socket.roomCode).emit('draw', data);
  });

  socket.on('clear-canvas', () => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.currentDrawer !== socket.id) return;
    io.to(socket.roomCode).emit('clear-canvas');
  });

  socket.on('chat-message', ({ message }) => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.gameState !== 'playing') return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    if (socket.id === room.currentDrawer) return;
    if (room.guessedPlayers.has(socket.id)) return;

    const correct = message.trim() === room.currentWord.trim();

    if (correct) {
      room.guessedPlayers.add(socket.id);
      const elapsed = (Date.now() - room.roundStartTime) / 1000;
      const bonus = Math.max(0, Math.floor((room.settings.timeLimit - elapsed) / room.settings.timeLimit * 500));
      const pts = 100 + bonus;
      room.scores[socket.id] = (room.scores[socket.id] || 0) + pts;
      room.scores[room.currentDrawer] = (room.scores[room.currentDrawer] || 0) + 50;

      io.to(socket.roomCode).emit('player-guessed', {
        playerId: socket.id, playerName: player.name, skin: player.skin,
        pts, scores: room.scores
      });

      const nonDrawers = room.players.filter(p => p.id !== room.currentDrawer && !p.isSpectator);
      if (room.guessedPlayers.size >= nonDrawers.length) endRound(socket.roomCode);
    } else {
      io.to(socket.roomCode).emit('chat-message', {
        playerId: socket.id, playerName: player.name, skin: player.skin, message
      });
    }
  });

  socket.on('get-qr', async ({ code, clientOrigin }) => {
    const baseUrl = publicUrl || process.env.BASE_URL || clientOrigin || `http://${getLanIp()}:${PORT}`;
    const url = `${baseUrl}/join/${code}`;
    try {
      const qr = await QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: '#2D3561', light: '#FFF5E4' } });
      socket.emit('qr-code', { qr, url });
    } catch (e) { console.error(e); }
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);

    if (room.players.length === 0) {
      clearTimeout(room.roundTimer);
      rooms.delete(socket.roomCode);
      return;
    }

    if (room.owner === socket.id) {
      room.owner = room.players[0].id;
      room.players[0].isOwner = true;
    }

    io.to(socket.roomCode).emit('players-update', { players: room.players, newOwner: room.owner });

    if (room.gameState === 'playing' && room.currentDrawer === socket.id) {
      clearTimeout(room.roundTimer);
      endRound(socket.roomCode);
    }
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'client/dist/index.html')));
}

// Health check so localtunnel bypass works
app.get('/ping', (_, res) => res.send('pong'));

let publicUrl = null;

const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  const lanIp = getLanIp();
  console.log('\n  DrawGame - ready!');
  console.log(`  Local:    http://localhost:${PORT}`);
  console.log(`  Network:  http://${lanIp}:${PORT}  <-- share this with friends on WiFi\n`);

  if (process.env.TUNNEL === 'true') {
    console.log('  Opening internet tunnel...');
    try {
      const localtunnel = require('localtunnel');
      const tunnel = await localtunnel({ port: Number(PORT) });
      publicUrl = tunnel.url;
      console.log('\n  -----------------------------------------');
      console.log('  Public link (share with anyone):');
      console.log(`  ${publicUrl}`);
      console.log('  -----------------------------------------\n');
      io.emit('public-url', { url: publicUrl });
      tunnel.on('close', () => console.log('  Tunnel closed'));
      tunnel.on('error', e => console.error('  Tunnel error:', e));
    } catch (e) {
      console.error('  Failed to open tunnel:', e.message);
    }
  }
});

// Expose public URL to clients for QR code generation
app.get('/api/public-url', (_, res) => {
  res.json({ url: publicUrl || `http://localhost:${PORT}` });
});
