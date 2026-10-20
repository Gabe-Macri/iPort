# iPort

A **minimal, high-performance iMessage relay and API** that lets you access, view, and send iMessages and SMS from any non-Apple device (Android, Linux, Windows, web, or custom scripts), relayed directly through your Mac.

Designed for professionals: high information density, sleek monospace accents, keyboard-driven navigation, zero bubbly fluff, and first-class headless API deployment.

---

## Deployment Options

iPort supports two distinct deployment modes depending on your workflow:

### Option 1: Strict Headless API Server (API Only)
Runs a pure JSON REST API and real-time Server-Sent Events (SSE) stream without compiling or serving any frontend assets. Ideal for headless Macs, CLI integrations, Raycast extensions, Home Assistant, custom bots, or third-party web apps.

```bash
./start.sh api
# or
npm run start:api
# or directly
node server/index.js --api
```

- **Root (`/`):** Returns the live API schema, version, health status, and available endpoints.
- **CORS:** Enabled by default for all origins.
- **Footprint:** Instant boot in `< 15ms`, negligible memory consumption.

### Option 2: Full-Stack Deployment (Web Client + API Simultaneously)
Deploys both the sleek, professional React web client AND the full REST/SSE API together on a single unified port (default `3000`).

```bash
./start.sh
# or
npm start
# or explicitly
./start.sh full
```

- Serves the compiled production frontend with Gzip compression and immutable caching headers.
- Handles SPA routing seamlessly.
- Exposes all `/api/*` endpoints and `/api/events` SSE stream on the exact same port.

### Option 3: Development Mode (Backend API + Vite Live HMR)
Concurrently runs the backend API on port 3000 and the Vite development server with Hot Module Replacement (HMR) on port 5173.

```bash
./start.sh dev
# or
npm run dev
```

---

## REST & SSE API Reference

When running in either **Headless API** or **Full-Stack** mode, the following endpoints are available:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API schema & service health (in API mode) or Web App (in Full-Stack mode) |
| `GET` | `/api/status` | System diagnostics, Full Disk Access check, AppleScript status, and relay state |
| `GET` | `/api/chats` | List recent conversations with metadata, unread counts, and pinned flags |
| `POST` | `/api/chats/:id/pin` | Toggle pinned state for a conversation (`{ success: true, pinnedList: [...] }`) |
| `GET` | `/api/chats/:id/messages` | Paginated message history (`?limit=60&before=<timestamp>`) |
| `POST` | `/api/messages/send` | Send an outbound message (`{ recipient, text, service: "iMessage" \| "SMS" }`) |
| `GET` | `/api/attachments/:id` | Stream attachment media file with appropriate MIME type |
| `GET` | `/api/events` | Real-time Server-Sent Events stream (`new_messages`, `message_receipt`, `pinned_update`) |
| `POST` | `/api/auth` | Authenticate with PIN passcode if `IPORT_PIN` is configured |

### Example API Requests

#### Send an iMessage via cURL:
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{"recipient": "+14155552671", "text": "Hello from iPort API!", "service": "iMessage"}'
```

#### Listen to Real-Time Messages (SSE):
```bash
curl -N http://localhost:3000/api/events
```

---

## TypeScript API Helpers & SDK

iPort includes a comprehensive, strongly-typed TypeScript SDK (`sdk/`) that works seamlessly in both Node.js (scripts, background daemons, Raycast extensions, bots) and modern browser environments.

### 1. Initialize Client

```typescript
import { createIPortClient } from './sdk';

const client = createIPortClient({
  baseUrl: 'http://localhost:3000', // Optional: defaults to http://localhost:3000 or current origin
  pin: '1234'                       // Optional: pass PIN if IPORT_PIN is configured
});
```

### 2. Send an iMessage or SMS

```typescript
// Quick text dispatch
await client.sendText('+14155552671', 'Hey from TypeScript!', 'iMessage');

// Full options
await client.sendMessage({
  recipient: 'user@icloud.com',
  text: 'Quarterly review attached.',
  service: 'iMessage'
});
```

### 3. Query Chats and Messages

```typescript
// Fetch conversations with pinned flags and unread counts
const { chats, pinned } = await client.getChats();

// Fetch paginated messages for a conversation
const { messages } = await client.getMessages(chats[0].chat_id, {
  limit: 50,
  before: Date.now()
});
```

### 4. Real-Time Event Subscription (SSE)

Subscribe to incoming messages, read receipts, and pin updates with full TypeScript types:

```typescript
const unsubscribe = client.subscribe({
  onOpen: () => console.log('Connected to iMessage relay'),
  onNewMessages: (messages) => {
    for (const msg of messages) {
      console.log(`[${msg.service}] ${msg.sender}: ${msg.text}`);
    }
  },
  onReceipt: (receipt) => {
    console.log(`Message #${receipt.id} marked as ${receipt.status}`);
  },
  onPinnedUpdate: ({ pinnedList }) => {
    console.log('Pinned chats updated:', pinnedList);
  },
  onError: (err) => console.error('Relay error:', err)
});

// Call when done
// unsubscribe();
```

### 5. Running the Included Examples

Ready-to-run TypeScript examples are provided in `examples/`:

```bash
# Send test message
npx tsx examples/send-message.ts

