import { createServer } from 'node:http';
import { randomUUID, createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_FILE = join(__dirname, 'data.json');

const defaultDB = {
  users: [
    {
      id: 'seed-user-1',
      name: 'Sinchana',
      email: 'sinchana@example.com',
      passwordHash: hash('password123'),
      role: 'admin'
    }
  ],
  sessions: [],
  trips: [
    {
      id: 'trip-1',
      userId: 'seed-user-1',
      destination: 'Udaipur',
      days: 4,
      budget: 42000,
      style: 'Luxury',
      startDate: '2026-05-03',
      status: 'saved'
    }
  ],
  bookings: [
    { id: 'bk-1', type: 'flight', from: 'BLR', to: 'DEL', price: 6200, provider: 'Air India' },
    { id: 'bk-2', type: 'hotel', city: 'Jaipur', price: 4800, provider: 'Taj Gateway' },
    { id: 'bk-3', type: 'transport', city: 'Mumbai', price: 900, provider: 'Metro + Cab Combo' }
  ]
};

if (!existsSync(DB_FILE)) {
  writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function loadDB() {
  return JSON.parse(readFileSync(DB_FILE, 'utf8'));
}

function saveDB(db) {
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function send(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      resolve(body ? JSON.parse(body) : {});
    });
  });
}

function authUser(req, db) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  const session = db.sessions.find((entry) => entry.token === token);
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) || null;
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    send(res, 200, { ok: true });
    return;
  }

  const db = loadDB();

  if (req.url === '/api/health' && req.method === 'GET') {
    send(res, 200, { status: 'ok', service: 'yatraai-api' });
    return;
  }

  if (req.url === '/api/auth/register' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.email || !body.password || !body.name) {
      send(res, 400, { error: 'name, email, and password are required' });
      return;
    }

    const existing = db.users.find((u) => u.email === body.email);
    if (existing) {
      send(res, 409, { error: 'email already exists' });
      return;
    }

    const user = {
      id: randomUUID(),
      name: body.name,
      email: body.email,
      passwordHash: hash(body.password),
      role: 'user'
    };
    db.users.push(user);
    saveDB(db);
    send(res, 201, { message: 'registered' });
    return;
  }

  if (req.url === '/api/auth/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const user = db.users.find((u) => u.email === body.email && u.passwordHash === hash(body.password || ''));

    if (!user) {
      send(res, 401, { error: 'invalid credentials' });
      return;
    }

    const token = randomUUID();
    db.sessions = db.sessions.filter((s) => s.userId !== user.id);
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    saveDB(db);

    send(res, 200, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
    return;
  }

  if (req.url === '/api/trips' && req.method === 'GET') {
    const user = authUser(req, db);
    if (!user) {
      send(res, 401, { error: 'unauthorized' });
      return;
    }

    const trips = db.trips.filter((trip) => trip.userId === user.id);
    send(res, 200, { trips });
    return;
  }

  if (req.url === '/api/trips' && req.method === 'POST') {
    const user = authUser(req, db);
    if (!user) {
      send(res, 401, { error: 'unauthorized' });
      return;
    }

    const body = await parseBody(req);
    const trip = {
      id: randomUUID(),
      userId: user.id,
      destination: body.destination,
      startDate: body.startDate,
      days: body.days,
      budget: body.budget,
      style: body.style,
      status: 'saved'
    };

    db.trips.push(trip);
    saveDB(db);
    send(res, 201, { trip });
    return;
  }

  if (req.url?.startsWith('/api/bookings') && req.method === 'GET') {
    const type = new URL(req.url, 'http://localhost').searchParams.get('type');
    const results = type ? db.bookings.filter((entry) => entry.type === type) : db.bookings;
    send(res, 200, { results });
    return;
  }

  if (req.url === '/api/admin/metrics' && req.method === 'GET') {
    const user = authUser(req, db);
    if (!user || user.role !== 'admin') {
      send(res, 403, { error: 'admin only' });
      return;
    }

    send(res, 200, {
      users: db.users.length,
      activeSessions: db.sessions.length,
      savedTrips: db.trips.length,
      bookingSources: [...new Set(db.bookings.map((b) => b.provider))].length
    });
    return;
  }

  send(res, 404, { error: 'not found' });
});

const PORT = process.env.PORT || 8787;
server.listen(PORT, () => {
  console.log(`YatraAI API running on http://localhost:${PORT}`);
});
