import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { initDatabase, getChats, getMessages, getAttachmentInfo, getIsDemoMode, dbEvents } from './db.js';
import { sendMessage } from './sender.js';
import { runDiagnostics } from './diagnostics.js';
import { mockChats, mockMessages } from './mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg'
};

// Connected SSE clients
const sseClients = new Set();

// Demo message counter
let demoMsgIdCounter = 9000;

/**
 * Broadcast an SSE event to all connected web clients.
 */
function broadcastSSE(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Hook DB events to SSE broadcast
dbEvents.on('new_messages', (messages) => {
  broadcastSSE('new_messages', messages);
});

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) {
        // 5MB limit
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON response
function sendJson(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache'
  });
  res.end(json);
}

// Helper to check authentication if PIN is set
function isAuthorized(req) {
  if (!config.pin) return true;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.replace(/^Bearer\s+/i, '').trim() === config.pin) {
    return true;
  }
  const cookieHeader = req.headers['cookie'];
  if (cookieHeader && cookieHeader.includes(`iport_token=${encodeURIComponent(config.pin)}`)) {
    return true;
  }
  return false;
}

// Main HTTP request handler
const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // --- API: Diagnostics & Status (always public so user can check setup) ---
  if (pathname === '/api/status' && method === 'GET') {
    const diag = await runDiagnostics();
    return sendJson(res, 200, {
      status: 'ok',
      isDemo: getIsDemoMode(),
      authRequired: Boolean(config.pin),
      diagnostics: diag
    });
  }

  // --- API: Authentication Login ---
  if (pathname === '/api/auth' && method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      if (!config.pin || body.pin === config.pin) {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Set-Cookie': `iport_token=${encodeURIComponent(config.pin || 'open')}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
        });
        return res.end(JSON.stringify({ success: true }));
      }
      return sendJson(res, 401, { error: 'Incorrect PIN' });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // Enforce auth on remaining /api/ routes
  if (pathname.startsWith('/api/') && !isAuthorized(req)) {
    return sendJson(res, 401, { error: 'Authentication required' });
  }

  // --- API: Get Conversations ---
  if (pathname === '/api/chats' && method === 'GET') {
    const chats = getChats(100);
    return sendJson(res, 200, { chats });
  }

  // --- API: Get Messages for a Chat ---
  const chatMessagesMatch = pathname.match(/^\/api\/chats\/([^/]+)\/messages$/);
  if (chatMessagesMatch && method === 'GET') {
    const chatId = chatMessagesMatch[1];
    const before = urlObj.searchParams.get('before') ? parseInt(urlObj.searchParams.get('before'), 10) : null;
    const limit = urlObj.searchParams.get('limit') ? parseInt(urlObj.searchParams.get('limit'), 10) : 60;
    const messages = getMessages(chatId, limit, before);
    return sendJson(res, 200, { chatId, messages });
  }

  // --- API: Send Message ---
  if (pathname === '/api/messages/send' && method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { chatId, guid, recipient, text, service } = body;

      if (!text || !text.trim()) {
        return sendJson(res, 400, { error: 'Message text cannot be empty' });
      }

      if (getIsDemoMode()) {
        // Simulate immediate message in demo mode
        const newMsgId = ++demoMsgIdCounter;
        const outMsg = {
          id: newMsgId,
          guid: `demo-msg-${newMsgId}`,
          chat_id: chatId || 101,
          text: text.trim(),
          date: Date.now(),
          is_from_me: true,
          sender: 'me',
          service: service || 'iMessage',
          reactions: []
        };

        if (chatId && mockMessages[chatId]) {
          mockMessages[chatId].push(outMsg);
        }

        // Broadcast to all connected clients
        broadcastSSE('new_messages', [outMsg]);

        // Simulate an automated friendly reply 2 seconds later in demo mode
        setTimeout(() => {
          const replyId = ++demoMsgIdCounter;
          const replies = [
            "Got your message! iPort relay is working great.",
            "Awesome, looks crystal clear on my end! 🔥",
            "Sounds like a plan!",
            "Got it! Responding via iMessage relay.",
            "Nice! iPort makes texting from any device so smooth."
          ];
          const replyText = replies[Math.floor(Math.random() * replies.length)];
          const inMsg = {
            id: replyId,
            guid: `demo-msg-${replyId}`,
            chat_id: chatId || 101,
            text: replyText,
            date: Date.now(),
            is_from_me: false,
            sender: '+14155552671',
            service: 'iMessage',
            reactions: []
          };
          if (chatId && mockMessages[chatId]) {
            mockMessages[chatId].push(inMsg);
          }
          broadcastSSE('new_messages', [inMsg]);
        }, 1500);

        return sendJson(res, 200, { success: true, message: outMsg, demo: true });
      }

      // Live mode AppleScript execution
      const sendResult = await sendMessage({ guid, recipient, text, service });
      return sendJson(res, 200, { success: true, result: sendResult });
    } catch (err) {
      console.error('[Sender] Send error:', err);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // --- API: Stream Attachment File ---
  const attachmentMatch = pathname.match(/^\/api\/attachments\/(\d+)$/);
  if (attachmentMatch && method === 'GET') {
    const attId = parseInt(attachmentMatch[1], 10);
    const info = getAttachmentInfo(attId);

    if (!info) {
      return sendJson(res, 404, { error: 'Attachment not found' });
    }

    if (getIsDemoMode() || !info.filename) {
      // Return placeholder SVG
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      return res.end(`
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
          <rect width="300" height="200" fill="#2c2c2e" rx="12"/>
          <text x="150" y="95" fill="#8e8e93" font-family="-apple-system, sans-serif" font-size="14" text-anchor="middle">Attachment Preview</text>
          <text x="150" y="125" fill="#007aff" font-family="-apple-system, sans-serif" font-size="12" text-anchor="middle">${info.transfer_name || 'Demo File'}</text>
        </svg>
      `);
    }

    // Resolve ~/ paths
    let filePath = info.filename;
    if (filePath.startsWith('~')) {
      filePath = path.join(os.homedir(), filePath.slice(1));
    }

    try {
      if (!fs.existsSync(filePath)) {
        return sendJson(res, 404, { error: 'Attachment file does not exist on disk' });
      }

      const stat = fs.statSync(filePath);
      const mime = info.mime_type || MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': stat.size,
        'Cache-Control': 'public, max-age=86400'
      });

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      return;
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // --- API: Realtime SSE Stream ---
  if (pathname === '/api/events' && method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write(`: connected\n\n`);
    sseClients.add(res);

    // Keepalive ping every 15 seconds
    const pingTimer = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch {
        clearInterval(pingTimer);
        sseClients.delete(res);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(pingTimer);
      sseClients.delete(res);
    });
    return;
  }

  // --- Serve Static Frontend Files ---
  let safePath = pathname === '/' ? '/index.html' : pathname;
  safePath = path.normalize(safePath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    const stream = fs.createReadStream(filePath);
    return stream.pipe(res);
  }

  // Fallback for SPA routing to index.html
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const stream = fs.createReadStream(indexPath);
    return stream.pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Start Server & Print Network Details
export function startServer() {
  initDatabase();

  server.listen(config.port, config.host, () => {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          addresses.push(net.address);
        }
      }
    }

    console.log('\n======================================================');
    console.log('              💬 iPort - iMessage Web Relay             ');
    console.log('======================================================');
    console.log(`  Local URL:    http://localhost:${config.port}`);
    for (const ip of addresses) {
      console.log(`  Network URL:  http://${ip}:${config.port}  (Open on any phone/PC)`);
    }
    if (config.pin) {
      console.log(`  Security:     PIN protected (set via IPORT_PIN)`);
    } else {
      console.log(`  Security:     No PIN set. (Set IPORT_PIN in .env to protect)`);
    }
    console.log('======================================================\n');
  });

  return server;
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