# Stream live messages in your terminal
npx tsx examples/listen-stream.ts

# Query conversations and diagnostics
npx tsx examples/fetch-chats.ts
```

---

## macOS Host Permissions (Full Disk Access)

macOS protects your `~/Library/Messages/chat.db` database with Transparency, Consent, and Control (TCC). To let iPort read live conversations, grant Full Disk Access to your terminal or process:

1. Open **System Settings** on your Mac.
2. Navigate to **Privacy & Security** → **Full Disk Access**.
3. Toggle the switch **ON** for your terminal app (e.g., **Terminal**, **iTerm**, **VS Code**, or **node**).
4. Restart `./start.sh`.

> **Demo Fallback:** If Full Disk Access is not yet granted, iPort automatically boots into simulated demo mode so you can immediately inspect the UI and test API interactions.

---

## Remote Access (Access Outside Home Wi-Fi)

### Option A: Tailscale (Recommended & Most Secure)
1. Install [Tailscale](https://tailscale.com) on your Mac and on your remote phone / laptop.
2. Connect both to your private tailnet.
3. Access `http://<your-mac-tailscale-name>:3000` from any device worldwide with end-to-end WireGuard encryption.

### Option B: Cloudflare Tunnel
```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:3000
```
Open the generated `https://xxxx.trycloudflare.com` URL on any device.

---

## Deploying as a 24/7 Background Service on Mac

To run iPort continuously in the background on your Mac and start automatically on boot:

### Using PM2:
```bash
npm install -g pm2
pm2 start ./start.sh --name "iport" -- full
pm2 save
pm2 startup
```

### Using macOS `launchd`:
Create `~/Library/LaunchAgents/com.iport.relay.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.iport.relay</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/YOUR_USERNAME/iPort/start.sh</string>
        <string>full</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/iport.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/iport.stderr.log</string>
</dict>
</plist>
```
Load the service:
```bash
launchctl load ~/Library/LaunchAgents/com.iport.relay.plist
```

---

## Configuration (`.env`)

| Variable | Default | Description |
|---|---|---|
| `IPORT_MODE` | `full` | Server mode: `full` (Web + API) or `api` (Headless API only) |
| `IPORT_PORT` | `3000` | Port for the HTTP and SSE server |
| `IPORT_HOST` | `0.0.0.0` | IP binding (`0.0.0.0` listens on all network interfaces) |
| `IPORT_PIN` | `""` | Optional PIN passcode to lock the web interface and protect API endpoints |
| `IPORT_POLL_INTERVAL` | `500` | SQLite check interval in milliseconds for new messages |
| `IPORT_DEMO` | `false` | Set to `true` to force demo simulation mode |

---

## Architecture

```
iPort/
├── src/                  # Minimal, Professional React 19 Frontend
│   ├── main.jsx          # React DOM entry point
│   ├── App.jsx           # State orchestrator, optimistic UI, SSE sync
│   ├── index.css         # Minimal professional styling (no bubbly tails)
│   ├── components/
│   │   ├── Sidebar.jsx       # Sleek workspace header, search (⌘K), settings
│   │   ├── ChatList.jsx      # High-density conversation list with squircle avatars
│   │   ├── PinnedTray.jsx    # Compact pinned favorites chip tray
│   │   ├── ChatView.jsx      # Conversation thread header, scroller, input bar
│   │   ├── MessageList.jsx   # TanStack Virtual 60fps virtualization scroller
│   │   ├── MessageRow.jsx    # Compact message blocks, attachments, reactions
│   │   ├── MessageInput.jsx  # Structured composer with keyboard shortcuts (↵ to send)
│   │   ├── NewChatModal.jsx  # Fast message composer dialog
│   │   ├── SettingsModal.jsx # Live FDA permissions, network info, deployment switcher
│   │   ├── PinModal.jsx      # Monospace PIN authentication dialog
│   │   └── LightboxModal.jsx # Clean photo viewer
│   ├── hooks/
│   │   ├── useSSE.js         # Auto-reconnecting Server-Sent Events hook
│   │   └── useAudio.js       # Zero-asset Web Audio Apple synthesizer
│   └── lib/
│       ├── api.js            # Typed API client
│       └── utils.js          # Formatting and avatar helpers
├── dist/                 # Minified production build (auto-served in full mode)
├── server/               # Fast, minimal Node.js backend (< 15ms startup)
│   ├── index.js          # Unified HTTP + SSE server & static file host
│   ├── config.js         # Configuration loader, CLI flag parser, & env handler
│   ├── db.js             # SQLite engine (node:sqlite) for reading chat.db & WAL polling
│   ├── typedstream.js    # NSAttributedString typedstream binary decoder for rich text
│   ├── sender.js         # AppleScript (osascript) message dispatcher with argv safety
│   ├── diagnostics.js    # TCC / Full Disk Access permission auditor
│   ├── pinnedStorage.js  # Persistent JSON storage for pinned conversations
│   └── mockData.js       # Realistic human demo data fallback
├── vite.config.js        # Vite build & chunk splitting configuration
├── tailwind.config.js    # Tailwind configuration
└── start.sh              # Single-command starter supporting full, api, and dev modes
```
