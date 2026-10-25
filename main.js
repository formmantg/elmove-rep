const { autoUpdater } = require('electron-updater');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const PORT = 3847;
const DATA_DIR = path.join(app.getPath('userData'), 'elmove-data');
const FORUM_DIR = path.join(DATA_DIR, 'forum');
const PENDING_DIR = path.join(DATA_DIR, 'pending');
const LUMEN_DIR = path.join(DATA_DIR, 'lumen');

// Ensure directories
[DATA_DIR, FORUM_DIR, PENDING_DIR, LUMEN_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Default JSON files
function ensureJson(file, defaultVal) {
  const p = path.join(FORUM_DIR, file);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, JSON.stringify(defaultVal, null, 2), 'utf8');
  }
  return p;
}

const threadsPath = ensureJson('threads.json', []);
const postsPath = ensureJson('posts.json', []);
const usersPath = ensureJson('users.json', {});
// Czat tylko w pamięci sesji (nie zapisuje się na dysk)
let liveChat = [];
const pendingPath = path.join(PENDING_DIR, 'pending.json');
if (!fs.existsSync(pendingPath)) fs.writeFileSync(pendingPath, '[]', 'utf8');

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8') || '[]');
  } catch {
    return [];
  }
}
function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

// ===== Nick protection (hasło raz na zawsze) =====
function normalizeNick(n) {
  return String(n || '').trim();
}
function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString('hex');
}
function createHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, hash: hashPassword(password, salt) };
}
function verifyPassword(password, stored) {
  if (!stored || !stored.hash || !stored.salt) return false;
  const h = hashPassword(password, stored.salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(stored.hash, 'hex'));
  } catch {
    return false;
  }
}
function getUsers() {
  const u = readJson(usersPath);
  return (u && typeof u === 'object' && !Array.isArray(u)) ? u : {};
}
/** Sprawdza nick + opcjonalne hasło. Zwraca { ok, error } */
function checkNickAuth(author, password, { allowRegister = false, registerPassword = null } = {}) {
  const nick = normalizeNick(author);
  if (!nick || nick.toLowerCase() === 'anonim') {
    return { ok: true, nick: nick || 'Anonim' };
  }
  const users = getUsers();
  const key = Object.keys(users).find(k => k.toLowerCase() === nick.toLowerCase());
  const entry = key ? users[key] : null;

  if (entry) {
    // Nick już zabezpieczony – wymagaj hasła
    if (!password || !verifyPassword(password, entry)) {
      return { ok: false, error: 'Ten nick jest zabezpieczony. Podaj prawidłowe hasło.' };
    }
    return { ok: true, nick: key };
  }

  // Nick wolny – opcjonalnie zarejestruj hasło
  if (allowRegister && registerPassword && String(registerPassword).length >= 3) {
    users[nick] = { ...createHash(registerPassword), created: new Date().toISOString() };
    writeJson(usersPath, users);
    return { ok: true, nick, registered: true };
  }
  return { ok: true, nick };
}

// Express + Socket.IO
const expressApp = express();
const server = http.createServer(expressApp);
const io = new Server(server, { cors: { origin: '*' } });

expressApp.use(express.json({ limit: '10mb' }));

// Wstrzykuj elmove-app.js + blokadę cookie do każdego HTML (kod cookie zostaje, banner w appce nie)
expressApp.use((req, res, next) => {
  if (!req.path.endsWith('.html') && req.path !== '/' && !req.path.endsWith('/')) {
    return next();
  }
  const rel = req.path === '/' || req.path.endsWith('/')
    ? path.join(req.path === '/' ? 'index.html' : req.path.slice(1), req.path.endsWith('/') ? 'index.html' : '')
    : req.path.replace(/^\//, '');
  const filePath = path.join(__dirname, '../renderer', rel.includes('.html') ? rel : path.join(rel, 'index.html'));
  // Prostsza ścieżka: tylko jawne .html
  if (!req.path.endsWith('.html') && req.path !== '/') return next();
  const htmlPath = req.path === '/'
    ? path.join(__dirname, '../renderer/index.html')
    : path.join(__dirname, '../renderer', req.path.replace(/^\//, ''));
  if (!fs.existsSync(htmlPath)) return next();
  let html = fs.readFileSync(htmlPath, 'utf8');
  // Kod CookieHub zostaje w pliku źródłowym, ale w odpowiedzi aplikacji jest wyłączony
  html = html.replace(
    /<script[^>]*cdn\.cookiehub\.eu[^>]*>\s*<\/script>/gi,
    '<!-- cookiehub CDN disabled in app -->'
  );
  html = html.replace(
    /window\.cookiehub\.load\s*\([^)]*\)\s*;?/gi,
    '/* cookiehub.load disabled in app */'
  );
  const inject = `<script>window.cookiehub={load:function(){}};window.elmove=window.elmove||{isElectron:true,version:'1.0.0'};</script>
<script src="/elmove-app.js"></script>
<style id="elmove-hide-cookies">#cookiehub,.ch2,.ch2-container,.ch2-dialog,[id*="cookiehub"],[class*="cookiehub"],[class*="ch2-"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}</style>`;
  if (html.includes('<head>')) {
    html = html.replace('<head>', '<head>\n' + inject);
  } else if (html.includes('<HEAD>')) {
    html = html.replace('<HEAD>', '<HEAD>\n' + inject);
  } else {
    html = inject + html;
  }
  res.type('html').send(html);
});

// Czyste URL-e FormmantCSE → właściwy plik (jak na elmove.cloud)
expressApp.get(['/formmantcse', '/people/formmantcse', '/lumen/people/formmantcse'], (req, res) => {
  res.redirect(301, '/lumen/people/mateuszformicki/matforemport.html');
});

expressApp.use(express.static(path.join(__dirname, '../renderer')));

// Serve user uploaded lumen content
expressApp.use('/lumen-user', express.static(LUMEN_DIR));

// ========== FORUM API ==========
expressApp.get('/api/threads', (req, res) => {
  res.json(readJson(threadsPath));
});

expressApp.get('/api/posts/:threadId', (req, res) => {
  const posts = readJson(postsPath).filter(p => String(p.thread_id) === String(req.params.threadId));
  res.json(posts);
});

// Sprawdź czy nick jest zabezpieczony
expressApp.get('/api/nick/:name', (req, res) => {
  const nick = normalizeNick(req.params.name);
  if (!nick || nick.toLowerCase() === 'anonim') {
    return res.json({ protected: false });
  }
  const users = getUsers();
  const key = Object.keys(users).find(k => k.toLowerCase() === nick.toLowerCase());
  res.json({ protected: !!key, nick: key || nick });
});

// Zarejestruj hasło do nicku (tylko jeśli jeszcze nie chroniony)
expressApp.post('/api/nick/register', (req, res) => {
  const nick = normalizeNick(req.body.nick);
  const password = req.body.password;
  if (!nick || nick.toLowerCase() === 'anonim') {
    return res.status(400).json({ error: 'Nieprawidłowy nick' });
  }
  if (!password || String(password).length < 3) {
    return res.status(400).json({ error: 'Hasło musi mieć min. 3 znaki' });
  }
  const users = getUsers();
  const exists = Object.keys(users).some(k => k.toLowerCase() === nick.toLowerCase());
  if (exists) {
    return res.status(409).json({ error: 'Ten nick jest już zabezpieczony i nie można zmienić hasła' });
  }
  users[nick] = { ...createHash(password), created: new Date().toISOString() };
  writeJson(usersPath, users);
  res.json({ ok: true, nick, message: 'Nick zabezpieczony hasłem. Obowiązuje na stałe.' });
});

expressApp.post('/api/threads', (req, res) => {
  const auth = checkNickAuth(req.body.author, req.body.password, {
    allowRegister: true,
    registerPassword: req.body.setPassword || null
  });
  if (!auth.ok) return res.status(403).json({ error: auth.error });

  const threads = readJson(threadsPath);
  const id = Date.now();
  const thread = {
    id,
    title: req.body.title || 'Bez tytułu',
    author: auth.nick,
    created: new Date().toISOString(),
    content: req.body.content || ''
  };
  threads.unshift(thread);
  writeJson(threadsPath, threads);

  // also first post
  const posts = readJson(postsPath);
  posts.push({
    id: id + 1,
    thread_id: id,
    author: thread.author,
    content: thread.content,
    created: thread.created
  });
  writeJson(postsPath, posts);

  io.emit('forum:update', { type: 'thread', thread });
  res.json({ ...thread, registered: !!auth.registered });
});

expressApp.post('/api/posts', (req, res) => {
  const auth = checkNickAuth(req.body.author, req.body.password, {
    allowRegister: true,
    registerPassword: req.body.setPassword || null
  });
  if (!auth.ok) return res.status(403).json({ error: auth.error });

  const posts = readJson(postsPath);
  const post = {
    id: Date.now(),
    thread_id: req.body.thread_id,
    author: auth.nick,
    content: req.body.content || '',
    created: new Date().toISOString()
  };
  posts.push(post);
  writeJson(postsPath, posts);
  io.emit('forum:update', { type: 'post', post });
  res.json({ ...post, registered: !!auth.registered });
});

expressApp.post('/api/delete', (req, res) => {
  const { password, thread_id, post_id } = req.body;
  if (password !== 'szczurymiejskie') {
    return res.status(403).json({ error: 'Błędne hasło' });
  }
  if (thread_id) {
    let threads = readJson(threadsPath);
    threads = threads.filter(t => String(t.id) !== String(thread_id));
    writeJson(threadsPath, threads);
    let posts = readJson(postsPath);
    posts = posts.filter(p => String(p.thread_id) !== String(thread_id));
    writeJson(postsPath, posts);
    io.emit('forum:update', { type: 'delete_thread', thread_id });
  }
  if (post_id) {
    let posts = readJson(postsPath);
    posts = posts.filter(p => String(p.id) !== String(post_id));
    writeJson(postsPath, posts);
    io.emit('forum:update', { type: 'delete_post', post_id });
  }
  res.json({ ok: true });
});

// Chat — tylko w pamięci bieżącej sesji (po restarcie aplikacji znika)
expressApp.get('/api/chat', (req, res) => {
  res.json(liveChat.slice(-100));
});

expressApp.post('/api/chat', (req, res) => {
  const auth = checkNickAuth(req.body.author, req.body.password, {
    allowRegister: true,
    registerPassword: req.body.setPassword || null
  });
  if (!auth.ok) return res.status(403).json({ error: auth.error });

  const msg = {
    id: Date.now(),
    author: auth.nick,
    text: req.body.text || '',
    time: new Date().toISOString()
  };
  liveChat.push(msg);
  if (liveChat.length > 200) liveChat = liveChat.slice(-200);
  io.emit('chat:message', msg);
  res.json({ ...msg, registered: !!auth.registered });
});

// ========== LUMEN UPLOAD ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const id = req.uploadId || uuidv4();
    req.uploadId = id;
    const dir = path.join(PENDING_DIR, id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

expressApp.post('/api/lumen/submit', upload.array('files', 20), (req, res) => {
  const id = req.uploadId;
  const meta = {
    id,
    type: req.body.type || 'person', // person | team | organization
    name: req.body.name || 'Bez nazwy',
    description: req.body.description || '',
    status: 'pending',
    submitted: new Date().toISOString(),
    files: (req.files || []).map(f => f.originalname)
  };
  const pending = readJson(pendingPath);
  pending.push(meta);
  writeJson(pendingPath, pending);
  io.emit('lumen:pending', meta);
  res.json({ ok: true, id });
});

expressApp.get('/api/lumen/pending', (req, res) => {
  res.json(readJson(pendingPath).filter(p => p.status === 'pending'));
});

expressApp.post('/api/lumen/approve', (req, res) => {
  const { id, password } = req.body;
  if (password !== 'szczurymiejskie') {
    return res.status(403).json({ error: 'Błędne hasło' });
  }
  const pending = readJson(pendingPath);
  const item = pending.find(p => p.id === id);
  if (!item) return res.status(404).json({ error: 'Nie znaleziono' });

  // Move to lumen dir
  const src = path.join(PENDING_DIR, id);
  const dest = path.join(LUMEN_DIR, id);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
  }
  item.status = 'approved';
  item.approved = new Date().toISOString();
  writeJson(pendingPath, pending);
  io.emit('lumen:approved', item);
  res.json({ ok: true });
});

expressApp.post('/api/lumen/reject', (req, res) => {
  const { id, password } = req.body;
  if (password !== 'szczurymiejskie') {
    return res.status(403).json({ error: 'Błędne hasło' });
  }
  const pending = readJson(pendingPath);
  const idx = pending.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Nie znaleziono' });
  pending[idx].status = 'rejected';
  writeJson(pendingPath, pending);
  // cleanup
  const src = path.join(PENDING_DIR, id);
  if (fs.existsSync(src)) fs.rmSync(src, { recursive: true, force: true });
  res.json({ ok: true });
});

// ========== SOCKET.IO ==========
io.on('connection', (socket) => {
  console.log('Client connected', socket.id);

  socket.on('hyperclock:open', () => {
    // Broadcast impulse to all clients
    io.emit('hyperclock:impulse', {
      from: socket.id,
      time: Date.now()
    });
  });

  socket.on('hyperclock:pulse', (data) => {
    socket.broadcast.emit('hyperclock:pulse', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

// Start server
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Elmove server running on http://127.0.0.1:${PORT}`);
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#111111',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../renderer/app-icon.ico'),
    title: 'Ruch Uniesienia – Elmove'
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}/index.html`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
function setupAutoUpdater() {
  // tylko w zainstalowanej wersji, nie przy npm start
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('Sprawdzam aktualizacje…');
  });
  autoUpdater.on('update-available', (info) => {
    console.log('Dostępna aktualizacja:', info.version);
  });
  autoUpdater.on('update-not-available', () => {
    console.log('Brak nowszej wersji');
  });
  autoUpdater.on('error', (err) => {
    console.error('Błąd auto-update:', err);
  });
  autoUpdater.on('update-downloaded', (info) => {
    // po pobraniu — restart i instalacja
    const { dialog } = require('electron');
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Aktualizacja Elmove',
      message: `Pobrano wersję ${info.version}. Zainstalować teraz?`,
      buttons: ['Restart i instaluj', 'Później']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // sprawdź chwilę po starcie
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((e) => console.error(e));
  }, 3000);
}
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    server.close();
    app.quit();
  }
  app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();
});ś
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
